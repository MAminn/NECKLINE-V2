# Tasks: Admin Dashboard

**Input**: Design documents from `specs/006-admin-dashboard/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/admin-api.md ✅

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — operates on a different file with no dependency on incomplete peers
- **[Story]**: Maps to user story label (US1–US9) from spec.md
- Exact file paths are included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Token and type foundations required by every subsequent phase.

- [X] T001 Add admin CSS custom properties to `apps/web/src/styles/globals.css` (`--admin-bg: #090203`, `--admin-accent: #D21B27`, `--admin-gold: #C29F68`, `--admin-border`, `--admin-surface`)
- [X] T002 Add TypeScript types `Testimonial`, `HowToApply`, `AdminMetrics`, `ActivityEvent`, `HeaderSlide` (extends existing) to `apps/web/src/types/nickline.ts`

**Checkpoint**: `npm run build:web` still succeeds; no new lint errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All backend models, services, routes, and frontend shell must be complete before any user story tab can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### 2A — Backend Models (parallelizable)

- [X] T003 [P] Create `apps/api/src/models/Testimonial.js` (name, product, rating 1–5, comment, verified, date, deletedAt, timestamps; indexes `{deletedAt:1,createdAt:-1}`)
- [X] T004 [P] Create `apps/api/src/models/HeaderSlide.js` (image URL, title, subtitle, description, buttonText, linkTo enum, order, active, timestamps; index `{active:1,order:1}`)
- [X] T005 [P] Create `apps/api/src/models/HowToApply.js` (configKey unique default 'default', color hex, steps[], timestamps; unique index on configKey)
- [X] T006 [P] Add `fulfillmentStatus` enum `['unfulfilled','processing','shipped','delivered']` default `'unfulfilled'` and `trackingNumber` String fields to `apps/api/src/models/Order.js`; add index `{fulfillmentStatus:1,createdAt:-1}`
- [X] T007 [P] Add `views Number default 0`, `sales Number default 0`, `subtitle String default ''` fields to `apps/api/src/models/Product.js`; add index `{deletedAt:1,sales:-1}`

### 2B — Backend Services

- [X] T008 Create `apps/api/src/services/adminMetricsService.js` with MongoDB aggregation pipelines: `getMetrics()` (revenueToday, totalRevenue, ordersCount, todayOrdersCount, returningRate, newCustomers, pendingCount, processingCount, averageOrderValue, visitsHistory[], categoryShare[], forecast{}), `getActivities()` (last 20 AuditEvent docs transformed to ActivityEvent shape)
- [X] T009 [P] Create `apps/api/src/services/uploadService.js` with `uploadImage(buffer, mimetype)` — proxies to Cloudinary if `CLOUDINARY_URL` is set, otherwise returns a not-configured error with a 501 response code
- [X] T070 [P] Add `PATCH /auth/password` to `apps/api/src/routes/v1/auth.js`: requires `authenticate` middleware; Zod schema validates `{ currentPassword: string, newPassword: string min 8 }` using `authSchemas`; calls `authService.verifyPassword(user, currentPassword)` then `authService.updatePassword(user.id, newPassword)`; invalidates existing refresh tokens on success; returns 400 if current password is wrong

### 2C — Validators & Rate Limiter

- [X] T010 Add `rateLimiterAdmin` (windowMs 15 min, max 200) to `apps/api/src/middleware/rateLimiters.js` and export it alongside existing limiters
- [X] T068 [P] Create `apps/api/src/validators/contentSchemas.js` with Zod schemas: `testimonialSchema` (name string max 100, product string, rating number 1–5, comment string max 1000, verified boolean optional, date string), `headerSlideSchema` (image URL string, title max 100, subtitle optional, description optional, buttonText optional, linkTo enum['collection','story','reviews'], order number optional, active boolean optional), `howToApplySchema` (color hex string, steps array of {num, title, desc, iconType enum, presetName optional, customIconUrl optional})
- [X] T069 [P] Create `apps/api/src/validators/adminSchemas.js` with Zod schemas: `createProductSchema` / `updateProductSchema` (name, sku, category, price integer, currency, stockOnHand integer, subtitle optional, description optional, images string array, purchasable boolean), `updateOrderSchema` (fulfillmentStatus enum['unfulfilled','processing','shipped','delivered'] optional, trackingNumber string optional), `createCouponSchema` (code string, type enum['percentage','fixed'], value number, minOrderAmount number optional, usageLimit number optional, endDate string optional), `createOfferSchema` (description string, type enum['percentage','fixed'], value number, minOrderAmount optional, endDate string optional)

