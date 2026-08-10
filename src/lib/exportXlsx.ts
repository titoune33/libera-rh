import * as XLSX from "xlsx";
import type { JeuDeDonnees, ResultatAnalyse } from "./types";
import { evaluerConformite } from "./conformite";
import { calculerIndex } from "./indexFrancais";
import { simulerRattrapage } from "./planRattrapage";

/** Exporte un classeur Excel avec 3 feuilles : synthèse, écarts par catégorie, postes comparables. */
export function exporterXlsx(jeu: JeuDeDonnees, resultat: ResultatAnalyse): void {
  const s = jeu.societe;
  const g = resultat.global;
  const verdict = evaluerConformite(resultat);
  const dateFr = new Date(resultat.dateAnalyse).toLocaleDateString("fr-FR");

  const index = calculerIndex(jeu.employes);
  const { simulation } = simulerRattrapage(jeu.employes);

  const wb = XLSX.utils.book_new();

  // Feuille 1 : synthèse
  const synthese = [
    { Indicateur: "Société", Valeur: s.nom },
    { Indicateur: "SIRET", Valeur: s.siret },
    { Indicateur: "Exercice", Valeur: s.exercice },
    { Indicateur: "Effectif", Valeur: s.effectif },
    { Indicateur: "Date d'établissement", Valeur: dateFr },
    { Indicateur: "Score d'égalité (/100)", Valeur: resultat.pointsEcart },
    { Indicateur: "Écart moyen (%)", Valeur: g.ecartMoyenPct },
    { Indicateur: "Écart médian (%)", Valeur: g.ecartMedianPct },
    { Indicateur: "Salaire moyen femmes (€)", Valeur: g.salaireMoyenF },
    { Indicateur: "Salaire moyen hommes (€)", Valeur: g.salaireMoyenH },
    { Indicateur: "Salaire médian femmes (€)", Valeur: g.salaireMedianF },
    { Indicateur: "Salaire médian hommes (€)", Valeur: g.salaireMedianH },
    { Indicateur: "Masse salariale (€)", Valeur: g.masseSalariale },
    { Indicateur: "Verdict", Valeur: `${verdict.titre} — ${verdict.detail}` },
  ];
  const ws1 = XLSX.utils.json_to_sheet(synthese);
  ws1["!cols"] = [{ wch: 34 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Synthèse");

  // Feuille 2 : écarts par catégorie
  const parCat = resultat.parCategorie
    .filter((c) => c.effectifF > 0 && c.effectifH > 0)
    .map((c) => ({
      Catégorie: c.categorie,
      "Effectif F": c.effectifF,
      "Effectif H": c.effectifH,
      "Salaire moyen F (€)": Math.round(c.salaireMoyenF ?? 0),
      "Salaire moyen H (€)": Math.round(c.salaireMoyenH ?? 0),
      "Salaire médian F (€)": Math.round(c.salaireMedianF ?? 0),
      "Salaire médian H (€)": Math.round(c.salaireMedianH ?? 0),
      "Écart moyen (%)": Number((c.ecartMoyenPct ?? 0).toFixed(2)),
      "Écart médian (%)": Number((c.ecartMedianPct ?? 0).toFixed(2)),
    }));
  const ws2 = XLSX.utils.json_to_sheet(parCat);
  ws2["!cols"] = [{ wch: 24 }, 10, 10, 16, 16, 16, 16, 12, 12].map((w) => ({ wch: w as number }));
  XLSX.utils.book_append_sheet(wb, ws2, "Écarts par catégorie");

  // Feuille 3 : postes comparables
  const postes = resultat.postesComparables.map((p) => ({
    Poste: p.poste,
    "Effectif F": p.effectifF,
    "Effectif H": p.effectifH,
    "Écart moyen (%)": Number((p.ecartMoyenPct ?? 0).toFixed(2)),
  }));
  const ws3 = XLSX.utils.json_to_sheet(postes);
  ws3["!cols"] = [{ wch: 34 }, 10, 10, 14].map((w) => ({ wch: w as number }));
  XLSX.utils.book_append_sheet(wb, ws3, "Postes comparables");

  // Feuille 4 : index d'égalité professionnelle complet
  const indexRows = index.indicateurs.map((i) => ({
    Indicateur: `${i.code}. ${i.nom}`,
    Points: i.points,
    Maximum: i.max,
    Statut: i.calculable ? `${Math.round((i.points / i.max) * 100)} % du maximum` : "Non calculable",
    Détail: i.detail,
  }));
  indexRows.push({ Indicateur: "TOTAL INDEX (/100)", Points: index.total, Maximum: 100, Statut: index.total >= 75 ? "Seuil 75 atteint" : "Seuil 75 non atteint", Détail: index.methode });
  const ws4 = XLSX.utils.json_to_sheet(indexRows);
  ws4["!cols"] = [{ wch: 46 }, 8, 10, 22, 90].map((w) => ({ wch: w as number }));
  XLSX.utils.book_append_sheet(wb, ws4, "Index égalité");

  // Feuille 5 : plan de rattrapage
  if (simulation.postes.length > 0) {
    const rattrapage = [
      ...simulation.postes.map((p) => ({
        Poste: p.poste,
        "Effectif F": p.effectifF,
        "Salaire moyen F (€)": Math.round(p.salaireMoyenF),
        "Salaire moyen H (€)": Math.round(p.salaireMoyenH),
        "Écart (%)": Number(p.ecartPct.toFixed(2)),
        "Coût annuel (€)": p.coutAnnuel,
      })),
      {
        Poste: "TOTAL",
        "Effectif F": "",
        "Salaire moyen F (€)": "",
        "Salaire moyen H (€)": "",
        "Écart (%)": "",
        "Coût annuel (€)": simulation.coutTotalAnnuel,
      },
    ];
    const ws5 = XLSX.utils.json_to_sheet(rattrapage);
    ws5["!cols"] = [{ wch: 30 }, 10, 16, 16, 12, 14].map((w) => ({ wch: w as number }));
    XLSX.utils.book_append_sheet(wb, ws5, "Plan de rattrapage");
  }

  XLSX.writeFile(wb, `dossier-conformite-${s.exercice}.xlsx`);
}
