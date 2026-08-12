/** Cache mémoire simple avec TTL (prompts identiques → zéro coût). */

interface EntreeCache {
  resultat: unknown;
  expire: number;
}

const magasin = new Map<string, EntreeCache>();

/** Hash FNV-1a 32 bits — suffisant pour des clés de cache (pas de crypto). */
export function hashPrompt(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function cleCache(systeme: string, prompt: string, modele: string): string {
  return `${modele}|${hashPrompt(systeme)}|${hashPrompt(prompt)}`;
}

export function lireCache<T>(cle: string): T | null {
  const entree = magasin.get(cle);
  if (!entree) return null;
  if (Date.now() > entree.expire) {
    magasin.delete(cle);
    return null;
  }
  return entree.resultat as T;
}

export function ecrireCache<T>(cle: string, resultat: T, ttlMs: number): void {
  if (ttlMs <= 0) return;
  magasin.set(cle, { resultat, expire: Date.now() + ttlMs });
}

export function viderCache(): void {
  magasin.clear();
}

export function tailleCache(): number {
  return magasin.size;
}