### 2D — Content Routes (public reads + admin writes; parallelizable)

- [X] T011 [P] Create `apps/api/src/routes/v1/testimonials.js`: `GET /testimonials` (public, filter `deletedAt:null`); admin write sub-router at `/testimonials` applies `authenticate` + `requirePermission('admin:access')` + `rateLimiterAdmin` then handles `POST /testimonials`, `PUT /testimonials/:id`, `DELETE /testimonials/:id` (soft-delete); validate request body with `contentSchemas.testimonialSchema` (T068); emit `createAuditEvent` on write operations
- [X] T012 [P] Create `apps/api/src/routes/v1/headerSlides.js`: `GET /header-slides` (public, `{active:true}` sorted by order); admin write sub-router applies `authenticate` + `requirePermission('admin:access')` + `rateLimiterAdmin` then handles `POST /admin/header-slides`, `PUT /admin/header-slides/:id`, `DELETE /admin/header-slides/:id`; validate body with `contentSchemas.headerSlideSchema` (T068); emit `createAuditEvent` on writes
- [X] T013 [P] Create `apps/api/src/routes/v1/howToApply.js`: `GET /how-to-apply` (public, returns configKey:'default' doc); admin write sub-router applies `authenticate` + `requirePermission('admin:access')` + `rateLimiterAdmin` then handles `POST /admin/how-to-apply` (findOneAndUpdate upsert on configKey:'default'); validate body with `contentSchemas.howToApplySchema` (T068); emit `createAuditEvent` on write

### 2E — Admin-Only Routes (parallelizable after T008)

- [X] T014 [P] Create `apps/api/src/routes/v1/admin/metrics.js`: `GET /admin/metrics` (admin:access) — calls `adminMetricsService.getMetrics()`; apply `rateLimiterAdmin`
- [X] T015 [P] Create `apps/api/src/routes/v1/admin/activities.js`: `GET /admin/activities` (admin:access) — calls `adminMetricsService.getActivities()`; apply `rateLimiterAdmin`
- [X] T016 [P] Create `apps/api/src/routes/v1/admin/products.js`: `GET /admin/products` (paginated, search/category/status query params, KPI totals in response); `POST /admin/products` (validate with `adminSchemas.createProductSchema`); `PUT /admin/products/:id` (validate with `adminSchemas.updateProductSchema`); `DELETE /admin/products/:id` (soft-delete, sets `deletedAt`); emit `createAuditEvent` on writes; apply `rateLimiterAdmin`
- [X] T017 [P] Create `apps/api/src/routes/v1/admin/orders.js`: `GET /admin/orders` (paginated, search/fulfillmentStatus/status filters); `PUT /admin/orders/:id` (validate with `adminSchemas.updateOrderSchema`; fulfillmentStatus + trackingNumber); `DELETE /admin/orders/:id` (hard delete, audit-logged); emit `createAuditEvent` on writes; apply `rateLimiterAdmin`
- [X] T018 [P] Create `apps/api/src/routes/v1/admin/customers.js`: `GET /admin/customers` (paginated, search; aggregate ordersCount + lifetimeValue from Order collection; VIP threshold: ordersCount ≥ 3 OR lifetimeValue ≥ 50000; KPI totals: total, newThisWeek, returning); `DELETE /admin/customers/:email` (emit `createAuditEvent`; audit-logged); apply `rateLimiterAdmin`
- [X] T019 [P] Create `apps/api/src/routes/v1/admin/coupons.js`: `GET /admin/coupons` (PromoCode where `isAutomatic:false`); `POST /admin/coupons` (validate with `adminSchemas.createCouponSchema`; creates PromoCode with `isAutomatic:false`); `DELETE /admin/coupons/:id`; emit `createAuditEvent` on writes; apply `rateLimiterAdmin`
- [X] T020 [P] Create `apps/api/src/routes/v1/admin/offers.js`: `GET /admin/offers` (PromoCode where `isAutomatic:true`); `POST /admin/offers` (validate with `adminSchemas.createOfferSchema`; creates PromoCode with `isAutomatic:true`); `DELETE /admin/offers/:id`; emit `createAuditEvent` on writes; apply `rateLimiterAdmin`
- [X] T021 [P] Create `apps/api/src/routes/v1/admin/activityLog.js`: `GET /admin/activity-log` (paginated, default limit 50, returns AuditEvent docs sorted `{timestamp:-1}`); apply `rateLimiterAdmin`
- [X] T022 [P] Create `apps/api/src/routes/v1/admin/uploads.js`: `POST /admin/uploads` (multipart/form-data, max 5 MB, image/jpeg|png|webp only; calls `uploadService.uploadImage()`; returns `{url}`); apply `rateLimiterAdmin`

