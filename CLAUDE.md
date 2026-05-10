# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Swordfighters App is an affiliate marketing platform targeting gay men, curating products from DHgate, AliExpress, Amazon, and Wish. Features include:
- Product reviews and seasonal recommendations
- Targeted drop shipping on DHgate for group orders
- FTC-compliant disclosure of affiliate relationships and monetary considerations

## Repository Structure

```
swordfighters-fullstack/
├── admin-frontend/            # Admin panel with WebAuthn authentication (Port 3002)
├── frontend/                  # User-facing product catalog (Port 3000)
├── backend/                   # Backend API (external service — not actively developed here)
├── backend-security-reference/ # Security reference implementation (middleware, routes, utils)
├── mcp-dhgate/                # DHgate MCP server for product scraping
├── supabase/migrations/       # Supabase DB migrations
├── keys/                      # Key storage (see README inside)
├── .github/                   # CI/CD workflows and issue templates
├── docker-compose.yml         # PostgreSQL + Redis infrastructure
├── .env.example               # Environment variable template
└── .mcp.json                  # MCP server config (DeepGraph Vue MCP)
```

**Note**: The backend API is an external service deployed separately. Do not add backend features here.

## Tech Stack

### Admin Frontend (`admin-frontend/`)
- **Framework**: Nuxt 4 (Vue 3 + SSR), `compatibilityDate: '2025-11-29'`
- **Port**: 3002 (HMR: 24678)
- **Modules**: `@pinia/nuxt`, `@nuxtjs/tailwindcss`, `@nuxtjs/supabase`
- **Auth**: WebAuthn via `@simplewebauthn/browser@^13.2.2` (passwordless with security keys/Touch ID)
- **Monitoring**: Sentry (`@sentry/nuxt`)
- **Testing**: Vitest + Vue Test Utils + happy-dom
- **Security**: CSRF protection, CSP headers configured in `nuxt.config.ts`

### User Frontend (`frontend/`)
- **Framework**: Nuxt 4 (Vue 3 + SSR), `compatibilityDate: '2025-07-15'`
- **Port**: 3000 (HMR: 24677)
- **Modules**: `@nuxtjs/tailwindcss`, `@pinia/nuxt`, `nuxt-headlessui` (prefix: `Headless`), `@nuxtjs/supabase`
- **Monitoring**: Sentry (`@sentry/nuxt`)
- **Testing**: Vitest + Vue Test Utils + happy-dom
- **Linting**: ESLint with typescript-eslint, eslint-plugin-vue

### Backend API (External Service)
- Runtime: Node.js 24+, Framework: Fastify
- Database: PostgreSQL with Prisma ORM
- Task Queue: Bull (Redis-backed)
- Caching: Redis
- Affiliate Link Tracking: Dub + custom layer

### Infrastructure
- Docker Compose: PostgreSQL 16 (`swordfighters-postgres`) + Redis 7 (`swordfighters-redis`)
- Production: Vercel (frontends), Railway/Render (backend), Supabase (DB), Sentry (monitoring)
- CI/CD: GitHub Actions (`main.yml`, `claude.yml`, `claude-code-review.yml`, `eslint.yml`)

## Directory Deep-Dive

### Admin Frontend (`admin-frontend/`)

```
admin-frontend/
├── app/
│   ├── components/
│   │   └── DarkModeToggle.vue
│   ├── composables/
│   │   ├── useCsrf.ts           # CSRF token management
│   │   ├── useDarkMode.ts       # Dark/light mode toggle
│   │   └── useSupabaseAdmin.ts  # Supabase admin utilities
│   ├── layouts/
│   │   └── default.vue
│   ├── middleware/
│   │   └── auth.ts              # Route guard for authenticated pages
│   ├── pages/
│   │   ├── index.vue            # Dashboard
│   │   ├── login.vue            # WebAuthn login
│   │   ├── products/index.vue   # Product management
│   │   ├── categories.vue       # Category management
│   │   ├── reviews.vue          # Review moderation
│   │   ├── diagnostic.vue       # Diagnostic tools
│   │   └── test-webauthn.vue    # WebAuthn testing page
│   ├── stores/
│   │   └── auth.ts              # Pinia auth store
│   ├── types/
│   │   ├── database.types.ts    # Supabase-generated DB types
│   │   └── supabase.ts          # Supabase client types
│   └── utils/
│       └── security.ts          # Security helpers
├── tests/
│   ├── auth.test.ts             # WebAuthn auth tests (30+)
│   ├── darkMode.test.ts
│   └── security.test.ts
├── nuxt.config.ts
├── tailwind.config.js
├── vitest.config.ts
├── sentry.client.config.ts
└── sentry.server.config.ts
```

