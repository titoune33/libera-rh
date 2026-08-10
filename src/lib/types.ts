// Types métier du SaaS de conformité transparence salariale.
// Modélisé d'après la directive européenne 2023/970 et l'index
// d'égalité professionnelle français.

export type Genre = "F" | "H";

export type Categorie = "Cadres" | "Agents de maîtrise" | "Techniciens" | "Employés" | "Ouvriers";

export const CATEGORIES: Categorie[] = [
  "Cadres",
  "Agents de maîtrise",
  "Techniciens",
  "Employés",
  "Ouvriers",
];

export interface Employe {
  id: string;
  nom: string;
  genre: Genre;
  categorie: Categorie;
  /** Rémunération annuelle brute en équivalent temps plein (euros). */
  salaireAnnuel: number;
  /** Poste / emploi-type, pour l'analyse « à travail égal ». */
  poste: string;
  /** Ancienneté en années. */
  anciennete: number;
  /** Âge en années. */
  age: number;
  /** Écart-type ou indicatif de primes variables. */
  partVariable: number; // 0..1 (part du salaire variable)
  /** A bénéficié d'une augmentation individuelle sur l'exercice (index complet, indicateur 2). */
  augmentation?: boolean;
  /** A bénéficié d'une promotion sur l'exercice (index complet, indicateur 3). */
  promotion?: boolean;
  /** Est revenue de congé maternité sur l'exercice (index complet, indicateur 4). */
  congeMaternite?: boolean;
}

export interface DonneesSociete {
  nom: string;
  siret: string;
  effectif: number;
  exercice: string; // ex: "2025"
  codeNAF?: string;
}

export interface JeuDeDonnees {
  societe: DonneesSociete;
  employes: Employe[];
}

export interface EcartParCategorie {
  categorie: Categorie;
  effectifF: number;
  effectifH: number;
  salaireMoyenF: number | null;
  salaireMoyenH: number | null;
  salaireMedianF: number | null;
  salaireMedianH: number | null;
  ecartMoyenPct: number | null; // % : (H - F) / H — positif = les femmes gagnent moins
  ecartMedianPct: number | null;
  nbPostesComparables: number;
}

export interface ResultatAnalyse {
  dateAnalyse: string;
  global: {
    effectifF: number;
    effectifH: number;
    salaireMoyenF: number;
    salaireMoyenH: number;
    salaireMedianF: number;
    salaireMedianH: number;
    ecartMoyenPct: number; // (H - F) / H
    ecartMedianPct: number;
    masseSalariale: number;
  };
  parCategorie: EcartParCategorie[];
  /** Analyse « à travail égal » : écart moyen par poste occupé par les deux genres. */
  postesComparables: {
    poste: string;
    effectifF: number;
    effectifH: number;
    ecartMoyenPct: number | null;
  }[];
  pointsEcart: number; // score 0..100 (100 = parfait), style index français
  seuilAtteint: boolean; // écart moyen <= 5% sur les postes comparables
}

export interface RapportConforme {
  societe: DonneesSociete;
  exercice: string;
  dateEdition: string;
  baseLegale: string[];
  resultats: ResultatAnalyse;
  obligationsRapport: {
    fourchettesPubliees: boolean;
    droitInformation: boolean;
    rapportAnnuel: boolean;
  };
}
