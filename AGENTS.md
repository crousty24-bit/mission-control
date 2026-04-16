# AGENTS.md

## Objectif
`Mission Control` est un dashboard personnel desktop pour suivre au quotidien des projets, des tâches et des agents locaux.

Le périmètre du projet reste volontairement limité :

- usage strictement personnel
- exécution locale uniquement
- aucune authentification
- aucun mode multi-utilisateur
- aucune exposition réseau publique

## État actuel

- Front React + Vite + TypeScript
- Runtime produit desktop via Tauri 2
- Commandes Rust + SQLite pour le mode desktop
- API Node locale + SQLite fallback pour le mode web de développement
- Couche data front unifiée dans `src/api`
- Routeur local explicite dans `src/lib/router.tsx`
- Thème sombre à accent orange pastel
- Module agents encore partiellement en développement côté produit

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

## Données et métier

- les projets exposent : nom, client, résumé, milestone, priorité, statut et progression
- le nom du projet est limité à 20 caractères
- les tâches pilotent la progression projet
- un projet passe à `done` quand toutes ses tâches sont terminées
- si une tâche redevient incomplète, un projet `done` repasse à `in-progress`
- les agents locaux sont rattachés à un projet et à une tâche courante
- le snapshot utilisateur agrège au minimum cadence actuelle, projets actifs et completion globale

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

## Vérification minimale

- `npm run lint`
- `npm run build`
- `npm run build:server`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run tauri:info`
- `npm run tauri:build`

Selon le besoin :

- `npm run tauri:build` pour vérifier le packaging `.deb`
- `npm run db:reset` si la base web fallback doit être réinitialisée

## UX et design

- garder un dashboard lisible, compact et exploitable au quotidien
- préserver le thème sombre orange pastel
- éviter les effets visuels coûteux pour le runtime desktop
- garder les overlays, dropdowns et modales compatibles avec Tauri/WebKitGTK
- ne pas réintroduire des effets lourds de blur, shadow ou animation

## Notes d’exploitation

- la DB desktop Tauri vit hors du repo dans le dossier applicatif utilisateur
- la DB `server/data/mission-control.sqlite` sert uniquement au fallback web local
- aucun fichier SQLite local ne doit être versionné
- le mode `tauri:dev` est le mode de développement desktop principal
- le `.deb` installé est un snapshot packagé : après un changement source, il faut rebuild puis réinstaller

## Limites connues

- le fallback web nécessite que l’API Node soit lancée
- `npm run tauri:dev` ouvert dans un navigateur n’est pas un mode supporté pour tester le transport desktop
- la pile graphique Linux peut encore générer des warnings `libEGL` / `MESA` selon la machine
- la partie `Agents locaux` doit encore être considérée comme une feature en développement
