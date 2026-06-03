# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
# Development
npm run dev             # Start both API (port 4000) and web (port 3000) in parallel
npm run dev:api         # API only
npm run dev:web         # Web only

# Build
npm run build:web       # Next.js production build (API has no build step)

# Test
npm run test            # All tests (API + web)
npm run test:api        # API Jest tests with coverage
npm run test:web        # Web Jest tests
# Single test (run from apps/api or apps/web):
npx jest tests/unit/someFile.test.js

# Lint
npm run lint            # Both apps
npm run lint:api        # ESLint on apps/api/src/ and tests/
npm run lint:web        # Next.js lint

# Docker (local MongoDB)
docker-compose up -d
```

**First-time setup:**
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm install
docker-compose up -d
npm run dev
```

## Architecture

npm workspaces monorepo: `apps/api` (Express + MongoDB) and `apps/web` (Next.js 15).

### API — `apps/api/`

Express 4, Mongoose 8, Node 20. Entry: `src/server.js` → `src/app.js`.

```
src/
  config/       env.js (Zod validation), db.js, logger.js (Pino)
  middleware/   authenticate, maybeAuthenticate, idempotency, rateLimiters, validate
  models/       Mongoose schemas
  routes/v1/    Express routers (products, cart, auth, checkout, orders, promo-codes, admin/*)
  services/     Business logic — one file per domain
  validators/   Zod request schemas
```

**Auth:** JWT in HTTP-only cookies. Access tokens expire in 15 min, refresh tokens in 7 days. `authenticate` middleware is required-auth; `maybeAuthenticate` attaches a user if a valid token is present but doesn't reject anonymous requests.

**Three critical invariants (see ARCHITECTURE.md for full detail):**

- **AD-1 — Optimistic locking:** Stock decrements use `findOneAndUpdate({ _id, version, stockOnHand: { $gte: qty } }, { $inc: { stockOnHand: -qty, version: 1 } })`. If nothing matches, the caller must refetch and retry. Overselling is a Severity-1 bug.

- **AD-2 — Cart reservations:** A TTL-indexed `reservations` collection holds stock for 15 min. Storefront availability = `stockOnHand − Σ(active reservations)`. `stockOnHand` is only mutated on order capture (via AD-1), never by reservation creation/expiry.

- **AD-3 — Idempotency:** A TTL-indexed `idempotency_keys` collection maps `Idempotency-Key` headers → stored responses. POST mutations (cart, orders, payments) check this before executing.

### Web — `apps/web/`

Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, Framer Motion. All pages live under `src/app/` and are client-heavy (`'use client'`); the only true server components are the dynamic product and order-confirmation pages.

**State:** Two React Contexts at the root layout:
- `AuthContext` — user session, `login/register/logout/refreshUser`. Bootstraps by calling `/auth/me` on mount.
- `CartContext` — cart state + drawer open/close. Sends `Idempotency-Key` and `x-correlation-id` headers on mutations.

**API client (`src/lib/api.ts`):** Wraps `fetch` with credentials, correlation ID, and idempotency headers. On a 401 response it calls `/auth/refresh` once and retries the original request before failing.

**`params` in server components must be awaited** — Next.js 15 changed `params` to a Promise:
```tsx
// Correct pattern (required in Next 15+):
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Styling:** Tailwind with CSS custom properties for the design system. Token names follow `--color-gold`, `--color-bg`, `--text-primary`, etc., defined in `src/styles/globals.css`. Dark mode is always on (dark class on `<html>`).

**Fetch rewrite:** `next.config.mjs` rewrites `/api/*` → `NEXT_PUBLIC_API_URL/*`, so frontend code can call either the full API URL or the `/api/` prefix.

## Spec-Kit Workflow

This project uses **spec-kit** for spec-driven development. Every feature follows this mandatory loop before any code is written:

```
/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-analyze → /speckit-implement
```

| Command | What it does |
|---------|-------------|
| `/speckit-specify <description>` | Create `specs/<N>-<name>/spec.md` from a feature description (WHAT & WHY only) |
| `/speckit-clarify` | Ask up to 5 targeted questions to eliminate ambiguity; writes answers back into spec.md |
| `/speckit-plan` | Generate `plan.md`, `research.md`, `data-model.md`, `contracts/` from the spec |
| `/speckit-tasks` | Generate dependency-ordered `tasks.md` with IDs, parallelism markers, and file paths |
| `/speckit-analyze` | Read-only cross-artifact consistency check (spec ↔ plan ↔ tasks ↔ constitution) |
| `/speckit-implement` | Execute tasks.md phase-by-phase; marks each task `[X]` when done |
| `/speckit-checklist <type>` | Generate requirements-quality checklists (e.g. `ux`, `security`, `api`) |

**Constitution** (the non-negotiable governance document): `.specify/memory/constitution.md`  
`/speckit-analyze` enforces it before any `/speckit-implement`. Constitution violations are always CRITICAL.

**Active feature context** is tracked in `.specify/feature.json` — this tells all downstream commands where the current feature directory lives.

**Spec directories** live under `specs/`. Existing specs:
- `specs/phase-0-foundation/` — Phase 0 foundation (plan + tasks)
- `specs/phase-1-catalog.specify.md` — Phase 1 product catalog spec

<!-- SPECKIT START -->
Active plan: none
<!-- SPECKIT END -->

## Environment Variables

**API** (in `apps/api/.env`):
```
MONGODB_URI=mongodb://dev:devpassword@localhost:27017/neckline?authSource=admin
JWT_SECRET=<min 32 chars>
CORS_ORIGIN=http://localhost:3000
RESERVATION_TTL_MINUTES=15
IDEMPOTENCY_TTL_HOURS=24
CHECKOUT_ENABLED=true
```

**Web** (in `apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```
