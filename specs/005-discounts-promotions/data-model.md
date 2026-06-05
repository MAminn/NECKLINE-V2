# Data Model: Discounts & Promotions

## PromoCode

A single reusable or limited-use discount. Can be a manual code (entered by customer) or an automatic offer (applied when cart conditions are met).

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `code` | String | No | `unique: true, sparse: true, uppercase: true` | Null for automatic offers. Stored uppercase. |
| `type` | String | Yes | `enum: ['percentage', 'fixed', 'free_shipping']` | Determines how `value` is interpreted |
| `value` | Number | Yes | `min: 0` | Percentage (e.g., 10 = 10%) or fixed amount in minor units |
| `minOrderAmount` | Number | No | `min: 0, default: 0` | Minimum subtotal in minor units to qualify |
| `maxDiscountAmount` | Number | No | `min: 0, default: null` | Cap for percentage discounts (minor units) |
| `usageLimit` | Number | No | `min: 1, default: null` | Max total uses. Null = unlimited |
| `usageCount` | Number | No | `min: 0, default: 0` | Current uses. Atomically incremented |
| `startDate` | Date | No | `default: null` | When code becomes valid |
| `endDate` | Date | No | `default: null` | When code expires |
| `active` | Boolean | No | `default: true` | Soft-disable without deletion |
| `isAutomatic` | Boolean | No | `default: false` | True = applies automatically based on cart conditions |
| `description` | String | No | `trim: true` | Internal/admin description |
| `createdAt` | Date | Auto | — | Mongoose timestamps |
| `updatedAt` | Date | Auto | — | Mongoose timestamps |

### Indexes

- `{ code: 1 }` — sparse unique index for code lookups
- `{ isAutomatic: 1, active: 1, startDate: 1, endDate: 1 }` — query active automatic offers
- `{ active: 1, startDate: 1, endDate: 1 }` — query all active codes

### Validation Rules

- `type: 'free_shipping'` → `value` is ignored (should be 0)
- `type: 'percentage'` → `value` is 0–100
- `type: 'fixed'` → `value` is amount in minor units
- If `code` is provided, it must be non-empty and unique
- If `isAutomatic: true`, `code` should be null
- `endDate` must be after `startDate` if both provided

---

## Order (modifications)

Add embedded `discount` subdocument to existing Order schema:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `discount.code` | String | No | The promo code used, or null for automatic offer |
| `discount.type` | String | No | `enum: ['percentage', 'fixed', 'free_shipping']` |
| `discount.value` | Number | No | Raw value (e.g., 10 for 10%, or 50000 for 500 EGP) |
| `discount.amountApplied` | Number | No | Actual discount amount in minor units |
| `discount.currency` | String | No | ISO 4217 code |

### Computed Totals with Discount

```
discountAmount = discount.amountApplied || 0
finalSubtotal = max(0, subtotal - discountAmount)   // subtotal after discount
finalTotal = finalSubtotal + shippingCost            // shippingCost may be 0 for free shipping
```

**Note**: `total` field on Order continues to represent the final amount charged. The original `subtotal` and `shippingCost` are preserved unchanged; `discount.amountApplied` records the reduction.

---

## Cart (modifications)

Add field to existing Cart schema:

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `appliedPromoCode` | String | No | `null` | The code string entered by customer. Uppercase. |

### API Response Shape

The `formatCartResponse` function returns these additional fields:

```json
{
  "cartId": "...",
  "items": [...],
  "itemCount": 2,
  "subtotal": { "amount": 100000, "currency": "EGP" },
  "discount": {
    "code": "SUMMER25",
    "type": "percentage",
    "value": 25,
    "amount": 25000,
    "currency": "EGP"
  },
  "shipping": { "amount": 5000, "currency": "EGP" },
  "total": { "amount": 80000, "currency": "EGP" }
}
```

- `discount` is null if no code applied or code is invalid
- `shipping` is computed from default shipping method (existing behavior)
- `total` = max(0, subtotal - discount) + shipping

---

## Entity Relationships

```
Cart --(appliedPromoCode)--> PromoCode
Order --(discount snapshot)--> [immutable copy of discount state]
CheckoutSession --(promoCode)--> PromoCode
```

- **No direct reference** from Order to PromoCode (snapshot only)
- Cart references PromoCode by code string (transient, recomputed on read)
