# Cart API Contract Changes

## GET /api/v1/cart

**Response additions**:

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

- `discount` is `null` if no code is applied or the applied code is invalid/expired
- `shipping` is the default shipping method cost
- `total` = max(0, subtotal - discount) + shipping

---

## POST /api/v1/cart/items
## PATCH /api/v1/cart/items/:productId
## DELETE /api/v1/cart/items/:productId
## POST /api/v1/cart/clear

**Behavior change**: After modifying cart items, if `appliedPromoCode` is set, the discount is recomputed. If the code is no longer valid (e.g., subtotal fell below minimum), `discount` is set to `null` in the response and the code is cleared from the cart.

**Response shape**: Same as GET /cart above.

---

## POST /api/v1/cart/apply-promo (NEW)

Apply a promo code to the current cart.

**Request**:

```json
{
  "code": "SUMMER25"
}
```

**Success Response (200)**:

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

**Error Response (400)**:

```json
{
  "error": true,
  "code": "PROMO_INVALID",
  "message": "This promo code has expired"
}
```

Error codes:
- `PROMO_INVALID` — code does not exist or is inactive
- `PROMO_EXPIRED` — code has expired
- `PROMO_EXHAUSTED` — usage limit reached
- `PROMO_MIN_ORDER` — subtotal below minimum order amount
- `PROMO_CURRENCY_MISMATCH` — promo code currency does not match cart currency

---

## DELETE /api/v1/cart/promo (NEW)

Remove the applied promo code from the cart.

**Request**: None (uses current cart)

**Success Response (200)**:

```json
{
  "cartId": "...",
  "items": [...],
  "itemCount": 2,
  "subtotal": { "amount": 100000, "currency": "EGP" },
  "discount": null,
  "shipping": { "amount": 5000, "currency": "EGP" },
  "total": { "amount": 105000, "currency": "EGP" }
}
```
