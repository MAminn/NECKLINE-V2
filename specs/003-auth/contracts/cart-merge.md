# API Contract: Cart Merge on Authentication

**Trigger**: Login (`POST /api/v1/auth/login`) or Register (`POST /api/v1/auth/register`)
**Behavior**: Automatic, server-side

---

## Merge Algorithm

1. **Identify carts**
   - Guest cart: identified by `cartId` cookie
   - User cart: identified by `Cart.userId` (may not exist)

2. **Load both carts**
   - If no guest cart exists (no cookie or empty cart): skip merge
   - If no user cart exists: promote guest cart to user cart (set `userId`)

3. **Merge items** (when both carts exist):
   - For each item in guest cart:
     - Find matching item in user cart by `productId`
     - If found: `newQty = min(existingQty + guestQty, 99, availableStock)`
     - If not found: add as new line (respect 20 line item max)
   - If adding a new line would exceed 20 items: skip the item, log warning

4. **Update reservations**
   - Release all guest cart reservations
   - Create new reservations for merged user cart items

5. **Clean up**
   - Delete guest cart document (or keep as orphan for TTL cleanup)
   - Clear `cartId` cookie
   - Set `userId` on the surviving cart

6. **Return**
   - Auth response includes merged cart in `data.cart` (optional, client can refetch)

---

## Error Handling

- Stock exceeded during merge: qty clamped, item retained with warning state
- Line item limit exceeded: excess items skipped, warning logged
- Product no longer active: item kept in cart with "unavailable" warning
