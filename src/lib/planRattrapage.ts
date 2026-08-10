import type { Employe, ResultatAnalyse } from "./types";
import { analyser } from "./engine";

export interface PosteARattraper {
  poste: string;
  effectifF: number;
  salaireMoyenF: number;
  salaireMoyenH: number;
  ecartPct: number;
  coutAnnuel: number; // € / an pour ramener les femmes au niveau moyen des hommes
}

export interface SimulationRattrapage {
  postes: PosteARattraper[];
  coutTotalAnnuel: number;
  budgetRecommandee: number; // première année (coût total + marge de 20 %)
  dureeAnnee: number;
  coutParAn: number[];
  scoreInitial: number;
  scoreProjete: number;
  ecartInitialPct: number;
  ecartProjetePct: number;
  seuilAtteint: boolean;
}

/**
 * Simule le rattrapage des écarts « à poste comparable » : rehausse les
 * salaires des femmes des postes dont l'écart moyen dépasse le seuil pour
 * les ramener au niveau moyen des hommes, puis recalcule le score exact.
 */
export function simulerRattrapage(
  employes: Employe[],
  seuil = 5,
  dureeAnnee = 3,
): { simulation: SimulationRattrapage; employesCorriges: Employe[] } {
  const avant = analyser(employes);

  // Regrouper les salaires par poste
  const parPoste = new Map<string, { f: number[]; h: number[] }>();
  for (const e of employes) {
    const entry = parPoste.get(e.poste) ?? { f: [], h: [] };
    (e.genre === "F" ? entry.f : entry.h).push(e.salaireAnnuel);
    parPoste.set(e.poste, entry);
  }

  const postes: PosteARattraper[] = [];
  const corriges: Employe[] = employes.map((e) => ({ ...e }));
  let coutTotal = 0;

  for (const [poste, { f, h }] of parPoste) {
    if (f.length === 0 || h.length === 0) continue;
    const moyF = f.reduce((s, v) => s + v, 0) / f.length;
    const moyH = h.reduce((s, v) => s + v, 0) / h.length;
    const ecart = ((moyH - moyF) / moyH) * 100;
    if (ecart > seuil) {
      const coutPoste = (moyH - moyF) * f.length;
      coutTotal += coutPoste;
      postes.push({
        poste,
        effectifF: f.length,
        salaireMoyenF: moyF,
        salaireMoyenH: moyH,
        ecartPct: ecart,
        coutAnnuel: Math.round(coutPoste),
      });
      // Rehausser chaque femme du poste proportionnellement pour atteindre moyH
      for (const e of corriges) {
        if (e.poste === poste && e.genre === "F") {
          e.salaireAnnuel = Math.round(e.salaireAnnuel * (moyH / moyF));
        }
      }
    }
  }

  const apres = analyser(corriges);
  const coutTotalAnnuel = Math.round(coutTotal);
  const budgetRecommandee = Math.round(coutTotalAnnuel * 1.2);
  const poids = Array.from({ length: dureeAnnee }, (_, i) => (i === 0 ? 0.6 : 0.4 / (dureeAnnee - 1)));
  const coutParAn = poids.map((w) => Math.round(coutTotalAnnuel * w));

  const simulation: SimulationRattrapage = {
    postes,
    coutTotalAnnuel,
    budgetRecommandee,
    dureeAnnee,
    coutParAn,
    scoreInitial: avant.pointsEcart,
    scoreProjete: apres.pointsEcart,
    ecartInitialPct: avant.global.ecartMoyenPct,
    ecartProjetePct: apres.global.ecartMoyenPct,
    seuilAtteint: Math.abs(apres.global.ecartMoyenPct) <= 5,
  };

  return { simulation, employesCorriges: corriges };
}

export function formaterSimulation(sim: SimulationRattrapage): string {
  const lignes = [
    `Simulation de plan de rattrapage (${sim.dureeAnnee} ans)`,
    `Score : ${sim.scoreInitial}/100 → ${sim.scoreProjete}/100`,
    `Écart moyen : ${sim.ecartInitialPct.toFixed(1)} % → ${sim.ecartProjetePct.toFixed(1)} %`,
    `Coût annuel total estimé : ${sim.coutTotalAnnuel.toLocaleString("fr-FR")} €`,
    `Budget recommandé première année : ${sim.budgetRecommandee.toLocaleString("fr-FR")} €`,
  ];
  return lignes.join("\n");
}

// Ré-export pour compatibilité avec les appels existants.
export type { ResultatAnalyse };
