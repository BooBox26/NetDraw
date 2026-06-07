# NETDRAW Technical Debt Report

This document tracks the technical debt, architectural constraints, and
code-quality trade-offs present in **NETDRAW**. Resolved items are kept for
historical context with a ✅ marker; active debt is listed under §2.

---

## 1. Resolved items

### 1.1 Diagram repair limits ✅

- **Problem.** `repairDiagram()` in `compression.ts` did not copy `data` and
  `device` attributes, so custom shapes and inventory metadata disappeared on
  import/restore.
- **Resolution.** `repairDiagram` now preserves both objects and runs
  DOMPurify sanitization on `data.svg`.

### 1.2 Unsanitized custom SVG rendering ✅

- **Problem.** Custom SVGs reached the DOM via `dangerouslySetInnerHTML`
  without client-side sanitization.
- **Resolution.** `ShapeRenderer.tsx` runs every custom SVG through DOMPurify
  before injection (defense-in-depth on top of the server-side
  `sanitizeSvg`).

### 1.3 Linter crash on `npm run lint` ✅

- **Problem.** The root script referenced ESLint, but no `.eslintrc.json`
  existed; running `npm run lint` crashed.
- **Resolution.** Root `.eslintrc.json` added with TypeScript + React plugins
  and a `parserOptions` block. Verified clean on the full repo (exit 0).

### 1.4 Untyped `req.body as any` on inner routes ✅

- **Problem.** `comments`, `snapshots`, `branches`, `workflow`, and
  `audit-logs` routes accepted the body as `any`, which let malformed or
  oversized payloads reach Prisma.
- **Resolution.** Dedicated Zod schemas (`CreateCommentSchema`,
  `UpdateCommentSchema`, `CreateSnapshotSchema`, `UpsertBranchSchema`,
  `UpsertWorkflowSchema`, `CreateAuditLogSchema`) added in
  `apps/backend/src/schemas/project.ts` and unit-tested in
  `apps/backend/tests/schemas.test.ts`.

### 1.5 Prettier not enforced in CI ✅

- **Problem.** The `format:check` script existed but was not part of the
  pipeline.
- **Resolution.** A new `format` job was added to `.github/workflows/ci.yml`
  that fails the build on unformatted files. All files were re-formatted
  with `npm run format` during the audit.

### 1.6 Misleading tag entry in `sanitize.ts` ✅

- **Problem.** The `ALLOWED_TAGS` list contained a placeholder entry
  `'lineargradient' /* not real case, see allowed tags below */` that
  could confuse reviewers.
- **Resolution.** The placeholder was removed; only the legitimate
  `'linearGradient'` and `'radialGradient'` tags remain.

---

## 2. Active technical debt

### 2.1 Collaboration module is dormant (collaboration is out of scope)

- **State.** `apps/frontend/src/lib/collab.ts` exists with a basic
  WebSocket broadcast and last-write-wins semantics. The product
  philosophy is to stay a static, self-hostable diagramming tool, so
  real-time multiplayer editing is explicitly out of scope (see
  [ROADMAP.md §Out of scope](./ROADMAP.md)).
- **Plan.** Keep the module dormant and undocumented. If a future user
  needs file-based concurrent editing, prefer a Git-style three-way merge
  workflow over CRDTs (already sketched in the P3 of the roadmap).

### 2.2 LOD & zoom performance at scale

- **State.** A 500+ node diagram causes SVG layout thrashing; an LOD switch
  (`zoom < 0.15` → simplified `<rect>`) is already in place.
- **Plan.** For 1 000+ shapes, add viewport-based culling (only render
  shapes in the visible bounds) and, if profiling shows the canvas is still
  bottlenecked, consider a Canvas 2D renderer behind a feature flag. **A
  WebGL renderer is out of scope** for the same reason as 3D canvases in
  the roadmap. Tracked in [ROADMAP.md §P1](./ROADMAP.md).

### 2.3 Bundle size > 500 kB

- **State.** Vite warns that the main chunk (`index-*.js`) is 805 kB raw
  (206 kB gzipped) because the editor, shape library, and exporters are
  statically imported from the SPA entrypoint.
- **Plan.** Split the editor route from the dashboard via dynamic
  `import()` boundaries; lazy-load `commands.ts`, `serializer.ts`, and
  `compression.ts` so they ship in separate chunks.

### 2.4 `any` types in legacy model handlers

- **State.** A few model adapters (notably some legacy importer fallbacks)
  use `any` because of complex union narrowing.
- **Plan.** Add `unknown` and run-time narrowing (Zod) at the boundary;
  keep `@typescript-eslint/no-explicit-any: off` until each occurrence is
  audited and replaced with a precise type.

### 2.5 CSP `unsafe-inline`

- **State.** `script-src` currently contains `'unsafe-inline'` because
  Swagger UI and the inline canvas editor both emit inline scripts/styles.
- **Plan.** Switch to nonce-based CSP during a dedicated workstream. Tracked
  in [SECURITY_AUDIT.md §5](./SECURITY_AUDIT.md).

### 2.6 Default `AUTH_MODE=none`

- **State.** For self-hosting simplicity, the default auth mode is `none`
  (single-tenant trust).
- **Plan.** Document this clearly in the README (already done) and add a
  guided “enable auth” wizard in the dashboard settings (P2).

### 2.7 No CSP `report-uri`

- **State.** Violations are not reported to a telemetry endpoint.
- **Plan.** Add a configurable `report-uri` directive in the Nginx config
  once a self-hostable ingestion endpoint is available (P1).

---

## 3. Non-issues (intentional trade-offs)

These are **not** debt — they are deliberate choices documented so future
contributors do not “fix” them by accident:

- **React 19** is used directly (no `react-compiler` yet). The team will
  adopt the compiler when it stabilizes.
- **SQLite by default** is a feature, not a limitation. The Prisma schema
  supports PostgreSQL by changing `DATABASE_URL` and the provider.
- **No telemetry by default.** Anonymous usage telemetry is opt-in
  (`TELEMETRY_ENABLED=false`).
