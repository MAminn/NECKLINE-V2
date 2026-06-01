# Feature Specification: Auth & Accounts

**Feature Branch**: `003-auth`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Customers may optionally create an account to log in and view order history. Guests can still do everything except view history."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Account (Priority: P1)

A guest visits the store and decides to create an account so they can view their order history later. They enter their name, email, and a secure password, then submit the registration form. The system creates their account and immediately signs them in.

**Why this priority**: Account creation is the entry point for all authenticated features. Without it, no other auth story can be tested.

**Independent Test**: Can be fully tested by attempting registration with valid and invalid inputs, and verifying the resulting account exists and the user is authenticated.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit a unique email and a password meeting the policy, **Then** an account is created and they are signed in.
2. **Given** a visitor on the registration page, **When** they submit an email already in use, **Then** the system returns a generic error that does not reveal whether the email exists.
3. **Given** a visitor on the registration page, **When** they submit a password shorter than the minimum length or missing required character classes, **Then** the system rejects it with a clear validation message.

---

### User Story 2 - Log In and Out (Priority: P1)

A returning customer logs into their account using their email and password. The system authenticates them and restores their session. They can browse the store while authenticated, and log out when done, which terminates their session on the current device.

**Why this priority**: Login is the primary recurring interaction for returning customers. Logout is the security-critical counterpart.

**Independent Test**: Can be fully tested by creating an account, logging out, logging back in, and verifying the session token is issued, refreshed, and invalidated correctly.

**Acceptance Scenarios**:

1. **Given** a registered customer on the login page, **When** they submit correct credentials, **Then** they are authenticated and redirected to the storefront.
2. **Given** a registered customer on the login page, **When** they submit incorrect credentials, **Then** the system returns a generic error that does not reveal whether the email exists or the password is wrong.
3. **Given** an authenticated customer, **When** they click "Log Out", **Then** their session ends and their refresh token is revoked.

---

### User Story 3 - Guest Cart Merges on Login (Priority: P1)

A guest has added items to their cart. When they log in, the system merges their guest cart into their account cart without losing any items. If the same product exists in both carts, quantities are combined (respecting per-line and total item limits).

**Why this priority**: Cart continuity across the guest-to-authenticated boundary is a critical conversion driver. Losing cart items on login would directly impact revenue.

**Independent Test**: Can be fully tested by adding items as a guest, logging in, and verifying the cart contains the union of guest and saved items with correct quantities.

**Acceptance Scenarios**:

1. **Given** a guest with 2 items in their cart, **When** they log in to an account with an empty saved cart, **Then** all 2 items appear in their authenticated cart.
2. **Given** a guest with product A (qty 2) in their cart, **When** they log in to an account that already has product A (qty 1), **Then** the cart shows product A with qty 3.
3. **Given** a guest with items in their cart, **When** they log in and the merged quantity would exceed stock or per-line limits, **Then** the quantity is clamped to the maximum allowed and the user is notified.

---

### User Story 4 - View Account & Order History Scaffold (Priority: P2)

An authenticated customer navigates to their account page to see their profile information, update their name and password, and view a list of their past orders. The order history displays order numbers, dates, totals, and status. Order detail views and email changes are deferred to Phase 4.

**Why this priority**: Order history is the primary value proposition for creating an account. The scaffold in this phase prepares the data structure and UI shell.

**Independent Test**: Can be fully tested by placing an order (via Phase 4 when available) and verifying it appears in the account page list with correct summary data.

**Acceptance Scenarios**:

1. **Given** an authenticated customer on the account page, **Then** they see their name, email, a list of their orders sorted by date descending, and options to update their name and password.
2. **Given** a customer with no orders, **When** they view their account page, **Then** they see an empty state message and a prompt to shop.
3. **Given** a guest visitor, **When** they attempt to access the account page, **Then** they are redirected to the login page with a return URL.

---

### User Story 5 - Reset Forgotten Password (Priority: P2)

A customer who forgot their password requests a reset link by entering their email. The system sends a time-limited, single-use reset link. The customer follows the link, sets a new password, and their existing sessions are invalidated.

**Why this priority**: Password reset is a standard recovery flow that prevents account lockout and reduces support burden.

**Independent Test**: Can be fully tested by requesting a reset for a known email, consuming the reset token, and verifying the new password works while the old sessions are terminated.

**Acceptance Scenarios**:

1. **Given** a registered customer on the forgot-password page, **When** they submit their email, **Then** the system sends a reset link (or appears to, even if the email does not exist, to prevent enumeration).
2. **Given** a customer with a valid reset token, **When** they submit a new password meeting the policy, **Then** the password is updated and all active refresh tokens are revoked.
3. **Given** a customer with an expired or already-used reset token, **When** they attempt to reset, **Then** the system rejects the request and instructs them to request a new link.

---

### Edge Cases

- What happens when a guest cart is merged but some items have become out of stock since they were added?
- How does the system handle concurrent login requests from the same account?
- What happens if a user tries to register with an email that is pending verification?
- How does the system behave when a refresh token is used after the user has changed their password?
- What happens when rate limits are exceeded on login or registration endpoints?
- How does the system handle a login attempt from a new device or suspicious location?

