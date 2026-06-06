# Product

## Register

brand

## Users

**Storefront:** Egyptian consumers (18-35) discovering or repurchasing a luxury solid perfume brand online. They shop on mobile, often late at night, drawn in through social. They want to feel something before they buy — the scent can't reach them through a screen, so the interface has to.

**Admin:** A single store owner (or small team) managing inventory, orders, and content. They need clarity and speed; every extra click costs real time.

## Product Purpose

NECKLINE is a solid fragrance brand selling a concentrated scent that melts at your pulse points. The storefront's job is to translate a sensory, skin-close product into a digital experience that earns trust and desire. The admin's job is to remove friction from daily operations so the owner can focus on the product.

## Brand Personality

Dark · Intimate · Ritual

The brand voice is close and deliberate: not a performance, a private act. Copy is sparse and specific. The interface behaves like a curated space, not a store — you move through it rather than scan it.

## Anti-references

- **Generic Shopify / DTC store:** white background, product grid, basic serif, sale banners. Looks like everything else.
- **Mass-market fragrance (Bath & Body Works style):** bright, pastel, friendly, promotional, cheerful. The opposite of what NECKLINE is.
- **SaaS / startup aesthetic:** gradient blobs, feature cards, rounded pill CTAs, benefit lists, "enterprise-grade" or "seamless" copy. Zero brand soul.

## Design Principles

1. **The scent must be felt through the screen.** Every layout choice, font weight, and hover state should evoke something tactile — warmth, skin, smoke, wax. Not through decoration, but through restraint and texture.
2. **Ceremony over transaction.** A purchase is the culmination of a ritual, not a form submission. Progress should feel earned, not rushed.
3. **Dark is the brand, not the mode.** The black background is not a theme toggle. It is the product's home. Everything else is layered on top of it.
4. **One accent at a time.** Crimson (#D21B27) signals action. Gold (#C29F68) signals craft and label. They never compete on the same element.
5. **Admin clarity is also a brand expression.** A chaotic backend undermines confidence in the product. The admin surfaces the same restraint at a different register: fast, uncluttered, functional.

## Accessibility & Inclusion

- Target WCAG 2.1 AA for the storefront.
- Dark backgrounds require vigilant contrast checks on body copy and muted labels — the most common failure point.
- All interactive elements keyboard-navigable.
- Motion behind `prefers-reduced-motion` media query.
- Arabic RTL not currently in scope but do not bake in LTR-only assumptions (padding direction, text alignment).
