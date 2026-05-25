# NECKLINE — Open Questions (RESOLVED 2026-05-25)

> **Status: both resolved.**
> - **Q1 → Option A (flat products).** Each product is a single purchasable item (own SKU/price/stock); no Variant entity. Applied across CONSTITUTION §5.3/§5.4, ROADMAP (locked decisions, Phase 1, Phase 2), ARCHITECTURE (AD-1/AD-2), and the Phase 1 `/specify` prompt.
> - **Q2 → Option A (dedicated phase).** Added **Phase 4.5 — Discounts & Promotions** to ROADMAP, before Payment; admin management UI stays in Phase 6 → Offers.
>
> Kept below as the decision record.

---

Two decisions surfaced by the provided design images conflicted with or were missing from the roadmap/constitution. Both are now settled (see status above); they changed the core data model and the phase plan.

---

## Q1 — Catalog data model: flat products or Product → Variants? (BLOCKS Phase 1)

**The conflict.** ROADMAP + CONSTITUTION (§5.1, §5.3) assume **Product → many Variants**, where each variant (scent, size) owns its own price/SKU/stock. But the design images suggest a **flatter** model:

- **Products table** shows *one row per product* with a *single* SKU, price, and stock value — not a product expanding into multiple variant rows.
- **Size is baked into the product name** ("RED CHAPTER 30g", "MIDNIGHT TIN 15g", "PULSE — TWIN 2×8g DUO PACK"), not selected as a variant.
- **Product detail page** shows a quantity stepper but **no visible scent/size variant selector**.

**Why it matters.** This is the foundational schema every later phase builds on (cart keys, reservations, order snapshots, admin CRUD). Choosing wrong means a migration later. The optimistic-locking + reservation design works either way, but the *unit* it locks (product vs. variant) must be decided now.

**Options:**
- **A — Flat products (1 SKU each).** Each size/scent is its own product row, exactly as the table shows. Simplest; matches the images as-is. Drop the variant selector from the PDP. Cart/orders key on `productId`.
- **B — Product → Variants (current assumption).** Keep the richer model; the PDP needs a scent/size selector that updates price/stock. **This adds UI not present in the provided design → a §2.1 deviation that itself needs sign-off.**
- **C — Hybrid.** Flat catalog now (Option A) but keep a nullable `variantOf`/grouping field so related sizes can be grouped later without a hard migration.

**Recommendation:** **A or C.** Build to what the design actually shows (flat), and if future grouping is likely, take C to keep the door open cheaply. Reserve B only if you genuinely want an on-page variant picker — which means commissioning that UI.

---

## Q2 — Offers / Promo-codes engine: where does it live? (NEW scope)

**The gap.** The dashboard has a top-level **Offers** section with two sub-pages — **Promo Codes** (customer-entered codes: percentage / fixed / free-shipping, min order, usage limits, expiry, status) and **Campaigns** (auto-applied offers, homepage banners, customer segments). The current 8-phase roadmap has **no discounting at all**.

**Why it matters.** Discounts are **money**, so they fall under the server-authoritative + audit rules (§III, §XII). A promo code must be validated and the discount **computed server-side** at cart/checkout time — the client may only send the code string, never the discount amount. So the engine spans two concerns:

- **Application/validation logic** (server-authoritative pricing) → belongs with **cart/checkout (Phase 2/4)**.
- **Management UI** (create/edit codes & campaigns, usage analytics) → belongs in the **Admin Dashboard (Phase 6)**.

**Options:**
- **A — Dedicated phase** (e.g. new "Phase 4.5 — Discounts & Promotions") that ships the discount domain model + server-side application, then the admin UI references it. Cleanest separation.
- **B — Fold in:** application logic into Phase 4 (Checkout) pricing, management UI into Phase 6. No new phase, but Phase 4 and 6 each grow.
- **C — Defer to post-MVP.** Launch without discounts; add the engine after Phase 7.

**Recommendation:** **A** if promos are a launch requirement (a dedicated phase keeps the money-critical discount logic isolated and properly `/clarify`+`/analyze` gated); **C** if you can launch without them. Avoid B — it scatters money logic across two phases.

---

### To move forward
Answer **Q1** (A / B / C) and **Q2** (A / B / C). Q1 unblocks the Phase 1 `/specify`; Q2 determines whether the roadmap gains a phase before you start coding.
