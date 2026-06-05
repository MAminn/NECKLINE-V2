# NECKLINE — Design Tokens (Visual Baseline)

Extracted directly from the Neckline source code (`src/index.css`, `src/components/**/*.tsx`).
This is the authoritative visual baseline referenced by CONSTITUTION.md §2.1. Components consume these tokens — no ad-hoc values. Any change is a `/clarify` gate.

**Theme:** dark luxury. Near-black warm background (`#070606`–`#0A0203`), vivid crimson-red as the single brand accent (`#D21B27`), white/cool-gray text. Storefront and admin dashboard share the same palette.

---

## Brand / Primary

| Token | Hex | Usage |
|---|---|---|
| Brand Red | `#D21B27` | Primary CTA, accent icons, borders, active states |
| Brand Red (hover) | `#E32B37` | Button hover on storefront CTAs |
| Brand Red (pressed) | `#B0151E` | Button active / admin destructive hover |
| Brand Red (glow shadow) | `rgba(210,27,39,0.3)` | `hover:shadow-[0_4px_20px_...]` on CTAs |
| Gold Accent | `#C29F68` | Secondary decorative accent (css var `--color-gold`) |

---

## Neutral / Surfaces (Storefront)

| Token | Hex | Usage |
|---|---|---|
| Background primary | `#070606` | Main page background, section backgrounds |
| Background deep | `#0A0203` | Deepest dark (css var `--color-brand-dark`) |
| Background secondary | `#1F0D0F` | Warm dark tint (css var `--color-brand-secondary`) |
| Surface card | `#090909` | Card/container backgrounds |
| Surface card alt | `#0a0607` | Product card backgrounds |
| Surface input | `#040404` | Feature strip / pill backgrounds |
| Surface overlay | `black/40` | Cart drawer input fields |

---

## Neutral / Surfaces (Admin Dashboard)

| Token | Tailwind / Hex | Usage |
|---|---|---|
| Admin background | `zinc-950` / `#09090b` | Main dashboard background, sidebar |
| Admin surface | `zinc-900` / `#18181b` | Topbar segments, secondary buttons |
| Admin surface elevated | `zinc-800` / `#27272a` | Hover states |
| Admin border | `white/[0.05]` | Sidebar border-right, card borders |
| Admin border subtle | `white/[0.04]` | Inner card dividers |
| Admin border strong | `white/[0.08]–white/20` | Input focus rings, hover borders |
| Login overlay | `#090203` | Full-screen login background |
| Login card | `zinc-950/60` | Glassmorphism login card |

---

## Text

| Token | Hex / Tailwind | Usage |
|---|---|---|
| Text primary | `#FFFFFF` / `stone-100` | Headings, primary content |
| Text secondary | `stone-200` / `stone-300` | Body copy, card text |
| Text tertiary | `neutral-400` | Labels, metadata, breadcrumbs |
| Text muted | `neutral-500` | Placeholders, disabled labels |
| Text disabled | `stone-700` | Divider dots, faint separators |
| Brand text | `#D21B27` | Active nav items, prices, highlights |
| Live indicator | `emerald-400` / `emerald-500` | "LIVE" badge, ping animation |
| Warning/alert text | `amber-500` | Interface tab icon |

---

## Border & Divider

| Token | Value | Usage |
|---|---|---|
| Card border default | `white/[0.05]` | Product cards, admin cards |
| Card border hover | `[#D21B27]/25–35` | Storefront card hover state |
| Input border default | `white/5` | Form inputs |
| Input border focus | `[#D21B27]` | Focused input ring |
| Section divider | `white/[0.06]` | Horizontal/vertical grid dividers |
| Admin sidebar border | `white/[0.05]` | `border-r` on sidebar |

---

## Semantic / Status

| State | Foreground | Background tint | Border |
|---|---|---|---|
| Error | `red-500` / `#EF4444` | `red-500/10` | `red-500/20` |
| Success / Live | `emerald-400` / `emerald-500` | — | — |
| Warning | `amber-500` | — | — |
| Info | `blue-500` / `#3B82F6` | — | — |
| Brand alert | `[#D21B27]` | `[#D21B27]/10` | `[#D21B27]/20` |

