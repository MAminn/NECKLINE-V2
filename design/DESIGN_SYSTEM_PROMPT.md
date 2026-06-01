# NECKLINE — Design-System Prompt (for a code-generation agent)

**How to use:** Paste everything below the line into Claude (or your design-to-code agent) **and attach the design images**: `layout website.png`, `Product details.png`, and the 10 files in `Dashboard/`. Also attach `design/tokens.css`. The images are the source of truth; the text below is the contract. If anything in the text conflicts with an image, the **image wins** and the agent must ask before deviating.

---

You are building the front-end for **NECKLINE**, a solid-scent (solid perfume) e-commerce brand. Reproduce the attached designs **faithfully** — this is a pixel-fidelity task, not a redesign.

## 0. Golden rules (non-negotiable)
1. **Match the attached images exactly** — layout, colors, typography, spacing, hierarchy, and imagery come from them. Do **not** invent a different visual language.
2. **You MAY add**, and are encouraged to add for polish: hover/focus states, transitions, micro-interactions, entrance animations, image loading/skeleton states, empty states, and responsive behavior across breakpoints.
3. **You MAY NOT change** the core design language: the color palette, type system, layout structure, or brand styling. If a screen or state isn't covered by an image, **ask** rather than invent.
4. **Consume tokens, never hardcode.** Every color/space/radius/shadow comes from the design tokens (Section 2). No ad-hoc hex values or magic numbers in components.
5. Theme is **dark luxury**: warm near-black surfaces, a single vivid crimson accent, white/cool-gray text. High-contrast condensed uppercase display type against clean body sans.

## 1. Tech target
- **Next.js (App Router)** with React, TypeScript.
- **Tailwind CSS** for styling, with the design tokens wired in as the Tailwind theme (map the CSS variables from `tokens.css` into `tailwind.config` so classes like `bg-surface`, `text-primary`, `border-subtle` resolve to the tokens). Keep `tokens.css` as the single source of truth on `:root`.
- Storefront pages are **server-rendered** (SEO + fast first paint). Admin pages are client-rendered behind auth.
- This is **presentation only** — components fetch from an external API via props/hooks; do not embed business logic, prices, or stock math in the UI. Render what you're given.
- Accessibility: semantic HTML, visible focus rings (use `--shadow-focus`), keyboard operable, ARIA where needed, respects `prefers-reduced-motion`.

## 2. Design tokens
Use the values in the attached `tokens.css`. Summary:

**Color** — Primary `#E0242A` (hover `#FF2D34`); Success `#22C55E`; Warning `#F59E0B`; Info `#3B82F6`; Error `#EF4444`. Surfaces: bg `#0B0D10`, bg-secondary `#111418`, surface `#1A1D22`, surface-elevated `#23262D`. Borders: subtle `#2F333B`, strong `#3C4048`, divider `#24282F`. Text: primary `#FFFFFF`, secondary `#A1A1AA`, tertiary `#71717A`, muted `#52525B`, disabled `#3F3F46`, inverse `#0B0D10`. Status pills use the foreground color on its dark tint bg (success/error/warning/info). Charts: red/green/blue/yellow/purple/cyan.

**Typography** — Display/headings: heavy, condensed, **UPPERCASE** grotesque, tight tracking, weight 900 (hero, section titles, KPI numbers). Body/UI: clean neutral sans (Inter/Geist-style), regular weight, generous line-height, sentence case. Confirm exact font files from the design source; until then use the families in `tokens.css`.

**Spacing** 4px base scale; **Radii** sm 4 / md 8 / lg 12 / xl 16 / 2xl 24 / full; **Shadows** sm/md/lg + crimson focus ring; **Motion** fast 120ms / base 200ms / slow 320ms, standard & out easings.

**Localization** — Base currency **EGP**; currency switcher **EGP / USD / SAR** in the admin top bar. Default timezone **GMT+02:00 Cairo**. Markets: Egypt + GCC. Build currency/number display to be currency-aware (amount + ISO code), never a hardcoded symbol.

## 3. Foundations
- **Container** max-width ~1280px; admin **sidebar** fixed ~256px.
- **Breakpoints:** sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536.
- **Grid:** storefront product grids and dashboard card rows are responsive — 4-up on desktop, 2-up tablet, 1-up mobile (confirm exact counts against images).
- **Elevation:** cards sit on `surface`/`surface-elevated` over `bg`; subtle borders, soft shadows. No harsh lines.

## 4. Component inventory
Build these as reusable, prop-driven components with **all states**: default, hover, active/pressed, focus-visible, disabled, loading, error, empty.

**Primitives**
- **Button** — variants: primary (crimson fill, white text — e.g. "New Product", "Add to Cart", "Create Offer"), secondary/outline, ghost/icon, destructive. States incl. loading (spinner) and disabled.
- **Input / Textarea / Select / Date picker** — dark fields, subtle border, crimson focus ring, label + helper/error text, optional hint ("Optional").
- **Toggle / Switch** — crimson when on (used in offer settings, preferences).
- **Checkbox / Radio** — incl. the "Apply To" radio group and table row checkboxes.
- **Badge / Status pill** — Active (green), Out of Stock (red), Low Stock (amber); order fulfillment Pending/Processing/Shipped/Delivered/Cancelled/Refunded; payment Paid/Refunded; promo type Percentage/Fixed/Free Shipping; promo status Active/Scheduled/Expired. Each = colored text on its dark tint.
- **Tabs** — with counts (Orders status tabs, Customers tabs).
- **Tooltip, Dropdown menu, Modal/Dialog, Toast, Pagination, Breadcrumb, Avatar (initials), Progress bar** (promo usage), **Search input** (global top-bar), **Currency switcher**.

