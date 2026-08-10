import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import type { JeuDeDonnees, ResultatAnalyse } from "./types";
import { BASE_LEGALE, evaluerConformite } from "./conformite";
import { formatEuros, formatPct } from "./engine";
import { calculerIndex } from "./indexFrancais";
import { simulerRattrapage } from "./planRattrapage";

const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
};

function cellule(texte: string, bold = false): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text: texte, bold, size: 20 })] })],
  });
}

/** Génère et télécharge le rapport conforme en .docx (Word). */
export async function exporterDocx(jeu: JeuDeDonnees, resultat: ResultatAnalyse): Promise<void> {
  const s = jeu.societe;
  const g = resultat.global;
  const verdict = evaluerConformite(resultat);
  const dateFr = new Date(resultat.dateAnalyse).toLocaleDateString("fr-FR");
  const index = calculerIndex(jeu.employes);
  const { simulation } = simulerRattrapage(jeu.employes);

  const lignesEntete = () => [
    new Paragraph({
      children: [new TextRun({ text: `Rapport de transparence salariale — ${s.nom}`, bold: true, size: 34 })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Exercice : ${s.exercice}   ·   Établi le : ${dateFr}   ·   SIRET : ${s.siret}   ·   Effectif : ${s.effectif}`, size: 20, color: "475569" })],
      spacing: { after: 320 },
    }),
  ];

  const titre = (t: string) =>
    new Paragraph({
      children: [new TextRun({ text: t, bold: true, size: 26, color: "4F46E5" })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 160 },
    });

  const bullet = (t: string, bold = false) =>
    new Paragraph({
      children: [new TextRun({ text: "•  ", size: 20 }), new TextRun({ text: t, size: 20, bold })],
      spacing: { after: 80 },
    });

  const tableauGlobal = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [cellule("Indicateur", true), cellule("Femmes", true), cellule("Hommes", true), cellule("Écart", true)] }),
        new TableRow({ children: [cellule("Salaire moyen"), cellule(formatEuros(g.salaireMoyenF)), cellule(formatEuros(g.salaireMoyenH)), cellule(formatPct(g.ecartMoyenPct))] }),
        new TableRow({ children: [cellule("Salaire médian"), cellule(formatEuros(g.salaireMedianF)), cellule(formatEuros(g.salaireMedianH)), cellule(formatPct(g.ecartMedianPct))] }),
        new TableRow({ children: [cellule("Effectif"), cellule(String(g.effectifF)), cellule(String(g.effectifH)), cellule("—")] }),
      ],
    });

  const tableauCategories = () => {
    const rows = resultat.parCategorie
      .filter((c) => c.effectifF > 0 && c.effectifH > 0)
      .map((c) => [
        new TableRow({
          children: [
            cellule(c.categorie, true),
            cellule(String(c.effectifF)),
            cellule(String(c.effectifH)),
            cellule(formatEuros(c.salaireMoyenF)),
            cellule(formatEuros(c.salaireMoyenH)),
            cellule(formatPct(c.ecartMoyenPct)),
            cellule(formatPct(c.ecartMedianPct)),
          ],
        }),
      ]);
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cellule("Catégorie", true),
            cellule("F", true),
            cellule("H", true),
            cellule("Moyen F", true),
            cellule("Moyen H", true),
            cellule("Écart moyen", true),
            cellule("Écart médian", true),
          ],
        }),
        ...rows.flat(),
      ],
    });
  };

  const tableauIndex = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [cellule("Indicateur", true), cellule("Points", true), cellule("Maximum", true), cellule("Statut", true)] }),
        ...index.indicateurs.map((i) =>
          new TableRow({
            children: [
              cellule(`${i.code}. ${i.nom}`),
              cellule(String(i.points)),
              cellule(String(i.max)),
              cellule(i.calculable ? `${Math.round((i.points / i.max) * 100)} % du maximum` : "Non calculable"),
            ],
          }),
        ),
      ],
    });

  const tableauRattrapage = () => {
    if (simulation.postes.length === 0) return [];
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [cellule("Poste", true), cellule("F", true), cellule("Moyen F", true), cellule("Moyen H", true), cellule("Écart", true), cellule("Coût annuel", true)],
          }),
          ...simulation.postes.map(
            (p) =>
              new TableRow({
                children: [
                  cellule(p.poste, true),
                  cellule(String(p.effectifF)),
                  cellule(formatEuros(p.salaireMoyenF)),
                  cellule(formatEuros(p.salaireMoyenH)),
                  cellule(formatPct(p.ecartPct)),
                  cellule(formatEuros(p.coutAnnuel)),
                ],
              }),
          ),
        ],
      }),
      bullet(`Budget total estimé : ${formatEuros(simulation.coutTotalAnnuel)} (recommandé an 1 : ${formatEuros(simulation.budgetRecommandee)} sur ${simulation.dureeAnnee} an(s))`),
      bullet(`Score d'égalité : ${simulation.scoreInitial}/100 → ${simulation.scoreProjete}/100 après correction`),
    ];
  };

  const tableauPostes = () => {
    if (resultat.postesComparables.length === 0) return [];
    const rows = resultat.postesComparables.map(
      (p) =>
        new TableRow({
          children: [cellule(p.poste, true), cellule(String(p.effectifF)), cellule(String(p.effectifH)), cellule(formatPct(p.ecartMoyenPct))],
        }),
    );
    return [
      titre("Analyse à travail comparable"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [cellule("Poste", true), cellule("F", true), cellule("H", true), cellule("Écart moyen", true)] }), ...rows],
      }),
    ];
  };

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          ...lignesEntete(),
          titre("Synthèse"),
          bullet(`Score d'égalité : ${resultat.pointsEcart}/100`, true),
          bullet(`Écart moyen (moyenne) : ${formatPct(g.ecartMoyenPct)} (femmes vs hommes)`),
          bullet(`Écart médian : ${formatPct(g.ecartMedianPct)}`),
          bullet(`Verdict : ${verdict.titre} — ${verdict.detail}`),
          titre("Écart de rémunération global"),
          tableauGlobal(),
          titre("Écart par catégorie professionnelle"),
          tableauCategories(),
          ...tableauPostes(),
          titre(`Index d'égalité professionnelle — ${index.total}/100`),
          bullet(`Méthode : ${index.methode}.`),
          tableauIndex(),
          titre("Plan de rattrapage"),
          ...(simulation.postes.length > 0
            ? tableauRattrapage()
            : [bullet("Aucun poste mixte ne dépasse le seuil de 5 % : aucune correction immédiate requise sur les postes comparables.")]),
          titre("Base légale"),
          ...BASE_LEGALE.map((b) => bullet(b)),
          titre("Obligations associées"),
          bullet("Fourchettes de rémunération dans les offres d'emploi (directive 2023/970, art. 5)"),
          bullet("Droit d'information des candidats et salariés (art. 7)"),
          bullet("Rapport annuel sur l'écart de rémunération pour les entreprises de 100+ salariés (art. 9)"),
          bullet("Index d'égalité professionnelle publié chaque année (Code du travail, L. 1142-8)"),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "Document généré par Équilibre — outil d'aide à la conformité. Ne constitue pas un avis juridique.",
                italics: true,
                size: 18,
                color: "64748B",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-transparence-salariale-${s.exercice}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
