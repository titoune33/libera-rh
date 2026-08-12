/**
 * Table de routage du LLM Gateway.
 *
 * Données issues de datasets/benchmarks-llm (cf. repo ai-ecosystem) :
 * Artificial Analysis Intelligence Index v4.1.1, tarifs officiels, août 2026.
 */
import type { ModeleInfo, ProviderId, TaskType } from "./types.js";

export const MODELS: ModeleInfo[] = [
  {
    id: "deepseek-v4-flash-0731",
    fournisseur: "DeepSeek",
    tache: "reasoning",
    indexIntelligence: 52,
    prixEntreeUsdParM: 0.14,
    prixSortieUsdParM: 0.28,
    contexteTokens: 1_000_000,
    note: "Meilleur rapport intelligence/prix (rapport benchmark 11/08/2026).",
  },
  {
    id: "Qwen/Qwen3-4B-Instruct-2507",
    fournisseur: "Hugging Face (router gratuit)",
    tache: "chat",
    indexIntelligence: null,
    prixEntreeUsdParM: 0,
    prixSortieUsdParM: 0,
    contexteTokens: 32_000,
    note: "Modèle gratuit via Inference Providers — assistant intégré actuel.",
  },
  {
    id: "XiaomiMiMo/MiMo-V2.5-Pro",
    fournisseur: "Xiaomi (via HF)",
    tache: "multimodal",
    indexIntelligence: 38,
    prixEntreeUsdParM: 0,
    prixSortieUsdParM: 0,
    contexteTokens: 1_000_000,
    note: "Multimodal natif (texte/image/vidéo/audio), MIT.",
  },
  {
    id: "nvidia/nemotron-3.5-lightning",
    fournisseur: "NVIDIA (via OpenRouter)",
    tache: "execution",
    indexIntelligence: 24,
    prixEntreeUsdParM: 0.05,
    prixSortieUsdParM: 0.2,
    contexteTokens: 1_000_000,
    note: "Modèle d'exécution bas coût, recommandé en sous-agent.",
  },
  {
    id: "mistral-medium-3-5",
    fournisseur: "Mistral",
    tache: "prose",
    indexIntelligence: 30,
    prixEntreeUsdParM: 1.16,
    prixSortieUsdParM: 1.16,
    contexteTokens: 256_000,
    note: "Prose française premium (optionnel — ~20x plus cher que DeepSeek).",
  },
];

/** Modèle par tâche (défaut du routage "auto"). */
export const TACHE_PAR_DEFAUT: Record<TaskType, string> = {
  chat: "Qwen/Qwen3-4B-Instruct-2507",
  reasoning: "deepseek-v4-flash-0731",
  execution: "nvidia/nemotron-3.5-lightning",
  multimodal: "XiaomiMiMo/MiMo-V2.5-Pro",
  prose: "mistral-medium-3-5",
};

export function trouverModele(id: string): ModeleInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Résout le modèle pour un appel : "auto" → table de routage, sinon l'id exact. */
export function resoudreModele(model: string | undefined, task: TaskType): string {
  if (model && model !== "auto") return model;
  return TACHE_PAR_DEFAUT[task] ?? TACHE_PAR_DEFAUT.chat;
}

/** Sur quels providers un modèle peut-il être servi ? (ordre de préférence) */
export function providersPourModele(modele: string): ProviderId[] {
  if (modele.startsWith("deepseek") || modele === "deepseek-chat" || modele === "deepseek-reasoner") {
    return ["deepseek", "hf"];
  }
  if (modele.startsWith("mistral")) return ["mistral", "hf"];
  if (modele.startsWith("nvidia/")) return ["openrouter", "deepseek"];
  if (modele.startsWith("XiaomiMiMo")) return ["hf", "deepseek"];
  return ["hf", "deepseek"];
}
