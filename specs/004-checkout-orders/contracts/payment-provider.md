# Payment Provider Interface Contract

**Version**: 1.0  
**Date**: 2026-05-25

---

## Purpose

Defines the adapter interface between the checkout system and any payment processor. The initial implementation is `StubPaymentProvider`; Phase 5 will add a concrete provider (e.g., Stripe) without changing checkout logic.

---

## Interface

```typescript
interface PaymentProvider {
  /**
   * Creates a payment intent for the given order.
   * This is Step 1 of the 2-step flow.
   *
   * @param order - The order document (or preview) with total and currency
   * @returns PaymentIntent with id and clientSecret (if applicable)
   */
  createPaymentIntent(order: {
    orderNumber: string;
    total: number;
    currency: string;
    customerEmail: string;
  }): Promise<PaymentIntent>;

  /**
   * Confirms the payment intent, charging the customer.
   * This is Step 2 of the 2-step flow.
   *
   * @param intentId - The ID returned by createPaymentIntent
   * @returns PaymentResult with status and transaction reference
   */
  confirmPayment(intentId: string): Promise<PaymentResult>;

  /**
   * Refunds a previously successful payment.
   * Deferred to Phase 6 (Admin Dashboard / order management).
   *
   * @param transactionId - The provider's transaction ID
   * @param amount - Amount to refund in minor units (partial refunds supported)
   * @returns RefundResult
   */
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}
```

---

## Data Types

### PaymentIntent

```typescript
interface PaymentIntent {
  id: string;           // Provider-specific intent ID
  status: 'requires_confirmation' | 'requires_payment_method' | 'succeeded';
  clientSecret?: string; // For client-side confirmation (e.g., Stripe.js)
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}
```

### PaymentResult

```typescript
interface PaymentResult {
  success: boolean;
  transactionId?: string;  // Provider's transaction reference
  status: 'succeeded' | 'failed' | 'requires_action';
  errorCode?: string;      // Machine-readable error code
  errorMessage?: string;   // Human-readable error description
}
```

### RefundResult

```typescript
interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed';
  errorMessage?: string;
}
```

---

## StubPaymentProvider Behavior

The stub provider simulates a payment processor for development and testing.

### Configuration (Environment Variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `STUB_PAYMENT_LATENCY_MS` | `500` | Simulated network latency |
| `STUB_PAYMENT_FAILURE_RATE` | `0` | Decimal probability of random failure (0–1) |
| `STUB_PAYMENT_DECLINE_EMAILS` | `''` | Comma-separated list of emails that always fail |

### createPaymentIntent

1. Validates order total > 0
2. Generates a mock intent ID: `stub_intent_${timestamp}_${random}`
3. Simulates latency
4. Returns intent with status `requires_confirmation`

### confirmPayment

1. Validates intent ID format
2. Simulates latency
3. Checks failure conditions:
   - Random failure (if `STUB_PAYMENT_FAILURE_RATE > 0`)
   - Email in `STUB_PAYMENT_DECLINE_EMAILS`
   - Intent ID ending in `_fail` (deterministic test hook)
4. Returns `succeeded` with a mock transaction ID, or `failed` with error details

### refund

1. Validates transaction ID exists
2. Returns `succeeded` with mock refund ID
3. Always succeeds (no failure simulation for refunds in MVP)

---

## Provider Registration

The concrete provider is selected at runtime via factory:

```javascript
// config/payments.js
const PROVIDER = process.env.PAYMENT_PROVIDER || 'stub'; // 'stub' | 'stripe' | ...

// services/payment/PaymentProviderFactory.js
function createPaymentProvider() {
  switch (PROVIDER) {
    case 'stub': return new StubPaymentProvider(config);
    // case 'stripe': return new StripePaymentProvider(config); // Phase 5
    default: throw new Error(`Unknown payment provider: ${PROVIDER}`);
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `stub_decline` | Generic payment decline | 402 |
| `stub_invalid_intent` | Intent ID not found or malformed | 400 |
| `stub_expired_intent` | Intent expired before confirmation | 400 |
| `provider_unavailable` | Payment provider service error | 503 |
