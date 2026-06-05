# Feature Specification: Admin Dashboard

**Feature Branch**: `006-admin-dashboard`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "Admin Dashboard — full 10-tab protected admin portal. An admin signs into a protected dashboard to view store KPIs and analytics, manage products and inventory with image upload, process orders and update fulfillment status with tracking numbers, manage customers, create and manage promo codes and campaign offers, moderate customer reviews displayed on the storefront, manage homepage hero slides and How-to-Apply content via a CMS, and configure store settings — all matching the recovered NicklineAdminPortal UI design."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Store Overview & Live Monitoring (Priority: P1)

An admin opens the dashboard and immediately sees the health of the store: today's revenue, order counts, live sessions, conversion rate, and which products are selling best — all without running any queries or navigating anywhere. A live activity feed shows the most recent orders and cart events in real time.

**Why this priority**: The dashboard overview is the entry point every admin session. If it shows stale or wrong data, every other decision the admin makes is compromised. It must work before anything else.

**Independent Test**: Can be tested by seeding orders and products, opening the Dashboard tab, and verifying all KPI cards show correct aggregated values pulled live from the database.

**Acceptance Scenarios**:

1. **Given** the admin is authenticated, **When** they open the Dashboard tab, **Then** KPI cards display today's orders, revenue today, live sessions, conversion rate, total revenue, total orders, average order value, new customers, pending count, and processing count — each with a sparkline trend line.
2. **Given** a new order is placed by a customer, **When** the admin views the Live Activity feed, **Then** the new order appears within the feed without requiring a page refresh.
3. **Given** products exist in the catalog, **When** the admin views Top Products, **Then** products are ranked by units sold with a visual bar showing relative performance.
4. **Given** a search term is entered in the global search bar, **When** the admin filters the Recent Orders table, **Then** only orders matching the customer name, order ID, or items summary are shown.

---

### User Story 2 — Product & Inventory Management (Priority: P1)

An admin can view all products in a paginated, searchable table, create new products with a 3-image gallery and hero image selection, edit any product's details including price and stock, and delete products. All changes are reflected immediately in the storefront.

**Why this priority**: Products and inventory are the operational core. Without this, there is no catalog to manage and the store cannot function.

**Independent Test**: Can be tested independently by creating a new product via the add modal, verifying it appears in the table and on the storefront, then editing and deleting it.

**Acceptance Scenarios**:

1. **Given** the admin is on the Products tab, **When** they view the table, **Then** products display with image, name, SKU, category, price, stock level, status badge (ACTIVE / LOW STOCK / OUT OF STOCK), views, and sales columns — paginated at 8 per page.
2. **Given** the admin clicks "Add Product", **When** they fill the form with name, SKU, category, price, stock, subtitle, and up to 3 gallery images with hero selection, **Then** the product is created and appears in the table and on the live storefront.
3. **Given** the admin clicks Edit on a product, **When** they update the stock count, **Then** the storefront availability reflects the updated stock within the same session.
4. **Given** the admin searches by name or SKU or filters by category or status, **When** the filter is applied, **Then** only matching products are shown in the table.
5. **Given** the admin deletes a product, **When** confirmed, **Then** the product is removed from the table and the storefront catalog.

---

### User Story 3 — Order Fulfilment (Priority: P1)

An admin views all incoming orders, filters by status, clicks an order to inspect its full details, transitions its status through the fulfilment workflow (Pending → Processing → Shipped → Delivered), and enters a tracking number. The customer's order record reflects these updates.

**Why this priority**: Order processing is a daily operational need. Admins cannot run the business without being able to act on orders.

**Independent Test**: Can be tested by placing a test order, finding it in the Orders tab, updating its status to Shipped, adding a tracking number, and verifying the order record is updated.

**Acceptance Scenarios**:

