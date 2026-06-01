# Tasks: Guest Shopping Cart

**Input**: Design documents from `specs/002-cart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/api.md

**Tests**: Not explicitly requested; integration tests included for critical inventory flows.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration and dependency installation

- [ ] T001 Add `CART_TTL_DAYS` and `RESERVATION_TTL_MINUTES` to `apps/api/src/config/env.js`
- [ ] T002 Install `express-rate-limit` in `apps/api` workspace
- [ ] T003 Wire new cart route import into `apps/api/src/routes/v1/index.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and services that MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Create `Reservation` Mongoose model in `apps/api/src/models/Reservation.js` with TTL index on `expiresAt`
- [ ] T005 [P] Create `Cart` Mongoose model in `apps/api/src/models/Cart.js` with embedded `CartLineItem` schema and TTL index on `updatedAt`
- [ ] T006 Create `reservationService.js` in `apps/api/src/services/` with `reserve`, `release`, `releaseAll`, `getAvailability`
- [ ] T007 Create `cartService.js` in `apps/api/src/services/` with `getOrCreateCart`, `addItem`, `updateItem`, `removeItem`, `clearCart`, `getCart`, `refreshCart`, `computeSubtotal`
- [ ] T008 Create `rateLimitCart.js` middleware in `apps/api/src/middleware/` keyed by `cartId` cookie (50 req/min)
- [ ] T009 Create `cart.js` route file in `apps/api/src/routes/v1/` exporting an Express router

**Checkpoint**: Foundation ready — models, services, middleware, and route stub exist

---

## Phase 3: User Story 1 — Add to Cart (Priority: P1) 🎯 MVP

**Goal**: Guests can add products to a cart, see visual confirmation, and the cart reflects correct quantity and subtotal with stock validation.

**Independent Test**: Open a product detail page, click "Add to Cart", verify the cart drawer opens with the correct product, quantity 1, and price. Refresh page and verify persistence.

### Tests for User Story 1

- [ ] T010 [P] [US1] Integration test: add in-stock product to empty cart in `apps/api/tests/integration/cart.test.js`
- [ ] T011 [P] [US1] Integration test: add out-of-stock product returns 409 in `apps/api/tests/integration/cart.test.js`

### Backend Implementation for User Story 1

- [ ] T012 [US1] Implement `POST /api/v1/cart/items` route handler in `apps/api/src/routes/v1/cart.js` — validate input, call `cartService.addItem`, set `cartId` cookie, return cart
- [ ] T013 [US1] Implement `GET /api/v1/cart` route handler in `apps/api/src/routes/v1/cart.js` — fetch cart by cookie, return with availability flags
- [ ] T014 [US1] Implement `cartService.addItem` in `apps/api/src/services/cartService.js` — stock validation via `reservationService`, upsert line item, upsert reservation, emit audit event
- [ ] T015 [US1] Implement `cartService.getCart` in `apps/api/src/services/cartService.js` — fetch cart, compute subtotal, annotate each item with `available` and `reserved`
- [ ] T016 [US1] Implement `reservationService.getAvailability` in `apps/api/src/services/reservationService.js` — aggregate reservations per product, exclude current cart

### Frontend Implementation for User Story 1

- [ ] T017 [P] [US1] Create `CartContext.tsx` in `apps/web/src/contexts/` with state, `addItem`, and server sync
- [ ] T018 [P] [US1] Create `useCart.ts` hook in `apps/web/src/hooks/` wrapping CartContext
- [ ] T019 [US1] Create `AddToCartButton.tsx` in `apps/web/src/components/` — loading state, idempotency key generation, opens drawer on success
- [ ] T020 [US1] Create `CartDrawer.tsx` in `apps/web/src/components/` — slide-in panel, lists items, shows subtotal
- [ ] T021 [US1] Create `CartIcon.tsx` in `apps/web/src/components/` — header icon with animated item count badge, opens drawer on click
- [ ] T022 [US1] Wire `CartIcon` into `apps/web/src/app/layout.tsx` header
- [ ] T023 [US1] Wire `AddToCartButton` into product detail page `apps/web/src/app/products/[id]/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 — Manage Cart Contents (Priority: P1)

**Goal**: Guests can change quantities, remove items, and clear the cart entirely. Stock is revalidated on every change.

**Independent Test**: Open cart drawer, change a quantity, remove an item, and clear the cart. Verify subtotal recalculates correctly after each action.

### Tests for User Story 2

- [ ] T024 [P] [US2] Integration test: update quantity within stock limit in `apps/api/tests/integration/cart.test.js`
- [ ] T025 [P] [US2] Integration test: update quantity exceeding stock returns 409 in `apps/api/tests/integration/cart.test.js`
- [ ] T026 [P] [US2] Integration test: remove item deletes reservation in `apps/api/tests/integration/cart.test.js`

### Backend Implementation for User Story 2

- [ ] T027 [US2] Implement `PATCH /api/v1/cart/items/:productId` route handler in `apps/api/src/routes/v1/cart.js`
- [ ] T028 [US2] Implement `DELETE /api/v1/cart/items/:productId` route handler in `apps/api/src/routes/v1/cart.js`
- [ ] T029 [US2] Implement `DELETE /api/v1/cart` route handler in `apps/api/src/routes/v1/cart.js`
- [ ] T030 [US2] Implement `cartService.updateItem` in `apps/api/src/services/cartService.js` — stock validation, atomic `$inc` on line item qty, update reservation
- [ ] T031 [US2] Implement `cartService.removeItem` in `apps/api/src/services/cartService.js` — `$pull` line item, delete reservation
- [ ] T032 [US2] Implement `cartService.clearCart` in `apps/api/src/services/cartService.js` — clear items array, delete all reservations for cart

### Frontend Implementation for User Story 2

- [ ] T033 [US2] Create `CartLineItem.tsx` in `apps/web/src/components/` — image, name, quantity stepper, line total, remove button
- [ ] T034 [US2] Create `CartSummary.tsx` in `apps/web/src/components/` — subtotal display, "Checkout" CTA (disabled if unavailable items)
- [ ] T035 [US2] Add `updateQuantity` and `removeItem` to `CartContext.tsx` in `apps/web/src/contexts/`
- [ ] T036 [US2] Add `clearCart` to `CartContext.tsx` in `apps/web/src/contexts/`
- [ ] T037 [US2] Integrate `CartLineItem` and `CartSummary` into `CartDrawer.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 — Cart Persistence & Recovery (Priority: P2)

