# Checkout API Contract Changes

## POST /api/v1/checkout

**Request body additions**:

```json
{
  "cartId": "...",
  "contact": { "name": "...", "email": "...", "phone": "..." },
  "shippingAddress": { "street": "...", "city": "...", "governorate": "...", "postalCode": "..." },
  "promoCode": "SUMMER25"
}
```

- `promoCode` is optional. If omitted, automatic offers are still evaluated.

**Response additions**:

```json
{
  "checkoutToken": "cko_...",
  "orderPreview": {
    "lineItems": [...],
    "subtotal": 100000,
    "discount": {
      "code": "SUMMER25",
      "type": "percentage",
      "value": 25,
      "amount": 25000,
      "currency": "EGP"
    },
    "shipping": {
      "method": "Standard Delivery",
      "cost": 5000,
      "currency": "EGP"
    },
    "total": 80000,
    "currency": "EGP"
  }
}
```

- `discount` is `null` if no discount applies
- The server validates `promoCode` and falls back to best automatic offer if the code is invalid
- If the code is invalid, the response still succeeds but `discount` is `null`; the client may show a warning

---

## POST /api/v1/orders

**Behavior change**: The order creation endpoint re-validates the promo code (from checkout session) atomically within the transaction. If the code has become invalid since checkout session creation (expired, exhausted, or cart changed), the transaction aborts with error code `PROMO_INVALID`.

**Error Response additions (409)**:

```json
{
  "error": true,
  "code": "PROMO_INVALID",
  "message": "This promo code is no longer available"
}
```

**Order response additions**:

```json
{
  "orderNumber": "NECK-...",
  "status": "confirmed",
  "discount": {
    "code": "SUMMER25",
    "type": "percentage",
    "value": 25,
    "amountApplied": 25000,
    "currency": "EGP"
  },
  "subtotal": 100000,
  "shippingCost": 5000,
  "total": 80000,
  "currency": "EGP",
  ...
}
```

---

## GET /api/v1/orders/:orderNumber
## GET /api/v1/orders

**Response additions**: Both endpoints now include the `discount` snapshot field in the order object (same shape as above).