### User Frontend (`frontend/`)

```
frontend/
├── app/
│   ├── components/
│   │   ├── ProductCard.vue
│   │   ├── ProductCardSimple.vue
│   │   ├── ProductGrid.vue
│   │   ├── SearchBar.vue
│   │   ├── Pagination.vue
│   │   ├── DarkModeToggle.vue
│   │   ├── feedback/
│   │   │   ├── AppToast.vue
│   │   │   ├── AppToastContainer.vue
│   │   │   ├── AppModal.vue
│   │   │   └── AppAlert.vue
│   │   └── filters/
│   │       ├── ProductFilters.vue    # Main filter container
│   │       ├── CategoryFilter.vue
│   │       ├── PriceRangeFilter.vue
│   │       ├── RatingFilter.vue
│   │       └── SortingControls.vue
│   ├── composables/
│   │   ├── useDarkMode.ts
│   │   ├── useApi.ts                 # API communication
│   │   ├── useToast.ts               # Toast notification system
│   │   └── useSupabaseProducts.ts    # Supabase product fetching
│   ├── layouts/
│   │   └── default.vue
│   ├── pages/
│   │   ├── index.vue                 # Product catalog home
│   │   ├── products/[id].vue         # Product detail (dynamic route)
│   │   └── search-demo.vue           # Search demonstration
│   ├── stores/
│   │   ├── filters.ts   # Filter state (category, platform, price, rating, sort)
│   │   ├── cart.ts      # Shopping cart
│   │   └── products.ts  # Product catalog
│   └── types/
│       ├── index.ts
│       ├── filters.ts
│       ├── database.types.ts
│       └── supabase.ts
├── tests/
│   ├── ProductCard.test.ts
│   ├── ProductCardSimple.test.ts
│   ├── SearchBar.test.ts
│   ├── cart.test.ts
│   ├── darkMode.test.ts
│   ├── filters.test.ts
│   ├── stores.test.ts
│   ├── types.test.ts
│   ├── useToast.test.ts
│   └── components/
├── nuxt.config.ts
├── tailwind.config.js
├── vitest.config.ts
├── eslint.config.ts
└── tsconfig.json
```

### DHgate MCP Server (`mcp-dhgate/`)

MCP server for scraping DHgate product data. Has its own `src/` with `index.ts`, `tools/`, `types.ts`, `utils/`, and `config.ts`. Configured in `.mcp.json` via `DeepGraph Vue MCP` alongside this tool.

## Development Setup

### Initial Setup
1. Copy `.env.example` to `.env` and fill in values
2. Start infrastructure:
   ```bash
   docker-compose up -d
   docker-compose ps   # verify healthy
   ```

### Frontend Development

```bash
# Admin Panel (http://localhost:3002)
cd admin-frontend && npm install && npm run dev

# User Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

Both frontends can run concurrently — they use separate HMR ports (24678 and 24677).

### Running Tests

```bash
# Admin Frontend
cd admin-frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report

# User Frontend
cd frontend
npm test
npm run test:watch
npm run test:ui
npm run test:coverage
```

### Database Management
```bash
# PostgreSQL
docker exec -it swordfighters-postgres psql -U swordfighters -d swordfighters_db

# Redis CLI
docker exec -it swordfighters-redis redis-cli -a dev_redis_password
```

### Common Docker Commands
```bash
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose logs -f [svc]  # View logs
docker-compose restart        # Restart services
docker-compose down -v        # Remove volumes (⚠️ deletes all data)
```

## Testing & Quality Assurance

### Test Infrastructure
- **Framework**: Vitest
- **DOM**: happy-dom
- **Component testing**: @vue/test-utils
- **Coverage**: v8 provider, reports: text/json/html
- **Path aliases**: `~/`, `@/` (admin also has `#app`)

### Test Coverage Stats
- **66 Tests Created**: WebAuthn auth, input validation, frontend stores, components
- **52 Security Bugs Identified**: Documented in `VALIDATION_BUGS_FOUND.md`
- **95% Critical Path Coverage**: All major authentication flows

### Key Test Files
| File | Description |
|------|-------------|
| `admin-frontend/tests/auth.test.ts` | WebAuthn auth validation (30+ tests) |
| `admin-frontend/tests/security.test.ts` | Input sanitization, XSS, CSRF |
| `frontend/tests/cart.test.ts` | Cart store operations |
| `frontend/tests/filters.test.ts` | Filter store and UI |
| `frontend/tests/SearchBar.test.ts` | Search component (17.9 KB) |
| `frontend/tests/ProductCard.test.ts` | Product card component |
| `frontend/tests/useToast.test.ts` | Toast composable |
| `frontend/tests/stores.test.ts` | General store tests |
| `frontend/tests/types.test.ts` | Type safety validation |