### 2F — Route Registration

- [X] T023 Register all new routes in `apps/api/src/routes/v1/index.js`: mount `testimonials`, `headerSlides`, `howToApply`, and all new `admin/*` routers under the existing v1 prefix (depends on T011–T022 route files existing)

### 2G — Frontend Admin Shell

- [X] T024 [P] Create `apps/web/src/lib/admin-api.ts` with typed `apiGet<T>`, `apiPost<T>`, `apiPut<T>`, `apiDelete<T>` wrappers around the existing `apiClient` from `apps/web/src/lib/api.ts`; export named functions for every endpoint in `contracts/admin-api.md` (e.g. `getMetrics()`, `getAdminProducts(params)`, `updateOrder(id, body)`, etc.)
- [X] T025 [P] Create `apps/web/src/components/admin/AdminSidebar.tsx`: dark `--admin-bg` sidebar with logo, 10 nav items (Dashboard, Products, Orders, Customers, Analytics, Offers, Reports, Reviews, Interface, Settings), active state highlight in `--admin-accent`, admin user name + role footer
- [X] T026 [P] Create `apps/web/src/components/admin/AdminModal.tsx`: reusable modal wrapper with backdrop blur, close button, title prop, and children slot; uses Framer Motion for enter/exit animation
- [X] T027 [P] Create `apps/web/src/components/admin/AdminImageUploader.tsx`: URL text input as primary path; optional file `<input>` that calls `POST /admin/uploads` and populates the URL field on success; displays image preview when URL is set
- [X] T028 Create `apps/web/src/app/admin/layout.tsx`: reads `user` from `AuthContext`; redirects to `/login?redirect=/admin` if `!user || user.role !== 'admin'`; renders `<AdminSidebar>` + `{children}` inside a flex layout using `--admin-bg` background (depends on T025)
- [X] T029 Create `apps/web/src/app/admin/page.tsx`: Next.js redirect component that sends to `/admin/dashboard`

**Checkpoint**: `GET /api/v1/testimonials` returns `[]`; `GET /api/v1/admin/metrics` returns 401 without auth, 200 with admin token. Navigating to `/admin` while logged in as admin shows the sidebar; without auth it redirects to login.

---

## Phase 3: User Story 1 — Store Overview & Live Monitoring (Priority: P1) 🎯 MVP

**Goal**: Admin opens Dashboard tab and sees live KPI cards with sparklines, Top Products list, Recent Orders table, and Live Activity feed — all populated from real API data.

**Independent Test**: Seed orders via the API, open `/admin/dashboard`, verify all 10 KPI cards show non-zero values and the Top Products list is ranked by sales.

