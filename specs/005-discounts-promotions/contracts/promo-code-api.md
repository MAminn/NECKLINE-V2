# Promo Code Public API

## GET /api/v1/promo-codes/:code/validate

Validate a promo code without applying it. Used for real-time UI feedback as the customer types.

**Parameters**:
- `code` (path): Promo code string (case-insensitive)

**Query parameters**:
- `subtotal` (optional): Current cart subtotal in minor units. If provided, minimum order amount is checked.
- `currency` (optional): Cart currency code. If provided, currency compatibility is checked.

**Success Response (200)** — valid code:

```json
{
  "valid": true,
  "code": "SUMMER25",
  "type": "percentage",
  "value": 25,
  "description": "Summer sale 25% off"
}
```

**Success Response (200)** — invalid code:

```json
{
  "valid": false,
  "code": "SUMMER25",
  "error": "PROMO_EXPIRED",
  "message": "This promo code has expired"
}
```

**Rate limiting**: 30 requests per minute per IP (generous for typing feedback).
