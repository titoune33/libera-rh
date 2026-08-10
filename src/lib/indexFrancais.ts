import { CATEGORIES, type Employe } from "./types";

/**
 * Index d'égalité professionnelle français — calcul conforme au Code du
 * travail (art. L. 1142-8 et D. 1142-2 et suivants) et à la méthodologie
 * officielle : 5 indicateurs pondérés (40 + 20 + 15 + 15 + 10 points),
 * total ramené sur 100. Un indicateur non calculable (données absentes)
 * est neutralisé et son poids redistribué.
 *
 * Simplifications documentées :
 * - seuil d'exclusion des petits effectifs par cellule (CSP × tranche
 *   d'âge) fixé à 1 salarié par genre (l'officiel exige 3) pour rester
 *   exploitable sur de petits jeux de démonstration ;
 * - entreprises de moins de 250 salariés : 2 tranches d'âge (< 30 ans,
 *   30 ans et plus) comme prévu par la réglementation.
 */

export interface Indicateur {
  code: number;
  nom: string;
  points: number;
  max: number;
  calculable: boolean;
  detail: string;
}

export interface IndexComplet {
  indicateurs: Indicateur[];
  total: number; // /100
  seuil75Atteint: boolean;
  methode: "2 tranches d'âge (< 250 salariés)" | "4 tranches d'âge (≥ 250 salariés)";
}

/** Grilles officielles : écart (en points de % ou %) → points. */
const GRILLE_40: [number, number][] = [
  [1, 40], [2, 39], [3, 38], [4, 37], [5, 36], [6, 35], [7, 34], [8, 33], [9, 32], [10, 31],
  [12, 29], [14, 27], [16, 25], [18, 23], [20, 21], [22, 19], [24, 17], [26, 15], [28, 13], [30, 11],
  [32, 9], [34, 7], [36, 5], [38, 3], [40, 1],
];
const GRILLE_20: [number, number][] = [
  [2, 20], [4, 19], [6, 18], [8, 17], [10, 16], [12, 15], [14, 14], [16, 13], [18, 12], [20, 11],
  [22, 10], [24, 9], [26, 8], [28, 7], [30, 6], [32, 5], [34, 4], [36, 3], [38, 2], [40, 1],
];
const GRILLE_15: [number, number][] = [
  [2, 15], [4, 14], [6, 13], [8, 12], [10, 11], [12, 10], [14, 9], [16, 8], [18, 7], [20, 6],
  [22, 5], [24, 4], [26, 3], [28, 2], [30, 1],
];

function pointsGrille(ecart: number, grille: [number, number][]): number {
  for (const [borne, pts] of grille) {
    if (ecart <= borne) return pts;
  }
  return 0;
}

