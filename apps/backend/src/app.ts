import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

import { config, corsOrigins } from './config.js';
import { healthRoutes } from './routes/health.js';
import { projectRoutes } from './routes/projects.js';
import { assetRoutes } from './routes/assets.js';
import { logger } from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            }
          : undefined,
    },
    bodyLimit: config.MAX_UPLOAD_MB * 1024 * 1024,
    trustProxy: true,
  });

  // Security headers (CSP is configured explicitly so Swagger UI keeps working).
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // CORS for local dev. In production (behind Nginx), CORS is handled by the proxy.
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    allowList: (req) => req.url === '/api/v1/health',
  });

  await app.register(multipart, {
    limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'NETDRAW API',
        description: 'Open-source network diagram editor backend.',
        version: '0.1.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // Optional static export of generated PNG/SVG/PDF files.
  const exportsDir = join(config.DATA_DIR, 'exports');
  if (existsSync(exportsDir)) {
    await app.register(fastifyStatic, {
      root: exportsDir,
      prefix: '/exports/',
      decorateReply: false,
    });
  } else {
    await app.register(fastifyStatic, {
      root: resolve(config.DATA_DIR),
      prefix: '/exports/',
      decorateReply: false,
    });
  }

  // API v1
  await app.register(
    async (instance) => {
      await healthRoutes(instance);
      await projectRoutes(instance);
      await assetRoutes(instance);
    },
    { prefix: '/api/v1' }
  );

  // Generic error handler
  app.setErrorHandler((err: Error & { statusCode?: number; code?: string }, _req, reply) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    if (reply.sent) return;
    reply.status(err.statusCode ?? 500).send({
      error: {
        code: err.code ?? 'internal_error',
        message: err.message ?? 'Internal server error',
      },
    });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      error: { code: 'not_found', message: `Route ${req.method} ${req.url} not found` },
    });
  });

  return app;
}
