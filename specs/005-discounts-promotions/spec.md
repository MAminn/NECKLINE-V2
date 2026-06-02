# Feature Specification: Discounts & Promotions

**Feature Branch**: `005-discounts-promotions`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Apply promo codes and automatic offers to cart/order totals, computed entirely server-side."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Apply Promo Code at Checkout (Priority: P1)

A customer enters a promo code during checkout and sees an immediate reduction in their order total before payment. The discount is validated server-side for validity, expiration, and eligibility. The final total reflects the discounted amount.

**Why this priority**: This is the core discount feature. Promo codes are the most common promotion mechanism in e-commerce and directly drive conversions. The server must be the single source of truth for all pricing.

**Independent Test**: A customer can enter a valid promo code at checkout and see the order total reduced by the correct amount. An invalid, expired, or inapplicable code returns a clear error without modifying the total.

**Acceptance Scenarios**:

1. **Given** a customer has items in their cart totaling 5000 EGP, **When** they enter a valid 10% off promo code, **Then** the order total becomes 4500 EGP (plus shipping).
2. **Given** a customer enters an expired promo code, **When** the system validates it, **Then** they receive an error message "This promo code has expired" and the total remains unchanged.
3. **Given** a customer enters a promo code with a minimum order amount of 10000 EGP, **When** their cart totals 5000 EGP, **Then** they receive an error "This code requires a minimum order of 10000 EGP" and the total remains unchanged.
4. **Given** a customer enters a promo code that has reached its maximum usage limit, **When** they apply it, **Then** they receive an error "This promo code is no longer available" and the total remains unchanged.
5. **Given** a customer applies a valid promo code, **When** they review their order before payment, **Then** they see a clear breakdown: subtotal, discount amount, shipping, and final total.
6. **Given** a customer applies a promo code then removes an item from their cart causing the total to fall below the minimum, **When** they proceed to payment, **Then** the promo code is automatically invalidated and the total recalculated without the discount.

---

### User Story 2 — Automatic Cart-Level Offer (Priority: P2)

A customer sees an automatic discount applied to their cart without entering any code. For example, a "Summer Sale" automatically gives 15% off all orders over 8000 EGP. The discount appears in the cart summary and carries through to checkout.

**Why this priority**: Automatic offers reduce friction (no code to remember) and can drive larger basket sizes through threshold-based incentives. This builds on the promo code infrastructure.

**Independent Test**: A customer with a cart over the offer threshold sees the automatic discount applied in both cart and checkout. Customers below the threshold see no discount.

**Acceptance Scenarios**:

1. **Given** an automatic "15% off orders over 8000 EGP" offer is active, **When** a customer's cart totals 10000 EGP, **Then** they see a 1500 EGP discount applied automatically in the cart and checkout.
2. **Given** the same offer is active, **When** a customer's cart totals 7000 EGP, **Then** no automatic discount is applied.
3. **Given** a customer has both an automatic offer and enters a promo code, **When** both apply, **Then** only the best discount (most favorable to the customer) is applied, never stacked.
4. **Given** an automatic offer has an end date, **When** the current date is past the end date, **Then** the offer no longer applies to any carts.

---

### User Story 3 — Free Shipping Promo Code (Priority: P2)

A customer enters a promo code that waives the shipping fee entirely. The order total reflects only the discounted subtotal with zero shipping cost.

**Why this priority**: Free shipping is one of the most effective conversion drivers in e-commerce. It requires special handling because the discount target is shipping rather than the subtotal.

**Independent Test**: A customer can apply a free-shipping promo code and see the shipping cost removed from their order total.

**Acceptance Scenarios**:

1. **Given** a customer has a cart with subtotal 5000 EGP and shipping 500 EGP (total 5500 EGP), **When** they apply a free-shipping promo code, **Then** the order total becomes 5000 EGP with shipping shown as 0.
2. **Given** a customer applies a free-shipping code with a minimum order of 10000 EGP, **When** their subtotal is 8000 EGP, **Then** the code is rejected and shipping remains charged.
3. **Given** a customer applies a free-shipping code, **When** the order is created, **Then** the order snapshot records shipping cost as 0 and the original shipping method is preserved.

---

### User Story 4 — Admin Promo Code Management (Priority: P2)

