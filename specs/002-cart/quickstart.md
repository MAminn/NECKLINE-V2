# Quickstart: Cart Integration Tests

## Prerequisites

- API running on `localhost:4000`
- MongoDB connected with seeded products
- Web running on `localhost:3000`

## Manual Test Scenarios

### Scenario 1: Add to Cart

1. Open product detail page for an in-stock product
2. Click "Add to Cart"
3. Verify cart drawer opens with the product
4. Verify header cart badge shows "1"
5. Refresh page — verify cart persists

### Scenario 2: Quantity Update

1. Add product to cart
2. Open cart drawer
3. Increase quantity to 3
4. Verify subtotal updates to `3 × unitPrice`
5. Verify reservation TTL resets

### Scenario 3: Stock Guard

1. Note a product with stock = 2
2. Add 2 to cart in Tab A
3. In Tab B, attempt to add 1 more of same product
4. Verify error: "Only 0 units available"

### Scenario 4: Reservation Expiry

1. Add product to cart
2. Wait 15 minutes (or temporarily lower TTL in dev)
3. Refresh page
4. Verify item shows "Stock not reserved" warning
5. Click "Refresh Availability"
6. Verify reservation is recreated

### Scenario 5: Cart Abuse

1. Add 20 different products to cart
2. Attempt to add a 21st product
3. Verify error: "Cart can hold at most 20 items"

### Scenario 6: Concurrent Update

1. Open cart in two tabs
2. In Tab A, change quantity of item X to 5
3. In Tab B, remove item X
4. Refresh both tabs — verify cart is consistent (item X removed)

## API Test Commands (curl)

```bash
# Create cart and add item
export PRODUCT_ID="..."
curl -X POST http://localhost:4000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-001" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}" \
  -c cookies.txt

# Get cart
curl http://localhost:4000/api/v1/cart -b cookies.txt

# Update quantity
curl -X PATCH http://localhost:4000/api/v1/cart/items/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"quantity":3}'

# Remove item
curl -X DELETE http://localhost:4000/api/v1/cart/items/$PRODUCT_ID \
  -b cookies.txt

# Refresh availability
curl -X POST http://localhost:4000/api/v1/cart/refresh -b cookies.txt

# Clear cart
curl -X DELETE http://localhost:4000/api/v1/cart -b cookies.txt
```
