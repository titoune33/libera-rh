import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  COOKIE_SESSION,
  DUREE_SESSION_MS,
  creerSession,
  creerUtilisateur,
  effacerCookie,
  entetesAirtable,
  envoyerErreur,
  genererTokenReset,
  genererTokenVerification,
  hasherMotDePasse,
  lireCookie,
  poserCookie,
  reinitialiserMotDePasse,
  supprimerSession,
  trouverUtilisateur,
  utilisateurCourant,
  verifierMotDePasse,
  verifierTokenReset,
  verifierTokenVerification,
} from "./_lib.js";
import {
  baseUrl,
  connecterOuCreerSocial,
  finaliserOAuth,
  poserEtatOauth,
  redirectUri,
  verifierEtatOauth,
} from "./_oauth.js";
import {
  emailConfigure,
  envoyerEmailReset,
  envoyerEmailVerification,
} from "./_email.js";

export const config = { maxDuration: 20 };

// ---------------------------------------------------------------------------
// Routes d'authentification consolidées dans une seule fonction serverless
// (limite de 12 fonctions sur le plan Hobby). Les URLs publiques sont
// préservées par des rewrites dans vercel.json :
//   /api/auth/:route            → /api/auth?route=:route
//   /api/auth/:provider/callback → /api/auth?route=:provider-callback
// ---------------------------------------------------------------------------

