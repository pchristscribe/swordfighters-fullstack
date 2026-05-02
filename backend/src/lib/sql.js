import postgres from 'postgres'

// postgres-js connection. Replaces the Prisma client.
//
// We rely on `transform: postgres.camel` to map snake_case columns
// (e.g. `password_hash`, `is_active`, `last_login_at`) to camelCase
// in result objects, matching the property access patterns used
// across the route handlers.
//
// The connection URL is expected to carry sslmode (Supabase pooler
// URLs include `?sslmode=require`); for local dev with docker-compose
// the URL has no sslmode and SSL is skipped.
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(connectionString, {
  transform: postgres.camel,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  prepare: false, // Supabase pooler runs in transaction mode; prepared statements aren't supported
  onnotice: () => {}
})

export default sql
