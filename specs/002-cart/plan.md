# Implementation Plan: Guest Shopping Cart

**Branch**: `002-cart` | **Date**: 2026-05-25 | **Spec**: [specs/002-cart/spec.md](specs/002-cart/spec.md)

**Input**: Feature specification from `specs/002-cart/spec.md`

## Summary

Build a guest shopping cart with server-side persistence, stock reservations, and atomic mutations. The cart supports add/update/remove operations, computes subtotals from snapshot prices server-side, and uses MongoDB TTL collections for automatic reservation expiry and stale cart cleanup. No login required.

## Technical Context

**Language/Version**: Node.js 22.15.1 (Express backend), TypeScript (Next.js 14 frontend)

**Primary Dependencies**: Express, Mongoose, MongoDB Atlas, Next.js 14, React, Tailwind CSS

**Storage**: MongoDB Atlas — `carts` collection with embedded line items, `reservations` TTL collection

**Testing**: Jest (existing project setup)

**Target Platform**: Web (Vercel frontend + Render backend)

**Performance Goals**: Add-to-cart < 2s (per SC-001)

**Constraints**: Server-authoritative prices and stock; no client-side total computation; cart mutations rate-limited to 50/min per cart ID

**Scale/Scope**: Small luxury brand; low concurrent load; max 20 line items per cart, max 99 qty per line item

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| §III Server Authority | ✅ PASS | Prices are snapshot at add time, computed server-side. Client sends only product IDs and quantities. |
| §IV Security (rate limiting) | ✅ PASS | 50 mutations/min per cart ID. Cart IDs are unguessable (crypto-random). |
| §V Money (integer minor units) | ✅ PASS | Snapshot prices stored as `{ amount, currency }` integer minor units. |
| §VI Inventory (reservations) | ✅ PASS | TTL reservations with availability = stock − other reservations. |
| §VIII Observability | ⚠️ NEEDS WORK | Cart mutations (inventory domain) require audit events. Add `audit.log()` calls in cart service. |
| §X Idempotency | ✅ PASS | Add-to-cart supports `Idempotency-Key` header via existing middleware. |
| §XVI Testing | ✅ PASS | Critical inventory flow covered by integration tests. |

**Action required before implement**: Add audit event emission for cart add/update/remove/clear operations.

## Project Structure

### Documentation (this feature)

```text
specs/002-cart/
├── plan.md              # This file
├── research.md          # Technical decisions
├── data-model.md        # Cart, CartLineItem, Reservation schemas
├── quickstart.md        # Manual test scenarios
└── contracts/
    └── api.md           # Cart API endpoint contracts
```

### Source Code (repository root)

```text
apps/api/src/
├── models/
│   ├── Cart.js              # Cart schema with embedded line items + TTL
│   └── Reservation.js       # Reservation schema with TTL
├── services/
│   ├── cartService.js       # Core cart logic: add, update, remove, clear, get
│   └── reservationService.js # Reservation CRUD + availability queries
├── routes/v1/
│   └── cart.js              # Cart API routes
├── middleware/
│   └── rateLimitCart.js     # Cart-specific rate limiter (50/min per cartId)
└── config/
    └── env.js               # CART_TTL_DAYS, RESERVATION_TTL_MINUTES

apps/web/src/
├── app/
│   └── cart/
│       └── page.tsx         # Dedicated /cart page
├── components/
│   ├── AddToCartButton.tsx  # Button with loading state + feedback
│   ├── CartDrawer.tsx       # Slide-in cart panel
│   ├── CartIcon.tsx         # Header icon with item count badge
│   ├── CartLineItem.tsx     # Single cart row (image, name, qty, price, remove)
│   └── CartSummary.tsx      # Subtotal + checkout CTA
├── contexts/
│   └── CartContext.tsx      # React context for cart state + sync
├── hooks/
│   └── useCart.ts           # Convenience hook wrapping CartContext
└── lib/
    └── api.ts               # Extend with cart endpoints
```

**Structure Decision**: Monorepo workspaces (existing). Backend follows domain/service/route layers. Frontend follows Next.js App Router with components, contexts, and hooks.

