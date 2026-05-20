import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Point tests at local Docker stack (same defaults as docker-compose.yml)
    // so they work even when backend/.env uses a remote Supabase URL.
    env: {
      TEST_DATABASE_URL: 'postgresql://swordfighters:dev_password_change_in_production@localhost:5432/swordfighters_test',
      TEST_REDIS_URL: 'redis://:dev_redis_password@localhost:6379',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    setupFiles: ['./tests/setup.js'],
  },
})
