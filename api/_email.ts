import { Resend } from "resend";
import { baseUrl } from "./_oauth.js";

// ---------------------------------------------------------------------------
// Envoi d'emails transactionnels via Resend (réservé à l'API).
// Variables d'environnement requises :
//   RESEND_API_KEY   clé API Resend (re_...)
//   EMAIL_FROM       adresse d'expédition (ex: "Équitia <noreply@votredomaine.fr>")
// ---------------------------------------------------------------------------

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Équitia <noreply@equitia.fr>";

export function emailConfigure(): boolean {
  return Boolean(resend && process.env.EMAIL_FROM);
}

/** Envoie un email de vérification d'adresse. */
export async function envoyerEmailVerification(email: string, token: string, nom: string): Promise<boolean> {
  if (!resend) return false;
  const lien = `${baseUrl()}/api/auth/verifier-email?token=${encodeURIComponent(token)}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Vérifiez votre adresse email — Équitia",
      html: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Vérification</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:22px;">Bonjour ${nom} 👋</h1>
  <p>Merci d'avoir créé votre compte Équitia. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${lien}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Vérifier mon email
    </a>
  </p>
  <p style="color:#64748b;font-size:13px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
  <p style="color:#94a3b8;font-size:12px;">Équitia — Transparence salariale · <a href="${baseUrl()}">${baseUrl()}</a></p>
</body>
</html>`,
    });
    return true;
  } catch {
    return false;
  }
}

/** Envoie un email de réinitialisation de mot de passe. */
export async function envoyerEmailReset(email: string, token: string): Promise<boolean> {
  if (!resend) return false;
  const lien = `${baseUrl()}/app?reset=${encodeURIComponent(token)}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Réinitialisation de votre mot de passe — Équitia",
      html: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Réinitialisation</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:22px;">Réinitialisation de mot de passe</h1>
  <p>Vous avez demandé la réinitialisation de votre mot de passe Équitia. Cliquez sur le lien ci-dessous pour en définir un nouveau :</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${lien}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
      Réinitialiser mon mot de passe
    </a>
  </p>
  <p style="color:#64748b;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
  <p style="color:#94a3b8;font-size:12px;">Équitia — Transparence salariale · <a href="${baseUrl()}">${baseUrl()}</a></p>
</body>
</html>`,
    });
    return true;
  } catch {
    return false;
  }
}