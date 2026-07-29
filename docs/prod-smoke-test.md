# Production Smoke Test

Run this after a production deploy to verify the public API and admin web are alive.

```bash
./scripts/smoke-prod.sh
```

The script checks:

- API health endpoint
- API dependency health endpoint
- API version endpoint
- Public product catalog
- Public storefront config
- Admin web HTML

To run the same check against test domains:

```bash
API_URL=https://test-api.yigithanyildiz.com ADMIN_URL=https://test-admin.yigithanyildiz.com ./scripts/smoke-prod.sh
```

The script is read-only. It does not create users, carts, orders, or admin data.

The production deploy workflow runs this script after deployment. The test deploy
workflow checks API health, dependency health, and version endpoints separately
because `test-admin.yigithanyildiz.com` is not currently enabled.

## Version Metadata

When rebuilding the production API container manually, pass the current commit and build time:

```bash
APP_COMMIT_SHA=$(git rev-parse --short HEAD) APP_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ") docker compose -f infrastructure/prod/docker-compose.prod.yml up -d --build api
```

Then verify:

```bash
curl -i https://api.yigithanyildiz.com/version
```
