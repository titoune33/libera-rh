import type { VercelRequest, VercelResponse } from "@vercel/node";
import { utilisateurCourant } from "../_lib.js";

export default async function etat(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilisez GET." });
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  res.status(200).json({ connecte: Boolean(utilisateur), utilisateur });
}
