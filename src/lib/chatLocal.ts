/** Réponses locales du chat quand l'API Hugging Face est indisponible (démo/dev). */
export function repondreLocal(question: string, contexte: string): string {
  const q = question.toLowerCase();

  const indexRe = /index|score|note|egalit[eé]/;
  const fourchetteRe = /fourchette|offre|salaire minimum|publication/;
  const rattrapageRe = /rattrapage|plan|correction|budget/;
  const rapportRe = /rapport|dossier|repr[eé]sentants|publication/;
  const directiveRe = /directive|2023\/970|europ[eé]enne|échéance|d[ée]lai|obligation/;
  const donneesRe = /donn[eé]es|csv|import|fichier|pai[eé]/;
  const benchmarkRe = /benchmark|secteur|march[eé]|comparaison/;
  const connexionRe = /connexion|connecter|compte|oauth|google|github|inscription/;

  const contexteCourt = contexte.split("\n").slice(0, 4).join(" · ");

  if (indexRe.test(q)) {
    return [
      "L'index d'égalité professionnelle se calcule sur 5 indicateurs pondérés (40+20+15+15+10) :",
      "• Écart de rémunération moyen (40 pts)",
      "• Écart de taux d'augmentations individuelles (20 pts)",
      "• Écart de taux de promotions (15 pts)",
      "• Retour de congé maternité (15 pts)",
      "• Nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations (10 pts)",
      "Le seuil réglementaire est de 75/100. Votre contexte : " + contexteCourt,
    ].join("\n");
  }
  if (fourchetteRe.test(q)) {
    return [
      "Les fourchettes salariales doivent être publiées dans chaque offre d'emploi (obligation de la directive européenne) :",
      "• Calculez la médiane (ou la moyenne) par poste sur vos données",
      "• Ajustez selon la région et l'ancienneté (onglet « Fourchettes salariales »)",
      "• Choisissez une marge ±10-15 % pour rester crédible et attractif",
      "Puis publiez la fourchette dans l'offre, sans mention du salaire du salarié sortant.",
    ].join("\n");
  }
  if (rattrapageRe.test(q)) {
    return [
      "Le plan de rattrapage est obligatoire sous le seuil de 75/100 (ou écart non justifiable) :",
      "• Priorisez les postes avec le plus grand écart en valeur absolue",
      "• Budget an 1 ≈ coût total + marge de 20 %",
      "• Répartissez la correction sur 1 à 3 ans (ex. 60 % an 1, 20 % an 2, 20 % an 3)",
      "• Documentez chaque mesure : rattrapage individuel, revalorisation de grilles, revue des variables.",
      "L'onglet « Plan de rattrapage » chiffre tout cela automatiquement.",
    ].join("\n");
  }
  if (rapportRe.test(q)) {
    return [
      "Votre dossier de conformité réunit : les écarts par catégorie, l'analyse à poste comparable, l'index d'égalité (5 indicateurs) et le plan de rattrapage.",
      "Exports disponibles : Word (.docx), Excel (.xlsx), CSV et impression PDF.",
      "À transmettre aux représentants du personnel et à archiver pour l'inspection du travail — il ne remplace pas un avis juridique.",
    ].join("\n");
  }
  if (directiveRe.test(q)) {
    return [
      "La directive (UE) 2023/970 s'applique en France depuis le 7 juin 2026 :",
      "• Fourchettes salariales dans les offres d'emploi",
      "• Droit d'information des candidats et salariés",
      "• Rapport annuel de transparence pour les entreprises de 100 salariés et plus",
      "• Interdiction de sanctionner un salarié qui exerce ce droit",
      "Équitia couvre l'ensemble : analyse, index, fourchettes, rapport et plan de rattrapage.",
    ].join("\n");
  }
  if (donneesRe.test(q)) {
    return [
      "Pour l'import : un fichier CSV avec une ligne par salarié.",
      "Colonnes attendues : nom, genre (F/H), categorie, salaire_annuel, poste, anciennete, age, part_variable (+ augmentation, promotion, conge_maternite pour l'index complet).",
      "Le modèle CSV est téléchargeable depuis « Données & import », et les erreurs sont signalées ligne par ligne.",
      "Tout le calcul reste dans votre navigateur — aucune donnée ne quitte la machine.",
    ].join("\n");
  }
  if (benchmarkRe.test(q)) {
    return [
      "Le benchmark sectoriel compare votre écart moyen à la référence INSEE de votre secteur (12 secteurs NAF disponibles).",
      "• « Meilleure que le secteur » : écart inférieur à la moitié de la référence",
      "• « Conforme » : écart dans la référence",
      "• « Au-dessus » : écart supérieur à la référence",
      "Les références sont indicatives — remplacez-les par une source payante en production.",
    ].join("\n");
  }
  if (connexionRe.test(q)) {
    return [
      "La connexion multi-comptes est disponible (email + mot de passe, ou Google / GitHub si configurés).",
      "Un compte vous permet de sauvegarder vos jeux de données dans le cloud (Airtable), de créer des dossiers partageables et, pour les administrateurs, d'accéder au panneau d'administration.",
    ].join("\n");
  }

  return [
    "Je suis l'assistant Équitia (moteur local en démo — connectez Hugging Face pour des réponses IA complètes).",
    "Je peux vous renseigner sur : l'index d'égalité, les fourchettes salariales, le plan de rattrapage, le rapport de conformité, la directive 2023/970, l'import de données, le benchmark sectoriel et la connexion.",
    "Votre contexte actuel : " + contexteCourt,
    "Posez-moi une question précise, par exemple : « Comment améliorer mon score ? »",
  ].join("\n");
}
