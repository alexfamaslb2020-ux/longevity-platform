# Security

## Authentication

- JWT access tokens (15min expiry)
- Refresh tokens (7 days, stored hashed in DB)
- Password hashing with bcrypt (10 rounds)
- Token endpoints: `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`

## Authorization (RBAC)

| Role | Level |
|------|-------|
| `ADMIN` | Full access across org |
| `MANAGER` | Admin minus user management |
| `SALES` | Leads, customers, appointments |
| `PROFESSIONAL` | Check-ins, risk, activity |
| `SUPPORT` | Read-only + messages |
| `CLIENT` | Own profile, own check-ins |

Guards: `@Roles('ADMIN', 'MANAGER')`.

## Multi-Tenant Isolation

- Every entity has `organizationId`
- `MultiTenantService` validates ownership on access
- Cross-org data access returns `NotFoundException`
- Tenant filter applied in business layer (not Prisma middleware)

## Audit Logging

Operations logged to `AuditLog` table:
- Lead conversion
- Customer updates
- High-risk check-in flags
- User role changes

## Security Checklist

- JWT signing with RS256 (configurable)
- CORS restricted in production
- Rate limiting pending (to be added with `@nestjs/throttler`)
- Input validation with `class-validator`
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by React server components + Content-Type headers
- Webhook signature verification: **not yet implemented**
- API key rotation: **not yet implemented**
- Security headers (Helmet): **not yet configured**
