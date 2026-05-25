<!--
SYNC IMPACT REPORT
Version change: N/A (template) → 1.0.0
Modified principles: N/A (initial adoption from CONSTITUTION.md)
Added sections:
  I. Core Engineering Philosophy
  II. Stack & Architecture (including 2.1 Frontend & Visual Design Fidelity)
  III. Server Authority
  IV. Security Baseline
  V. Data Integrity & Financial Correctness
  VI. Inventory & Concurrency
  VII. Async Systems & Reliability
  VIII. Observability & Auditability
  IX. Privacy & Compliance
  X. API Discipline
  XI. Caching
  XII. File Uploads
  XIII. Database Migrations & Backups
  XIV. Deployment & Operational Discipline
  XV. Code Quality Standards
  XVI. Testing Strategy
  XVII. Time Standards
  XVIII. Process Discipline
  XIX. Severity Classification
  XX. Adoption Checklist
  XXI. Governance (new — version metadata and amendment procedure)
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — verified; generic Constitution Check references constitution file, no changes required
  ✅ .specify/templates/spec-template.md — verified; generic per-feature template, no changes required
  ✅ .specify/templates/tasks-template.md — verified; generic per-feature template, no changes required
Follow-up TODOs: None
-->

# specKit Constitution — E-Commerce Platform (NECKLINE)

> **Status:** Foundational engineering constitution for all phases of the e-commerce platform.
> **Scope:** Architecture, security, operational discipline, data integrity, observability, privacy, testing, deployment, and development process.
> **Usage:** Paste into Spec Kit's `/constitution` after `specify init`. Governs every phase; `/analyze` enforces it before any `/implement`.

---

## Executive Summary

This constitution is the single source of truth for how NECKLINE is built. It binds all roadmap phases and is enforced by Spec Kit's `/analyze` gate — no code is implemented until the spec and plan comply.

Two principles sit above everything: **the server is always authoritative** (prices, totals, stock, and permissions are computed and validated server-side, never trusted from the client), and **architectural complexity must be justified by measurable need** — prefer simple, observable systems over prematurely distributed designs.

The sections group into five themes:

- **Foundation (I–III):** engineering philosophy, MERN architecture with strict client/server separation, and **visual design fidelity** — the provided design images are the authoritative source of style.
- **Trust & safety (IV, V, IX):** OWASP-aligned security, capability-based authorization, payment PCI minimization, financial correctness (integer money, immutable orders), and a privacy/compliance baseline.
- **Correctness under load (VI, VII, X, XI):** concurrency safety (overselling is Severity-1), reliable async systems with durable queues, idempotency keys, disciplined caching, pagination, and indexing.
- **Observability (VIII):** structured logging, metrics on critical flows, and an immutable audit trail.
- **Operability & process (XII–XX):** file-upload safety, migrations/backups, automated deployment with feature flags, code quality, testing, UTC time, the Spec Kit loop, and a severity classification.

**Before Phase 0 starts,** the Adoption Checklist (Section XX) must be cleared — most critically: choose the stock-decrement strategy, decide the cart reservation policy, and stand up the audit, idempotency, and privacy scaffolding.

---

# I. Core Engineering Philosophy

- The platform prioritizes:
  1. Correctness
  2. Security
  3. Observability
  4. Maintainability
  5. Operational resilience
  6. Performance optimization

- Architectural complexity must be justified by measurable need.
- Prefer simple, observable systems over prematurely distributed designs.
- **MVP infrastructure baseline:** use MongoDB itself for durable queues and idempotency storage. Dedicated infrastructure (Redis, message brokers) is introduced only when measured load justifies it.
- Infrastructure decisions must optimize for long-term maintainability, not short-term novelty.
- The server is always the authoritative source of truth.

---

# II. Stack & Architecture

- Primary stack:
  - MongoDB
  - Mongoose
  - Express
  - React
  - Node.js

- Core architectural decisions require explicit review and documentation.
- New frameworks or infrastructure dependencies require:
  - documented justification
  - ownership
  - maintenance expectations

- Clear client/server separation:
  - React is a presentation layer only.
  - Business logic, authorization, pricing, inventory rules, and financial calculations belong exclusively on the server.

- Business logic must live in dedicated domain/service layers.
- Controllers, routes, and middleware orchestrate requests only:
  - validation
  - auth checks
  - service invocation
  - response formatting

- RESTful JSON API is the default communication model.
- Alternative communication patterns require explicit architectural justification.

- API routes are versioned:
  ```txt
  /api/v1/...
  ```

- API response contracts are treated as stable interfaces.
- Breaking API changes require explicit versioning.

- Configuration is environment-driven only.
- No environment-specific values may be committed to source control.

## 2.1 Frontend & Visual Design Fidelity (Non-Negotiable)

