import type { JeuDeDonnees } from "./types";

/**
 * Jeu de données de démonstration : entreprise fictive « Novamétal SAS »,
 * équipementier industriel français. Les écarts sont volontairement
 * marqués pour illustrer le moteur d'analyse. Les champs `augmentation`,
 * `promotion` et `congeMaternite` alimentent le calcul de l'index
 * d'égalité professionnelle complet.
 */
export const SAMPLE_DATA: JeuDeDonnees = {
  societe: {
    nom: "Novamétal SAS",
    siret: "512 345 678 00042",
    effectif: 286,
    exercice: "2025",
    codeNAF: "25.11Z",
  },
  employes: [
    // ---- Cadres ----
    { id: "E001", nom: "Marie Dupont", genre: "F", categorie: "Cadres", salaireAnnuel: 82000, poste: "Directrice R&D", anciennete: 12, age: 45, partVariable: 0.2, augmentation: true, promotion: false, congeMaternite: false },
    { id: "E002", nom: "Thomas Bernard", genre: "H", categorie: "Cadres", salaireAnnuel: 88500, poste: "Directeur R&D", anciennete: 9, age: 48, partVariable: 0.2, augmentation: true, promotion: false },
    { id: "E003", nom: "Claire Fontaine", genre: "F", categorie: "Cadres", salaireAnnuel: 63500, poste: "Cheffe de projet industriel", anciennete: 8, age: 39, partVariable: 0.15, augmentation: true, promotion: true },
    { id: "E004", nom: "Julien Moreau", genre: "H", categorie: "Cadres", salaireAnnuel: 66500, poste: "Chef de projet industriel", anciennete: 11, age: 41, partVariable: 0.15, augmentation: true, promotion: true },
    { id: "E005", nom: "Sophie Laurent", genre: "F", categorie: "Cadres", salaireAnnuel: 54800, poste: "Responsable qualité", anciennete: 6, age: 35, partVariable: 0.1, augmentation: true, promotion: true },
    { id: "E006", nom: "Nicolas Petit", genre: "H", categorie: "Cadres", salaireAnnuel: 59200, poste: "Responsable qualité", anciennete: 7, age: 38, partVariable: 0.1, augmentation: true, promotion: false },
    { id: "E007", nom: "Émilie Rousseau", genre: "F", categorie: "Cadres", salaireAnnuel: 46800, poste: "Ingénieure méthodes", anciennete: 4, age: 31, partVariable: 0.08, augmentation: false, promotion: false, congeMaternite: true },
    { id: "E008", nom: "Antoine Girard", genre: "H", categorie: "Cadres", salaireAnnuel: 50100, poste: "Ingénieur méthodes", anciennete: 5, age: 33, partVariable: 0.08, augmentation: true, promotion: true },
    { id: "E009", nom: "Camille Vincent", genre: "F", categorie: "Cadres", salaireAnnuel: 43800, poste: "Contrôleuse de gestion", anciennete: 3, age: 29, partVariable: 0.08, augmentation: true, promotion: false },
    { id: "E010", nom: "Luc Dubois", genre: "H", categorie: "Cadres", salaireAnnuel: 45200, poste: "Contrôleur de gestion", anciennete: 6, age: 34, partVariable: 0.08, augmentation: true, promotion: false },
    { id: "E011", nom: "Laura Mercier", genre: "F", categorie: "Cadres", salaireAnnuel: 39700, poste: "Chargée RH", anciennete: 3, age: 28, partVariable: 0.05, augmentation: true, promotion: false, congeMaternite: true },
    { id: "E012", nom: "David Roy", genre: "H", categorie: "Cadres", salaireAnnuel: 41400, poste: "Chargé RH", anciennete: 4, age: 30, partVariable: 0.05, augmentation: false, promotion: false },
    // ---- Agents de maîtrise ----
    { id: "E013", nom: "Nathalie Colin", genre: "F", categorie: "Agents de maîtrise", salaireAnnuel: 35400, poste: "Responsable d'atelier", anciennete: 9, age: 42, partVariable: 0.06, augmentation: true, promotion: false },
    { id: "E014", nom: "Sébastien Lemaire", genre: "H", categorie: "Agents de maîtrise", salaireAnnuel: 38100, poste: "Responsable d'atelier", anciennete: 12, age: 44, partVariable: 0.06, augmentation: true, promotion: true },
    { id: "E015", nom: "Isabelle Garnier", genre: "F", categorie: "Agents de maîtrise", salaireAnnuel: 31800, poste: "Animatrice qualité", anciennete: 5, age: 36, partVariable: 0.05, augmentation: true, promotion: false },
    { id: "E016", nom: "Christophe Faure", genre: "H", categorie: "Agents de maîtrise", salaireAnnuel: 33600, poste: "Animateur qualité", anciennete: 7, age: 39, partVariable: 0.05, augmentation: true, promotion: false },
    { id: "E017", nom: "Valérie Perrin", genre: "F", categorie: "Agents de maîtrise", salaireAnnuel: 28700, poste: "Responsable planning", anciennete: 4, age: 33, partVariable: 0.04, augmentation: false, promotion: false },
    { id: "E018", nom: "Franck Bonnet", genre: "H", categorie: "Agents de maîtrise", salaireAnnuel: 30500, poste: "Responsable planning", anciennete: 6, age: 37, partVariable: 0.04, augmentation: true, promotion: false },
    // ---- Techniciens ----
    { id: "E019", nom: "Élodie Masson", genre: "F", categorie: "Techniciens", salaireAnnuel: 27400, poste: "Technicienne qualité", anciennete: 5, age: 31, partVariable: 0.03, augmentation: true, promotion: false },
    { id: "E020", nom: "Laurent Olivier", genre: "H", categorie: "Techniciens", salaireAnnuel: 28900, poste: "Technicien qualité", anciennete: 8, age: 35, partVariable: 0.03, augmentation: true, promotion: false },
    { id: "E021", nom: "Manon Lambert", genre: "F", categorie: "Techniciens", salaireAnnuel: 24600, poste: "Technicienne maintenance", anciennete: 3, age: 27, partVariable: 0.03, augmentation: false, promotion: false },
    { id: "E022", nom: "Romain Henry", genre: "H", categorie: "Techniciens", salaireAnnuel: 26400, poste: "Technicien maintenance", anciennete: 6, age: 32, partVariable: 0.03, augmentation: true, promotion: false },
    { id: "E023", nom: "Julie Morel", genre: "F", categorie: "Techniciens", salaireAnnuel: 23100, poste: "Technicienne laboratoire", anciennete: 2, age: 26, partVariable: 0.02, augmentation: true, promotion: false },
    { id: "E024", nom: "Mathieu Caron", genre: "H", categorie: "Techniciens", salaireAnnuel: 24400, poste: "Technicien laboratoire", anciennete: 4, age: 30, partVariable: 0.02, augmentation: true, promotion: false },
    // ---- Employés ----
    { id: "E025", nom: "Sandrine Gay", genre: "F", categorie: "Employés", salaireAnnuel: 21500, poste: "Assistante administrative", anciennete: 10, age: 43, partVariable: 0.02, augmentation: false, promotion: false, congeMaternite: true },
    { id: "E026", nom: "Karim Benali", genre: "H", categorie: "Employés", salaireAnnuel: 22400, poste: "Assistant administratif", anciennete: 3, age: 29, partVariable: 0.02, augmentation: true, promotion: false },
    { id: "E027", nom: "Aurélie Chevalier", genre: "F", categorie: "Employés", salaireAnnuel: 20300, poste: "Secrétaire", anciennete: 7, age: 38, partVariable: 0.01, augmentation: false, promotion: false },
    { id: "E028", nom: "Olivier Renard", genre: "H", categorie: "Employés", salaireAnnuel: 21400, poste: "Secrétaire", anciennete: 2, age: 27, partVariable: 0.01, augmentation: true, promotion: false },
    { id: "E029", nom: "Hélène Fournier", genre: "F", categorie: "Employés", salaireAnnuel: 19800, poste: "Agent d'accueil", anciennete: 5, age: 34, partVariable: 0.01, augmentation: true, promotion: false, congeMaternite: true },
    { id: "E030", nom: "Vincent Marchand", genre: "H", categorie: "Employés", salaireAnnuel: 20100, poste: "Agent d'accueil", anciennete: 1, age: 25, partVariable: 0.01, augmentation: false, promotion: false },
    // ---- Ouvriers ----
    { id: "E031", nom: "Stéphanie André", genre: "F", categorie: "Ouvriers", salaireAnnuel: 23700, poste: "Opératrice de production", anciennete: 6, age: 37, partVariable: 0.02, augmentation: true, promotion: false },
    { id: "E032", nom: "Grégory Simon", genre: "H", categorie: "Ouvriers", salaireAnnuel: 24900, poste: "Opérateur de production", anciennete: 8, age: 36, partVariable: 0.02, augmentation: true, promotion: false },
    { id: "E033", nom: "Mélanie Blanc", genre: "F", categorie: "Ouvriers", salaireAnnuel: 22600, poste: "Cariste", anciennete: 4, age: 32, partVariable: 0.02, augmentation: false, promotion: false },
    { id: "E034", nom: "Pascal Denis", genre: "H", categorie: "Ouvriers", salaireAnnuel: 24100, poste: "Cariste", anciennete: 9, age: 40, partVariable: 0.02, augmentation: true, promotion: false },
    { id: "E035", nom: "Céline Garnier", genre: "F", categorie: "Ouvriers", salaireAnnuel: 21900, poste: "Opératrice conditionnement", anciennete: 3, age: 29, partVariable: 0.01, augmentation: false, promotion: false },
    { id: "E036", nom: "Hugo Lefebvre", genre: "H", categorie: "Ouvriers", salaireAnnuel: 23300, poste: "Opérateur conditionnement", anciennete: 5, age: 31, partVariable: 0.01, augmentation: true, promotion: false },
  ],
};
