# Tasks: Payment Integration (Paymob)

**Input**: Design documents from `/specs/005-payment-integration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Manual end-to-end validation per quickstart.md; unit tests for PaymobPaymentProvider and webhook handler.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal setup — project already initialized from prior phases.

- [ ] T001 [P] Verify project builds and servers start on current branch

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add Paymob env vars to `apps/api/src/config/env.js` (PAYMENT_PROVIDER, PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET, PAYMOB_BASE_URL)
- [ ] T003 [P] Update `apps/api/.env.example` with new Paymob env vars
- [ ] T004 [P] Add `paymob-node` dependency to `apps/api/package.json` and run npm install
- [ ] T005 Add `pending_payment` to Order status enum in `apps/api/src/models/Order.js`
- [ ] T006 Add `pending_payment` to PaymentTransaction status enum in `apps/api/src/models/PaymentTransaction.js` (if needed)
- [ ] T007 Update `apps/api/src/validators/checkoutSchemas.js` — paymentMethod enum: `['stub', 'paymob']`

**Checkpoint**: Foundation ready — env vars, schema updates, and dependencies in place.

---

## Phase 3: User Story 1 — Paymob Payment Provider (Priority: P1) 🎯 MVP

**Goal**: Implement the Paymob payment provider behind the existing PaymentProvider interface.

**Independent Test**: With `PAYMENT_PROVIDER=paymob`, calling `createPaymentIntent()` returns a valid Paymob intention with `clientSecret` and `payUrl`.

### Implementation for User Story 1

- [ ] T008 Create `apps/api/src/services/payment/PaymobPaymentProvider.js` implementing PaymentProvider interface
  - `createPaymentIntent`: calls Paymob Intention API, returns `{id, status, clientSecret, amount, currency, payUrl}`
  - `confirmPayment`: query intention status via Paymob API (polling fallback)
  - `refund`: call Paymob refund API
- [ ] T009 Update `apps/api/src/services/payment/PaymentProviderFactory.js` — add `'paymob'` case
- [ ] T010 [P] [US1] Create unit tests `apps/api/tests/unit/payment/PaymobPaymentProvider.test.js` (mock Paymob API)
- [ ] T011 [P] [US1] Verify stub provider still works when `PAYMENT_PROVIDER=stub`

**Checkpoint**: Paymob provider creates intentions correctly; factory switches providers.

---

## Phase 4: User Story 2 — Async Checkout Flow (Priority: P1) 🎯 MVP

**Goal**: Adapt checkout to create order first, then Paymob intention, then redirect frontend to hosted checkout.

**Independent Test**: A customer completes checkout, gets redirected to Paymob, and the order exists in DB with `status: 'pending_payment'`.

### Implementation for User Story 2

- [ ] T012 Update `apps/api/src/services/checkoutService.js` `processOrder`:
  - Decrement stock atomically (existing)
  - Create Order with `status: 'pending_payment'` (instead of 'pending')
  - Create PaymentTransaction with `status: 'pending'`
  - Call `provider.createPaymentIntent()` to get Paymob intention
  - Store `intentId` in PaymentTransaction
  - If intention creation fails: compensate (restore stock, delete order, decrement promo usage)
  - Return `{order, payUrl}` instead of completed order
- [ ] T013 Update `apps/api/src/routes/v1/orders.js` `POST /orders`:
  - Return `{order, payUrl}` when payment provider is paymob
  - Preserve existing behavior for stub provider
- [ ] T014 Update `apps/web/src/lib/checkout-api.ts` `createOrder`:
  - Handle `{order, payUrl}` response shape
- [ ] T015 Update `apps/web/src/app/checkout/page.tsx`:
  - On `createOrder` success with `payUrl`, redirect browser to `payUrl`
  - Show `PaymentRedirect` component while redirecting
- [ ] T016 [P] [US2] Create `apps/web/src/components/checkout/PaymentRedirect.tsx` — "Redirecting to secure payment..."
- [ ] T017 Update `apps/api/src/services/orderService.js` — add `getOrderByIntentId` for webhook lookup

**Checkpoint**: Checkout flow creates pending order + Paymob intention; frontend redirects to hosted checkout.

---

## Phase 5: User Story 3 — Webhook Handling (Priority: P1) 🎯 MVP

**Goal**: Receive and verify Paymob webhooks, confirm orders atomically, handle duplicates.

**Independent Test**: Sending a correctly-signed Paymob webhook payload confirms the matching order. Duplicate transaction IDs are ignored. Tampered payloads are rejected with 400.

### Implementation for User Story 3

- [ ] T018 Create `apps/api/src/middleware/verifyPaymobWebhook.js`:
  - Raw body capture (for HMAC verification)
  - HMAC-SHA256 signature verification using `PAYMOB_HMAC_SECRET`
  - Constant-time comparison (`crypto.timingSafeEqual`)
  - Attach verified payload to `req.body`
- [ ] T019 Update `apps/api/src/app.js`:
  - Mount webhook route `POST /webhooks/paymob` BEFORE `express.json()`
  - Use `verifyPaymobWebhook` middleware for raw body + signature check
- [ ] T020 Create `apps/api/src/routes/v1/webhooks.js`:
  - `POST /webhooks/paymob` handler
  - Parse payload: extract `intention_id`, `transaction_id`, `amount`, `currency`, `status`
  - Deduplicate: check if transaction_id already in PaymentTransaction
  - Find order by intentId via `orderService.getOrderByIntentId`
  - Verify amount matches order.total
  - Atomic MongoDB transaction:
    - Update Order: `status: 'confirmed'`, `paymentStatus: 'succeeded'`
    - Update PaymentTransaction: `status: 'succeeded'`, `providerTransactionId`
  - Audit event: `payment.webhook_confirmed`
  - Return 200 OK (or 204)
- [ ] T021 Update `apps/api/src/routes/v1/index.js` — wire webhook routes
- [ ] T022 [P] [US3] Create webhook handler unit tests:
  - Valid signature → order confirmed
  - Invalid signature → 400
  - Duplicate transaction → 200 (idempotent)
  - Amount mismatch → 400
  - Missing order → 404
- [ ] T023 Update `apps/web/src/app/order-confirmation/[orderNumber]/OrderConfirmationClient.tsx`:
  - Handle `order.status === 'pending_payment'` — show "Confirming your payment..."
  - Poll `GET /orders/:orderNumber` every 3 seconds
  - Transition to success screen when `status === 'confirmed'`
  - Timeout after 2 minutes → show "Payment is taking longer than expected"

**Checkpoint**: Webhook confirms orders; frontend polls and shows correct states.

---

## Phase 6: User Story 4 — Refunds (Priority: P2)

**Goal**: Admin can refund orders through Paymob; refund recorded in audit trail.

**Independent Test**: An admin initiates a refund for a confirmed order; Paymob processes it; order shows refund status.

### Implementation for User Story 4

- [ ] T024 Update `apps/api/src/services/orderService.js` — add `refundOrder(orderId, amount, reason)`:
  - Validate order is confirmed and has payment transaction
  - Call `provider.refund(transactionId, amount)`
  - Create refund record (new model or embedded in PaymentTransaction)
  - Audit event: `payment.refunded`
- [ ] T025 [P] [US4] Add `POST /admin/orders/:orderNumber/refund` route (protected by admin permission)
- [ ] T026 [P] [US4] Update frontend admin order UI to support refund action

**Checkpoint**: Refunds work end-to-end with audit trail.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Feature flags, docs, seed data, and validation.

- [ ] T027 [P] Create `paymob_enabled` feature flag in FeatureFlag model (scope: 'payment')
- [ ] T028 [P] Update `apps/api/src/services/checkoutService.js` to check `paymob_enabled` flag before using Paymob
- [ ] T029 [P] Create `apps/api/scripts/seedPaymobTestConfig.js` — seed test-mode Paymob config for dev
- [ ] T030 Update `PRIVACY.md` if any new PII tracking (webhook may include customer email — document it)
- [ ] T031 Verify frontend build passes with `npm run build` in `apps/web`
- [ ] T032 Verify API tests pass with `npm run test:api`
- [ ] T033 Run quickstart.md validation scenarios manually (stub + paymob test mode)
- [ ] T034 Verify webhook signature with real Paymob test payload
- [ ] T035 Commit all changes and push branch `005-payment-integration` to GitHub

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase
  - Sequential in priority order recommended (P1 → P2)
  - US4 (refunds) can be worked in parallel with US3 once US2 is done
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories. MUST complete first — establishes the provider.
- **User Story 2 (P1)**: Depends on US1 (needs Paymob provider). Adapts checkout flow.
- **User Story 3 (P1)**: Depends on US2 (needs pending orders to confirm). Webhook handler.
- **User Story 4 (P2)**: Depends on US3 (needs confirmed orders to refund). Can run in parallel with polish.

### Within Each User Story

- Models before services
- Services before routes
- Routes before frontend
- Core implementation before polish

### Parallel Opportunities

- T002, T003, T004, T005, T006, T007 (foundational) can run in parallel
- T008, T010, T011 (provider + tests) can run in parallel
- T012, T013, T014, T015, T016, T017 (checkout flow) — T012 blocks T013; T013 blocks T014-T016
- T018, T022 (webhook middleware + tests) can run in parallel after T017
- T024, T025, T026 (refunds) can run in parallel
- T027, T028, T029, T030 (polish) can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1–3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 — Paymob provider
4. Complete Phase 4: User Story 2 — Async checkout flow
5. Complete Phase 5: User Story 3 — Webhook handling
6. **STOP and VALIDATE**: End-to-end test with Paymob test mode
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Provider works → Deploy/Demo
3. Add US2 → Checkout redirects → Deploy/Demo
4. Add US3 → Webhooks confirm → Deploy/Demo (MVP complete!)
5. Add US4 → Refunds work → Deploy/Demo

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each logical group of tasks
- Stop at any checkpoint to validate story independently
- For local development without Paymob credentials, use `PAYMENT_PROVIDER=stub`
- Webhook testing locally requires ngrok or similar tunnel, OR manual POST simulation
