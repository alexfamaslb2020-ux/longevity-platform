# Testing

## Test Suites

| Suite | Location | Command | Tests |
|-------|----------|---------|-------|
| Unit (API) | `apps/api/src/**/*.spec.ts` | `npm run test -- --filter @longevity/api` | 21 |
| Unit (Web) | `apps/web/src/**/*.spec.ts` | `npm run test -- --filter @longevity/web` | 12 |
| E2E (API) | `apps/api/test/*.e2e-spec.ts` | `npm run test:e2e` | See below |

## E2E Test Suites

| Suite | File | What it covers |
|-------|------|----------------|
| Health | `health.e2e-spec.ts` | `/health`, `/health/live`, `/health/ready` |
| Auth | `auth.e2e-spec.ts` | Register, login, refresh, invalid credentials, RBAC |
| Multi-Tenant | `multi-tenant.e2e-spec.ts` | Org isolation for leads, customers; cross-org access blocked |
| Journey | `journey.e2e-spec.ts` | Full user journey: lead → convert → customer → check-in |

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests (requires PostgreSQL + Redis)
cd apps/api
DATABASE_URL=postgresql://longevity:longevity@localhost:5432/longevity_test npm run test:e2e

# Coverage
cd apps/api && npx jest --coverage
cd apps/web && npx jest --coverage
```

## Test Database

- Database: `longevity_test`
- Never use the development database for tests
- Global setup applies migrations before tests
- `beforeEach` truncates all tables (except `_prisma_migrations`)

## Coverage Thresholds

| Metric | Minimum |
|--------|---------|
| Statements | 70% |
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |

Higher coverage expected for critical modules: Auth, Multi-Tenant, Conversion, Workflows, Risk, Webhooks.

## Frontend Tests

- Jest + jsdom
- Tests cover the API client (`api.spec.ts`)
- Additional component tests can use React Testing Library

## E2E Prerequisites

```bash
# Start dependencies
docker compose -f docker/docker-compose.yml up -d postgres redis

# Run tests
npm run test:e2e
```

## CI Integration

Tests run in GitHub Actions with:
- PostgreSQL service container
- Redis service container
- Separate test database
- Migrations applied automatically
