import { describe, expect, it } from "vitest";
import { importerCSV, parseCSV } from "../src/lib/importCsv";

describe("parseCSV", () => {
  it("gère les guillemets et les sauts de ligne", () => {
    const lignes = parseCSV('a,"b,c"\n"d""e",f\n');
    expect(lignes).toEqual([
      ["a", "b,c"],
      ['d"e', "f"],
    ]);
  });

  it("gère le séparateur point-virgule", () => {
    const lignes = parseCSV("a;b;c\n1;2;3");
    expect(lignes).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });
});

describe("importerCSV", () => {
  const csvValide = [
    "nom,genre,categorie,salaire_annuel,poste,anciennete,age,part_variable,augmentation,promotion,conge_maternite",
    "Dupont Marie,F,Cadres,82000,Directrice R&D,12,45,0.2,1,0,0",
    "Bernard Thomas,H,Cadres,88500,Directeur R&D,9,48,0.2,1,1,0",
    "Fontaine Claire,F,Employés,21500,Assistante administrative,10,43,0.02,0,0,1",
  ].join("\n");

  it("importe un fichier valide avec les colonnes de l'index", () => {
    const r = importerCSV(csvValide);
    expect(r.erreurs).toEqual([]);
    expect(r.employes.length).toBe(3);
    expect(r.employes[0].genre).toBe("F");
    expect(r.employes[0].augmentation).toBe(true);
    expect(r.employes[0].promotion).toBe(false);
    expect(r.employes[2].congeMaternite).toBe(true);
  });

  it("signale les erreurs ligne par ligne", () => {
    const r = importerCSV("nom,genre,categorie,salaire_annuel\nA,X,Cadres,50000\nB,F,Inconnue,50000\nC,F,Cadres,abc\n");
    expect(r.erreurs.length).toBe(3);
    expect(r.employes.length).toBe(0);
  });

  it("exige les colonnes obligatoires", () => {
    const r = importerCSV("nom,genre\nA,F\n");
    expect(r.erreurs.length).toBeGreaterThan(0);
  });

  it("accepte les synonymes de catégories et les montants avec espaces", () => {
    const r = importerCSV("nom,genre,categorie,salaire_annuel\nA,F,agent de maitrise,\"52 000\"\n");
    expect(r.employes[0].categorie).toBe("Agents de maîtrise");
    expect(r.employes[0].salaireAnnuel).toBe(52000);
  });
});
