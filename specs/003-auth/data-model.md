# Data Model: Auth & Accounts

**Date**: 2026-05-25 | **Phase**: 1

## New Entities

### User

Represents a registered account holder.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | Primary key | |
| `name` | String | Required, trimmed, max 100 chars | Display name |
| `email` | String | Required, unique, lowercase, indexed | Unique identifier |
| `passwordHash` | String | Required, min 60 chars | bcrypt hash |
| `role` | String | Enum: `customer`, `admin`; default `customer` | |
| `emailVerified` | Boolean | Default `false` | Not enforced for login in this phase |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

**Indexes**:
- `email`: unique, sparse
- `role`: for admin lookups

**Relationships**:
- One-to-one with Cart (via `Cart.userId`)
- One-to-many with RefreshToken
- One-to-many with Order (Phase 4)

---

### RefreshToken

Server-tracked session token. One per active device/session.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | Primary key | |
| `userId` | ObjectId | Required, indexed, ref: User | |
| `tokenHash` | String | Required, unique, indexed | SHA-256 hash of the raw token |
| `issuedAt` | Date | Required | |
| `expiresAt` | Date | Required, indexed (TTL) | 7 days from issue |
| `revoked` | Boolean | Default `false` | |
| `revokedAt` | Date | Optional | When revoked |
| `revokedReason` | String | Optional | e.g., "logout", "password_change", "suspicious_activity" |
| `userAgent` | String | Optional | Fingerprint for session list |
| `ipAddress` | String | Optional | Audit trail |
| `createdAt` | Date | Auto | |

**Indexes**:
- `userId`: for "revoke all" queries
- `tokenHash`: unique, for lookup during refresh
- `expiresAt`: TTL index (`expireAfterSeconds: 0`) — auto-delete expired tokens

---

### PasswordResetToken

Single-use, time-limited token for password reset.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | Primary key | |
| `userId` | ObjectId | Required, indexed, ref: User | |
| `tokenHash` | String | Required, unique, indexed | SHA-256 hash |
| `expiresAt` | Date | Required, indexed (TTL) | 1 hour from creation |
| `used` | Boolean | Default `false` | |
| `usedAt` | Date | Optional | |
| `createdAt` | Date | Auto | |

**Indexes**:
- `tokenHash`: unique
- `expiresAt`: TTL index (`expireAfterSeconds: 0`)

---

## Modified Entities

### Cart (from Phase 2)

Add optional link to authenticated user.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `userId` | ObjectId | Optional, indexed, ref: User | Set when cart is linked to account |

**Behavior changes**:
- When user logs in: find guest cart by `cartId`, set `userId`, merge with existing user cart
- When user logs out: cart remains linked to `userId`; no cookie needed for re-authentication
- Guest carts without `userId` continue to work exactly as in Phase 2

**Index updates**:
- Add `userId` index for fast user cart lookup

---

## Entity Relationship Diagram

```
User ||--o{ RefreshToken : has
User ||--o| Cart : owns
User ||--o{ PasswordResetToken : has
User ||--o{ Order : places       (Phase 4)
Cart }o--|| Product : contains   (via items.productId)
```
