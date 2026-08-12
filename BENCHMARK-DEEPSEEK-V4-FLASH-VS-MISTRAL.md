# Benchmark : DeepSeek-V4-Flash-0731 vs Mistral — Rapport & Décision

> Rapport établi le **11 août 2026** à partir de sources publiques (Artificial Analysis, BenchLM, changelog officiel DeepSeek, site officiel Mistral). Aucun test local n'a été exécuté ; les chiffres proviennent de benchmarks tiers indépendants et de données officielles des éditeurs.

---

## 1. Vérification des noms de modèles

**Ta supposition est partiellement fausse — il n'existe pas de « Mistral 3.5 Large ».**

La gamme actuelle de Mistral (août 2026) :

| Modèle | Sortie | Taille | Contexte | Rôle |
|---|---|---|---|---|
| **Mistral Large 3** | Déc. 2025 | 675B (41B actifs) | ~128–262K | Flagship (le « gros » modèle) |
| **Mistral Medium 3.5** | Avril 2026 | 128B | 256K | Le modèle par défaut de Vibe pour la plupart des usages |
| **Mistral Small 4** | 2026 | — | 256K | Modèle léger économique |

Le « 3.5 » que tu avais en tête, c'est **Mistral Medium 3.5**, pas un « Large 3.5 ». Le flagship reste **Mistral Large 3** (décembre 2025). C'est aussi important à savoir : **quand tu utilises Vibe, tu parles en réalité le plus souvent à Mistral Medium** (selon la FAQ officielle de Mistral : « For most tasks and coding: Mistral Medium »), pas au Large.

De ton autre côté, **DeepSeek-V4-Flash-0731 existe bien** : c'est la version *officielle* (31 juillet 2026) de DeepSeek-V4-Flash, qui remplace la preview d'avril 2026. C'est un modèle open-weight (licence MIT) de 284B de paramètres (13B actifs) avec un contexte de **1M de tokens**.

---

## 2. Fiche DeepSeek-V4-Flash-0731

