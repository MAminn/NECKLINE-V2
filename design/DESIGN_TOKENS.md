# NECKLINE — Design Tokens (Visual Baseline)

Extracted from the provided design images (`storefront/layout-website.png`, `storefront/product-details.png`, `Dashboard/`).
This is the authoritative visual baseline referenced by CONSTITUTION.md §2.1. Components consume these tokens — no ad-hoc values. Any change is a `/clarify` gate.

**Theme:** dark, luxury. Near-black warm background, vivid crimson-red as the single brand accent, white/cool-gray text. Storefront and admin dashboard share the same palette.

## Brand / Primary
| Token | Hex |
|---|---|
| Primary Red | `#E0242A` |
| Primary Red (hover) | `#FF2D34` |
| Success Green | `#22C55E` |
| Success Green (hover) | `#4ADE80` |
| Warning Amber | `#F59E0B` |
| Info Blue | `#3B82F6` |

## Accent
| Token | Hex |
|---|---|
| Live indicator (green) | `#22C55E` |
| Notification (red) | `#E0242A` |

## Neutral / Surfaces
| Token | Hex |
|---|---|
| Background (primary) | `#0B0D10` |
| Background (secondary) | `#111418` |
| Surface (tertiary) | `#1A1D22` |
| Surface (elevated) | `#23262D` |
| Border (subtle) | `#2F333B` |
| Border (strong) | `#3C4048` |
| Divider | `#24282F` |

## Text
| Token | Hex |
|---|---|
| Text (primary) | `#FFFFFF` |
| Text (secondary) | `#A1A1AA` |
| Text (tertiary) | `#71717A` |
| Text (muted) | `#52525B` |
| Text (disabled) | `#3F3F46` |
| Text (inverse) | `#0B0D10` |

## Semantic
Foreground colors: Success `#22C55E`, Error `#EF4444`, Warning `#F59E0B`, Info `#3B82F6`, each with a matching dark "background" tint (e.g. success bg `#052E16`). Verify the exact background tints against the palette image when implementing.

## Chart palette
Red `#E0242A`, Green `#22C55E`, Blue `#3B82F6`, Yellow `#F59E0B`, Purple `~#A855F7`, Cyan `~#06B6D4`.

## Typography (confirm exact families from the design source)
- **Display / headings:** heavy, condensed, uppercase grotesque (hero "WEAR YOUR NECKLINE", section titles). High contrast, tight tracking.
- **Body / UI:** clean neutral sans (Inter/Geist-style), regular weight, generous line-height.
- Headings are uppercase; body is sentence case. The exact font files should be taken from the design source, not guessed.

## Localization / currency (from dashboard)
- **Base currency: EGP** (Egyptian Pound). Currency switcher shows **EGP / USD / SAR** — confirms multi-currency (Constitution §5.1).
- Region/market: Egypt + GCC (top countries: Egypt, Saudi Arabia, Kuwait, UAE, Qatar). Timezone default **GMT+02:00 Cairo**.

## Reference screens on file
- Storefront home: `storefront/layout-website.png` — hero, Intimacy Collection grid, "Apply with intention" ritual steps (01–05), best-seller block, reviews.
- Product detail: `storefront/product-details.png` — gallery + main image, title/price, feature badges, quantity, Add to Cart / Buy It Now, shipping notes, How-to-use / Ingredients accordions, "You might also love", reviews.
- Admin dashboard: `Dashboard/` — see Phase 6 in ROADMAP.md for the page-by-page scope.
