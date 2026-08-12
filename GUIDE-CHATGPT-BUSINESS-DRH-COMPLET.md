# ChatGPT Business — Le manuel complet pour une DRH externalisée
**Édition d'août 2026 · vérifiée sur les sources officielles OpenAI (notes de version, learn.chatgpt.com, openai.com)**

> Ce manuel est le complément du guide 2 pages. Il est volontairement long : il couvre tout — l'architecture, la méthode, la banque de prompts, les scénarios pas à pas, les pièges et les garde-fous. La version 2 pages sert de mémo rapide ; celle-ci sert de référence.

---

## Sommaire

1. Le décor : l'état du monde en août 2026
2. L'architecture en profondeur (Chat, Work, Codex, modes local/Cloud, plugins, économie d'usage)
3. La méthode : le brief en 6 points et le pilotage d'un travail
4. L'architecture multi-clients : le cœur du sujet
5. La banque de prompts (9 domaines, 40+ prompts)
6. Cinq scénarios complets pas à pas
7. Les pièges classiques et leurs antidotes
8. Garde-fous et conformité
9. Glossaire
10. Sources et mise à jour

---

## 1. Le décor : l'état du monde en août 2026

Trois faits récents structurent tout ce qui suit. Ils datent de 2026, et la plupart des formations n'en parlent pas encore :

1. **ChatGPT Work existe (lancé le 9 juillet 2026).** Work est un agent de production : il recherche, analyse, travaille sur tes fichiers et tes applications connectées, et livre des documents finis (Word, Excel, PowerPoint, rapports, Sites). Tu suis sa progression, tu réponds à ses questions, tu changes de direction en cours de route, tu **approuves** les actions importantes. On ne « prompte » plus : on **briefe**, comme on briefe un prestataire.
2. **Chat, Work et Codex sont réunis dans une seule app de bureau** (macOS/Windows, refonte du 16 juillet 2026). Un sélecteur global passe de l'un à l'autre. Les Projects y sont intégrés. Les conversations Work en mode Cloud se synchronisent entre le web, le mobile et le bureau.
3. **Les Custom GPT sont en voie de retrait sur les comptes Business**, remplacés par les **Workspace Agents** (annoncés le 22 avril 2026, disponibles en général le 22 mai 2026). Ce sont des agents partagés, propulsés par Codex, qui tournent dans le cloud — donc **continuent de travailler quand tu es déconnectée** — et qui peuvent être programmés sur un calendrier. C'est l'évolution directe des GPTs : ce que tu aurais construit en GPT se construit désormais en agent.

Pour une **DRH externalisée**, la conséquence est nette : ChatGPT n'est plus un outil de rédaction, c'est un **bureau virtuel qui travaille pour plusieurs clients en parallèle**, si tu organises correctement le cloisonnement. Tout ce manuel est construit autour de deux piliers : **cloisonner** (un Project par client) et **capitaliser** (des agents et des instructions réutilisables qui portent ta méthode).

---

## 2. L'architecture en profondeur

### 2.1 Les trois espaces

| Espace | Nature | Rôle | Limite à connaître |
|---|---|---|---|
| **Chat** | Conversation | Questions, analyses, échanges courts, premières ébauches | Ne produit pas de livrable complet ; pas de travail sur fichiers de bout en bout |
| **Work** | Agent de production (juil. 2026) | Tâches complètes : recherche + analyse + livrables finis sur tes fichiers et apps connectées | Consomme des crédits ; à réserver aux tâches qui valent la peine |
| **Codex** | Atelier technique | Outils réutilisables : classeurs avec formules, scripts, automatisations, traitement de fichiers | Exige de savoir décrire précisément la manipulation ; app de bureau |

### 2.2 Les deux modes de Work : local et Cloud — LE détail stratégique

Dans l'app de bureau, Work se lance en mode **local** ou **Cloud** :

