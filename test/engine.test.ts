import { describe, expect, it } from "vitest";
import { analyser, formatEuros, formatPct } from "../src/lib/engine";
import { SAMPLE_DATA } from "../src/lib/sampleData";

describe("analyser", () => {
  it("calcule le score et les effectifs du jeu de démonstration", () => {
    const r = analyser(SAMPLE_DATA.employes);
    expect(r.global.effectifF).toBe(18);
    expect(r.global.effectifH).toBe(18);
    expect(r.pointsEcart).toBe(90);
    expect(r.global.ecartMoyenPct).toBeGreaterThan(5);
    expect(r.global.ecartMoyenPct).toBeLessThan(6);
    expect(r.postesComparables.length).toBeGreaterThan(0);
  });

  it("retourne un écart nul sur un effectif parfaitement égalitaire", () => {
    const employes = [
      { id: "1", nom: "A", genre: "F" as const, categorie: "Cadres" as const, salaireAnnuel: 50000, poste: "P", anciennete: 5, age: 35, partVariable: 0 },
      { id: "2", nom: "B", genre: "H" as const, categorie: "Cadres" as const, salaireAnnuel: 50000, poste: "P", anciennete: 5, age: 35, partVariable: 0 },
    ];
    const r = analyser(employes);
    expect(r.global.ecartMoyenPct).toBe(0);
    expect(r.pointsEcart).toBe(100);
  });

  it("pénalise un écart à poste comparable supérieur à 5 %", () => {
    const employes = [
      { id: "1", nom: "A", genre: "F" as const, categorie: "Cadres" as const, salaireAnnuel: 40000, poste: "P", anciennete: 5, age: 35, partVariable: 0 },
      { id: "2", nom: "B", genre: "H" as const, categorie: "Cadres" as const, salaireAnnuel: 50000, poste: "P", anciennete: 5, age: 35, partVariable: 0 },
    ];
    const r = analyser(employes);
    expect(Math.abs(r.global.ecartMoyenPct)).toBeCloseTo(20, 1);
    expect(r.pointsEcart).toBeLessThan(100);
    expect(r.seuilAtteint).toBe(false);
  });
});

describe("formatage", () => {
  it("formate les euros en fr-FR", () => {
    // fr-FR utilise une espace insécable (U+00A0 ou U+202F) : on normalise pour le test.
    expect(formatEuros(12345.6).replace(/[\u202f\u00a0]/g, " ")).toBe("12 346 €");
  });
  it("renvoie un tiret sur les valeurs nulles", () => {
    expect(formatEuros(null)).toBe("—");
    expect(formatPct(undefined)).toBe("—");
  });
  it("ajoute un signe + aux pourcentages positifs", () => {
    expect(formatPct(5.6)).toBe("+5,6 %");
    expect(formatPct(-3.2)).toBe("-3,2 %");
  });
});
