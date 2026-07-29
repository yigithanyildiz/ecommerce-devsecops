#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
  printf "Refusing to restore without CONFIRM_RESTORE=yes.\n"
  printf "Usage: CONFIRM_RESTORE=yes %s path/to/backup.sql\n" "$0"
  exit 1
fi

if [[ $# -ne 1 ]]; then
  printf "Usage: CONFIRM_RESTORE=yes %s path/to/backup.sql\n" "$0"
  exit 1
fi

BACKUP_FILE="$1"
COMPOSE_FILE="${COMPOSE_FILE:-infrastructure/prod/docker-compose.prod.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-ecommerce}"
POSTGRES_DB="${POSTGRES_DB:-ecommerce_prod}"

if [[ ! -s "$BACKUP_FILE" ]]; then
  printf "Backup file does not exist or is empty: %s\n" "$BACKUP_FILE"
  exit 1
fi

printf "Restoring %s into database %s...\n" "$BACKUP_FILE" "$POSTGRES_DB"

docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 < "$BACKUP_FILE"

printf "Database restore completed from: %s\n" "$BACKUP_FILE"
