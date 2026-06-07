# NETDRAW Dependency Audit

This document reviews the runtime and development dependencies of the
**NETDRAW** monorepo: their versions, licenses, and known vulnerabilities,
plus the strategy for keeping them healthy over time.

---

## 1. Core stack summary

| Category          | Package               | Version   | Workspace | License    | Status               |
| ----------------- | --------------------- | --------- | --------- | ---------- | -------------------- |
| **UI framework**  | `react` / `react-dom` | `^19.0.0` | Frontend  | MIT        | Modern (Stable)      |
| **Routing**       | `react-router-dom`    | `^7.1.1`  | Frontend  | MIT        | Modern (Stable)      |
| **State**         | `zustand`             | `^5.0.2`  | Frontend  | MIT        | Modern (Stable)      |
| **Styling**       | `tailwindcss`         | `^4.0.0`  | Frontend  | MIT        | Modern (Tailwind v4) |
| **Compiler**      | `vite`                | `^6.0.3`  | Frontend  | MIT        | Modern (Vite 6)      |
| **Linter**        | `eslint`              | `^8.57.0` | Root      | MIT        | Modern (configured)  |
| **API server**    | `fastify`             | `^5.1.0`  | Backend   | MIT        | Modern (Fastify v5)  |
| **Database ORM**  | `@prisma/client`      | `^5.22.0` | Backend   | Apache-2.0 | Stable               |
| **Validation**    | `zod`                 | `^3.23.8` | Shared    | MIT        | Stable               |
| **Sanitization**  | `dompurify`           | `^3.2.2`  | Both      | Apache-2.0 | Stable               |
| **Testing**       | `vitest`              | `^2.1.5`  | Both      | MIT        | Stable               |
| **DOM emulation** | `jsdom`               | `^25.0.1` | Backend   | MIT        | Stable (no CVE)      |
| **TypeScript**    | `typescript`          | `^5.6.3`  | Both      | Apache-2.0 | Modern               |
| **Logger**        | `pino-pretty`         | `^11.3.0` | Backend   | MIT        | Modern               |

### Frontend utility libraries

| Package              | Version    | Purpose                           |
| -------------------- | ---------- | --------------------------------- |
| `clsx`               | `^2.1.1`   | Conditional className composition |
| `dompurify`          | `^3.2.2`   | XSS sanitization                  |
| `@types/dompurify`   | `^3.2.0`   | Type definitions for DOMPurify    |
| `happy-dom`          | `^15.11.7` | Vitest DOM environment            |
| `@testing-library/*` | `^16.x`    | Component testing utilities       |
| `autoprefixer`       | `^10.4.20` | Vendor-prefix PostCSS plugin      |

### Backend utility libraries

| Package               | Version   | Purpose                 |
| --------------------- | --------- | ----------------------- |
| `@fastify/cors`       | `^10.0.1` | CORS handling           |
| `@fastify/helmet`     | `^12.0.1` | Security headers        |
| `@fastify/multipart`  | `^9.0.1`  | Multipart form parsing  |
| `@fastify/rate-limit` | `^10.1.1` | IP-based rate limiting  |
| `@fastify/static`     | `^8.0.2`  | Static-file serving     |
| `@fastify/swagger`    | `^9.2.0`  | OpenAPI spec generation |
| `@fastify/swagger-ui` | `^5.1.0`  | Swagger UI              |
| `fastify-plugin`      | `^5.0.1`  | Plugin helper           |

---

## 2. Tooling

- **npm Workspaces** — Single dependency tree for `apps/frontend` and
  `apps/backend`. The lockfile (`package-lock.json`) is committed and pinned
  in CI for reproducible builds.
- **npm-run-all** — Used at the root to run parallel and sequential scripts
  (e.g. `npm run dev`, `npm run build`).
- **Prettier** — `^3.3.3`. Auto-formatting and a `format:check` CI step.
- **TypeScript** — `^5.6.3`, consistent across both workspaces.
- **Vitest** — `^2.1.5`, the test runner for both workspaces.
- **ESLint** — `^8.57.x`, configured at the root (`.eslintrc.json`) with
  TypeScript and React plugins.

---

## 3. Vulnerability status

A `npm audit` run on the committed lockfile at audit time returned no
critical, high, or moderate advisories.

| Package     | Locked    | Notes                                                                        |
| ----------- | --------- | ---------------------------------------------------------------------------- |
| `dompurify` | `^3.2.2`  | Tracking DOMPurify ≥ 3.2 to inherit upstream XSS-bypass patches.             |
| `jsdom`     | `^25.0.1` | Used only server-side for SVG parsing. No known CVEs in the 25.x line.       |
| `prisma`    | `^5.22.0` | Held on the 5.x line to avoid the engine-loading changes that landed in 6.x. |
| `fastify`   | `^5.1.0`  | Fastify 5 is the current stable major; no known CVE in 5.1.x.                |
| `vite`      | `^6.0.3`  | Vite 6 is the current stable major.                                          |
| `react`     | `^19.0.0` | React 19 is the current stable major.                                        |

A `dependency-review-action` is planned (P0) to surface any future transitive
advisories on every PR.

---

## 4. License compliance

All direct and transitive dependencies are released under open-source
licenses compatible with the project’s MIT license:

- **MIT** — React, React Router, Zustand, Tailwind, Vite, Vitest, Fastify
  plugins, JSDOM, Pino, ESLint, Prettier, TypeScript, npm-run-all.
- **Apache-2.0** — Prisma, DOMPurify, TypeScript.
- **BSD-3-Clause** — a few minor utility libraries (e.g. icon helpers).

No copyleft license (GPL, AGPL, LGPL) is present in the dependency tree,
which keeps the project redistributable under the permissive MIT license.

---

## 5. Versioning strategy

- **Lockfile integrity** — `package-lock.json` is committed and used by CI
  for reproducible builds. Contributors should never rebase it without
  testing.
- **Caret ranges** — Dependencies are pinned with `^x.y.z` so that patch
  updates are easy to roll forward. Major upgrades require a separate PR
  with explicit testing.
- **Quarterly refresh** — A maintainer runs `npm outdated` once per quarter
  and triages non-breaking upgrades. The result is summarized in the
  following DEPENDENCY_AUDIT.md revision.

---

## 6. Unused / removable dependencies

A scan of `apps/frontend/src` and `apps/backend/src` for unused imports
returned no candidates for removal at audit time. The frontend `dist/` and
`node_modules/` directories are git-ignored. The `.antigravitycli/`
directory (a local CLI symlink) was added to `.gitignore` during this audit
so it cannot accidentally leak into the public repository.
