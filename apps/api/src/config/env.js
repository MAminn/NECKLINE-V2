const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FEATURE_CHECKOUT_V2: z.string().transform((v) => v === 'true').default('false'),
  IDEMPOTENCY_TTL_HOURS: z.string().transform(Number).default('24'),
  FEATURE_FLAG_CACHE_SECONDS: z.string().transform(Number).default('30'),
  CART_TTL_DAYS: z.string().transform(Number).default('7'),
  RESERVATION_TTL_MINUTES: z.string().transform(Number).default('15'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default('dev-secret-change-me'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
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
