# Local Development

## Environment Variables

### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://longevity:longevity@localhost:5432/longevity
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
```

### Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Infrastructure

### Docker (PostgreSQL + Redis)
```bash
docker compose -f docker/docker-compose.yml up -d
```

### Or local PostgreSQL
```bash
# Windows (assumes PostgreSQL installed)
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
createdb -U longevity longevity
```

## Database

```bash
cd apps/api

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name initial_mvp

# Seed data (creates org, users, sample leads, customers)
npx prisma db seed

# View data
npx prisma studio
```

## Running

```bash
# Full stack (API + Web)
npm run dev

# API only
npm run dev -- --filter @longevity/api

# Web only
npm run dev -- --filter @longevity/web
```

## Testing

```bash
# All tests
npm run test

# API tests
npm run test -- --filter @longevity/api

# Web tests
npm run test -- --filter @longevity/web

# Watch mode
cd apps/api && npx jest --watch
cd apps/web && npx jest --watch
```

## Static Analysis

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # Production build
```
