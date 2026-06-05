# API Contracts: Cart

**Base Path**: `/api/v1/cart`

All cart endpoints require the `cartId` cookie. If absent on a mutation endpoint, a new cart is created and the cookie is set in the response.

---

## GET /api/v1/cart

Retrieve the current guest cart with line items, subtotal, and availability status.

### Request

- **Headers**: `Cookie: cartId=<cartId>`
- **Body**: None

### Response 200

```json
{
  "cartId": "string",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "sku": "string",
      "image": "string",
      "quantity": 1,
      "unitPrice": { "amount": 10000, "currency": "EGP" },
      "lineTotal": { "amount": 10000, "currency": "EGP" },
      "available": true,
      "reserved": true
    }
  ],
  "itemCount": 1,
  "subtotal": { "amount": 10000, "currency": "EGP" }
}
```

### Response 404

Cart not found (invalid or expired cartId cookie).

```json
{ "message": "Cart not found" }
```

---

## POST /api/v1/cart/items

Add a product to the cart. Creates a new cart if `cartId` cookie is absent.

### Request

- **Headers**:
  - `Content-Type: application/json`
  - `Cookie: cartId=<cartId>` (optional)
  - `Idempotency-Key: <key>` (optional, recommended for add-to-cart)
- **Body**:

```json
{
  "productId": "string",
  "quantity": 1
}
```

### Response 200 — Item added

Returns the updated cart (same shape as GET).

### Response 400 — Validation error

```json
{ "message": "Quantity must be between 1 and 99" }
```

### Response 409 — Insufficient stock

```json
{ "message": "Only 3 units available" }
```

### Response 422 — Cart full

```json
{ "message": "Cart can hold at most 20 items" }
```

---

## PATCH /api/v1/cart/items/:productId

Update the quantity of a cart line item.

### Request

- **Headers**:
  - `Content-Type: application/json`
  - `Cookie: cartId=<cartId>`
- **Body**:

```json
{
  "quantity": 3
}
```

### Response 200

Returns the updated cart.

### Response 400

```json
{ "message": "Quantity must be between 1 and 99" }
```

### Response 409

```json
{ "message": "Only 5 units available" }
```

### Response 404

Line item or cart not found.

---

## DELETE /api/v1/cart/items/:productId

Remove a product from the cart.

### Request

- **Headers**: `Cookie: cartId=<cartId>`
- **Body**: None

### Response 200

Returns the updated cart (may be empty).

### Response 404

Cart or line item not found.

---

## DELETE /api/v1/cart

Clear all items from the cart.

### Request

- **Headers**: `Cookie: cartId=<cartId>`
- **Body**: None

### Response 200

Returns the empty cart.

### Response 404

Cart not found.

---

## POST /api/v1/cart/refresh

Revalidate availability for all cart items and re-create reservations for available items.

### Request

- **Headers**: `Cookie: cartId=<cartId>`
- **Body**: None

### Response 200

Returns the updated cart with `available` and `reserved` flags refreshed per item.

```json
{
  "cartId": "string",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "sku": "string",
      "image": "string",
      "quantity": 2,
      "unitPrice": { "amount": 10000, "currency": "EGP" },
      "lineTotal": { "amount": 20000, "currency": "EGP" },
      "available": true,
      "reserved": true
    }
  ],
  "itemCount": 2,
  "subtotal": { "amount": 20000, "currency": "EGP" }
}
```

Items that are no longer available will have `available: false` and `reserved: false`.