- The provided design images are the **single authoritative source of visual style.** The frontend reproduces them faithfully — layout, color, typography, spacing, imagery, and component appearance.
- Design tokens (colors, fonts, spacing scale, radii) are **extracted from the provided images** and centralized. Components consume tokens; no ad-hoc style values.
- The frontend **MAY add**, as long as the established visual style is unchanged:
  - hover, focus, active, and pressed states ("button feel")
  - transitions, micro-interactions, and animations
  - loading, skeleton, empty, and error states
  - responsive adaptation across breakpoints
  - accessibility affordances (focus rings, ARIA, reduced-motion fallbacks)
- The frontend **MAY NOT**:
  - change the core design language — colors, typography, layout structure, or brand styling
  - redesign or restyle components, introduce new themes, or substitute the provided look
  - invent visuals for screens not covered by a provided image without approval
- Any deviation from the provided design is a **`/clarify` gate**: it requires explicit approval before implementation.

---

# III. Server Authority (Non-Negotiable)

- The server never trusts client-provided:
  - prices
  - totals
  - discounts
  - stock levels
  - user roles
  - permission claims

- The client may send:
  - identifiers
  - quantities
  - UI preferences

- The client may never authoritatively provide:
  - money amounts
  - authorization state
  - inventory truth

- Every request must recompute and validate:
  - pricing
  - shipping cost
  - discounts
  - permissions
  - inventory availability

- **Tax (MVP):** displayed prices are tax-inclusive — there is no separate tax line for now. Once a tax registration is in place, a server-computed tax line may be added, at which point tax becomes server-authoritative like everything else above.

- Frontend state is ephemeral UI state only.
- The server remains authoritative after every mutation.

- Optimistic UI updates must reconcile against server-confirmed state.

---

# IV. Security Baseline

## 4.1 General Security

- OWASP Top 10 compliance is a release gate.
- HTTPS is mandatory in all production environments.
- Security headers enforced via Helmet or equivalent.

- All input must be:
  - validated
  - sanitized
  - schema-constrained

- Strict Mongoose schemas are required.
- No mass assignment vulnerabilities permitted.
- Unfiltered Mongo query operators are prohibited:
  - `$where`
  - raw operator injection
  - unsafe aggregation exposure

---

## 4.2 Authentication & Sessions

- Passwords must be hashed using:
  - Argon2 (preferred)
  - bcrypt

- Passwords may never be:
  - logged
  - stored in plaintext
  - exposed to analytics systems

- Authentication uses:
  - short-lived JWT access tokens
  - rotating refresh tokens

- Tokens are stored in:
  - httpOnly cookies
  - secure cookies
  - sameSite cookies

- Refresh tokens are individually revocable and tracked server-side.

- Password resets, credential changes, or suspicious activity invalidate active refresh sessions.

---

## 4.3 Authorization

- Authorization is capability-based and enforced server-side.

- Roles and permissions are centrally defined.

- Preferred hierarchy:
  ```txt
  Role → Permissions → Authorized Actions
  ```

- Hardcoded inline role checks scattered across the codebase are prohibited.

- Least privilege is mandatory.

---

## 4.4 Abuse Protection

- Rate limiting is mandatory for:
  - public endpoints
  - auth endpoints
  - admin endpoints
  - checkout flows

- Abuse prevention is considered a core architectural concern.

- Suspicious behavior must be observable:
  - coupon abuse
  - refund abuse
  - account farming
  - brute-force attempts
  - bot traffic

---

## 4.5 Secrets & Credentials

- Secrets exist only in:
  - environment variables
  - secret managers

- Secrets may never appear in:
  - source code
  - logs
  - client bundles

- Secrets must support rotation without code changes.

- Least-privilege credentials are mandatory.

---

## 4.6 Payments

- The platform never directly handles raw card data.

- Payment providers must use:
  - hosted fields
  - tokenization
  - provider-managed PCI flows

- Webhook signatures must always be verified.

- Webhook consumers must be:
  - idempotent
  - retry-safe
  - resilient to duplicate delivery

- Payment finalization must be atomic and idempotent.

---

# V. Data Integrity & Financial Correctness

## 5.1 Money

- Monetary values are stored as integer minor units:
  ```txt
  cents, piasters, etc.
  ```

- Floating-point money calculations are prohibited.

- **Multi-currency from day one:** every monetary value stores its ISO 4217 currency code alongside the amount. Amounts are never currency-ambiguous, and totals never mix currencies.

---

## 5.2 Orders

- Orders become immutable financial records after payment capture.

- Post-payment modifications generate:
  - adjustment events
  - refund records
  - reconciliation entries

- Historical totals must never be silently mutated.

---

## 5.3 Product Modeling

