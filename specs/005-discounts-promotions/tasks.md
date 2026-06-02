# Tasks: Discounts & Promotions

**Input**: Design documents from `/specs/005-discounts-promotions/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested; manual end-to-end validation per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal setup — project already initialized from prior phases.

- [ ] T001 [P] Verify project builds and servers start on current branch `005-discounts-promotions`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Create `PromoCode` Mongoose model in `apps/api/src/models/PromoCode.js`
- [x] T003 [P] Add `appliedPromoCode` field to `Cart` model in `apps/api/src/models/Cart.js`
- [x] T004 [P] Add `discount` snapshot subdocument to `Order` model in `apps/api/src/models/Order.js`
- [x] T005 Create `discountService.js` in `apps/api/src/services/discountService.js` (validation + computation engine; on DB errors, silently skip discount and log — never block cart read)
- [x] T006 Create Zod validation schemas for promo codes in `apps/api/src/validators/promoCodeSchemas.js`
- [x] T007 Add rate limit middleware for promo code validation endpoint in `apps/api/src/middleware/rateLimitPromo.js`
- [x] T008 Add composite indexes on `PromoCode` collection (`code` sparse unique, `isAutomatic+active+dates`)

**Checkpoint**: Foundation ready — PromoCode model, discount engine, and updated Cart/Order schemas are in place.

---

## Phase 3: User Story 1 — Apply Promo Code at Checkout (Priority: P1) 🎯 MVP

**Goal**: Customers can enter a promo code during checkout and see an immediate, server-validated reduction in their order total. The discount is computed entirely server-side and snapshotted in the order.

**Independent Test**: A customer can add items to cart, apply a valid promo code, see the discounted total in cart and checkout, complete payment, and receive an order with the discount permanently recorded.

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement `POST /cart/apply-promo` route in `apps/api/src/routes/v1/cart.js`
- [x] T010 [P] [US1] Implement `DELETE /cart/promo` route in `apps/api/src/routes/v1/cart.js`
- [x] T011 [US1] Update `cartService.js` to recompute and clear discount on `addItem`, `updateItem`, `removeItem`, `clearCart`
- [x] T012 [US1] Update `formatCartResponse` in `apps/api/src/services/cartService.js` to include `discount`, `shipping`, and `total` (GET /cart automatically returns these via the existing handler)
- [x] T014 [US1] Update `checkoutService.createCheckoutSession` in `apps/api/src/services/checkoutService.js` to accept optional `promoCode`
- [x] T015 [US1] Update `checkoutService.processOrder` to re-validate promo code atomically in transaction and snapshot discount in Order
- [x] T016 [US1] Add `usageCount` atomic increment in checkout transaction using `$inc` with pre-check
- [x] T017 [US1] Update `POST /checkout` route in `apps/api/src/routes/v1/checkout.js` to accept optional `promoCode` in body
- [x] T018 [P] [US1] Create `PromoCodeInput.tsx` component in `apps/web/src/components/checkout/PromoCodeInput.tsx`
- [x] T019 [P] [US1] Update `ReviewStep.tsx` in `apps/web/src/components/checkout/ReviewStep.tsx` to display discount breakdown
- [x] T020 [US1] Update `checkout-api.ts` in `apps/web/src/lib/checkout-api.ts` with `applyPromo`, `removePromo`, and updated `createCheckoutSession`
- [x] T021 [US1] Update `apps/web/src/app/checkout/page.tsx` to manage promo code state and pass to checkout API
- [x] T022 [P] [US1] Update `CartSummary.tsx` in `apps/web/src/components/CartSummary.tsx` to show applied discount and allow code entry
- [x] T023 [US1] Update `OrderConfirmation` page in `apps/web/src/app/order-confirmation/[orderNumber]/page.tsx` to display discount snapshot
- [x] T024 [US1] Update `OrderLookupForm` / order display to show discount line item
- [x] T025 [P] [US1] Update `OrderHistoryList.tsx` in `apps/web/src/components/OrderHistoryList.tsx` to show discount in order cards

**Checkpoint**: User Story 1 is fully functional — promo codes apply at cart/checkout, validate server-side, and snapshot in orders.

---

## Phase 4: User Story 2 — Automatic Cart-Level Offer (Priority: P2)

**Goal**: Customers see automatic discounts applied to their cart when cart conditions are met (e.g., threshold-based offers), with no code entry required.

**Independent Test**: A customer with a cart over an offer threshold sees the automatic discount applied in both cart and checkout without entering any code.

### Implementation for User Story 2

- [x] T026 [US2] Update `discountService.js` to evaluate all active automatic offers and return the best one
- [x] T027 [US2] Update `cartService.js` `formatCartResponse` to evaluate automatic offers when no manual code is applied
- [x] T028 [P] [US2] Create `PromoCodeBanner.tsx` in `apps/web/src/components/PromoCodeBanner.tsx` to display active automatic offer in cart
- [x] T029 [US2] Update `CartSummary.tsx` to show automatic offer discount and messaging
- [x] T030 [US2] Update checkout page to carry automatic offer through to order preview

**Checkpoint**: User Stories 1 AND 2 both work — manual codes and automatic offers apply correctly, with manual codes taking precedence when both are eligible ("best discount wins").

---

## Phase 5: User Story 3 — Free Shipping Promo Code (Priority: P2)

**Goal**: Customers can apply promo codes that waive the shipping fee entirely. The order total reflects only the discounted subtotal.

**Independent Test**: A customer applies a free-shipping promo code and sees shipping cost become 0 in cart, checkout, and order confirmation.

### Implementation for User Story 3

- [x] T031 [US3] Verify `discountService.js` correctly handles `type: 'free_shipping'` (sets shipping to 0, discount amount = original shipping cost)
- [x] T032 [US3] Update `checkoutService.createCheckoutSession` to handle free shipping in preview totals
- [x] T033 [US3] Update `checkoutService.processOrder` to snapshot free shipping correctly (shippingCost = 0, discount amount = original shipping)
- [x] T034 [P] [US3] Update frontend order summary components to display "Free Shipping" when shipping is 0
- [x] T035 [US3] Update order confirmation and lookup to display free shipping indicator

**Checkpoint**: All three discount types (percentage, fixed, free shipping) work correctly across cart, checkout, and order records.

---

## Phase 6: User Story 4 — Admin Promo Code Management (Priority: P2)

**Goal**: Administrators can create, edit, activate, deactivate, and view promo codes through a protected admin API.

**Independent Test**: An authenticated admin can create a promo code via API, verify it works for customers, and deactivate it.

### Implementation for User Story 4

- [x] T036 [P] [US4] Implement `GET /admin/promo-codes` route in `apps/api/src/routes/v1/admin/promoCodes.js`
- [x] T037 [P] [US4] Implement `POST /admin/promo-codes` route with validation
- [x] T038 [P] [US4] Implement `GET /admin/promo-codes/:id` route
- [x] T039 [P] [US4] Implement `PATCH /admin/promo-codes/:id` route with restrictions (no usageCount change, no code change if used)
- [x] T040 [US4] Implement `DELETE /admin/promo-codes/:id` route (soft delete via `active: false`)
- [x] T041 [US4] Wire admin promo code routes into `apps/api/src/routes/v1/admin/index.js`
- [x] T042 [US4] Create `apps/api/src/routes/v1/promoCodes.js` with `GET /promo-codes/:code/validate` public route and wire it in `apps/api/src/routes/v1/index.js`

**Checkpoint**: Admin can fully manage promo codes; customers can validate codes in real-time.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories — seed data, docs, audit, and validation.

- [x] T043 [P] Create `seedPromoCodes.js` script in `apps/api/scripts/seedPromoCodes.js`
- [ ] T044 [P] Add audit events for promo code creation, update, and deactivation in admin routes
- [ ] T045 [P] Add audit event for `promo.applied` when a code is successfully used in an order
- [ ] T046 Update `PRIVACY.md` to document any new PII-related tracking (promo code usage does not add PII)
- [x] T047 Verify frontend build passes with `npm run build` in `apps/web`
- [ ] T048 Run quickstart.md validation scenarios manually (seed codes, apply, checkout, verify snapshot); verify promo code responses are under 1s
- [ ] T049 Verify concurrent usage exhaustion: create code with `usageLimit: 1`, run two simultaneous checkouts
- [ ] T050 Verify "best discount wins" logic: create overlapping automatic + manual offers
- [ ] T051 Commit all changes and push branch `005-discounts-promotions` to GitHub

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase
  - Sequential in priority order recommended (P1 → P2 → P3)
  - US4 (admin) can be worked in parallel with US2/US3 once foundational is done
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories. MUST complete first — it establishes the core discount engine.
- **User Story 2 (P2)**: Depends on US1 (reuses discount engine). Thin layer — automatic offer evaluation.
- **User Story 3 (P2)**: Depends on US1 (reuses discount engine). Thin layer — free shipping type display.
- **User Story 4 (P2)**: Can run in parallel with US2/US3 after foundational. Independent admin surface.

### Within Each User Story

- Models before services
- Services before routes
- Routes before frontend
- Core implementation before polish

### Parallel Opportunities

- T002, T003, T004 (models) can run in parallel
- T009, T010 (cart routes) can run in parallel
- T018, T019, T022 (frontend components) can run in parallel after API is ready
- T036, T037, T038, T039, T040 (admin routes) can run in parallel
- T043, T044, T045, T046 (polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all model updates together:
Task: "Update Cart model in apps/api/src/models/Cart.js"
Task: "Update Order model in apps/api/src/models/Order.js"

# Launch frontend components together after API routes ready:
Task: "Create PromoCodeInput.tsx in apps/web/src/components/checkout/PromoCodeInput.tsx"
Task: "Update ReviewStep.tsx in apps/web/src/components/checkout/ReviewStep.tsx"
Task: "Update CartSummary.tsx in apps/web/src/components/CartSummary.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (P1) — promo codes at checkout with order snapshot
4. **STOP and VALIDATE**: Test promo code apply → checkout → order creation → snapshot
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Automatic offers work → Deploy/Demo
4. Add User Story 3 → Free shipping works → Deploy/Demo
5. Add User Story 4 → Admin management works → Deploy/Demo

### Suggested Task Execution Order (Single Developer)

Execute sequentially by task ID (T001 → T051), parallelizing only [P] tasks within the same phase. The dependency chain is:

```
T001 → (T002 || T003 || T004) → T005 → T006 → T007 → T008
  → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017
    → (T018 || T019 || T020) → T021 → T022 → T023 → T024 → T025
      → T026 → T027 → T028 → T029 → T030
        → T031 → T032 → T033 → T034 → T035
          → (T036 || T037 || T038 || T039 || T040) → T041 → T042
            → (T043 || T044 || T045 || T046) → T047 → T048 → T049 → T050 → T051
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each logical group of tasks
- Stop at any checkpoint to validate story independently
