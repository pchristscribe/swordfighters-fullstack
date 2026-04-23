# Copilot Instructions for Swordfighters

**Project**: Affiliate marketing platform curating products from DHgate, AliExpress, Amazon, and Wish for gay men.

## Architecture Overview

### Services
- **Frontend** (Nuxt 3, port 3000): Public product catalog with filtering
- **Admin Frontend** (Nuxt 3, port 3002): WebAuthn-secured admin panel
- **Backend** (Fastify, port 3001): API serving both frontends
- **PostgreSQL**: Product/category/review data (Docker)
- **Redis**: Session storage, product caching, Bull task queue (Docker)

### Data Flow
1. Public users browse products via frontend → Fastify API (cached at 5min/1hr)
2. Admins authenticate via WebAuthn → Fastify session (Redis-backed, 7-day expiry)
3. Products/categories fetched via Pinia store (reactive filtering, pagination)
4. Cache invalidation on data mutations (PATCH/DELETE)

## Project Structure

```
backend/               # Fastify API (Node.js 20+)
├── src/
│   ├── app.js        # Express middleware setup (CORS, sessions, routes)
│   ├── index.js      # Entry point
│   ├── routes/
│   │   ├── products.js          # GET/POST/PATCH/DELETE /api/products
│   │   ├── categories.js        # GET /api/categories
│   │   └── admin/
│   │       ├── auth.js          # Legacy password auth (WebAuthn primary)
│   │       ├── webauthn.js      # Registration/verification endpoints
│   │       └── products.js      # Admin CRUD with auth middleware
│   ├── middleware/
│   │   └── adminAuth.js         # Session-based auth guard
│   └── lib/
│       ├── prisma.js            # Prisma client singleton
│       └── redis.js             # Redis client with auth
├── prisma/
│   ├── schema.prisma            # Data models (see schema details below)
│   └── migrations/              # PostgreSQL migrations

frontend/              # Public Nuxt 3 app (SSR-capable)
├── app/
│   ├── pages/index.vue          # Product grid with filters
│   ├── pages/products/[id].vue  # Product detail page
│   ├── stores/products.ts       # Pinia store (see patterns)
│   ├── composables/useApi.ts    # API client wrapper
│   └── types/index.ts           # TypeScript interfaces

admin-frontend/        # Admin Nuxt 3 app (port 3002)
├── app/
│   ├── middleware/auth.ts       # Nuxt middleware for protected routes
│   └── pages/
│       ├── login.vue            # WebAuthn registration/login
│       └── [admin pages]        # CRUD interfaces
```

## Database Schema (Prisma)

**Core Models**:
- `Product`: Platform-specific products (DHGATE|ALIEXPRESS|AMAZON|WISH)
  - Unique constraint: `[platform, externalId]`
  - Status: ACTIVE|INACTIVE|OUT_OF_STOCK
  - Indexes: platform, categoryId, status, priceUpdatedAt
- `Category`: Product categories (unique name/slug)
- `Review`: User-submitted reviews (1-5 rating, pros/cons arrays)
- `AffiliateLink`: Dub.co tracked URLs (clicks, conversions, revenue)
- `Admin`: Admin users (passwordHash optional for WebAuthn-only auth)
- `WebAuthnCredential`: Hardware/biometric keys (counter for replay protection)

## Critical Patterns

### Frontend (Pinia Store)
```typescript
// stores/products.ts structure:
- state: { products, categories, pagination, filters, loading, error }
- actions: fetchProducts(filters?), setFilters(filters), resetFilters()
- getters: getProductById(id), hasMore, totalProducts
// Filter reset always sets page=1 to avoid invalid offsets
// All fetch actions merge provided filters with current filters
```

### API Client (useApi)
```typescript
// composables/useApi.ts:
- apiFetch<T>(endpoint, options) handles JSON headers and error logging
- getProducts(params?) → {products, pagination}
- getProduct(id)
- getCategories()
// Uses nuxt runtime config for API base URL
```

### Backend Caching
```javascript
// routes/products.js pattern:
- List endpoint: Cache key from query params, TTL 5min
- Single endpoint: Cache key `product:{id}`, TTL 1hr
- On mutation (PATCH/DELETE): redis.del() invalidates specific cache
// No list cache invalidation (avoid stampedes)
```

### Authentication (Backend)
```javascript
// Session middleware:
- Fastify session plugin (Redis store, 7-day expiration)
- Secure: true in production, httpOnly, sameSite=lax
- CORS allows localhost:3000, localhost:3002 in dev
// WebAuthn endpoints: /api/admin/webauthn/{register,authenticate}/{options,verify}
```

## Development Workflows

### Setup
```bash
# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d

# Backend
cd backend
npm install
npm run prisma:generate  # Generate Prisma client
npm run prisma:seed      # Seed test data (optional)
npm run dev              # Starts on http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev              # Starts on http://localhost:3000

# Admin Frontend
cd admin-frontend
npm install
npm run dev              # Starts on http://localhost:3002
```

### Testing
```bash
# Backend unit tests
cd backend
npm run test             # Single run with Vitest
npm run test:watch      # Watch mode
npm run test:ui         # UI dashboard

# Frontend tests
cd frontend
npm run test
npm run test:watch
npm run test:coverage   # With coverage report
```

### Database
```bash
# View schema UI
npm run prisma:studio   # Interactive schema viewer

# Create migration after schema changes
npm run prisma:migrate

# Seed database
npm run prisma:seed     # Runs prisma/seed.js
```

## Conventions

### TypeScript
- Use `type Platform = 'DHGATE' | 'ALIEXPRESS' | 'AMAZON' | 'WISH'` (not enums in client code)
- Product types in `frontend/app/types/index.ts`, types referenced as `~/types`
- Nullable fields use `Field?` or `Field | null`

### API Responses
- Success: `{ data, pagination? }` (GET list), or `{ ...resource }` (single)
- Error: `{ error: string }` (consistency across endpoints)
- Pagination: `{ page, limit, total, pages }` always included in list responses

### Component Patterns
- Nuxt `<NuxtLink :to>` for product navigation
- Form handlers call `productStore.setFilters()` then `fetchProducts()` (not direct mutations)
- Use optional chaining (`?.`) when accessing store properties (defensive)
- Template loops: `v-for="item in (store?.items || [])"` pattern

### Admin Authentication
- WebAuthn (primary): FIDO2 compliance, hardware keys / biometrics
- Session: 7-day expiry, Redis-backed
- Middleware in routes: Check `request.session.admin` in adminAuth.js

## FTC Compliance

All affiliate links must include:
- Disclosure that site receives monetary compensation
- Links tracked via Dub.co (`AffiliateLink.trackedUrl`)
- Revenue/conversion tracking stored in database

## Common Commands

```bash
# API health check
curl http://localhost:3001/health

# Product list with filters
curl "http://localhost:3001/api/products?platform=DHGATE&page=1&limit=20"

# Single product
curl http://localhost:3001/api/products/{id}

# View Redis keys
docker exec -it swordfighters-redis redis-cli -a dev_redis_password
> KEYS *
> GET products:list:...

# View database
docker exec -it swordfighters-postgres psql -U swordfighters -d swordfighters_db
```

## Production Notes

- Set `SESSION_SECRET` to 64+ character random string
- Set `RP_ID` = your domain (required for WebAuthn)
- All services (both frontends and backend) deploy to Railway (see `RAILWAY.md`)
- Database: Supabase (PostgreSQL)
- Ensure HTTPS in production (WebAuthn requirement)
