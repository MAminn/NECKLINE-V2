# NECKLINE — E-Commerce Build Roadmap

Solid scent brand storefront. **Stack:** MERN (MongoDB, Express, React, Node).
**Method:** Spec-Driven Development via [GitHub Spec Kit](https://github.com/github/spec-kit).

## Locked decisions
- **Payments:** provider-agnostic — checkout built behind an adapter, concrete processor chosen in Phase 5.
- **Accounts:** guest checkout always allowed; optional accounts via JWT for order history.
- **Admin:** custom protected admin dashboard inside the MERN app.
- **Catalog:** flat products — each product is a single purchasable item with its own SKU, price, and stock (size/scent baked into the product, e.g. "RED CHAPTER 30g"); no separate Variant entity. Out-of-stock products stay visible with an "Out of Stock" label (admin-controlled), never hidden.
- **Infrastructure (MVP):** MongoDB is used for durable queues and idempotency storage — no Redis/broker until measured need.
- **Concurrency:** stock commits use **optimistic locking** (Product `version` + guarded `$inc`); cart **reservations enabled** via a MongoDB TTL collection, availability = stock − active reservations. See `ARCHITECTURE.md`.
- **Money:** multi-currency from day one; every amount stores its ISO 4217 currency code. Prices are tax-inclusive for MVP (no separate tax line yet); shipping is server-computed.

## How each phase runs (Spec Kit loop)
Run once at the start: `specify init` → `/constitution` (paste `CONSTITUTION.md`) → clear the Adoption Checklist (Constitution §XX).
Then per phase: `/specify` → `/clarify` → `/plan` → `/tasks` → `/analyze` → `/implement`.
`/clarify` and `/analyze` are mandatory gates on any phase touching money, auth, inventory, or personal data (Constitution §XVIII).

## Cross-cutting, non-negotiable (inherited from CONSTITUTION.md)
These are governed by the constitution and verified by `/analyze` before any `/implement` — they are not deferred to a final phase:
- **Server is authoritative (§III).** Never trust client-sent prices, totals, stock, or roles — recompute/validate server-side every request.
- **Security baseline (§IV).** OWASP gate, strict Mongoose schemas, secrets in env only, HTTPS + secure cookies + helmet, rate limiting, dependency scanning in CI, PCI scope kept to zero.
- **Visual design fidelity (§2.1).** The provided design images are the authoritative style. Frontend work reproduces them faithfully and may ADD hover/focus states, transitions, micro-interactions, animations, and responsive/loading states — but may NOT change colors, typography, layout, or brand styling. Any deviation is a `/clarify` gate. Design tokens are extracted from the images and centralized.
- **Observability & audit (§VIII).** Structured JSON logs, metrics on critical flows, append-only audit trail for money/inventory/roles/orders.
- **Correctness (§V–VII, §X).** Integer money, atomic+idempotent mutations, `Idempotency-Key` on money/order/inventory endpoints, durable queues for async, pagination + documented indexing, UTC timestamps.
- **Operability (§XIII–XIV).** Automated backups with tested restores, reversible migrations, CI/CD deploys, feature flags / kill switches on payment/pricing/stock.

---

## Phase 0 — Foundation ✅ DONE
**Goal:** A running, deployable MERN skeleton with the constitution ratified and the Adoption Checklist cleared.
**Scope:** repo + `specify init`, `/constitution` (paste `CONSTITUTION.md`), client/server split with a domain/service layer, env config, MongoDB connection, base Express server, React app shell, structured JSON logging, CI gates (lint, tests, dependency scan, migration validation, privacy-registry drift), automated backups, feature-flag infrastructure, deploy target stub. Architecture decisions are locked in `ARCHITECTURE.md` (optimistic locking, TTL-collection reservations, MongoDB idempotency store + queues). Remaining Phase 0 artifacts: `PRIVACY.md` template, audit-event schema, and **design tokens extracted from the provided images** to lock the visual baseline.
**`/specify` seed:** "Set up the MERN project skeleton, environment configuration, structured logging, CI gates, and a health-check endpoint. Establish the design-token baseline from provided design images. No business features yet."
**Done when:** app boots locally + deployed, CI green with all gates, constitution committed, Adoption Checklist (§XX) cleared.
**What was built:** MERN monorepo with npm workspaces (`apps/api`, `apps/web`), Express server with Helmet/CORS, MongoDB connection, Next.js 14 app router, design tokens in `tokens.css`, `ARCHITECTURE.md` locked, health endpoint, feature-flag system.

## Phase 1 — Product Catalog ✅ DONE
**Goal:** Browse products. Read-only.
**Scope:** flat Product schema (name, description, SKU, price, currency, `stockOnHand`, category, tags, images), product API (list/detail/filter), storefront listing page + product detail page (image gallery, description, quantity stepper — no variant selector).
**`/specify` seed:** "Customers can browse a catalog of solid-scent products and open a product detail page; each product has its own price and stock."
**Design fidelity (§2.1):** storefront listing + detail pages match the provided design images exactly; allowed to add hover/focus states, transitions, and skeleton/loading states only.
**Data & queries (§5.1, §5.3, §10.3):** flat Product model with soft deletion (`deletedAt`); every price carries an ISO 4217 currency code; out-of-stock products render with an "Out of Stock" label, not hidden; list endpoints paginated with a documented index strategy; no unbounded scans.
**Depends on:** Phase 0. **Done when:** seeded catalog renders end-to-end, paginated, pixel-faithful to the designs.
**What was built:** `Product` model with soft-delete, `GET /products` (list + filter + paginate) and `GET /products/:id`, storefront catalog page (`/shop`) and product detail page (`/products/[id]`), image gallery, quantity stepper.

## Phase 2 — Cart ✅ DONE
**Goal:** Add products to a cart and manage it (no login required).
**Scope:** guest cart persisted (cookie/localStorage + server cart id), add/update/remove line items keyed by product, quantity + stock validation, cart subtotal.
**`/specify` seed:** "A guest can add products to a cart, change quantities, remove items, and see a running subtotal. Cart survives refresh."
**Security:** prices and stock are read from the DB server-side at every cart operation — the client may only send product IDs and quantities, never prices.
**Design fidelity (§2.1):** cart UI matches the provided designs; add-to-cart and quantity controls may have animation/feedback, but no restyling.
**Reservations (§6.2, ARCHITECTURE.md):** add-to-cart creates a time-bound reservation (TTL collection, default 15 min, idempotent); availability = stock − active reservations; expiry auto-releases the hold.
**Depends on:** Phase 1. **Done when:** cart is reliable across sessions and respects stock.
**What was built:** `Cart` model, `CartContext` with cookie persistence, cart drawer, `POST/GET/PATCH/DELETE /cart` endpoints, `CartLineItem` + `CartSummary` components, stock validation, add-to-cart animations.

## Phase 3 — Auth & Accounts ✅ DONE
**Goal:** Optional JWT accounts; guest path stays intact.
**Scope:** register/login/logout, JWT issuance + refresh, password hashing, protected routes, merge guest cart into account on login, account page scaffold for order history.
**`/specify` seed:** "Customers may optionally create an account to log in and view order history. Guests can still do everything except view history."
**Security (§4.2–4.3):** Argon2/bcrypt hashing; JWT in `httpOnly` cookies, short-lived access + rotating, server-tracked revocable refresh tokens (invalidate on password reset/suspicious activity); capability-based authorization (Role→Permissions→Actions), no scattered inline role checks; rate-limit login/register; prevent account enumeration; enforce a password policy.
**Design fidelity (§2.1):** auth/account screens match the provided designs.
**Depends on:** Phase 2. **Done when:** both guest and logged-in flows work; carts merge correctly.
**What was built:** `User` model, JWT auth with `httpOnly` cookies, register/login/logout (`/auth/*`), `AuthContext` + `useAuth`, protected routes middleware (`authenticate`, `requirePermission`), `/account` page, password reset flow, guest cart merge on login.

## Phase 4 — Checkout & Orders ✅ DONE
**Goal:** Complete a purchase against a stub payment provider.
**Scope:** checkout flow (contact, shipping address, shipping method), Order schema + creation, inventory decrement on order, **PaymentProvider interface (adapter pattern)** with a test/stub implementation, order confirmation page.
**`/specify` seed:** "A customer completes checkout: enters shipping details, reviews the order, and pays through a pluggable payment interface (use a stub provider for now). An order is created and stock is decremented."
**Security & correctness (§III, §V, §VI, §X):** order total AND shipping cost computed server-side from DB data (prices are tax-inclusive for MVP — no separate tax line); CSRF protection; `Idempotency-Key` on order creation (one click = one order); stock decrement + order creation atomic (overselling is Severity-1); order stores historical snapshots (SKU, title, price, currency, discount) and becomes immutable after capture; behind a feature flag / kill switch.
**Design fidelity (§2.1):** checkout flow matches the provided designs.
**Depends on:** Phase 3. **Done when:** an order is created end-to-end via the stub provider. Gate: run `/clarify` + `/analyze`.
**What was built:** `Order` model with immutable snapshot, checkout flow (`/checkout` — shipping → review → payment), `PaymentProvider` adapter + `StubPaymentProvider`, `POST /checkout` + `POST /orders`, idempotency middleware, order confirmation page (`/order-confirmation/[orderNumber]`), order lookup (`/order-lookup`), inventory decrement via reservations.

## Phase 4.5 — Discounts & Promotions ✅ DONE
**Goal:** Apply promo codes and automatic offers to the cart/order total — computed entirely server-side.
**Scope:** PromoCode + Offer/Campaign domain models (code, type [percentage / fixed amount / free shipping], value, minimum order value, usage limit + per-customer limit, start/end window, status [Active/Scheduled/Expired], stackable flag, auto-apply flag, applies-to scope [all / specific products / collections / customer segments]); a server-side validation + application engine that recomputes the discounted total at cart and at checkout; atomic, idempotent usage-count tracking; the discounted total flows into the order snapshot.
**`/specify` seed:** "Customers can apply a promo code at cart/checkout and see the discount reflected in the total; eligible automatic offers apply without a code. All discount amounts are computed and validated on the server."
**Security & correctness (§III, §V, §X, §XII):** the discount amount is NEVER trusted from the client — the client sends only the code string; the engine validates eligibility (active window, minimum order, usage/ per-customer limits, scope) and computes the discount server-side; usage-count increment is atomic + idempotent (no over-redemption); the applied discount is captured in the immutable order snapshot (§5.4); behind a feature flag / kill switch; audit events on code create/redeem/expire.
**Admin UI note:** the management screens (create/edit codes & campaigns, usage analytics) ship in **Phase 6 → Offers**. This phase delivers the domain model + application logic that both checkout and that admin UI consume.
**Depends on:** Phase 4 (needs Order + server-side checkout pricing). **Done when:** a valid code reduces the server-computed total, an invalid/expired/over-limit code is rejected, and the discount is recorded in the order snapshot. Gate: `/clarify` + `/analyze` (money).
**What was built:** `PromoCode` model (unified manual + automatic), `discountService` (validate, compute, findBestDiscount, atomic usage), cart promo endpoints (`POST /cart/apply-promo`, `DELETE /cart/promo`), checkout promo integration, `PromoCodeInput` + `OrderSummary` components, admin CRUD (`/admin/promo-codes`), rate limiting, seed script (`SAVE10`, `SAVE500`, `FREESHIP`), frontend polish (navbar, quiz fix, animation perf, dead code cleanup).

## Phase 5 — Payment Integration
**Goal:** Wire a real processor into the Phase 4 adapter.
**Scope:** choose processor (Stripe / PayPal / regional), implement the concrete adapter, webhooks for payment confirmation, idempotent order finalization, refunds path, failure/retry handling.
**`/specify` seed:** "Implement the chosen payment provider behind the existing PaymentProvider interface, including webhook confirmation and refunds."
**Security & reliability (§4.6, §VII):** card data never touches your server — provider hosted fields/tokenization (zero PCI scope); verify webhook signatures; webhook consumers are idempotent, retry-safe, and never depend on in-memory state; finalize via a durable queue; confirm paid amount matches the server-side order total before fulfilling; refunds generate adjustment + audit events.
**Depends on:** Phase 4.5 (must charge the discounted total). **Done when:** a real test-mode payment confirms an order via webhook. Gate: `/clarify` + `/analyze`.

## Phase 6 — Admin Dashboard
**Goal:** Manage the entire store from a protected dashboard without touching the DB. Scope below is derived from the provided `Dashboard/` design images and is now design-locked (§2.1) — admin screens have designs and must match them.

**Sidebar nav (8 sections):** Dashboard · Products · Orders · Customers · Analytics · Offers · Reports · Settings. Global chrome on every screen: top search (orders/products/customers), currency switcher (EGP/USD/SAR), date-range picker, Export, and primary action button (e.g. "New Product").

**Scope by section:**
- **Dashboard (overview):** KPI cards (today's orders, revenue today, live sessions, conversion rate; total revenue, orders, avg order value, new customers — each with period delta), 30-day revenue chart (daily/weekly toggle), Top Products by units, Recent Orders table with status badges, Live Activity feed.
- **Products:** KPI cards (total / active / out-of-stock / total views); paginated, filterable table (search, category, status, tags, sort) — columns: image+name, SKU, category, price, stock, status (Active / Low Stock / Out of Stock), views, sales, row actions (view/edit/delete); product create/edit form with image upload; inventory + status management.
- **Orders:** status tabs with counts (All / Pending / Processing / Shipped / Delivered / Cancelled / Refunded); filters (order status, payment status, fulfillment status, date range); table — order #, customer, item thumbnails+count, total, payment badge, fulfillment badge, date, actions; order detail + fulfillment-status updates; manual "New Order".
- **Customers:** KPI cards (total / new / active / repeat); table — customer, contact (email+phone), location, total orders, total spent, status (Active/Inactive), last order, actions; customer detail; manual "Add Customer".
- **Analytics:** revenue / orders / customers over-time charts, Sales-by-Category donut, Top Products, Top Countries (Egypt + GCC), Traffic Sources. **Consumes the instrumentation delivered in Phase 7** (consent-gated analytics) — this screen renders that data, it does not define the tracking.
- **Offers:** two sub-pages — **Promo Codes** (code-based: code, type [percentage / fixed / free-shipping], discount, min order, usage count + limit, expiry, status [Active/Scheduled/Expired], bulk actions) and **Campaigns** (auto-applied offers, homepage banners, segments). Management UI only — discount *application/validation* is server-authoritative and lives with cart/checkout pricing (see Offers note below).
- **Reports:** exportable operational/financial reports (scope to confirm at `/specify`).
- **Settings:** sub-nav — Profile, Store, Team, **Roles & Permissions**, Payments, Shipping, **Taxes** (placeholder until tax registration — §III tax note), Notifications, Integrations, Appearance, Security, API keys, **Activity Log** (the audit trail surfaced read-only). Profile includes change-password and preferences (language, timezone GMT+2 Cairo, date/time format).

**`/specify` seed:** "An admin signs into a protected dashboard to view store KPIs and analytics, manage products + inventory + images, process orders and update fulfillment status, manage customers, create and manage promo codes and offers, and configure store settings including team roles & permissions — all matching the provided dashboard designs."
**Security (§4.3, §8.3, §XII):** capability-based authorization enforced server-side on every admin route and the Roles & Permissions matrix (never UI-hidden only); stricter rate limits; append-only audit trail on all admin mutations (money/inventory/roles/orders/offers) surfaced as the Activity Log; image uploads type-validated, size-limited, sanitized, stored outside the runtime filesystem, never executable; all admin lists paginated; admin search/export bounded and authorized.
**Design fidelity (§2.1):** admin screens now HAVE provided designs (`Dashboard/`) — they are design-locked exactly like the storefront. Only the permitted enhancements (hover/focus, transitions, loading/empty states, responsive) may be added.
**Depends on:** Phase 1–5 (Analytics screen also depends on Phase 7 instrumentation). **Done when:** every nav section above is operable end-to-end against real data and matches the dashboard designs.

> **Scope note:** Phase 6 is large. It can be split into **6a — Catalog/Orders/Customers admin** (the operational core) and **6b — Offers/Analytics/Reports/Settings** if a single phase proves too big. Left as one phase for now; confirm at `/plan`.

## Phase 7 — Launch Hardening
**Goal:** Production-ready.
**Scope:** transactional emails via durable queue (order confirmation/shipping), SEO + metadata, analytics behind a consent banner (§9.3), **privacy user-rights endpoints (§9.2): data export, account deletion respecting legal retention + audit-logged, rectification**, performance (image optimization, catalog caching with invalidation contract), error monitoring, alert thresholds wired to on-call (§8.2), backup restore drill (§13.2), final security review, legal pages.
**`/specify` seed:** "Prepare the store for launch: transactional emails, SEO, consent-gated analytics, privacy user-rights endpoints, performance, monitoring with alerts, a backup-restore drill, and a security pass."
**Depends on:** all prior. **Done when:** launch checklist clears and a restore has been successfully tested.

---

### Build order rationale
Catalog → Cart → Auth → Checkout → Discounts → Payment → Admin → Launch. Each phase only depends on contracts the previous one ships. Discounts (4.5) sit before Payment so the processor always charges the final, server-computed discounted total. Payment is deliberately split (Phase 4 abstraction, Phase 5 concrete) so the "decide later" choice never blocks checkout development.
