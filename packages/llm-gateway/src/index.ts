/**
 * LLM Gateway — passerelle unifiée du portefeuille Libera RH.
 *
 * Une seule intégration pour tous les providers (DeepSeek, Mistral,
 * Hugging Face Inference Providers, OpenRouter), avec :
 *  - routage automatique par tâche (table issue de datasets/benchmarks-llm)
 *  - fallback automatique si le provider principal échoue
 *  - budget max par appel (USD)
 *  - cache mémoire à TTL (prompts identiques → 0 coût)
 *  - coûts estimés et latence dans la réponse
 *
 * Usage :
 *   import { llm } from "../../packages/llm-gateway/src/index.js";
 *   const r = await llm.complete({ prompt, task: "reasoning" });
 */
import { lireCache, ecrireCache, cleCache, viderCache, tailleCache } from "./cache.js";
import { estimerCout, estimerCoutEntree, estimerTokens, formaterCout } from "./costs.js";
import { providersPourModele, resoudreModele, trouverModele } from "./routing.js";
import { PROVIDERS, providersDisponibles } from "./providers.js";
import {
  BudgetDepasseError,
  type CompleteOptions,
  type CompletionResult,
  type ProviderId,
} from "./types.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 min
const DEFAULT_TIMEOUT_MS = 55_000;

interface ReponseChat {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

async function appelerProvider(
  provider: ProviderId,
  modele: string,
  systeme: string,
  prompt: string,
  options: Required<Pick<CompleteOptions, "maxTokens" | "temperature" | "json" | "timeoutMs">>
): Promise<{ texte: string; tokensEntree: number; tokensSortie: number }> {
  const cfg = PROVIDERS[provider];
  const token = process.env[cfg.apiKeyEnv];
  if (!token) throw new Error(`Clé ${cfg.apiKeyEnv} manquante pour ${cfg.nom}.`);

  const messages = [
    ...(systeme.trim() ? [{ role: "system" as const, content: systeme }] : []),
    { role: "user" as const, content: prompt },
  ];

  const rep = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(provider === "openrouter" ? { "HTTP-Referer": "https://libera-rh.vercel.app", "X-Title": "Libera RH" } : {}),
    },
    body: JSON.stringify({
      model: modele,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: false,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(options.timeoutMs),
  });

  const data = (await rep.json().catch(() => null)) as ReponseChat | null;
  if (!rep.ok) {
    const msg = data?.error?.message ?? `Réponse ${rep.status}`;
    throw new Error(`[${cfg.nom}] ${msg}`);
  }
  if (!data) throw new Error(`[${cfg.nom}] Réponse illisible.`);
  const texte = data.choices?.[0]?.message?.content?.trim();
  if (!texte) throw new Error(`[${cfg.nom}] Réponse vide.`);
  return {
    texte,
    tokensEntree: data.usage?.prompt_tokens ?? estimerTokens(systeme + prompt),
    tokensSortie: data.usage?.completion_tokens ?? estimerTokens(texte),
  };
}

/** État global : coûts cumulés par provider (exporté pour dashboards). */
export const compteur = {
  appels: 0,
  coutTotalUsd: 0,
  parProvider: {} as Record<ProviderId, number>,
};

export const llm = {
  /** Effectue une complétion avec routage, fallback, budget et cache. */
  async complete(options: CompleteOptions): Promise<CompletionResult> {
    const task = options.task ?? "chat";
    const modele = resoudreModele(options.model, task);
    const systeme = options.system ?? "";
    const prompt = options.prompt;

    // 1. Budget : contrôle AVANT l'appel sur le coût d'entrée estimé.
    if (options.maxCostUsd != null && options.maxCostUsd > 0) {
      const provPrimaire = providersPourModele(modele)[0] as ProviderId;
      const coutEntree = estimerCoutEntree(provPrimaire, estimerTokens(systeme + prompt));
      if (coutEntree > options.maxCostUsd) {
        throw new BudgetDepasseError(
          `Budget dépassé avant appel : ${formaterCout(coutEntree)} > ${formaterCout(options.maxCostUsd)} (modèle ${modele}).`
        );
      }
    }

    // 2. Cache (si TTL > 0).
    const ttl = options.cacheTtlMs ?? DEFAULT_TTL_MS;
    const cle = cleCache(systeme, prompt, modele);
    if (ttl > 0) {
      const enCache = lireCache<CompletionResult>(cle);
      if (enCache) return { ...enCache, enCache: true };
    }

    // 3. Ordre des providers : explicite → routage par modèle → repli hf.
    const ordre = options.providerOrder ?? providersPourModele(modele);
    const ordreFiltre = ordre.filter((p) => providersDisponibles().includes(p));
    if (ordreFiltre.length === 0) {
      throw new Error("Aucun provider configuré (clés API manquantes).");
    }

    // 4. Appel avec fallback.
    const debut = Date.now();
    let dernierErreur: Error | null = null;
    let texte = "";
    let tokensEntree = 0;
    let tokensSortie = 0;
    let providerUtilise: ProviderId = ordreFiltre[0];
    let fallback = false;

    for (let i = 0; i < ordreFiltre.length; i++) {
      const p = ordreFiltre[i];
      try {
        const res = await appelerProvider(p, modele, systeme, prompt, {
          maxTokens: options.maxTokens ?? 700,
          temperature: options.temperature ?? 0.3,
          json: options.json ?? false,
          timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        });
        texte = res.texte;
        tokensEntree = res.tokensEntree;
        tokensSortie = res.tokensSortie;
        providerUtilise = p;
        fallback = i > 0;
        break;
      } catch (err) {
        dernierErreur = err instanceof Error ? err : new Error(String(err));
        if (i === ordreFiltre.length - 1) {
          throw dernierErreur;
        }
      }
    }

    const latenceMs = Date.now() - debut;
    const coutUsd = estimerCout(providerUtilise, tokensEntree, tokensSortie);

    // 5. Compteurs globaux.
    compteur.appels += 1;
    compteur.coutTotalUsd += coutUsd;
    compteur.parProvider[providerUtilise] =
      (compteur.parProvider[providerUtilise] ?? 0) + coutUsd;

    const resultat: CompletionResult = {
      texte,
      modele,
      provider: providerUtilise,
      coutUsd,
      tokensEntree,
      tokensSortie,
      latenceMs,
      enCache: false,
      fallbackUtilise: fallback,
    };

    if (ttl > 0) ecrireCache(cle, resultat, ttl);
    return resultat;
  },

  /** Modèle qui serait utilisé pour une tâche donnée (sans appeler). */
  modelePour(task: Parameters<typeof resoudreModele>[1]): string {
    return resoudreModele("auto", task);
  },

  /** Infos d'un modèle (table de routage). */
  fiche(modele: string) {
    return trouverModele(modele);
  },

  formaterCout,
  viderCache,
  tailleCache,
};

export { BudgetDepasseError } from "./types.js";
export type { CompleteOptions, CompletionResult, ProviderId, TaskType } from "./types.js";
