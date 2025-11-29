import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('✓ Redis connected');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redisClient;
