# NECKLINE — Architecture Decisions

Decision record for choices the Constitution requires before Phase 0 (§VI, §X, §XX).
Status: **ratified**. Changes here require a `/clarify` gate.

---

## AD-1. Stock-Decrement Strategy — Optimistic Locking

- Each `Product` carries `stockOnHand` (integer) and a `version` (integer) field.
- Committing stock uses a guarded, atomic compare-and-set:
  ```txt
  findOneAndUpdate(
    { _id, version, stockOnHand: { $gte: qty } },
    { $inc: { stockOnHand: -qty, version: 1 } }
  )
  ```
- If the update matches nothing (version moved or insufficient stock), the operation fails and the caller refetches + retries.
- **Guarantee:** two concurrent purchases of the final unit can never both succeed — the second fails the `version` / `$gte` guard. Overselling remains a Severity-1 bug (§6.1).

## AD-2. Cart Reservations — Enabled, via MongoDB TTL Collection

- Reservations are **enabled** and stored in a dedicated `reservations` collection:
  ```txt
  { _id, cartId, productId, qty, idempotencyKey, expiresAt }
  ```
- A **TTL index on `expiresAt`** auto-expires holds (default 15 min, configurable).
- **Availability is computed, not mutated:** `available = stockOnHand − Σ(active reservations for product)`. This is what the storefront shows and what add-to-cart checks.
- **Why this is clean:** when a reservation expires, MongoDB removes the document and availability recovers automatically — no sweeper job mutating stock, no risk of double-restoring. `stockOnHand` only ever changes on a real commit (AD-1).
- The reservation endpoint is **idempotent** via a unique index on `idempotencyKey`: re-POSTing the same key extends/confirms the same hold (§6.2).
- **On order capture:** the reservation converts to a committed decrement — `stockOnHand` is decremented via AD-1 and the reservation document is removed, in a single transaction so the two never diverge.

## AD-3. Idempotency Store — MongoDB TTL Collection

- `Idempotency-Key` → response mappings stored in an `idempotency_keys` collection with a TTL index (≥ 24h).
- Duplicate keys within the TTL return the original response without re-running side effects (§10.1).
- Covers order creation, payment finalization, and inventory mutations.

## AD-4. Durable Queues — MongoDB Jobs Collection

- Background jobs (emails, payment finalization, reconciliation) run on a MongoDB-backed `jobs` collection with status + retry tracking (§VII).
- Jobs are idempotent and retry-safe; no in-memory state.

---

### Deferred (introduce only on measured need — §I)
Redis, dedicated message brokers (RabbitMQ/SQS), and a separate search service are **not** part of the MVP. Each requires a documented justification before adoption.