1. **Given** the admin is on the Orders tab, **When** they view the table, **Then** orders display with order ID, customer name, items summary, total price, location, and status badge; filterable by ALL / PENDING / PROCESSING / SHIPPED / DELIVERED.
2. **Given** the admin clicks on an order row, **When** the detail sidebar opens, **Then** they see customer info, items, total, date, current status, and status transition buttons.
3. **Given** the admin clicks a status transition button (e.g., "SHIPPED"), **When** confirmed, **Then** the order status updates and the transition is logged in the order timeline.
4. **Given** the admin enters a tracking number and submits the tracking form, **When** saved, **Then** the tracking number is persisted against the order and displayed in the sidebar.
5. **Given** a search query is entered, **When** filtering, **Then** only orders matching customer name, order ID, or items summary are shown.

---

### User Story 4 — Customer Management (Priority: P2)

An admin views all registered customers, filters them by status (ALL / ACTIVE / NEW / VIP), clicks a customer to see their order history and spend metrics, and can delete a customer account.

**Why this priority**: Customer management is needed for support and operational decisions but is not as time-critical as product or order management.

**Independent Test**: Can be tested independently by registering test users, viewing them in the Customers tab, and verifying order aggregates are correct per customer.

**Acceptance Scenarios**:

1. **Given** the admin is on the Customers tab, **When** they view the table, **Then** customers display with avatar, name, email, location, total orders, lifetime value, and status tags.
2. **Given** the admin clicks on a customer row, **When** the detail sidebar opens, **Then** they see the customer's order history with totals and statuses.
3. **Given** the admin filters by the "VIP" tab, **When** applied, **Then** only customers with high order counts or lifetime value are shown.
4. **Given** the admin deletes a customer, **When** confirmed, **Then** the account is removed and they can no longer log in.

---

### User Story 5 — Promo Codes & Campaign Offers Management (Priority: P2)

An admin creates and deletes code-based promo coupons (percentage or fixed discount with minimum spend) and automatic campaign offers (BOGO, DISCOUNT, BUNDLE with an expiry date). Both types are applied server-side at checkout — this tab is management-only.

**Why this priority**: Promotions drive revenue but the core discount engine already exists. This tab wires the admin UI to that existing engine.

**Independent Test**: Can be tested by creating a coupon code, using it at checkout, and verifying the discount was applied and the usage count incremented.

**Acceptance Scenarios**:

1. **Given** the admin is on the Offers tab Coupons section, **When** they add a new coupon with code, type (percentage/fixed), amount, and minimum spend, **Then** the coupon is active and can be used at checkout.
2. **Given** the admin is on the Offers tab Campaigns section, **When** they add a campaign offer with title, type (BOGO/DISCOUNT/BUNDLE), and valid-until date, **Then** the campaign is listed as ACTIVE.
3. **Given** the admin deletes a coupon or campaign, **When** confirmed, **Then** it is removed and can no longer be applied at checkout.

---

### User Story 6 — Customer Reviews Moderation (Priority: P2)

An admin views all customer testimonials shown on the storefront homepage, can create new reviews (for seeding), edit any review's content and verified status, and delete reviews. Changes appear immediately on the storefront reviews section.

**Why this priority**: Reviews directly affect storefront credibility. Admins need full control without developer involvement.

**Independent Test**: Can be tested by adding a review via the admin modal, verifying it appears on the storefront homepage reviews section, then editing and deleting it.

**Acceptance Scenarios**:

1. **Given** the admin is on the Reviews tab, **When** they view the table, **Then** all testimonials display with customer name, product, star rating, comment excerpt, verified badge, and date.
2. **Given** the admin clicks "Add Review", **When** they fill the form (name, product, rating 1–5, comment), **Then** the review is created and appears on the storefront homepage.
3. **Given** the admin edits a review, **When** they toggle the "Verified Buyer" flag and save, **Then** the storefront review badge updates accordingly.
4. **Given** the admin searches by customer name or filters by star rating, **When** the filter is applied, **Then** only matching reviews are shown in the table.
5. **Given** the admin deletes a review, **When** confirmed, **Then** it no longer appears on the storefront or in the admin table.

