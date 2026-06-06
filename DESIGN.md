---
name: NECKLINE
description: Solid fragrance brand where darkness is the canvas, crimson is the only action, and gold is the maker's mark.
colors:
  primary: "#D21B27"
  primary-deep: "#B0151E"
  primary-hover: "#E32B37"
  gold: "#C29F68"
  bg: "#070606"
  surface: "#111111"
  surface-alt: "#0e0e0e"
  surface-input: "#0a0a0a"
  bg-secondary: "#1F0D0F"
  admin-bg: "#09090b"
  admin-surface: "#18181b"
  admin-surface-elevated: "#27272a"
  text-primary: "#FFFFFF"
  text-secondary: "#E7E5E4"
  text-tertiary: "#C0C0C0"
  text-muted: "#909090"
  text-inverse: "#070606"
typography:
  display:
    fontFamily: "Oswald, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Oswald, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.04em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "0.18em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
  sm: "3px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  12: "3rem"
  16: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  button-ghost-hover:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
  button-gold-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "7px 16px"
  product-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "0"
  input-field:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: NECKLINE

## 1. Overview: The Crimson Altar

**Creative North Star: "The Crimson Altar"**

The NECKLINE storefront is a ceremonial space. The near-black canvas (`#070606`) is not a dark mode — it is the product's permanent home. It does not toggle. Every spacing decision, every font weight, every hover treatment serves the same directive: let the visitor move through the space, not scan it. The product earns attention through restraint, not stimulation. A purchase is the end of a ritual, not a form submission.

The single point of light in this system is `#D21B27`, Altar Crimson. It fires only where action is required: the primary CTA, the star rating, the low-stock badge, the scrollbar thumb. Its scarcity is the mechanism. Beside it, `#C29F68`, Maker's Gold, marks craft and identity: label names on reviews, admin navigation links, the scent quiz badge. These two accents never appear on the same element. When they meet, one is wrong.

The darkness is warm, not cold. `bg-secondary` (`#1F0D0F`) carries a crimson undertone behind product images. The surface ramp (`#070606` → `#111111` → `#0e0e0e`) reads as carbon, not gray. Components have gentle surfaces — `radius-lg` (12px) on cards — but strict color logic. Intimacy without softness.

NECKLINE is built against three aesthetics by name: the Generic Shopify / DTC store (white grid, sale banners, cheerful checkout), the mass-market fragrance aesthetic (bright, pastel, promotional), and the SaaS / startup aesthetic (gradient blobs, feature cards, rounded pill CTAs, "seamless" copy). Any design choice that could belong in those categories is the wrong choice here.

**Key Characteristics:**
- Near-black (`#070606`) is the brand canvas. It does not lift to gray, warm-white, or off-black.
- One accent per element: Crimson signals action; Gold signals craft. They do not share an element.
- Oswald condensed grotesque for all product-identity text; Plus Jakarta Sans humanist for prose. Never reversed.
- Sharp-edged primary CTAs (`border-radius: 0`). Precision, not softness, on action elements.
- Nav links animate with a left-to-right crimson underline (`scaleX` on `::after`). No fill, no bg — only the line.
- Cards lift via border color shift to `rgba(210,27,39,0.35)` and a crimson reveal line at the bottom. No card fills shift.

---

## 2. Colors: The Sanctuary Palette

Two accents, one surface ramp. The palette is not diverse — it is precise.

### Primary

- **Altar Crimson** (`#D21B27`): The single action signal in the system. Used on primary CTAs, star ratings, low-stock badges, the crimson scrollbar thumb, the hero underline rule, the bottom-reveal line on product cards, and the hover underline on navigation links. Nowhere else. When Altar Crimson appears twice on the same screen in a non-structural role, one instance is an error.
- **Pressed Crimson** (`#B0151E`): The hover-down and hover state for primary buttons. Also the scrollbar thumb hover. Never used as a standalone brand color.
- **Lifted Crimson** (`#E32B37`): Hover-up state only. Never used in resting UI.

### Secondary

- **Maker's Gold** (`#C29F68`): Marks craft, identity, and admin-surface accents. Used on the scent quiz badge label, admin nav links, the "Dashboard" header link, and the "Join" gold button background. Warm yellow-ochre, not bright brass. Forbidden alongside Crimson on the same interactive element.

### Neutral — Surfaces