- **Work local** : travaille sur les fichiers de ton ordinateur. Rien ne quitte la machine. → **Mode par défaut pour les données sensibles** (paie, dossiers individuels, données nominatives).
- **Work Cloud** : continue de tourner **même quand tu fermes l'ordi**, et se synchronise entre tes appareils. → Indispensable pour la **veille planifiée** et les tâches récurrentes qui doivent s'exécuter la nuit, le week-end, ou pendant tes vacances.

Règle d'or : **ce qui peut voyager va en Cloud ; ce qui ne doit pas voyager reste en local.** C'est ton premier levier de confidentialité, avant même la question des données d'entraînement.

### 2.3 Les plugins : tes outils connectés

Le **Plugin Directory** a remplacé l'App Directory (juillet 2026). Les plugins connectent Work aux outils de ton quotidien : Google Drive, SharePoint, Slack, mails, agendas, CRM, gestionnaires de projets. Deux usages :

- Pointer une source précise dans ta demande : **« @Google Drive, dossier Syntec »** ou « @SharePoint, classe ce contrat dans [client] ».
- Laisser l'agent classer, résumer ou surveiller des documents sur ces outils.

Côté administration : le propriétaire du workspace gère quels plugins sont installables (Workspace settings → Plugins).

### 2.4 L'économie d'usage : crédits et quotas

ChatGPT Business fonctionne désormais sur une logique de **crédits** (surtout pour les agents) :

- Les runs de **Workspace Agents** sont facturés au token (entrée, sortie, cache) — ils puisent dans un pool d'usage commun avec ChatGPT for Excel et PowerPoint.
- **Deep Research** a un **quota mensuel** qui se réinitialise tous les 30 jours (le chiffre varie selon les plans et évolue souvent) : réserve-le aux sujets qui le méritent vraiment (jurisprudence, évolutions de conventions, comparatifs stratégiques), pas aux questions courantes.
- **Voice** : 1 heure incluse par mois en Chat (Business), puis facturée à la minute ; la Voice dans Work/Codex coûte plus cher (≈ 6 crédits/min). Utile en déplacement, cher en usage intensif.
- Les modèles actuels sont de la génération **GPT-5.6** (variantes Sol et Luna, août 2026).

Conséquence pratique : briefe bien dès le premier essai (la méthode ci-dessous), et n'utilise Work/agents que pour des tâches qui produisent un vrai livrable.

---

## 3. La méthode : le brief en 6 points et le pilotage

### 3.1 Le brief en 6 points

La qualité d'un résultat dépend du brief, pas du modèle. Six éléments, dans l'ordre :

1. **Le résultat attendu, pas la tâche** — « Livre-moi la convocation à entretien préalable » plutôt que « écris un courrier ».
2. **Les sources** — fichiers joints, dossier du Project, plugins pointés par « @ », liens.
3. **Les contraintes** — convention collective, effectif, secteur, délai, format, destinataire.
4. **Ce que « bien » veut dire** — « une page maximum, un encadré "risques" en fin de document, ton formel mais non menaçant ».
5. **Le point de contrôle** — « Arrête-toi avant d'envoyer quoi que ce soit et propose-moi le texte final. »
6. **Ton style** — « Voici un courrier que j'ai rédigé pour un autre client ; aligne-toi dessus. »

Démarreur systématique : **« Avant de commencer, pose-moi les 5 questions qui changeraient le résultat. »** Deux minutes perdues, un livrable à refaire évité.

### 3.2 Piloter un travail Work en cours

Work n'est pas une boîte noire : pendant qu'il travaille, tu peux :

- **Suivre la progression** en direct (étapes affichées) ;
- **Répondre à ses questions** (il te pose des questions quand une décision lui manque) ;
- **Changer de direction** en cours de route ;
- **Approuver les actions importantes** (envoi, modification de fichier, etc.).

### 3.3 Itérer, ne pas recommencer

