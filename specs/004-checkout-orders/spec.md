# Feature Specification: Checkout & Orders

**Feature Branch**: `004-checkout-orders`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "A customer completes checkout: enters shipping details, reviews the order, and pays through a pluggable payment interface (use a stub provider for now). An order is created and stock is decremented."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Guest Checkout (Priority: P1)

A customer with items in their cart proceeds through checkout without creating an account. They enter their contact information, shipping address, select a shipping method, review the final total, and complete payment via the stub provider. Upon success, they see an order confirmation with their order number.

**Why this priority**: This is the core revenue path. Guest checkout must work before any account-dependent features because the majority of e-commerce transactions happen without registration.

**Independent Test**: A user with a guest cart can complete the full checkout flow and receive a confirmed order number without ever logging in.

**Acceptance Scenarios**:

1. **Given** a customer has products in their cart, **When** they navigate to checkout, **Then** they see their cart items, quantities, and a subtotal.
2. **Given** the customer is on the checkout page, **When** they enter valid contact and shipping information, **Then** shipping options are computed and displayed.
3. **Given** shipping options are displayed, **When** the customer selects a method, **Then** the order total updates to include shipping.
4. **Given** the customer reviews the final total, **When** they confirm payment, **Then** the stub payment provider processes the charge and returns a success result.
5. **Given** payment succeeds, **When** the system finalizes the order, **Then** an order is created, stock is decremented, cart is cleared, and the customer sees a confirmation page with their order number.

---

### User Story 2 — Authenticated Checkout with Pre-filled Details (Priority: P2)

A logged-in customer with saved profile information proceeds through checkout. Their name and email are pre-filled from their account. The checkout experience is faster because contact details do not need to be re-entered. The order is linked to their account for future reference in order history.

**Why this priority**: Improves conversion for returning customers and enables the account-side order history feature. Builds on the auth system already in place.

**Independent Test**: A logged-in user can complete checkout with contact details pre-filled, and the resulting order appears in their account page.

**Acceptance Scenarios**:

1. **Given** a customer is logged in and has items in their cart, **When** they navigate to checkout, **Then** their name and email are pre-filled from their account profile.
2. **Given** the customer completes checkout, **When** the order is created, **Then** the order is linked to their user account.
3. **Given** the customer visits their account page, **When** they view order history, **Then** the newly placed order appears in the list with its status and total.

---

### User Story 3 — Order Confirmation & Lookup (Priority: P2)

After completing a purchase, a customer can view their order confirmation and later look up their order by order number and email. This supports guest customers who need to check order status without an account.

**Why this priority**: Reduces support burden by letting customers self-serve order status lookups. Critical trust signal after purchase.

**Independent Test**: A customer can find their order using only their order number and email address, without logging in.

**Acceptance Scenarios**:

1. **Given** a customer has completed checkout, **When** they land on the confirmation page, **Then** they see order number, items, total, shipping address, and status.
2. **Given** a customer remembers their order number and email, **When** they use the order lookup form, **Then** they see the full order details.
3. **Given** a customer enters a wrong order number or email, **When** they submit the lookup, **Then** they receive a generic "not found" message that does not reveal whether the order exists.

---

### User Story 4 — Stock Safety & Oversell Prevention (Priority: P1)

The checkout system must never allow an order to be placed when there is insufficient stock. If two customers attempt to purchase the last unit simultaneously, only one succeeds. The other receives a clear, actionable message.

**Why this priority**: Overselling is a Severity-1 business risk — it leads to cancelled orders, chargebacks, and loss of customer trust. This is a correctness requirement, not a convenience feature.

**Independent Test**: Two simultaneous checkout attempts for the last unit of a product result in exactly one successful order and one clear out-of-stock message.

**Acceptance Scenarios**:

1. **Given** a product has exactly 1 unit in stock, **When** two customers complete checkout for that unit at the same time, **Then** exactly one order succeeds and the other receives an out-of-stock error.
2. **Given** a customer has a cart with a reserved item, **When** the reservation expires before checkout completes, **Then** the system rechecks availability and blocks checkout if stock is gone.
3. **Given** an item in the cart becomes out of stock between "add to cart" and "checkout", **When** the customer attempts to pay, **Then** they are blocked with a clear message identifying which items are unavailable.