- **Sanctuary Black** (`#070606`): Root background. The brand's home. Not swappable for `#000000` or any warm-neutral.
- **Warm Dark** (`#1F0D0F`): Product image area background. Carries a faint crimson warmth; prevents images from floating on pure black.
- **First Lift** (`#111111`): Primary surface elevation — cards, panels, product listing backgrounds.
- **Recessed Surface** (`#0e0e0e`): Secondary surface variant; alternate card surface. Used when a surface needs to feel pressed, not lifted.
- **Input Black** (`#0a0a0a`): Form inputs and search fields. Near-invisible bottom, forcing the border to carry the field definition.
- **Admin Canvas** (`#09090b`): Admin-only base surface. Cooler and darker than storefront black.
- **Admin Panel** (`#18181b`): Admin sidebar and card surfaces. Zinc-tinted.
- **Admin Elevated** (`#27272a`): Admin dropdown surfaces, elevated admin modals.

### Neutral — Text

- **Ink** (`#FFFFFF`): Primary text. Used for product names, prices, headings, high-emphasis labels.
- **Soft Ink** (`#E7E5E4`): Secondary text. Descriptions, secondary labels, nav items at rest.
- **Pale Ink** (`#C0C0C0`): Tertiary text. Muted supporting copy.
- **Ghost Ink** (`#909090`): Lowest readable text. Meta, timestamps, placeholder prefixes. Do not use below this on `#070606` — the contrast approaches 4.5:1 minimum.
- **Inverse Ink** (`#070606`): Text on Maker's Gold buttons only.

### Named Rules

**The One Voice Rule.** Altar Crimson appears on at most one prominent element per visual area. Its rarity is the mechanism; its overuse collapses the hierarchy.

**The No-Cream Rule.** No warm-neutral surface (beige, sand, parchment, off-white) appears anywhere in the system. The warmth lives in the crimson undertone of `bg-secondary` and the gold of Maker's Gold, not in a background tint.

**The No-Split Rule.** Crimson and Gold never appear on the same interactive element — not in the same button, not in the same badge, not in the same link treatment. They operate in separate channels.

---

## 3. Typography: The Condensed Voice

**Display Font:** Oswald (with Arial Narrow, system-ui as fallback)
**Body Font:** Plus Jakarta Sans (with system-ui, sans-serif as fallback)
**Accent / Serif:** Cinzel (with Georgia, serif — decorative only, sparingly)
**Mono:** System monospace stack (ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas)

**Character:** Oswald is compressed and industrial — every character earns horizontal space by being narrow. This makes product names feel branded, not just labeled. Plus Jakarta Sans is the opposite: open, warm, generous. The contrast between them creates the system's interior temperature: cold precision for identity, human warmth for body. Cinzel appears only for small decorative flourishes (the verified star, the quiz badge "Quiz" label) — it signals luxury provenance without dominating.

### Hierarchy

- **Display** (Oswald 500, `clamp(2.25rem, 6vw, 4rem)`, `line-height: 1.0`, `letter-spacing: -0.02em`): Hero headings only. Always uppercase. Never exceeds 4rem at any viewport — the brand whispers, it does not shout.
- **Headline** (Oswald 700, `clamp(1.5rem, 3vw, 2.25rem)`, `line-height: 1.1`, `letter-spacing: 0.04em`): Section headings, product names in catalog, admin page titles. Always uppercase.
- **Title** (Plus Jakarta Sans 500, `1.125rem`, `line-height: 1.3`): Sub-section titles, sidebar panel headers. Sentence case.
- **Body** (Plus Jakarta Sans 400, `1rem`, `line-height: 1.5`): All prose. Hero descriptions, product descriptions, review copy, form help text. Cap line length at 65ch for storefront, 72ch for admin prose.
- **Label** (Plus Jakarta Sans 500, `0.75rem`, `line-height: 1.0`, `letter-spacing: 0.18em`, uppercase): Category tags, meta labels, nav items, field labels, badge text. The system's workhorse at the smallest scale.
- **Mono** (system monospace, `0.75rem`, `line-height: 1.5`): Data, timestamps, tracking numbers, price meta, verified badges, loading indicators ("Calibrating sensory feedback loop..."). Used in the admin and in storefront micro-copy where precision matters.

### Named Rules

**The Uppercase Gate.** Oswald is always uppercase in use. Plus Jakarta Sans is never all-caps beyond Label-scale elements (≤4 words, ≤0.75rem). All-caps Plus Jakarta Sans at body size is unreadable and breaks brand personality.

**The Condensed Rule.** Oswald letter-spacing is -0.02em on display scale and 0.04em on headline scale. Do not tighten below -0.04em (letters touch) and do not loosen above 0.3em (the wide tracking belongs to Label only).

---

## 4. Elevation: Tonal Descent

The system is near-flat. Depth is expressed primarily through surface-layer stepping, not shadow. A surface that needs to appear "above" another uses a token one step lighter in the ramp (`surface-alt` → `surface` → `admin-surface-elevated`), never through a fill jump to gray.