- **Flat product model:** each product is a single purchasable item with its own SKU, price, and stock. Size and scent are expressed per product (e.g. "RED CHAPTER 30g", "PULSE — TWIN 2×8g"), not as on-page selectable variants. There is no separate Variant entity.

- Each Product owns:
  - price (with its ISO 4217 currency code — §5.1)
  - SKU
  - stock (`stockOnHand`)
  - purchasable state

- **Out-of-stock behavior:** when a product's stock reaches zero, or an admin marks it out of stock from the dashboard, the product stays visible in the catalog with an "Out of Stock" label and is not purchasable. Out-of-stock items are never hidden or hard-deleted.

---

## 5.4 Historical Integrity

- Orders store historical snapshots:
  - SKU
  - title
  - price
  - discount state
  - tax state

- Product deletion must never invalidate historical order data.

- Products use soft deletion:
  ```txt
  deletedAt
  ```

---

# VI. Inventory & Concurrency

## 6.1 Concurrency Safety

- Overselling is a Severity-1 production bug.

- Concurrent operations affecting:
  - money
  - inventory
  - orders
  - payments

must be protected against race conditions.

- Approved mechanisms:
  - atomic operators
  - optimistic locking
  - database transactions
  - idempotency keys

---

## 6.2 Cart Reservations

- Cart additions do not permanently decrement stock unless reservation mode is enabled.

- Reservation systems must:
  - be time-bound
  - support expiration
  - atomically release stock on expiry

- Reservation endpoints must be idempotent.

---

## 6.3 Stock Mutation Guarantees

- Two concurrent purchases for the final unit must never both succeed.

- Chosen implementation strategy must be documented:
  - optimistic locking
  - atomic validation
  - transactional reservation

---

# VII. Async Systems & Reliability

- External systems are assumed unreliable.

- Critical flows must support:
  - retries
  - timeout handling
  - graceful degradation
  - reconciliation

- Background jobs affecting:
  - money
  - orders
  - inventory
  - compliance

must use durable queues.

- **MVP:** durable queues run on MongoDB (a jobs collection with status + retry tracking). Dedicated brokers are introduced only when measured load requires it (§I).

- Async jobs must be:
  - idempotent
  - retry-safe

- Webhook processing may never depend on in-memory state.

- Silent failures are prohibited.

- Critical failures must surface through:
  - logs
  - alerts
  - metrics
  - user-visible error states where appropriate

---

# VIII. Observability & Auditability

## 8.1 Structured Logging

- Structured JSON logging is mandatory.

- Logs must include:
  - requestId
  - correlationId
  - timestamps
  - severity

- Sensitive data may never appear in logs.

- `console.log` is prohibited in committed production code.

---

## 8.2 Metrics & Monitoring

- Critical flows emit:
  - latency metrics
  - throughput metrics
  - error-rate metrics

- Metrics required for:
  - auth
  - checkout
  - payments
  - inventory
  - admin actions

- Alert thresholds are defined before release.

---

## 8.3 Audit Trail

- The following domains require append-only audit events:
  - money
  - inventory
  - permissions
  - orders
  - refunds
  - role changes

- Audit events are non-deletable through application logic.

- Audit events include:
  - actor
  - action
  - target
  - before/after state or diff
  - timestamp
  - requestId

---

# IX. Privacy & Compliance

## 9.1 Data Minimization

- All collected PII must be documented in:
  ```txt
  PRIVACY.md
  ```

- Registry fields:
  - field name
  - purpose
  - legal basis
  - retention period

- New PII fields require:
  - documentation
  - clarify gate review

---

## 9.2 User Rights

Before public launch the system must support:

- Data export
- Account deletion requests
- Rectification

Deletion workflows must:
- respect legal retention rules
- be audit logged

---

## 9.3 Cookies & Consent

- Non-essential cookies require consent before activation.

- Auth/session cookies are exempt but must be documented.

---

# X. API Discipline

## 10.1 Idempotency

- State-changing endpoints for:
  - orders
  - payments
  - inventory

must support:
```txt
Idempotency-Key
```

- Duplicate keys must return the original response without repeating side effects.

- **MVP:** idempotency keys are stored in a MongoDB TTL collection (≥ 24h). A dedicated store (e.g., Redis) is introduced only when justified by measured need (§I).

---

## 10.2 CORS

- Production CORS uses explicit allowlists only.

- Wildcard CORS in production is Severity-1.

---

## 10.3 Pagination & Query Discipline

- All collection endpoints require pagination.

- Unbounded scans are prohibited in user-facing paths.

- N+1 query patterns are prohibited.

- Query patterns require documented indexing strategy.

---

## 10.4 Search

- Search infrastructure is non-authoritative.

- Search indexing may be eventually consistent.

