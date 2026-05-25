# Phase 1 — Product Catalog · `/specify` prompt

Paste everything below the line into Kimi Code after `/specify`.
(Focus is on WHAT and WHY — the technical HOW comes later in `/plan`.)

---

Build the customer-facing product catalog for NECKLINE, a solid-scent brand. This phase is read-only browsing: customers can discover products and open a product to inspect it. There is no cart, checkout, or login in this phase.

## Why
The catalog is the foundation every later phase builds on — cart, checkout, and admin all depend on the product data model and the browsing experience defined here. It must establish a clean, correct catalog that reflects the brand's visual design exactly.

## Who
- Anonymous visitors (no account needed) browsing the store.

## What customers can do
1. Browse a catalog of solid-scent products as a grid/list of product cards, each showing the product image, name, price, and an "Out of Stock" indicator when applicable.
2. Open a product detail page that shows the product's images, description, price, and a quantity stepper. (There is no scent/size selector — size and scent are part of the product itself, e.g. "RED CHAPTER 30g".)
3. See the product's price and stock status clearly on both the card and the detail page.
4. See clear "Out of Stock" labeling on any product whose stock is zero or that an admin has marked out of stock — these stay visible, never hidden.
5. Move through the catalog page by page (pagination) without long load times.

## Product & data expectations
- Each Product is a single purchasable item that owns its own price, SKU, stock, and purchasable state. There is no separate Variant entity; size and scent are baked into the product.
- Every price is shown with its currency; the system must support more than one currency, so each amount is tied to a currency and amounts are never currency-ambiguous. Displayed prices are tax-inclusive (no separate tax line in this phase).
- Out-of-stock products remain visible in the catalog with an "Out of Stock" label and cannot be selected for purchase later.
- Products are never hard-deleted; a removed product disappears from the storefront but its data is retained.

## Visual design (non-negotiable)
- The storefront must match the provided design images exactly — layout, colors, typography, spacing, and imagery come from those designs, consumed via centralized design tokens.
- Permitted enhancements only: hover/focus states, transitions, micro-interactions, image loading/skeleton states, empty states, and responsive behavior across screen sizes.
- Do not change the core design language (colors, typography, layout, brand styling) or invent visuals for screens not covered by a provided design. Any such deviation must be raised as a clarification, not decided unilaterally.

## Acceptance criteria
- A visitor can browse a paginated catalog and open any product's detail page.
- A product page shows the product's images, description, price (with currency), stock status, and a quantity stepper.
- A product with zero/admin-flagged stock shows "Out of Stock" and is not selectable for purchase; the product still appears in the catalog.
- Prices render with their currency and are tax-inclusive.
- Catalog listing endpoints are paginated; there are no unbounded full-catalog scans on customer-facing paths.
- The rendered storefront visually matches the provided design images, with only the permitted interaction/animation enhancements added.

## Out of scope for this phase
- Cart, checkout, orders, payments.
- User accounts, login, or order history.
- Admin/product management UI (catalog is seeded for now).
- Search (browsing/pagination only).
- Discounts/promo codes (handled in the dedicated Discounts phase).
