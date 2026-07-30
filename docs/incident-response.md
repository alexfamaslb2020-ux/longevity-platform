# Incident Response

## Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| SEV1 | Service unavailable, data loss | Immediate |
| SEV2 | Feature degraded, non-critical | 1 hour |
| SEV3 | Minor issue, cosmetic | Next business day |

## Incident Response Procedure

### 1. Detection

Incidents can be detected via:
- Automated alerts (Sentry, health checks)
- Manual reports from team
- CI/CD pipeline failures

### 2. Triage

```
Is the API responding?
  ├── No  → Check nginx, Docker, recent deploy
  └── Yes → Check health endpoints

Is the database responding?
  ├── No  → Check PostgreSQL container, disk space
  └── Yes → Check query performance

Is Redis responding?
  ├── No  → Check Redis container, persistense
  └── Yes → Check queue depth
```

### 3. Containment

For SEV1 incidents:
1. Redirect traffic away from affected service
2. Rollback to last known good version
3. Restore from backup if data is affected
4. Notify the team

### 4. Resolution

1. Determine root cause
2. Apply fix
3. Verify in staging
4. Deploy to production (if applicable)
5. Update runbook with findings

### 5. Post-Mortem

Within 48 hours of SEV1:
- Root cause analysis
- Timeline of events
- Action items to prevent recurrence
- Update monitoring/alerting

## Common Incidents

### API Returns 503

1. Check if Docker containers are running: `docker ps`
2. Check API logs: `docker logs longevity-staging-api --tail 50`
3. Check if database is reachable: `docker exec longevity-staging-api ping postgres`
4. Restart API: `docker compose restart api`

### Database Connection Errors

1. Check PostgreSQL logs: `docker logs longevity-staging-db --tail 50`
2. Verify disk space: `df -h`
3. Verify PostgreSQL is accepting connections: `docker exec longevity-staging-db pg_isready -U longevity_staging`
4. Restart if needed: `docker compose restart postgres`

### Redis Connection Errors

1. Check Redis logs: `docker logs longevity-staging-redis --tail 50`
2. Verify password: `docker exec longevity-staging-redis redis-cli -a "${REDIS_PASSWORD}" ping`
3. Restart if needed: `docker compose restart redis`

### High Error Rate (5xx)

1. Check Sentry dashboard
2. Check API logs for stack traces
3. Check recent deploy for regressions
4. Rollback if necessary

### Migration Failure

1. Check migration logs
2. Verify migration has not been partially applied
3. Rollback migration if needed
4. Fix migration and re-apply

## Communication

During SEV1:
- Notify team via Slack #incidents channel
- Update status page if available
- Send incident report within 24 hours
