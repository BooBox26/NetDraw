import { z } from 'zod';

// Programmatically load .env files from the root of apps/backend or the project root.
try {
  if (typeof process.loadEnvFile === 'function') {
    // Try current directory .env first
    try {
      process.loadEnvFile('.env');
    } catch {
      // ignore
    }
    // Also try root .env if running from apps/backend directory
    try {
      process.loadEnvFile('../../.env');
    } catch {
      // ignore
    }
    // Also try apps/backend/.env if running from root directory
    try {
      process.loadEnvFile('apps/backend/.env');
    } catch {
      // ignore
    }
  }
} catch {
  // ignore
}

const ConfigSchema = z.object({
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().default('file:./prisma/dev.db'),

  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:8080'),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  AUTH_MODE: z.enum(['none', 'local', 'oidc']).default('none'),
  JWT_SECRET: z.string().min(16).default('dev-only-secret-please-change-32chars'),
  JWT_TTL: z.string().default('12h'),

  OIDC_ISSUER: z.string().optional().default(''),
  OIDC_CLIENT_ID: z.string().optional().default(''),
  OIDC_CLIENT_SECRET: z.string().optional().default(''),
  OIDC_REDIRECT_URI: z.string().optional().default(''),

  DATA_DIR: z.string().default('./data'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(2),

  AUTOSAVE_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
  TELEMETRY_ENABLED: z.coerce.boolean().default(false),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const corsOrigins = config.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