---

### User Story 5 — Payment Failure & Retry (Priority: P3)

If the payment step fails (declined card, network error, stub provider rejection), the customer sees a clear error and can retry without re-entering all their information. Their cart and checkout details are preserved.

**Why this priority**: Payment failures are common in e-commerce. A good retry experience recovers revenue that would otherwise be lost.

**Independent Test**: A customer whose payment is declined can retry with corrected details and complete the order without starting over.

**Acceptance Scenarios**:

1. **Given** a customer submits payment, **When** the stub provider returns a failure, **Then** the customer sees a specific error message and remains on the payment step.
2. **Given** a payment failure, **When** the customer retries with corrected details, **Then** the new payment attempt proceeds and, if successful, creates the order.
3. **Given** repeated payment failures, **When** the customer abandons checkout, **Then** their cart remains intact for a later attempt.

---

### Edge Cases

- **Empty cart checkout**: What happens when a customer navigates directly to checkout with an empty cart? They should be redirected to the cart or storefront with a message.
- **Invalid shipping address**: What happens when a customer enters an undeliverable address? The system should validate the address format and, if possible, flag issues before payment.
- **Currency mismatch**: What happens if a product's currency differs from the store's default? The system must handle multi-currency consistently, storing the currency code with every price.
- **Idempotency on double-submit**: What happens if a customer clicks "Pay" twice in rapid succession? Only one order must be created.
- **Partial stock availability**: What happens when some items in the cart are in stock but others are not? The checkout should block and identify the unavailable items.
- **Reservation expiry during checkout**: What happens when the 15-minute checkout reservation expires before the customer completes payment? The system must recheck availability at payment time and block checkout with a clear message if stock is no longer available.
- **Feature flag disabled**: What happens if the checkout feature flag is off? The checkout button should be hidden or show a "coming soon" message, and the API should reject order creation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a customer with a non-empty cart to initiate checkout from the cart page or header.
- **FR-002**: System MUST display a multi-step checkout flow: (1) Contact & Shipping, (2) Shipping Method, (3) Review & Payment.
- **FR-003**: System MUST collect and validate: full name, email address, phone number, shipping address (street, city, governorate, postal code), and optional order notes. The country defaults to Egypt; the field may be hidden or shown as read-only.
- **FR-004**: System MUST compute shipping cost server-side; the MVP supports exactly one flat-rate shipping method ("Standard Delivery"). The customer must not be able to set or modify shipping cost.
- **FR-005**: System MUST display an order summary showing line items (product name, quantity, unit price, line total), subtotal, shipping cost, and grand total with currency.
- **FR-006**: System MUST process payment through a pluggable PaymentProvider interface; the initial implementation MUST use a stub/test provider that simulates success and failure.
- **FR-007**: System MUST create an Order only after successful payment authorization, and MUST decrement product stock atomically as part of order creation.
- **FR-008**: System MUST prevent overselling through optimistic locking: stock decrement and order creation must be an atomic operation; if stock is insufficient, the entire transaction must fail and return a clear error.
- **FR-009**: System MUST store an immutable historical snapshot of each ordered item (SKU, title, unit price, currency, quantity at time of purchase) so that future product changes do not affect past orders.
- **FR-010**: System MUST support idempotent order creation via an `Idempotency-Key`: duplicate submissions with the same key within the TTL window must return the original order without creating a duplicate.
- **FR-011**: System MUST clear the customer's cart upon successful order creation.
- **FR-012**: System MUST release any active cart reservations upon successful order creation (converting them to committed stock) or upon checkout abandonment. When a customer initiates checkout, the system MUST create or extend a checkout-specific reservation with a 15-minute TTL to hold stock during the checkout process.
- **FR-013**: System MUST generate a unique, human-readable order number (e.g., `NECK-XXXXXX`) for every order.
- **FR-014**: System MUST link orders to user accounts for authenticated customers, and MUST support guest orders that can be looked up by order number + email.
- **FR-015**: System MUST protect the checkout flow behind a feature flag / kill switch that can disable order creation without a deployment.
- **FR-016**: System MUST record audit events for order creation and payment confirmation. Additional lifecycle events (shipped, delivered, cancelled) are deferred to Phase 6.
- **FR-017**: System MUST validate all form inputs with user-friendly error messages displayed inline.
- **FR-018**: System MUST redirect users with empty carts away from checkout to the cart or storefront page.