async function connexion(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }

  const { email, motDePasse } = (req.body ?? {}) as { email?: string; motDePasse?: string };
  const emailNettoye = (email ?? "").trim().toLowerCase();
  const mdp = motDePasse ?? "";

  if (!emailNettoye || !mdp) {
    envoyerErreur(res, 400, "Email et mot de passe requis.");
    return;
  }

  const utilisateur = await trouverUtilisateur(emailNettoye);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Email ou mot de passe incorrect.");
    return;
  }

  // Relecture du hash stocké pour la vérification.
  const base = process.env.AIRTABLE_BASE_ID;
  const entetes = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" };
  const rep = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent("Utilisateurs")}/${utilisateur.id}`, { headers: entetes });
  if (!rep.ok) {
    envoyerErreur(res, 502, "Impossible de lire le compte. Réessayez.");
    return;
  }
  const data = (await rep.json()) as { fields?: { mot_de_passe?: string } };
  const stocke = data.fields?.mot_de_passe ?? "";
  if (!verifierMotDePasse(mdp, stocke)) {
    envoyerErreur(res, 401, "Email ou mot de passe incorrect.");
    return;
  }

  const token = await creerSession(emailNettoye);
  if (!token) {
    envoyerErreur(res, 502, "Session indisponible. Réessayez.");
    return;
  }
  poserCookie(res, token, DUREE_SESSION_MS);

  res.status(200).json({ ok: true, utilisateur: { nom: utilisateur.nom, email: emailNettoye } });
}

async function deconnexion(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilisez POST." });
    return;
  }
  const token = lireCookie(req, COOKIE_SESSION);
  if (token) {
    await supprimerSession(token);
  }
  effacerCookie(res);
  res.status(200).json({ ok: true });
}

async function etat(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilisez GET." });
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  res.status(200).json({ connecte: Boolean(utilisateur), utilisateur });
}

async function inscription(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }

  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
    envoyerErreur(res, 503, "Stockage non configuré (AIRTABLE_TOKEN / AIRTABLE_BASE_ID).");
    return;
  }

  const { nom, email, motDePasse } = (req.body ?? {}) as { nom?: string; email?: string; motDePasse?: string };

  const nomNettoye = (nom ?? "").trim();
  const emailNettoye = (email ?? "").trim().toLowerCase();
  const mdp = motDePasse ?? "";

  if (nomNettoye.length < 2) {
    envoyerErreur(res, 400, "Le nom doit contenir au moins 2 caractères.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)) {
    envoyerErreur(res, 400, "Adresse email invalide.");
    return;
  }
  if (mdp.length < 8) {
    envoyerErreur(res, 400, "Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  if (!entetesAirtable()) {
    envoyerErreur(res, 503, "Stockage Airtable indisponible.");
    return;
  }

  const existant = await trouverUtilisateur(emailNettoye);
  if (existant) {
    envoyerErreur(res, 409, "Un compte existe déjà avec cette adresse email. Connectez-vous.");
    return;
  }

  const cree = await creerUtilisateur(emailNettoye, nomNettoye, hasherMotDePasse(mdp));
  if (!cree) {
    envoyerErreur(res, 502, "Impossible de créer le compte. Réessayez dans un instant.");
    return;
  }

  // Envoie l'email de vérification (silencieux si non configuré).
  if (emailConfigure()) {
    const token = await genererTokenVerification(emailNettoye);
    if (token) {
      await envoyerEmailVerification(emailNettoye, token, nomNettoye);
    }
  }

  const token = await creerSession(emailNettoye);
  if (!token) {
    envoyerErreur(res, 502, "Compte créé mais session indisponible. Connectez-vous.");
    return;
  }
  poserCookie(res, token, DUREE_SESSION_MS);

  res.status(200).json({ ok: true, utilisateur: { nom: nomNettoye, email: emailNettoye } });
}

function social(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  });
}

function demarrerGithub(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    envoyerErreur(res, 503, "Connexion GitHub non configurée. Ajoutez GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET sur Vercel.", {
      code: "OAUTH_NON_CONFIGURE",
      aide: "Créez une OAuth App sur https://github.com/settings/developers avec Authorization callback URL " +
        `${redirectUri("github")}, puis renseignez GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET et BASE_URL=${baseUrl()}.`,
    });
    return;
  }
  const state = poserEtatOauth(res);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri("github"),
    scope: "read:user user:email",
    state,
  });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
}

async function callbackGithub(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const code = String(req.query.code ?? "");
  if (!clientId || !clientSecret) {
    finaliserOAuth(res, false);
    return;
  }
  if (!code || !verifierEtatOauth(req)) {
    finaliserOAuth(res, false);
    return;
  }

  try {
    const echange = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = (await echange.json().catch(() => null)) as ReponseGithub | null;
    if (!echange.ok || !data?.access_token) {
      finaliserOAuth(res, false);
      return;
    }
    const entetes = { Authorization: `Bearer ${data.access_token}`, Accept: "application/json" };

    const profilRep = await fetch("https://api.github.com/user", { headers: entetes });
    const profil = (await profilRep.json().catch(() => null)) as ProfilGithub | null;
    if (!profilRep.ok || !profil?.id) {
      finaliserOAuth(res, false);
      return;
    }

    // Email : on préfère l'email primaire vérifié, sinon le premier vérifié.
    let email = "";
    try {
      const emailsRep = await fetch("https://api.github.com/user/emails", { headers: entetes });
      const emails = (await emailsRep.json().catch(() => [])) as EmailGithub[];
      if (Array.isArray(emails)) {
        const verifies = emails.filter((e) => e.verified);
        const primaire = verifies.find((e) => e.primary) ?? verifies[0];
        email = primaire?.email ?? "";
      }
    } catch {
      email = "";
    }
    if (!email) email = `${profil.login ?? "github"}+${profil.id}@users.noreply.github.com`;

    const utilisateur = await connecterOuCreerSocial(res, email, profil.name ?? profil.login ?? email, "github", String(profil.id));
    finaliserOAuth(res, Boolean(utilisateur));
  } catch {
    finaliserOAuth(res, false);
  }
}

function demarrerGoogle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    envoyerErreur(res, 503, "Connexion Google non configurée. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sur Vercel.", {
      code: "OAUTH_NON_CONFIGURE",
      aide: "Créez un projet OAuth sur https://console.cloud.google.com/apis/credentials avec URI de redirection " +
        `${redirectUri("google")}, puis renseignez GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET et BASE_URL=${baseUrl()}.`,
    });
    return;
  }
  const state = poserEtatOauth(res);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function callbackGoogle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const code = String(req.query.code ?? "");
  if (!clientId || !clientSecret) {
    finaliserOAuth(res, false);
    return;
  }
  if (!code || !verifierEtatOauth(req)) {
    finaliserOAuth(res, false);
    return;
  }

  try {
    const echange = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri("google"),
      }),
    });
    const data = (await echange.json().catch(() => null)) as ReponseGoogle | null;
    if (!echange.ok || !data?.access_token) {
      finaliserOAuth(res, false);
      return;
    }
    const profilRep = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const profil = (await profilRep.json().catch(() => null)) as ProfilGoogle | null;
    if (!profilRep.ok || !profil?.sub || !profil?.email) {
      finaliserOAuth(res, false);
      return;
    }
    const utilisateur = await connecterOuCreerSocial(res, profil.email, profil.name ?? profil.email, "google", profil.sub);
    finaliserOAuth(res, Boolean(utilisateur));
  } catch {
    finaliserOAuth(res, false);
  }
}

interface ReponseGithub {
  access_token?: string;
  error?: string;
}
interface ProfilGithub {
  id?: number;
  login?: string;
  name?: string | null;
}
interface EmailGithub {
  email: string;
  primary: boolean;
  verified: boolean;
}
interface ReponseGoogle {
  access_token?: string;
  error?: string;
}
interface ProfilGoogle {
  sub?: string;
  email?: string;
  name?: string;
}

export default async function auth(req: VercelRequest, res: VercelResponse) {
  const route = String(req.query.route ?? "");
  switch (route) {
    case "connexion":
      return connexion(req, res);
    case "deconnexion":
      return deconnexion(req, res);
    case "etat":
      return etat(req, res);
    case "inscription":
      return inscription(req, res);
    case "social":
      return social(req, res);
    case "github":
      return demarrerGithub(req, res);
    case "github-callback":
      return callbackGithub(req, res);
    case "google":
      return demarrerGoogle(req, res);
    case "google-callback":
      return callbackGoogle(req, res);
    case "envoyer-verification":
      return envoyerVerification(req, res);
    case "verifier-email":
      return verifierEmail(req, res);
    case "envoyer-reset":
      return envoyerReset(req, res);
    case "reinitialiser-mdp":
      return reinitialiserMdp(req, res);
    default:
      envoyerErreur(res, 404, "Route d'authentification inconnue.");
  }
}

// ---------------------------------------------------------------------------
// Email verification & password reset routes
// ---------------------------------------------------------------------------

async function envoyerVerification(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }
  if (!emailConfigure()) {
    envoyerErreur(res, 503, "L'envoi d'email n'est pas configuré. Ajoutez RESEND_API_KEY et EMAIL_FROM sur Vercel.", {
      code: "EMAIL_NON_CONFIGURE",
    });
    return;
  }
  const token = await genererTokenVerification(utilisateur.email);
  if (!token) {
    envoyerErreur(res, 502, "Impossible de générer le token de vérification.");
    return;
  }
  const envoye = await envoyerEmailVerification(utilisateur.email, token, utilisateur.nom);
  if (!envoye) {
    envoyerErreur(res, 502, "Impossible d'envoyer l'email de vérification.");
    return;
  }
  res.status(200).json({ ok: true });
}

async function verifierEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const token = String(req.query.token ?? "");
  if (!token) {
    envoyerErreur(res, 400, "Token requis.");
    return;
  }
  const email = await verifierTokenVerification(token);
  if (!email) {
    // Affiche une page d'erreur simple plutôt qu'un JSON.
    res.status(200).send(htmlReponse("Échec de la vérification", "Le lien de vérification est invalide ou a déjà été utilisé. Connectez-vous à votre compte."));
    return;
  }
  res.status(200).send(htmlReponse("Email vérifié ✅", `Votre adresse ${email} est vérifiée. Vous pouvez fermer cette page et retourner sur l'application.`));
}

