# NECKLINE

Solid scent brand storefront. MERN stack e-commerce platform.

## Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Express 4, Mongoose 8, Node.js 20 LTS
- **Database**: MongoDB Atlas (production), Docker/local for development
- **Deployment**: Vercel (frontend), Render (backend)

## Quick Start

```bash
# 1. Start local MongoDB
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start development servers
npm run dev
```

## Workspaces

- `apps/web` — Next.js frontend
- `apps/api` — Express backend

## Frontend Structure

```
apps/web/
├── src/
│   ├── app/                                       ← Next.js 15 App Router (one folder = one URL)
│   │   ├── layout.tsx                             ← Root layout: fonts, providers, fixed header, nav, CartDrawer, ToastContainer
│   │   ├── page.tsx                               ← / (homepage) — composes Hero, Collection, Features, HowToApply, Reviews, QuoteBanner
│   │   ├── shop/page.tsx                          ← /shop — full product catalog with search + filters
│   │   ├── products/[id]/page.tsx                 ← /products/:id — server component, product detail
│   │   ├── cart/page.tsx                          ← /cart — standalone cart page
│   │   ├── login/page.tsx                         ← /login
│   │   ├── register/page.tsx                      ← /register
│   │   ├── forgot-password/page.tsx               ← /forgot-password — sends reset email
│   │   ├── reset-password/page.tsx                ← /reset-password — confirms token + new password
│   │   ├── account/page.tsx                       ← /account — profile + order history (auth-guarded)
│   │   ├── checkout/page.tsx                      ← /checkout — multi-step: shipping → review → payment
│   │   ├── order-confirmation/[orderNumber]/
│   │   │   ├── page.tsx                           ← Server wrapper with Suspense
│   │   │   └── OrderConfirmationClient.tsx        ← Polls payment status, renders confirmation
│   │   └── order-lookup/page.tsx                  ← /order-lookup — guest order status by email + order#
│   │
│   │   └── admin/                                 ← Protected admin portal (role-checked in layout)
│   │       ├── layout.tsx                         ← Admin shell: auth guard + AdminSidebar + content area
│   │       ├── dashboard/page.tsx                 ← KPIs, recent orders, top products, activity feed
│   │       ├── products/page.tsx                  ← Product inventory table + add/edit modals
│   │       ├── orders/page.tsx                    ← Order table + fulfillment detail sidebar
│   │       ├── customers/page.tsx                 ← Customer table + detail sidebar
│   │       ├── analytics/page.tsx                 ← Revenue/orders charts with timeframe filter
│   │       ├── offers/page.tsx                    ← Promo codes + campaign management
│   │       ├── reviews/page.tsx                   ← Testimonial moderation table
│   │       ├── reports/page.tsx                   ← Reports (Phase 6b)
│   │       ├── interface/page.tsx                 ← CMS: hero slides + how-to-apply editor
│   │       └── settings/
│   │           ├── profile/page.tsx               ← Store owner name + password change
│   │           └── activity-log/page.tsx          ← Audit log of admin actions
│   │
│   ├── components/
│   │   ├── HeaderAuth.tsx                         ← Sign In ghost link + Join gold button (unauth); Dashboard/Account/Logout (auth)
│   │   ├── MobileMenu.tsx                         ← Full-screen overlay nav
│   │   ├── CartIcon.tsx                           ← Bag icon + item count badge; opens CartDrawer
│   │   ├── CartDrawer.tsx                         ← Right-edge slide panel: line items + promo + checkout CTA
│   │   ├── ToastContainer.tsx                     ← Mounts all active toasts
│   │   ├── ToastItem.tsx                          ← Single toast: icon + message + auto-dismiss
│   │   │
│   │   ├── nickline/                              ← Storefront sections assembled on the homepage
│   │   │   ├── Hero.tsx                           ← Crossfade image carousel, headline + CTAs, rotating quiz badge
│   │   │   ├── Collection.tsx                     ← Featured scents grid with add-to-cart
│   │   │   ├── Features.tsx                       ← Four brand benefit blocks
│   │   │   ├── HowToApply.tsx                     ← Step-by-step application tutorial
│   │   │   ├── Reviews.tsx                        ← Double-track seamless marquee + review submission drawer
│   │   │   ├── QuoteBanner.tsx                    ← Full-width editorial brand statement
│   │   │   ├── ScentQuiz.tsx                      ← Interactive scent quiz modal
│   │   │   ├── ShopPage.tsx                       ← Full shop UI (search, filters, product grid)
│   │   │   └── ProductPage.tsx                    ← Product detail (gallery, description, related products)
│   │   │
│   │   ├── ProductCard.tsx                        ← Listing card: image, name, price; crimson reveal line on hover
│   │   ├── ProductGrid.tsx                        ← Responsive grid wrapper for ProductCards
│   │   ├── ProductActions.tsx                     ← Quantity stepper + add-to-cart (product detail page)
│   │   ├── AddToCartButton.tsx                    ← Standalone add-to-cart with loading/success states
│   │   ├── QuantityStepper.tsx                    ← +/- input, range 1–99
│   │   ├── PriceDisplay.tsx                       ← Formatted price + currency (EGP)
│   │   ├── ImageGallery.tsx                       ← Product image carousel with thumbnails
│   │   ├── CartLineItem.tsx                       ← Single cart row: image, name, qty, price, remove
│   │   ├── CartSummary.tsx                        ← Subtotal + item count block
│   │   ├── LoginForm.tsx                          ← Email + password login form
│   │   ├── RegisterForm.tsx                       ← Name + email + password registration
│   │   ├── AccountProfile.tsx                     ← Editable profile: name, email, password change
│   │   ├── OrderHistoryList.tsx                   ← Paginated past orders with status badges
│   │   ├── Pagination.tsx                         ← Prev/next + page numbers
│   │   │
│   │   ├── checkout/
│   │   │   ├── ShippingStep.tsx                   ← Step 1: name, email, phone, address, city, governorate
│   │   │   ├── ReviewStep.tsx                     ← Step 2: review items + promo code
│   │   │   ├── PaymentStep.tsx                    ← Step 3: payment status + error states
│   │   │   ├── PromoCodeInput.tsx                 ← Code field with apply/remove toggle
│   │   │   └── OrderSummary.tsx                   ← Sticky sidebar: itemized breakdown + totals
│   │   │
│   │   └── admin/
│   │       ├── AdminSidebar.tsx                   ← Fixed left nav: logo + 10-tab links + active state
│   │       ├── AdminKpiCard.tsx                   ← KPI card: label, value, trend arrow
│   │       ├── AdminModal.tsx                     ← Shared modal (Framer Motion, Escape key, backdrop)
│   │       ├── AdminImageUploader.tsx             ← Image upload with preview
│   │       ├── analytics/AnalyticsChart.tsx       ← Line chart via Recharts
│   │       ├── customers/CustomersTable.tsx       ← Sortable customer list with search
│   │       ├── customers/CustomerDetailSidebar.tsx← Slide-in: order history, contact, tier
│   │       ├── dashboard/DashboardKpis.tsx        ← KPI row at top of dashboard
│   │       ├── dashboard/RecentOrdersTable.tsx    ← Last N orders with status badges
│   │       ├── dashboard/TopProductsList.tsx      ← Best-selling products ranked
│   │       ├── dashboard/ActivityFeed.tsx         ← Live-updating store event timeline
│   │       ├── interface/HeroSlidesSection.tsx    ← Manage carousel slides (add/edit/delete/reorder)
│   │       ├── interface/HowToApplyEditor.tsx     ← CMS editor for how-to-apply steps
│   │       ├── interface/SlideModal.tsx           ← Add/edit modal for a single hero slide
│   │       ├── offers/CouponsSection.tsx          ← Coupon code manager
│   │       ├── offers/CampaignsSection.tsx        ← Campaign manager (name, discount, date range)
│   │       ├── orders/OrdersTable.tsx             ← Orders with filters + inline status update
│   │       ├── orders/OrderDetailSidebar.tsx      ← Items, shipping, tracking number input
│   │       ├── products/ProductsTable.tsx         ← Inventory list with stock badges
│   │       ├── products/ProductForm.tsx           ← Shared form fields (used by both modals)
│   │       ├── products/AddProductModal.tsx       ← Modal for new product creation
│   │       ├── products/EditProductModal.tsx      ← Modal for editing existing product
│   │       ├── reviews/ReviewsTable.tsx           ← Review list with approve/hide/delete
│   │       └── reviews/ReviewForm.tsx             ← Edit review content + rating
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx                        ← User session: login(), register(), logout(), refreshUser()
│   │   ├── CartContext.tsx                        ← Cart items + drawer toggle; sends Idempotency-Key on mutations
│   │   └── ToastContext.tsx                       ← Toast queue: addToast(), removeToast()
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                             ← Re-export of AuthContext
│   │   ├── useCart.ts                             ← Re-export of CartContext
│   │   └── useReveal.ts                           ← Intersection Observer → adds `revealed` class for scroll animations
│   │
│   ├── lib/
│   │   ├── api.ts                                 ← Core fetch wrapper: credentials + correlation ID + idempotency; auto-retries on 401
│   │   ├── checkout-api.ts                        ← Checkout-specific calls: session, order, lookup
│   │   ├── admin-api.ts                           ← All admin API calls: metrics, products, orders, customers, coupons, audit log
│   │   └── formatPrice.ts                         ← Currency formatter (EGP/USD/SAR + symbol)
│   │
│   ├── styles/
│   │   ├── tokens.css                             ← Single source of truth: all CSS custom properties (colors, typography, spacing, radii, shadows, z-index, motion)
│   │   └── globals.css                            ← Base styles, animation keyframes, nav-link underline, reveal scroll, input baseline
│   │
│   └── types/
│       └── nickline.ts                            ← All TypeScript types: Product, Scent, Review, CartItem, Order, AdminMetrics, etc.
│
├── tailwind.config.ts                             ← Maps every CSS token → Tailwind utility
└── next.config.mjs                                ← Rewrites /api/* → NEXT_PUBLIC_API_URL; image domain allowlist
```

## Spec Kit Workflow

Every phase follows: `/specify → /clarify → /plan → /tasks → /analyze → /implement`

See `ROADMAP.md` for phase breakdown and `CONSTITUTION.md` for governing principles.