**Goal**: Cart survives refresh and browser restart. Expired reservations show warnings and can be refreshed.

**Independent Test**: Add items to cart, refresh page, confirm cart restores. Wait for reservation TTL, verify warning appears, click "Refresh Availability", verify reservations are recreated.

### Tests for User Story 3

- [ ] T038 [P] [US3] Integration test: cart restores by cookie after server restart in `apps/api/tests/integration/cart.test.js`
- [ ] T039 [P] [US3] Integration test: refresh endpoint re-creates expired reservations in `apps/api/tests/integration/cart.test.js`

### Backend Implementation for User Story 3

- [ ] T040 [US3] Implement `POST /api/v1/cart/refresh` route handler in `apps/api/src/routes/v1/cart.js`
- [ ] T041 [US3] Implement `cartService.refreshCart` in `apps/api/src/services/cartService.js` — revalidate each item against current stock/product status, recreate reservations for available items, mark unavailable items

### Frontend Implementation for User Story 3

- [ ] T042 [US3] Add cookie read/write for `cartId` in `CartContext.tsx` on mount and after mutations
- [ ] T043 [US3] Add `refresh` method to `CartContext.tsx`
- [ ] T044 [US3] Create `/cart` page at `apps/web/src/app/cart/page.tsx` — full-page cart with all line items, summary, and "Continue Shopping" link
- [ ] T045 [US3] Add "Refresh Availability" button to `CartLineItem.tsx` for items with expired reservations
- [ ] T046 [US3] Add "Stock not reserved" and "Unavailable" warning badges to `CartLineItem.tsx`
- [ ] T047 [US3] Disable checkout CTA in `CartSummary.tsx` when any item is unavailable

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality, observability, and integration validation

- [ ] T048 Add audit event logging to `cartService.js` for add/update/remove/clear operations
- [ ] T049 [P] Add `cart.test.js` integration tests for concurrent add-to-cart race condition
- [ ] T050 [P] Add `cart.test.js` integration tests for cart abuse (21st item rejection, rate limit)
- [ ] T051 [P] Add `cart.test.js` integration tests for idempotency (duplicate key returns same response)
- [ ] T052 Verify TTL behaviour: reservation expires and availability recovers within 60 seconds
- [ ] T053 Verify TTL behaviour: stale cart is deleted after 7 days of inactivity
- [ ] T054 Wire `AddToCartButton` into `ProductCard.tsx` for grid quick-add
- [ ] T055 Run all quickstart.md manual test scenarios and verify
- [ ] T056 Verify cart drawer and cart page match design tokens (dark theme, gold accents, display fonts)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational.
  - US1 (P1) → US2 (P1) → US3 (P2) recommended sequential order
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P1)**: Can start after US1 (shares CartContext and CartDrawer, but could parallelize backend).
- **US3 (P2)**: Can start after US1+US2 (requires full cart UI and cookie handling).

### Parallel Opportunities

- T004 and T005 (models) can run in parallel
- T010–T011 (US1 tests) and T024–T026 (US2 tests) can be written in parallel after Foundational
- T017 and T018 (frontend context/hook) can run in parallel
- T019, T020, T021 (frontend components) can run in parallel after context exists
- T033 and T034 (CartLineItem + CartSummary) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (add to cart + drawer + persistence)
4. **STOP and VALIDATE**: Test add-to-cart end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → Deploy/Demo (MVP!)
3. US2 → Test independently → Deploy/Demo
4. US3 → Test independently → Deploy/Demo
5. Polish → Final validation

---

## Metrics

- **Total tasks**: 56
- **Setup**: 3
- **Foundational**: 6
- **US1 (Add to Cart)**: 14
- **US2 (Manage Cart)**: 14
- **US3 (Persistence)**: 10
- **Polish**: 9
