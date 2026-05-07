# Mission Control

[![Desktop Linux](https://img.shields.io/badge/Desktop-Linux-2d7ff9?style=flat-square)](#local-daily-usage)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-ffc131?style=flat-square)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-local-003b57?style=flat-square)](https://www.sqlite.org/)
[![App Version](https://img.shields.io/badge/App-1.0.0-111827?style=flat-square)](#mission-control)
[![Status](https://img.shields.io/badge/Status-MVP-2f855a?style=flat-square)](#mission-control)

Mission Control is a personal desktop dashboard for tracking projects, tasks, progress, and archives in a fully local environment.

**Current status: MVP**

Current packaged desktop build version: **0.1.0**.

The project is intentionally scoped to a single use case:

- one person only
- no SaaS
- no authentication
- no public network exposure
- a simple and stable Linux desktop workflow

## Overview

Mission Control provides:

- a personal landing page with progress-oriented project metrics
- a project dashboard with real status, priority, and progress
- a topbar search to quickly filter active projects
- drag-and-drop reordering for projects in the active pipeline
- an archive flow for `done` projects
- a read-only `Archives` page for projects removed from the active workflow
- a Todo List linked to the active project
- a dashboard side menu with a global TDL chart, weekly planning, and persisted markdown notes
- `Streak` and `Medals reward` counters in the topbar, powered by completed tasks, `done` projects, and archives
- temporary reward notifications on the landing page and dashboard
- drag-and-drop reordering for tasks in the selected project
- expandable compact lists with a `view all / show less` toggle for projects and tasks
- local SQLite persistence
- Linux desktop packaging through Tauri

## Highlights

- desktop-first with Tauri
- dark UI with a pastel orange accent
- project progress calculated from tasks
- automatic transition to `done` when all tasks are completed
- local active-project search from the topbar
- persistent manual project and task reordering through drag and drop
- archiving distinct from deletion, so finished projects leave the active pipeline cleanly
- compact default views with on-demand expansion through `view all / show less`
- sidebar chart for global completed TDL tasks with a week/month toggle
- local planning derived from project milestones and enriched with free events/reminders
- dashboard markdown notes persisted in a textarea with internal scrolling
- fast project and task editing
- local web fallback kept for development

## Screenshots

### Landing

![Landing page](docs/media/landing-page.png)

### Dashboard

![Dashboard page](docs/media/dashboard-page.png)
![Dashboard projects](docs/media/dashboad-projects.png)
![Dashboard status](docs/media/dashboard-statut.png)
![Dashboard donut statuts](docs/media/dashboard-donut-statuts.png)
![Dashboard tasks](docs/media/dashboard-tasks.png)

### Project Flows

![Project modal - create](docs/media/project-modal-create.png)
![Project modal - edit](docs/media/project-modal-edit.png)
![Project modal - show](docs/media/project-modal-show.png)
![Project card - status](docs/media/project-card-status.png)
![Project card - priority](docs/media/project-card-priority.png)
![Project cards - archive select](docs/media/project-cards-archive-select.png)
![Archive modal - confirm](docs/media/archive-modal-confirm.png)

### Archives

![Archives page](docs/media/archives-page.png)

## Stack

- React
- Vite
- TypeScript
- Tauri 2
- Rust
- SQLite
- Node.js only for the local web development fallback

## Architecture

- `src/`: React UI, pages, components, transport layer, domain hooks
- `src-tauri/`: desktop shell, Rust commands, desktop persistence, bundle config
- `server/`: local Node API and SQLite fallback for web mode
- `scripts/`: local launch, build, and setup scripts

The production runtime target is the Tauri desktop app.  
The Node backend is kept for local web development and fallback verification.

The user snapshot shown on the dashboard and landing page now aggregates:

- completed tasks
- remaining tasks
- active projects
- global completion

## Requirements

Target environment:

- Ubuntu 24.04
- Node.js and npm
- Rust via `rustup`
- Tauri system dependencies

Ubuntu helper:

```bash
cd /home/user/path/to/mission-control
npm run tauri:setup:ubuntu
```

Environment diagnostics:

```bash
npm run tauri:info
```

## Installation

```bash
cd /home/user/path/to/mission-control
npm install
```

## Local Daily Usage

The current production workflow is centered around the `.deb` package.

### Use Mission Control as an installed desktop app

1. Build the desktop version:

```bash
cd /home/user/path/to/mission-control
npm run tauri:build
```

2. Find the generated package from the project root:

```bash
find src-tauri/target/release/bundle -name "*.deb"
```

3. Install it:

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/"Mission Control_0.1.0_amd64.deb"
```

4. Launch **Mission Control** from:

- the Ubuntu applications menu
- or the dock if the app is pinned

Important:

- the installed `.deb` is a packaged snapshot
- if you change the source code, the installed app does not update by itself
- to update the installed app, rebuild with `npm run tauri:build` and reinstall the new `.deb`

### Develop the desktop version

```bash
cd /home/user/path/to/mission-control
npm run tauri:dev
```

If the Linux graphics stack is unstable:

```bash
MISSION_CONTROL_SOFTWARE_RENDERING=1 npm run tauri:dev
```

### Web development fallback

```bash
cd /home/user/path/to/mission-control
npm run dev
```

This mode launches:

- the Vite server
- the local Node API
- the local SQLite database used by the web fallback

`npm run app` is still available as a built browser launch, but it is no longer the recommended production mode.

### Static GitHub Pages demo

```bash
cd /home/user/path/to/mission-control
npm run build:static
npm run preview:static
```

This mode produces a standalone browser demo for `https://crousty24-bit.github.io/mission-control/`.

- no Node API or Tauri runtime
- seeded demo data on the frontend
- actions persisted in browser `localStorage`
- hash URL navigation (`#/dashboard`, `#/archives`) to avoid GitHub Pages 404s

The `Deploy static demo to GitHub Pages` GitHub Actions workflow builds and publishes the `dist` folder automatically.

## Development Workflow

### Work on the app

```bash
npm run tauri:dev
```

Use this mode to:

- modify the UI
- test desktop interactions
- validate Tauri behavior

### Publish a new local desktop version

```bash
npm run tauri:build
sudo apt install ./src-tauri/target/release/bundle/deb/"Mission Control_0.1.0_amd64.deb"
```

Then relaunch the app from the system menu.

## Useful Scripts

```bash
npm run dev
npm run dev:front
npm run server
npm run app
npm run db:reset
npm run build
npm run build:server
npm run build:static
npm run preview:static
npm run lint
npm run lint:eslint
npm run lint:biome
npm run lint:biome:files -- src/main.tsx src/api/tauriRuntime.ts
npm run lint:biome:write:files -- src/main.tsx src/api/tauriRuntime.ts
npm run tauri:dev
npm run tauri:build
npm run tauri:info
```

## Verification

Recommended checks:

```bash
npm run lint
npm run lint:eslint
npm run lint:biome
npm run build
npm run build:server
npm run tauri:info
cargo check --manifest-path src-tauri/Cargo.toml
```

Biome procedure for routine changes:

- use `npm run lint:biome:files -- <modified_files>` before closing a task
- apply safe fixes with `npm run lint:biome:write:files -- <modified_files>`
- then address remaining `lint/*` diagnostics manually on the same scope
- reserve `npm run lint:biome` for global audits or dedicated normalization batches
- `npm run lint:eslint` remains temporarily available as a secondary check during the transition

## Recent Product Logic

- `Global completion` is still calculated from completed tasks across non-archived projects
- `Active projects` means every non-archived project visible in the board, including `done`
- the topbar search filters only dashboard active projects and does not affect persisted order
- an archived project disappears from the active dashboard and remains visible in the `Archives` page
- archiving is only allowed when a project is in `done`
- the board project order can be rearranged with drag and drop and remains persisted
- the task order inside a project can be rearranged with drag and drop and remains persisted
- project and task sections stay compact by default, then expand through `view all / show less`
- the sidebar chart tracks the global number of completed TDL tasks, without project breakdown
- the dashboard planning view shows a Monday-Sunday week and combines persisted free events with project deadlines derived from the `milestone` field
- project deadlines without a parseable date remain visible under `To plan`
- the dashboard note is unique, persisted locally, and edited as markdown in a textarea without rendered preview
- the daily streak gains at most +1 per day when a task is completed or a project becomes `done`, then resets to 0 after a 7-day cycle
- `Medals reward` matches the total archived project count, and rewards trigger a local 3-second notification

## Linux / Tauri Notes

On some Linux machines, WebKitGTK may emit `libEGL`, `MESA`, or `ZINK` warnings during `tauri:dev`.

Mission Control already applies several safeguards:

- `WEBKIT_DISABLE_DMABUF_RENDERER=1`
- `LIBGL_KOPPER_DISABLE=true`
- software fallback through `MISSION_CONTROL_SOFTWARE_RENDERING=1`

`tauri:dev` remains a debug mode. The release build packaged as a `.deb` is the production reference.

## Project Integrity

Currently verified locally:

- `npm run lint`
- `npm run build`
- `npm run build:server`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run tauri:info`
- `npm run tauri:build`

## Additional Information

- **the project is designed for personal, local, single-user use**
- **the Tauri desktop persistence lives locally outside the repo**
- **the SQLite database used by the web fallback must not be versioned**

## Pedagogical Mode with `tasks-review.md`

The [tasks-review.md](tasks-review.md) file exists to frame the use of an AI agent, here Codex, as a **teaching assistant** during development.

The goal is twofold:

- actually build the application
- still be able to ask questions about architecture and code while learning

When this mode is activated with a prompt such as `Tasks: ...`, the agent should switch to a mentor posture and:

- explain the role of components
- show where `props` and `state` live
- explain the API layer, Tauri, SQLite, and the desktop build
- answer pedagogically without changing code

This is especially useful for a developer learning:

- React
- Vite
- TypeScript
- Tauri

The broader idea is to **learn by building the real project**, instead of separating learning from implementation.

The principle is generic: it can be applied to other projects or stacks as long as a similar file exists to frame the agent’s teaching behavior.

## Roadmap

| Topic | Goal |
| --- | --- |
| Linux visual finish | Keep refining rendering depending on the target machine and WebKitGTK / Mesa stack. |
| Web fallback | Keep simplifying the Node/SQLite layer kept for development. |
| Product scope | Keep the dashboard compact, local, and strictly personal. |

## License

This project is published under the [MIT](LICENSE) license.
