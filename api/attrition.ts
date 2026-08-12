import type { VercelRequest, VercelResponse } from "@vercel/node";
import { utilisateurCourant } from "./_lib.js";
import { predireEquipe, predireRisque, type ProfilEmploye } from "../modules/attrition/src/index.js";

export const config = { maxDuration: 30 };

/**
 * Module Attrition (ex-TalentPulse / PeoplePulse) intégré à la plateforme Libera RH.
 * Prédit le risque de départ (0-1) pour un ou plusieurs employés, avec
 * recommandations. Le scoring est déterministe et explicable (cf. modules/attrition).
 */
export default async function attrition(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilisez POST." });
    return;
  }

  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    res.status(401).json({ erreur: "Authentification requise." });
    return;
  }

  const { employes, employe } = (req.body ?? {}) as {
    employes?: ProfilEmploye[];
    employe?: ProfilEmploye;
  };

  if (employe && typeof employe === "object") {
    const resultat = predireRisque(employe);
    res.status(200).json({ resultat, mode: "ml" });
    return;
  }

  if (!Array.isArray(employes) || employes.length === 0) {
    res.status(400).json({ erreur: "Le champ « employes » (tableau) est requis." });
    return;
  }

  const { resultats, statistiques } = predireEquipe(employes);
  res.status(200).json({ resultats, statistiques, mode: "ml" });
}
