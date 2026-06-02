const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FEATURE_CHECKOUT_V2: z.string().transform((v) => v === 'true').default('false'),
  CHECKOUT_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  STUB_PAYMENT_LATENCY_MS: z.string().transform(Number).default('500'),
  STUB_PAYMENT_FAILURE_RATE: z.string().transform(Number).default('0'),
  STUB_PAYMENT_DECLINE_EMAILS: z.string().default(''),
  IDEMPOTENCY_TTL_HOURS: z.string().transform(Number).default('24'),
  FEATURE_FLAG_CACHE_SECONDS: z.string().transform(Number).default('30'),
  CART_TTL_DAYS: z.string().transform(Number).default('7'),
  RESERVATION_TTL_MINUTES: z.string().transform(Number).default('15'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default('dev-secret-change-me'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  SHIPPING_STANDARD_COST: z.string().transform(Number).default('5000'),
  SHIPPING_CURRENCY: z.string().default('EGP'),
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
