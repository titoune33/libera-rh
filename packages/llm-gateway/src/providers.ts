/**
 * Providers LLM — tous compatibles OpenAI Chat Completions.
 * Les clés API sont lues dans l'environnement (jamais en dur).
 */
import type { ProviderConfig, ProviderId } from "./types.js";

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  hf: {
    id: "hf",
    nom: "Hugging Face Inference Providers",
    baseUrl: "https://router.huggingface.co/v1",
    apiKeyEnv: "HF_TOKEN",
    modeleParDefaut: "Qwen/Qwen3-4B-Instruct-2507",
    prixEntreeUsdParM: 0,
    prixSortieUsdParM: 0,
  },
  deepseek: {
    id: "deepseek",
    nom: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    modeleParDefaut: "deepseek-chat",
    prixEntreeUsdParM: 0.14,
    prixSortieUsdParM: 0.28,
  },
  mistral: {
    id: "mistral",
    nom: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKeyEnv: "MISTRAL_API_KEY",
    modeleParDefaut: "mistral-medium-3-5",
    prixEntreeUsdParM: 1.16,
    prixSortieUsdParM: 1.16,
    requis: false,
  },
  openrouter: {
    id: "openrouter",
    nom: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    modeleParDefaut: "nvidia/nemotron-3.5-lightning",
    prixEntreeUsdParM: 0.05,
    prixSortieUsdParM: 0.2,
    requis: false,
  },
};

export function cleDisponible(id: ProviderId): boolean {
  return Boolean(process.env[PROVIDERS[id].apiKeyEnv]);
}

export function providersDisponibles(): ProviderId[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).filter(
    (id) => cleDisponible(id) || (PROVIDERS[id].requis === false && id !== "hf")
  );
}