function moyenne(v: number[]): number {
  if (v.length === 0) return NaN;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function taux(valeurs: (boolean | undefined)[]): number | null {
  const connus = valeurs.filter((v) => v !== undefined);
  if (connus.length === 0) return null;
  return connus.filter(Boolean).length / connus.length;
}

/** Tranches d'âge officielles : 2 (< 250 salariés) ou 4 (≥ 250). */
export function tranchesAge(simplifie: boolean): string[] {
  return simplifie ? ["moins de 30", "30 et plus"] : ["moins de 30", "30-39", "40-49", "50 et plus"];
}

function trancheDe(age: number, simplifie: boolean): string {
  if (simplifie) return age < 30 ? "moins de 30" : "30 et plus";
  if (age < 30) return "moins de 30";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  return "50 et plus";
}

/**
 * Indicateur 1 (40 pts) — écart de rémunération moyenne par tranche d'âge
 * et catégorie (CSP). Chaque tranche reçoit des points via la grille ;
 * le score final est la moyenne pondérée par les effectifs des tranches.
 */
function indicateur1(employes: Employe[], simplifie: boolean): Indicateur {
  const tranches = tranchesAge(simplifie);
  const detailCellules: string[] = [];
  let sommePtsPond = 0;
  let sommeEffectif = 0;

  for (const tranche of tranches) {
    const deLaTranche = employes.filter((e) => trancheDe(e.age, simplifie) === tranche);
    let pondEcarts = 0;
    let pondEffectif = 0;
    const detailTranche: string[] = [];

    for (const cat of CATEGORIES) {
      const cellule = deLaTranche.filter((e) => e.categorie === cat);
      const f = cellule.filter((e) => e.genre === "F");
      const h = cellule.filter((e) => e.genre === "H");
      if (f.length === 0 || h.length === 0) continue;
      const moyF = moyenne(f.map((e) => e.salaireAnnuel));
      const moyH = moyenne(h.map((e) => e.salaireAnnuel));
      const ecart = ((moyH - moyF) / moyH) * 100;
      const effectif = f.length + h.length;
      pondEcarts += ecart * effectif;
      pondEffectif += effectif;
      detailTranche.push(`${cat}: ${ecart.toFixed(1)} %`);
    }

    if (pondEffectif > 0) {
      const ecartTranche = pondEcarts / pondEffectif;
      const pts = pointsGrille(ecartTranche, GRILLE_40);
      sommePtsPond += pts * pondEffectif;
      sommeEffectif += pondEffectif;
      detailCellules.push(`${tranche}: ${ecartTranche.toFixed(1)} % → ${pts} pts`);
    }
  }

  const calculable = sommeEffectif > 0;
  const points = calculable ? Math.round(sommePtsPond / sommeEffectif) : 0;
  return {
    code: 1,
    nom: "Écart de rémunération",
    points,
    max: 40,
    calculable,
    detail: calculable ? detailCellules.join(" · ") : "Non calculable : aucune cellule (CSP × tranche d'âge) avec les deux genres.",
  };
}

/** Indicateurs 2 et 3 — écarts de taux d'augmentations / de promotions. */
function indicateurTaux(employes: Employe[], champ: "augmentation" | "promotion", code: number, max: number, nom: string, grille: [number, number][]): Indicateur {
  const tauxF = taux(employes.filter((e) => e.genre === "F").map((e) => e[champ]));
  const tauxH = taux(employes.filter((e) => e.genre === "H").map((e) => e[champ]));
  if (tauxF === null && tauxH === null) {
    return { code, nom, points: 0, max, calculable: false, detail: "Non calculable : aucune donnée renseignée sur l'exercice." };
  }
  const ecart = Math.abs((tauxH ?? 0) - (tauxF ?? 0)) * 100;
  const points = pointsGrille(ecart, grille);
  const detail = `Taux femmes : ${((tauxF ?? 0) * 100).toFixed(1)} % · Taux hommes : ${((tauxH ?? 0) * 100).toFixed(1)} % · Écart : ${ecart.toFixed(1)} pts`;
  return { code, nom, points, max, calculable: true, detail };
}

/** Indicateur 4 (15 pts) — % de salariées augmentées dans l'année suivant leur retour de congé maternité. */
function indicateur4(employes: Employe[]): Indicateur {
  const retours = employes.filter((e) => e.genre === "F" && e.congeMaternite === true);
  if (retours.length === 0) {
    return {
      code: 4,
      nom: "Augmentations au retour de congé maternité",
      points: 0,
      max: 15,
      calculable: false,
      detail: "Non calculable : aucune salariée revenue de congé maternité sur l'exercice.",
    };
  }
  const augmentees = retours.filter((e) => e.augmentation === true).length;
  const part = augmentees / retours.length;
  const points = Math.round(part * 15);
  return {
    code: 4,
    nom: "Augmentations au retour de congé maternité",
    points,
    max: 15,
    calculable: true,
    detail: `${augmentees} salariée(s) augmentée(s) sur ${retours.length} retour(s) (${(part * 100).toFixed(0)} %) → ${points}/15.`,
  };
}

/** Indicateur 5 (10 pts) — nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations. */
function indicateur5(employes: Employe[]): Indicateur {
  const top10 = [...employes].sort((a, b) => b.salaireAnnuel - a.salaireAnnuel).slice(0, 10);
  if (top10.length < 10) {
    return { code: 5, nom: "Hautes rémunérations", points: 0, max: 10, calculable: false, detail: "Non calculable : moins de 10 salariés." };
  }
  const f = top10.filter((e) => e.genre === "F").length;
  const h = top10.filter((e) => e.genre === "H").length;
  const sousRepresente = Math.min(f, h);
  const points = sousRepresente >= 4 ? 10 : sousRepresente >= 2 ? 5 : 0;
  return {
    code: 5,
    nom: "Hautes rémunérations",
    points,
    max: 10,
    calculable: true,
    detail: `10 plus hautes rémunérations : ${f} femmes, ${h} hommes → ${sousRepresente} du sexe sous-représenté → ${points}/10.`,
  };
}

export function calculerIndex(employes: Employe[]): IndexComplet {
  const simplifie = employes.length < 250;
  const indicateurs = [
    indicateur1(employes, simplifie),
    indicateurTaux(employes, "augmentation", 2, 20, "Écart de taux d'augmentations individuelles", GRILLE_20),
    indicateurTaux(employes, "promotion", 3, 15, "Écart de taux de promotions", GRILLE_15),
    indicateur4(employes),
    indicateur5(employes),
  ];

  const sommePts = indicateurs.reduce((s, i) => s + i.points, 0);
  const sommeMax = indicateurs.reduce((s, i) => s + (i.calculable ? i.max : 0), 0);
  const total = sommeMax > 0 ? Math.round((sommePts / sommeMax) * 100) : 0;

  return {
    indicateurs,
    total,
    seuil75Atteint: total >= 75,
    methode: simplifie ? "2 tranches d'âge (< 250 salariés)" : "4 tranches d'âge (≥ 250 salariés)",
  };
}