Shadows exist but are deeply black — they are invisible on the brand canvas until a surface lifts into them. The one exception is the crimson glow shadow on interactive focus states, which introduces warmth as the only shadow with chromaticity.

### Shadow Vocabulary

- **Ambient** (`0 1px 2px rgba(0,0,0,0.4)`): Almost invisible; used on small elements like badges and chips where a hairline separation from the background is needed.
- **Card** (`0 4px 12px rgba(0,0,0,0.45)`): Default resting shadow for product cards and admin panels. Subtle; the border carries more visual weight.
- **Lifted** (`0 12px 32px rgba(0,0,0,0.55)`): Modal dialogs, cart drawer, full-page overlays. Signals a layer well above the canvas.
- **Crimson Glow** (`0 4px 20px rgba(210,27,39,0.3)`): Applied on hover states for primary actions and the hero CTA button. The only warm shadow; it signals that Crimson is live.
- **Focus Ring** (`0 0 0 3px rgba(210,27,39,0.45)`): Keyboard focus indicator. Crimson, offset 0, spread 3px. Applied to all inputs and interactive elements on `:focus-visible`.

### Named Rules

**The Dark Shadow Rule.** Shadows are black-alpha, not colored, except for the Crimson Glow. No blue-tinted, purple-tinted, or material-style shadows. The shadow must be invisible at rest and barely visible on lift.

**The Border-First Rule.** Product cards and admin panels signal hover through border color change (to `rgba(210,27,39,0.35)`) before deploying shadow. The shadow may accompany, but the border leads.

---

## 5. Components: Warm but Precise

Components have gentle surfaces (radius-lg on cards) but strict color logic. No component is decorative; every element has a function.

### Buttons

Three variants: Primary (action), Ghost (secondary), and Gold (header-scale identity).

- **Shape:** Sharp-edged (`border-radius: 0`) on Primary and Ghost. This is non-negotiable for both — the sharp edge signals exactness, not brutality. Gold variant also sharp-edged.
- **Primary:** Altar Crimson fill (`#D21B27`), white text, `padding: 16px 32px`, uppercase label-scale text (0.75rem, tracking 0.25em, semibold). Hover state shifts to Pressed Crimson (`#B0151E`) and translates up 2px (`-translate-y-0.5`).
- **Ghost / Outline:** Transparent fill, `border: 1px solid rgba(255,255,255,0.13)` at rest, `text-stone-300`. On hover: border shifts to `rgba(255,255,255,1)`, text to white, same translate-up. Used as the secondary hero CTA ("Our Story").
- **Gold (header):** Maker's Gold fill (`#C29F68`), inverse text (`#070606`), `padding: 7px 16px`. Compact; sized for the 40px header strip. Represents membership and brand affiliation, not action urgency.
- **Focus:** All buttons receive the crimson focus ring on `:focus-visible`.

### Cards / Containers

- **Corner Style:** 12px radius (`radius-lg`) on product cards and admin panels.
- **Background:** First Lift (`#111111`) for storefront product cards; Admin Panel (`#18181b`) for admin cards.
- **Border:** `rgba(255,255,255,0.08)` at rest. On hover, shifts to `rgba(210,27,39,0.35)`. The border is the primary hover signal; shadow is secondary.
- **Shadow Strategy:** Card shadow (`0 4px 12px rgba(0,0,0,0.45)`) at rest. On hover, expands to `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(210,27,39,0.15)`.
- **Hover Animation:** Cards translate up 2px (`-translate-y-0.5`) on hover.
- **Signature Detail:** A 2px crimson line (`bg-primary`) scales from 0 to 100% width along the bottom edge of each product card on hover, using `scaleX(0) → scaleX(1)` with `transform-origin: left`.
- **Image:** Product images are `aspect-square`, object-cover. On card hover, image scales to 1.06x with a 500ms ease.
- **Internal Padding:** 16px (`space-4`) inside the content section below the image.

### Inputs / Fields

- **Style:** Near-black fill (`#0a0a0a`), `1px solid rgba(255,255,255,0.13)` border, 12px radius.
- **Focus:** Border shifts to Altar Crimson (`#D21B27`); focus ring `0 0 0 2px rgba(210,27,39,0.18)` activates. No fill shift.
- **Placeholder:** `#909090` (Ghost Ink). Do not go lighter — placeholder contrast against input-black is critical.
- **Field Label:** Label-scale Plus Jakarta Sans (0.75rem, 500, 0.18em tracking, uppercase), `#C0C0C0`. Always above the input, never placeholder-only.
- **Error State:** Border stays crimson; an `.alert-error` block appears below with `rgba(239,68,68,0.1)` bg and `rgba(239,68,68,0.2)` border.

### Navigation

