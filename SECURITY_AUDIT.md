# NETDRAW Security Audit

This document presents the results of the security audit performed on
**NETDRAW**, the implemented defenses, and the residual risks that contributors
should be aware of.

> 🛡️ _If you discover a vulnerability, please email `security@netdraw.local`
> (placeholder address) **before** filing a public issue. We aim to acknowledge
> reports within 72 hours._

> [!CAUTION]
> **Project Status: ALPHA (NOT PROD-READY)**
>
> This audit was conducted on the **ALPHA** codebase of NETDRAW. While security protocols and sanitation pipelines have been actively hardened (e.g. client/server DOMPurify integration), code structures are undergoing active changes. This application must **exclusively be deployed in pre-production, lab, or test environments** and is **not production-ready**.

---

## Summary of defense architecture

| Scope        | Threat vector                | Implemented control                                                  | Status     |
| ------------ | ---------------------------- | -------------------------------------------------------------------- | ---------- |
| **Frontend** | Cross-Site Scripting (XSS)   | DOMPurify sanitization of every `shape.data.svg` and imported file   | ✅ Secured |
| **Frontend** | Local-storage tampering      | `nd:perms:*` only controls UI affordances, server is source of truth | ✅ Secured |
| **Frontend** | Mixed-content / CSRF         | Same-origin only, explicit CORS allow-list on backend                | ✅ Secured |
| **Backend**  | SQL injection                | All queries parameterized through Prisma                             | ✅ Secured |
| **Backend**  | Server-side SVG XSS          | JSDOM + DOMPurify with strict allow-list                             | ✅ Secured |
| **Backend**  | DoS via large uploads        | Multipart `MAX_UPLOAD_MB` + per-request body limit + node cap        | ✅ Secured |
| **Backend**  | RCE / unsafe deserialization | No `eval`/`Function`; Zod validation on every mutating route         | ✅ Secured |
| **Backend**  | SSRF                         | No outbound HTTP based on user input                                 | ✅ Secured |
| **Backend**  | CSRF                         | CORS origin allow-list, no cookie-based auth by default              | ✅ Secured |
| **Network**  | Header hardening             | Helmet (CSP, X-Frame-Options, nosniff) + Nginx (HSTS, COOP/COEP)     | ✅ Secured |
| **Network**  | Brute-force                  | `@fastify/rate-limit` (300 req/min/IP, health excluded)              | ✅ Secured |
| **Secrets**  | Leaked credentials           | No secrets in source; all sensitive values via `.env`                | ✅ Secured |

---

## 1. Frontend security audit

### 1.1 Cross-Site Scripting (XSS)

**Vector.** Diagram nodes render custom SVG icons (`shape.data.svg`) through
`dangerouslySetInnerHTML` in `ShapeRenderer.tsx`. A malicious `.ndj` import or
crafted SVG asset could in theory embed `<script>` or event-handler payloads.

**Defense.**

- `apps/frontend/src/canvas/ShapeRenderer.tsx` runs every custom SVG through
  `DOMPurify.sanitize(...)` with the strict SVG profile before injection.
- `apps/frontend/src/lib/compression.ts::repairDiagram` runs the same pass when
  importing a `.ndj` archive so tampered payloads are scrubbed at the trust
  boundary, not only at render time.
- The server-side route `POST /api/v1/assets/svg` (see §2.2) guarantees that
  nothing reaching the database was already malicious.

### 1.2 Local storage

**Vector.** User role and short-lived preferences live in `localStorage` under
the `nd:perms:*` namespace. An attacker able to run scripts in the page could
mutate these values.

**Defense.** The keys only gate UI affordances (e.g. showing the “admin” menu).
Server-side mutations still require a properly authenticated request (when
`AUTH_MODE` is enabled). With `AUTH_MODE=none` (the default for self-hosting)
the application is intentionally single-tenant and trust boundaries collapse
to the host.

### 1.3 CSRF

**Vector.** State-changing operations could be triggered cross-origin.

**Defense.** The Fastify server registers an explicit `origin` callback that
returns `false` for any origin not in `CORS_ORIGIN`. Browsers will block the
preflighted request. Cookies are only emitted by the server if
`AUTH_MODE !== 'none'`, in which case the auth middleware enforces a
`SameSite=strict` policy.

---

## 2. Backend security audit

### 2.1 SQL injection

**Vector.** Unsanitized parameters reaching a SQL query.

**Defense.** The codebase exclusively uses the Prisma client, which
parameterizes all queries. A grep for `$queryRaw` / `$executeRaw` confirms the
only raw call is the static health-check ping (`SELECT 1`); no user input
reaches raw SQL.

### 2.2 SVG uploads & sanitization

**Vector.** A user uploads an SVG with `<script>`, `<foreignObject>`, event
handlers, or a billion-laughs XML entity expansion.

