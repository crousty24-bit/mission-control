# AGENTS.md

## Mission

`Mission Control` est un dashboard personnel local pour suivre projets, tâches, progression, archives, planning, notes et agents locaux.

Le périmètre produit est volontairement strict :

- usage personnel uniquement
- exécution locale uniquement
- pas d’authentification
- pas de multi-utilisateur
- pas de backend distant ni exposition réseau publique

## État Actuel À Respecter

- MVP fonctionnel en React + Vite + TypeScript
- produit desktop via Tauri 2, Rust et SQLite locale
- fallback web de développement via API Node locale et SQLite dans `server/data/`
- couche data front unifiée dans `src/api`
- routeur local explicite dans `src/lib/router.tsx`
- thème sombre avec accent orange pastel
- bundle desktop cible : `.deb`

## Structure

- `src/pages` : écrans routés
- `src/components` : UI, cartes, panneaux, modales
- `src/features` : hooks métier et orchestration data
- `src/api` : contrat datasource et transports HTTP, Tauri, static demo
- `src/lib` : primitives locales, dont le routeur
- `server/` : backend Node fallback, services, repositories, SQLite web locale
- `src-tauri/` : shell desktop, commandes Rust, SQLite desktop, bundle config
- `.agents/skills` : workflows agent spécialisés

## Règles De Modification

- Faire des changements ciblés et minimaux.
- Préserver le périmètre local/personnel ; ne pas ajouter de SaaS, auth, collaboration ou backend distant.
- Garder le front agnostique au transport via `src/api`.
- Garder les règles métier dérivées côté backend local quand elles existent déjà côté Node/Rust.
- Éviter les abstractions nouvelles sans gain concret.
- Ne pas versionner de fichier SQLite local.
- Mettre à jour `README.md` et `README-ENG.md` ensemble quand une modification touche la documentation utilisateur.

## Skills À Utiliser

- `review-learn` : audit, explication ou apprentissage read-only de l’architecture Mission Control.
- `code-readability` : simplification, lisibilité, refactor ciblé ou maintenabilité.
- `vitest` : ajout, correction ou diagnostic de tests Vitest.
- `skill-creator` : création ou amélioration de skills.
- `find-skills` : recherche ou installation de skills.

Ces skills couvrent les détails pédagogiques, les workflows de refactor et les pratiques de test. Ne pas dupliquer leurs instructions ici.

## Données Et Métier

- Le nom d’un projet est limité à 20 caractères.
- Les tâches pilotent la progression projet.
- Un projet passe à `done` quand toutes ses tâches sont terminées.
- Si une tâche redevient incomplète, un projet `done` repasse à `in-progress`.
- L’archivage est distinct de la suppression ; seuls les projets `done` peuvent être archivés.
- Les projets archivés sortent des vues actives et basculent dans `Archives`.
- Le snapshot utilisateur agrège notamment tâches accomplies, tâches restantes, projets en cours et completion globale.
- Le planning combine événements/reminders persistés et milestones projet dérivées.
- Les notes dashboard correspondent à une note locale persistée.

## Commandes Utiles

- `npm run dev` : front web + API Node locale
- `npm run dev:front` : Vite seul
- `npm run server` : API Node seule
- `npm run tauri:dev` : développement desktop Tauri
- `npm run tauri:build` : build desktop `.deb`
- `npm run tauri:info` : diagnostic environnement Tauri
- `npm run build`
- `npm run build:server`
- `npm run build:app`
- `npm run test`
- `npm run lint:eslint`
- `npm run lint:biome`
- `npm run lint:biome:files -- <fichiers_modifiés>`
- `npm run lint:biome:write:files -- <fichiers_modifiés>`
- `npm run db:reset`

## Vérification

- Pour un changement front/Node/TS ciblé, lancer au minimum `npm run lint:biome:files -- <fichiers_modifiés>`.
- Appliquer les corrections sûres avec `npm run lint:biome:write:files -- <fichiers_modifiés>` avant de traiter les diagnostics restants.
- Utiliser `npm run lint:eslint` comme contrôle secondaire tant que la transition Biome n’est pas terminée.
- Lancer `npm run test` quand le changement touche une règle métier, un hook, une API ou un comportement utilisateur couvert.
- Lancer `npm run build` ou `npm run build:server` selon le périmètre touché.
- Lancer `cargo check --manifest-path src-tauri/Cargo.toml` pour les changements Rust/Tauri.
- Lancer `npm run tauri:build` quand le packaging `.deb` ou la config Tauri est concerné.

## UX

- Garder le dashboard compact, lisible et exploitable au quotidien.
- Préserver le thème sombre et l’accent orange désaturé.
- Garder la sidebar dashboard lisible quand elle pousse le dashboard à droite.
- Éviter les effets coûteux pour le runtime desktop.
- Garder overlays, dropdowns et modales compatibles avec Tauri/WebKitGTK.
- Ne pas réintroduire d’effets lourds de blur, shadow ou animation.

## Notes D’Exploitation

- La DB desktop Tauri vit hors du repo dans le dossier applicatif utilisateur.
- `server/data/mission-control.sqlite` sert uniquement au fallback web local.
- Le mode `tauri:dev` est le mode de développement desktop principal.
- `npm run tauri:dev` ouvert dans un navigateur n’est pas un test valide du transport desktop.
- Le `.deb` installé est un snapshot packagé : après changement source, rebuild puis réinstallation sont nécessaires.
- `npm run tauri:info` peut rester pendant après le bloc environnement ; ce bloc reste le diagnostic utile.
