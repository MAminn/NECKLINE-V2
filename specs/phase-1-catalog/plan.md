# Phase 1 — Product Catalog · Implementation Plan

## Goal
Deliver the customer-facing product catalog: a paginated product grid on the storefront, clickable product cards, and a product detail page. All read-only — no cart, checkout, or auth.

## API Surface

### `GET /api/v1/products`
Query params (validated by Zod):
- `page` — integer, default 1, min 1
- `limit` — integer, default 12, min 1, max 50
- `category` — string, optional, exact match
- `tags` — comma-separated strings, optional (OR match)
- `sort` — enum: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `newest`, default `newest`
- `inStock` — boolean, optional. When `true`, only `stockOnHand > 0 && purchasable === true`

Response:
```json
{
  "data": [ /* Product[] */ ],
  "pagination": { "page": 1, "limit": 12, "total": 50, "totalPages": 5 }
}
```

Filtering rules:
- `deletedAt: null` (soft-delete filter, always applied)
- `purchasable: true` (always applied for customer-facing)
- Sort `newest` = `createdAt: -1`

### `GET /api/v1/products/:id`
- Returns single product by `_id`
- 404 if not found, deleted, or not purchasable

### Indexes (Product schema)
- `{ category: 1, createdAt: -1 }` — catalog category filter
- `{ tags: 1, createdAt: -1 }` — tag browsing
- `{ purchasable: 1, deletedAt: 1, createdAt: -1 }` — base catalog query
- `{ stockOnHand: 1, purchasable: 1 }` — in-stock filter

## Frontend Pages

### `/` (Home)
- Hero section (brand name + tagline)
- Product grid (uses `GET /api/v1/products?limit=12`)
- Pagination

### `/products/[id]` (Product Detail Page)
- Image gallery (main image + thumbnails)
- Product name, price with currency
- Stock status ("In Stock" / "Out of Stock")
- Quantity stepper (UI only, no cart action yet)
- "Add to Cart" button (disabled when out of stock)
- Description
- "You might also love" — related products (same category)

## Components

### `ProductCard`
- Image, name, price, stock badge
- Link to PDP
- Hover: subtle scale + shadow

### `ProductGrid`
- Responsive grid: 1 col (mobile) → 2 (sm) → 3 (md) → 4 (lg)
- Gap: `--space-6` (24px)

### `Pagination`
- Prev/Next + page numbers
- Disabled states for boundaries

### `QuantityStepper`
- `-` / `+` buttons with numeric input
- Min 1, max 99

### `PriceDisplay`
- Formats integer minor units → currency string
- EGP: "EGP 450.00", USD: "$45.00", SAR: "SAR 45.00"

### `ImageGallery`
- Main image + thumbnail row
- Click thumbnail to switch main

## Data Flow
1. Server fetches from Atlas on request (no SSG for now — prices/stock are dynamic)
2. Client-side pagination navigation
3. PDP fetches product + related products

## Testing
- API: list filter/sort/pagination, detail 200/404
- Frontend: card renders, PDP loads, pagination works

## Design Compliance
- All colors from `tokens.css` via Tailwind
- `font-display` for headings, `font-body` for text
- Dark theme (`bg-bg`, `text-text-primary`)
- Responsive breakpoints per tokens
