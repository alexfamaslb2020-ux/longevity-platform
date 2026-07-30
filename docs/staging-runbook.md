# Staging Runbook

## Overview

This runbook covers day-to-day operations for the Longevity Platform staging environment.

**URL:** `https://staging.longevity.pt`

**Server:** `staging.longevity.pt` (port 22, SSH key required)

## How to Deploy

Automated via GitHub Actions:

1. Push to `staging` branch
2. Pipeline runs validation → builds images → deploys → smoke tests
3. Monitor at: `https://github.com/your-org/longevity-platform/actions`

Manual deployment:

```bash
ssh user@staging.longevity.pt
cd /opt/longevity-staging
git pull origin staging
docker compose -f docker/docker-compose.staging.yml build api web
docker compose -f docker/docker-compose.staging.yml run --rm api npx prisma migrate deploy
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate api web nginx
```

## How to Check Status

```bash
# Service status
docker compose -f docker/docker-compose.staging.yml ps

# Health endpoints
curl https://staging.longevity.pt/api/v1/health/live
curl https://staging.longevity.pt/api/v1/health/ready
curl https://staging.longevity.pt/api/v1/health/info

# Container logs
docker logs longevity-staging-api --tail 50
docker logs longevity-staging-nginx --tail 50
```

## How to View Logs

```bash
# API logs (follow)
docker logs -f longevity-staging-api

# nginx access logs
docker exec longevity-staging-nginx cat /var/log/nginx/staging-access.log

# nginx error logs
docker exec longevity-staging-nginx cat /var/log/nginx/staging-error.log

# All services
docker compose -f docker/docker-compose.staging.yml logs --tail=100 -f
```

## How to Apply Migrations

```bash
docker compose -f docker/docker-compose.staging.yml run --rm \
  -e DATABASE_URL="postgresql://longevity_staging:${STAGING_DB_PASSWORD}@postgres:5432/longevity_staging?schema=public" \
  api npx prisma migrate deploy
```

## How to Rollback

```bash
# Option 1: Revert to a specific image tag
export COMMIT_SHA=<previous-good-sha>
docker compose -f docker/docker-compose.staging.yml pull api web
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate api web nginx

# Option 2: If migrations need rollback
# 1. Restore database from backup (see backup-and-restore.md)
# 2. Revert code
git revert HEAD
git push origin staging
```

## How to Restart Services

```bash
# Restart all
docker compose -f docker/docker-compose.staging.yml restart

# Restart single service
docker compose -f docker/docker-compose.staging.yml restart api

# Full recreate
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate
```

## How to Resolve PostgreSQL Unavailable

```bash
# Check PostgreSQL logs
docker logs longevity-staging-db --tail 50

# Check connectivity
docker exec longevity-staging-api ping postgres
docker exec longevity-staging-db pg_isready -U longevity_staging

# Restart PostgreSQL
docker compose -f docker/docker-compose.staging.yml restart postgres

# If disk is full, check volume usage
docker system df

# Restore from backup if data is corrupted (see backup-and-restore.md)
```

## How to Resolve Redis Unavailable

```bash
# Check Redis logs
docker logs longevity-staging-redis --tail 50

# Check connectivity
docker exec longevity-staging-api ping redis

# Ping Redis
docker exec longevity-staging-redis redis-cli -a "${STAGING_REDIS_PASSWORD}" ping

# Restart Redis
docker compose -f docker/docker-compose.staging.yml restart redis
```

## How to Reprocess a Failed Webhook

```bash
# Check webhook logs
docker logs longevity-staging-api 2>&1 | grep -i webhook

# If using BullMQ, check the failed queue via Redis
docker exec longevity-staging-redis redis-cli -a "${STAGING_REDIS_PASSWORD}" LLEN bull:webhook:failed

# Retry failed jobs (via API if endpoint exists)
# Or manually trigger the webhook again
curl -X POST https://staging.longevity.pt/api/v1/webhooks/retry \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
```

## How to Check Dead-Letter Queue

```bash
# Check Redis DLQ
docker exec longevity-staging-redis redis-cli -a "${STAGING_REDIS_PASSWORD}" KEYS "bull:*:failed"

# Get queue stats
docker exec longevity-staging-redis redis-cli -a "${STAGING_REDIS_PASSWORD}" LLEN bull:checkin:failed
docker exec longevity-staging-redis redis-cli -a "${STAGING_REDIS_PASSWORD}" LLEN bull:webhook:failed
```

## How to Revoke Access

```bash
# Remove user from VPN (if using VPN)
# Update ip-allowlist.conf and reload nginx
docker exec longevity-staging-ginx nginx -s reload

# Remove SSH key from server
sudo rm /home/user/.ssh/authorized_keys

# Rotate secrets
# 1. Update .env.staging
# 2. Restart services: docker compose -f docker/docker-compose.staging.yml up -d --force-recreate
