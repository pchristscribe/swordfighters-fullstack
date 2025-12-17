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

  // Add cleanup middleware for expired WebAuthn challenges
  // Runs asynchronously on each request without blocking
  fastify.addHook('onRequest', cleanupMiddleware);

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
