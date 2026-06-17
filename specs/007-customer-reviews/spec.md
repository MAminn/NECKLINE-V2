# Feature Specification: Customer Reviews (Verified Purchasers, Moderated)

**Feature Branch**: `007-customer-reviews`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "Allow verified purchasers to write product reviews, with admin moderation before publish"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verified purchaser submits a review (Priority: P1)

A customer who has purchased a product wants to share a rating and written feedback about it. After logging in, they see a "Write a Review" option on a product they've bought, submit a star rating and comment, and their review is recorded as awaiting approval.

**Why this priority**: This is the core capability the feature exists to deliver — without it, there is no customer-generated review content at all.

**Independent Test**: Can be fully tested by having a logged-in user with a confirmed order for Product X submit a rating and comment for Product X, and verifying the submission is stored but not yet publicly visible.

**Acceptance Scenarios**:

1. **Given** a logged-in user with a confirmed order containing Product X, **When** they submit a rating and comment for Product X, **Then** the review is saved in a pending state and a confirmation is shown to the user.
2. **Given** a logged-in user who has never purchased Product Y, **When** they attempt to submit a review for Product Y, **Then** the system rejects the submission and explains that only verified purchasers may review a product.
3. **Given** a logged-in user who already submitted a review for Product X, **When** they attempt to submit a second review for Product X, **Then** the system rejects the duplicate submission.

---

### User Story 2 - Admin moderates submitted reviews (Priority: P1)

A store admin wants to keep the public-facing reviews trustworthy and free of spam or inappropriate content. They see new customer-submitted reviews in a moderation queue, and can approve or reject each one before it becomes visible to shoppers.

**Why this priority**: Without moderation, the "moderation before publish" requirement is unmet and unreviewed content could reach the storefront — equally critical to User Story 1.

**Independent Test**: Can be fully tested by submitting a customer review (per User Story 1), then having an admin approve it and confirming it becomes publicly visible, or reject it and confirming it stays hidden.

**Acceptance Scenarios**:

1. **Given** a pending customer-submitted review, **When** an admin approves it, **Then** the review becomes visible to shoppers on the storefront.
2. **Given** a pending customer-submitted review, **When** an admin rejects it, **Then** the review remains hidden from shoppers and is marked rejected.
3. **Given** the admin moderation queue, **When** an admin opens it, **Then** they can distinguish pending customer submissions from already-published reviews.

---

### User Story 3 - Shopper reads published reviews (Priority: P2)

A shopper browsing the storefront wants to read genuine feedback from verified buyers before purchasing. They see only approved, published reviews — never pending or rejected ones.

**Why this priority**: This is the payoff of the feature for the storefront's primary audience, but it depends on Stories 1 and 2 already existing to have content to show.

**Independent Test**: Can be fully tested by confirming that, with one approved and one pending review in the system, only the approved review appears in the public reviews list.

**Acceptance Scenarios**:

1. **Given** a mix of approved, pending, and rejected reviews for a product, **When** a shopper views the product's reviews, **Then** only approved reviews are displayed.
2. **Given** a product with no approved reviews yet, **When** a shopper views the product's reviews, **Then** the shopper sees an empty/no-reviews state rather than placeholder or fabricated content.

---

### User Story 4 - Purchaser checks their own review status (Priority: P3)

A customer who submitted a review wants to know whether it has been approved, is still pending, or was rejected.

**Why this priority**: Improves trust and transparency but the feature is fully functional for moderation and display purposes without it.

**Independent Test**: Can be fully tested by submitting a review and then having that same user view their account/order history to see the review's current status.

**Acceptance Scenarios**:

1. **Given** a user with a submitted review, **When** they view their account, **Then** they can see whether that review is pending, approved, or rejected.

---

### Edge Cases

- What happens when the order containing the purchased product is later cancelled or refunded after a review was already approved? (Existing approved reviews are not retroactively removed; out of scope to auto-revoke.)
- What happens when a guest checks out without creating an account? They have no logged-in identity to attach a review to, so they cannot submit a review until they register/log in.
- What happens when a single order contains multiple units of the same product, or the same product across multiple separate orders? The purchaser is still limited to one review per product, regardless of how many times they bought it.
- How does the system handle a rejected review — can the purchaser resubmit? (Out of scope for v1; rejection is final unless an admin manually intervenes.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow only authenticated users to submit a product review.
- **FR-002**: System MUST allow a user to submit a review for a product only if that user has at least one confirmed order containing that product ("verified purchaser").
- **FR-003**: System MUST reject review submissions for products the submitting user has not purchased, with a clear explanation.
- **FR-004**: System MUST limit each user to one review per product.
- **FR-005**: Every newly submitted customer review MUST be stored in a pending state and MUST NOT be visible to shoppers until approved.
- **FR-006**: System MUST provide admins a moderation view distinguishing pending, approved, and rejected reviews.
- **FR-007**: System MUST allow an admin to approve a pending review, making it visible to shoppers.
- **FR-008**: System MUST allow an admin to reject a pending review, keeping it permanently hidden from shoppers.
- **FR-009**: System MUST only display approved reviews in any public/storefront-facing review listing.
- **FR-010**: System MUST capture, at minimum, a star rating and a written comment for each review submission.
- **FR-011**: System MUST allow a user to view the moderation status (pending, approved, rejected) of reviews they personally submitted.

### Key Entities

- **Review**: A customer's feedback on a specific product — rating, written comment, moderation status (pending/approved/rejected), the reviewing user, the product reviewed, and submission date. Replaces/extends the existing admin-only testimonial content with customer-submitted entries.
- **Order**: The existing confirmed-purchase record used to verify that a user is eligible to review a given product.
- **User**: The existing authenticated account that owns submitted reviews and whose purchase history determines review eligibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A verified purchaser can submit a review for a product they bought in under 1 minute.
- **SC-002**: 100% of newly submitted customer reviews are hidden from the public storefront until an admin explicitly approves them.
- **SC-003**: 0% of review submissions succeed for products the submitting user has not purchased.
- **SC-004**: An admin can approve or reject any pending review in a single moderation action.
- **SC-005**: An approved review becomes visible on the storefront without requiring any redeployment or technical intervention.

## Assumptions

- "Verified purchaser" means the reviewing user is logged in and has at least one order in a confirmed state containing the product being reviewed; guest (non-account) orders do not qualify until the guest registers/logs in with the matching email and the order is associated with their account.
- One review per user per product, regardless of how many times they purchased it.
- Editing or deleting a submitted review (pending or approved) is out of scope for v1.
- Resubmission after rejection is out of scope for v1.
- Existing admin-curated testimonials (created directly by admins, not tied to a purchase) continue to be supported as a separate, non-purchase-verified content source alongside customer reviews.
- Notifying users when their review is approved/rejected (e.g., via email) is out of scope for v1; status is only visible when the user checks their account.
