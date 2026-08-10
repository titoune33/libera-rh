import { describe, expect, it } from "vitest";
import { calculerIndex } from "../src/lib/indexFrancais";
import { SAMPLE_DATA } from "../src/lib/sampleData";

describe("calculerIndex", () => {
  it("calcule l'index du jeu de démonstration : 78/100, 5 indicateurs calculables", () => {
    const index = calculerIndex(SAMPLE_DATA.employes);
    expect(index.total).toBe(78);
    expect(index.indicateurs.filter((i) => i.calculable).length).toBe(5);
    expect(index.seuil75Atteint).toBe(true);
    expect(index.methode).toContain("2 tranches");
  });

  it("neutralise un indicateur sans données et redistribue le poids", () => {
    const employes = SAMPLE_DATA.employes.map((e) => ({ ...e, augmentation: undefined, promotion: undefined, congeMaternite: undefined }));
    const index = calculerIndex(employes);
    const calculables = index.indicateurs.filter((i) => i.calculable);
    // Indicateurs 1 et 5 restent calculables (salaires), 2/3/4 non.
    expect(calculables.map((i) => i.code).sort()).toEqual([1, 5]);
    expect(index.total).toBeGreaterThan(0);
    expect(index.total).toBeLessThanOrEqual(100);
  });

  it("respecte le seuil de 75 (plan de rattrapage obligatoire en dessous)", () => {
    // 10 salariés, écart énorme sur poste comparable, top 10 majoritairement masculin.
    const employes = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      nom: `S${i}`,
      genre: (i % 2 === 0 ? "H" : "F") as "H" | "F",
      categorie: "Cadres" as const,
      salaireAnnuel: i % 2 === 0 ? 80000 : 45000,
      poste: "P",
      anciennete: 5,
      age: 35,
      partVariable: 0,
      augmentation: true,
    }));
    const index = calculerIndex(employes);
    expect(index.total).toBeLessThan(75);
    expect(index.seuil75Atteint).toBe(false);
  });
});
