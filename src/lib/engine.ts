import { CATEGORIES, type Categorie, type Employe, type EcartParCategorie, type ResultatAnalyse } from "./types";

/** Médiane (tri puis valeur centrale). */
function mediane(valeurs: number[]): number {
  if (valeurs.length === 0) return NaN;
  const triees = [...valeurs].sort((a, b) => a - b);
  const mid = Math.floor(triees.length / 2);
  return triees.length % 2 === 0 ? (triees[mid - 1] + triees[mid]) / 2 : triees[mid];
}

function moyenne(valeurs: number[]): number {
  if (valeurs.length === 0) return NaN;
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

/**
 * Écart relatif en pourcentage : (H - F) / H.
 * Positif => les femmes gagnent en moyenne moins que les hommes.
 * Retourne null si l'un des deux groupes est vide (non comparable).
 */
function ecartRelatifPct(moyenF: number, moyenH: number): number | null {
  if (!Number.isFinite(moyenF) || !Number.isFinite(moyenH) || moyenH === 0) return null;
  return ((moyenH - moyenF) / moyenH) * 100;
}

function salairesDe(employes: Employe[], genre: "F" | "H"): number[] {
  return employes.filter((e) => e.genre === genre).map((e) => e.salaireAnnuel);
}

function analyseCategorie(employes: Employe[], categorie: Categorie): EcartParCategorie {
  const deLaCat = employes.filter((e) => e.categorie === categorie);
  const f = salairesDe(deLaCat, "F");
  const h = salairesDe(deLaCat, "H");

  const moyF = moyenne(f);
  const moyH = moyenne(h);
  const medF = mediane(f);
  const medH = mediane(h);

  const postesComparables = analyserPostesComparables(deLaCat);

  return {
    categorie,
    effectifF: f.length,
    effectifH: h.length,
    salaireMoyenF: f.length ? moyF : null,
    salaireMoyenH: h.length ? moyH : null,
    salaireMedianF: f.length ? medF : null,
    salaireMedianH: h.length ? medH : null,
    ecartMoyenPct: f.length && h.length ? ecartRelatifPct(moyF, moyH) : null,
    ecartMedianPct: f.length && h.length ? ecartRelatifPct(medF, medH) : null,
    nbPostesComparables: postesComparables.length,
  };
}

interface PosteComparable {
  poste: string;
  f: number[];
  h: number[];
}

/** Regroupe les salaires par poste, ne garde que les postes occupés par les deux genres. */
function analyserPostesComparables(employes: Employe[]): { poste: string; effectifF: number; effectifH: number; ecartMoyenPct: number | null }[] {
  const parPoste = new Map<string, PosteComparable>();
  for (const e of employes) {
    const entry = parPoste.get(e.poste) ?? { poste: e.poste, f: [], h: [] };
    (e.genre === "F" ? entry.f : entry.h).push(e.salaireAnnuel);
    parPoste.set(e.poste, entry);
  }
  return [...parPoste.values()]
    .filter((p) => p.f.length > 0 && p.h.length > 0)
    .map((p) => ({
      poste: p.poste,
      effectifF: p.f.length,
      effectifH: p.h.length,
      ecartMoyenPct: ecartRelatifPct(moyenne(p.f), moyenne(p.h)),
    }))
    .sort((a, b) => (b.ecartMoyenPct ?? 0) - (a.ecartMoyenPct ?? 0));
}

/**
 * Score d'égalité sur 100, calqué sur la logique de l'index français :
 * pénalité forte quand l'écart moyen « à travail comparable » dépasse 5%,
 * bonus de cohérence quand effectifs et médianes sont équilibrés.
 */
function calculerScore(employes: Employe[]): { points: number; seuilAtteint: boolean } {
  const postes = analyserPostesComparables(employes);
  let points = 100;
  let seuilAtteint = true;

  // Dimension 1 : écart sur postes comparables (poids fort, jusqu'à -40 points)
  const ecarts = postes.map((p) => Math.abs(p.ecartMoyenPct ?? 0));
  if (ecarts.length > 0) {
    const ecartMax = Math.max(...ecarts);
    if (ecartMax > 5) {
      seuilAtteint = false;
      points -= Math.min(40, Math.round((ecartMax - 5) * 4));
    }
  }

  // Dimension 2 : représentation équilibrée par catégorie (jusqu'à -25 points)
  for (const cat of CATEGORIES) {
    const deLaCat = employes.filter((e) => e.categorie === cat);
    const f = deLaCat.filter((e) => e.genre === "F").length;
    const h = deLaCat.filter((e) => e.genre === "H").length;
    if (f + h < 10) continue;
    const partF = f / (f + h);
    if (partF < 0.35 || partF > 0.65) {
      points -= Math.min(25, Math.round(Math.abs(partF - 0.5) * 40));
    }
  }

  // Dimension 3 : part des femmes parmi les 10 plus hautes rémunérations (jusqu'à -15 points)
  const top10 = [...employes].sort((a, b) => b.salaireAnnuel - a.salaireAnnuel).slice(0, 10);
  if (top10.length >= 10) {
    const partF = top10.filter((e) => e.genre === "F").length / top10.length;
    if (partF < 0.4 || partF > 0.6) {
      points -= Math.min(15, Math.round(Math.abs(partF - 0.5) * 30));
    }
  }

  return { points: Math.max(0, points), seuilAtteint };
}

export function analyser(employes: Employe[]): ResultatAnalyse {
  const f = salairesDe(employes, "F");
  const h = salairesDe(employes, "H");

  const moyF = moyenne(f);
  const moyH = moyenne(h);
  const medF = mediane(f);
  const medH = mediane(h);

  const { points, seuilAtteint } = calculerScore(employes);

  return {
    dateAnalyse: new Date().toISOString(),
    global: {
      effectifF: f.length,
      effectifH: h.length,
      salaireMoyenF: moyF,
      salaireMoyenH: moyH,
      salaireMedianF: medF,
      salaireMedianH: medH,
      ecartMoyenPct: ecartRelatifPct(moyF, moyH) ?? 0,
      ecartMedianPct: ecartRelatifPct(medF, medH) ?? 0,
      masseSalariale: employes.reduce((s, e) => s + e.salaireAnnuel, 0),
    },
    parCategorie: CATEGORIES.map((c) => analyseCategorie(employes, c)),
    postesComparables: analyserPostesComparables(employes),
    pointsEcart: points,
    seuilAtteint,
  };
}

/** Formate un nombre en euros, arrondi à l'entier. */
export function formatEuros(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

/** Formate un pourcentage avec un signe. */
export function formatPct(v: number | null | undefined, chiffres = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const signe = v > 0 ? "+" : "";
  return `${signe}${v.toFixed(chiffres).replace(".", ",")} %`;
}

export function formatNombre(v: number): string {
  return new Intl.NumberFormat("fr-FR").format(v);
}
