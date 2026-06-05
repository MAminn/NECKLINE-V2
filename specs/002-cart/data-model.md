# Data Model: Guest Shopping Cart

## Entities

### Cart

Represents a guest's shopping cart. One document per guest session.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | PK | Auto-generated |
| `items` | [CartLineItem] | Max 20 elements | Embedded array |
| `createdAt` | Date | Required | Auto, also drives TTL |
| `updatedAt` | Date | Required | Auto |

**Indexes**:
- `{ updatedAt: 1 }` with `expireAfterSeconds: 604800` (7 days) — TTL cleanup of stale carts

**Validation**:
- `items.length <= 20` enforced at application layer

---

### CartLineItem (Embedded)

A single product line within a cart.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `productId` | ObjectId | Required, ref Product | Denormalized from Product |
| `name` | String | Required | Product name at time of add |
| `sku` | String | Required | SKU at time of add |
| `image` | String | Optional | Primary image URL at time of add |
| `quantity` | Number | Required, min 1, max 99 | Integer |
| `unitPrice` | Money | Required | `{ amount: Number, currency: String }` — snapshot at add time |
| `addedAt` | Date | Required | When first added |

**Uniqueness**: One line item per `productId` within a cart. Duplicate adds increment `quantity`.

---

### Reservation

Temporary stock hold. One document per `(cartId, productId)`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `cartId` | ObjectId | Required, ref Cart | |
| `productId` | ObjectId | Required, ref Product | |
| `quantity` | Number | Required, min 1 | Integer |
| `expiresAt` | Date | Required | TTL auto-deletion |

**Indexes**:
- `{ cartId: 1, productId: 1 }` — Unique. Prevents duplicate reservations for same (cart, product).
- `{ productId: 1 }` — Supports availability aggregation.
- `{ expiresAt: 1 }` — TTL index for automatic expiry.

---

### Product (Existing — Phase 1)

Referenced by cart line items and reservations.

| Field | Type | Relevance to Cart |
|-------|------|-------------------|
| `_id` | ObjectId | Referenced by `productId` |
| `name` | String | Denormalized into CartLineItem |
| `sku` | String | Denormalized into CartLineItem |
| `images` | [String] | First image denormalized into CartLineItem |
| `price` | Money | Used to populate snapshot at add time |
| `stockOnHand` | Number | Source of truth for availability |
| `isActive` | Boolean | Must be true to add to cart |
| `deletedAt` | Date | Must be null to add to cart |

---

## Relationships

```
Cart 1--* CartLineItem (embedded)
Cart 1--* Reservation
Reservation *--1 Product
CartLineItem *--1 Product (reference)
```

## State Transitions

### Cart Lifecycle

```
[Created] --(first add-to-cart)--> [Active]
[Active] --(all items removed)--> [Empty]
[Empty] --(new add-to-cart)--> [Active]
[Active] --(7 days idle)--> [Deleted by TTL]
[Deleted by TTL] --(reservations)--> [Auto-expired by TTL]
```

### Reservation Lifecycle

```
[Created] --(qty increase)--> [Updated + expiry extended]
[Created] --(qty decrease)--> [Updated + expiry extended]
[Created] --(item removed)--> [Deleted]
[Created] --(15 min idle)--> [Deleted by TTL]
[Deleted by TTL] --(cart still active)--> [Can be re-created via Refresh Availability]
```

## Availability Query

```js
// Effective available stock for a product
const reserved = await Reservation.aggregate([
  { $match: { productId, expiresAt: { $gt: new Date() } } },
  { $group: { _id: null, total: { $sum: '$quantity' } } }
]);
const available = product.stockOnHand - (reserved[0]?.total || 0);
```

When checking for a specific cart's add/update:
```js
const otherReserved = await Reservation.aggregate([
  { $match: { productId, cartId: { $ne: thisCartId } } },
  { $group: { _id: null, total: { $sum: '$quantity' } } }
]);
const available = product.stockOnHand - (otherReserved[0]?.total || 0);
```
