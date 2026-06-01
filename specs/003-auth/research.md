# Research: Auth & Accounts

**Date**: 2026-05-25 | **Phase**: 0

## Decisions

### Password Hashing: bcryptjs

- **Decision**: Use `bcryptjs` (pure JS bcrypt implementation)
- **Rationale**: 
  - No native compilation required (works on Windows without node-gyp)
  - Constitution allows bcrypt as fallback to Argon2
  - 10 rounds (~100ms hash time) provides adequate resistance
  - Widely audited, stable API
- **Alternatives considered**: 
  - `argon2`: Preferred by constitution, but requires native bindings (node-gyp) which fail on Windows without Visual Studio Build Tools
  - `bcrypt` (native): Same node-gyp issue as argon2

### JWT Library: jsonwebtoken

- **Decision**: Use `jsonwebtoken`
- **Rationale**: 
  - De facto standard for Node.js JWT
  - Supports signing, verification, and expiration
  - Small footprint
- **Alternatives considered**: 
  - `jose`: More modern, but jsonwebtoken is sufficient for HS256/RS256

### Token Storage Strategy: Dual Cookie

- **Decision**: Store both access token and refresh token in separate httpOnly cookies
- **Rationale**: 
  - Access token short-lived (15min), refresh token long-lived (7 days)
  - Refresh token rotation means old tokens are invalidated on use
  - XSS-resistant via httpOnly; CSRF-resistant via sameSite strict
  - No localStorage (vulnerable to XSS)
- **Alternatives considered**: 
  - Access token in memory + refresh in cookie: More complex, no real security gain for this threat model
  - Access token in Authorization header: Requires manual header management on client

### Session Tracking: MongoDB Collection

- **Decision**: Store refresh tokens in a MongoDB `RefreshToken` collection
- **Rationale**: 
  - Constitution requires server-tracked revocable tokens
  - Enables per-device logout (logout this session only)
  - Enables "log out everywhere" by revoking all tokens for a user
  - TTL index auto-cleans expired tokens
- **Alternatives considered**: 
  - Redis: Faster but adds infrastructure; constitution says use MongoDB until measured need

### Authorization: Role → Permissions → Actions

- **Decision**: Implement capability-based authorization with a permission enum
- **Rationale**: 
  - Constitution §4.3 mandates capability-based, no inline role checks
  - Roles (`customer`, `admin`) map to arrays of permissions
  - Middleware checks permissions, not roles
  - Extensible: new roles can be added by assigning permission sets
- **Permissions for this phase**:
  - `cart:manage` — guest + customer + admin
  - `account:read` — customer + admin
  - `account:write` — customer + admin
  - `order:read` — customer + admin
  - `admin:access` — admin only

### Cart Merge Strategy: Quantities Combined, Stock-Clamped

- **Decision**: On login, merge guest cart items into user cart by combining quantities for duplicate SKUs
- **Rationale**: 
  - Spec requires quantities combined (not replaced)
  - Must respect per-line max (99) and total line item max (20)
  - Stock validation re-runs at merge time
  - Out-of-stock items are kept in cart with warning badge (existing Phase 2 behavior)
- **Merge algorithm**:
  1. Load guest cart by cookie cartId
  2. Load user cart by userId (or create empty)
  3. For each guest item: find matching user cart item by productId
  4. If found: qty = min(existing + guest, 99, availableStock)
  5. If not found: add as new line (respect 20-item limit)
  6. Save user cart, delete guest cart and its reservations, create new reservations for user cart
  7. Clear guest cart cookie
