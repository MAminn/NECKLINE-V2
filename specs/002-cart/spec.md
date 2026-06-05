# Feature Specification: Guest Shopping Cart

**Feature Branch**: `002-cart`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "A guest can add products to a cart, change quantities, remove items, and see a running subtotal. Cart survives refresh."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add to Cart (Priority: P1)

A guest browsing the product catalog adds one or more products to their cart. The cart is immediately updated with the selected product, quantity, and a running subtotal. The guest sees visual confirmation that the item was added.

**Why this priority**: This is the core cart interaction — without it, no downstream checkout is possible.

**Independent Test**: Can be fully tested by opening a product detail page, clicking "Add to Cart", and seeing the cart reflect the item with correct quantity and subtotal.

**Acceptance Scenarios**:

1. **Given** a guest views a product with stock available, **When** they click "Add to Cart" with quantity 1, **Then** the cart contains that product with quantity 1 and the subtotal equals the product price.
2. **Given** a guest has a product in their cart, **When** they add the same product again, **Then** the quantity increments and the subtotal updates accordingly.
3. **Given** a guest views an out-of-stock product, **When** they attempt to add it to cart, **Then** the action is blocked and the guest sees a clear message.
4. **Given** a guest adds a product to cart, **When** a reservation expires for that product, **Then** the cart still shows the item but the checkout path validates availability fresh.

---

### User Story 2 — Manage Cart Contents (Priority: P1)

A guest views their cart and modifies it — changing quantities, removing items, or clearing the cart entirely. All changes reflect immediately in the subtotal.

**Why this priority**: Guests routinely change their minds before checkout; a cart they cannot edit is unusable.

**Independent Test**: Can be fully tested by opening the cart page, changing a quantity, removing an item, and verifying the subtotal recalculates correctly.

**Acceptance Scenarios**:

1. **Given** a guest has 2 units of a product in cart, **When** they change quantity to 3, **Then** the cart updates to 3 units and the subtotal recalculates.
2. **Given** a guest has items in cart, **When** they click the remove button on one item, **Then** that item disappears and the subtotal recalculates.
3. **Given** a guest has items in cart, **When** they click "Clear Cart", **Then** all items are removed and the subtotal is zero.
4. **Given** a guest tries to set quantity to 0, **When** they confirm or blur, **Then** the item is removed from cart (equivalent to delete).
5. **Given** a guest tries to set quantity higher than available stock, **When** they attempt the change, **Then** the quantity is clamped to available stock and a message explains why.

---

### User Story 3 — Cart Persistence & Recovery (Priority: P2)

A guest's cart survives page refreshes and browser restarts. When they return later, their cart is restored with the same items and quantities.

**Why this priority**: Cart abandonment drops significantly when carts persist. This is a conversion-critical feature but does not block basic add/manage flows.

**Independent Test**: Can be fully tested by adding items to cart, refreshing the page, and confirming the cart restores.

**Acceptance Scenarios**:

1. **Given** a guest has items in their cart, **When** they refresh the browser page, **Then** the cart restores with identical items and quantities.
2. **Given** a guest's cart has been idle beyond the reservation TTL, **When** they return to the site, **Then** the cart still displays the items with a "Stock not reserved" warning; the guest can click "Refresh Availability" to revalidate stock and create new reservations.
3. **Given** a guest's cart contains a product that has since gone out of stock, **When** they view their cart, **Then** the item is marked as unavailable and cannot proceed to checkout.

---

### Edge Cases

- **Concurrent add-to-cart**: Two guests attempt to purchase the last unit simultaneously — one succeeds, the other is blocked by availability guard.
- **Concurrent cart updates from same guest**: Multiple tabs updating the same cart line — atomic MongoDB operators (`$inc`/`$pull`) ensure correct final state without overwriting.
- **Product deleted/inactivated while in cart**: Cart displays the item with an "unavailable" marker; it cannot be purchased.
- **Price changed while in cart**: Cart line items retain the snapshot price from time of add. The subtotal uses these stored prices. Price changes only affect new additions; checkout (Phase 4) will revalidate and snapshot prices are captured in the order.
- **Reservation expiry during session**: Cart UI shows items with a "Stock not reserved" warning. The guest can click "Refresh Availability" to revalidate stock and create new reservations.
- **Maximum quantity enforcement**: Each line item has a reasonable upper bound (e.g., 99 units per product) to prevent abuse.
- **Empty cart state**: Cart page shows a friendly empty-state message with a link back to the catalog.
- **Cart ID collision**: Server generates sufficiently random cart IDs to prevent guessing.

## Clarifications

### Session 2026-05-25

