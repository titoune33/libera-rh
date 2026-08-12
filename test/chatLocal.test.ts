import { describe, expect, it } from "vitest";
import { repondreLocal } from "../src/lib/chatLocal";

const CTX = "Société : Novamétal SAS · 36 salariés";

describe("repondreLocal — routage des questions", () => {
  it("route « index » vers l'indicateur", () => {
    expect(repondreLocal("Comment améliorer mon index ?", CTX)).toContain("L'index d'égalité professionnelle");
  });
  it("route « fourchettes » vers les fourchettes", () => {
    expect(repondreLocal("Que mettre dans une fourchette salariale ?", CTX)).toContain("fourchettes salariales");
  });
  it("route « plan de rattrapage » vers le rattrapage", () => {
    expect(repondreLocal("C'est quoi le plan de rattrapage ?", CTX)).toContain("plan de rattrapage");
  });
  it("route « obligations » (question rapide de l'app) vers la directive", () => {
    expect(repondreLocal("Quelles sont mes obligations ?", CTX)).toContain("La directive (UE) 2023/970 s'applique");
  });
  it("route « rapport » vers le dossier de conformité", () => {
    expect(repondreLocal("Comment publier mon rapport ?", CTX)).toContain("dossier de conformité");
  });
  it("route « données / CSV » vers l'import", () => {
    expect(repondreLocal("Quel CSV importer ?", CTX)).toContain("aucune donnée ne quitte la machine");
  });
  it("route « benchmark » vers le benchmark sectoriel", () => {
    expect(repondreLocal("Mon benchmark sectoriel ?", CTX)).toContain("benchmark sectoriel");
  });
  it("route « connecter » vers la connexion", () => {
    expect(repondreLocal("Comment me connecter ?", CTX)).toContain("connexion multi-comptes");
  });
  it("repli générique sur toute autre question", () => {
    expect(repondreLocal("Bonjour", CTX)).toContain("Je suis l'assistant Équitia");
  });
});