- [X] T030 [US1] Create `apps/web/src/components/admin/AdminKpiCard.tsx`: displays label, value, trend direction, and an SVG sparkline built from a `history: number[]` prop; uses `--admin-gold` for labels and `--admin-accent` for accent highlights
- [X] T031 [P] [US1] Create `apps/web/src/components/admin/dashboard/DashboardKpis.tsx`: fetches `getMetrics()` on mount; renders 10 `AdminKpiCard` instances (Revenue Today, Total Revenue, Orders Today, Total Orders, Avg Order Value, Conversion Rate, Returning Rate, New Customers, Pending, Processing) with sparkline data from `visitsHistory`
- [X] T032 [P] [US1] Create `apps/web/src/components/admin/dashboard/TopProductsList.tsx`: fetches top products from metrics response `categoryShare`; renders a ranked list with relative bar widths; shows rank number, product name, units sold
- [X] T033 [P] [US1] Create `apps/web/src/components/admin/dashboard/RecentOrdersTable.tsx`: renders a table of recent orders from metrics with columns: Order ID, Customer, Items, Total, Status badge; includes a search input that filters client-side
- [X] T034 [P] [US1] Create `apps/web/src/components/admin/dashboard/ActivityFeed.tsx`: fetches `getActivities()` on mount then polls every 10 seconds via `setInterval` (cleared in `useEffect` cleanup); renders a list of activity items each with icon, user, text, sub-text, and relative timestamp; new items slide in at the top without a full re-render of the list (satisfies US1 AS2 "without requiring a page refresh")
- [X] T035 [US1] Create `apps/web/src/app/admin/dashboard/page.tsx`: assembles `DashboardKpis`, `TopProductsList`, `RecentOrdersTable`, and `ActivityFeed` in a two-column layout matching the NicklineAdminPortal design

**Checkpoint**: Dashboard tab loads within 2 s, all KPI cards render without errors, activity feed shows recent events.

---

## Phase 4: User Story 2 — Product & Inventory Management (Priority: P1)

**Goal**: Admin can view, create, edit, and delete products from a paginated table; changes are immediately reflected on the storefront.

**Independent Test**: Click "Add Product", fill all fields, save — verify product appears in table and at `/shop`. Edit stock to 0 — verify "Out of Stock" badge. Delete — verify product disappears.

- [X] T036 [P] [US2] Create `apps/web/src/components/admin/products/AddProductModal.tsx`: form with name, SKU, category dropdown, price, stock, subtitle, description; 3-image URL/upload slots using `AdminImageUploader`; hero image radio selector; calls `createAdminProduct()` on submit; closes and refreshes table on success
- [X] T037 [P] [US2] Create `apps/web/src/components/admin/products/EditProductModal.tsx`: same form fields as Add, pre-populated with existing product data; calls `updateAdminProduct(id, body)` on submit
- [X] T038 [US2] Create `apps/web/src/components/admin/products/ProductsTable.tsx`: fetches `getAdminProducts(page, filters)` on mount; renders paginated table (8 per page) with columns image, name, SKU, category, price, stock, status badge (ACTIVE/LOW STOCK/OUT OF STOCK), views, sales; search input + category select + status select filters; Edit and Delete action buttons per row; Delete triggers confirmation then `deleteAdminProduct(id)`
- [X] T039 [US2] Create `apps/web/src/app/admin/products/page.tsx`: renders `ProductsTable` with an "Add Product" button that opens `AddProductModal`; includes KPI header row showing total products, active, out-of-stock, total views from the list response `kpis` field

**Checkpoint**: Full product CRUD cycle completes without errors; paginated table shows correct status badges.

---

## Phase 5: User Story 3 — Order Fulfilment (Priority: P1)

**Goal**: Admin views all orders, filters by fulfilment status, clicks an order to see details, advances its status, and saves a tracking number.

**Independent Test**: Place a storefront order → find it in Orders tab (status: UNFULFILLED) → click row → open detail sidebar → click PROCESSING → click SHIPPED → enter tracking number → save → verify values persist on page reload.