- **Q**: If a product's price changes while it's in the cart, should the cart reflect the original price or the new price? → **A**: Snapshot price locked (Option A). Items in cart keep their original price at time of add; price changes only affect future additions. The server computes subtotal from stored snapshot prices — prices are never accepted from the client.
- **Q**: What concurrency control should protect cart mutations when a guest has multiple tabs? → **A**: Atomic MongoDB operators only (Option B). Cart mutations use `$inc`, `$pull`, and `$set` on embedded line items; no version field is needed on the Cart document.
- **Q**: What guardrails should protect against cart abuse (unbounded line items, endpoint hammering)? → **A**: Maximum of 20 line items per cart and 50 cart mutations per minute per cart ID (Option A).
- **Q**: How should reservation documents be structured relative to cart line items? → **A**: One reservation document per (cart, product) pair, updated in place (Option A). The idempotency key belongs to the add-to-cart API request layer, not the reservation document. Availability queries sum `qty` across reservations per product.
- **Q**: How should the cart page handle items whose reservations have expired? → **A**: Warn + manual re-reserve (Option B). Items remain in cart with a warning badge; the guest clicks "Refresh Availability" to validate stock and create new reservations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow guests to add products to a cart without logging in.
- **FR-002**: The system MUST persist cart data so it survives page refresh and browser restart.
- **FR-003**: The system MUST support updating the quantity of any line item in the cart.
- **FR-004**: The system MUST support removing individual line items from the cart.
- **FR-005**: The system MUST support clearing the entire cart in one action.
- **FR-006**: The system MUST compute and display a running cart subtotal from the stored snapshot prices in each cart line item, calculated server-side. Prices are never accepted from the client.
- **FR-007**: The system MUST validate that requested quantities do not exceed available stock at every add/update operation.
- **FR-008**: The system MUST block adding out-of-stock or inactive products to the cart.
- **FR-009**: The system MUST create a time-bound reservation (default 15 minutes, configurable) when a product is added to cart, reducing effective availability.
- **FR-010**: The system MUST revalidate cart contents (stock + product status) when the cart is viewed after a reservation has expired.
- **FR-011**: The system MUST generate and assign a unique, unguessable cart ID for each guest.
- **FR-012**: The cart line item MUST store the product ID, quantity, unit price (at time of add), and currency — prices are never accepted from the client.
- **FR-013**: The system MUST remove the reservation when a line item is removed or its quantity is decreased.
- **FR-014**: The reservation endpoint MUST be idempotent — re-adding the same product with the same idempotency key extends the existing reservation rather than creating a duplicate.
- **FR-015**: The system MUST expose a cart summary (item count + subtotal) that can be displayed in the site header.
- **FR-016**: Cart quantity updates and removals MUST use atomic database operations to prevent race conditions during concurrent access.
- **FR-017**: The system MUST reject adding a product to cart if the cart already contains 20 line items.
- **FR-018**: Cart mutation endpoints MUST be rate-limited to 50 requests per minute per cart ID.

### Key Entities

- **Cart**: Represents a guest's shopping cart. Key attributes: unique cart ID, list of line items, created/updated timestamps, expiration.
- **CartLineItem**: A single product within a cart. Key attributes: product reference, quantity, unit price (snapshot), currency.
- **Reservation**: A temporary stock hold associated with a cart. One document per (cart, product) pair. Key attributes: cart ID, product ID, quantity, expiry timestamp. The idempotency key is handled at the API request layer, not stored in the reservation document.
- **Product** (existing): Referenced by cart line items for name, image, and current stock/price validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A guest can add a product to cart in under 2 seconds from the product detail page.
- **SC-002**: Cart contents persist across page refresh and browser restart for at least 24 hours.
- **SC-003**: 100% of add-to-cart requests that exceed available stock are blocked server-side with a clear error message.
- **SC-004**: The subtotal displayed in the cart always matches the server-computed value — no client-side price tampering is possible.
- **SC-005**: Reservation expiry auto-releases stock without manual intervention; availability recovers within 60 seconds of TTL expiry.
- **SC-006**: Concurrent add-to-cart requests for the last unit never result in overselling — at most one succeeds.

## Assumptions

- Cart persistence uses a server-side cart document referenced by a cookie-stored cart ID. LocalStorage may be used as a client-side cache for instant UI updates, but the server cart is the source of truth.
- Guest checkout remains available; account merging of carts is a Phase 3 concern.
- Cart subtotal is the sum of (quantity × unit price) for all line items. Shipping, taxes, and discounts are Phase 4+ concerns.
- A maximum of 20 line items per cart and 99 units per product per line item prevents abuse.
- Cart mutation endpoints are rate-limited to 50 requests per minute per cart ID.
- Cart documents are stored in MongoDB with a TTL index for automatic cleanup of stale carts.
- The reservation TTL (15 minutes) and cart TTL (7 days) are configurable via environment variables.
