# Phase 1 — Product Catalog · Tasks

## Backend

- [x] **T101** Add catalog indexes to `Product.js` schema
- [x] **T102** Create `apps/api/src/services/productService.js` — listProducts({ page, limit, category, tags, sort, inStock }) + getProductById(id)
- [x] **T103** Create `apps/api/src/routes/v1/products.js` — `GET /` (list) and `GET /:id` (detail)
- [x] **T104** Wire `productsRouter` into `apps/api/src/routes/v1/index.js` at `/api/v1/products`
- [ ] **T105** Write integration tests: list pagination/filter/sort, detail 200, detail 404 (deferred)

## Frontend

- [x] **T201** Create `apps/web/src/components/PriceDisplay.tsx` — format minor units to currency
- [x] **T202** Create `apps/web/src/components/ProductCard.tsx`
- [x] **T203** Create `apps/web/src/components/ProductGrid.tsx`
- [x] **T204** Create `apps/web/src/components/Pagination.tsx`
- [x] **T205** Create `apps/web/src/components/QuantityStepper.tsx`
- [x] **T206** Create `apps/web/src/components/ImageGallery.tsx`
- [x] **T207** Update `apps/web/src/app/page.tsx` — hero + product grid + pagination
- [x] **T208** Create `apps/web/src/app/products/[id]/page.tsx` — PDP with gallery, price, stock, quantity, related
- [ ] **T209** Write unit tests for PriceDisplay, QuantityStepper (deferred)

## Design / Styles

- [x] **T301** Added `text-success-fg` / `text-success-bg` tokens for stock badges