An administrator creates, edits, activates, and deactivates promo codes through an admin interface. They can set usage limits, date ranges, discount types, and minimum order requirements. They can view usage statistics for each code.

**Why this priority**: Self-service promo code management is essential for marketing teams to run campaigns without engineering involvement. This is a backend/admin feature that supports all customer-facing discount scenarios.

**Independent Test**: An admin can create a new promo code with specific parameters, verify it works for customers, and deactivate it when the campaign ends.

**Acceptance Scenarios**:

1. **Given** an admin is logged into the admin panel, **When** they create a new promo code "SUMMER25" with 25% off, usage limit 100, valid until end of month, **Then** the code is saved and immediately usable by customers.
2. **Given** an existing promo code, **When** an admin deactivates it, **Then** customers can no longer apply it and receive a "code no longer valid" message.
3. **Given** a promo code with usage limit 50, **When** 50 customers have successfully used it, **Then** the 51st customer receives "This promo code is no longer available".
4. **Given** an admin views a promo code, **When** they check its details, **Then** they see current usage count, remaining uses, total discount amount given, and revenue generated with this code.

---

### User Story 5 — Discount Persistence in Order Record (Priority: P1)

When an order is created with a discount applied, the discount details are permanently recorded in the order. Future changes to the promo code (price changes, deactivation, deletion) never affect historical orders.

**Why this priority**: Order immutability is a financial and legal requirement. The exact discount applied at time of purchase must be auditable forever, independent of the promo code's current state.

**Independent Test**: An admin can change or delete a promo code after orders have used it, and those historical orders still show the correct original discount amount.

**Acceptance Scenarios**:

1. **Given** an order was placed with a 20% discount, **When** an admin later changes the promo code to 10%, **Then** the historical order still shows the original 20% discount.
2. **Given** an order was placed with a discount, **When** an admin deletes the promo code entirely, **Then** the historical order retains the discount code name, type, and amount applied.
3. **Given** a customer looks up their order by number, **When** they view the order details, **Then** they see a clear discount line item showing the code used and amount saved.

---

### Edge Cases

- **Stacking discounts**: What happens when a customer tries to apply multiple promo codes? Only one discount applies at a time; the most favorable to the customer wins. Automatic offers and manual codes are treated as a single pool — the best one applies.
- **Discount rounding**: What happens when a percentage discount produces a fractional amount? The discount rounds to the nearest whole minor unit (integer money per Constitution §V).
- **Zero-value discount**: What happens when a discount calculates to 0 (e.g., percentage off on a 0-subtotal)? The discount is silently ignored; no error is shown.
- **Discount larger than subtotal**: What happens when a fixed-amount discount exceeds the subtotal? The subtotal becomes 0; the total is shipping only (or 0 if free shipping also applies).
- **Concurrent usage exhaustion**: What happens when two customers apply the last remaining use of a limited promo code simultaneously? The first to complete checkout consumes the use; the second receives an "unavailable" error at payment time (handled by the existing atomic transaction).
- **Inactive code during checkout**: What happens when a promo code expires or is deactivated while a customer is mid-checkout? The next cart total recalculation or checkout validation removes the discount and informs the customer.
- **Case sensitivity**: What happens when a customer enters "SUMMER25" vs "summer25"? Codes are case-insensitive for entry but stored in canonical uppercase.
- **Duplicate application**: What happens when a customer applies the same code twice? The second application is a no-op (idempotent); the discount remains the same.
- **Discount on already-discounted products**: What happens when a product is on sale and a promo code is also applied? The promo code applies to the already-reduced subtotal (no double-dipping per product).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three discount types: percentage-off (e.g., 10% off subtotal), fixed-amount-off (e.g., 500 EGP off), and free-shipping (shipping cost becomes 0).
- **FR-002**: System MUST validate every promo code application server-side against: existence, active status, start/end date validity, minimum order amount threshold, and remaining usage limit.
- **FR-003**: System MUST compute the discounted total entirely server-side. The client MUST NOT compute, store, or transmit any discounted amount. The client only sends the promo code string; the server returns the updated totals.
- **FR-004**: System MUST apply at most one discount per order. When multiple discounts are eligible (manual code + automatic offer), the system MUST apply the single most favorable discount to the customer (largest reduction).
- **FR-005**: System MUST persist a snapshot of the applied discount in the Order record at creation time, including: promo code string, discount type, discount value (raw), discount amount applied, and currency. Changes to the promo code after order creation MUST NOT affect the order.
- **FR-006**: System MUST support automatic (codeless) cart-level offers that apply based on cart total thresholds. These offers use the same discount engine as promo codes but require no user input.
- **FR-007**: System MUST display a clear discount breakdown in cart and checkout: original subtotal, discount amount (negative), shipping cost, and final total.
- **FR-008**: System MUST allow administrators to create, edit, activate, deactivate, and view promo codes through a protected admin API. Promo code fields MUST include: code (unique, case-insensitive), type, value, minOrderAmount, maxDiscountAmount (for percentage caps), usageLimit, usageCount, startDate, endDate, active flag, and description.
- **FR-009**: System MUST increment usageCount atomically during order creation (within the existing checkout transaction). If usageLimit would be exceeded, the order creation MUST fail with a clear error.
- **FR-010**: System MUST remove an invalid or expired discount from the cart when the customer modifies their cart (adds/removes items) or proceeds to checkout, and MUST inform the customer with a clear message.
- **FR-011**: System MUST treat promo codes as case-insensitive for customer entry but store them in canonical uppercase.
- **FR-012**: System MUST round discount amounts to the nearest whole integer minor unit (no fractional currency).
- **FR-013**: System MUST prevent a discount from making the subtotal negative. The minimum subtotal after discount is 0.