## Clarifications

### Session 2026-05-25

- **Q**: Require email verification before login, or allow immediate login after registration? → **A**: Allow immediate login after registration. Email verification status is tracked but does not block authentication.
- **Q**: Send real transactional emails for password reset, or log to console/DB for development? → **A**: Log to console/DB with a debug endpoint. Real email delivery deferred to a future phase.
- **Q**: Support social login (OAuth2 via Google/Facebook) in this phase, or defer? → **A**: Defer OAuth to a future phase. Email/password authentication only for this phase.
- **Q**: What are the lifetimes for access and refresh tokens? → **A**: Access tokens expire after 15 minutes. Refresh tokens expire after 7 days.
- **Q**: Should logout terminate all devices or just the current device? → **A**: Log out this device only (current session). Other active sessions remain valid.
- **Q**: Should an authenticated user's cart persist across logout and re-login? → **A**: Yes. The cart is permanently associated with the user account and survives logout.
- **Q**: Should the account page allow profile updates? → **A**: Yes. Users can update their name and password from the account page. Email changes are deferred to a future phase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow visitors to register for an account using an email address and password.
- **FR-002**: The system MUST enforce a password policy requiring at least 8 characters, one uppercase letter, one lowercase letter, and one number.
- **FR-003**: The system MUST hash passwords using a memory-hard algorithm before storage.
- **FR-004**: The system MUST authenticate users via short-lived access tokens and rotating refresh tokens.
- **FR-005**: Tokens MUST be transmitted in httpOnly, secure, sameSite cookies.
- **FR-006**: Refresh tokens MUST be individually revocable and tracked server-side.
- **FR-007**: Password changes and resets MUST invalidate all active refresh tokens for that account.
- **FR-008**: The system MUST rate-limit login, registration, and password-reset endpoints to prevent brute-force attacks.
- **FR-009**: The system MUST prevent account enumeration by returning identical error messages and response timing for existing and non-existing emails on login and password-reset requests.
- **FR-010**: When an authenticated user logs in, the system MUST merge their current guest cart into their account cart, combining quantities for duplicate products and respecting stock and cart limits.
- **FR-011**: The system MUST provide a protected account page where authenticated users can view their profile and order history list.
- **FR-012**: The system MUST redirect unauthenticated users to the login page when they attempt to access protected routes, preserving the intended destination for post-login redirect.
- **FR-013**: The system MUST support a password-reset flow with time-limited, single-use tokens sent via email.
- **FR-014**: The system MUST support role-based authorization with at minimum two roles: `customer` and `admin`.
- **FR-015**: Authorization MUST be capability-based and enforced server-side on every protected route.
- **FR-016**: The system MUST allow immediate login after registration without requiring email verification. Email verification status is tracked but does not block authentication.
- **FR-017**: The system MUST generate password reset tokens and make them available via a debug endpoint or console/DB log for development. Real transactional email delivery is deferred to a future phase.
- **FR-018**: The system MUST support email-and-password authentication. Social login (OAuth2) is explicitly out of scope for this phase and may be added later.

### Key Entities *(include if feature involves data)*

- **User**: Represents a registered account holder. Attributes: name, email (unique), password hash, role, email verified status, timestamps. Related to Cart (one-to-one for authenticated users) and Order (one-to-many).
- **RefreshToken**: Represents an active session. Attributes: token hash, user reference, issued at, expires at, revoked flag, revoked reason, user agent hint, IP hint. Related to User (many-to-one).
- **PasswordResetToken**: Represents a pending password reset. Attributes: token hash, user reference, expires at, used flag. Related to User (many-to-one).
- **Cart**: Already exists from Phase 2. When a user registers or logs in, the guest cart (identified by cookie) is linked to the User and merged with any existing user cart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account registration in under 60 seconds.
- **SC-002**: Users can log in and see their authenticated state within 2 seconds of submitting credentials.
- **SC-003**: Guest cart items are preserved without loss when a user logs in, with 100% accuracy for up to 20 line items.
- **SC-004**: The system prevents account enumeration: a third party cannot determine whether an email is registered based on error messages, response timing, or status codes.
- **SC-005**: 95% of users successfully log in on the first attempt with correct credentials.
- **SC-006**: Password reset tokens expire within 1 hour and can only be used once.
- **SC-007**: All authenticated endpoints return a 401 response for requests without a valid token, with no data leakage.

## Assumptions

- Users have access to a valid email address for password reset (even if verification is not required for login).
- Guest checkout remains fully functional; accounts are optional.
- Email delivery for password reset will use a transactional email provider or a logging stub for development.
- Social login (OAuth) is not required for MVP and may be added in a future phase.
- Multi-factor authentication is out of scope for MVP.
- The existing cart system from Phase 2 provides the merge target and limits (20 line items, 99 qty per line).
- Order history data will be populated by Phase 4 (Checkout & Orders); this phase provides the account page UI shell and data contract only.
- Admin role management UI ships in Phase 6 (Admin Dashboard); this phase establishes the role schema and capability checks only.
