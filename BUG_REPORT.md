# NETDRAW Bug Report & Verification Log

This document lists the bugs identified during the open-source release audit,
their resolution status, and the verification steps. New findings should be
filed as GitHub issues; this file is the historical record of bugs caught
**before** the public launch.

---

## 🐛 Bug 1 — Custom SVG & device metadata loss on import — ✅ Fixed

- **Impact.** Severe (data loss). Importing a `.ndj` archive stripped
  `shape.data` (custom SVG payloads) and `shape.device` (vendor, model,
  modules, stack members…) so the diagram opened with blank shapes.
- **Root cause.** `repairDiagram()` in
  `apps/frontend/src/lib/compression.ts` rebuilt the shape but did not
  copy `data` or `device`.
- **Fix.** `repairDiagram` now preserves both fields and sanitizes
  `data.svg` with DOMPurify.
- **Verification.** Covered by the existing compression test suite
  (`apps/frontend/src/lib/compression.test.ts`).

---

## 🐛 Bug 2 — Stored XSS via custom SVG payloads — ✅ Fixed

- **Impact.** High (security). A malicious `.ndj` archive or uploaded
  asset could carry a `<script>` payload that executed on render.
- **Root cause.** `dangerouslySetInnerHTML` was used in
  `ShapeRenderer.tsx` without a sanitization pass.
- **Fix.** DOMPurify is now applied on every `shape.data.svg` and during
  `.ndj` import (`compression.ts::repairDiagram`).
- **Verification.** `apps/backend/tests/sanitize.test.ts` — 5 tests
  assert that scripts, event handlers, `foreignObject`, and DOCTYPE/PI
  declarations are stripped.

---

## 🐛 Bug 3 — Global linter script crash — ✅ Fixed

- **Impact.** Low (build system). `npm run lint` aborted because no
  `.eslintrc.json` existed.
- **Root cause.** `package.json` declared the lint script, but the config
  was missing.
- **Fix.** Added a root `.eslintrc.json` with the right `parserOptions`
  and a `parserOptions` block (without it, ESLint 8.57 raised
  “Environment key 'es2022' is unknown”). Verified clean on the full
  repo (exit 0).
- **Verification.** `npx eslint apps/backend/src apps/frontend/src`
  returns 0 and lists no findings.

---

## 🐛 Bug 4 — Inner routes accepted untyped payloads — ✅ Fixed

- **Impact.** Medium (robustness / data integrity). The routes for
  comments, snapshots, branches, workflow, and audit logs used
  `body as any`, so oversized or malformed payloads could reach the
  database.
- **Root cause.** Missing request validation.
- **Fix.** Introduced six Zod schemas in
  `apps/backend/src/schemas/project.ts`
  (`CreateCommentSchema`, `UpdateCommentSchema`, `CreateSnapshotSchema`,
  `UpsertBranchSchema`, `UpsertWorkflowSchema`, `CreateAuditLogSchema`)
  and rewired every route to use `safeParse` with structured 400 errors.
- **Verification.** Added `apps/backend/tests/schemas.test.ts` with 11
  unit tests covering happy paths and rejection of oversized /
  out-of-enum inputs.

---

## 🐛 Bug 5 — Prettier format drift not enforced in CI — ✅ Fixed

- **Impact.** Low (DX). Code could land unformatted and the team had no
  automated way to catch it.
- **Root cause.** `format:check` existed but was not wired into CI.
- **Fix.** Added a dedicated `format` job to
  `.github/workflows/ci.yml` and re-formatted the entire repo with
  `npm run format`.
- **Verification.** `npm run format:check` returns success; CI now fails
  the build on unformatted files.

---

## 🐛 Bug 6 — Placeholder tag in SVG allow-list — ✅ Fixed

- **Impact.** Cosmetic, but a code-review landmine.
- **Root cause.** `ALLOWED_TAGS` in `sanitize.ts` contained the typo
  `'lineargradient' /* not real case, see allowed tags below */` next
  to the legitimate `'linearGradient'`.
- **Fix.** The placeholder entry was removed; only the legitimate
  `'linearGradient'` and `'radialGradient'` tags remain.
- **Verification.** `npm test` still green; the existing SVG sanitization
  tests cover the gradient cases.

---

## 🐛 Bug 7 — `.antigravitycli/` symlink was not git-ignored — ✅ Fixed

- **Impact.** Low (privacy). A local symlink to
  `~/.gemini/config/projects/<id>.json` was committed (or staged) in a
  development environment; while the file content is generic, the path
  itself reveals a developer’s machine layout.
- **Root cause.** `.gitignore` did not list the directory.
- **Fix.** Added `.antigravitycli/`, `.gemini/`, and the standard
  AI-coding-tool directories (`.aider*`, `.cursor/`, `.continue/`,
  `.claude/`, `.kiro/`) to `.gitignore`.
- **Verification.** `git status --ignored` lists the directory; it will
  no longer be tracked.

---

## Outstanding findings (tracked in ROADMAP)

These are **not** bugs per se — they are known limitations documented in
[ROADMAP.md](./ROADMAP.md) and [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md):

- Bundle size > 500 kB (P1) — needs `manualChunks` and route-level
  dynamic imports.
- Last-write-wins collaboration (P2) — Yjs migration.
- CSP `'unsafe-inline'` (P1) — switch to nonces.
- No CSP `report-uri` (P1).

---

## Reporting a new bug

1. Search existing issues first.
2. Use the **Bug report** issue template.
3. Include the exact NETDRAW version, reproduction steps, expected vs.
   actual behaviour, and a minimal `.ndj` or screenshot if relevant.

Security vulnerabilities: please **do not** file a public issue. See
[SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for the disclosure process.