**Composite**
- **KPI / Stat card** — big condensed number, label, period delta (green ↑ / red ↓), tiny sparkline; crimson-accented icon tile.
- **Data table** — sticky header, row checkboxes, sortable columns, thumbnails, status pills, row actions (view/edit/delete icons), pagination + per-page selector, "Showing X to Y of Z", empty + loading (skeleton rows) states.
- **Chart cards** — line/area (revenue), line (orders), bar (customers), donut (sales by category), horizontal bars (traffic sources); use the chart palette; period toggle (Daily/Weekly).
- **Product card** (storefront) — image, name, price, "Out of Stock" overlay/label when applicable, hover lift.
- **Quantity stepper**, **Accordion** (How-to-use / Ingredients), **Review block / rating stars**.

## 5. Storefront screens (from `layout website.png` + `Product details.png`)
- **Home:** hero ("WEAR YOUR NECKLINE" condensed uppercase headline + CTA), **Intimacy Collection** product grid, **"Apply with intention"** ritual steps numbered 01–05, best-seller feature block, customer reviews. Match section order and spacing.
- **Product detail:** image gallery (thumbnails + main image), product title + price, feature badges, **quantity stepper**, **Add to Cart** + **Buy It Now** buttons, shipping notes, **How to use** / **Ingredients** accordions, **"You might also love"** related products, reviews. **No scent/size variant selector** — each product is a single item (size/scent are in the product name, e.g. "RED CHAPTER 30g").

## 6. Admin screens (from `Dashboard/*.png`)
Shared **app shell**: left **sidebar** (NECKLINE logo; nav: Dashboard, Products, Orders [count badge], Customers, Analytics, Offers [count badge], Reports, Settings; a "Need help?" / Contact Support card; admin avatar+email at bottom) and a **top bar** (global search, currency switcher EGP/USD/SAR, date-range picker, Export, primary action button e.g. "+ New Product").

- **Dashboard:** KPI cards (today's orders, revenue today, live sessions [green dot], conversion %; then total revenue, orders, avg order value, new customers — each with delta + sparkline), 30-day revenue area chart with Daily/Weekly toggle, Top Products list (crimson bars + units), Recent Orders mini-table with status pills, Live Activity feed with timestamps.
- **Products:** 4 KPI cards (total / active / out-of-stock / total views); filter bar (search, category, status, tags, Filter, Sort); table (checkbox, product thumb+name+subtitle, SKU, category, price, stock, status pill, views, sales, row actions); pagination.
- **Orders:** status tabs with counts (All/Pending/Processing/Shipped/Delivered/Cancelled/Refunded); filter row (order status, payment status, fulfillment status, date range, Clear); table (order #, customer avatar+name+city, item thumbnails+count, total, payment pill, fulfillment pill, date, actions); pagination + per-page.
- **Customers:** 4 KPI cards (total / new / active / repeat); tabs (All/Active/New/Inactive); table (customer avatar+name+city, contact email+phone, orders, total spent, last order, status pill, actions).
- **Analytics:** KPI row; Revenue/Orders/Customers over-time charts with Daily toggles; Sales-by-Category donut; Top Products; Top Countries with flags (Egypt, Saudi Arabia, Kuwait, UAE, Qatar); Traffic Sources horizontal bars.
- **Offers → Promo Codes:** KPI cards (total codes / active / used today / total discount); filter bar + Bulk Actions; table (code with copy icon, type pill, discount, min order, usage progress bar [e.g. 124/500], expiry, status pill, actions).
- **Offers → Create New Offer (form):** Offer Details (name, description, offer type select, discount value, start/end dates, minimum order value [optional], usage limit [optional], Active toggle); **Apply To** radio (All Products / Specific Products / Specific Collections / Customer Segments); product picker list with checkboxes + stock badges; Additional Settings (Stackable, Show on homepage, Auto-apply toggles; Custom Banner upload); Cancel / Create Offer actions.
- **Settings:** left sub-nav (Profile, Store, Team, Roles & Permissions, Payments, Shipping, Taxes, Notifications, Integrations, Appearance, Security, API, Activity Log). **Profile** page: Profile Information (avatar + Change Avatar, full name, email, phone, Save Changes), Change Password (current/new/confirm + Update), Preferences (language, timezone [GMT+2 Cairo], date format, time format [24h], Save), **Danger Zone** (Delete Account). Build the other sub-nav pages as consistent stubs following the same layout pattern unless an image specifies otherwise — and flag that they aren't fully designed.

## 7. States, responsive, edge cases, motion, a11y
- **States:** every interactive element shows hover, focus-visible (crimson ring), active, disabled, loading; every data view shows loading (skeleton), empty, and error states.
- **Responsive:** sidebar collapses to a drawer on mobile; KPI rows and product grids reflow 4→2→1; tables become horizontally scrollable or stack into cards on small screens.
- **Edge cases:** long product/customer names truncate with ellipsis + title; large counts format with separators and currency code; out-of-stock items stay visible with the label, never hidden; tables handle 0 rows and 1000+ rows (paginated).
- **Motion:** subtle and fast — card hover lift, button press, fade/slide entrances, number count-ups on KPI cards, skeleton shimmer. Use token durations/easings. Honor `prefers-reduced-motion`.
- **Accessibility:** logical focus order, ARIA roles/labels on icon-only buttons, accessible names for status pills, keyboard support for tabs/menus/dialogs, sufficient contrast (verify crimson-on-dark and muted text meet WCAG AA).

## 8. Deliverable
- A Next.js component library + the two storefront pages + the admin shell and its sections, all wired to the tokens.
- Tokens mapped into `tailwind.config`; `tokens.css` imported globally.
- A short component index (what exists, its props, its states).
- Call out explicitly any screen/state you had to infer because it wasn't in an image — do not silently invent.

Reproduce the attached images faithfully. When in doubt, ask.
