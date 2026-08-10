import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DUREE_SESSION_MS,
  creerSession,
  creerUtilisateur,
  entetesAirtable,
  envoyerErreur,
  hasherMotDePasse,
  poserCookie,
  trouverUtilisateur,
} from "../_lib.js";

export const config = { maxDuration: 20 };

export default async function inscription(req: VercelRequest, res: VercelResponse) {
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

  const token = await creerSession(emailNettoye);
  if (!token) {
    envoyerErreur(res, 502, "Compte créé mais session indisponible. Connectez-vous.");
    return;
  }
  poserCookie(res, token, DUREE_SESSION_MS);

  res.status(200).json({ ok: true, utilisateur: { nom: nomNettoye, email: emailNettoye } });
}
