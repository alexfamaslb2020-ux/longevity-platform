# Environments

## Development

| Property | Value |
|---|---|
| NODE_ENV | `development` |
| Database | `longevity` (local PostgreSQL) |
| Redis | localhost:6379 |
| API URL | http://localhost:3001 |
| Web URL | http://localhost:3000 |
| CORS | `*` (all origins) |
| Providers | Mock |
| HTTPS | No |
| HSTS | Disabled |

## Test

| Property | Value |
|---|---|
| NODE_ENV | `test` |
| Database | `longevity_test` (local PostgreSQL) |
| Redis | localhost:6379 |
| Providers | Mock |
| HTTPS | No |

## Staging

| Property | Value |
|---|---|
| NODE_ENV | `staging` |
| Database | `longevity_staging` (dedicated PostgreSQL) |
| Redis | Dedicated Redis (password-protected) |
| API URL | https://staging.longevity.pt |
| Web URL | https://staging.longevity.pt |
| CORS | `https://staging.longevity.pt` |
| Providers | Mock |
| HTTPS | Yes (Let's Encrypt) |
| HSTS | Short TTL (1 hour) |
| Access | VPN + IP allowlist |

## Environment Detection

```typescript
// apps/api/src/main.ts
const nodeEnv = configService.get<string>("app.nodeEnv", "development");

if (nodeEnv === "production") {
  // Production-only behavior
} else if (nodeEnv === "staging") {
  // Staging-specific behavior (restricted CORS, mock providers allowed)
} else {
  // Development/test behavior (permissive CORS, no validation)
}
```

## Environment Variables

See `.env.example` for development and `.env.staging.example` for staging.

Never share `.env` files containing real secrets.
