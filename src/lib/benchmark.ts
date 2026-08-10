import type { ResultatAnalyse } from "./types";
import { formatPct } from "./engine";

export interface ReferenceSectorielle {
  code: string;
  secteur: string;
  /** Écart moyen femmes-hommes de référence (en %) dans le secteur. */
  ecartReferencePct: number;
  note: string;
}

/**
 * Écarts de rémunération femmes-hommes de référence par grand secteur
 * (ordre de grandeur européen/France, source : INSEE/Eurostat, méthodologie
 * « écart de salaire net en ETP »). Utilisé pour positionner l'entreprise.
 */
export const REFERENCES_SECTORIELLES: ReferenceSectorielle[] = [
  { code: "C", secteur: "Industrie manufacturière", ecartReferencePct: 14.1, note: "INSEE — salaire net annuel ETP" },
  { code: "F", secteur: "Construction", ecartReferencePct: 16.2, note: "INSEE — salaire net annuel ETP" },
  { code: "G", secteur: "Commerce", ecartReferencePct: 11.8, note: "INSEE — salaire net annuel ETP" },
  { code: "H", secteur: "Transports et entreposage", ecartReferencePct: 14.6, note: "INSEE — salaire net annuel ETP" },
  { code: "I", secteur: "Hébergement et restauration", ecartReferencePct: 9.4, note: "INSEE — salaire net annuel ETP" },
  { code: "J", secteur: "Information et communication", ecartReferencePct: 15.3, note: "INSEE — salaire net annuel ETP" },
  { code: "K", secteur: "Activités financières et d'assurance", ecartReferencePct: 19.6, note: "INSEE — salaire net annuel ETP" },
  { code: "M", secteur: "Activités spécialisées, scientifiques et techniques", ecartReferencePct: 14.2, note: "INSEE — salaire net annuel ETP" },
  { code: "N", secteur: "Activités de services administratifs et de soutien", ecartReferencePct: 9.6, note: "INSEE — salaire net annuel ETP" },
  { code: "O", secteur: "Administration publique", ecartReferencePct: 11.5, note: "INSEE — salaire net annuel ETP" },
  { code: "P", secteur: "Enseignement", ecartReferencePct: 10.3, note: "INSEE — salaire net annuel ETP" },
  { code: "Q", secteur: "Santé humaine et action sociale", ecartReferencePct: 8.7, note: "INSEE — salaire net annuel ETP" },
];

export interface ComparaisonSectorielle {
  secteur: ReferenceSectorielle | null;
  ecartEntreprisePct: number;
  ecartReferencePct: number | null;
  deltaPct: number | null; // entreprise - référence (positif = l'entreprise est au-dessus de la référence)
  position: "meilleure" | "conforme" | "au-dessus" | null;
}

export function trouverSecteur(codeNAF: string | undefined): ReferenceSectorielle | null {
  if (!codeNAF) return null;
  const code = codeNAF.trim().toUpperCase();
  // Le code NAF commence par une lettre (section) suivie de chiffres.
  const section = code.charAt(0);
  return REFERENCES_SECTORIELLES.find((r) => r.code === section) ?? null;
}

export function comparerSecteur(resultat: ResultatAnalyse, codeNAF?: string): ComparaisonSectorielle {
  const secteur = trouverSecteur(codeNAF);
  const ecartEntreprise = Math.abs(resultat.global.ecartMoyenPct);
  if (!secteur) {
    return { secteur: null, ecartEntreprisePct: ecartEntreprise, ecartReferencePct: null, deltaPct: null, position: null };
  }
  const delta = ecartEntreprise - secteur.ecartReferencePct;
  const position = delta < -3 ? "meilleure" : delta <= 1 ? "conforme" : "au-dessus";
  return {
    secteur,
    ecartEntreprisePct: ecartEntreprise,
    ecartReferencePct: secteur.ecartReferencePct,
    deltaPct: delta,
    position,
  };
}

export { formatPct };
