# Research: Guest Shopping Cart

**Date**: 2026-05-25
**Feature**: Guest Shopping Cart

## Decisions

### Cart Persistence Strategy
- **Decision**: Server-side MongoDB document referenced by `cartId` cookie. No localStorage required.
- **Rationale**: Server must be authoritative for all cart state (Constitution §III). Client-side cache would create reconciliation complexity. Cookie-based cart ID is simple, works across subdomains, and survives browser restart.
- **Alternatives considered**: Pure localStorage (rejected — server cannot validate stock/price); JWT token with cart claims (rejected — overkill for guest cart, cookie is simpler).

### Reservation Data Model
- **Decision**: One `Reservation` document per `(cartId, productId)` pair, updated in place.
- **Rationale**: Simplifies availability queries (`sum(qty) group by productId`). Avoids orphan accumulation. TTL index on `expiresAt` handles cleanup automatically.
- **Alternatives considered**: One reservation per add operation with idempotency key as document key (rejected — complicates availability aggregation and requires periodic compaction).

### Cart-Reservation Consistency
- **Decision**: Cart and reservation updates are performed in the same service call, sequentially. If reservation fails, cart update is not committed.
- **Rationale**: MongoDB transactions add overhead and require replica set configuration. Sequential updates with error rollback (manual delete-on-failure) is sufficient for MVP load. If cart update succeeds but reservation fails, the cart service deletes the cart line item to maintain consistency.
- **Alternatives considered**: MongoDB multi-document transactions (rejected — not justified by measured need, §I).

### Availability Calculation
- **Decision**: `available = product.stockOnHand - sum(reservations.qty for productId) + currentCartReservation.qty`
- **Rationale**: When a cart adds/updates a product, its own reservation must not block itself. The formula subtracts all OTHER cart reservations from stock, then compares against the desired total quantity.
- **Edge case**: If the cart has no existing reservation for this product, `currentCartReservation.qty = 0`.

### Rate Limiting
- **Decision**: Express-rate-limit per cart ID cookie for cart mutation endpoints.
- **Rationale**: Lightweight, no external dependencies. Constitution §4.4 mandates rate limiting on public endpoints.
- **Alternatives considered**: Token bucket via MongoDB (rejected — unnecessary complexity for MVP).
