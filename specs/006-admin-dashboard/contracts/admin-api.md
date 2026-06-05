# API Contracts: Admin Dashboard

All admin endpoints require an authenticated session cookie with `role: 'admin'`.  
All endpoints are prefixed `/api/v1`.  
All responses follow: `{ data, error?, message?, requestId }`.

---

## Dashboard

### GET /admin/metrics
Returns aggregated KPIs and historical data for the dashboard overview.

**Auth**: `admin:access`

**Response 200**:
```json
{
  "revenueToday": 125000,
  "totalRevenue": 4850000,
  "ordersCount": 312,
  "todayOrdersCount": 8,
  "conversionRate": 0,
  "returningRate": 0.34,
  "newCustomers": 24,
  "pendingCount": 12,
  "processingCount": 5,
  "averageOrderValue": 15545,
  "liveSessions": 0,
  "visitsHistory": [
    { "date": "2026-06-04", "visits": 142, "checkouts": 7 }
  ],
  "categoryShare": [
    { "name": "Balms & Solid Perfumes", "share": 68, "color": "#D21B27" }
  ],
  "forecast": {
    "increase": 12,
    "recommendedStock": 45,
    "topProduct": "CAIRO OUD",
    "projectedRevenue": 550000
  }
}
```

---

### GET /admin/activities
Returns the most recent 20 activity events for the live feed.

**Auth**: `admin:access`

**Response 200**:
```json
[
  {
    "id": "evt_abc123",
    "iconType": "order",
    "user": "Ahmad A.",
    "text": "New order placed",
    "sub": "ORD-00312 · 2 items · 245 EGP",
    "time": "2 min ago"
  }
]
```

---

## Products

### GET /admin/products
Paginated product list (including soft-deleted for admin view).

**Auth**: `admin:access`  
**Query params**: `page` (default 1), `limit` (default 8), `search`, `category`, `status`

**Response 200**:
```json
{
  "products": [
    {
      "id": "prod_abc",
      "name": "CAIRO OUD",
      "sku": "CAI-OUD-30",
      "category": "Balms & Solid Perfumes",
      "price": 13400,
      "currency": "EGP",
      "stockOnHand": 42,
      "status": "ACTIVE",
      "views": 1240,
      "sales": 87,
      "image": "https://...",
      "galleryImages": ["https://...", "https://...", "https://..."],
      "subtitle": "Warm • Spicy • Seductive"
    }
  ],
  "total": 24,
  "page": 1,
  "totalPages": 3,
  "kpis": {
    "total": 24,
    "active": 20,
    "outOfStock": 2,
    "totalViews": 18430
  }
}
```

**Status mapping**: `ACTIVE` = purchasable + stock > 0; `LOW STOCK` = stock 1–5; `OUT OF STOCK` = stock 0 or `purchasable: false`

---

### POST /admin/products
Create a new product.

**Auth**: `admin:access`  
**Body**:
```json
{
  "name": "CAIRO OUD",
  "sku": "CAI-OUD-30",
  "category": "Balms & Solid Perfumes",
  "price": 13400,
  "currency": "EGP",
  "stockOnHand": 42,
  "subtitle": "Warm • Spicy • Seductive",
  "description": "...",
  "images": ["https://..."],
  "purchasable": true
}
```

**Response 201**: Created product object.  
**Response 400**: Validation error.  
**Response 409**: SKU already exists.

---

### PUT /admin/products/:id
Update an existing product.

**Auth**: `admin:access`  
**Body**: Partial product fields (same shape as POST).  
**Response 200**: Updated product object.  
**Response 404**: Product not found.

---

### DELETE /admin/products/:id
Soft-delete a product (`deletedAt = now`). Does not destroy order history.

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`  
**Response 404**: Product not found.

---

## Orders

### GET /admin/orders
Paginated order list with customer info.

**Auth**: `admin:access`  
**Query params**: `page` (default 1), `limit` (default 20), `search`, `fulfillmentStatus`, `status`

**Response 200**:
```json
{
  "orders": [
    {
      "id": "ord_abc",
      "orderNumber": "ORD-00312",
      "customerName": "Sarah M.",
      "customerEmail": "sarah@example.com",
      "itemsSummary": "CAIRO OUD × 1, MIDNIGHT × 2",
      "itemCount": 3,
      "total": 24500,
      "currency": "EGP",
      "status": "confirmed",
      "fulfillmentStatus": "unfulfilled",
      "trackingNumber": null,
      "createdAt": "2026-06-05T14:32:00Z",
      "shippingAddress": { "city": "Cairo", "governorate": "Cairo" }
    }
  ],
  "total": 312,
  "page": 1,
  "totalPages": 16
}
```

---

### PUT /admin/orders/:id
Update order fulfillment status and/or tracking number.

**Auth**: `admin:access`  
**Body**:
```json
{
  "fulfillmentStatus": "shipped",
  "trackingNumber": "TRK-EGY-77610"
}
```

**Response 200**: Updated order.  
**Response 404**: Order not found.

---

### DELETE /admin/orders/:id
Hard-delete an order record (admin override, audit-logged).

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`

---

## Customers

### GET /admin/customers
Paginated customer list with aggregated order data.

**Auth**: `admin:access`  
**Query params**: `page` (default 1), `limit` (default 20), `search`

