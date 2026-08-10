# Équilibre — Positionnement concurrentiel

*Document de positionnement du SaaS « Équilibre » (conformité transparence salariale, directive UE 2023/970). Révisé le 10/08/2026.*

---

## 1. Le constat : un trou de marché

La directive (UE) 2023/970 est **en vigueur depuis le 7 juin 2026**. Elle crée trois obligations concrètes et datées :

1. **Fourchettes de rémunération** dans les offres d'emploi (art. 5) ;
2. **Droit d'information** des candidats et salariés (art. 7) ;
3. **Rapport annuel** sur l'écart de rémunération pour les entreprises de 100+ salariés (art. 9).

La plupart des États membres — dont la France — n'ont pas transposé dans les délais (Assessio, PwC) : les entreprises font face à une **obligation juridique sans cadre clair**, et donc sans outil dédié. Or les acteurs en place traitent la transparence salariale **en module annexe** de leur SIRH ou de leur logiciel de paie. Personne ne l'offre comme produit autonome et spécialisé, simple, pour PME-ETI.

---

## 2. Le marché adressable

| Marché | Taille | Source |
|---|---|---|
| SIRH France | ~6 Mds €, +12 %/an | Auxine Partners |
| Recrutement France | ~47 Mds € | Xerfi |
| Pay equity software (mondial) | ~1,9 Md $, +14 %/an | estimations marché |

La cible prioritaire : **PME-ETI françaises de 50 à 1 000 salariés**, qui n'ont ni le budget des suites « pay equity » internationales (Syndio démarre à plusieurs dizaines de milliers d'euros/an), ni la capacité d'intégrer un module SIRH coûteux.

---

## 3. Cartographie des concurrents

### International (pay equity natif)

| Acteur | Force | Faille exploitable |
|---|---|---|
| **Syndio** (US) | Leader mondial, analyse statistique poussée, grands comptes | Prix élevé (souvent > 50 k€/an), orienté US, onboarding long (semaines), pas de conformité UE/FR native |
| **beqom** (CH) | Compensation management + pay equity | Positionné « compensation », complexe à déployer, ETI+ |
| **PayAnalytics** (IS) | Modélisation statistique solide | Pas de rapport « prêt à publier » FR, pas d'index |
| **Mercer / Willis Towers Watson** | Données de marché riches | Vendent du conseil + outils lourds, pas un SaaS self-serve |
| **Payscale / Figures.hr** | Benchmark de salaires | Focus « market pricing », pas la conformité |

### Français (SIRH / paie avec module transparence)

| Acteur | Force | Faille exploitable |
|---|---|---|
| **PayFit** | Paie SMB, UX impeccable | Module égalité = reporting de base ; pas d'analyse à poste comparable, pas de fourchettes pour les offres, pas de benchmark sectoriel |
| **Factorial / Eurécia / Lucca** | SIRH complet PME | Même angle mort : la transparence salariale est un onglet parmi vingt ; aucune profondeur réglementaire UE |
| **Neobrain** | Talents & compétences FR | Pas de positionnement conformité salariale |
| **Elevo / GrafiQ / Apogea** | Pay equity FR naissant | Petits acteurs, souvent orientés conseil/accompagnement, peu de produit self-serve |

---

## 4. Le positionnement d'Équilibre

> **« Le logiciel de conformité transparence salariale pour les PME-ETI françaises — sans SIRH à remplacer, sans consultant, conforme en 30 minutes. »**

### Différenciateurs clés

1. **Spécialisation** : un seul problème (la directive 2023/970 + index FR), traité à fond. Les SIRH le traitent en annexe, les pay equity US le traitent pour les grands comptes.
2. **Zéro intégration** : import CSV depuis n'importe quel SIRH/paie. Aucun connecteur à négocier. C'est LA barrière des acteurs IA/SIRH : Équilibre s'en passe.
3. **Rapport prêt à publier** (Word/Excel/PDF) + **fourchettes pour les offres** + **plan de rattrapage chiffré** : le trio que demande concrètement la directive, livré en un clic.
4. **Confidentialité par défaut** : tout le calcul est client-side, aucune donnée de paie ne quitte le navigateur — argument décisif face à la sensibilité des données salariales.
5. **Prix simple** : 49 €/mois pour une PME de 250 salariés, contre des dizaines de milliers d'euros chez les acteurs internationaux.

### Pourquoi la concurrence ne peut pas répliquer vite

- Les SIRH (PayFit, Lucca…) ont une feuille de route remplie par la paie/le RH quotidien : la profondeur réglementaire UE n'est pas leur priorité, et l'abaisser casserait leur positionnement « tout-en-un ».
- Les acteurs pay equity internationaux sont vendus par cycle long aux grands comptes ; leur adapté au marché FR (index, IRP, transparence des offres) est coûteux.
- Le trou est **temporel** : la fenêtre réglementaire est ouverte maintenant, et le produit qui capture les 50-1000 salariés en premier gagne la référence du segment.

---

## 5. Recommandations d'exécution

1. **Fenêtre de 12 mois** : la directive est entrée en vigueur ; les premières sanctions et contrôles créeront l'urgence d'achat. Capitaliser avant que les SIRH ne sortent leurs modules.
2. **Go-to-market** : partenariats avec cabinets RH/comptables (les experts-comptables sont des prescripteurs naturels), contenu SEO sur « fourchettes salariales 2026 », « écart de rémunération obligation ».
3. **Feuille de route produit** : connecteurs (API) vers PayFit/Lucca quand le produit sera adopté — le CSV est la porte d'entrée, l'API le lock-in.
4. **Éviter** : le piège de l'« agent IA anti-admin » et du turnover prédictif pour le lancement — plus longs à vendre, plus complexes à intégrer.

---

## 6. Réponse à la question « Vercel frontend + backend ? »

**Oui.** Vercel héberge le frontend ET le backend dans un seul projet :

- **Frontend** : le site Vite actuel (fichiers statiques servis par le CDN Vercel) ;
- **Backend** : fonctions Serverless/Edge (routes `/api/*`) écrites en Node.js/TypeScript, ou un framework full-stack (Next.js, SvelteKit, Remix, Astro + adapters) qui mélange les deux dans le même dépôt ;
- **Base de données** : Vercel Postgres / Vercel KV / Neon / Supabase en complément.

Le tout est déployé en `git push` ou `vercel deploy`, avec previews par branche. C'est la stack « une seule plateforme » : pas de serveur à administrer, pas de second hébergeur.