---

### User Story 7 — Homepage Content CMS (Interface Billboard) (Priority: P2)

An admin manages the homepage hero carousel slides (add/edit/delete with image, title, subtitle, description, button text, and link target) and customises the "How to Apply" steps section (accent color + per-step icon, number, title, and description) — all without touching code.

**Why this priority**: Homepage content changes are frequent marketing activities. Without this CMS, every update requires developer intervention.

**Independent Test**: Can be tested by adding a new hero slide via the admin modal and verifying it appears in the storefront homepage carousel within the same session.

**Acceptance Scenarios**:

1. **Given** the admin is on the Interface Billboard tab, **When** they add a hero slide with image, title, subtitle, description, button text, and link target, **Then** the slide appears in the homepage carousel immediately.
2. **Given** the admin edits an existing slide, **When** they update the title and save, **Then** the updated title is shown on the storefront.
3. **Given** the admin deletes a slide, **When** confirmed, **Then** it no longer appears in the carousel.
4. **Given** the admin edits the "How to Apply" section with a new accent color and updated step descriptions, **When** saved, **Then** the storefront How-to-Apply section reflects the changes.

---

### User Story 8 — Analytics & Forecasting (Priority: P3)

An admin views a time-series chart of visits and checkout events, with configurable timeframes (7D / 30D / ALL), alongside metrics including conversion rate, returning customer rate, CAC, MER, and an AI forecast card showing projected revenue and recommended stock.

**Why this priority**: Analytics are valuable but read-only and depend on instrumentation data built in Phase 7. A placeholder view with basic order/customer aggregates is sufficient for Phase 6.

**Independent Test**: Can be tested by generating orders across different dates and verifying the chart reflects the correct trend with the appropriate timeframe selector.

**Acceptance Scenarios**:

1. **Given** the admin is on the Analytics tab, **When** they select the 7D timeframe, **Then** the line chart shows the last 7 days of visits and checkout activity.
2. **Given** orders and customer registrations exist, **When** viewing the Analytics KPI cards, **Then** conversion rate, returning rate, new customers, and average order value are shown.
3. **Given** the admin clicks the 30D timeframe button, **When** the chart updates, **Then** 30 days of data are displayed without a page reload.

---

### User Story 9 — Settings (Priority: P3)

An admin updates their profile (name, password), views store settings, and reads the Activity Log — the append-only audit trail of all admin mutations to orders, products, inventory, and roles.

**Why this priority**: Settings are supporting infrastructure. The Activity Log is required by the constitution but is read-only and can render existing audit events.

**Independent Test**: Can be tested by changing the admin's display name in Profile settings and verifying the sidebar footer updates to the new name.

**Acceptance Scenarios**:

1. **Given** the admin is on the Settings > Profile sub-page, **When** they update their display name and save, **Then** the name is updated in the sidebar and header.
2. **Given** the admin is on the Settings > Activity Log sub-page, **When** they view the log, **Then** all admin mutations (product edits, order status changes, promo code creation) are listed in reverse chronological order with actor, action, and timestamp.
3. **Given** the admin changes their password and saves, **When** they log out and log back in with the new password, **Then** login succeeds.

---

### Edge Cases

- What happens when the admin attempts to delete a product that has active open orders referencing it? (Soft-delete must not break order history)
- What happens when two admins attempt to update the same order status simultaneously? (Last-write-wins is acceptable; optimistic retry not required at this layer)
- What happens when an image upload fails mid-product-create? (Form stays open with an error; product is not partially saved)
- What happens when the metrics endpoint returns no data (empty store)? (All KPI cards show zero values gracefully; charts render empty state, not an error)
- What happens when a review is added for a product name that doesn't match the current catalog? (Allowed — product field is a free-text label, not a foreign key)
- What happens when the admin session expires mid-operation? (All forms redirect to the admin login gate; no data loss for unsaved forms)

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Access**
- **FR-001**: The dashboard MUST be protected by admin-role authentication; non-admin users and unauthenticated visitors MUST be redirected to the admin login gate.
- **FR-002**: The admin login gate MUST authenticate using the existing email/password system and check that the authenticated user has the `admin` role.
- **FR-003**: All admin mutation endpoints MUST enforce server-side admin-role authorization — UI-hiding alone is insufficient.

