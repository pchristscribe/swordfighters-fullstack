import 'dotenv/config';
import { buildApp } from './app.js';
import prisma from './lib/prisma.js';
import redis from './lib/redis.js';

const fastify = await buildApp();

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
