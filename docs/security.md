# Security Documentation

## Environment Separation

| Environment | Database | Redis | Providers | Access |
|---|---|---|---|---|
| Development | `longevity` (local) | localhost:6379 | Mock | Localhost only |
| Test | `longevity_test` (local) | localhost:6379 | Mock | Localhost only |
| Staging | `longevity_staging` | Staging Redis | Mock | VPN + HTTPS |
| Production | `longevity_prod` | Production Redis | Real | VPN + HTTPS |

## Secrets Management

- **Never commit secrets to the repository**
- Use `.env` files locally (gitignored)
- Staging secrets are stored in GitHub Actions secrets
- Production secrets are stored in a secrets manager (TBD)

## Required Secrets

| Secret | Staging | Production |
|---|---|---|
| `DATABASE_URL` | staging DB | production DB |
| `JWT_SECRET` | 32+ chars, random | 64+ chars, random |
| `ENCRYPTION_KEY` | 32-byte hex | 32-byte hex |
| `REDIS_URL` | with password | with password |

## CORS Configuration

- **Development:** `*` (all origins)
- **Staging:** Specific origin (`https://staging.longevity.pt`)
- **Production:** Specific origins with subdomain wildcard

## Rate Limiting

- Login: 5 requests per minute per IP
- API: 30 requests per second per IP
- Configured at nginx level

## Additional Measures

- Helmet.js with security headers
- HSTS (short TTL in staging, long TTL in production)
- CSP disabled pending audit
- Request body size limited to 10MB
- Stack traces disabled in staging/production
- Debug mode forced off
- CORS restricted to known origins

## Incident Response

See [incident-response.md](./incident-response.md).
