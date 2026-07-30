# Incident Response

## Monitoring

- Health endpoints: `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`
- Readiness checks PostgreSQL and Redis connectivity
- Sentry integration for error tracking (configure `SENTRY_DSN`)

## Common Issues

### Webhook not processing
1. Check `WebhookEvent` status via database
2. Verify BullMQ queue is running (`npm run dev` starts the worker)
3. Check Redis connectivity
4. Review worker logs for retry attempts

### Rate limiting too aggressive
1. Adjust `THROTTLE_*` environment variables
2. Or disable entirely with `RATE_LIMIT_DISABLED=true` (not for production)

### Multi-tenant isolation failure
1. Check `organizationId` is set on all entities
2. Verify `MultiTenantService.assertEntityOwnership` calls
3. Review cross-org relationship tests

### Database migration issues
```bash
cd apps/api
npx prisma migrate status
npx prisma migrate diff
npx prisma db push --force-reset  # last resort, loses data
```

### BullMQ queue stuck
1. Check Redis: `redis-cli ping`
2. Check queue: `redis-cli llen bull:webhooks:wait`
3. Restart the worker

## Recovery

### Manual webhook retry
```bash
curl -X POST /api/v1/webhooks/events/:id/retry \
  -H "Authorization: Bearer <admin-token>"
```

### Re-process all failed events
```bash
curl -X GET /api/v1/webhooks/events/failed \
  -H "Authorization: Bearer <admin-token>"
```

### Reset rate limit counters
```bash
redis-cli FLUSHALL  # clears all rate limit counters
```

## Rollback

1. Revert code to previous commit
2. Run `npm run build`
3. Apply database rollback if needed
4. Restart services

## Contacts

- System admin: admin@longevity.pt
- DevOps: devops@longevity.pt
- On-call: documented in team rotation
