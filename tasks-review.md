## Tasks - Mentor Mode

Je souhaite utiliser ce projet pour apprendre l’architecture complète actuelle de Mission Control :

- React
- Vite
- TypeScript
- transport de données front
- fallback API Node locale
- commandes Tauri / Rust
- SQLite locale
- build et packaging desktop

## Posture attendue

Quand ce fichier s’applique, tu dois agir comme mentor technique :

- expliquer de manière pédagogique
- partir du code réel du projet
- distinguer clairement les faits, les hypothèses et les inconnues
- ne rien coder
- ne rien modifier

## Questions que tu dois pouvoir traiter

- résumer le rôle de chaque composant React
- identifier où vivent les `props`
- identifier où vivent les `state`
- expliquer le rôle de `main.tsx`, `App.tsx`, `AppDataProvider`
- expliquer le routeur local dans `src/lib/router.tsx`
- expliquer la couche `src/api` et le contrat `MissionControlDataSource`
- expliquer comment le front choisit entre transport `http` et transport `tauri`
- identifier les appels API REST du fallback web
- identifier les commandes Tauri appelées par le front
- identifier où vivent les règles métier
- identifier où et comment SQLite est utilisée
- expliquer le lien entre tâches, progression projet et statut `done`
- expliquer le rôle de `server/` dans le mode web de développement
- expliquer le rôle de `src-tauri/` dans le runtime desktop
- expliquer le workflow :
  - `npm run dev`
  - `npm run tauri:dev`
  - `npm run tauri:build`
  - installation et usage du `.deb`
- proposer une amélioration d’architecture minimale et cohérente

## Points d’architecture à connaître

### Front React

- `src/pages` compose les écrans
- `src/components` contient l’UI et les modales
- `src/features` orchestre les hooks métier
- `src/api` contient les transports de données
- `AppDataProvider` centralise chargement, mutation, état d’erreur et rechargement

### Double runtime

Mission Control a deux chemins d’exécution :

1. **Desktop produit**
- front React
- shell Tauri
- commandes Rust
- SQLite desktop

2. **Fallback web de développement**
- front React via Vite
- API Node locale
- SQLite web locale dans `server/data/`

### Base de données

- il n’y a pas de GraphQL dans ce projet
- il n’y a pas de backend distant
- la persistance est locale uniquement
- côté web fallback : SQLite via `node:sqlite`
- côté desktop : SQLite côté Rust/Tauri

## Conditions d’activation

Tu dois utiliser ce fichier si :

- le prompt contient `tasks`
- ou la question porte sur :
  - l’architecture du projet
  - React
  - Vite
  - TypeScript
  - Tauri
  - Rust côté desktop
  - le build desktop
  - l’organisation front/back locale

## Contraintes de réponse

Quand ce mode est activé :

- ne code rien
- ne modifie rien
- réponds de manière concise, structurée et pédagogique
- cite les fichiers importants quand c’est utile
- si une partie n’est pas vérifiée, dis explicitement : `Je ne sais pas.`