- [X] T040 [P] [US3] Create `apps/web/src/components/admin/orders/OrderDetailSidebar.tsx`: right-side panel with customer info, items list, total, date, current `fulfillmentStatus` with transition buttons (UNFULFILLED → PROCESSING → SHIPPED → DELIVERED), tracking number input and Save button; calls `updateAdminOrder(id, {fulfillmentStatus, trackingNumber})` on each action; closes on outside click or X button
- [X] T041 [US3] Create `apps/web/src/components/admin/orders/OrdersTable.tsx`: fetches `getAdminOrders(page, filters)` on mount; renders table with columns order ID, customer name, items summary, total, location, payment status badge, fulfilment status badge; filter tabs: ALL / PENDING / PROCESSING / SHIPPED / DELIVERED; search input; clicking a row opens `OrderDetailSidebar`
- [X] T042 [US3] Create `apps/web/src/app/admin/orders/page.tsx`: renders `OrdersTable`; handles sidebar open/close state and selected order state

**Checkpoint**: Order status transition saves to database and reflects in the Orders table without a full page reload.

---

## Phase 6: User Story 4 — Customer Management (Priority: P2)

**Goal**: Admin lists all customers with aggregated order data, views per-customer order history in a sidebar, and can delete an account.

**Independent Test**: Register two test user accounts; open Customers tab — verify both appear with correct email and `ordersCount: 0`; delete one — verify it disappears.

- [X] T043 [P] [US4] Create `apps/web/src/components/admin/customers/CustomerDetailSidebar.tsx`: right-side panel with customer name, email, registered date, order history table (order ID, total, status, date), lifetime value total; Delete Account button with confirmation that calls `deleteAdminCustomer(email)` and closes sidebar on success
- [X] T044 [US4] Create `apps/web/src/components/admin/customers/CustomersTable.tsx`: fetches `getAdminCustomers(page, search)` on mount; renders table with columns avatar initials, name, email, orders count, lifetime value, status tag (NEW / ACTIVE / VIP); filter tabs ALL / NEW / VIP; search input; clicking a row opens `CustomerDetailSidebar`
- [X] T045 [US4] Create `apps/web/src/app/admin/customers/page.tsx`: renders `CustomersTable`; displays KPI header row (total, new this week, returning) from list response `kpis`; handles sidebar state

**Checkpoint**: Customers tab shows correct aggregated order count and lifetime value per user.

---

## Phase 7: User Story 5 — Promo Codes & Campaign Offers (Priority: P2)

**Goal**: Admin creates/deletes code-based coupons and automatic campaign offers; both are usable at storefront checkout immediately.

**Independent Test**: Create coupon "TEST10" (10% off, min 200 EGP) → use it at checkout → verify discount applies → delete coupon → verify checkout no longer accepts it.

- [X] T046 [P] [US5] Create `apps/web/src/components/admin/offers/CouponsSection.tsx`: fetches `getAdminCoupons()` on mount; renders a card-grid list of coupons with code, type, value, min spend, usage count; "Add Coupon" button opens an inline form/modal (code, type select, amount, min spend, usage limit, expiry date) that calls `createAdminCoupon(body)`; Delete button per coupon calls `deleteAdminCoupon(id)` with confirmation
- [X] T047 [P] [US5] Create `apps/web/src/components/admin/offers/CampaignsSection.tsx`: fetches `getAdminOffers()` on mount; renders a card-grid list of campaign offers with title, type badge (BOGO / DISCOUNT / BUNDLE), valid-until date, status (ACTIVE / EXPIRED); "Add Campaign" button opens a form/modal (title, type, value, min spend, expiry date) that calls `createAdminOffer(body)`; Delete button per offer calls `deleteAdminOffer(id)` with confirmation
- [X] T048 [US5] Create `apps/web/src/app/admin/offers/page.tsx`: renders `CouponsSection` and `CampaignsSection` in tabbed layout (Coupons / Campaigns tabs)

**Checkpoint**: A coupon created in the admin is immediately usable at the storefront checkout without a server restart.

---

## Phase 8: User Story 6 — Customer Reviews Moderation (Priority: P2)

**Goal**: Admin views, creates, edits, and deletes storefront testimonials; changes appear immediately on the homepage.

**Independent Test**: Click "Add Review" → fill form → save → open homepage → verify review appears in reviews section → delete it → verify it disappears.

