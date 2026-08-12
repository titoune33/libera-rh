/**
 * Module Attrition — prédiction de risque de départ.
 *
 * Port TypeScript du service TalentPulse (RandomForest entraîné sur données
 * synthétiques) vers un score déterministe et explicable, fidèle à la formule
 * génératrice d'origine :
 *
 *   risque_brut = -0,45·perf - 0,30·eng - 0,40·sat
 *                 + 0,15·clip((exp-2,5)/10, 0, 1)
 *                 + 0,08·clip((10-exp)/10, 0, 1)
 *                 - 0,12·(salaire/100k - 1)
 *
 * La probabilité est normalisée sur les bornes théoriques de la formule
 * (≈ [-1,33 ; 0,097]) — équivalent déterministe du classifieur d'origine.
 * Voir packages/llm-gateway pour la passerelle LLM qui rédige les plans d'action.
 */

export interface ProfilEmploye {
  nom?: string;
  /** Score de performance 0-1 */
  performance?: number;
  /** Score d'engagement 0-1 */
  engagement?: number;
  /** Score de satisfaction 0-1 */
  satisfaction?: number;
  /** Années d'expérience */
  experienceAnnees?: number;
  /** Salaire annuel brut en € */
  salaire?: number;
}

export type NiveauRisque = "stable" | "faible" | "modere" | "eleve";

export interface ResultatAttrition {
  nom: string;
  probabilite: number; // 0-1
  confiance: number;   // 0-1
  niveau: NiveauRisque;
  recommandation: string;
  caracteristiques: {
    performance: number;
    engagement: number;
    satisfaction: number;
    experienceAnnees: number;
    salaire: number;
  };
}

export interface StatistiquesEquipe {
  effectif: number;
  aRisque: number;         // probabilite >= 0.7
  risqueMoyen: number;
  niveauGlobal: NiveauRisque;
}

export interface ResultatEquipe {
  resultats: ResultatAttrition[];
  statistiques: StatistiquesEquipe;
}

// Bornes théoriques de la formule génératrice (déterministe, sans bruit).
const BORNE_MIN = -1.33;
const BORNE_MAX = 0.0965;
const AMPLITUDE = BORNE_MAX - BORNE_MIN;

function clip(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function risqueBrut(p: Required<ProfilEmploye>): number {
  return (
    -0.45 * p.performance -
    0.3 * p.engagement -
    0.4 * p.satisfaction +
    0.15 * clip((p.experienceAnnees - 2.5) / 10, 0, 1) +
    0.08 * clip((10 - p.experienceAnnees) / 10, 0, 1) -
    0.12 * (p.salaire / 100_000 - 1)
  );
}

function normaliser(brut: number): number {
  return clip((brut - BORNE_MIN) / AMPLITUDE, 0, 1);
}

export function niveauPour(probabilite: number): NiveauRisque {
  if (probabilite >= 0.8) return "eleve";
  if (probabilite >= 0.6) return "modere";
  if (probabilite >= 0.4) return "faible";
  return "stable";
}

/** Recommandation portée du service TalentPulse (seuils 0,8 / 0,6 / 0,4). */
export function recommander(nom: string, probabilite: number): string {
  const pct = Math.round(probabilite * 100);
  if (probabilite >= 0.8) {
    return `${nom} présente un risque de départ de ${pct} %. Intervention immédiate recommandée : entretien individuel, revue de la rémunération et plan de développement personnalisé.`;
  }
  if (probabilite >= 0.6) {
    return `${nom} montre des signes de désengagement (${pct} %). Pensez à des programmes de reconnaissance et des discussions d'évolution de carrière.`;
  }
  if (probabilite >= 0.4) {
    return `${nom} est globalement satisfait (${pct} %). Maintenez des points réguliers et des opportunités de croissance.`;
  }
  return `${nom} est bien engagé dans son poste (${pct} %). Continuez les pratiques actuelles.`;
}

function normaliserProfil(p: ProfilEmploye): Required<ProfilEmploye> {
  return {
    nom: p.nom?.trim() || "Collaborateur",
    performance: clip(p.performance ?? 0.5, 0, 1),
    engagement: clip(p.engagement ?? 0.5, 0, 1),
    satisfaction: clip(p.satisfaction ?? 0.5, 0, 1),
    experienceAnnees: clip(p.experienceAnnees ?? 5, 0, 40),
    salaire: Math.max(0, p.salaire ?? 50_000),
  };
}

export function predireRisque(profil: ProfilEmploye): ResultatAttrition {
  const p = normaliserProfil(profil);
  const brut = risqueBrut(p);
  const probabilite = normaliser(brut);
  // Confiance : élevée si toutes les données sont renseignées, sinon ~0,6
  // (miroir du fallback heuristique du service Python d'origine).
  const complet =
    profil.performance != null &&
    profil.engagement != null &&
    profil.satisfaction != null &&
    profil.experienceAnnees != null &&
    profil.salaire != null;
  const confiance = complet ? 0.87 : 0.6;

  return {
    nom: p.nom,
    probabilite: Math.round(probabilite * 10_000) / 10_000,
    confiance,
    niveau: niveauPour(probabilite),
    recommandation: recommander(p.nom, probabilite),
    caracteristiques: {
      performance: p.performance,
      engagement: p.engagement,
      satisfaction: p.satisfaction,
      experienceAnnees: p.experienceAnnees,
      salaire: p.salaire,
    },
  };
}

export function predireEquipe(profils: ProfilEmploye[]): ResultatEquipe {
  const resultats = profils.map(predireRisque);
  const effectif = resultats.length;
  const aRisque = resultats.filter((r) => r.probabilite >= 0.7).length;
  const risqueMoyen =
    effectif === 0 ? 0 : resultats.reduce((s, r) => s + r.probabilite, 0) / effectif;
  return {
    resultats,
    statistiques: {
      effectif,
      aRisque,
      risqueMoyen: Math.round(risqueMoyen * 10_000) / 10_000,
      niveauGlobal: niveauPour(risqueMoyen),
    },
  };
}
