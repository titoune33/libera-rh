/** Estimation des coûts LLM : ~4 caractères par token, prix par provider. */

import { PROVIDERS } from "./providers.js";
import type { ProviderId } from "./types.js";

export function estimerTokens(texte: string): number {
  // Approximation standard : 4 caractères ≈ 1 token (mix FR/EN/JSON).
  return Math.max(1, Math.ceil(texte.length / 4));
}

export function estimerCout(
  provider: ProviderId,
  tokensEntree: number,
  tokensSortie: number
): number {
  const p = PROVIDERS[provider];
  return (
    (tokensEntree / 1_000_000) * p.prixEntreeUsdParM +
    (tokensSortie / 1_000_000) * p.prixSortieUsdParM
  );
}

/** Coût d'entrée seul (pour le contrôle de budget AVANT l'appel). */
export function estimerCoutEntree(provider: ProviderId, tokensEntree: number): number {
  return (tokensEntree / 1_000_000) * PROVIDERS[provider].prixEntreeUsdParM;
}

export function formaterCout(usd: number): string {
  if (usd <= 0) return "0,00 $";
  if (usd < 0.01) return `${(usd * 100).toFixed(1)} ¢`;
  return `${usd.toFixed(2)} $`;
}
