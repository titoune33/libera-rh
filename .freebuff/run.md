# Run doc — Équilibre (SaaS transparence salariale)

Projet Vite + React 18 + TypeScript dans `/Users/titouanwajda/freebuf`.
SaaS de conformité transparence salariale (directive UE 2023/970, index d'égalité FR).

## Comment reproduire les artefacts

Aucun fichier d'environnement n'est requis (pas de `.env.local`, pas de secrets).
Les données de démonstration sont embarquées dans `src/lib/sampleData.ts`.

```bash
cd /Users/titouanwajda/freebuf
npm install            # installe react, react-dom, vite, typescript
```

- `npm install` exécute le script postinstall d'esbuild : si npm le bloque
  (`allow-scripts`), approuver avec `npm approve-scripts esbuild` puis
  `npm rebuild esbuild` — sinon Vite échoue au démarrage.
- `npm run typecheck` — vérification TypeScript (strict).
- `npm run build` — build de production dans `dist/`.

## Comment lancer le serveur

Serveur de dev Vite, port **5173** (libre, strictPort).

### Méthode recommandée (daemon qui survit aux sessions shell)

Le shell de cet environnement tue les processus enfants à la fin de chaque
commande, y compris avec `nohup`/`disown`. Utiliser le script de daemonisation :

```bash
cd /Users/titouanwajda/freebuf
python3 .freebuff/start-dev.py < /dev/null > /dev/null 2>&1
```

- Le serveur écoute sur `http://localhost:5173/`.
- Le PID est écrit dans `.freebuff/dev.pid` ; les logs dans
  `.freebuff/preview-5c11254c-825e-4baa-a18c-680a46b4707f.log`.
- Arrêt : `kill "$(cat .freebuff/dev.pid)"` (le processus npm) ou tuer le
  listener node sur le port 5173.

### Méthode directe (session shell interactive)

```bash
cd /Users/titouanwajda/freebuf && npm run dev -- --port 5173 --strictPort
```

### Vérification

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/   # attendu : 200
```

## Déploiement Vercel

Projet déployé (compte Vercel : `titouwajd`) :

- **Production** : https://freebuf.vercel.app (alias de
  `freebuf-p8t32hvd3-titouwajds-projects.vercel.app`)
- **Preview par branche** : générées automatiquement par `vercel` sur chaque
  push/lien.
- Config : `vercel.json` (build `npm run build`, output `dist/`, rewrite
  SPA `/((?!api/).*) → /index.html` pour que `/app` fonctionne en statique
  SANS intercepter les routes `/api/*`).
- Re-déployer la production :

  ```bash
  cd /Users/titouanwajda/freebuf && vercel --prod --yes
  ```

### Backend (fonctions Serverless dans `api/`)

| Route | Rôle | Dépend des env vars |
|---|---|---|
| `GET /api/health` | État du service + intégrations configurées | — |
| `POST /api/assistant` | Note de synthèse IA via Hugging Face (Inference Providers, gratuit) | `HF_TOKEN`, `HF_MODEL` (défaut `Qwen/Qwen3-4B-Instruct-2507`) |
| `GET/POST /api/sauvegarde` | Sauvegarde/lecture des jeux de données dans Airtable (upsert) | `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE` (défaut `Sauvegardes`) |

Typecheck du backend : `tsc -p tsconfig.api.json` (inclus dans `npm run typecheck`).

Sans ces variables, les fonctions répondent en 503 avec des instructions et
l'application bascule en mode local (générateur de note hors-ligne, aucune
sauvegarde cloud) — l'expérience reste complète.

## GitHub + CI + previews

- **Dépôt** : https://github.com/titoune33/equilibre-transparence-salariale (privé, branch `main`)
- **CI** : `.github/workflows/ci.yml` — npm ci, typecheck (frontend + api), tests Vitest, build, sur chaque push/PR.
  ⚠️ Ne PAS monter vitest à la major 4 : il tire vite 8 + esbuild 0.28 dont le
  lock devient incohérent avec la politique npm locale (allowScripts).
  Utiliser vitest 2.x (compatible vite 5).
- **Previews Vercel par branche** : le projet est connecté à GitHub
  (`vercel git connect https://github.com/titoune33/...`). Chaque push de
  branche crée une preview ; `main` déploie la production.
- Rappel : pousser/redéployer = `git push` (auto) ou `vercel --prod --yes`.

## Authentification multi-comptes

- Endpoints : `api/auth/{inscription,connexion,etat,deconnexion}` ; session
  httpOnly `equilibre_session` (30 j, cookie SameSite=Lax, Secure en prod).
- Tables Airtable (base TalentPulse) : `Utilisateurs` (email, nom,
  mot_de_passe scrypt sel:hash, cree_le) et `Sessions` (token, email,
  expire_le). `Sauvegardes` porte un champ `email` : chaque compte ne voit
  que ses propres sauvegardes (filtre serveur, 401 si non connecté).
- L'app fonctionne en « mode invité » sans compte ; la connexion est requise
  pour la sauvegarde cloud. En dev local (pas de /api), tout bascule en mode
  invité automatiquement.

## Incidents notables

- **10/08/2026 — perte du workspace** : `/Users/titouanwajda/freebuf` a été
  vidé (seul `.vite` restait). Récupéré intégralement depuis GitHub
  (clone). Leçon : pousser régulièrement ; le repo distant est la source de
  vérité. `tsconfig.tsbuildinfo` n'est plus versionné.

### Variables d'environnement (configurées le 10/08/2026)

1. `HF_TOKEN` — token gratuit https://huggingface.co/settings/tokens (permission « Make calls to Inference Providers ») — **configuré**
2. `AIRTABLE_TOKEN` — Personal Access Token Airtable (lecture/écriture) — **configuré**
3. `AIRTABLE_BASE_ID` = `app4Zc99qp0nMqdo7` (base **TalentPulse**) — **configuré**
4. `AIRTABLE_TABLE` (optionnel) — table `Sauvegardes` créée dans TalentPulse (champs : `id`, `nom`, `exercice`, `payload` [JSON], `maj`) — défaut OK

Changer une valeur : `vercel env rm NAME production` puis re-ajout, ou dashboard
Vercel → Settings → Environment Variables. Re-déployer ensuite
(`vercel --prod --yes`).

⚠️ L'ancien endpoint Hugging Face `api-inference.huggingface.co` est HORS
SERVICE (nov. 2025). La fonction utilise `router.huggingface.co/v1/chat/completions`
(routeur Inference Providers, compatible OpenAI). Aucun modèle Mistral n'est
disponible sur ce routeur : défaut `Qwen/Qwen3-4B-Instruct-2507` (gratuit,
multilingue), surchargeable via `HF_MODEL`.

## Notes

- L'app fonctionne 100 % côté client : les données de paie importées restent
  dans le navigateur (aucun backend, aucune téléversement).
- Points d'entrée : `src/main.tsx` → `src/App.tsx` (routeur) ; la landing page
  est `src/components/LandingPage.tsx` (styles `src/styles/landing.css`),
  l'app dans `src/AppShell.tsx`.
- Moteur de calcul : `src/lib/engine.ts` ; conformité (obligations/sanctions) :
  `src/lib/conformite.ts` ; benchmark sectoriel : `src/lib/benchmark.ts` ;
  benchmark salarial de marché : `src/lib/marcheSalarial.ts` ; index complet :
  `src/lib/indexFrancais.ts` ; simulateur de rattrapage :
  `src/lib/planRattrapage.ts` ; note IA locale : `src/lib/assistantLocal.ts` ;
  exports Word/Excel : `src/lib/exportDocx.ts` et `src/lib/exportXlsx.ts`.
- Positionnement concurrentiel : `docs/positionnement.md`.
