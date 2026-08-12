# Libera RH — Plateforme RH IA

**Conformité salariale (directive UE 2023/970 · index Egapro) + benchmark salarial + module attrition — propulsé par un LLM Gateway unifié.**

> Ex-« Équilibre » / `equilibre-transparence-salariale`. Consolidation du cluster RH :
> TalentPulse (attrition) et PeoplePulse (analytics) ont été **absorbés** dans cette plateforme.

## 🧩 Modules

| Module | Description | Endpoint / page |
|---|---|---|
| **Conformité salariale** | Analyse des écarts, index d'égalité complet, rapport conforme (docx/xlsx), fourchettes salariales, plan de rattrapage | `/app` (tableau de bord, analyse, rapport…) |
| **Benchmark salarial** | Comparaison avec le marché (Airtable), export | `/api/benchmark` |
| **Attrition** (ex-TalentPulse) | Risque de départ par collaborateur, recommandations FR, stats d'équipe — scoring déterministe et explicable | `api/attrition.ts` + page « Risque de départ » |
| **Assistant IA** | Note de synthèse RH (constats / vigilance / actions) via le LLM Gateway | `api/assistant.ts` + widget chat |

## 🤖 LLM Gateway (`packages/llm-gateway`)

Passerelle LLM unifiée du portefeuille — une seule intégration pour tous les providers :

- **Routage par tâche** (données : `datasets/benchmarks-llm` d'`ai-ecosystem`) :
  - `chat` → Hugging Face Inference Providers (Qwen3-4B, **gratuit** — défaut)
  - `reasoning` → DeepSeek-V4-Flash-0731 (AA 52, 1M ctx, 0,14 $/M)
  - `execution` → NVIDIA Nemotron 3.5 Lightning (OpenRouter ou local)
  - `multimodal` → Xiaomi MiMo V2.5 Pro (via HF)
  - `prose` → Mistral Medium 3.5 (optionnel)
- **Fallback automatique** si le provider principal échoue
- **Budget max** par appel (USD), **cache 10 min** (prompts identiques → 0 coût)
- **Compteur global** de coûts par provider
- 18 tests (unitaires mockés + smoke test réel conditionnel)

```ts
import { llm } from "../../packages/llm-gateway/src/index.js";
const r = await llm.complete({ prompt, task: "reasoning" });
```

## 🚀 Démarrage

```bash
npm install
npm run dev          # app Vite (frontend)
npm run test         # vitest (48 tests)
npm run typecheck    # tsc app + api
npm run build        # build production
```

Variables d'environnement (jamais commitées — voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `HF_TOKEN` | Provider par défaut (gratuit) — assistant IA |
| `DEEPSEEK_API_KEY` | Routage `reasoning` (recommandé) |
| `MISTRAL_API_KEY` / `OPENROUTER_API_KEY` | Optionnels |
| `LIBERA_LLM_TASK` | `chat` (défaut, gratuit) ou `reasoning` (DeepSeek) |
| Airtable / Stripe / Resend / Gmail | Brique métier existante |

## 🧱 Stack

React 18 + Vite · API Vercel (TypeScript) · Airtable · Stripe · docx/xlsx · **llm-gateway** (packages/)

## 📊 Écosystème

Ce repo fait partie de l'écosystème [`ai-ecosystem`](https://github.com/titoune33/ai-ecosystem)
(inventaire, architecture, datasets publics : benchmarks LLM, corpus DRH, marchés publics).

## 📜 Licence

Code © 2026 titoune33. Les données publiques citées dans les benchmarks restent sous leurs licences d'origine (CC BY 4.0).
