# Quickstart: Admin Dashboard (Phase 6)

## Prerequisites

- API running on port 4000 (`npm run dev:api`)
- Web running on port 3000 (`npm run dev:web`)
- MongoDB running (`docker-compose up -d`)
- An admin user account (see seed step below)

## 1. Seed an admin user

```bash
cd apps/api
# Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in apps/api/.env first
node scripts/seedAdmin.js
# Creates (or promotes + rotates the password of) the admin from those env vars
```

Or via the DB directly:
```js
db.users.updateOne({ email: "youruser@example.com" }, { $set: { role: "admin" } })
```

## 2. Access the dashboard

Navigate to `http://localhost:3000/admin`

If not logged in, the page redirects to `/login?redirect=/admin`.  
Log in with an admin account → redirected back to `/admin`.

## 3. Validate each tab

### Dashboard
- KPI cards show non-zero values after seeding orders
- Top Products shows ranked list
- Live Activity feed shows recent audit events

### Products
- Seed command: `node apps/api/scripts/seedProducts.js` (existing)
- Click "Add Product" → fill form → verify product appears in table and at `/shop`
- Edit price → verify `/shop` shows updated price
- Delete a product → verify it disappears from table and `/shop`

### Orders
- Place a test order via the storefront
- Open Orders tab → find the order
- Change `fulfillmentStatus` to "PROCESSING" → verify order record updates
- Add tracking number → verify it saves

### Customers
- Register a new account on the storefront
- Open Customers tab → find the user with correct email and `ordersCount: 0`

### Offers
- Create a coupon code "TEST10" (10% off, min 5000 EGP)
- Apply it during checkout → verify discount applies
- Delete coupon → verify it can no longer be applied

### Reviews
- Click "Add Review" → fill form → verify review appears on homepage reviews section
- Edit verified status → verify badge updates on homepage
- Delete review → verify it disappears from homepage

### Interface Billboard
- Click "Add Slide" → upload/paste image URL → fill title/button → save
- Verify new slide appears in homepage hero carousel
- Edit "How to Apply" accent color → save → verify color updates on homepage

### Analytics
- Timeframe selector switches between 7D / 30D / ALL
- Chart renders without errors (may show flat line if data is sparse)

### Settings
- Profile: update display name → verify sidebar shows new name
- Activity Log: confirm recent admin mutations (product edit, order update) appear

## 4. Security validation

```bash
# Should return 401 — no auth
curl http://localhost:4000/api/v1/admin/metrics

# Should return 403 — authenticated but not admin
curl -b "auth=<customer_token>" http://localhost:4000/api/v1/admin/metrics

# Should return 200 — admin auth
curl -b "auth=<admin_token>" http://localhost:4000/api/v1/admin/metrics
```

## 5. Public endpoints (no auth required)

```bash
curl http://localhost:4000/api/v1/testimonials
curl http://localhost:4000/api/v1/header-slides
curl http://localhost:4000/api/v1/how-to-apply
```

All should return 200 with data (or empty arrays for a fresh install).