### Key Entities *(include if feature involves data)*

- **PromoCode**: A reusable or limited-use discount voucher identified by a unique code string. Contains: code, type (percentage/fixed/free-shipping), value, minOrderAmount, maxDiscountAmount, usageLimit, usageCount, startDate, endDate, active, description, createdAt, updatedAt.
- **AutomaticOffer**: A codeless promotion that applies automatically when cart conditions are met. Contains the same fields as PromoCode plus automatic flag and threshold condition (e.g., subtotal >= X). May be modeled as PromoCode with a null/empty code field.
- **DiscountSnapshot**: An embedded record in Order showing what discount was applied at purchase time: code, type, value, amountApplied, currency. Immutable after order creation.
- **CartDiscountState**: Temporary cart-level state holding the currently applied discount (code + computed amount). Recalculated on every cart change. Not persisted long-term; recreated from code on each interaction.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can apply a valid promo code and see the discounted total within 1 second of entry.
- **SC-002**: Invalid promo codes (expired, exhausted, below minimum) are rejected with a clear message within 1 second, and the order total remains unchanged.
- **SC-003**: 100% of orders placed with a discount retain the exact discount amount in their snapshot, even if the underlying promo code is later modified or deleted.
- **SC-004**: An administrator can create a new promo code and have it active for customer use within 30 seconds of creation.
- **SC-005**: Concurrent checkout attempts with a single-usage promo code result in exactly one successful order; subsequent attempts receive a clear "code no longer available" message.
- **SC-006**: Discount computation is mathematically correct: for percentage discounts, amount = round(subtotal * percentage / 100); for fixed discounts, amount = min(value, subtotal); for free shipping, shipping = 0. The final total = max(0, subtotal - discount) + shipping.
- **SC-007**: When both an automatic offer and a manual promo code are eligible, the customer always receives the larger of the two discounts, never a combined/stacked discount.

## Assumptions

- Product-level discounts (e.g., "20% off specific products") are out of scope for this phase. Discounts apply to the entire cart subtotal.
- Buy-X-Get-Y (BOGO) and bundle discounts are out of scope for this phase.
- Customer-specific or segment-specific discounts (e.g., "VIP customers get 10% off") are out of scope for this phase.
- The admin interface for promo code management is API-only for this phase; a visual admin UI is deferred.
- Discounts do not affect the unit prices stored in line items. The discount is a cart/order-level adjustment.
- All monetary values continue to use integer minor units (piasters for EGP) per existing project convention.
- Promo codes do not stack with each other. This is the industry standard for e-commerce MVP and prevents abuse.
- The existing checkout atomic transaction from Phase 4 will be extended to include discount validation and usage count increment.
- Free shipping promos only apply to the currently selected shipping method; they do not change the method itself.
