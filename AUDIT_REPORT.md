# NETDRAW Global Repository Audit Report

This document presents a detailed global audit of the **NETDRAW** repository,
covering tree structure, configurations, builds, CI/CD pipelines, and
refactoring actions taken during the open-source release preparation.

---

## 1. Directory Tree & Architecture Audit

The repository is structured as an npm workspaces monorepo:

```
. (root)
├── apps/
│   ├── backend/         # API server (Fastify + SQLite + Prisma)
│   └── frontend/        # Web application (React 19 + Zustand + Vite)
├── data/                # Volume mount point for Docker database & exports
├── docs/                # API, shortcuts, and performance documentation
├── .github/             # GitHub Actions workflows and templates
└── .antigravitycli/     # Local AI CLI state (git-ignored)
```

### Observations

- **Isolation** — Workspaces are clean and logical. The backend handles data
  mutations, validation, and sanitization; the frontend focuses purely on
  rendering and canvas interaction.
- **Data persistence** — The `data/` folder is the central local database
  and export mount point, correctly excluded from git (only `.gitkeep`
  placeholders are tracked).
- **Cross-workspace types** — Shared diagram types live in
  `apps/frontend/src/types/` and are imported by the editor and the
  serializer; the backend re-validates them with Zod on the trust boundary.

---

## 2. Configuration & Build Audit

### 2.1 Workspace config

- **Root `package.json`** — Configures the two workspaces and provides the
  top-level `dev`, `build`, `lint`, `format`, `format:check`, and `test`
  scripts.
- **ESLint** — Central `.eslintrc.json` at the root with TypeScript and
  React plugins. A companion `.eslintignore` keeps build artifacts and
  generated files out of the analysis. The `lint` scripts in both
  workspaces now explicitly invoke the local ESLint v8 binary to avoid
  picking up a system-wide v6.x.

### 2.2 TypeScript configuration

- **Backend** — Configured via `apps/backend/tsconfig.json` targeting
  Node 22 (`ES2022`).
- **Frontend** — Project references (`tsconfig.json`, `tsconfig.app.json`,
  `tsconfig.node.json`) targeting browser environments (`ESNext`).
- **Compilation check** — Verified. `npm run build` succeeds for both
  workspaces with no `tsc` errors.

### 2.3 Format enforcement

- **Prettier** — `^3.3.3` with a `npm run format:check` script.
- The repository was re-formatted during the audit and `format:check` now
  passes on every file.

---

## 3. Dependencies Audit

- **Core frameworks** — Latest stable majors:
  - React `^19.0.0`
  - Fastify `^5.1.0`
  - Tailwind `^4.0.0`
  - Zustand `^5.0.2`
  - Vite `^6.0.3`
- **Dev tools** — Vitest `^2.1.5`, TypeScript `^5.6.3`, ESLint `^8.57.1`.
- **Security** — `dompurify@^3.2.2` and `jsdom@^25.0.1` kept on
  recommended lines for the SVG sanitization pipeline.
- **No copyleft** — All dependencies are MIT or Apache-2.0; the project
  remains redistributable under its own MIT license.
- See [DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md) for the full table and
  the lockfile strategy.

---

## 4. CI/CD Pipelines Audit

- **GitHub Actions** — `.github/workflows/ci.yml` runs on every push and
  pull request against `main`.
- **Pipeline jobs**:
  1. `backend` — install, Prisma generate, type-check, lint, test, build.
  2. `frontend` — install, lint, type-check, build.
  3. `format` — runs `npm run format:check`.
  4. `docker` — builds both images via the production Dockerfiles.
- The `docker` job is gated on the three upstream jobs so we never publish
  an image that failed linting or testing.

---

## 5. Code-quality cleanups performed during this audit

The audit identified and **fixed** the following items:

| #   | Item                                                               | Status                                      |
| --- | ------------------------------------------------------------------ | ------------------------------------------- |
| 1   | `.eslintrc.json` rejected the `es2022` env without `parserOptions` | ✅ Fixed                                    |
| 2   | `npm run lint` picked up system ESLint v6.x                        | ✅ Fixed (explicit local binary)            |
| 3   | Placeholder tag (`'lineargradient'`) in the SVG allow-list         | ✅ Removed                                  |
| 4   | `comments`, `snapshots`, `branches`, `workflow`, `audit-logs`      | ✅ Zod schemas added                        |
|     | routes used `body as any` (no input validation)                    |                                             |
| 5   | `format:check` was not enforced in CI                              | ✅ Added as a dedicated job                 |
| 6   | `.antigravitycli/` (local AI CLI state) not git-ignored            | ✅ Added to `.gitignore`                    |
| 7   | No `.eslintignore` for `dist/`, `node_modules/`, generated files   | ✅ Created                                  |
| 8   | No tests covering the new Zod schemas                              | ✅ Added `tests/schemas.test.ts` (11 tests) |

Outstanding debt (tracked in [ROADMAP.md](./ROADMAP.md) and
[TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)):

- Main JS bundle is 805 kB raw (206 kB gzipped) — needs `manualChunks` and
  route-level dynamic imports (P1).
- Real-time collaboration is LWW — migrate to Yjs CRDTs (P2).
- CSP `script-src` still contains `'unsafe-inline'` for Swagger UI and
  the inline editor (P1, nonces).

---

## 6. Sensitive-data scan

A repository-wide scan was performed for `API_KEY`, `SECRET`, `PASSWORD`,
`BEARER`, `PRIVATE_KEY`, AWS credentials, private IP addresses, and
personal emails. **No real secrets or PII are present** in source code,
configuration, or documentation. The only matches are generic placeholders
shipped in `.env.example` files. See
[SECURITY_AUDIT.md §3.2](./SECURITY_AUDIT.md) for the full report.

---

## 7. Verification commands

The following commands must all succeed before publishing the repository:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
docker build -f apps/backend/Dockerfile -t netdraw-backend:ci .
docker build -f apps/frontend/Dockerfile -t netdraw-frontend:ci .
```

Last run: 2026-06-07 — all green.
