# Quickstart: Checkout & Orders

**Feature**: Phase 4 — Checkout & Orders  
**Date**: 2026-05-25

---

## Prerequisites

- Phase 0–3 complete (MongoDB, API, web app, auth, cart, products)
- `.env` configured with `CHECKOUT_ENABLED=true`
- MongoDB connection active

## Local Development Flow

### 1. Seed the shipping method

```bash
cd apps/api
npm run seed:shipping
```

Or manually insert:
```json
{
  "name": "Standard Delivery",
  "description": "3-5 business days",
  "cost": 5000,
  "currency": "EGP",
  "estimatedMinDays": 3,
  "estimatedMaxDays": 5,
  "isActive": true
}
```

### 2. Add products to cart

Use the storefront or API to add items to a guest or authenticated cart.

### 3. Start checkout

**Guest checkout**:
```bash
curl -X POST http://localhost:4000/api/v1/checkout \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "cartId": "your-cart-id",
    "contact": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+201001234567"
    },
    "shippingAddress": {
      "street": "123 Tahrir St",
      "city": "Cairo",
      "governorate": "Cairo",
      "postalCode": "11511"
    }
  }'
```

**Authenticated checkout**: Same request, but include the `access_token` cookie (or skip `cartId` to use the user's linked cart).

### 4. Confirm payment

```bash
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: same-key-as-above" \
  -b "access_token=..." \
  -d '{
    "checkoutToken": "cko_...",
    "paymentMethod": "stub"
  }'
```

### 5. Verify order

```bash
curl "http://localhost:4000/api/v1/orders/NECK-XXXXXX?email=test@example.com"
```

### 6. Check inventory

```bash
curl http://localhost:4000/api/v1/products/{product-id}
```

Verify `stockOnHand` decremented by the purchased quantity.

---

## Testing Payment Failure

Use the deterministic test hook:

```bash
# In checkout request, use an email in STUB_PAYMENT_DECLINE_EMAILS
# Or manually create a stub intent ID ending in _fail for testing
```

Or set `STUB_PAYMENT_FAILURE_RATE=0.5` for random failures.

---

## Feature Flag

Disable checkout without redeploying:

```bash
# .env
CHECKOUT_ENABLED=false
```

When disabled:
- `POST /checkout` returns `503`
- Frontend hides checkout button

---

## Running Tests

```bash
# Backend unit tests
cd apps/api && npm test -- orderService checkoutService

# Backend integration tests
cd apps/api && npm test -- checkout.integration

# Frontend component tests
cd apps/web && npm test -- CheckoutForm
```
