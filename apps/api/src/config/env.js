const { z } = require('zod');

// Insecure placeholder so local dev / tests boot without extra setup.
// Production is FORBIDDEN from using it — see the superRefine guard below.
const DEV_JWT_SECRET_DEFAULT = 'dev-insecure-secret-change-me';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Number of trusted reverse proxies in front of the app (nginx, Cloudflare, ELB…).
  // Express counts this many hops from the RIGHT of X-Forwarded-For to derive req.ip,
  // which the rate limiters key on. Default 0 = trust nothing → req.ip is the direct
  // socket address and X-Forwarded-For is ignored, so a client cannot spoof its IP.
  // Set to the exact proxy count per deployment (1 behind a single nginx/Cloudflare).
  TRUST_PROXY: z
    .string()
    .default('0')
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n >= 0, {
      message:
        'TRUST_PROXY must be a non-negative integer (number of trusted proxy hops); ' +
        'do not use true — it lets clients spoof X-Forwarded-For',
    }),
  FEATURE_CHECKOUT_V2: z.string().transform((v) => v === 'true').default('false'),
  CHECKOUT_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  STUB_PAYMENT_LATENCY_MS: z.string().transform(Number).default('500'),
  STUB_PAYMENT_FAILURE_RATE: z.string().transform(Number).default('0'),
  STUB_PAYMENT_DECLINE_EMAILS: z.string().default(''),
  IDEMPOTENCY_TTL_HOURS: z.string().transform(Number).default('24'),
  // How long an 'in_progress' reservation may live before it is presumed orphaned
  // (e.g. cleanup deleteOne failed, process died mid-request) and auto-expired.
  // Must comfortably exceed the longest legitimate request duration.
  IDEMPOTENCY_IN_PROGRESS_TTL_MINUTES: z.string().transform(Number).default('10'),

  // Payment provider selection (Phase 5)
  PAYMENT_PROVIDER: z.enum(['stub', 'paymob']).default('stub'),

  // Paymob credentials (Phase 5) — server-side only, never exposed to client
  PAYMOB_API_KEY: z.string().default(''),
  PAYMOB_INTEGRATION_ID: z.string().default(''),
  PAYMOB_IFRAME_ID: z.string().default(''),
  PAYMOB_HMAC_SECRET: z.string().default(''),
  PAYMOB_BASE_URL: z.string().default('https://accept.paymob.com'),
  // Explicit opt-in to accept Paymob webhooks without HMAC verification when
  // PAYMOB_HMAC_SECRET is unset (local dev only). Must never be true in production —
  // see the superRefine guard below.
  ALLOW_UNSIGNED_WEBHOOKS: z.string().transform((v) => v === 'true').default('false'),
  FEATURE_FLAG_CACHE_SECONDS: z.string().transform(Number).default('30'),
  CART_TTL_DAYS: z.string().transform(Number).default('7'),
  RESERVATION_TTL_MINUTES: z.string().transform(Number).default('15'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default(DEV_JWT_SECRET_DEFAULT),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  SHIPPING_STANDARD_COST: z.string().transform(Number).default('5000'),
  SHIPPING_CURRENCY: z.string().default('EGP'),
}).superRefine((data, ctx) => {
  // Production must never run on the dev default or a weak secret — tokens would be forgeable.
  if (data.NODE_ENV === 'production') {
    if (
      !data.JWT_SECRET ||
      data.JWT_SECRET === DEV_JWT_SECRET_DEFAULT ||
      data.JWT_SECRET.length < 32
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message:
          'JWT_SECRET must be set to a unique value of at least 32 characters in production',
      });
    }
    if (data.ALLOW_UNSIGNED_WEBHOOKS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOW_UNSIGNED_WEBHOOKS'],
        message: 'ALLOW_UNSIGNED_WEBHOOKS must not be true in production',
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

module.exports = parsed.data;