- **Date de sortie** : 31 juillet 2026 (release officielle, remplace la preview d'avril 2026 — même architecture, re-post-entraînement)
- **Architecture** : MoE 284B total / 13B actifs, open weights, licence MIT
- **Contexte** : 1 000 000 tokens (~1 500 pages A4)
- **Input image** : non (text-only)
- **Tarifs API officiels** : 0,14 $ / M tokens en entrée, 0,28 $ / M en sortie (cache hit : ~0,0028 $ / M)
- **Intelligence** (Artificial Analysis Intelligence Index v4.1.1, mode Reasoning Max Effort) : **52**
- **Vitesse** : ~131 tokens/s en sortie, 1,44 s avant premier token
- **Benchmarks agents officiels** (changelog DeepSeek, 31/07/2026) :
  - Terminal Bench 2.1 : **82,7**
  - NL2Repo : 54,2 — Cybergym : 76,7 — DeepSWE : 54,4
  - Toolathlon (vérifié) : 70,3 — Agent Last Exam : 25,2 — Automation Bench : 25,1
- **Réputation communautaire** : décrit comme « niveau Claude Opus 4.6 » sur les benchmarks agents, battant GLM 5.2 quasi partout (analyse de blog communautaire — à prendre avec précaution, ce n'est pas une donnée officielle DeepSeek)
- **À noter** : la release officielle de **DeepSeek-V4-Pro est annoncée « bientôt »** — le modèle va encore monter en gamme.

---

## 3. Fiche Mistral (ce que Vibe utilise vraiment)

### Mistral Large 3 (flagship, déc. 2025)
- MoE 675B (41B actifs), contexte ~128–262K
- **BenchAlign v5 (BenchLM) : 49,4** — le meilleur modèle Mistral, notamment le plus fort en multimodal (67) et maths (65)
- **Artificial Analysis Intelligence Index : ~16** (mesuré déc. 2025, sur une version plus ancienne de l'index) — très faible sur les évaluations agentiques/codage/raisonnement
- Points forts historiques : écriture de qualité, excellent en français (labo français), bon suivi d'instructions

### Mistral Medium 3.5 (avril 2026) — le modèle par défaut de Vibe
- 128B, contexte 256K, **accepte les images en entrée**
- Artificial Analysis Intelligence Index v4.1.1 : **30**
- Tarif API : ~1,16 $ / M tokens (moyenne pondérée) — ~20× plus cher que DeepSeek V4 Flash
- Vitesse : 147 tokens/s (plus rapide que DeepSeek)

### Mistral Small 4
- Artificial Analysis Intelligence Index : ~20 — modèle d'entrée de gamme

> ⚠️ **Écart entre les classements** : Artificial Analysis (index orienté agents/codage/raisonnement) place Mistral loin derrière (Large 3 ≈ 16, Medium 3.5 = 30) ; BenchLM (BenchAlign v5, plus orienté usage général/multimodal) place Large 3 à 49,4. Les deux indices ne mesurent pas la même chose. Pour l'**écriture académique française**, aucun de ces benchmarks ne tranche directement — c'est le point à tester empiriquement (voir §6).

---

## 4. Comparaison chiffrée (synthèse)

| Critère | DeepSeek-V4-Flash-0731 | Mistral Large 3 | Mistral Medium 3.5 |
|---|---|---|---|
| Intelligence (AA Index v4.1.1) | **52** | ~16* | 30 |
| BenchAlign v5 (BenchLM) | — | **49,4** | — |
| Contexte | **1M** | ~128–262K | 256K |
| Prix API (entrée/sortie par M) | **0,14 $ / 0,28 $** | 0,5 $ / 1,5 $ | ~1,16 $ (moyenne) |
| Input image | ❌ | ✅ | ✅ |
| Open weights | ✅ (MIT) | ❌ (fermé) | ✅ (licence modifiée) |
| Vitesse sortie | ~131 tok/s | — | ~147 tok/s |
| Agents / codage / raisonnement | **Très fort** | Moyen | Moyen |
| Écriture française native | Non mesuré | Réputation forte | Bonne |

\* Mesuré en déc. 2025 sur une version antérieure de l'index — à relativiser.

---

## 5. La vraie question : Freebuff + DeepSeek vs Vibe + Mistral

### Côté Vibe (l'appli Mistral, ex-Le Chat)
- **Plan étudiant (Education)** : **5,99 $/mois** (~5,90 €) au lieu de 14,99 $ — 60 % de réduction, vérification d'un email académique, **valable 12 mois maximum, réservé aux nouveaux utilisateurs** (donc attention : le « brûler » maintenant, c'est aussi griller ton tarif étudiant).
- **Vibe Work** : Canvas (documents, présentations), deep research, planification de tâches, workflows, connecteurs (Notion, Drive, Slack…), génération d'images (~40/jour).
- **Vibe Code** : CLI + plugin IDE (VS Code, JetBrains), propulsé par Devstral.
- **Limites concrètes** (source : page tarifs Mistral + retours utilisateurs) :
  - ~**150 messages/jour** en fair use (plafond souple mais réel)
  - 150 « Flash answers »/jour, 15 Go de stockage
  - **Vibe CLI : cap de tokens signalé ~20 000 tokens/jour** (issue GitHub #275) — c'est très probablement ce que tu as déjà « bousillé ».
  - Pay-as-you-go possible au-delà, mais au tarif API complet.

### Côté Freebuff + DeepSeek-V4-Flash-0731
- **Coût marginal ≈ 0** : le modèle est déjà intégré à l'appli. En API directe, il coûte 0,14 $/0,28 $ par M de tokens, soit **~20× moins cher que Mistral** — même un usage intensif revient à quelques centimes.
- **Pas de plafond quotidien** : la question « je n'ai plus de tokens » disparaît.
- **Contexte 1M** : tu peux y déverser tout un cours ou un corpus pour une dissertation sans découper.
- **Capacité brute supérieure** sur les évaluations indépendantes (52 vs 30/16) et les benchmarks agents officiels.
- Limite : pas d'input image et pas de génération d'images (pour les slides visuelles, Vibe garde un avantage).
- Bonus : DeepSeek-V4-Pro (encore plus fort) est annoncé « bientôt ».

---

## 6. Décision recommandée (pour ton profil : étudiant, dissertations, présentations, budget serré)

**→ Utilise Freebuff avec DeepSeek-V4-Flash-0731 comme outil principal.**

Raisons, dans l'ordre :

1. **Tes tokens Vibe sont déjà épuisés** — c'est le signal le plus fort. Tes plafonds (~20K tokens/jour en Vibe Code, ~150 messages/jour) ne correspondent pas à ton volume de travail. Sur Freebuff, cette contrainte n'existe pas.
2. **Rapport intelligence/prix écrasant** : 2× plus intelligent que Mistral Medium 3.5 sur les évaluations indépendantes (52 vs 30), pour ~20× moins cher. Une dissertation ou une analyse longue coûte des centimes.
3. **Contexte 1M** : idéal pour charger un cours complet, une bibliographie, ou relire une dissertation entière d'un bloc.
4. **C'est le modèle qui progresse le plus vite** : DeepSeek-V4-Pro (annoncé) arrivera bientôt dans la même famille.

**Ce que tu perds en n'utilisant que Freebuff :**
- L'**input image** (uploader des slides, des screenshots) et la **génération d'images** pour tes présentations — le vrai point fort de Vibe.
- L'**écosystème** Vibe Work (Canvas, deep research, connecteurs Notion/Drive…).
- L'assurance d'un **style académique français** de très haut niveau — la réputation historique de Mistral. Aucun benchmark indépendant ne mesure la qualité de la prose française, donc c'est le seul point qui reste à trancher empiriquement.

**Donc, si je devais trancher pour toi :**

- **Choix unique obligé → Freebuff + DeepSeek-V4-Flash-0731.** C'est le meilleur compromis intelligence / coût / volume pour tes dissertations et présentations, et tu ne te feras plus jamais couper en plein travail.
- **Si les 5,99 €/mois ne sont pas un problème** : garde le plan étudiant Vibe **en complément** (images, Canvas, polish final en français), mais ne l'utilise plus comme outil principal — et utilise-le avec parcimonie pour ne pas griller le quota quotidien. Sinon, **résilie-le et garde le plan gratuit** comme secours ponctuel : il suffit largement pour un usage occasionnel.
- **Dernière étape recommandée** : lance un vrai « combat » dans Freebuff entre DeepSeek-V4-Flash-0731 et Mistral Large 3 (ou Medium 3.5) sur un de tes vrais sujets de dissertation, en français. C'est le seul moyen de vérifier la qualité rédactionnelle française, que les benchmarks ne mesurent pas. Voir la conclusion.

---

## 7. Conclusion en une phrase

> **Passe sur Freebuff + DeepSeek-V4-Flash-0731 pour l'essentiel de ton travail : c'est plus intelligent, ~20× moins cher, sans plafond quotidien, et avec 4× plus de contexte. Garde Vibe uniquement si tu as vraiment besoin des images ou du Canvas — et dans ce cas, ne le résilie pas avant d'avoir fait un combat d'écriture en français pour valider ton choix définitif.**

---

## 8. Bonus (ajout du 12/08/2026) : OpenCode + NVIDIA Nemotron 3.5 Lightning

### Le modèle

- **NVIDIA Nemotron 3.5 Lightning** : sorti le **11/08/2026** (hier). MoE **30B total / 3B actifs** — le plus petit de la famille Nemotron 3.
- Positionné par NVIDIA comme le modèle d'**« exécution »** des agents longue durée : appels d'outils, validation de résultats, délégation de sous-agents, tâches répétitives à haut volume. NVIDIA recommande explicitement le **routage** : *le plan monte vers un modèle frontalier, l'exécution descend vers Lightning*.
- **Artificial Analysis Intelligence Index : 24** (+9 vs Nemotron 3 Nano = 15).
- Contexte **1M**, sortie max 64K, jusqu'à **4× plus rapide** que des modèles comparables (PinchBench : 86 % d'accuracy, 30 % plus rapide que Qwen3.6 35B à précision équivalente).
- **Tourne en local** : DGX Spark, RTX 5090, Jetson, via LM Studio, Ollama, llama.cpp. Open (OpenMDW-1.1 : poids + données + recettes), fine-tuning à moindre coût (CodeRabbit : ~100 $, 3 h).
- Tarif hébergé : ~0,05 $ / 0,20 $ par M de tokens (DeepInfra) ; **gratuit** sur OpenRouter en `nvidia/nemotron-3.5-lightning:free`.

### Le piège du tiers `:free` d'OpenRouter

- Gratuit et sans carte bancaire, mais **~20 requêtes/min et ~200 requêtes/jour** (limites standard des modèles `:free`, pool partagé).
- Or un agent de codage consomme **plusieurs appels API par tâche** (lecture, édition, exécution…). Le plafond se brûle donc très vite — c'est exactement le même problème que tes tokens Vibe, en pire.

### OpenCode

- Agent de codage **open-source (MIT)** qui tourne dans le terminal, dans la famille de Claude Code.
- 75+ fournisseurs de modèles, modèles locaux, modes plan/build, sous-agents. **Nemotron 3.5 Lightning est officiellement supporté** comme harnais.

### Verdict : non, ce n'est pas mieux que Freebuff + DeepSeek-V4-Flash-0731

| Critère | DeepSeek-V4-Flash-0731 | Nemotron 3.5 Lightning |
|---|---|---|
| AA Intelligence Index | **52** | 24 |
| Taille (params actifs) | 284B (13B) | 30B (3B) |
| Contexte | 1M | 1M |
| Rôle pensé pour | Modèle frontalier généraliste / agent | Modèle d'**exécution** à bas coût |
| Coût API | ~0,14 $ / 0,28 $ par M (≈ 0 via Freebuff) | 0,05 $ / 0,20 $ par M, ou `:free` plafonné |
| Plafond quotidien | Non (2 500 requêtes concurrentes) | 20 RPM / ~200 req/jour en `:free` |
| Usage local | Non réaliste | ✅ laptop GPU |

- Sur le même index indépendant, DeepSeek fait **plus du double** du score (52 vs 24). Pour tes dissertations, présentations et tout travail de réflexion, il n'y a pas de match.
- Le vrai créneau de Nemotron 3.5 Lightning est **l'inverse** du tien : de l'exécution mécanique à haut volume et bas coût (refactorings simples, génération de tests, tri de revues de code), idéal en local ou comme **sous-agent** d'un modèle frontalier.
- **L'idée la plus intéressante pour toi** : OpenCode n'est qu'un harnais (gratuit, open-source) et **supporte l'API DeepSeek**. Tu peux donc utiliser **OpenCode + DeepSeek-V4-Flash-0731** — un agent de codage terminal gratuit piloté par le modèle fort, sans avoir à choisir entre les deux.

## 9. Sources

- DeepSeek, changelog officiel API — release DeepSeek-V4-Flash-0731, 31/07/2026 : https://api-docs.deepseek.com/updates/
- DeepSeek, tarifs API officiels (0,14 $/0,28 $) : https://api-docs.deepseek.com/quick_start/pricing/ — confirmé par cloudzero.com (11/06/2026), benchlm.ai (31/07/2026)
- Artificial Analysis, comparaison DeepSeek V4 Flash 0731 vs Mistral Medium 3.5 (index v4.1.1) : https://artificialanalysis.ai/models/comparisons/deepseek-v4-flash-vs-mistral-medium-3-5
- Artificial Analysis, fiche Mistral Large 3 (index ≈ 16, déc. 2025) : https://artificialanalysis.ai/models/mistral-large-3
- BenchLM, classement des modèles Mistral (BenchAlign v5, 11/08/2026) : https://benchlm.ai/best/mistral-models
- Mistral, page tarifs (plan étudiant 5,99 $, limites Pro) : https://mistral.ai/pricing/
- Mistral Help Center, « Le Chat is now Vibe » (28/07/2026) : https://help.mistral.ai/en/articles/682992-le-chat-is-now-vibe
- GitHub mistral-vibe, issue #275 « Usage rate limits unclear » (~20K tokens/jour) : https://github.com/mistralai/mistral-vibe/issues/275
- Blog communautaire « Everything I Know About DeepSeek V4 Flash 0731 So Far » (01/08/2026) : https://blog.gopenai.com/everything-i-know-about-deepseek-v4-flash-0731-so-far-fceb50df8131
- NVIDIA, blog technique « Nemotron 3.5 Lightning Delivers Fast, Accurate Specialized Task Execution » (11/08/2026) : https://developer.nvidia.com/blog/nvidia-nemotron-3-5-lightning-delivers-fast-accurate-specialized-task-execution-for-long-running-agents/
- OpenRouter, fiche `nvidia/nemotron-3.5-lightning:free` (11/08/2026) : https://openrouter.ai/nvidia/nemotron-3.5-lightning:free
- Artificial Analysis, article de lancement Nemotron 3.5 Lightning (11/08/2026) : https://artificialanalysis.ai/articles/nemotron-3-5-lightning-launch
- OpenCode, documentation providers (75+ fournisseurs) : https://opencode.ai/docs/providers/
