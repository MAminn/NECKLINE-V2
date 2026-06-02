# Research: Checkout & Orders

**Feature**: Checkout & Orders (Phase 4)  
**Date**: 2026-05-25

---

## Decision: Payment Adapter Pattern (Stub Provider)

**Decision**: Implement a `PaymentProvider` interface with a `StubPaymentProvider` concrete class.

**Rationale**:
- The ROADMAP locks "provider-agnostic checkout" as a foundational decision.
- A well-defined interface makes the Phase 5 real processor integration a drop-in replacement.
- The stub provider enables full end-to-end testing without external API keys or network dependencies.

**Interface shape** (TypeScript-style for clarity):
```
interface PaymentProvider {
  createPaymentIntent(order: Order): Promise<PaymentIntent>;
  confirmPayment(intentId: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}
```

**Alternatives considered**:
- Direct integration with Stripe now — rejected because processor choice is deferred to Phase 5 per ROADMAP.
- No abstraction (inline stub logic) — rejected because it complicates the Phase 5 migration.

---

## Decision: Atomic Order Creation + Stock Decrement

**Decision**: Use MongoDB transactions (Mongoose `startSession`) to wrap order creation, stock decrement, and reservation cleanup in a single atomic unit.

**Rationale**:
- Constitution §VI mandates atomic stock mutations; overselling is Severity-1.
- ARCHITECTURE.md AD-1 specifies optimistic locking (`version` + `$gte` guard).
- A transaction ensures that if any step fails (stock gone, DB error), nothing is persisted — no partial orders, no incorrect inventory.

**Transaction flow**:
1. Start session + transaction
2. Attempt stock decrement per line item (optimistic locking)
3. If any decrement fails → abort transaction, return out-of-stock error
4. Create Order document with line item snapshots
5. Create PaymentTransaction record
6. Delete cart reservations
7. Clear cart
8. Commit transaction

**Alternatives considered**:
- Saga pattern with compensations — overkill for MVP; MongoDB transactions are sufficient.
- Two-phase commit — unnecessary complexity; single-document atomic updates handle it.

---

## Decision: Feature Flag Implementation

**Decision**: Environment-variable gate (`CHECKOUT_ENABLED`) checked by middleware on checkout/order routes.

**Rationale**:
- Constitution §XIV requires kill switches on risky flows.
- Simplest operational approach: flip an env var, restart API (or use a lightweight config reload).
- No external feature-flag service needed for MVP.

**Behavior when disabled**:
- `POST /checkout` and `POST /orders` return `503 Service Unavailable` with `{ message: 'Checkout is temporarily unavailable' }`.
- Frontend hides checkout CTA and shows "Coming soon" or redirects.

---

## Decision: Order Number Generation

**Decision**: `NECK-{timestamp}-{random}` format (e.g., `NECK-1716640000-a3f9`).

**Rationale**:
- Human-readable prefix for brand identity.
- Timestamp + random suffix provides uniqueness without a centralized counter.
- No additional collection or counter document needed.
- Collision probability is negligible for MVP scale (~100 orders/day).

**Alternatives considered**:
- Sequential counter (`NECK-000001`) — requires atomic counter collection; adds complexity.
- UUID only — not human-friendly for customer service.

---

## Decision: Idempotency Key Storage

**Decision**: Reuse the existing `IdempotencyKey` MongoDB TTL collection from Phase 0.

**Rationale**:
- ARCHITECTURE.md AD-3 already defines the idempotency store.
- No new infrastructure needed.
- TTL index auto-cleans old keys.

**Key scope**: `POST /api/v1/orders` (order creation endpoint).

---

## Decision: Phone Number Validation

**Decision**: Basic format validation only (E.164-style: optional `+` followed by 8-15 digits). No SMS verification in MVP.

**Rationale**:
- The spec requires phone collection for shipping coordination.
- Egypt mobile numbers are 11 digits starting with `01`; GCC numbers vary.
- E.164 is the international standard and covers all target markets.
- SMS verification is a Phase 7 enhancement.
