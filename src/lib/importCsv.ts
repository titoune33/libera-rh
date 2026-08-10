import { CATEGORIES, type Categorie, type Employe } from "./types";

export interface ErreurImport {
  ligne: number;
  message: string;
}

export interface ResultatImport {
  employes: Employe[];
  erreurs: ErreurImport[];
  ignorees: number;
}

export const TEMPLATE_CSV = `nom,genre,categorie,salaire_annuel,poste,anciennete,age,part_variable,augmentation,promotion,conge_maternite
Dupont Marie,F,Cadres,82000,Directrice R&D,12,45,0.2,1,0,0
Bernard Thomas,H,Cadres,88500,Directeur R&D,9,48,0.2,1,0,0
Fontaine Claire,F,Employés,21500,Assistante administrative,10,43,0.02,0,0,1
`;

const SYNONYMES_CATEGORIES: Record<string, Categorie> = {
  cadres: "Cadres",
  cadre: "Cadres",
  "agent de maitrise": "Agents de maîtrise",
  "agents de maitrise": "Agents de maîtrise",
  "agent de maîtrise": "Agents de maîtrise",
  agents: "Agents de maîtrise",
  am: "Agents de maîtrise",
  techniciens: "Techniciens",
  technicien: "Techniciens",
  employes: "Employés",
  employe: "Employés",
  employés: "Employés",
  ouvriers: "Ouvriers",
  ouvrier: "Ouvriers",
};

function normaliserCategorie(raw: string): Categorie | null {
  const cle = raw.trim().toLowerCase();
  if (CATEGORIES.includes(cle as Categorie)) return cle as Categorie;
  return SYNONYMES_CATEGORIES[cle] ?? null;
}

function stripQuotes(v: string): string {
  v = v.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/""/g, '"');
  }
  return v;
}

/**
 * Parser CSV simple sans dépendance : gère les séparateurs `;` et `,`
 * ainsi que les champs entre guillemets doubles.
 */
export function parseCSV(texte: string): string[][] {
  const lignes: string[][] = [];
  let champ = "";
  let dansGuillemets = false;
  let ligne: string[] = [];

  const terminerChamp = () => {
    ligne.push(stripQuotes(champ));
    champ = "";
  };
  const terminerLigne = () => {
    terminerChamp();
    if (ligne.some((v) => v.length > 0)) lignes.push(ligne);
    ligne = [];
  };

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          champ += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        champ += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === "," || c === ";") {
      terminerChamp();
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      terminerLigne();
    } else {
      champ += c;
    }
  }
  // Dernière ligne / champ sans retour à la ligne final
  if (champ.length > 0 || ligne.length > 0) terminerLigne();

  return lignes;
}

/** Correspondance colonnes → champs Employe. */
const ALIASES: Record<string, keyof Omit<Employe, "id"> | "salaire" | "part"> = {
  nom: "nom",
  genre: "genre",
  sexe: "genre",
  categorie: "categorie",
  categorie_pro: "categorie",
  csp: "categorie",
  salaire_annuel: "salaire",
  salaire: "salaire",
  salaire_annuel_brut: "salaire",
  brut_annuel: "salaire",
  remuneration: "salaire",
  poste: "poste",
  emploi: "poste",
  intitule_poste: "poste",
  anciennete: "anciennete",
  anciennete_annees: "anciennete",
  age: "age",
  part_variable: "part",
  part_variable_pct: "part",
  augmentation: "augmentation",
  augmentation_individuelle: "augmentation",
  promotion: "promotion",
  promu: "promotion",
  conge_maternite: "congeMaternite",
  conge_maternite_retour: "congeMaternite",
  retour_conge_maternite: "congeMaternite",
};

/** Convertit une valeur CSV 1/0/oui/non/vide en booléen optionnel (vide = inconnu). */
function booleenOptionnel(v: string): boolean | undefined {
  const t = v.trim().toLowerCase();
  if (t === "") return undefined;
  if (t === "non" || t === "n" || t === "0" || t === "false") return false;
  if (t === "oui" || t === "o" || t === "1" || t === "true") return true;
  return undefined;
}

