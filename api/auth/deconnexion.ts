import type { VercelRequest, VercelResponse } from "@vercel/node";
import { effacerCookie, lireCookie, supprimerSession, COOKIE_SESSION } from "../_lib.js";

export default async function deconnexion(req: VercelRequest, res: VercelResponse) {
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
