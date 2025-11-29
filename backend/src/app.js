import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './lib/prisma.js';
import redis from './lib/redis.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';

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

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:3000',
    credentials: true,
  });

  // Decorators for database clients
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);

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

  // Register routes
  fastify.register(productRoutes, { prefix: '/api/products' });
  fastify.register(categoryRoutes, { prefix: '/api/categories' });

  return fastify;
}
