# NECKLINE — Design System & Frontend Audit

Scope: `apps/web/src/**` plus `design/tokens.css`, `apps/web/src/styles/globals.css`, `apps/web/tailwind.config.ts`. Audit run 2026-06-06.

## Summary
**Files reviewed:** ~80 component + page files · **Issues found:** 15 (5 critical, 4 high, 4 medium, 2 low) · **Overall score:** **55 / 100**

| Area | Score | Notes |
|---|---|---|
| Token definitions (tokens.css v2.0) | 9/10 | Comprehensive, well-organized |
| Token wiring into Tailwind | 3/10 | Big gaps; semantic bgs/fgs/admin colors/charts unmapped |
| Token consumption in code | 4/10 | Admin uses dead legacy set; 178 inline `style={{}}` blocks |
| Storefront fidelity | 7/10 | ProductPage + cart are clean Tailwind |
| Admin fidelity to dashboard images | 3/10 | Cream/gold palette, not the dark-luxury+crimson from images |
| Server-authority (cart/api) | 9/10 | Cart sends only ids+qty; idempotency keys present |
| Next.js 15 correctness | 9/10 | `params: Promise` awaited correctly |
| A11y / dead code hygiene | 5/10 | Heavy inline styles, dead admin tree, no audit of ARIA |

---

## CRITICAL — Block correct rendering or silently wrong

### C-1. Two parallel admin-token systems; the v2.0 set is **dead code**
The v2.0 `design/tokens.css` defines `--color-admin-bg #09090b`, `--color-admin-surface #18181b`, `--color-admin-border rgba(255,255,255,0.05)` — matching the dashboard images (zinc/white/crimson, pure dark luxury).
But `apps/web/src/styles/globals.css:226-234` redefines a **competing** legacy admin set on `:root`:
```css
--admin-bg: #090203;          /* warm near-black */
--admin-surface: #130608;     /* warm dark tint */
--admin-border: rgba(194, 159, 104, 0.15);  /* gold border */
--admin-accent: #D21B27;
--admin-gold: #C29F68;
--admin-text: #F5F0E8;        /* cream, not white */
--admin-text-muted: rgba(245, 240, 232, 0.55);
```
**Usage:** legacy `var(--admin-*)` = **241 occurrences across 30 files**. New `var(--color-admin-*)` = **0**.
**Result:** the entire admin app renders in **cream + gold + warm-black**, not the **white + crimson + zinc-black** the dashboard images show. This is the single biggest design-fidelity violation in the codebase (§2.1 deviation).
**Fix:** delete the `globals.css:226-234` block, find/replace `--admin-` → `--color-admin-` across the 30 files, and add the new tokens to `tailwind.config.ts` (see C-3).

### C-2. Tailwind `font-body` is broken — token name doesn't exist
`tailwind.config.ts:37` maps `body: ['var(--font-body)']`, but `tokens.css` defines `--font-sans` (and `--font-display`, `--font-serif`). There is no `--font-body`.
**Result:** any `font-body` Tailwind class resolves to nothing → browser default font.
**Fix:** rename the Tailwind family to `sans: ['var(--font-sans)']` (or alias `body`→`--font-sans`). Globally consistent with the `<html>` font wiring in `app/layout.tsx`.

### C-3. Tailwind config missing ~40% of the tokens that exist
`tailwind.config.ts` exposes only a slice of tokens. Missing:
- Admin: `admin-bg`, `admin-surface`, `admin-surface-elevated`, `admin-border`, `admin-border-subtle`, `admin-border-strong`, `login-overlay`, `login-card`.
- Storefront surfaces: `bg-deep`, `surface-input`, `surface-overlay`.
- Semantic pills: `success-bg`, `success-fg`, `error-bg`, `error-fg`, `error-border`, `warning-bg/fg`, `info-bg/fg`, `brand-alert-bg/fg/border`.
- Borders/dividers: `border-card-hover`, `border-input-focus`, `divider`.
- Chart palette: `chart-1..6`.
- Text: `text-secondary-alt`, `text-live`, `text-warning`, `text-inverse`.
- Live indicator: `live`, `live-fg`, `notification`.
- Spacing scale, font sizes, line-heights, letter-spacing — **none of `--space-*` / `--fs-*` / `--ls-*` are exposed**, so Tailwind spacing uses its own scale, not your tokens.
**Result:** classes like `bg-success-bg` (used in `app/products/[id]/page.tsx:86` for the "In Stock" badge) **resolve to nothing → the badge has no background color**. This is the proximate cause of the 178 inline `style={{}}` blocks across the admin: developers fell back to inline styles because the Tailwind classes don't exist.
**Fix:** generate the Tailwind theme directly from `tokens.css` (script or copy). Then sweep the 178 inline styles for Tailwind-class replacements.

