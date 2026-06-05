# Research: Discounts & Promotions

## Decision: Discount Engine Architecture

**Decision**: Build a pure server-side discount service (`discountService.js`) that:
1. Validates a promo code against existence, active status, date range, usage limits, and minimum order amount.
2. Computes the discount amount for a given subtotal + shipping cost.
3. Evaluates all eligible automatic offers and returns the single best discount.

**Rationale**: This is the simplest approach that satisfies Constitution §III (server authority). No external libraries needed — the logic is straightforward arithmetic with validation rules.

**Alternatives considered**:
- **Third-party promotion engine (e.g., Voucherify)**: Rejected — overkill for MVP; adds external dependency and cost.
- **Rule engine library (e.g., json-rules-engine)**: Rejected — adds unnecessary abstraction; our rules are simple and well-defined.
- **Client-side discount calculation**: Rejected — violates §III; client could manipulate discount amounts.

## Decision: Promo Code Data Model

**Decision**: Single `PromoCode` Mongoose model with `isAutomatic` flag and sparse `code` field.

**Rationale**: Manual codes and automatic offers share 100% of their validation and computation logic. Separating them into two collections would duplicate code without benefit.

**Alternatives considered**:
- **Separate `PromoCode` and `AutomaticOffer` collections**: Rejected — would duplicate models, validators, services, and admin endpoints.
- **PromoCode as embedded array in settings/config**: Rejected — loses queryability, indexing, and atomic usage count increments.

## Decision: Atomic Usage Count Increment

**Decision**: Increment `usageCount` inside the existing checkout MongoDB transaction using `findOneAndUpdate` with `$inc`.

**Rationale**: The checkout transaction already wraps stock decrement, order creation, payment recording, and cart clearing. Adding `$inc: { usageCount: 1 }` with a pre-check against `usageLimit` is a natural extension. MongoDB `$inc` is atomic even within transactions.

**Edge case**: If `usageLimit` is reached between validation (cart read) and checkout (transaction), the transaction aborts with a clear error. The customer sees "This promo code is no longer available" and can retry without the code.

## Decision: Rounding Strategy

**Decision**: Round percentage discounts using `Math.round(subtotal * percentage / 100)`.

**Rationale**: Standard commercial rounding (round half up). Integer minor units only — no fractional piasters ever stored or displayed.

**Example**: 10% off 499 EGP (49900 piasters) = 4990 piasters discount. Total = 44910 piasters.
