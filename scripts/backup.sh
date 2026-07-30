#!/bin/bash
# =============================================================================
# Longevity Platform — Automated Database Backup
# =============================================================================
# Run daily via cron: 0 2 * * * /opt/longevity-staging/scripts/backup.sh
# =============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/longevity-staging/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-longevity_staging}"
DB_USER="${DB_USER:-longevity_staging}"
CONTAINER_NAME="${CONTAINER_NAME:-longevity-staging-db}"

mkdir -p "$BACKUP_DIR"

echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Starting backup of $DB_NAME..."

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" --clean --if-exists \
  | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Backup completed: ${DB_NAME}_${TIMESTAMP}.sql.gz"

# Remove old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Cleaned up backups older than $RETENTION_DAYS days"

# Verify backup integrity
gunzip -t "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Backup integrity verified"