Quand un livrable est imparfait, ne relance pas une nouvelle conversation : **continue le même fil**, corrige par points (« change le §2 en tableau », « resserre l'intro à 3 lignes », « ajoute une colonne statut »). La conversation est ta mémoire de travail ; changer de fil, c'est tout réexpliquer.

---

## 4. L'architecture multi-clients : le cœur du sujet

C'est ici que le manuel devient vraiment spécifique à ton métier. DRH externalisée = plusieurs clients, plusieurs conventions collectives, plusieurs contextes simultanés. Le risque n°1 n'est pas une mauvaise utilisation de l'outil, c'est la **contamination de contexte** : la convention Syntec appliquée à un dossier BTP, deux clients mélangés dans une conversation, un courrier recyclé sans vérifier la procédure propre au client.

### 4.1 Les Projects : un par client, rien d'autre

Un **Project** est un dossier qui isole : fichiers, instructions, historique de conversations. Depuis juillet 2026, tu peux y lancer une conversation Chat **ou** une thread Work qui hérite du contexte du Project.

**Structure recommandée par Project client :**
- Fichiers de référence : convention collective, accords d'entreprise, contrats types, derniers PV de CSE, organigramme.
- Instructions du Project : « Client : [nom], [effectif], convention [X]. Tous les courriers doivent respecter les délais de [X]. Le ton est formel. Les montants doivent être vérifiés par une relecture humaine. »
- Historique : toutes les conversations du client, pour la continuité.

**Règle stricte** : jamais deux clients dans un même Project, jamais de conversation personnelle dans un Project client.

### 4.2 Les Workspace Agents : ta méthode, partagée et réutilisable

Les **Workspace Agents** (remplaçants des GPTs) transforment ta façon de faire en processus réutilisable. Ils sont propulsés par Codex, tournent dans le cloud (ils travaillent quand tu es déconnectée), peuvent être **programmés sur un calendrier**, et se partagent dans ton organisation.

**Construction en 4 étapes** (onglet Agents de la barre latérale) :
1. Décris le workflow que tu répètes souvent — ou dépose directement un exemple de fichier ;
2. Définis les étapes, connecte les outils (plugins), ajoute les instructions (ta méthode, tes modèles) ;
3. Teste-le sur un cas réel et corrige-le en conversation (l'agent a une mémoire et se laisse guider) ;
4. Partage-le ou duplique-le pour d'autres usages.

**Trois agents utiles pour une DRH externalisée :**
- **Agent « Courriers RH »** : tes modèles de courriers (convocation, avertissement, rupture, reclassement), ton ton, tes règles de délais → il produit un premier jet conforme à ta méthode, avec un point de contrôle avant envoi.
- **Agent « Veille multi-clients »** : chaque lundi, il surveille les conventions de tes clients, résume les nouveautés, signale les échéances de tes dossiers. Programme-le, il travaille tout seul.
- **Agent « Audit d'entrée »** : à la reprise d'un client, il passe les documents (contrats, avenants, DPAE, registre) au crible et produit la liste des non-conformités et des échéances sous 30 jours.

**Sécurité intégrée** : pour les étapes sensibles (modifier un fichier, envoyer un mail, ajouter un événement au calendrier), tu peux exiger que l'agent **demande la permission avant d'agir**. Les analytics te montrent ses runs.

### 4.3 Company Knowledge et mémoire

- **Company Knowledge** (Business, Enterprise, Edu) : la documentation de ton organisation (méthodes, politiques, modèles) devient une source que tu actives dans une conversation (bouton « + » ou « company knowledge » sous le composer). Utile si tu travailles à plusieurs.
- **Mémoire améliorée (juin 2026)** : ChatGPT peut puiser dans l'historique de tes conversations pour personnaliser ses réponses. Tu peux consulter un **résumé de mémoire**, voir les **sources** sous chaque réponse, corriger ou supprimer une mémoire, ou la désactiver. Précision importante : la mémoire est contenue par Project — rien ne circule d'un Project client à l'autre.

### 4.4 Le cycle de vie d'un dossier client

1. **Reprise** → Project client créé, documents importés, agent « Audit d'entrée » lancé.
2. **Exploitation courante** → conversations Chat/Work dans le Project, agents pour les productions récurrentes, veille planifiée en Cloud.
3. **Clôture / transfert** → export des livrables, suppression ou archivage du Project (vérifier que rien de sensible ne traîne dans des conversations hors Project).

---

## 5. La banque de prompts (9 domaines, 40+ prompts)

Légende : [Chat] conversation simple · [Work] production de livrable · [Codex] outil technique · [DR] Deep Research · [Agent] à transformer en workspace agent · [Plan] planifié/récurrent.

### 5.1 Écrits RH et procédures

1. **[Chat → Work]** Entretien préalable : « Rédige la convocation à entretien préalable pour [fait], mentions obligatoires et délai de 5 jours ouvrables respectés, convention [X]. »
2. **[Chat]** Rupture conventionnelle : « Liste les mentions obligatoires de la demande de rupture conventionnelle et rédige la lettre, avec le rappel des délais de rétractation (15 jours calendaires). »
3. **[DR + Work]** Inaptitude : « Établis la check-list complète de la procédure d'inaptitude (avis du médecin du travail, recherche de reclassement, consultation du CSE, délais) et rédige la proposition de reclassement, articles du Code du travail cités. »
4. **[Chat]** Avertissement/mise à pied : « Rédige un avertissement pour [fait] en respectant la procédure de la convention [X] et le principe du contradictoire. »
5. **[Work]** Transfert d'entreprise (L. 1224-1) : « Rédige la note d'information aux salariés sur le transfert de leur contrat, en citant les obligations de l'article L. 1224-1. »
6. **[Work]** Période d'essai : « Rédige la notification de rupture de période d'essai (non-renouvellement/rupture), conforme au délai de prévenance de la convention [X]. »
7. **[Work]** Solde de tout compte : « Liste les éléments obligatoires du solde de tout compte et du reçu pour solde, et signale les pièges (paiement des heures, congés, primes conventionnelles). »
8. **[Agent]** Courriers RH : « Transforme ma banque de modèles en agent qui rédige mes courriers dans mon style, avec point de contrôle avant envoi. »

### 5.2 Chiffrage, paie, indemnités

9. **[Work + DR]** Indemnité de licenciement : « Calcule l'indemnité de licenciement pour [ancienneté], [salaire], convention [X], calcul détaillé ligne par ligne, sources citées. »
10. **[Work]** Indemnité compensatrice de congés : « Calcule l'indemnité compensatrice de congés payés pour [salaire], [jours restants], en détaillant la méthode du 1/10ᵉ et du maintien de salaire. »
11. **[Chat]** Comparaison de scénarios : « Compare le coût total de [licenciement individuel] vs [rupture conventionnelle] pour ce salarié : indemnités, charges, délais, risques de contentieux. »
12. **[Codex]** Masse salariale : « Crée un classeur qui transforme mon export de paie en tableau de bord : effectifs, masse salariale, évolution mensuelle, coût par poste. »
13. **[Codex]** Anomalies de paie : « À partir de cet export anonymisé, détecte les anomalies : heures non récupérées, écarts de taux, doublons, dépassements de plafond. »
14. **[Work]** Budget RH : « Construis un budget RH annuel à partir des données de l'année N-1 et des hypothèses [augmentations, recrutements, turnover]. »

### 5.3 Conformité, égalité professionnelle, transparence salariale

15. **[Codex]** Écart de rémunération : téléverse un export de paie **anonymisé** → « Analyse les écarts par sexe, ancienneté et poste ; signale les écarts > 5 % et propose une note de cadrage pour le plan de rattrapage. »
16. **[Work + DR]** Index Egapro : « À partir de ces données, prépare les indicateurs de l'index Egapro et identifie les points de vigilance avant publication. »
17. **[Work + DR]** Fourchettes salariales (directive 2023/970) : « Pour les offres [poste], propose des fourchettes conformes à la directive, chaque borne justifiée à partir de ce benchmark. »
18. **[DR]** Veille directive : « Quelle est la transposition française de la directive 2023/970 en août 2026 ? Échéances, obligations par taille d'entreprise, sanctions — avec sources officielles et dates. »
19. **[Work]** Note de cadrage : « Rédige la note de cadrage du plan de rattrapage : constats chiffrés, actions, budget, calendrier, indicateurs de suivi. »
20. **[DR]** Comparatif sectoriel : « Compare les pratiques de transparence salariale (publication de fourchettes, rapports d'écarts) dans mon secteur, avec exemples concrets. »

### 5.4 Instances et négociations

21. **[Work]** PV de CSE : « Résume ce PV de CSE : décisions à acter, questions restées sans réponse, délais » puis « Rédige l'extrait de PV à afficher. »
22. **[Work]** Ordre du jour CSE : « Prépare l'ordre du jour de la prochaine réunion CSE à partir des questions en attente, des consultations obligatoires et de l'actualité du mois. »
23. **[Work + DR]** NAO : « Prépare la NAO [année] : à partir de la masse salariale et des données de la branche, construis un argumentaire et 3 scénarios d'augmentation chiffrés, avec les revendications probables de l'autre camp. »
24. **[Work]** BDESE : « À partir des données de l'année (effectifs, rémunérations, formation, absentéisme), rédige la synthèse BDESE prête à être présentée. »
25. **[Work]** Consultation annuelle : « Prépare le dossier de consultation annuelle sur la politique sociale (effectifs, temps de travail, formation, égalité) avec les indicateurs obligatoires. »
26. **[Chat]** Négociation d'accord : « À partir de ce projet d'accord et de la convention collective, liste les points de friction probables et propose 3 formulations de compromis. »

### 5.5 Recrutement et parcours

27. **[Work]** Fiche de poste : « Rédige une fiche de poste de [poste] pour une PME de [secteur], puis une annonce de 300 mots adaptée à LinkedIn et France Travail, avec mots-clés. »
28. **[Work]** Grille d'entretien : « Crée une grille d'entretien structurée pour [poste] : compétences à évaluer, questions comportementales, critères de notation, questions interdites (discrimination). »
29. **[Chat]** Conduite d'entretien annuel : « Prépare le conducteur d'entretien annuel de [salarié] à partir de sa fiche de poste et de ses objectifs N-1, avec questions sur les axes de progrès et les souhaits d'évolution. »
30. **[Work]** Plan de formation : « À partir des entretiens annuels et des obligations légales (CSE, sécurité, habilitations), propose un plan de formation priorisé avec budget. »
31. **[Work]** Onboarding : « Crée le parcours d'intégration d'un nouveau salarié : checklist administrative (DPAE, visite médicale, mutuelle), calendrier des 90 premiers jours, messages d'accueil. »

### 5.6 Veille juridique

32. **[Plan + Work Cloud]** Veille hebdo multi-clients : « Chaque lundi à 8h, point hebdo : veille sociale sur les conventions de mes clients, échéances de mes dossiers, 3 sujets à traiter en priorité. » (fonctionne sans ton ordi, en mode Cloud)
33. **[Plan + Agent]** Surveillance d'un texte : « Surveille en continu les évolutions de la [convention] sur [sujet] et préviens-moi dès qu'un texte paraît, avec une synthèse de 10 lignes. »
34. **[DR]** Jurisprudence : « Quelle est la position actuelle des tribunaux sur [sujet, ex. le forfait-jours, la clause de non-concurrence] ? Synthèse avec références d'arrêts et niveau de juridiction. »
35. **[DR]** Journal officiel : « Résume les textes publiés cette semaine qui concernent le droit du travail (conventions, décrets, arrêtés), avec les dates d'entrée en vigueur. »

### 5.7 Stratégie et politique RH

36. **[Work]** Comparatif mutuelle/prévoyance : « Compare ces 3 devis sur garanties, exclusions et coût total pour [effectif] ; classe-les et liste les points de négociation. »
37. **[DR]** Benchmark salarial : « Où se situe un salaire de [poste] en [région] pour [secteur] ? Croise les données publiques, signale leurs biais et propose une fourchette de recrutement. »
38. **[Work]** Politique de télétravail : « À partir de la convention [X] et des pratiques de la branche, rédige une charte de télétravail : cadre, droit à la déconnexion, équipement, avenant type. »
39. **[Work]** Enquête d'engagement : « Crée un questionnaire d'engagement de 15 questions pour une équipe de [n] personnes » puis « Synthétise les résultats, regroupe par thème et propose 3 actions prioritaires. »
40. **[Chat]** Gestion des conflits : « Prépare-moi un entretien de recadrage avec [profil du salarié], [fait] : angles d'approche, formulations, objectifs, points de non-négociation. »

### 5.8 Automatisations Codex

41. **[Codex]** Tableau de bord paie : « Crée un classeur qui transforme mon export de paie en tableau de bord automatique (masse salariale, effectifs, coût par poste), mise à jour par glisser-déposer. »
42. **[Codex]** Traitement de fichiers : « Transforme ce dossier de contrats (PDF) en tableau de bord : type de contrat, date de début/fin, période d'essai, statut. »
43. **[Codex + Record & Replay]** Mise en forme : « Montre-moi comment tu mets en forme ton rapport mensuel (structure, couleurs, logo) ; je la rejoue sur n'importe quel fichier à l'avenir. » (macOS)
44. **[Codex]** Échéancier légal : « Crée un classeur de suivi des échéances légales par client : visites médicales, élections, négociations obligatoires, index, rapport annuel. Avec alertes à 30 jours. »
45. **[Codex Remote]** Validation mobile : « Lance ce traitement depuis mon téléphone et demande-moi mon accord avant d'écrire quoi que ce soit. »

### 5.9 Agents et Sites

46. **[Agent]** Agent veille : « Crée un agent qui, chaque lundi, surveille les conventions de mes clients et me livre un résumé priorisé. »
47. **[Agent]** Agent courriers : « Crée un agent qui rédige mes courriers RH avec mes modèles, mon ton, et un point de contrôle avant envoi. »
48. **[Agent]** Agent audit : « Crée un agent qui audite un dossier client à la reprise et produit la liste des non-conformités et échéances sous 30 jours. »
49. **[Work → Sites]** Portail client : « Construis un tableau de bord par client : dossiers en cours, échéances légales, statut des courriers. » (usage interne au workspace — la publication publique par URL n'est pas encore disponible en France/EEE au lancement)
50. **[Work → Sites]** Page fourchettes : « Transforme ce benchmark en page interactive de fourchettes salariales par poste, consultable par mon équipe. »

---

## 6. Cinq scénarios complets pas à pas

### Scénario 1 — Reprise d'un nouveau client (audit d'entrée)

**Objectif** : prendre un client en 48 h sans rien laisser passer.
1. **Project** : crée le Project client, importe la convention collective, les contrats, avenants, DPAE, registre du personnel, derniers PV de CSE.
2. **Agent audit** : lance l'agent d'audit sur les documents → liste des non-conformités et des échéances sous 30 jours.
3. **[DR]** Vérifie les points juridiques sensibles soulevés par l'audit (un sujet à la fois, sources citées).
4. **[Work]** Rédige la note de reprise : état des lieux, risques, plan d'action à 30/90 jours.
5. **Relecture humaine** : dates, montants, références d'articles. Rien ne part avant validation.

### Scénario 2 — Préparer une NAO en 3 jours

1. **[Work]** Rassemble la masse salariale, les augmentations passées, le turnover, les données de la branche (fichiers du Project).
2. **[DR]** Extrais les données de négociation de la branche (accords de salaires, minima) avec sources et dates.
3. **[Work]** Construis l'argumentaire et **3 scénarios chiffrés** (minimal/médian/ambitieux) avec coût total par scénario.
4. **[Chat]** Simule la négociation : « Joue l'autre camp sur la base des revendications syndicales typiques de [secteur] ; où sont mes points faibles ? »
5. **Point de contrôle** : le dossier final ne sort du workspace qu'après ta relecture.

### Scénario 3 — Veille hebdo multi-clients automatisée

1. **[Agent]** Construis l'agent « veille » avec la liste de tes clients et de leurs conventions.
2. **[Plan]** Programme-le en **Work Cloud** : chaque lundi 8h, il surveille les textes, résume les nouveautés, liste les échéances de tes dossiers.
3. Il travaille pendant que ton ordi est fermé ; tu trouves le résumé le lundi matin sur n'importe quel appareil.
4. **Vérification** : exige les sources (liens vers les textes) et fais un contrôle ponctuel — la veille n'est pas une délégation de confiance totale.

### Scénario 4 — Rapport égalité / fourchettes (directive 2023/970)

1. **[Codex]** À partir de l'export de paie **anonymisé**, calcule écarts moyen/médian par catégorie, index, et écarts > 5 %.
2. **[Work + DR]** Documente la méthode et vérifie les obligations actuelles (transposition française, seuils, sanctions) avec des sources à jour.
3. **[Work]** Rédige le rapport prêt à publier + les **fourchettes salariales** pour les offres en cours.
4. **[Work]** Chiffre le plan de rattrapage si l'écart dépasse 5 % : budget, calendrier, indicateurs.
5. **Relecture** par toi, puis passage devant l'avocat si le rapport est sensible.

### Scénario 5 — Procédure d'inaptitude (dossier sensible)

1. **[DR]** Vérifie la procédure actuelle et les délais (avis du médecin du travail, recherche de reclassement, consultation du CSE) avec articles cités.
2. **[Work]** Rédige la check-list de procédure pour le dossier précis.
3. **[Work]** Rédige la proposition de reclassement (sans inventer de poste : à partir des postes réels de l'entreprise fournis en source).
4. **Règle absolue** : courrier et délais validés par toi, date de notification vérifiée, et avis d'un juriste avant envoi si le moindre doute. C'est le cas où l'IA aide le plus et où l'erreur coûte le plus cher.

---

## 7. Les pièges classiques et leurs antidotes

| Piège | Symptôme | Antidote |
|---|---|---|
| **Jours ouvrables vs ouvrés** | Délai de convocation calculé sur les mauvais jours (ex. entretien préalable : 5 jours **ouvrables**) | Vérifie chaque délai dans ta source avant envoi ; interdis les approximations de dates |
| **Sources hallucinées** | Un arrêt, un article, une circulaire qui n'existe pas — présentés avec aplomb | « Cite tes sources avec URL » + contrôle ponctuel ; en juridique, croiser avec une source officielle |
| **Ancienneté mal calculée** | Indemnité fausse (périodes de suspension, temps partiel, reprises d'ancienneté conventionnelles) | Redemande le détail ligne par ligne ; recoupe avec le bulletin de paie |
| **Contamination de clients** | La convention du client A appliquée au dossier du client B | Un Project par client ; vérifier le Project actif avant chaque demande sensible |
| **Données non anonymisées** | Export de paie ou dossier avec noms, adresses, NIR | Anonymisation systématique avant téléversement ; Work local pour le sensible |
| **Work Cloud pour du sensible** | Dossier paie monté en Cloud « par habitude » | Règle : local = sensible, Cloud = tolérable |
| **Quotas épuisés** | Deep Research bloqué en fin de mois | Réserver DR aux sujets stratégiques ; le reste passe par Work/plugins |
| **Livrable « qui a l'air juste »** | Une date décalée d'un jour, un montant arrondi, un article mal référencé | Relire en mode « avocat du diable » : dates, montants, noms, références |
| **Point de contrôle oublié** | Un courrier part sans validation finale | Le brief en 6 points n'est pas optionnel : « arrête-toi avant d'envoyer » |

---

## 8. Garde-fous et conformité

1. **Confidentialité** : le workspace Business n'entraîne pas les modèles sur tes données par défaut, mais ce n'est pas une garantie d'usage — le levier n°1 reste l'anonymisation et le choix local/Cloud.
2. **RGPD** : toute donnée nominative téléversée est un traitement de données. Anonymise, minimise, et vérifie ce que tes contrats clients disent de l'externalisation.
3. **Le juridique** : l'IA n'est pas un juriste. Barèmes, procédures et jurisprudences évoluent ; les sources peuvent être inventées. Tout document sensible passe par une relecture humaine, et par un avocat quand l'enjeu le justifie (inaptitude, licenciement, contentieux).
4. **La validation** : toi tu valides, tu signes, tu engages. Les agents demandent ton accord sur les étapes sensibles : utilise ce réglage systématiquement.
5. **L'archivage** : les livrables importants doivent être exportés hors du workspace (PDF, Word) — ta mémoire de travail ne remplace pas un dossier client archivé.

---

## 9. Glossaire

- **Chat** : la conversation simple (questions, analyses, ébauches).
- **Work** : l'agent de production de livrables (lancé le 9 juillet 2026).
- **Codex** : l'atelier technique (outils, scripts, automatisations), app de bureau.
- **Work local / Work Cloud** : exécution sur ta machine / dans le cloud (continue sans ton ordi).
- **Workspace Agent** : agent partagé, propulsé par Codex, qui tourne dans le cloud (évolution des Custom GPT, disponibles depuis mai 2026).
- **Plugin** : connecteur vers un outil (Drive, SharePoint, Slack…) ; s'appelle avec « @ ».
- **Scheduled Task** : tâche planifiée (une fois, récurrente, sur déclencheur, ou en surveillance).
- **Deep Research** : recherche approfondie sourcée, quota mensuel.
- **Record & Replay** : Codex mémorise une manipulation que tu lui montres (macOS, juin 2026) et la rejoue.
- **Codex Remote** : piloter/valider des travaux Codex depuis le téléphone.
- **Sites** : transformer un travail en site ou dashboard (bêta ; publication publique limitée en EEE au lancement).
- **Credits** : unités de consommation (agents, Deep Research, Voice).
- **Company Knowledge** : documentation de l'organisation utilisable comme source.
- **Project** : dossier cloisonné (fichiers, instructions, historique) — ton unité de base par client.
- **GPT-5.6** : génération de modèles actuelle (variantes Sol et Luna, août 2026).

---

## 10. Sources et mise à jour

Ce manuel s'appuie sur les sources officielles, consultées le 11 août 2026 :

- Notes de version ChatGPT Business — help.openai.com (articles 11391654, 10128477)
- Get started with ChatGPT Work — learn.chatgpt.com
- Introducing workspace agents in ChatGPT — openai.com (22 avril 2026)
- Deep research in ChatGPT — help.openai.com
- Company knowledge in ChatGPT (Business, Enterprise, Edu) — help.openai.com

Les fonctionnalités évoluent chaque mois : consulte les notes de version avant de déployer un nouvel usage dans ta pratique. La version 2 pages de ce guide reste le mémo rapide ; ce manuel en est la référence détaillée.

---

*Document actualisé le 11 août 2026 — rédigé pour une DRH externalisée, dans le cadre du projet Équitia (transparence salariale, directive UE 2023/970).*
