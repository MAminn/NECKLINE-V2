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
**Goal:** Manage the entire store from a protected dashboard without touching the DB. Scope is derived from the deleted `NicklineAdminPortal.tsx` UI (recovered from git history) plus the `Dashboard/` design images — both are design-locked (§2.1).

**Sidebar nav (10 sections):** Dashboard · Products · Orders · Customers · Analytics · Offers · Reports · Reviews · Interface Billboard · Settings. Global chrome on every screen: unified search bar (orders/products/customers), refresh, and primary action button per tab.

**Scope by section:**

- **Dashboard (overview):** KPI cards with sparklines (today's orders, revenue today, live sessions, conversion rate, returning rate; total revenue, orders, avg order value, new customers, pending count, processing count — each with period delta), Top Products ranked bar list, Recent Orders table with global search + status filter (ALL/PENDING/PROCESSING/SHIPPED/DELIVERED), Live Realtime Activity feed. Backend: `GET /api/v1/admin/metrics` aggregation endpoint (queries Orders + Users + Products, returns rolled-up KPIs + `visitsHistory[]` for sparklines); `GET /api/v1/admin/activities` (recent order/cart events feed).

- **Products:** KPI cards (total / active / out-of-stock / total views); paginated, filterable table (search, category, status) — columns: image+name, SKU, category, price, stock, status (ACTIVE / LOW STOCK / OUT OF STOCK), views, sales, row actions (edit/delete); product create modal with 3-image gallery upload + hero picker; product edit modal with same fields. Backend: existing `GET/POST /api/v1/admin/products` (from Product model), `PUT/DELETE /api/v1/admin/products/:id`.

- **Orders:** Search + status filter tabs (ALL / PENDING / PROCESSING / SHIPPED / DELIVERED); table — order ID, customer avatar+name, items summary, total (EGP), location, status badge, Inspect/Delete actions; click-to-inspect detail sidebar (status transition buttons, tracking number form, order info grid, timeline). Backend: `GET /api/v1/admin/orders` (list orders with customer info), `PUT /api/v1/admin/orders/:id` (status + trackingNumber), `DELETE /api/v1/admin/orders/:id`.

- **Customers:** Status tabs (ALL / ACTIVE / NEW / VIP); table — customer avatar+name, email, location, orders count, CLV, tags, actions; click-to-inspect detail sidebar (order history, sparkline). Backend: `GET /api/v1/admin/customers` (list Users with order aggregates), `DELETE /api/v1/admin/customers/:email`.

- **Analytics:** Timeframe selector (7D / 30D / ALL); SVG line chart (visits + checkout overlay); KPI metrics (CAC, MER, conversion, returning rate); Sales-by-Category share; AI Forecast card (projected revenue, recommended stock, top product). **Consumes Phase 7 instrumentation** — this screen renders that data, it does not define the tracking. Backend: `GET /api/v1/admin/metrics` (same endpoint as Dashboard, extended with `categoryShare[]` + `forecast{}`); `POST /api/v1/admin/reset-analytics` (dev/staging only).

- **Offers:** Two sub-sections — **Coupons** (code-based: code, type [percentage / fixed], discount amount, min spend, used count, status [ACTIVE/EXPIRED]; add/delete; maps to existing PromoCode model with `isAutomatic: false`) and **Campaigns** (auto-applied offers: title, subtitle, type [BOGO / DISCOUNT / BUNDLE], status [ACTIVE/DRAFT], valid-until; add/delete; maps to PromoCode with `isAutomatic: true`). Backend: `GET/POST/DELETE /api/v1/admin/coupons` and `GET/POST/DELETE /api/v1/admin/offers` — both are views over the existing `PromoCode` collection, split by `isAutomatic` flag. Management UI only — discount application/validation is server-authoritative and lives with cart/checkout pricing.

- **Reports:** Exportable operational/financial reports (scope to confirm at `/specify`).

- **Reviews** *(not in original plan — recovered from deleted UI):* Full CRUD over customer testimonials displayed on the storefront homepage. Table: customer name, product, star rating, comment excerpt, verified badge, date, edit/delete actions. Add-review modal (name, product dropdown, rating 1–5, comment). Edit-review modal (same + verified toggle + date override). Search by name/product/comment; filter by star rating. Backend: `GET/POST /api/v1/testimonials` (public read + admin create), `PUT/DELETE /api/v1/testimonials/:id` (admin only). Requires new `Testimonial` Mongoose model (name, product, rating, comment, verified, date, `deletedAt` soft-delete).

- **Interface Billboard** *(not in original plan — recovered from deleted UI):* CMS for two homepage content blocks without code changes.
  - *Hero Carousel:* list/add/edit/delete homepage hero slides. Fields: image (file upload or URL), title, subtitle, description, button text, link target (`#collection` / `#story` / `#reviews`). Backend: `GET /api/v1/header-slides` (public), `POST/PUT/DELETE /api/v1/admin/header-slides/:id` (admin). Requires new `HeaderSlide` Mongoose model (image, title, subtitle, description, buttonText, linkTo, order, active).
  - *How to Apply:* edit the 5 application steps shown on the homepage. Fields: accent color (hex), per-step number + title + description + icon (preset name or custom upload URL). Backend: `GET /api/v1/how-to-apply` (public), `POST /api/v1/admin/how-to-apply` (admin, upserts single config doc). Requires new `HowToApply` Mongoose model (color, steps[]).

- **Settings:** sub-nav — Profile (change name/password, language, timezone GMT+2 Cairo), Store, Team, **Roles & Permissions** (capability matrix), Payments, Shipping, **Taxes** (placeholder), Notifications, Integrations, Appearance, Security, API keys, **Activity Log** (append-only audit trail, read-only).

**New backend models required:** `Testimonial`, `HeaderSlide`, `HowToApply`.

**New admin API endpoints required (beyond what exists):**
- `GET /api/v1/admin/metrics` — dashboard KPI aggregation
- `GET /api/v1/admin/activities` — live activity feed
- `GET /api/v1/admin/orders` + `PUT/DELETE /api/v1/admin/orders/:id`
- `GET /api/v1/admin/customers` + `DELETE /api/v1/admin/customers/:email`
- `GET/POST/DELETE /api/v1/admin/coupons` (PromoCode, `isAutomatic: false`)
- `GET/POST/DELETE /api/v1/admin/offers` (PromoCode, `isAutomatic: true`)
- `GET/POST /api/v1/testimonials` + `PUT/DELETE /api/v1/testimonials/:id`
- `GET /api/v1/header-slides` + `POST/PUT/DELETE /api/v1/admin/header-slides/:id`
- `GET /api/v1/how-to-apply` + `POST /api/v1/admin/how-to-apply`

**`/specify` seed:** "An admin signs into a protected dashboard to view store KPIs and analytics, manage products + inventory + images, process orders and update fulfillment status, manage customers, create and manage promo codes and campaign offers, moderate customer reviews displayed on the storefront, manage homepage hero slides and How-to-Apply content via a CMS, and configure store settings — all matching the recovered dashboard UI design."

**Security (§4.3, §8.3, §XII):** capability-based authorization enforced server-side on every admin route (never UI-hidden only); stricter rate limits on all admin mutations; append-only audit trail on all admin mutations (money/inventory/roles/orders/offers/content) surfaced as the Activity Log; image uploads type-validated, size-limited, sanitized, stored outside the runtime filesystem, never executable; all admin lists paginated; admin search/export bounded and authorized. Public routes (`/testimonials`, `/header-slides`, `/how-to-apply`) are read-only, rate-limited, and require no auth.

**Design fidelity (§2.1):** UI must match the recovered `NicklineAdminPortal.tsx` design exactly — dark `#090203` background, crimson `#D21B27` accent, gold `#C29F68` mono labels, zinc-950 cards, sidebar with active state (`bg-[#1F0D0F]` + left crimson border). Only hover/focus states, transitions, and loading/empty states may be added.

**Depends on:** Phase 1–5 (Analytics screen also depends on Phase 7 instrumentation). **Done when:** all 10 nav sections are operable end-to-end against real data and match the recovered UI design.

> **Scope note:** Phase 6 is large. Split into **6a — Dashboard/Products/Orders/Customers** (operational core) and **6b — Analytics/Offers/Reports/Reviews/Interface Billboard/Settings** if a single phase proves too big. Confirm at `/plan`.

## Phase 7 — Launch Hardening
**Goal:** Production-ready.
**Scope:** transactional emails via durable queue (order confirmation/shipping), SEO + metadata, analytics behind a consent banner (§9.3), **privacy user-rights endpoints (§9.2): data export, account deletion respecting legal retention + audit-logged, rectification**, performance (image optimization, catalog caching with invalidation contract), error monitoring, alert thresholds wired to on-call (§8.2), backup restore drill (§13.2), final security review, legal pages.
**`/specify` seed:** "Prepare the store for launch: transactional emails, SEO, consent-gated analytics, privacy user-rights endpoints, performance, monitoring with alerts, a backup-restore drill, and a security pass."
**Depends on:** all prior. **Done when:** launch checklist clears and a restore has been successfully tested.

---

### Build order rationale
Catalog → Cart → Auth → Checkout → Discounts → Payment → Admin → Launch. Each phase only depends on contracts the previous one ships. Discounts (4.5) sit before Payment so the processor always charges the final, server-computed discounted total. Payment is deliberately split (Phase 4 abstraction, Phase 5 concrete) so the "decide later" choice never blocks checkout development.