- [X] T049 [P] [US6] Create `apps/web/src/components/admin/reviews/AddReviewModal.tsx`: form with name, product (free text), star rating (1–5 selector), comment textarea, verified toggle; calls `createTestimonial(body)` on submit; closes and refreshes table on success
- [X] T050 [P] [US6] Create `apps/web/src/components/admin/reviews/EditReviewModal.tsx`: same fields as Add, pre-populated; calls `updateTestimonial(id, body)` on submit; "Verified Buyer" toggle is prominent
- [X] T051 [US6] Create `apps/web/src/components/admin/reviews/ReviewsTable.tsx`: fetches `getTestimonials()` (admin view, includes soft-deleted with `deletedAt` shown) on mount; renders table with columns name, product, star rating display, comment excerpt, verified badge, date; search input (filter by name); star filter dropdown (1–5); Edit and Delete buttons per row; Delete calls `deleteTestimonial(id)` (soft-delete) with confirmation
- [X] T052 [US6] Create `apps/web/src/app/admin/reviews/page.tsx`: renders `ReviewsTable` with "Add Review" button; handles modal open/close and selected review state

**Checkpoint**: Review added in admin tab appears immediately on `GET /api/v1/testimonials`; storefront homepage shows the new review.

---

## Phase 9: User Story 7 — Homepage Content CMS (Interface Billboard) (Priority: P2)

**Goal**: Admin adds/edits/deletes hero carousel slides and updates the How-to-Apply section; changes appear on the storefront within seconds.

**Independent Test**: Add a slide with a test image URL → open the storefront homepage → verify the slide appears in the hero carousel. Edit the How-to-Apply accent color → verify the storefront section color updates.

- [X] T053 [P] [US7] Create `apps/web/src/components/admin/interface/SlideModal.tsx`: form with image URL/upload (`AdminImageUploader`), title, subtitle, description, buttonText, linkTo enum select (`collection` / `story` / `reviews`), order number, active toggle; calls `createHeaderSlide(body)` or `updateHeaderSlide(id, body)` depending on mode; closes and refreshes on success
- [X] T054 [P] [US7] Create `apps/web/src/components/admin/interface/HowToApplyEditor.tsx`: fetches `getHowToApply()` on mount; renders accent color picker + an editable list of steps (num, title, desc, iconType select, presetName or customIconUrl); Add Step / Remove Step buttons; Save calls `updateHowToApply(body)`
- [X] T055 [US7] Create `apps/web/src/components/admin/interface/HeroSlidesSection.tsx`: fetches `getHeaderSlides()` (admin view, includes inactive) on mount; renders a card grid of slides with image thumbnail, title, order number, active badge; "Add Slide" button opens `SlideModal` in create mode; Edit button opens `SlideModal` in edit mode; Delete calls `deleteHeaderSlide(id)` with confirmation
- [X] T056 [US7] Create `apps/web/src/app/admin/interface/page.tsx`: renders `HeroSlidesSection` in the top section and `HowToApplyEditor` in the bottom section; tab header reads "Interface Billboard"

**Checkpoint**: New slide added in admin is returned by `GET /api/v1/header-slides`; storefront carousel renders it without a deploy.

---

## Phase 10: User Story 8 — Analytics & Forecasting (Priority: P3)

**Goal**: Admin views a time-series line chart of orders/visits with configurable timeframe (7D / 30D / ALL) and analytics KPI cards.

**Independent Test**: Generate orders on different dates → open Analytics tab → select 7D → verify chart plots the last 7 days with correct counts.

- [X] T057 [US8] Create `apps/web/src/components/admin/analytics/AnalyticsChart.tsx`: accepts `data: {date: string, visits: number, checkouts: number}[]` prop; renders an SVG polyline chart with two series (visits in `--admin-gold`, checkouts in `--admin-accent`); shows date labels on x-axis; displays an empty-state message when data is empty
- [X] T058 [US8] Create `apps/web/src/app/admin/analytics/page.tsx`: fetches `getMetrics()` on mount; renders timeframe selector (7D / 30D / ALL) that slices `visitsHistory` and re-renders `AnalyticsChart`; also renders KPI cards for conversion rate, returning rate, average order value, new customers using `AdminKpiCard`

