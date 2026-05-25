# Tasks: Phase 0 — Foundation

**Input**: Design documents from `specs/phase-0-foundation/plan.md`

**Prerequisites**: plan.md (required), ROADMAP.md, CONSTITUTION.md

---

## Format: `[ID] [P?] [Area] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Area]**: web | api | root | ci | docs
- Include exact file paths in descriptions

---

## Phase 1: Root Project Setup

**Purpose**: Workspace configuration and local development infrastructure

- [x] **T001** [root] Create root `package.json` with npm workspaces (`apps/*`)
- [x] **T002** [root] Create `docker-compose.yml` with MongoDB 7 service
- [x] **T003** [root] Create root `.gitignore` (node_modules, .env, .next, coverage, logs)
- [x] **T004** [P] [root] Create `README.md` with setup instructions and project overview

**Checkpoint**: `docker-compose up` starts MongoDB locally

---

## Phase 2: Backend Foundation (Blocking)

**Purpose**: Express server, config, database, and core middleware

- [x] **T005** [api] Create `apps/api/package.json` with Express, Mongoose, Pino, Helmet, CORS, Zod, Jest, Supertest
- [x] **T006** [api] Create `apps/api/.env.example` with all required env vars
- [x] **T007** [api] Create `apps/api/src/config/env.js` — Zod-validated env loader (strict, fails fast on missing vars)
- [x] **T008** [api] Create `apps/api/src/config/db.js` — Mongoose connection with retry + graceful shutdown
- [x] **T009** [api] Create `apps/api/src/config/logger.js` — Pino structured JSON logger with redaction, requestId, correlationId
- [x] **T010** [api] Create `apps/api/src/middleware/requestId.js` — inject `requestId` and `correlationId`
- [x] **T011** [api] Create `apps/api/src/middleware/errorHandler.js` — centralized error middleware (safe responses, structured logs)
- [x] **T012** [api] Create `apps/api/src/app.js` — Express app factory with middleware stack (helmet → cors → json → requestId → pinoHttp → routes → errorHandler)
- [x] **T013** [api] Create `apps/api/src/server.js` — entry point (load env → connect DB → start server → handle SIGTERM)

**Checkpoint**: `npm run dev:api` boots Express; `GET /api/v1/health` returns 200

---

## Phase 3: Backend Models & Domain Services

**Purpose**: Mongoose schemas and business logic stubs

- [x] **T014** [api] Create `apps/api/src/models/Product.js` — flat product schema with `stockOnHand`, `version` (optimistic locking), `price: { amount, currency }`, `deletedAt` soft-delete
- [x] **T015** [api] Create `apps/api/src/models/AuditEvent.js` — append-only audit schema (actor, action, target, before/after/diff, timestamp, requestId)
- [x] **T016** [api] Create `apps/api/src/models/FeatureFlag.js` — kill-switch schema (name, enabled, scope, description, changedBy, timestamps)
- [x] **T017** [api] Create `apps/api/src/models/IdempotencyKey.js` — TTL collection schema (key, response, createdAt)
- [x] **T018** [api] Create `apps/api/src/domain/audit.js` — `createAuditEvent()` service, enforces append-only
- [x] **T019** [api] Create `apps/api/src/domain/features.js` — `isEnabled(name)` service with in-memory LRU cache (30s TTL, max 50 items)
- [x] **T020** [api] Create `apps/api/scripts/toggle-feature.js` — CLI to toggle kill switches (writes audit event)

**Checkpoint**: Models load without errors; `isEnabled()` resolves from DB + cache

---

## Phase 4: Backend Routes & API Surface

**Purpose**: V1 routes, health check, and admin endpoints

- [x] **T021** [api] Create `apps/api/src/routes/v1/index.js` — route aggregator
- [x] **T022** [api] Create `apps/api/src/routes/v1/health.js` — `GET /api/v1/health` (db status, uptime)
- [x] **T023** [api] Create `apps/api/src/routes/v1/admin/features.js` — `POST /toggle` (protected), `GET /list` for kill switches
- [x] **T024** [api] Create `apps/api/src/middleware/idempotency.js` — stub: reads `Idempotency-Key` header, validates format, stores key in TTL collection
- [x] **T025** [api] Create `apps/api/src/middleware/validate.js` — Zod-based request validation middleware

**Checkpoint**: All v1 routes respond correctly; idempotency middleware stores keys

---

## Phase 5: Frontend Scaffolding (Blocking)

