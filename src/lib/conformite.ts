import type { ResultatAnalyse } from "./types";
import { formatEuros, formatPct } from "./engine";

export interface Obligation {
  id: string;
  titre: string;
  source: string;
  echeance: string;
  statut: "a_faire" | "en_cours" | "faite" | "attention";
  description: string;
}

/** Base légale : directive UE 2023/970 + droit français. */
export const BASE_LEGALE = [
  "Directive (UE) 2023/970 du Parlement européen et du Conseil du 10 mai 2023, entrée en vigueur le 7 juin 2026",
  "Directive 2006/54/CE (égalité de traitement entre femmes et hommes)",
  "Code du travail, art. L. 1142-1 et suivants (égalité professionnelle)",
  "Code du travail, art. L. 1142-8 et D. 1142-2 et suivants (index d'égalité professionnelle)",
];

export const OBLIGATIONS: Obligation[] = [
  {
    id: "index",
    titre: "Index d'égalité professionnelle (score /100 publié)",
    source: "Code du travail, L. 1142-8",
    echeance: "1er mars de chaque année",
    statut: "attention",
    description:
      "Le score de l'index doit être calculé, publié sur le site de l'entreprise et transmis à l'inspection du travail. Un score < 75 impose un plan de rattrapage sous 3 ans.",
  },
  {
    id: "fourchettes",
    titre: "Fourchettes de rémunération dans les offres d'emploi",
    source: "Directive (UE) 2023/970, art. 5",
    echeance: "7 juin 2026",
    statut: "a_faire",
    description:
      "Les employeurs doivent indiquer dans chaque offre d'emploi et à chaque étape du processus la fourchette de salaire initial ou sa base. Obligation d'information avant l'entretien.",
  },
  {
    id: "droit-info",
    titre: "Droit d'information des candidats et salariés",
    source: "Directive (UE) 2023/970, art. 7",
    echeance: "7 juin 2026",
    statut: "a_faire",
    description:
      "Les candidats et salariés ont le droit de recevoir des informations sur la rémunération moyenne par catégorie, ventilée par sexe, et sur les critères d'évolution de carrière.",
  },
  {
    id: "rapport",
    titre: "Rapport annuel sur l'écart de rémunération",
    source: "Directive (UE) 2023/970, art. 9",
    echeance: "Annuel — premier rapport au plus tard 7 juin 2027",
    statut: "a_faire",
    description:
      "Entreprises de 100 salariés et plus : rapport annuel avec l'écart moyen et médian de rémunération, ventilé par catégorie, et les mesures correctrices le cas échéant.",
  },
  {
    id: "negociation",
    titre: "Négociation annuelle sur l'égalité professionnelle",
    source: "Code du travail, L. 2242-1",
    echeance: "Chaque année",
    statut: "en_cours",
    description:
      "Obligation de négocier sur la rémunération, les écarts femmes-hommes, l'articulation vie professionnelle / vie personnelle et la prévention des discriminations.",
  },
  {
    id: "aie",
    titre: "Transparence et prévention des biais des outils d'IA",
    source: "Règlement (UE) 2024/1689 (AI Act)",
    echeance: "6 août 2026 — obligations applicables",
    statut: "attention",
    description:
      "Les outils d'IA utilisés en recrutement et en gestion des ressources humaines relèvent des systèmes à haut risque : audit des biais, documentation, contrôle humain.",
  },
];

export const SANCTIONS = [
  {
    titre: "Index non publié ou score < 75 sans plan",
    detail: "Sanction financière jusqu'à 1 % de la masse salariale (taux applicable : 0,15 % à 1 % selon les cas).",
  },
  {
    titre: "Directive transparence salariale",
    detail: "Obligations déclaratives ; sanctions nationales de transposition (amendes administratives) ; indemnisation des victimes de discrimination salariale.",
  },
  {
    titre: "Discrimination salariale avérée",
    detail: "Rétablissement de la situation, rappel de salaire sur 3 ans minimum, dommages-intérêts ; risque pénal en cas de discrimination (art. 225-1 et s. code pénal).",
  },
];

export interface MessageConformite {
  niveau: "ok" | "attention" | "critique";
  titre: string;
  detail: string;
}

export function evaluerConformite(resultat: ResultatAnalyse): MessageConformite {
  const ecart = Math.abs(resultat.global.ecartMoyenPct);
  if (resultat.pointsEcart >= 75 && ecart <= 5) {
    return {
      niveau: "ok",
      titre: "Situation globalement conforme",
      detail: `Score d'égalité de ${resultat.pointsEcart}/100. L'écart moyen est de ${formatPct(resultat.global.ecartMoyenPct)}, sous le seuil de vigilance de 5 %. Restez attentif aux catégories à effectif déséquilibré.`,
    };
  }
  if (resultat.pointsEcart >= 75 || ecart <= 8) {
    return {
      niveau: "attention",
      titre: "Vigilance recommandée",
      detail: `Score de ${resultat.pointsEcart}/100. Certaines catégories ou postes présentent des écarts supérieurs à 5 % : analysez les postes comparables et documentez les justifications objectives (ancienneté, performance, pénurie).`,
    };
  }
  return {
    niveau: "critique",
    titre: "Actions correctrices nécessaires",
    detail: `Score de ${resultat.pointsEcart}/100, sous le seuil réglementaire de 75. Écart moyen de ${formatPct(resultat.global.ecartMoyenPct)}. Un plan de rattrapage est requis : identifiez les postes concernés, chiffrez le budget de rattrapage et négociez un calendrier de correction sous 3 ans.`,
  };
}

export { formatEuros };
