# NETDRAW

> Open-source network & infrastructure diagram editor. A lightweight, high-performance, and fluid alternative to Draw.io and Microsoft Visio, tailored for IT and telecom engineers.

[![Status](https://img.shields.io/badge/status-alpha-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![React](https://img.shields.io/badge/react-19-61dafb)]()
[![Fastify](https://img.shields.io/badge/fastify-5-black)]()
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](./CONTRIBUTING.md)

> [!CAUTION]
> **Project Status: ALPHA**
>
> This project is currently in the **ALPHA** stage. It is under active development, and bugs, crashes, or data schema breaking changes may occur.
>
> It must be used **exclusively in a pre-production, lab, or test environment**. This application is **NOT production-ready (not prod-ready)**. Use at your own risk.

---

## Table of contents

- [Presentation & use cases](#-presentation--use-cases)
- [AI-assisted development & open source philosophy](#-ai-assisted-development--open-source-philosophy)
- [Features](#-features)
- [Quick start](#-quick-start)
  - [Docker (recommended)](#run-with-docker-recommended)
  - [Local install (no Docker)](#local-installation-without-docker)
- [Configuration](#-configuration)
- [Project structure](#-project-structure)
- [Available scripts](#-available-scripts)
- [Customization & extension](#-customization--extension)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [Security & responsible disclosure](#-security--responsible-disclosure)
- [License](#-license)

---

## 📖 Presentation & use cases

NETDRAW is a modern, self-hostable web application designed to draw high-fidelity network topologies, fiber cabling plans, and datacenter rack layouts. It ships as a single Docker stack, requires no external service, and stores everything in a portable SQLite file (PostgreSQL optional).

### Primary use cases

- **Enterprise LAN/WAN mapping** — multi-layer topologies with custom orthogonal routers, switches, and edge connections.
- **Telecom & fiber infrastructure** — GPON layouts (OLT, ONT, splitters) and cell-tower structures.
- **Datacenter inventory** — schematic views of physical racks, patch panels, and server cabinets.
- **Network operations documentation** — version-snapshot diagrams, audit logs, and approval workflows for change-management processes.

---

## 🤖 AI-assisted development & open source philosophy

> [!NOTE]
> Ce projet est développé principalement selon une approche de **Vibe Coding** assistée par IA, avec validation et supervision humaine.

Features, geometry calculations, and sanitization loops are prototyped and integrated at high speed using advanced AI coding agents, backed by strict manual quality control, peer review, and compilation testing. We do not auto-publish agent output: every change is reviewed, type-checked, lint-checked, and tested before it lands on `main`.

### Transparency & governance

- No telemetry, no proprietary hooks, no vendor lock-in.
- 100% open roadmap — RFCs, milestones, and feature requests are discussed publicly.
- The project is moving toward a community-led governance model: every significant change is reviewed transparently and voted on through GitHub Discussions.

---

## ✨ Features

- **Zero-friction UX** — 60 FPS viewport panning and zooming powered by a custom SVG transform engine.
- **2.5D isometric shape library** — 60+ homogeneous icons across 10 categories (network, datacenter, storage, telecom, etc.).
- **Dynamic HSL theme slots** — recolor shapes via five slots: `body`, `accent`, `screen`, `led`, `shadow`.
- **Smart connectors** — bezier, straight, orthogonal, bus, bundle, and radio links snapping to anchor points.
- **Layers, history, and snapshots** — locking, undo/redo, and auto-save version backups.
- **Built-in libraries** — Draw.io XML, Mermaid, Mermaid ER, and CSV inventory import/export.
- **Security by design** — strict two-tier SVG sanitization (DOMPurify client-side, JSDOM+DOMPurify server-side) to block XSS payloads.
- **Comments & workflow** — inline review pins, approval workflow with signatures, and audit logs.
- **Offline-ready PWA** — service worker cache for the editor shell, installable on desktop and mobile.
- **i18n-ready** — English/French translations bundled; new locales can be added without code changes.

A detailed list is available in [ROADMAP.md](./ROADMAP.md).

---

## 🚀 Quick start

### Requirements

- **Docker** and **Docker Compose** (recommended), **or**
- **Node.js 22+** and **npm 10+** for local development.

### Run with Docker (recommended)

```bash
git clone https://github.com/netdraw/netdraw.git
cd netdraw
cp .env.example .env
docker compose up -d
```

Then open <http://localhost:8080> in your browser.

To seed three demo templates (Enterprise LAN, ISP FTTH, Datacenter rack):

```bash
docker exec netdraw-backend node --import tsx apps/backend/scripts/seed.ts
```

### Local installation (without Docker)

```bash
git clone https://github.com/netdraw/netdraw.git
cd netdraw
cp .env.example .env
npm install
npm run prisma:migrate -w @netdraw/backend
npm run dev
```

- Frontend (Vite dev server): <http://localhost:5173>
- Backend API: <http://localhost:3001>
- Swagger UI: <http://localhost:3001/docs>

---

## ⚙️ Configuration

All runtime knobs live in environment variables. The repository ships with `.env.example` files at the root, in `apps/backend/`, and in `apps/frontend/`. Copy the relevant one to `.env` and adjust.

| Variable               | Default                                       | Description                                                       |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`             | `development`                                 | `development`, `test`, or `production`                            |
| `LOG_LEVEL`            | `info`                                        | `fatal`, `error`, `warn`, `info`, `debug`, `trace`                |
| `BACKEND_PORT`         | `3001`                                        | Port bound by the Fastify server                                  |
| `DATABASE_URL`         | `file:/data/netdraw.db`                       | Prisma database URL (SQLite or PostgreSQL)                        |
| `CORS_ORIGIN`          | `http://localhost:5173,http://localhost:8080` | Comma-separated list of allowed origins                           |
| `RATE_LIMIT_MAX`       | `300`                                         | API requests per window per IP                                    |
| `RATE_LIMIT_WINDOW`    | `1 minute`                                    | Rate-limit window                                                 |
| `AUTH_MODE`            | `none`                                        | `none`, `local`, or `oidc`                                        |
| `JWT_SECRET`           | _placeholder_                                 | **Required in production** — generate with `openssl rand -hex 32` |
| `JWT_TTL`              | `12h`                                         | Token lifetime                                                    |
| `DATA_DIR`             | `/data`                                       | Path where SQLite and exports are stored                          |
| `MAX_UPLOAD_MB`        | `2`                                           | Max SVG upload size                                               |
| `AUTOSAVE_INTERVAL_MS` | `30000`                                       | Auto-save interval                                                |
| `TELEMETRY_ENABLED`    | `false`                                       | Opt-in anonymous usage telemetry                                  |

> ⚠️ **Never commit a real `.env` file.** The `.gitignore` already excludes it.

---

## 📂 Project structure

```
.
├── apps/
│   ├── backend/                      # Fastify 5 + Prisma API
│   │   ├── prisma/                   # Schema & migrations
│   │   ├── scripts/seed.ts           # Demo content seeder
│   │   ├── src/
│   │   │   ├── lib/                  # sanitize, logger, prisma, errors
│   │   │   ├── routes/               # /health, /projects, /assets
│   │   │   ├── schemas/              # Zod request schemas
│   │   │   ├── app.ts                # Fastify instance factory
│   │   │   ├── config.ts             # Validated env configuration
│   │   │   └── server.ts             # Entry point
│   │   └── tests/                    # Vitest suites (sanitize, schemas)
│   └── frontend/                     # React 19 SPA (Vite + Zustand + Tailwind v4)
│       ├── public/                   # PWA assets, service worker
│       ├── src/
│       │   ├── canvas/               # SVG canvas & interaction components
│       │   ├── components/           # UI dialogs and panels
│       │   ├── hooks/                # useAutoSave, useTheme, useKeyboardShortcuts
│       │   ├── lib/                  # Snap, importers, serialization, i18n
│       │   ├── routes/               # Editor, Dashboard, Embed
│       │   ├── shapes/               # Shape plugins and isometric library
│       │   ├── state/                # Zustand store + undo/redo history
│       │   └── types/                # Shared TypeScript definitions
│       └── nginx.conf                # Reverse-proxy & security headers
├── data/                             # Runtime volume (SQLite + exports)
├── docs/                             # API reference, shortcuts, performance notes
├── .github/workflows/ci.yml          # CI: backend, frontend, format, docker
├── docker-compose.yml                # Production stack
├── docker-entrypoint.sh              # Prisma migrate + start backend
├── package.json                      # npm workspaces root
├── .env.example                      # Environment template
├── .eslintrc.json                    # ESLint config
├── .prettierrc.json                  # Prettier config
└── .editorconfig                     # Editor defaults
```

---

## 🛠️ Available scripts

| Script                    | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev`             | Run frontend (Vite) and backend (tsx watch) in parallel |
| `npm run build`           | Build both workspaces for production                    |
| `npm run lint`            | Run ESLint across the monorepo                          |
| `npm run format`          | Format the codebase with Prettier                       |
| `npm run format:check`    | Verify that the codebase is Prettier-clean              |
| `npm test`                | Run Vitest in both workspaces                           |
| `npm run prisma:migrate`  | Apply Prisma migrations (backend)                       |
| `npm run prisma:generate` | Regenerate the Prisma client                            |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)                       |

---

## 💻 Customization & extension

### Theme slots

Every 2.5D shape exposes five HSL slots that can be re-themed at runtime:

- `body` — main chassis face
- `accent` — upper face highlight
- `screen` — side shading shadow
- `led` — port status indicator
- `shadow` — stroke borders

Use the in-app **Palette Picker** to define team-wide palettes, or call the `setShapeTheme()` helper from a custom plugin.

### Adding new shapes

Shapes are registered in [`apps/frontend/src/shapes/`](./apps/frontend/src/shapes) using the `makeIsometricPlugin` factory:

```typescript
import { makeIsometricPlugin, chassis3D, THEME_NETWORK } from './isometric25d';

export const customShape25d = makeIsometricPlugin({
  type: 'custom-shape-25d',
  label: 'Custom 2.5D Shape',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_NETWORK,
  body: (t) => chassis3D(112, 60, 8, 6, t),
});
```

### Custom import / export adapters

`apps/frontend/src/lib/importers.ts` and `apps/frontend/src/lib/serializer.ts` expose
a stable interface for adding new format adapters. See the in-file JSDoc and the
existing Draw.io / Mermaid implementations for reference.

---

## 🚢 Deployment

### Docker Compose (default)

`docker-compose.yml` ships with two services:

- `netdraw-backend` — Fastify API on port 3001, running as non-root `netdraw` user
  with a persistent `netdraw-data` volume mounted at `/data`.
- `netdraw-frontend` — Nginx serving the static SPA on port 8080, reverse-proxying
  `/api/` to the backend. Health-checked container.

The compose stack is suitable for self-hosted production usage. For multi-node
deployments, point `DATABASE_URL` to a PostgreSQL instance and disable the
`netdraw-data` volume.

### Kubernetes / Helm

The provided `Dockerfile`s (one per workspace) follow multi-stage patterns and
emit slim runtime images. A community-maintained Helm chart is tracked in
[ROADMAP.md](./ROADMAP.md) (P1).

### Backups

The persistent `netdraw-data` volume contains the SQLite file, the
`exports/` directory, and any uploaded assets. Snapshot it with
`sqlite3 .backup` for consistent backups, or stop the backend, copy the
`/data` volume, and restart.

---

## 🤝 Contributing

We welcome pull requests, bug reports, RFCs, and documentation improvements.

Before opening a PR:

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Run `npm run lint && npm run format:check && npm test && npm run build`.
3. Sign your commits (`git commit -s`).
4. Reference the related issue or RFC in the PR body.

The full contribution workflow, code style, and release process are described
in [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 🗺️ Roadmap

A detailed, prioritized roadmap is in [ROADMAP.md](./ROADMAP.md). Highlights:

- **P0** — Quality and stability: accessibility audit, canvas test suite,
  performance budget, dependency review bot, public security policy.
- **P1** — Drawing experience: more shapes (racks, optical fiber, wireless,
  cloud), better connectors, multi-page diagrams, templates, cartouched
  exports, command palette.
- **P2** — Major features that stay on-philosophy: custom shape libraries,
  diagram diff, plugin SDK, standalone HTML export.
- **P3** — Long-term: floor-plan / geographic background layer, diagram
  linting, in-app shape editor, Git-style multi-user editing.

> **Non-goals.** NETDRAW does not aim to be a monitoring tool, an IPAM,
> or a real-time collaboration platform. See the dedicated section in
> [ROADMAP.md](./ROADMAP.md#-out-of-scope-explicit-non-goals) for the full
> list.

---

## 🛡️ Security & responsible disclosure

If you discover a security vulnerability, please **do not** file a public issue.
Email `security@netdraw.local` (placeholder) with a clear reproduction and we
will respond within 72 hours. See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for
the current threat model and hardening notes.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) — see the
[LICENSE](./LICENSE) file for details. © 2026 NETDRAW contributors.