### Key Entities *(include if feature involves data)*

- **Order**: Represents a completed purchase. Contains order number, status (pending, confirmed), customer info (name, email, phone), shipping address, shipping method, order total, currency, payment status, payment transaction reference, user ID (nullable for guest), line items snapshot, timestamps, audit trail. MVP implements only `pending` (during payment) and `confirmed` (after successful payment); additional statuses (processing, shipped, delivered, cancelled) are deferred to Phase 6.
- **OrderLineItem**: Snapshot of a product at time of purchase. Contains SKU, product title, unit price, currency, quantity, line total. Immutable after order creation.
- **ShippingMethod**: Configurable shipping option. Contains name, description, base cost, estimated delivery range, active flag, sort order.
- **PaymentProvider (interface)**: Abstraction for payment processing. Defines methods: createPaymentIntent(order), confirmPayment(intentId), refund(transactionId, amount). Concrete implementations (stub, Stripe, etc.) implement this interface.
- **PaymentTransaction**: Record of a payment attempt. Contains provider, transaction ID, amount, currency, status (pending, succeeded, failed), error details, timestamps.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete checkout from cart to confirmation in under 3 minutes on a stable connection.
- **SC-002**: Zero orders are created with insufficient stock (100% oversell prevention rate).
- **SC-003**: 100% of duplicate payment submissions (double-click) with the same idempotency key result in a single order.
- **SC-004**: Guest and authenticated checkout paths both achieve a successful order completion rate of at least 95% in manual end-to-end testing.
- **SC-005**: Order confirmation page loads and displays complete order details within 2 seconds of payment success.
- **SC-006**: Every order stores a complete, immutable item snapshot that remains accurate even if the original product is later modified or deleted.

---

## Assumptions

- Tax calculation is out of scope for MVP; prices are tax-inclusive (as per Phase 1 locked decision).
- The MVP ships with exactly one flat-rate shipping method ("Standard Delivery"); multiple methods and zone-based pricing are deferred.
- The stub payment provider simulates latency (~500ms) to mimic real provider behavior in testing.
- Real-time address validation (e.g., via geocoding API) is deferred; basic format validation is sufficient for MVP.
- Order cancellation and refund flows are out of scope for this phase; orders are created as "confirmed" and assume immediate fulfillment.
- Multi-currency support stores the currency code with every amount but does not perform live exchange rate conversion at checkout.
- Email notifications (order confirmation, shipping) are deferred to Phase 7 (Launch Hardening).
- The checkout UI follows the existing design system and matches the provided design images for fidelity.

---

## Clarifications

### Session 2026-05-25

- **Q**: How should cart reservations behave during the multi-step checkout process? → **A**: Use a 15-minute checkout-specific reservation when the customer initiates checkout. The reservation TTL is set to 15 minutes upon checkout start and releases on order success or abandonment.
- **Q**: How many shipping methods should the MVP support, and what should they be? → **A**: One flat-rate shipping method for MVP (e.g., "Standard Delivery" at a fixed cost).
- **Q**: What payment flow should the stub provider simulate? → **A**: Two-step intent + confirm (create intent → confirm → success/failure).
- **Q**: Should the shipping address format be Egypt-specific or generic international? → **A**: Egypt-specific: street, city, governorate, postal code; country defaults to Egypt.
- **Q**: What is the minimal order status set for the MVP? → **A**: Two statuses: Pending → Confirmed (fulfillment tracking deferred).
