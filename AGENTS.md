# AGENTS.md

## Objectif
`Mission Control` est un dashboard personnel desktop pour suivre au quotidien des projets, leurs tâches, leur progression et leurs archives.

Le périmètre du projet reste volontairement limité :

- usage strictement personnel
- exécution locale uniquement
- aucune authentification
- aucun mode multi-utilisateur
- aucune exposition réseau publique

## État actuel

- Produit en état **MVP fonctionnel**
- Front React + Vite + TypeScript
- Runtime produit desktop via Tauri 2
- Commandes Rust + SQLite pour le mode desktop
- API Node locale + SQLite fallback pour le mode web de développement
- Couche data front unifiée dans `src/api`
- Routeur local explicite dans `src/lib/router.tsx`
- Thème sombre à accent orange pastel
- Landing avec résumé personnel et métriques projet
- Dashboard avec pipeline active, résumé visuel des statuts projet et section `Statut utilisateur`
- Menu dashboard latéral réductible `Organisation` avec graphique global des tâches TDL terminées, Planning hebdomadaire et Notes markdown persistées
- Page `Archives` en lecture seule pour les projets archivés
- Todo List liée au projet actif

## Runtime cible

- **Produit** : application desktop Tauri installée via package `.deb`
- **Développement desktop** : `npm run tauri:dev`
- **Fallback développement web** : `npm run dev`

Le package `.deb` est la cible de build vérifiée par défaut.  
L’AppImage n’est plus le bundle par défaut du projet.

## Structure attendue

- `src/pages` : écrans routés
- `src/components` : composants d’UI, cartes, modales, panneaux
- `src/api` : transports HTTP/Tauri et contrat de datasource
- `src/features` : hooks métier et orchestration data
- `src/lib` : primitives locales, dont le routeur
- `src/types.ts` : contrats métier partagés
- `server/` : backend Node fallback, DB web locale, seed, reset
- `src-tauri/` : shell desktop, commandes Rust, SQLite desktop, bundle config
- `scripts/` : lancement, build, setup et utilitaires locaux
- `docs/media/` : captures/GIFs du README

## Règles de modification

- faire des changements ciblés
- préserver le périmètre d’app personnelle locale
- ne pas ajouter de fonctionnalités SaaS, auth ou collaboration
- garder la logique métier dérivée côté backend local
- garder le front agnostique au transport autant que possible
- éviter les abstractions supplémentaires sans gain concret
- utiliser `Biome` via `biome.json` comme référence de formatage et de lint pour les fichiers touchés
- avant de conclure un changement front/Node/TS, exécuter au minimum `npm run lint:biome:files -- <fichiers_modifiés>` ou `npm run lint:biome` si le périmètre est large
- appliquer les corrections sûres avec `npm run lint:biome:write:files -- <fichiers_modifiés>` avant de traiter manuellement les diagnostics restants
- ne pas lancer de reformatage massif hors périmètre demandé ; `Biome --write` sur `.` est réservé aux lots dédiés de normalisation
- conserver `ESLint` comme contrôle secondaire via `npm run lint:eslint` tant que la transition Biome n’est pas terminée
- toujours mettre à jour les 2 versions du README (fr et eng) de la même manière

## Données et métier

- les projets exposent : nom, client, résumé, milestone, priorité, statut et progression
- le nom du projet est limité à 20 caractères
- un projet peut être archivé via `archivedAt` ; un projet archivé sort des vues actives et bascule sur la page `Archives`
- les tâches pilotent la progression projet
- un projet passe à `done` quand toutes ses tâches sont terminées
- si une tâche redevient incomplète, un projet `done` repasse à `in-progress`
- l’archivage est distinct de la suppression ; seuls les projets `done` peuvent être archivés
- le snapshot utilisateur agrège au minimum tâches accomplies, tâches restantes, projets en cours et completion globale
- la landing réutilise ces métriques avec une première carte centrée sur la completion globale
- le graphique sidebar des tâches terminées s’appuie sur l’état courant global des tâches TDL, sans ventilation par projet
- le planning dashboard combine événements/reminders libres persistés et milestones projet dérivées ; les milestones non parseables restent à planifier
- les notes dashboard correspondent à une note unique persistée localement ; l’UI actuelle est une textarea markdown sans aperçu

## Scripts utiles

- `npm run dev` : front web + API Node locale
- `npm run dev:front` : Vite seul
- `npm run server` : API Node seule
- `npm run app` : fallback web buildé dans le navigateur
- `npm run tauri:dev` : variante desktop Tauri
- `npm run tauri:build` : build `.deb` desktop
- `npm run tauri:info` : diagnostic environnement Tauri
- `npm run tauri:setup:ubuntu` : installation des prérequis Ubuntu + Rust + diagnostic
- `npm run db:reset` : reset de la DB locale du fallback web
- `npm run build`
- `npm run build:server`
- `npm run build:app`
- `npm run lint`
- `npm run lint:eslint`
- `npm run lint:biome`
- `npm run lint:biome:files -- <fichiers_modifiés>`
- `npm run lint:biome:write`
- `npm run lint:biome:write:files -- <fichiers_modifiés>`

## Vérification minimale

- `npm run lint`
- `npm run lint:eslint`
- `npm run lint:biome`
- `npm run build`
- `npm run build:server`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run tauri:info`
- `npm run tauri:build`

Selon le besoin :

- `npm run lint:biome:files -- <fichiers_modifiés>` pour valider un changement ciblé sans bruit externe
- `npm run lint:biome:write:files -- <fichiers_modifiés>` pour appliquer uniquement les corrections sûres sur le périmètre modifié
- `npm run lint:biome` pour l’audit global du scope maintenu
- `npm run tauri:build` pour vérifier le packaging `.deb`
- `npm run db:reset` si la base web fallback doit être réinitialisée

## UX et design

- garder un dashboard lisible, compact et exploitable au quotidien
- garder la sidebar dashboard compacte ; ses widgets doivent rester lisibles sans casser le dashboard poussé à droite
- préserver le thème sombre orange pastel
- conserver l’accent orange désaturé actuel et les contrastes forts entre fonds et surfaces
- éviter les effets visuels coûteux pour le runtime desktop
- garder les overlays, dropdowns et modales compatibles avec Tauri/WebKitGTK
- ne pas réintroduire des effets lourds de blur, shadow ou animation

## Notes d’exploitation

- la DB desktop Tauri vit hors du repo dans le dossier applicatif utilisateur
- la DB `server/data/mission-control.sqlite` sert uniquement au fallback web local
- les tables `calendar_events` et `dashboard_notes` existent dans les DB SQLite Node/Tauri
- aucun fichier SQLite local ne doit être versionné
- le mode `tauri:dev` est le mode de développement desktop principal
- le `.deb` installé est un snapshot packagé : après un changement source, il faut rebuild puis réinstaller

## Limites connues

- le fallback web nécessite que l’API Node soit lancée
- `npm run tauri:dev` ouvert dans un navigateur n’est pas un mode supporté pour tester le transport desktop
- la pile graphique Linux peut encore générer des warnings `libEGL` / `MESA` selon la machine
- `npm run tauri:info` peut rester pendante après l’affichage du bloc environnement ; utiliser surtout ce bloc comme diagnostic utile