**Dashboard**
- **FR-004**: The dashboard MUST display at minimum 10 KPI metrics: today's orders, revenue today, live sessions, conversion rate, returning rate, total revenue, total orders, avg order value, new customers, pending + processing counts.
- **FR-005**: Each KPI card MUST include a sparkline trend chart derived from historical daily data.
- **FR-006**: The dashboard MUST display a Top Products list (up to 5) ranked by units sold.
- **FR-007**: The dashboard MUST display a Live Activity feed of the most recent store events (orders placed, carts updated).
- **FR-008**: The dashboard MUST expose a `GET /api/v1/admin/metrics` endpoint returning all KPI data and `visitsHistory[]` for sparklines.
- **FR-009**: The dashboard MUST expose a `GET /api/v1/admin/activities` endpoint returning recent activity events.

**Products**
- **FR-010**: Admins MUST be able to create a product with name, SKU, category, price, stock, subtitle, and up to 3 gallery images with a designatable hero image.
- **FR-011**: Admins MUST be able to edit any product field including price, stock, images, and status.
- **FR-012**: Admins MUST be able to soft-delete products without destroying historical order line-item data.
- **FR-013**: The products table MUST be paginated (8 per page) and filterable by search (name/SKU), category, and status.

**Orders**
- **FR-014**: Admins MUST be able to view all orders with customer name, items summary, total, location, and status.
- **FR-015**: Admins MUST be able to transition an order's fulfilment status through: PENDING → PROCESSING → SHIPPED → DELIVERED.
- **FR-016**: Admins MUST be able to assign a tracking number to any order.
- **FR-017**: The system MUST expose `GET /api/v1/admin/orders`, `PUT /api/v1/admin/orders/:id`, and `DELETE /api/v1/admin/orders/:id`.

**Customers**
- **FR-018**: Admins MUST be able to list all registered customers with their order count and lifetime value aggregated server-side.
- **FR-019**: Admins MUST be able to delete a customer account.
- **FR-020**: The system MUST expose `GET /api/v1/admin/customers` and `DELETE /api/v1/admin/customers/:email`.

**Offers**
- **FR-021**: Admins MUST be able to create, list, and delete code-based coupons (type: percentage or fixed, with min spend).
- **FR-022**: Admins MUST be able to create, list, and delete automatic campaign offers (type: BOGO / DISCOUNT / BUNDLE, with expiry date).
- **FR-023**: Coupon and campaign management MUST operate over the existing PromoCode data model; no separate data store is introduced.

**Reviews**
- **FR-024**: Admins MUST be able to create, read, update, and delete customer testimonials stored in a `Testimonial` collection.
- **FR-025**: Public storefront MUST be able to read all active testimonials via `GET /api/v1/testimonials` without authentication.
- **FR-026**: Testimonial create/update/delete operations MUST require admin authentication.
- **FR-027**: Each testimonial MUST store: customer name, product label, rating (1–5), comment, verified flag, and date.

**Interface Billboard (Homepage CMS)**
- **FR-028**: Admins MUST be able to create, edit, reorder, and delete homepage hero carousel slides.
- **FR-029**: Each slide MUST have: image (URL or upload), title, subtitle, description, button text, and link target (one of: `#collection`, `#story`, `#reviews`).
- **FR-030**: Public storefront MUST be able to read active slides via `GET /api/v1/header-slides` without authentication.
- **FR-031**: Admins MUST be able to update the "How to Apply" section configuration: accent color and up to 5 steps (number, title, description, icon).
- **FR-032**: Public storefront MUST be able to read the How-to-Apply configuration via `GET /api/v1/how-to-apply` without authentication.

