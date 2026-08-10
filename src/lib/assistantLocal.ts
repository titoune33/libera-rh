import type { JeuDeDonnees, ResultatAnalyse } from "./types";
import { formatEuros, formatPct } from "./engine";

/**
 * Générateur local (déterministe) de note de synthèse. Utilisé en secours
 * quand l'API Hugging Face n'est pas configurée ou échoue : l'expérience
 * reste complète sans dépendre du cloud.
 */
export function genererNoteLocale(jeu: JeuDeDonnees, resultat: ResultatAnalyse, question?: string): string {
  const g = resultat.global;
  const s = jeu.societe;

  const categoriesCritiques = resultat.parCategorie
    .filter((c) => c.effectifF > 0 && c.effectifH > 0 && Math.abs(c.ecartMoyenPct ?? 0) > 5)
    .sort((a, b) => Math.abs(b.ecartMoyenPct ?? 0) - Math.abs(a.ecartMoyenPct ?? 0));

  const postesAJustifier = resultat.postesComparables
    .filter((p) => Math.abs(p.ecartMoyenPct ?? 0) > 5)
    .sort((a, b) => Math.abs(b.ecartMoyenPct ?? 0) - Math.abs(a.ecartMoyenPct ?? 0));

  const lignes: string[] = [];

  if (question && question.trim()) {
    lignes.push(`## Demande traitée\n${question.trim()}\n`);
  }

  lignes.push(
    `## Note de synthèse — Transparence salariale ${s.nom} (exercice ${s.exercice})`,
    ``,
    `### Constats`,
    `- Score d'égalité : ${resultat.pointsEcart}/100 (écart moyen ${formatPct(g.ecartMoyenPct)}, médian ${formatPct(g.ecartMedianPct)}).`,
    `- Masse salariale analysée : ${formatEuros(g.masseSalariale)} (${g.effectifF} femmes, ${g.effectifH} hommes).`,
  );

  if (categoriesCritiques.length > 0) {
    lignes.push(
      `- Catégories avec un écart moyen supérieur à 5 % : ${categoriesCritiques
        .map((c) => `${c.categorie} (${formatPct(c.ecartMoyenPct)})`)
        .join(", ")}.`,
    );
  } else {
    lignes.push(`- Aucune catégorie ne dépasse le seuil de vigilance de 5 %.`);
  }

  if (postesAJustifier.length > 0) {
    lignes.push(
      `- Postes « à travail comparable » à justifier : ${postesAJustifier
        .map((p) => `${p.poste} (${formatPct(p.ecartMoyenPct)})`)
        .join(", ")}.`,
    );
  }

  lignes.push(
    ``,
    `### Points de vigilance`,
    `1. Documenter par écrit les justifications objectives des écarts (ancienneté, ancienneté de poste, performance, pénurie de compétences) avant toute communication du rapport.`,
    `2. Vérifier la présence des fourchettes de rémunération dans toutes les offres d'emploi publiées (directive 2023/970, art. 5).`,
    `3. Préparer les données du rapport annuel (entreprises de 100+ salariés) et l'index d'égalité professionnelle à publier avant le 1er mars.`,
    `4. ${resultat.pointsEcart >= 75 ? "Maintenir la surveillance des postes à écart résiduel." : "Le score étant sous 75/100, engager un plan de rattrapage sous 3 ans (L. 1142-9)."}`,
    ``,
    `### Actions prioritaires`,
  );

  const actions = postesAJustifier.length > 0
    ? [
        `Corriger les écarts sur les postes ${postesAJustifier.slice(0, 3).map((p) => `« ${p.poste} »`).join(", ")} : fixer un budget et un calendrier (voir le plan de rattrapage).`,
        `Publier les fourchettes salariales alignées sur le benchmark de marché pour les postes à recruter.`,
        `Transmettre le rapport aux représentants du personnel et le publier sur le site de l'entreprise.`,
      ]
    : [
        `Publier les fourchettes salariales alignées sur le benchmark de marché.`,
        `Transmettre le rapport aux représentants du personnel et le publier sur le site de l'entreprise.`,
        `Suivre l'évolution du score exercice après exercice (multi-exercices).`,
      ];
  lignes.push(...actions.map((a, i) => `${i + 1}. ${a}`));

  lignes.push(
    ``,
    `*Note générée par le moteur local d'Équilibre. Ne constitue pas un avis juridique — consulter un avocat spécialisé en droit social pour les cas complexes.*`,
  );

  return lignes.join("\n");
}
