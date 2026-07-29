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
