import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { RedisSessionStore } from './lib/sessionStore.js';
import prisma from './lib/prisma.js';
import redis from './lib/redis.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import adminAuthRoutes from './routes/admin/auth.js';
import adminWebAuthnRoutes from './routes/admin/webauthn.js';
import adminProductRoutes from './routes/admin/products.js';
import adminCategoryRoutes from './routes/admin/categories.js';
import adminReviewRoutes from './routes/admin/reviews.js';
import { cleanupMiddleware } from './utils/cleanupExpiredChallenges.js';
import { initSentry, captureException } from './lib/sentry.js';
import Sentry from '@sentry/node';

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Initialize Sentry for error tracking
  initSentry(fastify);

  // Register CORS - allow both frontend and admin app
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL, process.env.ADMIN_URL]
      : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // Register cookie support
  await fastify.register(cookie);

  // Register session with Redis store
  await fastify.register(session, {
    store: new RedisSessionStore(redis),
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production-at-least-32-characters-long',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    },
    saveUninitialized: false
  });

  // Decorators for database clients
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);

  // Sentry request tracking
  fastify.addHook('onRequest', async (request, reply) => {
    // Start a new Sentry transaction for each request
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${request.method} ${request.routeOptions?.url || request.url}`,
      data: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    });

    // Store transaction on request for later use
    request.sentryTransaction = transaction;

    // Set user context if available (from session)
    if (request.session?.adminId) {
      Sentry.setUser({ id: request.session.adminId });
    }
  });

  fastify.addHook('onResponse', async (request, reply) => {
    // Finish the Sentry transaction
    if (request.sentryTransaction) {
      request.sentryTransaction.setHttpStatus(reply.statusCode);
      request.sentryTransaction.finish();
    }
  });

  // Add cleanup middleware for expired WebAuthn challenges
  // Runs asynchronously on each request without blocking
  fastify.addHook('onRequest', cleanupMiddleware);

  // Global error handler - capture all unhandled errors in Sentry
  fastify.setErrorHandler(async (error, request, reply) => {
    // Log the error
    request.log.error(error);

    // Capture exception in Sentry with request context
    captureException(error, {
      tags: {
        route: request.routeOptions?.url || request.url,
        method: request.method,
      },
      extra: {
        url: request.url,
        params: request.params,
        query: request.query,
        body: request.body,
        headers: request.headers,
      },
      user: request.session?.adminId ? { id: request.session.adminId } : undefined,
    });

    // Determine status code
    const statusCode = error.statusCode || 500;

    // Send error response
    reply.code(statusCode).send({
      error: true,
      message: statusCode === 500 ? 'Internal Server Error' : error.message,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  });

  // Health check route
  fastify.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return {
        status: 'ok',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(503);
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Register public routes
  fastify.register(productRoutes, { prefix: '/api/products' });
  fastify.register(categoryRoutes, { prefix: '/api/categories' });

  // Register admin routes
  fastify.register(adminAuthRoutes, { prefix: '/api/admin/auth' });
  fastify.register(adminWebAuthnRoutes, { prefix: '/api/admin/webauthn' });
  fastify.register(adminProductRoutes, { prefix: '/api/admin/products' });
  fastify.register(adminCategoryRoutes, { prefix: '/api/admin/categories' });
  fastify.register(adminReviewRoutes, { prefix: '/api/admin/reviews' });

  return fastify;
}
