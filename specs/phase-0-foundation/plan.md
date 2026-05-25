# Implementation Plan: Phase 0 — Foundation

**Branch**: `phase-0-foundation` | **Date**: 2026-05-25 | **Spec**: ROADMAP.md §Phase 0, CONSTITUTION.md

**Input**: Phase 0 specification from ROADMAP.md and constitution adoption artifacts.

---

## Summary

Establish a running, deployable MERN skeleton with the constitution ratified and the Adoption Checklist cleared. This phase delivers the project structure, development environment, database connection, base Express server, Next.js frontend shell, structured JSON logging, CI/CD pipelines, feature-flag infrastructure, and compliance scaffolding (PRIVACY.md template + audit-event schema). No business features.

---

## Technical Context

| Item | Decision |
|------|----------|
| **Language/Version** | Node.js 20 LTS |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Backend** | Express 4, Mongoose 8, MongoDB Node.js Driver |
| **Logging** | Pino (structured JSON) |
| **Validation** | Zod |
| **Testing** | Jest, Supertest, React Testing Library |
| **Storage** | MongoDB Atlas (production); Docker/local for dev |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (frontend); Railway/Render/Heroku (backend) |
| **Target Markets** | Egypt + GCC; base currency EGP; multi-currency ready |
| **Performance Goals** | < 200ms p95 API response; < 3s TTI frontend |

---

## Constitution Check

*GATE: Must pass before implementation begins. Re-check after each major milestone.*

| Gate | Status | Notes |
|------|--------|-------|
| Server Authority (§III) | ☐ | API scaffold enforces no client-sent prices/auth; enforced in middleware |
| Security Baseline (§IV) | ☐ | Helmet, explicit CORS, input validation, strict Mongoose schemas |
| Data Integrity (§V) | ☐ | Integer money structure ready; multi-currency (ISO 4217) support |
| Inventory & Concurrency (§VI) | ☐ | Optimistic locking structure (`version` field) in Product model stub |
| Visual Design Fidelity (§2.1) | ✅ | Design tokens extracted and locked in `design/` |
| API Discipline (§X) | ☐ | Idempotency-Key middleware scaffold; pagination utilities |
| Process Discipline (§XVIII) | ✅ | `/clarify` completed for Phase 0 |
| Testing (§XVI) | ☐ | Test framework + CI gates configured; no failing tests allowed |

---

## Project Structure

```text
/
├── apps/
│   ├── web/                    # Next.js frontend → Vercel
│   │   ├── src/
│   │   │   ├── app/            # App Router (layout, page, loading, error)
│   │   │   ├── components/     # shared UI primitives
│   │   │   ├── lib/            # API client, utils, design-token imports
│   │   │   └── styles/         # globals + tokens.css
│   │   ├── public/
│   │   ├── tests/              # unit + integration
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── api/                    # Express backend → Railway/Render/Heroku
│       ├── src/
│       │   ├── config/         # env loader, DB connection
│       │   ├── domain/         # business logic / services
│       │   ├── models/         # Mongoose schemas (Product stub, FeatureFlag, AuditEvent)
│       │   ├── routes/v1/      # API routes
│       │   ├── middleware/     # requestId, logging, error handling, idempotency
│       │   ├── utils/          # helpers (isEnabled, pagination, etc.)
│       │   └── app.js          # Express application factory
│       ├── scripts/            # CLI utilities (toggle-feature.js)
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── contract/
│       ├── .env.example
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci-web.yml          # lint, test, build frontend
│       ├── ci-api.yml          # lint, test, audit, build backend
│       └── deploy.yml          # deployment stubs
│
├── design/                     # already extracted
│   ├── DESIGN_TOKENS.md
│   └── tokens.css
│
├── PRIVACY.md                  # privacy registry template (Egypt + GCC)
├── docker-compose.yml          # local MongoDB
└── package.json                # root workspace (npm workspaces)
```

