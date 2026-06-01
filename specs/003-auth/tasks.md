# Tasks: Auth & Accounts

**Input**: Design documents from `/specs/003-auth/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for auth features

- [x] T001 Install backend auth dependencies: `jsonwebtoken`, `bcryptjs` in `apps/api/package.json`
- [x] T002 Install backend validation dependency: `zod` in `apps/api/package.json`
- [x] T003 Add auth environment variables to `apps/api/.env.example`: `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `BCRYPT_ROUNDS`
- [x] T004 Verify `cookie-parser` is available in `apps/api` (installed in Phase 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Models

- [x] T005 [P] Create `User` model in `apps/api/src/models/User.js`
- [x] T006 [P] Create `RefreshToken` model in `apps/api/src/models/RefreshToken.js`
- [x] T007 [P] Create `PasswordResetToken` model in `apps/api/src/models/PasswordResetToken.js`
- [x] T008 Add `userId` field (optional, indexed) to `Cart` model in `apps/api/src/models/Cart.js`

### Utilities & Middleware

- [x] T009 [P] Create token utilities in `apps/api/src/utils/tokenUtils.js` — sign/verify JWT, generate cryptographically random token IDs, hash tokens with SHA-256
- [x] T010 [P] Create password utilities in `apps/api/src/utils/passwordUtils.js` — hash with bcrypt, compare, validate password policy
- [x] T011 Create authentication middleware in `apps/api/src/middleware/authenticate.js` — verify access token from cookie, attach `req.user`, handle 401/403
- [x] T012 Create permission middleware in `apps/api/src/middleware/requirePermission.js` — check `req.user.role` against required permissions, central capability-based check
- [x] T013 Create auth rate limiter in `apps/api/src/middleware/rateLimitAuth.js` — stricter limits: 5 login attempts per 15 min per IP, 3 register attempts per hour per IP, 3 reset attempts per hour per IP

### Validation Schemas

- [x] T014 [P] Create auth validation schemas in `apps/api/src/validators/authSchemas.js` — register, login, forgotPassword, resetPassword, updateProfile (zod)

**Checkpoint**: Foundation ready — all models, middleware, and utilities exist and can be imported

---

## Phase 3: User Story 1 — Create Account (Priority: P1) 🎯 MVP

**Goal**: Visitors can register with email/password and are immediately signed in

**Independent Test**: Register via `POST /api/v1/auth/register` with valid payload → receive 201 with user object and cookies set

### Backend

- [x] T015 [US1] Implement `register` in `apps/api/src/services/authService.js` — validate input, hash password, create User, generate tokens, create RefreshToken doc
- [x] T016 [US1] Add `POST /api/v1/auth/register` route in `apps/api/src/routes/v1/auth.js` — call authService.register, set cookies, return user
- [x] T017 [US1] Wire auth router into `apps/api/src/app.js` at `/api/v1/auth`
- [x] T018 [US1] Add audit event on registration in `apps/api/src/services/authService.js`

### Frontend

- [x] T019 [P] [US1] Create `RegisterForm` component in `apps/web/src/components/RegisterForm.tsx`
- [x] T020 [P] [US1] Create `/register` page in `apps/web/src/app/register/page.tsx`
- [x] T021 [US1] Add "Sign Up" link to site header (next to cart icon)

**Checkpoint**: Registration flow works end-to-end — form → API → cookies → authenticated state

---

## Phase 4: User Story 2 — Log In and Out (Priority: P1)

**Goal**: Returning customers can log in, remain authenticated, and log out (current device only)

**Independent Test**: Login → call `/api/v1/auth/me` → verify user → logout → call `/api/v1/auth/me` → verify 401

### Backend

- [x] T022 [US2] Implement `login` in `apps/api/src/services/authService.js` — verify credentials, generate tokens, create RefreshToken doc
- [x] T023 [US2] Implement `logout` in `apps/api/src/services/authService.js` — revoke current refresh token by token hash
- [x] T024 [US2] Implement `refresh` in `apps/api/src/services/authService.js` — verify refresh token hash, issue new access + refresh pair, rotate (revoke old)
- [x] T025 [US2] Implement `getMe` in `apps/api/src/services/authService.js` — return user from req.user
- [x] T026 [US2] Add routes in `apps/api/src/routes/v1/auth.js`: `POST /login`, `POST /logout`, `POST /refresh`, `GET /me`
- [x] T027 [US2] Add audit events on login, logout, and token refresh

### Frontend

- [x] T028 [P] [US2] Create `AuthContext` in `apps/web/src/contexts/AuthContext.tsx` — manage auth state, login/logout/refresh, sync with server on mount
- [x] T029 [P] [US2] Create `useAuth` hook in `apps/web/src/hooks/useAuth.ts`
- [x] T030 [P] [US2] Create `LoginForm` component in `apps/web/src/components/LoginForm.tsx`
- [x] T031 [US2] Create `/login` page in `apps/web/src/app/login/page.tsx`
- [x] T032 [US2] Update header to show user name + "Log Out" when authenticated, "Log In / Sign Up" when guest
- [x] T033 [US2] Add automatic token refresh on 401 in API client (`apps/web/src/lib/api.ts`) — intercept 401, call `/auth/refresh`, retry original request

**Checkpoint**: Login/logout/refresh cycle works end-to-end; unauthenticated users are blocked from protected routes

---

## Phase 5: User Story 3 — Guest Cart Merges on Login (Priority: P1)

**Goal**: When a user logs in, their guest cart merges into their account cart without data loss

**Independent Test**: Add item as guest → login → verify cart contains merged items with correct quantities

### Backend

- [x] T034 [US3] Implement `mergeGuestCart` in `apps/api/src/services/cartService.js` — load guest cart by cartId, load/create user cart by userId, combine quantities, clamp to limits, transfer reservations
- [x] T035 [US3] Call `mergeGuestCart` from `authService.login` and `authService.register` on successful authentication
- [x] T036 [US3] Update `GET /api/v1/cart` route to prioritize `req.user` over cookie `cartId` — return user cart if authenticated
- [x] T037 [US3] Update cart mutations (`addItem`, `updateItem`, `removeItem`) to save to user cart when authenticated
- [x] T038 [US3] Clear `cartId` cookie after successful merge

### Frontend

- [x] T039 [US3] Update `CartContext` to refetch cart after login/register — merged cart should appear immediately
- [x] T040 [US3] Show transient "Cart merged" toast/notification after login when merge occurred

**Checkpoint**: Guest cart items survive login and appear in authenticated cart with combined quantities

---

## Phase 6: User Story 4 — View Account & Order History Scaffold (Priority: P2)

**Goal**: Authenticated users can view and update their profile and see order history list

**Independent Test**: Authenticated GET to `/api/v1/auth/me` → PATCH name → verify updated → view account page

### Backend

- [x] T041 [US4] Implement `updateProfile` in `apps/api/src/services/authService.js` — update name, or change password (verify current, hash new, revoke all tokens)
- [x] T042 [US4] Add `PATCH /api/v1/auth/me` route in `apps/api/src/routes/v1/auth.js`
- [x] T043 [US4] Create `Order` model scaffold in `apps/api/src/models/Order.js` (minimal: orderNumber, userId, items snapshot, total, currency, status, createdAt) — populated by Phase 4
- [x] T044 [US4] Add `GET /api/v1/orders` route in `apps/api/src/routes/v1/orders.js` — return user's orders, paginated, sorted by date desc

### Frontend

- [x] T045 [P] [US4] Create `AccountProfile` component in `apps/web/src/components/AccountProfile.tsx` — display name/email, editable name, password change form
- [x] T046 [P] [US4] Create `OrderHistoryList` component in `apps/web/src/components/OrderHistoryList.tsx` — list of orders with number, date, total, status
- [x] T047 [US4] Create `/account` page in `apps/web/src/app/account/page.tsx` — profile + order history, protected (redirect to login if unauthenticated)
- [x] T048 [US4] Add "My Account" link to header when authenticated
- [x] T049 [US4] Preserve return URL — redirect back to intended page after login (e.g., user clicks account while guest → login → back to account)

**Checkpoint**: Account page loads for authenticated users, shows profile and orders, redirects guests to login

---

## Phase 7: User Story 5 — Reset Forgotten Password (Priority: P2)

**Goal**: Users can request and complete a password reset, invalidating all sessions

**Independent Test**: Request reset → consume token via debug endpoint → reset password → verify old sessions invalidated

### Backend

- [x] T050 [US5] Implement `requestPasswordReset` in `apps/api/src/services/authService.js` — generate token, hash it, save PasswordResetToken doc, log to console
- [x] T051 [US5] Implement `resetPassword` in `apps/api/src/services/authService.js` — verify token hash, check expiry/used, update password hash, mark token used, revoke all refresh tokens
- [x] T052 [US5] Add `POST /api/v1/auth/forgot-password` route
- [x] T053 [US5] Add `POST /api/v1/auth/reset-password` route
- [x] T054 [US5] Add debug endpoint `GET /api/v1/auth/debug/reset-tokens` — list recent reset tokens with raw values for testing. **MUST be disabled in production** (`NODE_ENV !== 'production'` check or admin-only gate).

### Frontend

- [x] T055 [P] [US5] Create `PasswordResetForm` component in `apps/web/src/components/PasswordResetForm.tsx` — email input for request
- [x] T056 [P] [US5] Create `PasswordResetConfirmForm` component in `apps/web/src/components/PasswordResetConfirmForm.tsx` — new password input
- [x] T057 [US5] Create `/forgot-password` page in `apps/web/src/app/forgot-password/page.tsx`
- [x] T058 [US5] Create `/reset-password` page in `apps/web/src/app/reset-password/page.tsx` — reads `?token=` from URL
- [x] T059 [US5] Add "Forgot password?" link on login page

**Checkpoint**: Password reset flow works end-to-end; old sessions are invalidated after reset

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Rate limiting enforcement, audit completeness, and integration validation

- [x] T060 Verify auth rate limiters are applied to all auth routes (`register`, `login`, `forgot-password`, `reset-password`)
- [x] T061 Verify account enumeration prevention — identical error messages and status codes for existing vs non-existing emails on login and forgot-password
- [x] T062 Verify `requirePermission` middleware is used on all protected routes (account, orders, admin endpoints)
- [x] T063 Add auth events to audit log: register, login, logout, password change, password reset, token revocation
- [x] T064 Verify CORS/cookie config works cross-origin in dev (localhost:3000 → localhost:4000)
- [x] T065 Update `PRIVACY.md` with new PII fields: User.name, User.email, RefreshToken.userAgent, RefreshToken.ipAddress
- [x] T066 Run quickstart.md validation — execute all 8 curl scenarios, verify responses
- [x] T067 Commit all changes and push `003-auth` branch to GitHub

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 (shares authService base)
- **User Story 3 (Phase 5)**: Depends on US2 (needs login to trigger merge)
- **User Story 4 (Phase 6)**: Depends on US2 (needs authenticated state)
- **User Story 5 (Phase 7)**: Depends on Foundational + US2 (needs User model, but can be parallel with US3/US4 after US2)
- **Polish (Phase 8)**: Depends on all user stories

### Parallel Opportunities

- Within Phase 2: All model tasks (T005–T008) and utility tasks (T009–T010) can run in parallel
- Within Phase 3: T019 (RegisterForm) and T020 (register page) can run in parallel with T015–T017 (backend register)
- US4 and US5 can be developed in parallel after US2 is complete
- Frontend and backend within each story can often proceed in parallel

### Implementation Strategy

#### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Register)
4. Complete Phase 4: US2 (Login/Logout)
5. **STOP and VALIDATE**: Auth works, guest checkout still works, cart untouched
6. Deploy/demo if ready

#### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Core auth functional → Test → Deploy
3. US3 → Cart merge → Test → Deploy
4. US4 → Account page → Test → Deploy
5. US5 → Password reset → Test → Deploy

---

## Notes

- Total tasks: 67
- Tasks per story: US1 (7), US2 (14), US3 (7), US4 (9), US5 (10)
- Foundational: 10 tasks
- Polish: 8 tasks
- [P] tasks = different files, no dependencies
- Commit after each phase or logical group
