import type { JeuDeDonnees, ResultatAnalyse } from "./types";
import { BASE_LEGALE, evaluerConformite } from "./conformite";
import { formatEuros, formatPct } from "./engine";

/** Génère le rapport conforme en Markdown (prêt à imprimer / exporter). */
export function genererRapportMarkdown(jeu: JeuDeDonnees, resultat: ResultatAnalyse): string {
  const s = jeu.societe;
  const g = resultat.global;
  const verdict = evaluerConformite(resultat);
  const date = new Date(resultat.dateAnalyse);
  const dateFr = date.toLocaleDateString("fr-FR");

  const lignes: string[] = [];
  lignes.push(`# Rapport de transparence salariale — ${s.nom}`);
  lignes.push("");
  lignes.push(`**Exercice :** ${s.exercice} — **Établi le :** ${dateFr} — **SIRET :** ${s.siret} — **Effectif :** ${s.effectif}`);
  lignes.push("");
  lignes.push("## Synthèse");
  lignes.push("");
  lignes.push(`- **Score d'égalité :** ${resultat.pointsEcart}/100`);
  lignes.push(`- **Écart moyen (moyenne) :** ${formatPct(g.ecartMoyenPct)} (femmes vs hommes)`);
  lignes.push(`- **Écart médian :** ${formatPct(g.ecartMedianPct)}`);
  lignes.push(`- **Verdict :** ${verdict.titre} — ${verdict.detail}`);
  lignes.push("");
  lignes.push("## Écart de rémunération global");
  lignes.push("");
  lignes.push("| Indicateur | Femmes | Hommes | Écart |");
  lignes.push("|---|---|---|---|");
  lignes.push(`| Salaire moyen | ${formatEuros(g.salaireMoyenF)} | ${formatEuros(g.salaireMoyenH)} | ${formatPct(g.ecartMoyenPct)} |`);
  lignes.push(`| Salaire médian | ${formatEuros(g.salaireMedianF)} | ${formatEuros(g.salaireMedianH)} | ${formatPct(g.ecartMedianPct)} |`);
  lignes.push(`| Effectif | ${g.effectifF} | ${g.effectifH} | — |`);
  lignes.push("");
  lignes.push("## Écart par catégorie professionnelle");
  lignes.push("");
  lignes.push("| Catégorie | F | H | Salaire moyen F | Salaire moyen H | Écart moyen | Écart médian |");
  lignes.push("|---|---|---|---|---|---|---|");
  for (const c of resultat.parCategorie) {
    if (c.effectifF === 0 || c.effectifH === 0) continue;
    lignes.push(
      `| ${c.categorie} | ${c.effectifF} | ${c.effectifH} | ${formatEuros(c.salaireMoyenF)} | ${formatEuros(c.salaireMoyenH)} | ${formatPct(c.ecartMoyenPct)} | ${formatPct(c.ecartMedianPct)} |`,
    );
  }
  lignes.push("");
  if (resultat.postesComparables.length > 0) {
    lignes.push("## Analyse à travail comparable");
    lignes.push("");
    lignes.push("| Poste | F | H | Écart moyen |");
    lignes.push("|---|---|---|---|");
    for (const p of resultat.postesComparables) {
      lignes.push(`| ${p.poste} | ${p.effectifF} | ${p.effectifH} | ${formatPct(p.ecartMoyenPct)} |`);
    }
    lignes.push("");
  }
  lignes.push("## Base légale");
  lignes.push("");
  for (const b of BASE_LEGALE) lignes.push(`- ${b}`);
  lignes.push("");
  lignes.push("## Obligations associées");
  lignes.push("");
  lignes.push("- Fourchettes de rémunération dans les offres d'emploi (directive 2023/970, art. 5)");
  lignes.push("- Droit d'information des candidats et salariés (art. 7)");
  lignes.push("- Rapport annuel sur l'écart de rémunération pour les entreprises de 100+ salariés (art. 9)");
  lignes.push("- Index d'égalité professionnelle publié chaque année (Code du travail, L. 1142-8)");
  lignes.push("");
  lignes.push("---");
  lignes.push(`_Document généré par Équilibre — outil d'aide à la conformité. Ne constitue pas un avis juridique. Pour toute question, consulter un avocat spécialisé en droit social._`);
  return lignes.join("\n");
}

/** Export CSV des écarts par catégorie (analysable dans Excel). */
export function exporterCSV(resultat: ResultatAnalyse): void {
  const lignes: string[] = ["categorie;effectif_femmes;effectif_hommes;salaire_moyen_f;salaire_moyen_h;ecart_moyen_pct;ecart_median_pct"];
  for (const c of resultat.parCategorie) {
    if (c.effectifF === 0 || c.effectifH === 0) continue;
    lignes.push(
      [
        c.categorie,
        c.effectifF,
        c.effectifH,
        (c.salaireMoyenF ?? 0).toFixed(0),
        (c.salaireMoyenH ?? 0).toFixed(0),
        (c.ecartMoyenPct ?? 0).toFixed(2),
        (c.ecartMedianPct ?? 0).toFixed(2),
      ].join(";"),
    );
  }
  const blob = new Blob(["\uFEFF" + lignes.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ecarts-remuneration.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Déclenche l'impression du rapport (enregistrement PDF via le navigateur). */
export function imprimerRapport(): void {
  window.print();
}
