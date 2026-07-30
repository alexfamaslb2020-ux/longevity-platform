# Testing Documentation

## Test Suites

| Suite | Command | Count | Scope |
|---|---|---|---|
| Unit (API) | `npm run test` (in `apps/api`) | 21 | Services, guards, pipes |
| Unit (Web) | `npm run test` (in `apps/web`) | 12 | API client, utilities |
| E2E | `npm run test:e2e` (in `apps/api`) | 35 | Full HTTP + DB cycle |
| Lint | `npm run lint` | 0 errors, 87 warnings | ESLint |
| Typecheck | `npm run typecheck` | 0 errors | TypeScript |
| Build | `npm run build` | 0 errors | Compilation |

## E2E Test Structure

E2E tests are in `apps/api/test/` and cover:

| File | Tests | Purpose |
|---|---|---|
| `auth.e2e-spec.ts` | 9 | Register, login, refresh, me, invalid credentials |
| `health.e2e-spec.ts` | 3 | Health, live, ready endpoints |
| `multi-tenant.e2e-spec.ts` | 12 | Organization isolation for leads and customers |
| `journey.e2e-spec.ts` | 12 | Full lead-to-check-in main journey |

## Running Tests

```bash
# All tests (sequential to avoid DB conflicts)
npx jest --config test/jest-e2e.json --runInBand

# Single test suite
npx jest --config test/jest-e2e.json --runInBand test/auth.e2e-spec.ts

# With specific DB
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" npx jest --config test/jest-e2e.json --runInBand
```

## Test Database

- Name must contain "test" (validated by `global-setup.ts`)
- Tables are truncated before each test suite
- Data is recreated per suite

## CI Pipeline

See `.github/workflows/ci.yml` for the full pipeline definition.
