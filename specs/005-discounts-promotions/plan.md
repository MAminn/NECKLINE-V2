# Implementation Plan: Discounts & Promotions

**Branch**: `005-discounts-promotions` | **Date**: 2026-05-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-discounts-promotions/spec.md`

## Summary

Add a server-side discount engine supporting promo codes (percentage-off, fixed-amount-off, free-shipping) and automatic cart-level offers. Discounts are computed entirely server-side, applied at cart and checkout time, and snapshotted immutably in Orders. Admin APIs allow CRUD management of promo codes.

## Technical Context

**Language/Version**: Node.js 22.15.1, JavaScript (ES2022)

**Primary Dependencies**: Express 4.x, Mongoose 8.x, Next.js 14 (App Router), React 18, Tailwind CSS

**Storage**: MongoDB Atlas (Mongoose ODM)

**Testing**: Jest (backend), manual end-to-end (frontend)

**Target Platform**: Web application (MERN stack)

**Performance Goals**: Discount computation < 50ms; promo code validation < 100ms

**Constraints**: Integer minor units for all money; no floating-point math; atomic usage count increment within checkout transaction

**Scale/Scope**: Single-store MVP; promo codes < 10,000 active; concurrent checkout with same code must not oversell usage limits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| §III Server Authority | ✅ Pass | All discount computation server-side; client sends only code string |
| §V Data Integrity | ✅ Pass | Integer minor units; discount snapshot immutable in Order |
| §VI Inventory & Concurrency | ✅ Pass | Usage count incremented atomically within checkout transaction |
| §VIII Observability | ✅ Pass | Audit events on promo code creation, application, and order creation |
| §IX Privacy | ⚠️ Review | No new PII fields; update PRIVACY.md if promo code tracking links to users |
| §X API Discipline | ✅ Pass | Idempotency on order creation preserved; pagination on admin list |
| §XIV Feature Flags | ✅ Pass | Admin promo code endpoints protected by `requirePermission('admin:access')` |

**Re-check after Phase 1**: All gates still pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-discounts-promotions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── cart-api.md
│   ├── checkout-api.md
│   ├── promo-code-api.md
│   └── admin-api.md
└── tasks.md             # Phase 2 output (speckit-tasks)
```

### Source Code (repository root)

```text
apps/api/src/
├── models/
│   ├── PromoCode.js          # New: discount/offer definition
│   └── Order.js              # Modified: add discount snapshot field
├── services/
│   ├── discountService.js    # New: validation + computation engine
│   ├── cartService.js        # Modified: apply/recompute discount on cart ops
│   ├── checkoutService.js    # Modified: accept promoCode, include discount in preview & order
│   └── orderService.js       # Modified: include discount in order lookup/history
├── routes/v1/
│   ├── cart.js               # Modified: POST /cart/apply-promo, DELETE /cart/promo
│   ├── checkout.js           # Modified: accept optional promoCode in body
│   ├── orders.js             # Modified: validate discount atomically in order creation
│   └── admin/
│       └── promoCodes.js     # New: admin CRUD for promo codes
├── validators/
│   └── promoCodeSchemas.js   # New: Zod schemas for promo code CRUD
├── middleware/
│   └── requirePermission.js  # Existing: reused for admin endpoints
└── scripts/
    └── seedPromoCodes.js     # New: seed sample promo codes for dev/testing

apps/web/src/
├── lib/
│   └── checkout-api.ts       # Modified: add promo code endpoints
├── components/
│   ├── checkout/
│   │   ├── ReviewStep.tsx    # Modified: show discount breakdown
│   │   └── PromoCodeInput.tsx # New: promo code entry + validation feedback
│   ├── CartSummary.tsx       # Modified: show applied discount
│   └── PromoCodeBanner.tsx   # New: display automatic offer in cart
└── app/
    └── checkout/
        └── page.tsx          # Modified: pass promoCode to checkout API
```

**Structure Decision**: Existing MERN monorepo structure extended with new `PromoCode` model, `discountService`, and admin route. Cart and checkout services modified to integrate discount computation. Frontend components updated to display discount state.

## Complexity Tracking

> No constitution violations. Complexity is justified:

| Decision | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Single `PromoCode` model with `isAutomatic` flag | Avoids duplicated logic between manual codes and auto offers; both share validation, date range, usage limits | Separate collections would duplicate 90% of fields and query logic |
| Discount amount computed on every cart read | Guarantees server authority; if code expires or cart changes, discount is always correct | Caching discount amount risks stale/invalid discounts |
| Usage count in checkout transaction | Prevents race condition where two checkouts consume the last use simultaneously | Non-transactional increment would allow overselling code limits |

## Decisions

### Decision 1: Unified `PromoCode` model with `isAutomatic` flag

**Rationale**: Manual promo codes and automatic offers share identical fields (type, value, minOrderAmount, date range, usage limits). A single collection with `isAutomatic: boolean` and sparse `code` field avoids duplication. Automatic offers have `code: null`, `isAutomatic: true`.

**Trade-off**: Query for "all active automatic offers" is slightly less indexed than a dedicated collection, but the collection is small (< 10K docs) and `isAutomatic` + `active` composite index solves this.

### Decision 2: Cart stores only the promo code string, not the discount amount

**Rationale**: The discount amount must be recomputed server-side on every cart interaction to ensure correctness (code may expire, cart subtotal may change, automatic offers may become eligible). The Cart model gains `appliedPromoCode: String` only.

**Trade-off**: Every cart read requires a PromoCode lookup. Mitigated by the small collection size and the fact that cart reads already query Products and Reservations.

### Decision 3: Discount snapshot embedded in Order, not referenced

**Rationale**: Order immutability (§V.2) requires that historical discount details survive code edits/deletions. The snapshot records: code, type, value, amountApplied, currency — everything needed to reconstruct the discount.

**Trade-off**: Slightly larger order documents. Negligible at expected scale.

### Decision 4: "Best discount wins" — no stacking

**Rationale**: Industry-standard for MVP e-commerce. Prevents abuse, simplifies UX, and avoids edge cases (e.g., free shipping + 50% off producing negative totals). The discount engine evaluates all eligible discounts (manual code + automatic offers) and returns the single largest reduction.

**Trade-off**: Marketing cannot run stacked promotions. Deferred to post-MVP.