**Purpose**: Next.js 14 shell with design tokens

- [x] **T026** [P] [web] Create `apps/web/package.json` with Next.js 14, React 18, TypeScript, Tailwind, Jest
- [x] **T027** [P] [web] Create `apps/web/.env.example`
- [x] **T028** [web] Create `apps/web/tailwind.config.ts` — extend theme with CSS variables from `design/tokens.css`
- [x] **T029** [web] Create `apps/web/postcss.config.js`
- [x] **T030** [web] Create `apps/web/tsconfig.json`
- [x] **T031** [web] Create `apps/web/src/styles/globals.css` — imports `design/tokens.css`, sets dark theme base
- [x] **T032** [web] Create `apps/web/src/app/layout.tsx` — root layout, metadata, font imports
- [x] **T033** [web] Create `apps/web/src/app/page.tsx` — placeholder home (brand name + Phase 0 indicator)
- [x] **T034** [web] Create `apps/web/src/lib/api.ts` — fetch wrapper with correlationId injection

**Checkpoint**: `npm run dev:web` starts Next.js; page renders with dark theme and tokens

---

## Phase 6: Design Token Integration

**Purpose**: Wire extracted tokens into the frontend build

- [x] **T035** [web] Copy `design/tokens.css` into `apps/web/src/styles/tokens.css`
- [x] **T036** [web] Update `apps/web/src/styles/globals.css` to consume token variables
- [x] **T037** [web] Create `apps/web/src/lib/design.ts` — token reference helpers (type-safe access to CSS vars)

**Checkpoint**: Token colors render correctly on the placeholder page

---

## Phase 7: CI/CD & DevOps

**Purpose**: Automated gates and deployment stubs

- [x] **T038** [P] [ci] Create `.github/workflows/ci-api.yml` — lint, test, npm audit, build check for backend
- [x] **T039** [P] [ci] Create `.github/workflows/ci-web.yml` — lint, TypeScript check, test, build for frontend
- [x] **T040** [ci] Create `.github/workflows/deploy.yml` — deploy stubs (Vercel for web, Render deploy hook for api)
- [x] **T041** [api] Create `apps/api/render.yaml` — Render blueprint (region: frankfurt, health check, env vars)

**Checkpoint**: Pushing to a branch triggers CI workflows; they pass or fail appropriately

---

## Phase 8: Compliance & Governance Artifacts

**Purpose**: Clear the Adoption Checklist

- [x] **T042** [P] [docs] Create `PRIVACY.md` — privacy registry template for Egypt + GCC (field name, purpose, legal basis, retention period)
- [x] **T043** [P] [docs] Create `apps/api/src/config/indexing.md` — indexing standards document (placeholder for Phase 1+ schema indexes)
- [x] **T044** [P] [docs] Create `docs/rollback.md` — deployment rollback runbook (Vercel instant rollback + Render deploy history)
- [x] **T045** [P] [docs] Create `docs/alerts.md` — alert thresholds stub (to be wired in Phase 7)

**Checkpoint**: All §XX Adoption Checklist items checked or intentionally deferred with TODO

---

## Phase 9: Testing & Validation

**Purpose**: Verify the skeleton works end-to-end

- [x] **T046** [api] Write integration test: `GET /api/v1/health` returns 200 with db connected
- [x] **T047** [api] Write unit test: `isEnabled()` returns correct value + caches
- [x] **T048** [api] Write unit test: `createAuditEvent()` appends to collection
- [x] **T049** [web] Write unit test: API client injects correlationId
- [ ] **T050** [root] Run `npm install` + `npm run lint` and `npm run test` from root; fix any failures (deferred to user — dependencies not installed)

**Checkpoint**: All tests pass; CI green on push

---

## Dependencies & Execution Order

```text
Phase 1 (Root) → Phase 2 (Backend Foundation) → Phase 3 (Models) → Phase 4 (Routes)
                                    ↓
Phase 5 (Frontend) → Phase 6 (Tokens) → Phase 7 (CI/CD) → Phase 8 (Docs) → Phase 9 (Tests)
```

- Phases 1, 5, 7, 8 have internal parallel tasks marked [P]
- Phase 2 blocks Phase 3; Phase 3 blocks Phase 4
- Phase 5 blocks Phase 6
- Phase 9 runs last and validates everything

---

## Notes

- Commit after each phase or logical group
- No business logic yet — this is scaffolding only
- Any deviation from the plan requires a `/clarify` gate (§XVIII)
