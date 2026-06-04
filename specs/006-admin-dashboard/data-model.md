# Data Model: Admin Dashboard (Phase 6)

## New Models

### Testimonial

Stores customer reviews displayed in the storefront homepage reviews section.

```js
// apps/api/src/models/Testimonial.js
{
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  product:  { type: String, required: true, trim: true, maxlength: 100 },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, required: true, trim: true, maxlength: 1000 },
  verified: { type: Boolean, default: false },
  date:     { type: String, required: true },   // display string e.g. "Jun 5, 2026"
  deletedAt: { type: Date, default: null },      // soft-delete
  timestamps: true                               // createdAt, updatedAt
}
```

**Index**: `{ deletedAt: 1, createdAt: -1 }` compound — filters active testimonials and sorts newest-first in a single index scan

---

### HeaderSlide

Stores hero carousel slides for the storefront homepage.

```js
// apps/api/src/models/HeaderSlide.js
{
  image:       { type: String, required: true, trim: true },   // URL
  title:       { type: String, required: true, trim: true, maxlength: 100 },
  subtitle:    { type: String, trim: true, maxlength: 200, default: '' },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  buttonText:  { type: String, trim: true, maxlength: 50, default: 'Shop Now' },
  linkTo:      { type: String, enum: ['collection', 'story', 'reviews'], default: 'collection' },
  order:       { type: Number, default: 0 },     // sort order, lower = earlier
  active:      { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes**: `{ active: 1, order: 1 }` (public storefront query)

---

### HowToApply

Single-document config for the "How to Apply" section on the homepage. Only one document ever exists (upserted by `configKey`).

```js
// apps/api/src/models/HowToApply.js
{
  configKey: { type: String, default: 'default', unique: true },  // sentinel — always 'default'
  color:     { type: String, default: '#D21B27', trim: true },    // hex accent
  steps: [{
    num:          { type: String, required: true },    // "01", "02", …
    title:        { type: String, required: true, trim: true },
    desc:         { type: String, required: true, trim: true },
    iconType:     { type: String, enum: ['preset', 'custom'], default: 'preset' },
    presetName:   { type: String, trim: true, default: '' },
    customIconUrl: { type: String, trim: true, default: '' },
  }],
  timestamps: true
}
```

---

## Modified Models

### Order — add `fulfillmentStatus`

```js
// apps/api/src/models/Order.js — add field
fulfillmentStatus: {
  type: String,
  enum: ['unfulfilled', 'processing', 'shipped', 'delivered'],
  default: 'unfulfilled',
},
trackingNumber: {
  type: String,
  trim: true,
  default: null,
},
```

**Rationale**: `status` tracks the payment/lifecycle state (`pending`, `confirmed`, `cancelled`). `fulfillmentStatus` tracks physical shipping progression independently.

**Index**: `{ fulfillmentStatus: 1, createdAt: -1 }` (admin filter queries)

---

### Product — add `views` and `sales` counters (read-only for admin display)

```js
// apps/api/src/models/Product.js — add fields
views: { type: Number, default: 0 },   // page-view counter (Phase 7 will increment)
sales: { type: Number, default: 0 },   // incremented on order confirmation
subtitle: { type: String, trim: true, default: '' },  // e.g. "Warm • Spicy • Seductive"
```

**Note**: `galleryImages` (array of URL strings) already exists via the `images` field. The admin UI refers to these as gallery images with a separate hero selection — the hero image is `images[0]`.

---

## Existing Models Used (no schema changes)

| Model | Used for |
|-------|----------|
| `Product` | Products tab CRUD, Dashboard top products |
| `Order` | Orders tab, Dashboard metrics aggregation |
| `User` | Customers tab list + delete |
| `PromoCode` | Offers tab — coupons (`isAutomatic: false`) + campaigns (`isAutomatic: true`) |
| `AuditEvent` | Settings → Activity Log tab |

---

## Computed Aggregates (not persisted)

### AdminMetrics (returned by `GET /api/v1/admin/metrics`)

```ts
{
  revenueToday: number,       // sum of Order.total where createdAt >= today midnight
  totalRevenue: number,       // sum of all confirmed Order.total
  ordersCount: number,        // count of all orders
  todayOrdersCount: number,   // count of orders created today
  conversionRate: number,     // todayOrdersCount / liveSessions (liveSessions = 0 in Phase 6)
  returningRate: number,      // users with >1 order / total users with orders
  newCustomers: number,       // users created in last 7 days
  pendingCount: number,       // orders with status 'pending' or 'pending_payment'
  processingCount: number,    // orders with fulfillmentStatus 'processing'
  averageOrderValue: number,  // totalRevenue / ordersCount
  liveSessions: number,       // placeholder 0 until Phase 7
  visitsHistory: [            // last 30 days, one entry per day
    { date: string, visits: number, checkouts: number }
  ],
  categoryShare: [            // breakdown by product category
    { name: string, share: number, color: string }
  ],
  forecast: {
    increase: number,
    recommendedStock: number,
    topProduct: string,
    projectedRevenue: number
  }
}
```

### ActivityEvent (returned by `GET /api/v1/admin/activities`)

```ts
{
  id: string,
  iconType: 'order' | 'cart' | 'ship' | 'alert' | 'user',
  user: string,
  text: string,
  sub: string,
  time: string
}
```

Sourced from the most recent 20 `AuditEvent` documents, transformed into display shape.

---

## Index Strategy

| Collection | Index | Purpose |
|-----------|-------|---------|
| `testimonials` | `{ deletedAt: 1, createdAt: -1 }` | Active reviews sorted newest first |
| `headerslides` | `{ active: 1, order: 1 }` | Public slide fetch sorted by display order |
| `howtoapplies` | `{ configKey: 1 }` unique | Single-document upsert |
| `orders` | `{ fulfillmentStatus: 1, createdAt: -1 }` | Admin fulfillment filter |
| `orders` | `{ createdAt: -1 }` | Metrics aggregation (already exists) |
| `products` | `{ deletedAt: 1, sales: -1 }` | Top products ranking |
| `auditevents` | `{ timestamp: -1 }` | Activity log pagination (already exists) |
