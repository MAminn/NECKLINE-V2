# Data Model: Checkout & Orders

**Feature**: Checkout & Orders (Phase 4)  
**Date**: 2026-05-25

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│    User     │◄──────│      Order      │       │   Product    │
│  (existing) │  0..1 │                 │       │  (existing)  │
└─────────────┘       │  + lineItems[]  │       └──────────────┘
                      │  (embedded)     │              ▲
                      └─────────────────┘              │
                              │                        │
                              │ references             │ stock decrement
                              ▼                        │
                      ┌─────────────────┐              │
                      │PaymentTransaction│              │
                      │                 │              │
                      └─────────────────┘              │
                                                       │
                      ┌─────────────────┐              │
                      │  ShippingMethod │              │
                      │   (seeded)      │              │
                      └─────────────────┘              │
                                                       │
                      ┌─────────────────┐              │
                      │  IdempotencyKey │              │
                      │   (existing)    │              │
                      └─────────────────┘              │
                                                       │
                      ┌─────────────────┐              │
                      │  Reservation    │──────────────┘
                      │   (existing)    │   (released on order)
                      └─────────────────┘
```

---

## Order

Represents a completed purchase. Immutable after creation (except status transitions within MVP scope).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | MongoDB default |
| `orderNumber` | String | yes | Unique, indexed. Format: `NECK-{timestamp}-{random}` |
| `status` | String | yes | Enum: `['pending', 'confirmed']`. Default: `pending` |
| `userId` | ObjectId | no | Ref: `User`. Null for guest orders. Indexed. |
| `customerEmail` | String | yes | For guest order lookup. Normalized lowercase. |
| `customerName` | String | yes | Full name from checkout form |
| `customerPhone` | String | yes | E.164 format validation |
| `shippingAddress` | Object | yes | See Address subdocument below |
| `shippingMethod` | Object | yes | Snapshot: `{ name, cost, currency }` |
| `lineItems` | [OrderLineItem] | yes | Embedded snapshots. Min 1 item. |
| `subtotal` | Number | yes | Integer minor units. Sum of line item totals. |
| `shippingCost` | Number | yes | Integer minor units. From ShippingMethod snapshot. |
| `total` | Number | yes | Integer minor units. `subtotal + shippingCost`. |
| `currency` | String | yes | ISO 4217 code (e.g., `EGP`). All amounts share one currency per order. |
| `paymentStatus` | String | yes | Enum: `['pending', 'succeeded', 'failed']`. Default: `pending` |
| `paymentTransactionId` | ObjectId | no | Ref: `PaymentTransaction`. Set after successful payment. |
| `idempotencyKey` | String | no | Reference to the idempotency key used for this order creation. Canonical storage is the existing `IdempotencyKey` collection (AD-3). |
| `notes` | String | no | Optional customer notes |
| `createdAt` | Date | auto | UTC |
| `updatedAt` | Date | auto | UTC |

### Indexes

- `orderNumber`: unique
- `userId`: single (for authenticated order history)
- `customerEmail`: single (for guest order lookup)
- `createdAt`: single (for sorting, pagination)
- `idempotencyKey`: single (for reference/lookup only; canonical storage and TTL are in the existing `IdempotencyKey` collection per AD-3)

### Address Subdocument

```js
{
  street: String,      // required, trimmed
  city: String,        // required, trimmed
  governorate: String, // required, trimmed
  postalCode: String,  // required, trimmed
  country: String,     // default: "Egypt"
}
```

---

## OrderLineItem (Embedded)

Snapshot of a product at time of purchase. Immutable.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `productId` | ObjectId | yes | Ref: `Product` (for reference, not authoritative) |
| `sku` | String | yes | Product SKU at time of purchase |
| `title` | String | yes | Product title at time of purchase |
| `unitPrice` | Number | yes | Integer minor units. Price at time of purchase. |
| `currency` | String | yes | ISO 4217 code |
| `quantity` | Number | yes | Integer, min 1, max 99 |
| `lineTotal` | Number | yes | Integer minor units. `unitPrice * quantity`. |

---

## ShippingMethod (Seeded Config)

Configured server-side; not customer-managed in MVP.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `name` | String | yes | e.g., "Standard Delivery" |
| `description` | String | no | e.g., "3-5 business days" |
| `cost` | Number | yes | Integer minor units |
| `currency` | String | yes | ISO 4217 code |
| `estimatedMinDays` | Number | no | Minimum delivery estimate |
| `estimatedMaxDays` | Number | no | Maximum delivery estimate |
| `isActive` | Boolean | yes | Default: `true` |
| `sortOrder` | Number | no | Display order |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Seed data (MVP)**:
```json
{
  "name": "Standard Delivery",
  "description": "3-5 business days",
  "cost": 5000,
  "currency": "EGP",
  "estimatedMinDays": 3,
  "estimatedMaxDays": 5,
  "isActive": true,
  "sortOrder": 1
}
```

---

## PaymentTransaction

Record of every payment attempt (success or failure).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `orderId` | ObjectId | yes | Ref: `Order`. Indexed. |
| `provider` | String | yes | e.g., `stub`, `stripe` |
| `providerTransactionId` | String | no | ID returned by provider (null for stub) |
| `intentId` | String | no | Payment intent ID from `createPaymentIntent` |
| `amount` | Number | yes | Integer minor units |
| `currency` | String | yes | ISO 4217 code |
| `status` | String | yes | Enum: `['pending', 'succeeded', 'failed']` |
| `errorCode` | String | no | Provider error code if failed |
| `errorMessage` | String | no | Human-readable error if failed |
| `metadata` | Object | no | Provider-specific metadata |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

### Indexes

- `orderId`: single
- `intentId`: single (for provider callbacks)

---

## Audit Event (Existing Schema)

Reuses the audit event system from Phase 0/3.

| Event | Actor | Target | Payload |
|-------|-------|--------|---------|
| `order.created` | Customer userId or `guest` | Order._id | orderNumber, total, currency |
| `order.payment_confirmed` | Customer userId or `guest` | Order._id | paymentTransactionId, amount |
| `order.payment_failed` | Customer userId or `guest` | Order._id | errorCode, errorMessage |
| `inventory.decremented` | System | Product._id | sku, qtyBefore, qtyAfter, orderId |

---

## State Transitions

### Order Status (MVP)

```
        ┌─────────────┐
        │   pending   │ ◄── order document created, payment intent created
        └──────┬──────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
┌──────────┐      ┌──────────┐
│ confirmed│      │  failed  │  (not stored; order stays pending or is deleted)
└──────────┘      └──────────┘
   payment succeed   payment failed
```

**Note**: In MVP, `confirmed` is terminal. Future phases add `processing → shipped → delivered`.

### PaymentTransaction Status

```
        ┌───────────┐
        │  pending  │ ◄── intent created
        └─────┬─────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────┐      ┌──────────┐
│ succeeded│      │  failed  │
└──────────┘      └──────────┘
```

---

## Validation Rules

1. **Order total integrity**: `subtotal + shippingCost === total` (server-enforced, never trusted from client)
2. **Currency consistency**: all amounts in an order share the same `currency`
3. **Line item min/max**: `quantity` between 1 and 99
4. **Stock availability**: at payment time, every line item's `quantity` must be ≤ `Product.stockOnHand` (verified via optimistic locking)
5. **Email format**: valid email per RFC 5322 (Zod validation)
6. **Phone format**: optional `+` followed by 8-15 digits
7. **Address fields**: all required fields non-empty, trimmed, max 255 chars
8. **Cart non-empty**: order creation blocked if cart has 0 items
