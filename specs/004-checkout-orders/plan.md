# Implementation Plan: Checkout & Orders

**Branch**: `004-checkout-orders` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-checkout-orders/spec.md`

## Summary

Build the end-to-end checkout flow for NECKLINE: a multi-step checkout (contact/shipping → shipping method → review/payment) backed by a stub payment provider adapter. Orders are created atomically with stock decrement via optimistic locking. The implementation delivers the `PaymentProvider` interface, `Order` and `OrderLineItem` models, checkout API routes, and the frontend checkout pages — all behind a feature flag.

## Technical Context

**Language/Version**: Node.js 22.15.1, TypeScript 5.x (frontend), JavaScript (backend)

**Primary Dependencies**: Express 4.x, Mongoose 8.x, Next.js 14 (App Router), React 18, Tailwind CSS, Zod

**Storage**: MongoDB Atlas (Mongoose ODM)

**Testing**: Jest (backend), React Testing Library (frontend)

**Target Platform**: Web (responsive desktop + mobile)

**Performance Goals**: Checkout API response < 500ms p95; confirmation page < 2s TTFB

**Constraints**: Server-authoritative pricing and stock; no client-trusted totals; PCI scope zero (stub provider, no real card data)

**Scale/Scope**: Single-store MVP; ~100 orders/day initially; supports Egypt + GCC shipping

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| §III Server Authority | ✅ Pass | All prices, totals, stock, shipping computed server-side. Client sends only identifiers, quantities, and form data. |
| §IV Security Baseline | ✅ Pass | Input validation via Zod, rate limiting on checkout endpoints, CSRF protection via SameSite cookies. |
| §4.2 Auth & Sessions | ✅ Pass | Reuses existing JWT cookie auth from Phase 3; guest checkout supported without auth. |
| §4.3 Authorization | ✅ Pass | Checkout endpoints use `maybeAuthenticate` (optional auth); no role checks needed for customer checkout. |
| §4.4 Abuse Protection | ✅ Pass | Rate limiting on order creation (5 req/min per IP); idempotency key prevents double-submit. |
| §4.5 Secrets | ✅ Pass | Payment provider config (stub keys) in env only. |
| §4.6 Payments | ✅ Pass | Stub provider simulates tokenization; zero PCI scope. |
| §V Data Integrity | ✅ Pass | Integer money (minor units + currency code), immutable order snapshots, atomic stock decrement. |
| §VI Inventory | ✅ Pass | Optimistic locking (`version` + `$gte` guard) for stock decrement; reservation TTL for checkout holds. |
| §VII Async Systems | ✅ Pass | Order confirmation emails deferred to Phase 7; no async jobs required for MVP checkout. |
| §VIII Observability | ✅ Pass | Audit events on order create and payment confirm; structured JSON logs. |
| §IX Privacy | ✅ Pass | New PII fields (shipping address, phone) added to PRIVACY.md registry. |
| §X API Discipline | ✅ Pass | Idempotency-Key on POST /orders; paginated order list for authenticated users. |
| §XI Caching | ✅ Pass | No caching of cart, pricing, or inventory data. |
| §XIV Deployment | ✅ Pass | Checkout feature flag (`CHECKOUT_ENABLED`) and kill switch. |
| §XVI Testing | ✅ Pass | Unit tests for stock decrement, payment adapter, order service; integration tests for checkout flow. |

**Re-check after Phase 1**: All gates still pass. No complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/004-checkout-orders/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── checkout-api.md
│   └── payment-provider.md
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Order.js
│   │   │   ├── OrderLineItem.js          (embedded, not separate model)
│   │   │   ├── ShippingMethod.js
│   │   │   └── PaymentTransaction.js
│   │   ├── services/
│   │   │   ├── orderService.js
│   │   │   ├── checkoutService.js        (orchestrates: validate → payment → create order → decrement stock)
│   │   │   ├── shippingService.js
│   │   │   └── payment/
│   │   │       ├── PaymentProvider.js    (interface)
│   │   │       └── StubPaymentProvider.js
│   │   ├── routes/v1/
│   │   │   ├── orders.js
│   │   │   └── checkout.js               (or combined under orders)
│   │   ├── middleware/
│   │   │   ├── requireCheckoutEnabled.js (feature flag)
│   │   │   └── rateLimitCheckout.js
│   │   └── utils/
│   │       └── generateOrderNumber.js
│   └── tests/
│       ├── unit/orderService.test.js
│       ├── unit/checkoutService.test.js
│       └── integration/checkout.test.js
└── web/
    ├── src/
    │   ├── app/
    │   │   ├── checkout/
    │   │   │   └── page.tsx               (multi-step checkout)
    │   │   ├── order-confirmation/
    │   │   │   └── [orderNumber]/
    │   │   │       └── page.tsx
    │   │   └── order-lookup/
    │   │       └── page.tsx
    │   ├── components/
    │   │   ├── checkout/
    │   │   │   ├── CheckoutForm.tsx
    │   │   │   ├── ShippingStep.tsx
    │   │   │   ├── PaymentStep.tsx
    │   │   │   ├── ReviewStep.tsx
    │   │   │   └── OrderSummary.tsx
    │   │   └── orders/
    │   │       ├── OrderConfirmation.tsx
    │   │       └── OrderLookupForm.tsx
    │   └── lib/
    │       └── checkout-api.ts
    └── tests/
```

**Structure Decision**: The monorepo structure from Phase 0–3 is preserved. New backend models live alongside existing ones. The `payment/` subdirectory under `services/` isolates the adapter pattern for Phase 5 swap. Frontend checkout components are grouped under `components/checkout/` for cohesion.

## Complexity Tracking

No violations. All design decisions align with constitution principles and existing architecture.