**Checkpoint**: Timeframe selector updates the chart without a page reload; empty store renders flat chart with no JS errors.

---

## Phase 11: User Story 9 — Settings (Priority: P3)

**Goal**: Admin updates profile name/password; reads the Activity Log audit trail.

**Independent Test**: Update display name in Profile → verify sidebar footer shows the new name. Open Activity Log → verify at least one admin mutation from a prior test appears with actor, action, and timestamp.

- [X] T059 [P] [US9] Create `apps/web/src/app/admin/settings/page.tsx`: redirect component that sends to `/admin/settings/profile`
- [X] T060 [P] [US9] Create `apps/web/src/app/admin/settings/profile/page.tsx`: renders two forms — (1) display name form calls `PATCH /api/v1/auth/me` (existing endpoint) then `refreshUser()` from `AuthContext` so the sidebar name updates immediately; (2) password change form (current password + new password) calls `PATCH /api/v1/auth/password` (created in T070); show success/error feedback inline on each form
- [X] T061 [P] [US9] Create `apps/web/src/app/admin/settings/activity-log/page.tsx`: fetches `getAdminActivityLog(page)` on mount; renders a paginated table with columns actor (email), action, target, before/after JSON diffs, timestamp; pagination controls at bottom

**Checkpoint**: Name change in Profile → sidebar footer name updates without page reload. Activity Log shows prior admin mutations from testing the other tabs.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Stubs, audit coverage, quality gates.

- [X] T062 Create `apps/web/src/app/admin/reports/page.tsx`: placeholder page with heading "Reports — Coming Soon" and a note that export functionality ships in Phase 6b
- [X] T063 Audit all admin mutation routes (`T011`–`T022`) and confirm every `POST`, `PUT`, and `DELETE` handler calls `createAuditEvent` before returning; add missing calls where needed
- [X] T064 Run `npm run lint` from repo root; fix all errors introduced by this feature (zero errors required)
- [X] T065 Run `npm run build:web`; fix all TypeScript and build errors (zero errors required)
- [X] T066 Walk through `specs/006-admin-dashboard/quickstart.md` — execute each section's curl commands and UI steps; confirm all pass
- [X] T067 Security validation: confirm `GET /api/v1/admin/metrics` returns 401 with no cookie, 403 with a customer-role cookie, and 200 with an admin-role cookie; repeat for `/admin/products`, `/admin/orders`, `/admin/customers`

**Checkpoint**: `npm run lint` and `npm run build:web` both exit 0; quickstart.md walkthrough passes end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): No dependencies — start immediately.
- **Phase 2** (Foundational): Depends on Phase 1 (needs tokens in globals.css and types in nickline.ts). Blocks all user story phases.
- **Phases 3–11** (User Stories): All depend on Phase 2 completion. Can proceed in priority order (P1 → P2 → P3) or in parallel if multiple developers are available.
- **Phase 12** (Polish): Depends on all user story phases completing.

### Within Phase 2

- T003–T007 (models): fully parallel
- T008 (adminMetricsService): can start after T003–T007 exist on disk; T014 and T015 depend on T008
- T009 (uploadService): parallel with T008
- T010 (rateLimiterAdmin): parallel with models
- T068 (contentSchemas.js): parallel with T010 — no model dependencies
- T069 (adminSchemas.js): parallel with T010 — no model dependencies
- T070 (PATCH /auth/password): parallel with all model and schema tasks; only touches auth.js
- T011–T013 (content routes): parallel with each other; depend on T003–T005 models, T010 rate limiter, T068 schemas
- T014–T022 (admin routes): parallel with each other; T014/T015 depend on T008; T016/T019/T020 depend on T069; all depend on T010
- T023 (route registration): last backend task — depends on T011–T022, T070 all existing
- T024–T027 (frontend shell components): parallel with each other and with all backend work
- T028 (admin layout): depends on T025 (AdminSidebar) and T024 (admin-api.ts)
- T029 (admin root page): parallel with T028 and independently completable

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no cross-story dependencies
- **US2 (P1)**: Can start immediately after Phase 2 — no cross-story dependencies
- **US3 (P1)**: Can start immediately after Phase 2 — no cross-story dependencies
- **US4 (P2)**: Can start after Phase 2 — no dependencies on US1/US2/US3
- **US5 (P2)**: Can start after Phase 2 — uses existing PromoCode model; no UI cross-dependencies
- **US6 (P2)**: Can start after Phase 2 — no dependencies on other stories
- **US7 (P2)**: Can start after Phase 2 — no dependencies on other stories
- **US8 (P3)**: Reuses `AdminKpiCard` from US1 (T030) — start US8 after T030 is done
- **US9 (P3)**: Calls existing auth endpoints — no story dependencies