### Testing Requirements for New Features
- Vitest tests with >80% coverage
- Input validation tests for all user inputs
- Error handling tests for API calls
- SSR safety checks (no browser-only code running server-side)

## Design System

Both frontends share an identical Tailwind config with:

### Colors
- `brand`: Deep red (`#8B1E2D`) — primary brand color
- `accent`: Skin tone (`#D6A77A`) — secondary accent
- `surface`: Light/dark background variants
- `ink`: Text color variants
- `status`: `error`, `warning`, `success`, `info`

### Typography
- Font: **Dosis** (variable weight 200–800, loaded via Google Fonts)

### Dark Mode
- Implemented via `class` strategy (`dark:` prefix in Tailwind)
- Managed by `useDarkMode` composable in both frontends
- Toggle component: `DarkModeToggle.vue`

### UI Components (User Frontend)
- Headless UI components prefixed with `Headless` (e.g., `<HeadlessDialog>`)
- Feedback components: `AppToast`, `AppModal`, `AppAlert`, `AppToastContainer`

## State Management (Pinia)

### Admin Frontend Stores
| Store | File | Purpose |
|-------|------|---------|
| `auth` | `stores/auth.ts` | WebAuthn session, user state |

### User Frontend Stores
| Store | File | Purpose |
|-------|------|---------|
| `filters` | `stores/filters.ts` | Category, platform, price range, rating, sort |
| `cart` | `stores/cart.ts` | Cart items and totals |
| `products` | `stores/products.ts` | Product catalog data |

**Filter store** maps to URL query params via `toQueryParams()` and `initFromQuery()`. Price range: 0–500. Sort: `createdAt` (default), `desc` (default order).

## Authentication (Admin Frontend)

WebAuthn (passwordless) via `@simplewebauthn/browser`:
- Login page: `/login`
- Auth middleware: `app/middleware/auth.ts` — guards all protected routes
- Auth store: `app/stores/auth.ts`
- CSRF protection: `useCsrf` composable
- Supabase backed: `useSupabaseAdmin` composable
- CSP headers configured in `nuxt.config.ts` to prevent XSS

## Environment Variables

Key variables (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NUXT_PUBLIC_SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Supabase service role key (admin only) |
| `API_BASE_URL` | Backend API base (default: `http://localhost:3001`) |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `REDIS_PASSWORD` | Redis password (default: `dev_redis_password`) |
| `DHGATE_API_KEY` | DHgate affiliate API key |
| `ALIEXPRESS_API_KEY` | AliExpress affiliate API key |
| `AMAZON_ASSOCIATES_TAG` | Amazon Associates tag |
| `WISH_API_KEY` | Wish affiliate API key |

## Code Style Rules

### Formatting
- No semicolons
- Single quotes
- No unnecessary curly braces
- 2-space indentation
- Import order: external → internal → types

### Vue / Nuxt Conventions
- Use `defineNuxtConfig` for config (not raw Nuxt options)
- Use `useRuntimeConfig()` to access env vars in components
- Avoid browser-only code at module level (SSR will fail); guard with `process.client` or `onMounted`
- Composables live in `app/composables/` — auto-imported by Nuxt
- Stores live in `app/stores/` — auto-imported via `@pinia/nuxt`
- Types live in `app/types/`

### Security
- Never commit real secrets — use `.env` (gitignored)
- All user inputs must be validated and sanitized
- CSRF tokens required for state-mutating requests (admin frontend)
- FTC disclosure required on all affiliate links and sponsored content

## Documentation Files

| File | Description |
|------|-------------|
| `README.md` | Main project overview |
| `CLAUDE.md` | This file — AI assistant guidance |
| `ADMIN_PANEL_SETUP.md` | WebAuthn setup and admin panel guide |
| `TEST_COVERAGE_SUMMARY.md` | Test metrics and results |
| `VALIDATION_BUGS_FOUND.md` | Security vulnerabilities documented |
| `SECURITY.md` | Security overview |
| `SECURITY_GUIDE.md` | Detailed security guide |
| `TOUCHID_DEBUG.md` | Touch ID debugging reference |
| `frontend/FILTERING_SYSTEM.md` | Product filter architecture |
| `frontend/FILTERING_IMPLEMENTATION_REPORT.md` | Filter implementation details |
| `SearchBar_Component_Report.md` | SearchBar component analysis |

## Legal Compliance

All affiliate links and sponsored content must include FTC-compliant disclosures stating that the site receives monetary compensation from affiliate programs.