- **Desktop:** Fixed header, near-black translucent bg (`rgba(7,6,6,0.96)` + `backdrop-filter: blur`), z-index 1100. Nav links are Label-scale Plus Jakarta Sans, uppercase, white at rest. Hover: crimson `::after` underline animates left-to-right via `scaleX`. Admin "Dashboard" link is Maker's Gold with a gold underline at rest.
- **Mobile:** Full-screen fixed overlay (`z-[1150]`), solid `#070606` background, body scroll locked. Nav links are display-scale Oswald, uppercase, `clamp(26px, 7vw, 38px)`. Hover triggers gold color shift and a sliding `ArrowRight` icon reveal. Auth section is pinned to the bottom of the overlay.
- **Active State:** No separate active color; the current page is inferred from context. The underline treatment marks hover only.

### Cart Drawer (Signature Component)

The cart drawer is a full-right-edge panel: `z-[1300]` (above modal layer), width `max-w-sm`, `bg-surface` (`#111111`) fill, slides in from the right. A separate backdrop at `z-[1200]` dims the page. The drawer stacks above the sticky navbar (z-1100), not below it.

Internal layout: sticky header with "Your Order" title + item count + close button; scrollable line-item list; sticky footer with subtotal, promo input, and checkout CTA. The checkout CTA follows the Primary button treatment in full width.

### Review Card (Signature Storefront Component)

Used in the marquee section. `280px` narrow, `border-radius: 16px` (`radius-xl`). Background `rgba(255,255,255,0.02)` — near-invisible, defined only by the border `rgba(255,255,255,0.05)`. On hover: border shifts to `rgba(210,27,39,0.3)`, subtle crimson shadow. A product name badge appears top-right: small-caps, crimson tint bg (`rgba(210,27,39,0.1)`), crimson text. Star ratings use Altar Crimson fills.

---

## 6. Do's and Don'ts

### Do:

- **Do** use `#070606` as the root background — always. Not `#000000`, not `#0a0a0a`, not any warm-neutral tint.
- **Do** reserve Altar Crimson (`#D21B27`) for the primary action signal. One CTA, one accent line, one badge per visual area — then stop.
- **Do** use Maker's Gold (`#C29F68`) exclusively on identity and craft surfaces: admin nav links, the membership CTA, label text on luxury-tier elements.
- **Do** sharp-edge all primary CTAs (`border-radius: 0`). The join button, the "Shop Now" button, the "Write a Review" button, the checkout CTA.
- **Do** use Oswald in uppercase for all product names, section headings, and hero text.
- **Do** use Plus Jakarta Sans for all body copy, descriptions, and form text.
- **Do** implement the focus ring (crimson, `0 0 0 3px rgba(210,27,39,0.45)`) on every interactive element — the dark canvas makes focus states invisible without it.
- **Do** animate the cart drawer and mobile menu with opacity + translate transitions behind `prefers-reduced-motion: reduce` (collapse to instant).
- **Do** test placeholder text contrast — Ghost Ink (`#909090`) on Input Black (`#0a0a0a`) is near the 4.5:1 WCAG floor. Do not go lighter.

### Don't:

- **Don't** use a white, cream, sand, beige, or parchment background anywhere — not even for admin surfaces. The whole warm-neutral band is explicitly rejected. If you need a lighter surface, use admin-surface-elevated (`#27272a`).
- **Don't** place Crimson and Gold on the same interactive element. Not in the same button, not in the same badge, not in the same link treatment.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or callouts. There are no side-stripe accents in this system.
- **Don't** apply `background-clip: text` with a gradient. All text uses a single solid color.
- **Don't** round primary action buttons. `border-radius: 0` is required on `button-primary`, `button-ghost`, and `button-gold`. Rounding signals "friendly app," not luxury ritual.
- **Don't** add an uppercase eyebrow label above every section heading. NECKLINE uses Oswald headings directly — the font IS the kicker. A second eyebrow above it is redundant scaffolding.
- **Don't** use Glassmorphism decoratively. The header's `backdrop-blur` is functional (readability over hero images). Glass cards are forbidden.
- **Don't** build the hero with a metric template (big number, small label, gradient accent). The hero is sensory, not statistical.
- **Don't** write copy that sounds like a SaaS product: no "seamless," "next-generation," "enterprise-grade," or "world-class." Copy is close and specific: name the scent, name the sensation, name the body part.
- **Don't** use identical card grids where every card is the same size with the same icon + heading + text pattern. NECKLINE's product grid is image-forward. Admin data tables use rows, not cards.
- **Don't** animate CSS layout properties. Translate, scale, opacity, and clip-path only.
- **Don't** let Cinzel appear in any structural role. It is a decorative accent (the quiz badge "Quiz" label, verification star glyphs). One or two instances per page maximum.
