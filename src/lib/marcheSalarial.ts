import { formatEuros } from "./engine";

/**
 * Benchmark salarial de marché (références indicatives France, hors primes
 * exceptionnelles). Ordres de grandeur issus de synthèses publiques de salaires
 * (enquêtes rémunération, données Indeed/Glassdoor agrégées) — à affiner avec
 * une source payante (Ladders, Mercer, Hays) pour un usage production.
 */

export type RegionMarche = "province" | "idf";

export interface ReferencePoste {
  /** Médiane annuelle brute en province (€). */
  p50: number;
  /** 25e percentile (€). */
  p25: number;
  /** 75e percentile (€). */
  p75: number;
  /** Libellé générique affiché. */
  libelle: string;
}

/** Normalisation des intitulés de poste → clé du référentiel. */
const POSTES_MARCHE: Record<string, ReferencePoste> = {
  "directeur rd": { p50: 87000, p25: 74000, p75: 102000, libelle: "Directeur·rice R&D" },
  "directrice rd": { p50: 87000, p25: 74000, p75: 102000, libelle: "Directeur·rice R&D" },
  "chef de projet industriel": { p50: 62000, p25: 52000, p75: 72000, libelle: "Chef·fe de projet industriel" },
  "cheffe de projet industriel": { p50: 62000, p25: 52000, p75: 72000, libelle: "Chef·fe de projet industriel" },
  "responsable qualite": { p50: 52000, p25: 44000, p75: 61000, libelle: "Responsable qualité" },
  "ingenieur methodes": { p50: 46500, p25: 39000, p75: 55000, libelle: "Ingénieur·e méthodes" },
  "ingenieure methodes": { p50: 46500, p25: 39000, p75: 55000, libelle: "Ingénieur·e méthodes" },
  "controleur de gestion": { p50: 45500, p25: 38000, p75: 53500, libelle: "Contrôleur·se de gestion" },
  "controleuse de gestion": { p50: 45500, p25: 38000, p75: 53500, libelle: "Contrôleur·se de gestion" },
  "charge rh": { p50: 39500, p25: 33000, p75: 47000, libelle: "Chargé·e RH" },
  "chargee rh": { p50: 39500, p25: 33000, p75: 47000, libelle: "Chargé·e RH" },
  "responsable d atelier": { p50: 35500, p25: 30000, p75: 41500, libelle: "Responsable d'atelier" },
  "animateur qualite": { p50: 33000, p25: 28000, p75: 38500, libelle: "Animateur·rice qualité" },
  "animatrice qualite": { p50: 33000, p25: 28000, p75: 38500, libelle: "Animateur·rice qualité" },
  "responsable planning": { p50: 29500, p25: 25000, p75: 34500, libelle: "Responsable planning" },
  "technicien qualite": { p50: 29000, p25: 25000, p75: 33500, libelle: "Technicien·ne qualité" },
  "technicienne qualite": { p50: 29000, p25: 25000, p75: 33500, libelle: "Technicien·ne qualité" },
  "technicien maintenance": { p50: 28500, p25: 24500, p75: 33000, libelle: "Technicien·ne maintenance" },
  "technicienne maintenance": { p50: 28500, p25: 24500, p75: 33000, libelle: "Technicien·ne maintenance" },
  "technicien laboratoire": { p50: 26800, p25: 23000, p75: 31000, libelle: "Technicien·ne laboratoire" },
  "technicienne laboratoire": { p50: 26800, p25: 23000, p75: 31000, libelle: "Technicien·ne laboratoire" },
  "assistant administratif": { p50: 25500, p25: 22000, p75: 29500, libelle: "Assistant·e administratif·ve" },
  "assistante administrative": { p50: 25500, p25: 22000, p75: 29500, libelle: "Assistant·e administratif·ve" },
  secretaire: { p50: 24200, p25: 21000, p75: 27800, libelle: "Secrétaire" },
  "agent d accueil": { p50: 22800, p25: 19800, p75: 26200, libelle: "Agent·e d'accueil" },
  "operateur de production": { p50: 25000, p25: 22200, p75: 28500, libelle: "Opérateur·rice de production" },
  "operatrice de production": { p50: 25000, p25: 22200, p75: 28500, libelle: "Opérateur·rice de production" },
  "operateur conditionnement": { p50: 24000, p25: 21300, p75: 27200, libelle: "Opérateur·rice conditionnement" },
  "operatrice conditionnement": { p50: 24000, p25: 21300, p75: 27200, libelle: "Opérateur·rice conditionnement" },
  cariste: { p50: 24700, p25: 22000, p75: 27900, libelle: "Cariste" },
};

export const REGIONS: { code: RegionMarche; libelle: string; coefficient: number }[] = [
  { code: "province", libelle: "France (hors Île-de-France)", coefficient: 1 },
  { code: "idf", libelle: "Île-de-France", coefficient: 1.18 },
];

/** Coefficient d'ancienneté : junior < 3 ans, confirmé 3-7 ans, senior ≥ 8 ans. */
export function coefficientAnciennete(ancienneteMoyenne: number): number {
  if (ancienneteMoyenne < 3) return 0.88;
  if (ancienneteMoyenne >= 8) return 1.12;
  return 1;
}

/** Normalise un intitulé de poste (minuscules, accents retirés, singulier). */
function normaliserPoste(poste: string): string | null {
  const cle = poste
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/[&.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (POSTES_MARCHE[cle]) return cle;
  // Retirer le déterminant éventuel (« la », « le ») en tête.
  const sansArticle = cle.replace(/^(la|le|les|un|une) /, "");
  return POSTES_MARCHE[sansArticle] ? sansArticle : null;
}

export interface FourchetteMarche {
  poste: string;
  libelle: string;
  couvert: boolean;
  p25: number;
  p50: number;
  p75: number;
  region: RegionMarche;
  ancienneteMoyenne: number;
  note: string;
}

export function referentielMarche(
  poste: string,
  region: RegionMarche,
  ancienneteMoyenne: number,
): FourchetteMarche | null {
  const cle = normaliserPoste(poste);
  if (!cle) return null;
  const ref = POSTES_MARCHE[cle];
  const coef = REGIONS.find((r) => r.code === region)?.coefficient ?? 1;
  const anc = coefficientAnciennete(ancienneteMoyenne);
  const applique = (v: number) => Math.round((v * coef * anc) / 100) * 100;
  return {
    poste,
    libelle: ref.libelle,
    couvert: true,
    p25: applique(ref.p25),
    p50: applique(ref.p50),
    p75: applique(ref.p75),
    region,
    ancienneteMoyenne,
    note: `Référence indicative ${REGIONS.find((r) => r.code === region)?.libelle} ajustée de l'ancienneté moyenne du poste (${ancienneteMoyenne.toFixed(0)} ans).`,
  };
}

/** Position de la médiane entreprise par rapport à la fourchette de marché (0..1, ~percentile). */
export function positionSurMarche(medianeEntreprise: number, marche: FourchetteMarche): number {
  if (medianeEntreprise <= marche.p25) return 0.1;
  if (medianeEntreprise >= marche.p75) return 0.9;
  return 0.1 + ((medianeEntreprise - marche.p25) / Math.max(1, marche.p75 - marche.p25)) * 0.8;
}

export function libellePosition(position: number): string {
  if (position < 0.35) return "Sous le marché";
  if (position <= 0.65) return "Aligné au marché";
  return "Au-dessus du marché";
}

export function formatMarche(v: number): string {
  return formatEuros(v);
}
