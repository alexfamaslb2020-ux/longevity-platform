# Backup and Restore

## PostgreSQL Backups

### Automated Backups

Backups run daily via a cron job on the staging server:

```bash
# Backup script location: /opt/longevity-staging/scripts/backup.sh
# Runs at: 02:00 daily
# Retention: 30 days
# Storage: /opt/longevity-staging/backups/
```

Backup script:

```bash
#!/bin/bash
BACKUP_DIR="/opt/longevity-staging/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="longevity_staging"

mkdir -p "$BACKUP_DIR"

docker exec longevity-staging-db pg_dump -U longevity_staging $DB_NAME \
  | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Delete backups older than retention period
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

### Manual Backup

```bash
docker exec longevity-staging-db pg_dump -U longevity_staging longevity_staging \
  | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Stop API (to prevent writes)
docker compose -f docker/docker-compose.staging.yml stop api

# Drop and recreate database
docker exec longevity-staging-db psql -U longevity_staging -c "DROP DATABASE IF EXISTS longevity_staging;"
docker exec longevity-staging-db psql -U longevity_staging -c "CREATE DATABASE longevity_staging;"

# Restore from backup
gunzip -c backup_20260101.sql.gz | docker exec -i longevity-staging-db psql -U longevity_staging longevity_staging

# Apply any pending migrations
docker compose -f docker/docker-compose.staging.yml run --rm api npx prisma migrate deploy

# Restart API
docker compose -f docker/docker-compose.staging.yml start api
```

### Restore Test

Run monthly:

```bash
# Restore to a temporary database
docker exec longevity-staging-db psql -U longevity_staging -c "CREATE DATABASE longevity_staging_restore_test;"
gunzip -c latest_backup.sql.gz | docker exec -i longevity-staging-db psql -U longevity_staging longevity_staging_restore_test

# Verify data exists
docker exec longevity-staging-db psql -U longevity_staging longevity_staging_restore_test -c "SELECT COUNT(*) FROM \"Lead\";"

# Drop test database
docker exec longevity-staging-db psql -U longevity_staging -c "DROP DATABASE longevity_staging_restore_test;"
```

## Backup Retention Policy

| Type | Frequency | Retention |
|---|---|---|
| Daily full backup | 02:00 daily | 30 days |
| Weekly full backup | Sunday 02:00 | 12 weeks |
| Monthly full backup | 1st of month | 12 months |

## Redis Persistence

Redis uses AOF (Append-Only File) persistence with `appendonly yes`.

Redis data is not backed up separately — it can be rebuilt from the database and application state.

## What to Do If a Backup Fails

1. Check disk space: `df -h`
2. Check backup logs: `/var/log/backup.log`
3. Run manual backup (see above)
4. Fix the cause and verify next day's backup succeeds
