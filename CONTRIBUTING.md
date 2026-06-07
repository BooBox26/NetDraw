# Contributing to NETDRAW

Thank you for your interest in contributing to **NETDRAW**! We welcome bug
reports, feature requests, documentation improvements, and pull requests.
This guide describes the day-to-day workflow and the standards we hold
contributions to.

---

## 📜 Code of conduct

By participating, you agree to abide by the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/) — be kind,
assume good faith, and focus on the work. Disrespectful behaviour is not
tolerated and will result in a ban from the project.

---

## 💻 Developer setup

### Prerequisites

- **Node.js** `v22.0.0` or higher
- **npm** `v10.0.0` or higher
- **Docker** (optional, for containerized testing)

### Installation

```bash
git clone https://github.com/netdraw/netdraw.git
cd netdraw
cp .env.example .env
npm install
npm run prisma:migrate -w @netdraw/backend
```

### Run the application in development

```bash
npm run dev
```

| Service           | URL                                   |
| ----------------- | ------------------------------------- |
| Frontend (Vite)   | <http://localhost:5173>               |
| Backend (Fastify) | <http://localhost:3001>               |
| Swagger UI        | <http://localhost:3001/docs>          |
| Health check      | <http://localhost:3001/api/v1/health> |

---

## 🎨 Code style & quality

| Tool       | Command                | Enforced in CI |
| ---------- | ---------------------- | -------------- |
| ESLint     | `npm run lint`         | ✅             |
| Prettier   | `npm run format:check` | ✅             |
| TypeScript | `tsc --noEmit`         | ✅             |
| Vitest     | `npm test`             | ✅             |

> **All four checks must pass** before a PR can be merged. Run them locally
> with:
>
> ```bash
> npm run lint && npm run format:check && npm test && npm run build
> ```

### Coding conventions

- TypeScript everywhere, no raw `.js` outside of generated files.
- React 19 functional components and hooks; no class components.
- Zustand for global state, `useState`/`useReducer` for local state.
- Tailwind v4 utility classes for layout; CSS modules for complex
  components.
- Keep functions small and named after their effect.
- Avoid `any`. If a type is genuinely unknown, narrow it with Zod at the
  boundary.

---

## 🧪 Testing

Every new feature or bug fix should land with **unit tests**. We use
[Vitest](https://vitest.dev/):

```bash
npm test                   # run all suites once
npm run test:watch -w @netdraw/backend   # backend watch mode
```

### Where to add tests

| Kind                     | Location                          |
| ------------------------ | --------------------------------- |
| Backend utility/schema   | `apps/backend/tests/*.test.ts`    |
| Frontend lib (pure)      | `apps/frontend/src/lib/*.test.ts` |
| Canvas / React component | `apps/frontend/src/**/*.test.tsx` |

---

## 🗄️ Database migrations

If you change `apps/backend/prisma/schema.prisma`:

1. Generate the Prisma client:
   ```bash
   npm run prisma:generate -w @netdraw/backend
   ```
2. Create a migration locally:
   ```bash
   npm run prisma:migrate -w @netdraw/backend
   ```
3. Commit both the schema and the generated `prisma/migrations/<id>` folder.

> **Never** edit a migration that has already been merged to `main`. Add a
> new one instead.

---

## 🔄 Pull request workflow

1. **Fork** the repository and clone your fork.
2. **Branch** from `main` with a descriptive name:
   - `feat/<short-slug>` for new features
   - `fix/<short-slug>` for bug fixes
   - `docs/<short-slug>` for documentation
   - `chore/<short-slug>` for tooling, deps, refactors
3. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(canvas): add smart snap-to-grid for connectors
   fix(security): sanitize SVG data attribute on import
   docs(readme): clarify docker compose prerequisites
   ```
4. **Push** your branch and open a PR against `main`.
5. **Wait for CI** to go green (lint, format, type-check, tests, build,
   docker).
6. **Request a review** from a maintainer. Address feedback in additional
   commits — avoid force-pushing after review has started.
7. **Squash-merge** is the default; the PR title becomes the commit
   message on `main`.

### PR checklist

- [ ] Tests cover the change
- [ ] Documentation updated (README, ROADMAP, or docs/) if relevant
- [ ] No new linter or formatter warnings
- [ ] No new dependency without justification
- [ ] Backwards compatibility considered; breaking changes called out in
      the PR body

---

## 🐛 Filing issues

Use the appropriate template:

- **Bug report** — exact version, reproduction steps, expected vs. actual
  behaviour. Include a minimal `.ndj` or screenshot when possible.
- **Feature request** — problem statement, proposed solution, alternatives
  considered.
- **Question** — prefer GitHub Discussions for usage questions.

### Security issues

**Do not** file a public issue. Email `security@netdraw.local` (placeholder
address) with a clear reproduction. We aim to acknowledge within 72 hours.
See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

---

## 🌐 RFCs for large changes

For changes that affect the public API, the data model, the build system,
or the governance model, open an **RFC** under GitHub Discussions (category
“RFCs”). The steering committee triages new RFCs weekly.

---

## 🤖 AI-assisted contributions

NETDRAW is built with an AI-assisted **Vibe Coding** workflow, and we are
happy to accept PRs that were partially drafted with AI assistants (Claude
Code, Copilot, etc.). The bar is the same as for any other PR:

- The contributor must be able to **explain** every line they submit.
- AI-generated code must be reviewed, type-checked, lint-clean, and tested
  by a human.
- The contributor is responsible for license compliance (no copyleft code
  introduced unwittingly) and for the security implications of the change.

Disclosing the use of an AI assistant in the PR body is encouraged, not
required.

---

## 👥 Governance and philosophy

NETDRAW is moving toward a community-led model. Roadmap items are
discussed in GitHub Discussions; the steering committee is elected by
active contributors. The full governance document is being drafted and
will land at `GOVERNANCE.md` once a critical mass of contributors is
reached.

> Keep pull requests focused on solving a single problem. Prioritize
> high-performance rendering (aim for 60 FPS viewport navigation) and
> preserve the homogeneous design of the 2.5D shape library.