**Analytics**
- **FR-033**: The Analytics tab MUST support timeframe selection (7D / 30D / ALL) and update the chart accordingly.
- **FR-034**: The Analytics tab MUST display a revenue/visits line chart using data from the metrics endpoint.

**Settings**
- **FR-035**: Admins MUST be able to update their display name and password from the Settings > Profile sub-page.
- **FR-036**: The Settings > Activity Log sub-page MUST render the existing audit event trail in reverse chronological order.

**Security & Audit**
- **FR-037**: All admin mutations (product edits, order status changes, customer deletes, review changes, content changes) MUST generate an audit event in the existing audit trail.
- **FR-038**: Image uploads MUST be validated for file type and size server-side; uploaded files MUST NOT be stored inside the web server's runtime filesystem.

### Key Entities

- **Testimonial**: Customer review displayed on the storefront. Attributes: name (string), product (string label), rating (integer 1–5), comment (string), verified (boolean), date (string), deletedAt (soft-delete).
- **HeaderSlide**: A single homepage hero carousel entry. Attributes: image (URL), title, subtitle, description, buttonText, linkTo (enum), order (integer for sort), active (boolean).
- **HowToApply**: Single-document config for the How-to-Apply homepage section. Attributes: color (hex string), steps (array of: num, title, desc, iconType, presetName, customIconUrl).
- **AdminMetrics**: Computed aggregate (not persisted). Attributes: revenueToday, totalRevenue, ordersCount, todayOrdersCount, conversionRate, returningRate, newCustomers, pendingCount, processingCount, averageOrderValue, visitsHistory[], liveSessions.
- **ActivityEvent**: An entry in the live activity feed (not the full audit trail). Attributes: iconType, user, text, sub, time.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can complete a full product create-edit-delete cycle (including image upload) in under 3 minutes without leaving the dashboard.
- **SC-002**: An admin can transition an order from PENDING to SHIPPED and add a tracking number in under 60 seconds.
- **SC-003**: Dashboard KPI cards load within 2 seconds of the tab being opened on a standard connection.
- **SC-004**: All admin mutation endpoints reject requests from non-admin authenticated users with a 403 response.
- **SC-005**: A new hero slide added via the Interface Billboard tab appears on the public storefront homepage within 5 seconds of being saved.
- **SC-006**: A review added or deleted via the Reviews tab appears or disappears on the public storefront homepage within 5 seconds.
- **SC-007**: The products table handles at least 200 products without UI degradation; pagination keeps initial render to 8 rows.
- **SC-008**: All admin API endpoints return appropriate 401/403 responses when called without valid admin credentials.

---

## Assumptions

- The existing `authenticate` + `requirePermission('admin')` middleware stack will gate all admin routes — no new auth mechanism is needed.
- Image uploads are handled by URL reference or a simple file-to-URL upload endpoint; cloud storage (S3/Cloudinary) integration is out of scope for Phase 6 — URL input is the primary path, file upload is a progressive enhancement.
- The `visitsHistory` data for sparklines and analytics charts is approximated from order timestamps for Phase 6; real page-visit tracking is a Phase 7 concern.
- The "Live Sessions" KPI is a placeholder value (0 or a random low number) until Phase 7 session instrumentation is in place.
- The Reports tab ships as a placeholder/stub in Phase 6; full exportable reports are scoped to Phase 6b or Phase 7.
- The Settings tab ships with Profile (name/password) and Activity Log sub-pages in Phase 6; remaining sub-pages (Store, Team, Roles & Permissions, Payments, Shipping, Taxes) are stubs or deferred to Phase 6b.
- The admin dashboard is a separate route (`/admin`) within the existing Next.js app, not a separate deployment.
- Mobile responsiveness of the admin dashboard is a secondary concern; desktop-first layout matching the recovered UI design is the primary target.
- The `onSyncNewProduct` / `onSyncAllData` callback pattern from the deleted UI is not carried forward — the new implementation fetches fresh data from the API directly.
