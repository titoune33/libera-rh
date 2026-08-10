import { describe, expect, it } from "vitest";
import { referentielMarche, positionSurMarche, coefficientAnciennete } from "../src/lib/marcheSalarial";

describe("referentielMarche", () => {
  it("reconnaît les intitulés avec accents et « R&D »", () => {
    const r = referentielMarche("Directrice R&D", "province", 10);
    expect(r).not.toBeNull();
    expect(r?.p50).toBeGreaterThan(50000);
  });

  it("applique le coefficient Île-de-France (+18 %)", () => {
    const province = referentielMarche("Cariste", "province", 4);
    const idf = referentielMarche("Cariste", "idf", 4);
    expect(idf!.p50).toBeGreaterThan(province!.p50);
    expect(idf!.p50).toBe(Math.round((province!.p50 * 1.18) / 100) * 100);
  });

  it("ajuste selon l'ancienneté (junior vs senior)", () => {
    const junior = referentielMarche("Cariste", "province", 1);
    const senior = referentielMarche("Cariste", "province", 12);
    expect(senior!.p50).toBeGreaterThan(junior!.p50);
  });

  it("retourne null pour un poste inconnu", () => {
    expect(referentielMarche("Zorglub interstellaire", "province", 5)).toBeNull();
  });
});

describe("positionSurMarche", () => {
  it("borne la position entre 0,1 et 0,9", () => {
    const marche = referentielMarche("Cariste", "province", 4)!;
    expect(positionSurMarche(1, marche)).toBe(0.1);
    expect(positionSurMarche(10_000_000, marche)).toBe(0.9);
  });
});

describe("coefficientAnciennete", () => {
  it("réduit pour les juniors et majore pour les seniors", () => {
    expect(coefficientAnciennete(1)).toBe(0.88);
    expect(coefficientAnciennete(5)).toBe(1);
    expect(coefficientAnciennete(10)).toBe(1.12);
  });
});
