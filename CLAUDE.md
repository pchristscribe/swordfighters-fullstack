# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Swordfighters App is an affiliate marketing platform targeting gay men, curating products from DHgate, AliExpress, Amazon, and Wish. The app will feature:
- Product reviews and seasonal recommendations
- Targeted drop shipping on DHgate for group orders
- FTC-compliant disclosure of affiliate relationships and monetary considerations

## Tech Stack

### Frontend
- Framework: Nuxt 3 (Vue 3 + SSR)
- Styling: Tailwind CSS
- State Management: Pinia
- UI Components: Headless UI or shadcn-vue

### Backend
- Runtime: Node.js 20+
- Framework: Fastify
- Database: PostgreSQL with Prisma ORM
- Task Queue: Bull (Redis-backed for scraping/sync jobs)
- Caching: Redis (product data, affiliate link tracking)
- Affiliate Link Tracking: Dub + custom layer

### Development Environment
- Docker Compose for local development (PostgreSQL, Redis, backend services)
- Ensures consistency between dev and production environments

### Production Deployment
- Frontend: Vercel (Nuxt optimized)
- Backend: Railway or Render
- Database: Supabase (PostgreSQL)
- Scraping Jobs: GitHub Actions + Bull queue
- Monitoring: Sentry

## Development Setup

### Initial Setup
1. Copy `.env.example` to `.env` and update values as needed
2. Start infrastructure services:
   ```bash
   docker-compose up -d
   ```
3. Check service health:
   ```bash
   docker-compose ps
   ```

### Common Docker Commands
- Start services: `docker-compose up -d`
- Stop services: `docker-compose down`
- View logs: `docker-compose logs -f [service_name]`
- Restart services: `docker-compose restart`
- Remove volumes (⚠️ deletes data): `docker-compose down -v`

### Database Management
- Access PostgreSQL: `docker exec -it swordfighters-postgres psql -U swordfighters -d swordfighters_db`
- Access Redis CLI: `docker exec -it swordfighters-redis redis-cli -a dev_redis_password`

## Legal Compliance

All affiliate links and sponsored content must include FTC-compliant disclosures indicating that the site receives monetary compensation from affiliate programs.
- Always use descriptive variable names