### Within Each User Story

- Route file → API client function → Component(s) → Page
- Parallel components (marked [P]) can be built simultaneously
- Page assembles components — implement last within each story

---

## Parallel Opportunities

### Phase 2 Parallelism

```
Parallel group A (models):   T003, T004, T005, T006, T007
Parallel group B (services): T008 (after A), T009 (parallel)
Parallel group C (routes):   T010, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022
Sequential:                  T023 (after C)
Parallel group D (frontend): T024, T025, T026, T027
Sequential:                  T028 (after T024+T025), T029
```

### Per User Story

| Story | Parallel group | Sequential after |
|-------|---------------|-----------------|
| US1   | T031, T032, T033, T034 | T030, then T035 |
| US2   | T036, T037 | then T038, then T039 |
| US3   | T040 | then T041, then T042 |
| US4   | T043 | then T044, then T045 |
| US5   | T046, T047 | then T048 |
| US6   | T049, T050 | then T051, then T052 |
| US7   | T053, T054 | then T055, then T056 |
| US8   | — | T057, then T058 |
| US9   | T059, T060, T061 | — |

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1 (Setup) → Phase 2 (Foundational)
2. Complete Phase 3 (US1 Dashboard)
3. Complete Phase 4 (US2 Products)
4. Complete Phase 5 (US3 Orders)
5. **STOP and VALIDATE**: Admin can view store health, manage products, and process orders
6. Demo / deploy MVP

### Incremental Delivery

1. Setup + Foundational → backend tested, shell accessible
2. US1 Dashboard → live store health visibility
3. US2 Products → full catalog management
4. US3 Orders → daily fulfilment operations
5. US4–US7 → customer management, promotions, reviews, CMS
6. US8–US9 → analytics, settings, audit log
7. Phase 12 → polish, validation, security hardening

### Parallel Team Strategy

With three developers after Phase 2 is complete:

- **Dev A**: US1 Dashboard (T030–T035)
- **Dev B**: US2 Products (T036–T039)
- **Dev C**: US3 Orders (T040–T042)

All three stories integrate with the same backend endpoints created in Phase 2.

---

## Task Count Summary

| Phase | Tasks | Parallel |
|-------|-------|---------|
| 1 — Setup | 2 | 0 |
| 2 — Foundational | 30 | 25 |
| 3 — US1 Dashboard | 6 | 4 |
| 4 — US2 Products | 4 | 2 |
| 5 — US3 Orders | 3 | 1 |
| 6 — US4 Customers | 3 | 1 |
| 7 — US5 Offers | 3 | 2 |
| 8 — US6 Reviews | 4 | 2 |
| 9 — US7 Interface | 4 | 2 |
| 10 — US8 Analytics | 2 | 0 |
| 11 — US9 Settings | 3 | 3 |
| 12 — Polish | 6 | 0 |
| **Total** | **70** | **42** |

---

## Notes

- [P] tasks operate on different files — no shared-file conflicts
- [Story] label maps each task to its user story for traceability
- Commit after each completed phase checkpoint at minimum
- The `/speckit-implement` command will execute tasks phase-by-phase, marking `[X]` on completion
- Avoid skipping Phase 2 — the foundational backend and frontend shell are required by every subsequent phase