### C-4. `bg-bg/96` opacity-alpha doesn't work with hex CSS variables
`app/layout.tsx:54` — `bg-bg/96` (translucent header on the storefront). Tailwind's `/<opacity>` modifier requires the color to be defined as RGB channels (or pass through `<alpha-value>`), not as a finished hex string. `--color-bg` is `#070606`. The compiler can't synthesize alpha.
**Result:** the fixed header renders **without translucency**; `backdrop-blur-md` blurs nothing meaningful.
**Fix:** either define `--color-bg` as `7 6 6` and write `var(--color-bg) / <alpha-value>` in the Tailwind theme; or add a dedicated `bg-bg-translucent` token (`rgba(7,6,6,0.96)`).

### C-5. Three places hold "the truth" about design tokens
`design/tokens.css` (project root, v2.0), `apps/web/src/styles/tokens.css` (the one actually imported by `globals.css`), and the `:root` block at the bottom of `globals.css` (C-1). It's currently unclear which is canonical. The bash check confirmed `apps/web/src/styles/tokens.css` exists; the read in your last message shows it's the v2.0 file — but the root `design/tokens.css` from earlier still exists too.
**Fix:** pick one source of truth (recommend `design/tokens.css`), make `apps/web/src/styles/tokens.css` a symlink or a build copy, and add a CI check that the two stay in sync. Remove the legacy `:root` block from `globals.css`.

---

## HIGH — Hardcoded mistakes / frontend misconceptions

### H-1. `components/admin/adminStyles.ts` — hardcoded values + references nonexistent tokens
Lines 4, 14, 39 hardcode `background: '#1a0a0c'` (not in any token set). Lines also reference `var(--admin-border)`, `var(--admin-text)`, `var(--admin-gold)` — only the legacy block (C-1).
Plus the whole file is **inline-style objects in `.ts`**, a pattern the rest of the codebase already moved away from. Delete the file once C-3 is fixed and convert callers to Tailwind classes (`bg-admin-surface`, `border-admin-border`, etc.).

### H-2. `components/admin/customers/CustomersTable.tsx:9` — mixed token + hardcoded hex
```ts
const TAG_COLORS = { VIP: 'var(--admin-gold)', NEW: '#60a5fa', ACTIVE: '#4ade80' };
```
Two hexes (`#60a5fa`, `#4ade80`) outside any token. Use `var(--color-info)` and `var(--color-success)` or new tokens.

### H-3. 178 inline `style={{}}` blocks across 25 files
Mostly an admin pattern (CustomersTable 20, OrderDetailSidebar 19, OrdersTable 17, CustomerDetailSidebar 16, ReviewsTable + AdminOrdersTab 16, CouponsSection 9, etc.). Inline styles bypass Tailwind, prevent dark-mode/state variants, and are hard to audit. **Root cause is C-3** — once tokens are in the Tailwind theme, these collapse into `className=` props.

### H-4. Dead admin tree — `components/nickline/Admin*Tab.tsx`
`AdminAnalyticsTab.tsx`, `AdminCustomersTab.tsx`, `AdminOffersTab.tsx`, `AdminOrdersTab.tsx` are **imported nowhere** (grep returned no matches). They contain 35+14+9+? hardcoded hex values that inflate every audit number above. The same applies to `ScentQuiz.tsx` (one inline-style block, possibly unused). Delete or move to `__archived/` before the next phase.

---

## MEDIUM — Correctness / accessibility

