# Staging Deployment

## Prerequisites

- Node.js >= 22
- Docker Desktop
- PostgreSQL 16
- Redis 7

## Environment

Copy `.env.example` to `.env` in `apps/api/` and configure:

| Variable | Staging Value |
|----------|--------------|
| `DATABASE_URL` | `postgresql://longevity:longevity@localhost:5432/longevity_staging` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_SECRET` | Random 32+ char string |
| `NODE_ENV` | `production` |

## Docker

```bash
# Start infrastructure
docker compose -f docker/docker-compose.yml up -d postgres redis

# Build and start API + Web
docker compose -f docker/docker-compose.yml up -d api web

# Check status
docker compose -f docker/docker-compose.yml ps

# View logs
docker compose -f docker/docker-compose.yml logs -f api
docker compose -f docker/docker-compose.yml logs -f web
```

## Without Docker

```bash
# Start services (local PostgreSQL + Redis required)
npm run dev

# Or production build
npm run build
cd apps/api && node dist/main
cd apps/web && npm run start
```

## Database

```bash
# Apply migrations
cd apps/api
DATABASE_URL=postgresql://longevity:longevity@localhost:5432/longevity_staging npx prisma migrate deploy

# Seed data
DATABASE_URL=postgresql://longevity:longevity@localhost:5432/longevity_staging npx prisma db seed
```

## Smoke Tests

```bash
# Health
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/health/live
curl http://localhost:3001/api/v1/health/ready

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@longevity.local","password":"dev-password-123"}'

# Web (check HTML response)
curl http://localhost:3000
```

## CI/CD

- CI runs on push to `main`, `staging`, and `test/*` branches
- Static analysis (lint, typecheck, build)
- Unit tests
- Integration tests (PostgreSQL + Redis service containers)
- E2E tests

## Validation Checklist

- [ ] Clean install works (`npm ci`)
- [ ] Lint passes (0 errors)
- [ ] Typecheck passes (0 errors)
- [ ] Build succeeds
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] PostgreSQL accepting connections
- [ ] Redis responding to ping
- [ ] Migrations applied without drift
- [ ] Seed idempotent
- [ ] Health endpoints return OK
- [ ] Rate limiting active
- [ ] Helmet headers present
- [ ] Multi-tenant isolation confirmed
- [ ] Webhook signature verified
- [ ] No external services required
- [ ] No real data used
