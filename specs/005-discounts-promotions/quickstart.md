# Quickstart: Testing Discounts & Promotions

## Prerequisites

1. API server running on `localhost:4000`
2. Web app running on `localhost:3000`
3. MongoDB connection active
4. At least one product in the catalog with price and stock

## Seed Sample Promo Codes

```bash
cd apps/api
node scripts/seedPromoCodes.js
```

This creates:
- `SAVE10` — 10% off, no minimum, unlimited uses
- `SAVE500` — 500 EGP off, minimum order 2000 EGP, unlimited uses
- `FREESHIP` — Free shipping, minimum order 3000 EGP, unlimited uses
- Auto offer: "Summer Sale" — 15% off orders over 8000 EGP (automatic, no code)

## Test Scenarios

### 1. Apply valid promo code

```bash
curl -X POST http://localhost:4000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId": "<PRODUCT_ID>", "quantity": 2}' \
  -c cookies.txt

curl -X POST http://localhost:4000/api/v1/cart/apply-promo \
  -H "Content-Type: application/json" \
  -d '{"code": "SAVE10"}' \
  -b cookies.txt
```

Expected: Response includes `discount` with `amount` = 10% of subtotal, and `total` reduced accordingly.

### 2. Apply invalid promo code

```bash
curl -X POST http://localhost:4000/api/v1/cart/apply-promo \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID"}' \
  -b cookies.txt
```

Expected: 400 with `code: "PROMO_INVALID"`.

### 3. Checkout with promo code

```bash
curl -X POST http://localhost:4000/api/v1/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "<CART_ID>",
    "contact": {"name": "Test", "email": "test@example.com", "phone": "01234567890"},
    "shippingAddress": {"street": "123 St", "city": "Cairo", "governorate": "Cairo", "postalCode": "12345"},
    "promoCode": "SAVE10"
  }' \
  -b cookies.txt
```

Expected: `orderPreview.total` reflects the discount.

### 4. Complete order and verify snapshot

Use the checkout token from step 3:

```bash
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-order-1" \
  -d '{"checkoutToken": "<TOKEN>"}' \
  -b cookies.txt
```

Expected: Order response includes `discount` snapshot. Verify in MongoDB:

```bash
db.orders.findOne({orderNumber: "NECK-..."}).discount
```

### 5. Test automatic offer

Add items to cart totaling > 8000 EGP. Do NOT apply any code.

```bash
curl http://localhost:4000/api/v1/cart -b cookies.txt
```

Expected: `discount` is automatically populated with the "Summer Sale" offer.

### 6. Test admin creation

```bash
curl -X POST http://localhost:4000/api/v1/admin/promo-codes \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<ADMIN_TOKEN>" \
  -d '{
    "code": "FLASH50",
    "type": "percentage",
    "value": 50,
    "usageLimit": 10,
    "active": true,
    "description": "Flash sale"
  }'
```

Expected: 201 with created promo code.

### 7. Test concurrent usage exhaustion

Create a code with `usageLimit: 1`. Run two simultaneous checkouts:

```bash
# Terminal 1 & 2 simultaneously:
curl -X POST http://localhost:4000/api/v1/orders ...
```

Expected: Exactly one succeeds; the other returns `PROMO_EXHAUSTED`.
