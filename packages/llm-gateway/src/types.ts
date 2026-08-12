/** Types publics du LLM Gateway. */

export type ProviderId = "hf" | "deepseek" | "mistral" | "openrouter";

export type TaskType =
  | "chat"          // assistant conversationnel (défaut, gratuit via HF)
  | "reasoning"     // raisonnement / agent / codage → modèle fort
  | "execution"     // exécution à haut volume → modèle léger local
  | "multimodal"    // image/vidéo/audio en entrée
  | "prose";        // prose française premium

export interface ProviderConfig {
  id: ProviderId;
  nom: string;
  baseUrl: string;          // base OpenAI-compatible (…/v1)
  apiKeyEnv: string;        // nom de la variable d'environnement
  modeleParDefaut: string;  // id du modèle par défaut
  prixEntreeUsdParM: number; // USD par million de tokens en entrée
  prixSortieUsdParM: number; // USD par million de tokens en sortie
  requis?: boolean;         // false = provider optionnel (clé absente tolérée)
}

export interface CompleteOptions {
  prompt: string;
  system?: string;
  /** "auto" (défaut) = routage par tâche ; sinon id exact de modèle. */
  model?: string;
  task?: TaskType;
  /** Ordre de fallback des providers (défaut : routage puis hf). */
  providerOrder?: ProviderId[];
  maxTokens?: number;
  temperature?: number;
  /** Budget max par appel en USD — lève BudgetDepasseError si dépassé. */
  maxCostUsd?: number;
  /** Demande une sortie JSON (response_format json_object). */
  json?: boolean;
  /** Durée de vie du cache en ms (0 = pas de cache). Défaut : 10 min. */
  cacheTtlMs?: number;
  timeoutMs?: number;
}

export interface CompletionResult {
  texte: string;
  modele: string;
  provider: ProviderId;
  coutUsd: number;
  tokensEntree: number;
  tokensSortie: number;
  latenceMs: number;
  enCache: boolean;
  fallbackUtilise: boolean;
}

export class BudgetDepasseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetDepasseError";
  }
}

export interface ModeleInfo {
  id: string;
  fournisseur: string;
  tache: TaskType;
  indexIntelligence: number | null;
  prixEntreeUsdParM: number;
  prixSortieUsdParM: number;
  contexteTokens: number;
  note?: string;
}