export function importerCSV(texte: string): ResultatImport {
  const lignes = parseCSV(texte);
  const erreurs: ErreurImport[] = [];
  const employes: Employe[] = [];
  let ignorees = 0;

  if (lignes.length < 2) {
    return {
      employes,
      erreurs: [{ ligne: 0, message: "Le fichier est vide ou ne contient que l'en-tête." }],
      ignorees,
    };
  }

  const header = lignes[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const indexColonne = (nom: string): number => {
    const alias = ALIASES[nom];
    if (!alias) return -1;
    const idx = header.indexOf(nom);
    if (idx >= 0) return idx;
    return header.findIndex((h) => ALIASES[h] === alias);
  };

  const iNom = indexColonne("nom");
  const iGenre = indexColonne("genre");
  const iCat = indexColonne("categorie");
  const iSalaire = indexColonne("salaire_annuel");
  const iPoste = indexColonne("poste");
  const iAnc = indexColonne("anciennete");
  const iAge = indexColonne("age");
  const iPart = indexColonne("part_variable");
  const iAug = indexColonne("augmentation");
  const iProm = indexColonne("promotion");
  const iMaternite = indexColonne("conge_maternite");

  for (const [nom, idx] of [
    ["nom", iNom],
    ["genre", iGenre],
    ["categorie", iCat],
    ["salaire_annuel", iSalaire],
  ] as const) {
    if (idx < 0) erreurs.push({ ligne: 1, message: `Colonne obligatoire introuvable : « ${nom} ».` });
  }
  if (erreurs.length > 0) return { employes, erreurs, ignorees };

  for (let l = 1; l < lignes.length; l++) {
    const ligne = lignes[l];
    const get = (idx: number): string => (idx >= 0 && idx < ligne.length ? ligne[idx] : "");

    const nom = get(iNom);
    const genreRaw = get(iGenre).trim().toUpperCase();
    const catRaw = get(iCat);
    const salaireRaw = get(iSalaire).trim().replace(/\s/g, "").replace(/€/g, "").replace(",", ".");

    if (!nom && !salaireRaw) {
      ignorees++;
      continue;
    }

    const genre: Employe["genre"] | null =
      genreRaw === "F" || genreRaw === "FEMME" || genreRaw === "FÉMININ"
        ? "F"
        : genreRaw === "H" || genreRaw === "HOMME" || genreRaw === "M" || genreRaw === "MASCULIN"
          ? "H"
          : null;
    const categorie = normaliserCategorie(catRaw);
    const salaire = Number(salaireRaw);
    const anciennete = Number(get(iAnc) || "0");
    const age = Number(get(iAge) || "0");
    const partRaw = get(iPart).replace(",", ".");
    const part = partRaw ? Math.min(1, Math.max(0, Number(partRaw))) : 0;

    const errsLigne: string[] = [];
    if (!genre) errsLigne.push("genre invalide (attendu F ou H)");
    if (!categorie) errsLigne.push(`catégorie « ${catRaw} » inconnue`);
    if (!Number.isFinite(salaire) || salaire <= 0) errsLigne.push("salaire invalide");

    if (errsLigne.length > 0) {
      erreurs.push({ ligne: l + 1, message: errsLigne.join(" ; ") });
      continue;
    }

    employes.push({
      id: `IMP-${l}`,
      nom: nom || "Sans nom",
      genre: genre!,
      categorie: categorie!,
      salaireAnnuel: salaire,
      poste: get(iPoste) || "Poste non renseigné",
      anciennete: Number.isFinite(anciennete) ? anciennete : 0,
      age: Number.isFinite(age) ? age : 0,
      partVariable: Number.isFinite(part) ? part : 0,
      augmentation: iAug >= 0 ? booleenOptionnel(get(iAug)) : undefined,
      promotion: iProm >= 0 ? booleenOptionnel(get(iProm)) : undefined,
      congeMaternite: iMaternite >= 0 ? booleenOptionnel(get(iMaternite)) : undefined,
    });
  }

  return { employes, erreurs, ignorees };
}

/** Télécharge le modèle CSV de paie. */
export function telechargerTemplate(): void {
  const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-paie-transparence-salariale.csv";
  a.click();
  URL.revokeObjectURL(url);
}