## Phases

### Phase 0: Setup & Configuration

1. Add environment variables: `CART_TTL_DAYS=7`, `RESERVATION_TTL_MINUTES=15`
2. Install `express-rate-limit` for cart endpoint protection
3. Create `Cart.js` and `Reservation.js` Mongoose models with TTL indexes
4. Wire cart routes into `routes/v1/index.js`

### Phase 1: Backend Implementation

1. **Reservation Service** (`services/reservationService.js`)
   - `reserve(cartId, productId, quantity)` — upsert reservation, reset expiry
   - `release(cartId, productId)` — delete reservation
   - `releaseAll(cartId)` — delete all reservations for a cart
   - `getAvailability(productId, excludeCartId)` — compute available stock
   - `extend(cartId, productId, quantity)` — update qty + reset expiry

2. **Cart Service** (`services/cartService.js`)
   - `getOrCreateCart(cartId)` — find by cartId or create new
   - `addItem(cartId, productId, quantity)` — validate stock, upsert line item, upsert reservation, emit audit event
   - `updateItem(cartId, productId, quantity)` — validate stock, update line item, update reservation
   - `removeItem(cartId, productId)` — remove line item, delete reservation
   - `clearCart(cartId)` — remove all line items, delete all reservations
   - `getCart(cartId)` — fetch cart with availability flags per item
   - `refreshCart(cartId)` — revalidate all items, recreate reservations for available items
   - `computeSubtotal(items)` — sum of quantity × snapshot unitPrice

3. **Cart Routes** (`routes/v1/cart.js`)
   - `GET /` — get cart
   - `POST /items` — add item (with idempotency middleware)
   - `PATCH /items/:productId` — update quantity
   - `DELETE /items/:productId` — remove item
   - `DELETE /` — clear cart
   - `POST /refresh` — refresh availability

4. **Rate Limiting** (`middleware/rateLimitCart.js`)
   - Keyed by `cartId` cookie
   - 50 requests per minute window

### Phase 2: Frontend Implementation

1. **Cart Context** (`contexts/CartContext.tsx`)
   - Holds cart state, fetches on mount
   - Exposes: `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `refresh`
   - Syncs with server after every mutation
   - Reads/writes `cartId` cookie

2. **Cart Icon** (`components/CartIcon.tsx`)
   - Header component with animated item count badge
   - Opens CartDrawer on click

3. **Cart Drawer** (`components/CartDrawer.tsx`)
   - Slide-in panel from right
   - Lists CartLineItem components
   - Shows CartSummary at bottom
   - Close button + overlay backdrop

4. **Cart Line Item** (`components/CartLineItem.tsx`)
   - Product image, name, SKU
   - Quantity stepper (1–99, clamped to available stock)
   - Line total price
   - Remove button
   - "Stock not reserved" / "Unavailable" warning badges

5. **Add to Cart Button** (`components/AddToCartButton.tsx`)
   - Replaces/adds to existing PDP quantity stepper
   - On click: calls `addItem`, shows loading state, then opens drawer
   - Generates idempotency key from `productId + cartId + timestamp`

6. **Cart Page** (`app/cart/page.tsx`)
   - Full-page cart view at `/cart`
   - Same components as drawer but in page layout
   - "Continue Shopping" link back to catalog
   - "Checkout" button (disabled if unavailable items present)

### Phase 3: Integration & Validation

1. Wire AddToCartButton into `ProductCard` and PDP
2. Wire CartIcon into site header (`layout.tsx`)
3. Manual test all quickstart scenarios
4. Verify TTL behaviour in MongoDB (reservation expiry, cart cleanup)
5. Verify rate limiting blocks abuse
6. Verify idempotency prevents duplicate add-to-cart on double-click

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|-----------|-------------------------------------|
| Separate `Reservation` collection | Need TTL auto-cleanup per architecture decision | Embedded reservations in Cart would complicate availability aggregation across carts |
| Snapshot prices in cart lines | Constitution §III — server authoritative | Live price would surprise customers at checkout |
| Cookie-based cart ID | Cross-page persistence, server-readable | localStorage requires reconciliation layer; JWT overkill |
