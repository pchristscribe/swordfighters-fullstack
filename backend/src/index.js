import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import prisma from './lib/prisma.js';
import redis from './lib/redis.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';

const fastify = Fastify({
  logger: {
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

// Graceful shutdown
const closeGracefully = async (signal) => {
  console.log(`\nReceived signal to terminate: ${signal}`);
  await fastify.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Server ready at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
