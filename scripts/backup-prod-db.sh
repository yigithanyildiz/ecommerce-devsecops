#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infrastructure/prod/docker-compose.prod.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-ecommerce}"
POSTGRES_DB="${POSTGRES_DB:-ecommerce_prod}"
BACKUP_DIR="${BACKUP_DIR:-backups/prod}"
TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  printf "Backup failed: %s is empty.\n" "$BACKUP_FILE"
  exit 1
fi

printf "Database backup created: %s\n" "$BACKUP_FILE"
ls -lh "$BACKUP_FILE"
