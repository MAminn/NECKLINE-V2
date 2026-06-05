# Feature Specification: Payment Integration (Paymob)

**Feature Branch**: `005-payment-integration`

**Created**: 2026-06-04

**Status**: Draft

**Input**: ROADMAP.md Phase 5 — "Wire a real processor into the Phase 4 adapter."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Complete Purchase with Paymob (Priority: P1)

A customer enters shipping details, reviews their order, clicks "Pay Now", and is redirected to Paymob's secure hosted checkout page. After entering card details or selecting a wallet, they are redirected back to the store and see an order confirmation.

**Why this priority**: This is the core payment feature. Without it, no real money flows through the system.

**Independent Test**: A customer can complete a full checkout with `PAYMENT_PROVIDER=paymob` (test mode) and receive a confirmed order.

**Acceptance Scenarios**:

1. **Given** a customer has items in their cart, **When** they complete checkout with Paymob, **Then** they are redirected to Paymob's hosted checkout page.
2. **Given** a customer pays successfully on Paymob, **When** the webhook is received, **Then** the order status becomes `confirmed` and `paymentStatus` becomes `succeeded`.
3. **Given** a customer cancels on Paymob's page, **When** they return to the store, **Then** the order remains `pending_payment` and stock is NOT restored (they can retry payment).
4. **Given** Paymob intention creation fails, **When** the customer clicks "Pay Now", **Then** no order is created and stock is NOT decremented.

---

### User Story 2 — Webhook Confirmation (Priority: P1)

Paymob sends a server-to-server webhook when payment succeeds. The server verifies the webhook signature, confirms the order atomically, and records an audit event.

**Why this priority**: Webhook confirmation is the authoritative payment signal. Without it, orders would never be confirmed.

**Independent Test**: Sending a correctly-signed webhook payload to `/webhooks/paymob` confirms the matching order. Invalid signatures are rejected.

**Acceptance Scenarios**:

1. **Given** a valid Paymob webhook with matching signature, **When** it is received, **Then** the order is confirmed within 500ms.
2. **Given** a webhook with an invalid HMAC signature, **When** it is received, **Then** it returns 400 and the order is NOT modified.
3. **Given** a duplicate webhook (same transaction_id), **When** it is received a second time, **Then** it returns 200 but does NOT modify the order again.
4. **Given** a webhook where the amount does not match the order total, **When** it is received, **Then** it returns 400 and the order is NOT modified.

---

### User Story 3 — Refund Order (Priority: P2)

An admin initiates a refund for a confirmed order. The refund is processed through Paymob, recorded in the system, and audit-logged.

**Why this priority**: Refunds are a standard e-commerce operation. Deferring them would leave a gap in operational capability.

**Independent Test**: An admin can refund a confirmed order and see the refund status updated.

**Acceptance Scenarios**:

1. **Given** a confirmed order with a Paymob transaction, **When** an admin requests a refund, **Then** Paymob processes the refund and the order shows refund status.
2. **Given** a refund request for an amount greater than the order total, **When** it is submitted, **Then** it is rejected with a clear error.
3. **Given** a successful refund, **When** it is processed, **Then** an audit event `payment.refunded` is created.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support switching between `stub` and `paymob` payment providers via `PAYMENT_PROVIDER` env var.
- **FR-002**: System MUST create a Paymob payment intention with the server-computed order total (integer minor units).
- **FR-003**: System MUST redirect the customer to Paymob's hosted checkout page after order creation.
- **FR-004**: System MUST verify Paymob webhook HMAC-SHA256 signatures using `PAYMOB_HMAC_SECRET`.
- **FR-005**: System MUST confirm orders atomically upon valid webhook receipt (update Order + PaymentTransaction in a single MongoDB transaction).
- **FR-006**: System MUST deduplicate webhook processing by transaction_id (idempotent handling).
- **FR-007**: System MUST verify that the webhook amount matches the order total before confirming.
- **FR-008**: System MUST create audit events for: payment intent creation, webhook receipt, order confirmation, and refund.
- **FR-009**: System MUST support refunding confirmed orders through Paymob.
- **FR-010**: System MUST keep the stub provider functional for testing and CI.
- **FR-011**: System MUST add `pending_payment` as a valid order status.
- **FR-012**: System MUST compensate (restore stock, delete order) if Paymob intention creation fails after stock decrement.

### Security Requirements

- **SR-001**: Webhook endpoint MUST use raw body parsing (before `express.json()`) to preserve payload for HMAC verification.
- **SR-002**: HMAC comparison MUST use constant-time comparison (`crypto.timingSafeEqual`).
- **SR-003**: Paymob credentials MUST NOT appear in logs, client bundles, or source control.
- **SR-004**: Webhook endpoint MUST NOT depend on session cookies or auth tokens (stateless).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A test-mode payment completes end-to-end (checkout → Paymob → webhook → confirmed order) in under 30 seconds.
- **SC-002**: Invalid webhook signatures are rejected with 400 in under 50ms.
- **SC-003**: Duplicate webhook deliveries result in exactly one order confirmation (idempotent).
- **SC-004**: 100% of confirmed orders have a matching PaymentTransaction with correct amount and providerTransactionId.
- **SC-005**: Switching `PAYMENT_PROVIDER=stub` restores the original synchronous checkout flow without code changes.
- **SC-006**: All payment-related mutations create audit events with actor, action, before/after state.

---

## Assumptions

- Paymob test/sandbox credentials are available for development.
- The server is publicly reachable for webhook delivery (or ngrok is used for local dev).
- Paymob's Intention API v2 is the primary integration method.
- Currency is EGP (integer minor units / piastres) for MVP.
- No subscription or recurring payments in this phase.
- Refunds are full or partial; partial refunds are supported.
