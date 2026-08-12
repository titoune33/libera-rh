import { describe, expect, it } from "vitest";
import { niveauPour, predireEquipe, predireRisque, recommander } from "./index.js";

describe("attrition", () => {
  it("classe un profil très engagé comme stable", () => {
    const r = predireRisque({
      performance: 0.9,
      engagement: 0.9,
      satisfaction: 0.9,
      experienceAnnees: 8,
      salaire: 70_000,
    });
    expect(r.niveau).toBe("stable");
    expect(r.probabilite).toBeLessThan(0.4);
  });

  it("classe un profil désengagé comme à risque", () => {
    const r = predireRisque({
      performance: 0.2,
      engagement: 0.15,
      satisfaction: 0.1,
      experienceAnnees: 1,
      salaire: 32_000,
    });
    expect(r.probabilite).toBeGreaterThan(0.7);
    expect(["eleve", "modere"]).toContain(r.niveau);
  });

  it("produit une recommandation en français alignée sur les seuils", () => {
    const eleve = recommander("Marie", 0.85);
    expect(eleve).toContain("Intervention immédiate");
    const stable = recommander("Paul", 0.2);
    expect(stable).toContain("bien engagé");
  });

  it("normalise un profil incomplet avec confiance réduite", () => {
    const r = predireRisque({ performance: 0.5 });
    expect(r.confiance).toBe(0.6);
    expect(r.caracteristiques.experienceAnnees).toBe(5);
    expect(r.caracteristiques.salaire).toBe(50_000);
  });

  it("calcule les statistiques d'équipe", () => {
    const eq = predireEquipe([
      { nom: "A", performance: 0.9, engagement: 0.9, satisfaction: 0.9 },
      { nom: "B", performance: 0.1, engagement: 0.1, satisfaction: 0.1 },
      { nom: "C", performance: 0.8, engagement: 0.8, satisfaction: 0.8 },
    ]);
    expect(eq.statistiques.effectif).toBe(3);
    expect(eq.statistiques.aRisque).toBeGreaterThanOrEqual(1);
    expect(eq.resultats[0].nom).toBe("A");
  });

  it("les seuils de niveau sont cohérents", () => {
    expect(niveauPour(0.85)).toBe("eleve");
    expect(niveauPour(0.7)).toBe("modere");
    expect(niveauPour(0.5)).toBe("faible");
    expect(niveauPour(0.1)).toBe("stable");
  });
});