**Defense** (in `apps/backend/src/lib/sanitize.ts` and
`apps/backend/src/routes/assets.ts`):

1. The multipart parser rejects any payload larger than `MAX_UPLOAD_MB` (default
   2 MB) **before** the body is fully buffered (`bodyLimit` on Fastify).
2. `sanitizeSvg` strips `<!DOCTYPE>` and `<?xml … ?>` declarations to defuse
   XXE vectors.
3. The string is parsed in a `JSDOM` window and passed through `DOMPurify`
   using the strict SVG profile plus an explicit allow-list of safe tags and
   attributes. `script`, `foreignObject`, and event handlers (`onload`,
   `onclick`, `onerror`, …) are forbidden.
4. A post-sanitize node cap (5 000 nodes by default) prevents DoS via
   CPU-blow-up inputs.
5. The `assets` route refuses the upload if the cleaned string does not still
   contain an `<svg>` root (i.e. the input was completely stripped).

### 2.3 Validation & input handling

Every mutating route (projects, comments, snapshots, branches, workflows,
audit logs, assets) parses the request body with a Zod schema before reaching
Prisma. The schemas live in `apps/backend/src/schemas/project.ts` and are
unit-tested in `apps/backend/tests/schemas.test.ts`.

### 2.4 SSRF / CSRF / RCE

- **SSRF.** The backend never makes outbound HTTP calls based on user input.
- **CSRF.** See §1.3.
- **RCE.** No `eval`, `Function`, `vm.runInNewContext`, or unsafe YAML loaders
  are used. Serialization is JSON only.

### 2.5 Error handling

A global `setErrorHandler` in `app.ts` always returns a structured
`{ error: { code, message } }` payload and never leaks stack traces to clients.
Server logs still receive the full stack via Pino.

---

## 3. Configuration security

### 3.1 HTTP headers

Enforced by both Fastify (via `@fastify/helmet`) and Nginx (in
`apps/frontend/nginx.conf`):

- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; …`
  `'unsafe-inline'` is required for Swagger UI and the inline editor. A future
  improvement (tracked in [ROADMAP.md](./ROADMAP.md)) is to replace it with
  per-build nonces.
- `X-Frame-Options: SAMEORIGIN` (Nginx) / `frame-ancestors 'self'` (Helmet).
- `X-Content-Type-Options: nosniff`.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`.

### 3.2 Secrets

A full repository scan was performed for `API_KEY`, `SECRET`, `PASSWORD`,
`BEARER`, `PRIVATE_KEY`, AWS credentials, and similar patterns. **No real
secrets are present.** The only matches are generic placeholders
(`please-change-me-in-production-32chars-min`,
`dev-only-secret-please-change-32chars`) shipped in `.env.example`, which are
explicitly excluded from version control by `.gitignore`.

A grep for private IP addresses (`192.168.x`, `10.x.x.x`, `172.16-31.x.x`),
personal emails, and domain names returned only documentation and example
references. No customer data, screenshots, or production logs are present.

### 3.3 Rate limiting

`@fastify/rate-limit` caps each IP at 300 requests per minute (configurable
via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW`). The `/api/v1/health` endpoint is
explicitly allow-listed so external uptime monitors do not consume the budget.

### 3.4 Containers

Both `Dockerfile`s run as **non-root** (`netdraw` UID 10001 on the backend,
`nginx` on the frontend), mount a single writable volume (`/data`), and use
multi-stage builds to keep the runtime image slim.

---

## 4. Supply-chain & dependency hygiene

- All direct dependencies are on the latest stable major version as of audit
  time. See [DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md) for the full table.
- The repository is configured to consume the committed `package-lock.json`
  in CI, preventing drift.
- An automated dependency-review action is **planned (P0)** and tracked in
  [ROADMAP.md](./ROADMAP.md).

---

## 5. Known limitations & follow-up work

The audit identified the following items that are **not** exploitable today
but warrant continued attention:

| ID    | Risk                                                                         | Mitigation status                      |
| ----- | ---------------------------------------------------------------------------- | -------------------------------------- |
| SA-01 | `script-src 'unsafe-inline'` required for Swagger UI and inline editor       | Tracked — switch to nonces in P1       |
| SA-02 | `AUTH_MODE=none` is the default for self-hosting simplicity                  | Documented; OIDC/local modes available |
| SA-03 | `XMLHttpRequest` does not enforce `withCredentials` opt-in (browser default) | OK by default, but verify on OIDC      |
| SA-04 | Service worker caches same-origin GET responses (offline UX)                 | API requests are network-first, OK     |
| SA-05 | No CSP `report-uri` configured                                               | Tracked — add in P1                    |

---

## 6. Audit log

| Date       | Auditor             | Notes                                             |
| ---------- | ------------------- | ------------------------------------------------- |
| 2026-06-07 | NETDRAW maintainers | Initial open-source release audit (this document) |
