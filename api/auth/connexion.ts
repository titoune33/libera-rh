import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DUREE_SESSION_MS,
  creerSession,
  envoyerErreur,
  poserCookie,
  trouverUtilisateur,
  verifierMotDePasse,
} from "../_lib.js";

export const config = { maxDuration: 20 };

export default async function connexion(req: VercelRequest, res: VercelResponse) {
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