Customer avatar badges (deterministic by name hash):
- `bg-red-500/15 text-red-500 border border-red-500/20`
- `bg-indigo-500/15 text-indigo-400 border border-indigo-500/10`
- `bg-emerald-500/15 text-emerald-400 border border-emerald-500/10`
- `bg-amber-500/15 text-amber-400 border border-amber-500/10`
- `bg-sky-500/15 text-sky-400 border border-sky-500/10`

---

## Typography

Three font families defined in `src/index.css` via `@theme`:

| Role | Family | CSS Var | Class |
|---|---|---|---|
| Body / UI | Plus Jakarta Sans | `--font-sans` | default (`font-sans`) |
| Display / headings | Oswald | `--font-display` | `font-display` |
| Serif / decorative | Cinzel | `--font-serif` | `font-serif-neckline` |

**Usage patterns extracted from components:**
- Section labels / eyebrows: `text-[10px] tracking-[0.3em] font-extrabold uppercase font-mono text-[#D21B27]`
- CTA buttons: `text-[9.5px]–text-[11px] tracking-[0.2em] font-extrabold uppercase`
- Sidebar nav: `text-xs tracking-widest uppercase`
- Metadata / timestamps: `text-[9px]–text-[10px] font-mono tracking-widest text-neutral-400`
- Body copy: regular weight, `stone-200`–`stone-300`, sentence case
- Headings are **uppercase**; body is sentence case

---

## Spacing & Shape

| Token | Value | Usage |
|---|---|---|
| Card radius | `rounded-2xl` | Product cards, admin cards, modals |
| Button radius (storefront) | `rounded-[3px]` / `rounded-sm` | Storefront CTA buttons |
| Button radius (admin) | `rounded-lg` / `rounded-xl` | Admin form buttons |
| Input radius | `rounded-lg` | Form inputs |
| Pill / badge radius | `rounded` | Coupon codes, status badges |
| Section padding | `py-24` | Full-width sections |
| Card padding | `p-4`–`p-8` | Product/admin cards |

---

## Animation & Motion

All defined in `src/index.css`:

| Name | Class | Behaviour |
|---|---|---|
| Glow pulse | `.animate-pulse-glow` | 6s ease-in-out, brand red glow cycles |
| Slow spin | `.animate-spin-slow` | 20s linear infinite (stamp circle) |
| Marquee scroll | `.animate-marquee` | 45s linear infinite, pauses on hover |
| Intense pulse | `.animate-pulse-intense` | 4s ease-in-out, opacity 0.15→0.4 |
| Ping (live dot) | `animate-ping` (Tailwind) | emerald-400, live session indicator |

Scroll bar: 6px wide, `#D21B27` thumb, `#B0151E` on hover, `--color-brand-dark` track.

---

## Localization / Currency

- **Base currency: EGP** (Egyptian Pound) — all product prices are in EGP
- Currency display suffix: `EGP` (e.g. `500 EGP`)
- **Note:** `CartDrawer.tsx` currently labels totals with `$` and uses a `$50` free-shipping threshold against EGP prices — this is a known bug to fix during porting
- Region/market: Egypt (Cairo default) + GCC
- Timezone default: **GMT+02:00 Cairo**

---

## Chart Palette (Admin Analytics)

`#D21B27` (red), `#22C55E` (green), `#3B82F6` (blue), `#F59E0B` (yellow), `~#A855F7` (purple), `~#06B6D4` (cyan)

---

## Reference Files

| File | Contents |
|---|---|
| `src/index.css` | `@theme` CSS vars, font imports, custom animations |
| `src/components/Hero.tsx` | Hero carousel, slide structure |
| `src/components/Collection.tsx` | Product grid cards |
| `src/components/AdminPortal.tsx` | Full admin sidebar, topbar, login overlay |
| `src/components/CartDrawer.tsx` | Cart panel, checkout form |
| `src/components/ShopPage.tsx` | Shop filter/sort UI, product cards |