### M-1. Admin auth gate is client-only (server-authority risk)
`app/admin/layout.tsx` is `'use client'` and gates on `user.role !== 'admin'` via `useEffect`. UI-side gating is fine **only if** every `/api/v1/admin/*` route also enforces the role on the server (Constitution §4.3 says capability checks must not be UI-hidden only). I did not audit the API in this pass — verify each admin route has `authenticate + requireRole('admin')` middleware before declaring this safe.

### M-2. `customerTag()` is business logic on the frontend
`CustomersTable.tsx:11-15` computes VIP/NEW/ACTIVE from `ordersCount >= 3 || lifetimeValue >= 5_000_000`. If the backend also classifies customers (segments, analytics, offers' "Customer Segments" radio), the two definitions can drift silently. Move tier computation to the API and let the client render the label.

### M-3. `CustomersTable.tsx:37` — eslint-disable on `exhaustive-deps`
```ts
}, [page, search, refresh]); // eslint-disable-line react-hooks/exhaustive-deps
```
The disable is suspicious — `refresh` IS in the deps. If the comment exists for a reason (closure capture of an external value not declared above), make that explicit; otherwise remove. ESLint-disable + missing context is a smell.

### M-4. A11y not verified
Not audited in this pass: ARIA on icon-only buttons (`OrdersTable` actions, sidebar nav), focus rings on custom-styled buttons (the inline-style ones won't pick up `focus-visible` ring tokens), color contrast for `text-text-muted #737373` on `#070606` (≈ 4.4:1 — borderline AA on small text), and `prefers-reduced-motion` honoring for `animate-pulse-glow`, `animate-marquee`. Schedule an accessibility-review pass before launch.

---

## LOW — Consistency / polish

### L-1. `--radius-sm: 3px` breaks the 4-px base
`tokens.css:141`. Acceptable if intentional for storefront CTA only — but document, otherwise inconsistent with the spacing scale.

### L-2. Hardcoded `rgba(...)` in globals.css
Lines 53, 74, 107, 186 use raw `rgba(210, 27, 39, 0.18)` / `(34, 197, 94, 0.2)` instead of token references. Promote them to tokens (`--shadow-focus-soft`, `--color-success-border`).

---

## What's solid (don't change)
- `CartContext.tsx` is **clean server-authority**: only `productId` + `quantity` go to the server; prices/subtotal/discount/shipping/total are read back from the API. Compliant with §III + §X (idempotency keys on `add-item` and `apply-promo`).
- `lib/api.ts` handles correlation IDs, idempotency keys, credentials, and a single retry after silent token refresh on 401. Solid pattern.
- `app/products/[id]/page.tsx` correctly awaits the Next.js 15 `params: Promise<{id}>` — no hydration mismatch risk.
- `app/admin/page.tsx` redirects `/admin → /admin/dashboard` cleanly; routing matches the dashboard's nav.
- `app/layout.tsx` font wiring (Plus Jakarta Sans + Oswald + Cinzel via `next/font/google` with CSS variables) is the right Next.js pattern, and the CSS variables match `tokens.css`.

---

## Priority actions (do in this order)

1. **Unify admin tokens (C-1, C-5).** Delete the `:root` legacy block in `globals.css`; find-and-replace `--admin-` → `--color-admin-` across the 30 files; choose one canonical `tokens.css`.
2. **Wire Tailwind to the full token set (C-2, C-3, C-4).** Map every `--color-*`, `--space-*`, `--fs-*`, font family (`sans`/`display`/`serif`), and define `--color-bg` as space-separated channels so `/<alpha>` works.
3. **Sweep inline styles (H-3) onto Tailwind classes** once #2 lands. Start with the worst offenders (CustomersTable, OrderDetailSidebar, OrdersTable).
4. **Delete dead code (H-4).** `components/nickline/Admin*Tab.tsx` + any unused legacy components.
5. **Verify server-side admin role enforcement (M-1).** Audit `/api/v1/admin/*` routes; flag any without role gates.
6. **Move `customerTag()` to the API (M-2).** Single source of truth for customer tier.
7. **Run the `design:accessibility-review` skill on storefront + admin (M-4).** Then a contrast/keyboard sweep.

When 1–4 are done you've turned the score from 55→~85 with no design changes — purely cleanup.
