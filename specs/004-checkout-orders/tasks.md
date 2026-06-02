# Tasks: Checkout & Orders

**Input**: Design documents from `specs/004-checkout-orders/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: User story label (US1, US2, US3, US4, US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Seed data, env config, and project structure for checkout

- [ ] T001 Add `CHECKOUT_ENABLED` and stub payment env vars to `apps/api/.env.example`
- [ ] T002 [P] Add `STUB_PAYMENT_LATENCY_MS`, `STUB_PAYMENT_FAILURE_RATE`, `STUB_PAYMENT_DECLINE_EMAILS` to `apps/api/.env.example`
- [ ] T003 Create seed script `apps/api/scripts/seedShippingMethod.js` to insert the default "Standard Delivery" method
- [ ] T004 Run shipping method seed and verify record exists in MongoDB

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, payment adapter, and middleware that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Payment Provider Adapter

- [ ] T005 [P] Create `PaymentProvider` interface in `apps/api/src/services/payment/PaymentProvider.js`
- [ ] T006 [P] Create `StubPaymentProvider` in `apps/api/src/services/payment/StubPaymentProvider.js`
- [ ] T007 Create `PaymentProviderFactory` in `apps/api/src/services/payment/PaymentProviderFactory.js`
- [ ] T008 Write unit tests for `StubPaymentProvider` in `apps/api/tests/unit/payment/StubPaymentProvider.test.js`

### Domain Models

- [ ] T009 [P] Create `ShippingMethod` model in `apps/api/src/models/ShippingMethod.js`
- [ ] T010 [P] Create `PaymentTransaction` model in `apps/api/src/models/PaymentTransaction.js`
- [ ] T011 Create `Order` model with embedded `OrderLineItem` in `apps/api/src/models/Order.js`
- [ ] T012 Add unique index on `Order.orderNumber` and index on `Order.userId`, `Order.customerEmail`, `Order.createdAt`

### Utilities & Middleware

- [ ] T013 Create `generateOrderNumber` utility in `apps/api/src/utils/generateOrderNumber.js`
- [ ] T014 Create `requireCheckoutEnabled` middleware in `apps/api/src/middleware/requireCheckoutEnabled.js`
- [ ] T015 Create `rateLimitCheckout` middleware in `apps/api/src/middleware/rateLimitCheckout.js` (5 req/min POST /orders, 10 req/min POST /checkout)
- [ ] T064 [P] Verify `Idempotency-Key` middleware works on `POST /orders` (reuse existing `IdempotencyKey` collection from Phase 0 or create if missing)

### Shared Services

- [ ] T016 Create `shippingService.js` in `apps/api/src/services/shippingService.js` (returns active shipping methods)
- [ ] T017 Create `orderService.js` in `apps/api/src/services/orderService.js` with `createOrder`, `getOrderByNumber`, `listOrdersByUser`

**Checkpoint**: Foundation ready — models, adapter, middleware, and base services exist and compile

---

## Phase 3: User Story 1 — Guest Checkout (Priority: P1) 🎯 MVP

**Goal**: A guest customer with a cart can complete checkout, pay via stub provider, and receive a confirmed order with decremented stock.

**Includes**: US4 Stock Safety & Oversell Prevention (P1)

**Independent Test**: Use curl/API client to POST /checkout and POST /orders with a guest cart; verify order created, stock decremented, cart cleared.

### Backend — Checkout Service

- [ ] T018 [P] Implement `checkoutService.validateCheckout()` in `apps/api/src/services/checkoutService.js` (cart non-empty, stock check)
- [ ] T019 [P] Implement `checkoutService.createCheckoutSession()` in `apps/api/src/services/checkoutService.js` (returns preview + checkoutToken)
- [ ] T020 Implement `checkoutService.processOrder()` in `apps/api/src/services/checkoutService.js` (atomic via MongoDB `startSession()` transaction: payment → order → stock → clear cart)
- [ ] T021 Add optimistic locking stock decrement inside `checkoutService.processOrder()` using `Product.version` + `$gte` guard in MongoDB transaction
- [ ] T022 Write unit tests for `checkoutService` in `apps/api/tests/unit/checkoutService.test.js`

### Backend — Routes

- [ ] T023 Create `POST /api/v1/checkout` route in `apps/api/src/routes/v1/checkout.js`
- [ ] T024 Create `POST /api/v1/orders` route in `apps/api/src/routes/v1/orders.js`
- [ ] T025 Create `GET /api/v1/shipping-methods` route in `apps/api/src/routes/v1/checkout.js`
- [ ] T026 Wire checkout + orders routes into `apps/api/src/app.js`
- [ ] T027 Write integration tests for guest checkout flow in `apps/api/tests/integration/checkout.test.js`

### Frontend — Checkout Page

- [ ] T028 [P] Create checkout API client in `apps/web/src/lib/checkout-api.ts`
- [ ] T029 [P] Create `OrderSummary` component in `apps/web/src/components/checkout/OrderSummary.tsx`
- [ ] T030 Create `ShippingStep` component in `apps/web/src/components/checkout/ShippingStep.tsx`
- [ ] T031 Create `ReviewStep` component in `apps/web/src/components/checkout/ReviewStep.tsx`
- [ ] T032 Create `PaymentStep` component in `apps/web/src/components/checkout/PaymentStep.tsx`
- [ ] T033 Create `CheckoutForm` multi-step wrapper in `apps/web/src/components/checkout/CheckoutForm.tsx`
- [ ] T034 Create checkout page in `apps/web/src/app/checkout/page.tsx`

### Frontend — Cart Integration

- [ ] T035 Wire "Proceed to Checkout" button in cart to `/checkout`
- [ ] T036 Redirect empty carts away from `/checkout` to cart page

**Checkpoint**: Guest checkout works end-to-end; stock decrements atomically; idempotency key prevents duplicates

---

## Phase 4: User Story 2 — Authenticated Checkout (Priority: P2)

**Goal**: Logged-in customers see pre-filled contact details, and orders are linked to their account for order history.

**Independent Test**: Log in, add to cart, checkout — verify name/email pre-filled and order appears on `/account`.

### Backend

- [ ] T037 Update `POST /api/v1/checkout` to accept optional auth and use `userId` to find linked cart
- [ ] T038 Update `POST /api/v1/orders` to set `Order.userId` when authenticated
- [ ] T039 Create `GET /api/v1/orders` route in `apps/api/src/routes/v1/orders.js` (authenticated order history, paginated)
- [ ] T040 Write integration tests for authenticated checkout in `apps/api/tests/integration/checkout.auth.test.js`

### Frontend

- [ ] T041 Update `ShippingStep` to pre-fill name/email from `useAuth()` when authenticated
- [ ] T042 Update `OrderHistoryList` component in `apps/web/src/components/OrderHistoryList.tsx` to fetch real orders from API
- [ ] T043 Update `/account` page to display paginated order history

**Checkpoint**: Authenticated users get pre-filled checkout and see orders in account history

---

## Phase 5: User Story 3 — Order Confirmation & Lookup (Priority: P2)

**Goal**: Customers can view order confirmation after purchase and look up guest orders by order number + email.

**Independent Test**: Complete a guest checkout, then use order number + email on `/order-lookup` to retrieve details.

### Backend

- [ ] T044 Implement `GET /api/v1/orders/:orderNumber` in `apps/api/src/routes/v1/orders.js` (public; requires `?email=` for guest orders)
- [ ] T045 Add generic 404 for order-not-found vs email-mismatch to prevent enumeration
- [ ] T046 Write integration tests for order lookup in `apps/api/tests/integration/orderLookup.test.js`

### Frontend

- [ ] T047 Create `OrderConfirmation` component in `apps/web/src/components/orders/OrderConfirmation.tsx`
- [ ] T048 Create order confirmation page in `apps/web/src/app/order-confirmation/[orderNumber]/page.tsx`
- [ ] T049 Create `OrderLookupForm` component in `apps/web/src/components/orders/OrderLookupForm.tsx`
- [ ] T050 Create order lookup page in `apps/web/src/app/order-lookup/page.tsx`
- [ ] T051 Redirect successful checkout to `/order-confirmation/{orderNumber}`

**Checkpoint**: Order confirmation and lookup pages work for both guest and authenticated orders

---

## Phase 6: User Story 5 — Payment Failure & Retry (Priority: P3)

**Goal**: Failed payments show clear errors and allow retry without losing checkout progress.

**Independent Test**: Trigger a stub decline (via `STUB_PAYMENT_DECLINE_EMAILS`) and verify retry succeeds.

### Backend

- [ ] T052 Update `StubPaymentProvider.confirmPayment()` to return structured error codes (`stub_decline`, `stub_invalid_intent`)
- [ ] T053 Update `POST /api/v1/orders` to return `402` with `checkoutToken` preserved for retry
- [ ] T054 Ensure checkout session/token remains valid for retry within reservation TTL

### Frontend

- [ ] T055 Update `PaymentStep` to display payment error messages inline
- [ ] T056 Implement retry flow: keep checkout state, allow re-submission of payment
- [ ] T057 Add loading/disabled state to pay button to prevent double-submit

**Checkpoint**: Payment failures are recoverable; checkout state persists for retry

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Observability, privacy registry, frontend polish, and end-to-end validation

- [ ] T058 [P] Add audit event logging for `order.created` and `order.payment_confirmed` in `checkoutService.processOrder()`
- [ ] T059 [P] Add structured JSON logs for checkout errors with `requestId` and `correlationId`
- [ ] T060 Update `PRIVACY.md` registry with new PII fields: shipping address, phone number, order details
- [ ] T061 Add loading skeleton states to checkout steps
- [ ] T062 Add form validation error messages (Zod errors mapped to Arabic-friendly field names)
- [ ] T063 Add responsive layout for checkout on mobile
- [ ] T065 Run quickstart.md validation: complete full guest checkout via API, verify stock decrement
- [ ] T066 Run frontend build (`npm run build` in apps/web) and fix any errors
- [ ] T067 Commit all changes and push `004-checkout-orders` branch to GitHub

**Checkpoint**: All user stories complete, tests passing, privacy registry updated, branch pushed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 Guest Checkout)**: Depends on Phase 2 — MVP target
- **Phase 4 (US2 Authenticated)**: Depends on Phase 2 + US1 (reuses checkout flow)
- **Phase 5 (US3 Confirmation/Lookup)**: Depends on Phase 2 + US1 (needs orders to exist)
- **Phase 6 (US5 Failure/Retry)**: Depends on Phase 2 + US1 (needs payment flow)
- **Phase 7 (Polish)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No deps on other stories.
- **US2 (P2)**: Can start after Phase 2 + US1 complete. Adds auth layer to existing checkout.
- **US3 (P2)**: Can start after Phase 2 + US1 complete. Reads orders created by US1.
- **US4 (P1)**: Implemented within US1 phase (stock safety is part of checkout correctness).
- **US5 (P3)**: Can start after Phase 2 + US1 complete. Enhances existing payment flow.

### Parallel Opportunities

- Within Phase 2: Payment adapter, models, and middleware can be developed in parallel
- Within Phase 3: Backend checkout service and frontend components can be developed in parallel
- Phase 4, 5, and 6 can start in parallel once Phase 3 is complete (if team capacity allows)
- Phase 7 tasks marked [P] can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# Payment adapter team:
T005 Create PaymentProvider interface
T006 Create StubPaymentProvider
T007 Create PaymentProviderFactory
T008 Write StubPaymentProvider tests

# Data team:
T009 Create ShippingMethod model
T010 Create PaymentTransaction model
T011 Create Order model
T012 Add Order indexes

# Infra team:
T013 Create generateOrderNumber utility
T014 Create requireCheckoutEnabled middleware
T015 Create rateLimitCheckout middleware
T016 Create shippingService
T017 Create orderService
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 Guest Checkout
4. **STOP and VALIDATE**: Test full guest checkout end-to-end via API and frontend
5. Verify stock decrement, idempotency, and feature flag behavior

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 Guest Checkout → Test independently → Core revenue path works!
3. US2 Authenticated Checkout → Test independently
4. US3 Confirmation/Lookup → Test independently
5. US5 Failure/Retry → Test independently
6. Polish → Cross-cutting concerns

### Recommended Order for Solo Developer

Follow sequential priority order (US1 → US2 → US3 → US5) because later stories build on earlier ones and reuse the same checkout flow. Each story adds value without breaking previous functionality.

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | 4 | — |
| Foundational | 14 | — |
| US1 Guest Checkout | 19 | US1 |
| US2 Authenticated | 7 | US2 |
| US3 Confirmation/Lookup | 8 | US3 |
| US5 Payment Failure | 6 | US5 |
| Polish | 9 | — |
| **Total** | **67** | |