**Structure Decision**: Monorepo via npm workspaces. `apps/web` and `apps/api` are independently deployable. Shared types/config live in-repo for now; extracted to `packages/` only when a second consumer appears (YAGNI — §I).

---

## Implementation Details

### 1. Backend Scaffolding (`apps/api/`)

**Express Application (`src/app.js`)**
- Middleware stack (order matters):
  1. `helmet()` — security headers
  2. `cors({ origin: allowedOrigins })` — explicit allowlist; no wildcard in production (§10.2, Severity-1)
  3. `express.json()` — body parser
  4. `requestIdMiddleware` — inject `requestId` + `correlationId`
  5. `pinoHttp` — structured request logging
- Health check: `GET /api/v1/health` → `{ status: "ok", db: "connected|disconnected", uptime }`
- Route mount: `app.use('/api/v1', routesV1)`
- Centralized error middleware — logs structured error, returns safe response, never leaks stack in production

**Database (`src/config/db.js`)**
- Mongoose connection with `mongoose.connect(uri, { autoIndex: false })` in production
- Retry logic with exponential backoff on initial connection
- Graceful shutdown: close connection on `SIGTERM` / `SIGINT`
- Environment-driven: `MONGODB_URI` from env only (§4.5)

**Logging (`src/config/logger.js`)**
- Pino with `pino-pretty` in dev, raw JSON in production
- Mandatory fields: `requestId`, `correlationId`, `timestamp`, `level`
- Redaction paths: `*.password`, `*.token`, `*.secret`, `*.card`
- `console.log` is prohibited via ESLint rule (§8.1)

**Feature Flags (`src/domain/features.js`, `src/models/FeatureFlag.js`)**
- **Release flags**: env-based (`process.env.FEATURE_X === 'true'`)
- **Kill switches**: MongoDB `features` collection
  ```js
  {
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    scope: { type: String, enum: ['payment','pricing','stock','global'] },
    description: String,
    changedBy: String,
    createdAt: Date,
    updatedAt: Date
  }
  ```
- `isEnabled(name)` service: checks in-memory LRU cache (max 50 items, 30s TTL), falls back to DB, updates cache
- Toggle endpoint: `POST /api/v1/admin/features/:name/toggle` — protected, writes audit event
- CLI script: `node scripts/toggle-feature.js --name=X --by=admin@neckline.com`

**Idempotency Middleware Stub (`src/middleware/idempotency.js`)**
- Reads `Idempotency-Key` header
- MongoDB `idempotency_keys` TTL collection scaffold (≥ 24h per §10.1)
- Actual enforcement wired in Phase 4 (orders); stub validates header format and stores key

### 2. Frontend Scaffolding (`apps/web/`)

**Next.js 14 App Router**
- `src/app/layout.tsx`: root HTML wrapper, imports `tokens.css`, sets `lang="en"`, metadata
- `src/app/page.tsx`: placeholder landing (brand name + "Phase 0" indicator)
- `src/lib/api.ts`: fetch wrapper that injects `X-Correlation-Id`, handles JSON, throws on 4xx/5xx
- `src/styles/globals.css`: imports `design/tokens.css`, base dark theme

**Design Token Integration**
- `design/tokens.css` is symlinked or copied into `src/styles/` at build time
- Tailwind CSS configured with custom theme referencing CSS variables from tokens
- No ad-hoc hex values in components (§2.1)

### 3. Mongoose Schema Stubs (`apps/api/src/models/`)

**Product (flat model — §5.3)**
```js
{
  name: String,          // e.g. "RED CHAPTER 30g"
  description: String,
  sku: { type: String, required: true, unique: true },
  price: { amount: Number, currency: String }, // §5.1: integer minor units + ISO 4217
  stockOnHand: { type: Number, default: 0 },
  version: { type: Number, default: 0 },       // AD-1: optimistic locking
  isActive: { type: Boolean, default: true },
  deletedAt: Date,                              // §5.4: soft deletion
  images: [String],
  category: String,
  tags: [String]
}
```