async function envoyerReset(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const { email } = (req.body ?? {}) as { email?: string };
  const emailNettoye = (email ?? "").trim().toLowerCase();
  if (!emailNettoye) {
    envoyerErreur(res, 400, "Email requis.");
    return;
  }
  if (!emailConfigure()) {
    envoyerErreur(res, 503, "L'envoi d'email n'est pas configuré. Ajoutez RESEND_API_KEY et EMAIL_FROM sur Vercel.", {
      code: "EMAIL_NON_CONFIGURE",
    });
    return;
  }
  // On ne révèle pas si le compte existe ou pas (sécurité).
  const token = await genererTokenReset(emailNettoye);
  if (token) {
    await envoyerEmailReset(emailNettoye, token);
  }
  res.status(200).json({ ok: true });
}

async function reinitialiserMdp(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const { token, motDePasse } = (req.body ?? {}) as { token?: string; motDePasse?: string };
  if (!token || !motDePasse || motDePasse.length < 8) {
    envoyerErreur(res, 400, "Token valide et mot de passe (8 caractères minimum) requis.");
    return;
  }
  const email = await verifierTokenReset(token);
  if (!email) {
    envoyerErreur(res, 400, "Le lien de réinitialisation est invalide ou a expiré (1 heure). Demandez-en un nouveau.", {
      code: "TOKEN_INVALIDE_EXPIRE",
    });
    return;
  }
  const ok = await reinitialiserMotDePasse(email, motDePasse);
  if (!ok) {
    envoyerErreur(res, 502, "Impossible de réinitialiser le mot de passe. Réessayez.");
    return;
  }
  res.status(200).json({ ok: true });
}

function htmlReponse(titre: string, message: string): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre} — Équitia</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b;}.c{text-align:center;padding:32px;max-width:440px;}h1{font-size:24px;margin-bottom:8px;}p{color:#64748b;line-height:1.5;}.btn{display:inline-block;margin-top:20px;padding:10px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;}</style></head>
<body><div class="c"><h1>${titre}</h1><p>${message}</p><a class="btn" href="${baseUrl()}">Retour à Équitia</a></div></body>
</html>`;
}
