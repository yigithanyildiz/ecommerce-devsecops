# Backup And Restore

Production database backups are taken from the PostgreSQL Docker service on the
Azure VM. Backup files are SQL dumps and should not be committed to git.

## Create A Production Backup

Run on the VM from the repository root:

```bash
cd /opt/ecommerce/app
./scripts/backup-prod-db.sh
```

The script writes timestamped dumps under:

```text
backups/prod/
```

Verify the file is not empty:

```bash
ls -lh backups/prod/*.sql
```

By default, backups older than 14 days are deleted after a successful backup.
Override retention when needed:

```bash
RETENTION_DAYS=30 ./scripts/backup-prod-db.sh
```

## Schedule Daily Production Backups

Run on the VM:

```bash
crontab -e
```

Add:

```cron
0 3 * * * cd /opt/ecommerce/app && ./scripts/backup-prod-db.sh >> /opt/ecommerce/app/backups/prod/backup.log 2>&1
```

This runs every day at 03:00 VM time and keeps the latest 14 days by default.

## Restore A Production Backup

Restore is destructive. It drops and recreates the `public` schema before loading
the SQL dump.

Run on the VM from the repository root:

```bash
cd /opt/ecommerce/app
CONFIRM_RESTORE=yes ./scripts/restore-prod-db.sh backups/prod/ecommerce_prod_YYYYMMDD_HHMMSS.sql
```

After restore, verify the API and admin web:

```bash
./scripts/smoke-prod.sh
```

## Test Environment Override

The scripts can be pointed at the test compose/database with environment
overrides:

```bash
COMPOSE_FILE=infrastructure/test/docker-compose.test.yml \
POSTGRES_DB=ecommerce_test \
BACKUP_DIR=backups/test \
./scripts/backup-prod-db.sh
```

For restore:

```bash
CONFIRM_RESTORE=yes \
COMPOSE_FILE=infrastructure/test/docker-compose.test.yml \
POSTGRES_DB=ecommerce_test \
./scripts/restore-prod-db.sh backups/test/ecommerce_test_YYYYMMDD_HHMMSS.sql
```
