import 'dotenv/config';
import { buildApp } from './app.js';
import prisma from './lib/prisma.js';
import redis from './lib/redis.js';
import { flushSentry } from './lib/sentry.js';

const fastify = await buildApp();

// Graceful shutdown
const closeGracefully = async (signal) => {
  console.log(`\nReceived signal to terminate: ${signal}`);

  try {
    // Close Fastify server
    await fastify.close();
    console.log('Fastify server closed');

    // Disconnect from database
    await prisma.$disconnect();
    console.log('Database disconnected');

    // Close Redis connection
    await redis.quit();
    console.log('Redis disconnected');

    // Flush Sentry events before exiting
    await flushSentry();
    console.log('Sentry events flushed');

    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
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