- Checkout correctness must never depend on search indexing state.

---

# XI. Caching

- Caches are optimization layers only.

- Caches are never authoritative for:
  - money
  - inventory
  - permissions
  - checkout correctness

- Product catalog caching requires:
  - explicit invalidation contracts
  - freshness guarantees

- Cart, session, and pricing data are not cached by default.

---

# XII. File Uploads

- Uploaded files must be:
  - type validated
  - size limited
  - sanitized
  - virus scanned when applicable

- Uploads must not execute as application code.

- Files are stored outside the runtime filesystem.

---

# XIII. Database Migrations & Backups

## 13.1 Migrations

- Schema changes must be:
  - forward-compatible
  - reversible where possible

- Migrations run in CI before deployment.

- Rollback plans are mandatory before execution.

---

## 13.2 Backups & Recovery

- Production databases require automated backups.

- Restore procedures must be periodically tested.

- Backup existence alone is insufficient.

---

# XIV. Deployment & Operational Discipline

- Production deployments must be:
  - reproducible
  - automated
  - CI/CD-driven

- Manual hotfixing directly on production servers is prohibited.

- Production builds are immutable artifacts.

- Risky flows:
  - payment
  - pricing
  - stock management

must support:
  - feature flags
  - kill switches

- Rollback target:
  ```txt
  < 5 minutes
  ```

---

# XV. Code Quality Standards

- Linting and formatting are CI-enforced.

- Builds fail on lint errors.

- Functions/modules require single responsibility.

- Dead code is prohibited.

- Meaningful commit messages are mandatory.

- New dependencies require:
  - justification
  - maintenance review
  - security evaluation

---

# XVI. Testing Strategy

- Every phase ships with automated tests.

- Critical flows require:
  - unit tests
  - integration tests
  - end-to-end validation

- Mandatory coverage areas:
  - auth
  - pricing
  - checkout
  - payments
  - inventory
  - authorization
  - webhooks
  - idempotency
  - race conditions

- Server-authoritative rules require explicit tampering tests.

- No phase is complete with:
  - failing tests
  - failing CI
  - broken migrations

---

# XVII. Time Standards

- All backend timestamps are stored in UTC.

- Localization is presentation-only.

---

# XVIII. Process Discipline

Every phase follows:

```txt
/specify → /clarify → /plan → /tasks → /analyze → /implement
```

Rules:

- `/clarify` and `/analyze` are mandatory for:
  - money
  - auth
  - inventory
  - personal data

- A phase may only begin once:
  - dependent contracts are stable
  - API shapes are finalized
  - required schemas are approved

- CI must enforce:
  - linting
  - tests
  - dependency scanning
  - migration validation
  - privacy registry drift detection

---

# XIX. Severity Classification

## Severity-1

Includes:
- overselling inventory
- unauthorized privilege escalation
- payment duplication
- wildcard production CORS
- corrupted financial totals
- silent checkout failures
- exposed secrets
- data loss without recovery

Severity-1 incidents require:
- immediate escalation
- rollback consideration
- audit review
- documented postmortem

---

# XX. Adoption Checklist

Before Phase 0:

- [ ] Ratify constitution
- [ ] Document architecture decisions
- [ ] Define inventory strategy
- [ ] Define reservation policy
- [ ] Configure audit schema
- [ ] Configure logging pipeline
- [ ] Create PRIVACY.md
- [ ] Configure CI gates
- [ ] Configure backup strategy
- [ ] Define deployment rollback procedure
- [ ] Define alert thresholds
- [ ] Define indexing standards
- [ ] Define idempotency storage mechanism
- [ ] Define feature flag strategy
- [ ] Extract design tokens from provided images and lock the visual baseline

---

*specKit Constitution — Production E-Commerce Governance Standard*

---

# XXI. Governance

## Amendment Procedure

Changes to this constitution require:
- A `/clarify` gate with documented justification.
- Identification of affected sections and dependent templates.
- A version bump per semantic versioning rules:
  - **MAJOR**: backward-incompatible governance or principle removals/redefinitions.
  - **MINOR**: new principle/section added or materially expanded guidance.
  - **PATCH**: clarifications, wording, typo fixes, non-semantic refinements.

## Versioning Policy

- **MAJOR**: backward-incompatible governance or principle removals/redefinitions.
- **MINOR**: new principle/section added or materially expanded guidance.
- **PATCH**: clarifications, wording, typo fixes, non-semantic refinements.

## Compliance Review

- All feature specifications (`/specify`) must reference this constitution.
- `/analyze` enforces compliance before any `/implement`.
- The Adoption Checklist (§XX) must be cleared before Phase 0 begins.
- CI gates enforce linting, tests, dependency scanning, migration validation,
  and privacy registry drift detection (§XVIII).

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
