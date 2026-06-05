# Research: Admin Dashboard (Phase 6)

## Decision 1: Admin route architecture (Next.js App Router)

**Decision**: Dedicated `/admin` route group under `apps/web/src/app/admin/` with a separate layout that wraps all tabs in the sidebar shell.

**Rationale**: No admin UI exists yet. The App Router layout nesting means `apps/web/src/app/admin/layout.tsx` provides the sidebar + auth gate once; individual tab pages (`/admin/products`, `/admin/orders`, etc.) inherit it. This avoids rebuilding the frame on every tab switch.

**Alternatives considered**:
- Single mega-page with tab state in React — rejected because it bakes routing into component state, breaks deep-linking, and creates a 5,000+ line component (the deleted UI proved this pain point)
- Separate Next.js app — rejected per monorepo architecture constraint

---

## Decision 2: Admin auth gate placement

**Decision**: Auth check in `apps/web/src/app/admin/layout.tsx` — reads `user` from `AuthContext`, redirects non-admin to `/login?redirect=/admin` if `user?.role !== 'admin'` or `!isAuthenticated`. All admin API endpoints also enforce `requirePermission('admin:access')` server-side.

**Rationale**: Two-layer defence — UI gate prevents flicker; server gate is the actual security boundary. The existing `requirePermission` middleware already covers the server side.

**Alternatives considered**:
- Middleware.ts file-level redirect — workable but duplicates role logic that already lives in `AuthContext`

---

## Decision 3: Order fulfilment status — separate field

**Decision**: Add `fulfillmentStatus` field to the Order schema with enum `['unfulfilled', 'processing', 'shipped', 'delivered']`, defaulting to `'unfulfilled'`.

**Rationale**: The current `status` field tracks the payment/lifecycle state (`pending`, `pending_payment`, `confirmed`, `cancelled`). Mixing fulfilment progression (processing → shipped → delivered) into the same enum would conflate two independent state machines. A separate `fulfillmentStatus` field lets payment and shipping evolve independently (e.g., an order can be `confirmed` + `shipped` or `cancelled` + `unfulfilled`).

**Alternatives considered**:
- Repurpose `status` enum with combined values — rejected because it breaks payment webhook logic and the order confirmation page that branches on `status === 'confirmed'`
- New `FulfillmentRecord` collection — over-engineered for MVP

---

## Decision 4: Image uploads — URL-first, Cloudinary progressive enhancement

**Decision**: Product and slide image fields accept a URL string. The frontend provides a URL `<input>` as the primary path. An optional `ImageUploader` component (file-to-URL) is a progressive enhancement backed by a `POST /api/v1/admin/uploads` endpoint that proxies to Cloudinary (or similar) and returns a URL. If no upload service is configured, the URL input alone is sufficient.

**Rationale**: The deleted UI's `ImageUploader.tsx` followed the same pattern. Keeping image storage outside the runtime filesystem (§XII) is non-negotiable. Cloudinary's free tier covers MVP needs. The API just returns a URL — the rest of the system is agnostic to storage provider.

**Alternatives considered**:
- Store files in `public/` — violates §XII (files stored inside runtime filesystem)
- S3 — works identically to Cloudinary, can be swapped by changing the upload proxy

---

## Decision 5: Admin metrics endpoint — DB aggregation, no separate analytics store

**Decision**: `GET /api/v1/admin/metrics` runs MongoDB aggregation pipelines over existing `Order`, `User`, and `Product` collections at request time. Results are not cached. `visitsHistory[]` is approximated from Order `createdAt` timestamps until Phase 7 provides real page-visit tracking.

**Rationale**: No dedicated analytics store exists and the data volume at MVP scale does not justify one. Aggregation over orders is fast at small-to-medium scale. Phase 7 adds real instrumentation — this endpoint's contract can be extended without breaking the UI.

**Alternatives considered**:
- Pre-computed analytics collection updated by cron — unnecessary complexity at MVP scale
- Third-party analytics API — adds external dependency and privacy concerns

---

## Decision 6: Testimonial, HeaderSlide, HowToApply — new Mongoose models

**Decision**: Three new models:
- `Testimonial` — reviews displayed on homepage; soft-delete via `deletedAt`
- `HeaderSlide` — hero carousel slides; `order` integer for sort; `active` boolean
- `HowToApply` — single-document config (upsert by a fixed `configKey: 'default'` sentinel)

**Rationale**: These entities don't exist yet and are pure admin-managed content. Using MongoDB for CMS config at this scale is appropriate and avoids adding a file-based CMS dependency.

**Alternatives considered**:
- JSON config files on disk — violates §XII (files outside runtime) and creates deployment coupling
- Third-party headless CMS — unnecessary external dependency for 3 small content types

---

## Decision 7: Admin API endpoint naming — consistent `/api/v1/admin/*` prefix

**Decision**: All new admin write endpoints follow `/api/v1/admin/*`. Public read endpoints for content the storefront consumes (`/api/v1/testimonials`, `/api/v1/header-slides`, `/api/v1/how-to-apply`) stay under the public namespace without the admin prefix.

**Rationale**: Consistent with the existing `admin/features` and `admin/promo-codes` routes. Public routes are rate-limited but unauthenticated; admin routes require `admin:access`.

---

## Decision 8: Admin state management — SWR-style fetch per tab, no global state

**Decision**: Each admin tab page fetches its own data on mount using `apiClient` from `apps/web/src/lib/api.ts`. No global admin state store. Refreshes are triggered by explicit user action or after mutations.

**Rationale**: The 5-second polling loop in the deleted UI was a workaround for the single-component architecture. With proper Next.js page routing, each tab mounts fresh. A simple `useEffect` + `useState` pattern is sufficient; React Query or SWR would be the next step if polling or background sync becomes necessary.

---

## Decision 9: Design system — reuse existing tokens, extend for admin

**Decision**: Admin pages extend the existing `src/styles/globals.css` token system. Admin-specific tokens (`--admin-bg: #090203`, `--admin-accent: #D21B27`, `--admin-gold: #C29F68`) are added to globals.css. All admin UI uses Tailwind with these custom properties.

**Rationale**: The deleted UI hardcoded hex values throughout. Centralising them as CSS custom properties means a single edit propagates everywhere and keeps the design fidelity commitment (§2.1).

---

## Resolved Clarifications

**Q: Does the admin dashboard live at `/admin` (same Next.js app) or a separate deployment?**
→ Same Next.js app, `/admin` route group. Confirmed by architecture constraint — no separate deployment.

**Q: How is order fulfillment status tracked separately from payment status?**
→ New `fulfillmentStatus` field on Order model (see Decision 3).

**Q: What is the image upload strategy?**
→ URL-first, Cloudinary progressive enhancement (see Decision 4).

**Q: Does live session count require WebSockets?**
→ No. Placeholder value (0) for Phase 6; real tracking is Phase 7.