**Response 200**:
```json
{
  "customers": [
    {
      "id": "user_abc",
      "name": "Sarah M.",
      "email": "sarah@example.com",
      "role": "customer",
      "ordersCount": 4,
      "lifetimeValue": 98000,
      "currency": "EGP",
      "createdAt": "2026-04-10T09:00:00Z",
      "lastOrderAt": "2026-06-01T12:00:00Z"
    }
  ],
  "total": 148,
  "page": 1,
  "totalPages": 8,
  "kpis": {
    "total": 148,
    "newThisWeek": 12,
    "returning": 67
  }
}
```

---

### DELETE /admin/customers/:email
Delete a customer account. Audit-logged. Orders are retained.

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`  
**Response 404**: Customer not found.

---

## Offers

### GET /admin/coupons
List code-based promo codes (`isAutomatic: false`).

**Auth**: `admin:access`  
**Response 200**: `{ "coupons": [ PromoCode[] ] }`

---

### POST /admin/coupons
Create a code-based promo code.

**Auth**: `admin:access`  
**Body**:
```json
{
  "code": "SAVE10",
  "type": "percentage",
  "value": 10,
  "minOrderAmount": 5000,
  "usageLimit": 100,
  "endDate": "2026-12-31T23:59:59Z"
}
```

**Response 201**: Created PromoCode.

---

### DELETE /admin/coupons/:id
Delete a promo code.

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`

---

### GET /admin/offers
List automatic campaign offers (`isAutomatic: true`).

**Auth**: `admin:access`  
**Response 200**: `{ "offers": [ PromoCode[] ] }`

---

### POST /admin/offers
Create an automatic campaign offer.

**Auth**: `admin:access`  
**Body**:
```json
{
  "description": "Summer Discount",
  "type": "percentage",
  "value": 15,
  "minOrderAmount": 10000,
  "endDate": "2026-08-31T23:59:59Z",
  "isAutomatic": true
}
```

**Response 201**: Created PromoCode.

---

### DELETE /admin/offers/:id
Delete a campaign offer.

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`

---

## Reviews (Testimonials)

### GET /testimonials
Public — returns all active (non-deleted) testimonials for storefront display.

**Auth**: None  
**Response 200**:
```json
[
  {
    "id": "test_abc",
    "name": "Nour H.",
    "product": "CAIRO OUD",
    "rating": 5,
    "comment": "Incredible scent, lasts all day.",
    "verified": true,
    "date": "Jun 1, 2026"
  }
]
```

---

### POST /testimonials
Admin — create a testimonial.

**Auth**: `admin:access`  
**Body**:
```json
{
  "name": "Nour H.",
  "product": "CAIRO OUD",
  "rating": 5,
  "comment": "Incredible scent, lasts all day.",
  "verified": true,
  "date": "Jun 1, 2026"
}
```

**Response 201**: Created testimonial.

---

### PUT /testimonials/:id
Admin — update a testimonial.

**Auth**: `admin:access`  
**Body**: Partial testimonial fields.  
**Response 200**: Updated testimonial.

---

### DELETE /testimonials/:id
Admin — soft-delete a testimonial (`deletedAt = now`).

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`

---

## Interface Billboard — Hero Slides

### GET /header-slides
Public — returns all active slides sorted by `order`.

**Auth**: None  
**Response 200**: `[ HeaderSlide[] ]`

---

### POST /admin/header-slides
Admin — create a slide.

**Auth**: `admin:access`  
**Body**:
```json
{
  "image": "https://...",
  "title": "Wear Your Scent",
  "subtitle": "Solid Perfumes · Intense Intimacy",
  "description": "...",
  "buttonText": "Shop Now",
  "linkTo": "collection",
  "order": 1
}
```

**Response 201**: Created slide.

---

### PUT /admin/header-slides/:id
Admin — update a slide.

**Auth**: `admin:access`  
**Response 200**: Updated slide.

---

### DELETE /admin/header-slides/:id
Admin — delete a slide.

**Auth**: `admin:access`  
**Response 200**: `{ "success": true }`

---

## Interface Billboard — How to Apply

### GET /how-to-apply
Public — returns the How-to-Apply configuration.

**Auth**: None  
**Response 200**:
```json
{
  "color": "#D21B27",
  "steps": [
    { "num": "01", "title": "SWIPE", "desc": "...", "iconType": "preset", "presetName": "Fingerprint", "customIconUrl": "" }
  ]
}
```

---

### POST /admin/how-to-apply
Admin — upsert the How-to-Apply configuration.

**Auth**: `admin:access`  
**Body**: `{ "color": "#D21B27", "steps": [ ... ] }`  
**Response 200**: Updated config.

---

## File Upload (progressive enhancement)

### POST /admin/uploads
Admin — upload an image file and receive a CDN URL.

**Auth**: `admin:access`  
**Content-Type**: `multipart/form-data`  
**Body**: `file` field (image/jpeg, image/png, image/webp — max 5 MB)  
**Response 200**: `{ "url": "https://res.cloudinary.com/..." }`  
**Response 400**: File too large or invalid type.

---

## Settings

### GET /admin/activity-log
Paginated audit event trail.

**Auth**: `admin:access`  
**Query params**: `page` (default 1), `limit` (default 50)

**Response 200**:
```json
{
  "events": [
    {
      "id": "audit_abc",
      "actor": "admin@neckline.com",
      "action": "product.updated",
      "target": "prod_abc",
      "targetType": "Product",
      "before": { "stockOnHand": 42 },
      "after": { "stockOnHand": 35 },
      "timestamp": "2026-06-05T14:32:00Z",
      "requestId": "req_xyz"
    }
  ],
  "total": 1240,
  "page": 1,
  "totalPages": 25
}
```
