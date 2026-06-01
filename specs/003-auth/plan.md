# Implementation Plan: Auth & Accounts

**Branch**: `003-auth` | **Date**: 2026-05-25 | **Spec**: [specs/003-auth/spec.md](spec.md)

**Input**: Feature specification from `/specs/003-auth/spec.md`

## Summary

Implement optional JWT-based authentication for the NECKLINE storefront. Customers can register with email/password, log in/out, and view an account page with order history. Guest checkout remains fully functional. On login, the guest cart merges into the user's persistent account cart. Password reset is supported via time-limited tokens (logged to debug endpoint for MVP). Authorization uses capability-based checks with `customer` and `admin` roles.

## Technical Context

**Language/Version**: Node.js 22.15.1 (backend), TypeScript 5 (frontend via Next.js)

**Primary Dependencies**: Express 4, Mongoose 8, Next.js 14 (App Router), jsonwebtoken, bcryptjs, cookie-parser, express-rate-limit, zod

**Storage**: MongoDB Atlas (neckline cluster)

**Testing**: Jest (backend), React Testing Library (frontend)

**Target Platform**: Web — Chrome/Firefox/Safari/Edge latest 2 versions

**Project Type**: Web application (monorepo: `apps/api` + `apps/web`)

**Performance Goals**: Login response < 500ms p95; token refresh < 200ms p95

**Constraints**: Auth cookies must work cross-origin in dev (localhost:3000 → localhost:4000); no Redis until measured need

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Section | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| §4.2 | Password hashing (Argon2/bcrypt) | ✅ | bcryptjs selected (bcrypt-compatible, widely supported) |
| §4.2 | Short-lived JWT access + rotating refresh | ✅ | Access 15min, Refresh 7 days, rotating on every use |
| §4.2 | httpOnly/secure/sameSite cookies | ✅ | Same config as cart cookie; secure in production only |
| §4.2 | Server-tracked revocable refresh tokens | ✅ | RefreshToken collection with revoked flag |
| §4.2 | Password reset invalidates sessions | ✅ | revokeAllTokens on password change/reset |
| §4.3 | Capability-based authorization | ✅ | Permission enum + middleware; Role maps to Permissions |
| §4.3 | No inline role checks | ✅ | Central `requirePermission` middleware |
| §4.4 | Rate limiting on auth endpoints | ✅ | Separate stricter limits for login/register/reset |
| §4.4 | Abuse prevention observable | ✅ | Failed login attempts logged; rate limit headers returned |
| §III | Server-authoritative permissions | ✅ | Roles/permissions never trusted from client |
| §VIII | Audit events on auth mutations | ✅ | Login, logout, register, password change, token revocation |

## Project Structure

### Documentation (this feature)

```text
specs/003-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.md
│   └── cart-merge.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
apps/api/src/
├── models/
│   ├── User.js          # NEW: user accounts
│   ├── RefreshToken.js  # NEW: server-tracked sessions
│   └── PasswordResetToken.js  # NEW: reset tokens
├── services/
│   ├── authService.js   # NEW: register, login, logout, refresh, password reset
│   └── cartService.js   # MODIFIED: merge guest cart, link cart to user
├── middleware/
│   ├── authenticate.js  # NEW: JWT access token validation
│   ├── requirePermission.js  # NEW: capability-based authorization
│   └── rateLimitAuth.js  # NEW: stricter rate limits for auth endpoints
├── routes/v1/
│   ├── auth.js          # NEW: /api/v1/auth/*
│   └── cart.js          # MODIFIED: cart now respects user context
└── utils/
    └── tokenUtils.js    # NEW: sign/verify JWT, generate token IDs

apps/web/src/
├── app/
│   ├── login/
│   │   └── page.tsx     # NEW: login page
│   ├── register/
│   │   └── page.tsx     # NEW: registration page
│   ├── forgot-password/
│   │   └── page.tsx     # NEW: forgot password page
│   ├── reset-password/
│   │   └── page.tsx     # NEW: password reset confirmation page
│   └── account/
│       └── page.tsx     # NEW: account page
├── components/
│   ├── LoginForm.tsx    # NEW
│   ├── RegisterForm.tsx # NEW
│   ├── PasswordResetForm.tsx  # NEW
│   └── AccountProfile.tsx  # NEW
├── contexts/
│   └── AuthContext.tsx  # NEW: auth state, login/logout/refresh
└── hooks/
    └── useAuth.ts       # NEW: convenience hook
```

**Structure Decision**: The monorepo structure from Phase 0–2 is preserved. Auth is additive — no structural reorganization. Existing cart routes gain user-awareness; new auth routes are independent.

## Complexity Tracking

> No constitution violations requiring justification. All design decisions align with locked architecture.