**AuditEvent (`src/models/AuditEvent.js`)**
```js
{
  actor: String,
  action: String,
  target: String,
  targetType: String,
  before: Object,
  after: Object,
  diff: Object,
  timestamp: { type: Date, default: Date.now },
  requestId: String
}
```
- Append-only; no `update` or `delete` operations through application logic (§8.3)

### 4. CI/CD & DevOps

**GitHub Actions**
- `ci-api.yml`: checkout → setup Node 20 → `npm ci` → ESLint → Jest (with coverage threshold stub) → `npm audit` → verify build
- `ci-web.yml`: checkout → setup Node 20 → `npm ci` → ESLint + TypeScript check → Jest → Next.js build
- `deploy.yml`: deployment stubs (Vercel CLI for web, Railway/Render Git push for api)

**Local Development**
- `docker-compose.yml`: MongoDB 7 service, port 27017, named volume
- Root `package.json` workspace definitions + scripts: `dev:api`, `dev:web`, `test`, `lint`

### 5. Compliance Artifacts

**PRIVACY.md**
- Template for Egypt + GCC markets (no GDPR)
- PII registry table: field name, purpose, legal basis, retention period
- Example entries: email (order communication), phone (shipping), address (delivery)

**Architecture Reference**
- `ARCHITECTURE.md` already ratified; no changes needed for Phase 0

---

## Complexity Tracking

> No constitution violations. All complexity is justified.

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|-----------|-------------------------------------|
| Next.js instead of Vite SPA | SSR/SSG foundation required for Phase 7 SEO | SPA would require a rewrite or add-on for launch SEO |
| Separate frontend/backend deployments | MERN stack requirement; independent scaling | Monolith would couple frontend releases to backend changes |
| MongoDB kill-switch collection | Constitution requires feature flags on payment/pricing/stock (§XIV); needs runtime toggle without redeploy | Env-only flags require restart to change, unacceptable for kill switches |

---

## Phase 0 Adoption Checklist Clearance

Before marking Phase 0 complete, verify:

- [x] Ratify constitution
- [x] Document architecture decisions
- [x] Define inventory strategy (optimistic locking — AD-1)
- [x] Define reservation policy (enabled, TTL 15min — AD-2)
- [ ] Configure audit schema (AuditEvent model + append-only service)
- [ ] Configure logging pipeline (Pino structured JSON, no console.log)
- [ ] Create PRIVACY.md (Egypt + GCC scope)
- [ ] Configure CI gates (lint, test, dependency scan, migration validation, privacy-registry drift)
- [x] Configure backup strategy (MongoDB Atlas native)
- [ ] Define deployment rollback procedure (documented in deploy.yml + runbook)
- [ ] Define alert thresholds (stubbed; wired in Phase 7)
- [ ] Define indexing standards (documented; applied when schemas solidify)
- [x] Define idempotency storage mechanism (MongoDB TTL collection — AD-3)
- [x] Define feature flag strategy (env + MongoDB kill switches)
- [x] Extract design tokens from provided images and lock the visual baseline

---

## Checkpoints

1. **Backend boots**: `npm run dev:api` starts Express; `/api/v1/health` returns 200; DB connected.
2. **Frontend boots**: `npm run dev:web` starts Next.js; renders with design tokens applied.
3. **CI green**: GitHub Actions passes lint + test + audit on both apps.
4. **Compliance ready**: PRIVACY.md exists; AuditEvent schema created; feature-flag service tested.
5. **Adoption Checklist**: all items checked or intentionally deferred with TODO.

---

## Dependencies & Execution Order

1. **Project root**: workspace config, docker-compose, root scripts
2. **Backend** (blocking frontend API client validation):
   - config → models → middleware → domain services → routes → app.js → tests
3. **Frontend**:
   - Next.js init → Tailwind + tokens → layout → page → API client → tests
4. **CI/CD**: GitHub Actions workflows (can be done in parallel with code)
5. **Compliance**: PRIVACY.md + audit schema (can be done in parallel)

---

**Next**: `/tasks` to generate the executable, dependency-ordered task list for Phase 0.
