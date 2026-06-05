# Checkout API Contract

**Version**: v1  
**Base Path**: `/api/v1`  
**Date**: 2026-05-25

---

## Authentication

- `GET /shipping-methods` — public
- `POST /checkout` — optional auth (`maybeAuthenticate`); guest carts supported
- `POST /orders` — optional auth; requires `Idempotency-Key` header
- `GET /orders/:orderNumber` — public (guest lookup by orderNumber + email query param)
- `GET /orders` — requires authentication (customer order history)
- All authenticated endpoints use `access_token` httpOnly cookie from Phase 3.

---

## Endpoints

### GET /shipping-methods

Returns the active shipping method for MVP.

**Response 200**:
```json
{
  "methods": [
    {
      "id": "...",
      "name": "Standard Delivery",
      "description": "3-5 business days",
      "cost": 5000,
      "currency": "EGP",
      "estimatedMinDays": 3,
      "estimatedMaxDays": 5
    }
  ]
}
```

---

### POST /checkout

Validates checkout readiness: checks cart non-empty, stock availability, and returns a checkout session token + order preview.

**Headers**:
- `Content-Type: application/json`
- `Idempotency-Key: <uuid>` (required)

**Request Body**:
```json
{
  "cartId": "guest-cart-id-or-null",
  "contact": {
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "phone": "+201001234567"
  },
  "shippingAddress": {
    "street": "123 Tahrir St",
    "city": "Cairo",
    "governorate": "Cairo",
    "postalCode": "11511"
  }
}
```

**Response 200**:
```json
{
  "checkoutToken": "cko_...",
  "orderPreview": {
    "lineItems": [
      {
        "sku": "NECK-RED-30",
        "title": "RED CHAPTER — 30g",
        "unitPrice": 45000,
        "currency": "EGP",
        "quantity": 2,
        "lineTotal": 90000
      }
    ],
    "subtotal": 90000,
    "shipping": {
      "method": "Standard Delivery",
      "cost": 5000,
      "currency": "EGP"
    },
    "total": 95000,
    "currency": "EGP"
  }
}
```

**Response 400** — Validation error (invalid email, phone, missing field)
**Response 409** — Stock unavailable for one or more items
**Response 503** — Checkout feature flag disabled

---

### POST /orders

Creates an order and processes payment. This is the atomic commit endpoint.

**Headers**:
- `Content-Type: application/json`
- `Idempotency-Key: <uuid>` (required)

**Request Body**:
```json
{
  "checkoutToken": "cko_...",
  "paymentMethod": "stub"
}
```

**Response 201** — Order created and payment succeeded:
```json
{
  "order": {
    "orderNumber": "NECK-1716640000-a3f9",
    "status": "confirmed",
    "customerEmail": "ahmed@example.com",
    "customerName": "Ahmed Mohamed",
    "shippingAddress": { ... },
    "lineItems": [ ... ],
    "subtotal": 90000,
    "shippingCost": 5000,
    "total": 95000,
    "currency": "EGP",
    "paymentStatus": "succeeded",
    "createdAt": "2026-05-25T10:00:00.000Z"
  }
}
```

**Response 200** — Idempotent retry (same `Idempotency-Key`):
Returns the original order without creating a duplicate.

**Response 402** — Payment failed:
```json
{
  "message": "Payment declined",
  "errorCode": "stub_decline",
  "checkoutToken": "cko_..."  // preserved for retry
}
```

**Response 409** — Stock unavailable (race condition during payment)
**Response 503** — Checkout feature flag disabled

---

### GET /orders/:orderNumber

Retrieves an order by order number. For guest orders, requires `email` query param for verification.

**Query Params**:
- `email` (required for guest orders): the email used at checkout

**Response 200**:
```json
{
  "order": {
    "orderNumber": "NECK-1716640000-a3f9",
    "status": "confirmed",
    "customerName": "Ahmed Mohamed",
    "customerEmail": "ahmed@example.com",
    "shippingAddress": { ... },
    "shippingMethod": { "name": "Standard Delivery", "cost": 5000, "currency": "EGP" },
    "lineItems": [ ... ],
    "subtotal": 90000,
    "shippingCost": 5000,
    "total": 95000,
    "currency": "EGP",
    "paymentStatus": "succeeded",
    "createdAt": "2026-05-25T10:00:00.000Z"
  }
}
```

**Response 404** — Order not found or email mismatch (generic message for both to prevent enumeration)

---

### GET /orders

List authenticated user's orders. Requires login.

**Query Params**:
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `status` (optional): filter by status

**Response 200**:
```json
{
  "orders": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Response 401** — Not authenticated

---

## Error Response Format

All error responses follow the standard API error envelope:

```json
{
  "message": "Human-readable description",
  "code": "ERROR_CODE",
  "details": {}  // optional, field-level errors for 400s
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /checkout` | 10 requests / minute per IP |
| `POST /orders` | 5 requests / minute per IP |
| `GET /orders/:orderNumber` | 30 requests / minute per IP |
