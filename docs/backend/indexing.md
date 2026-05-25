# Indexing Standards

Adopted per Constitution §10.3 and Adoption Checklist §XX.

## Rules

1. Every query pattern used in a user-facing endpoint must have a documented index strategy.
2. Compound indexes should follow the ESR (Equality, Sort, Range) rule.
3. Text search indexes are non-authoritative (§10.4) — checkout correctness never depends on search state.
4. All indexes are defined in Mongoose schema files, not created ad-hoc.
5. `autoIndex` is enabled in development/test, disabled in production. Migrations handle production index creation.

## Current Indexes

### Product
- `{ category: 1, isActive: 1, deletedAt: 1 }` — catalog listing filter
- `{ tags: 1 }` — tag-based browsing

### AuditEvent
- `{ target: 1, targetType: 1, timestamp: -1 }` — audit trail queries
- `{ actor: 1, timestamp: -1 }` — actor activity queries

### FeatureFlag
- `{ name: 1 }` — unique lookup
- `{ scope: 1, enabled: 1 }` — scope-based filtering

### IdempotencyKey
- `{ key: 1 }` — unique lookup (TTL auto-managed)

## Deferred

Full index review and migration scripts will be finalized in Phase 1 (Product Catalog) when query patterns are confirmed.
