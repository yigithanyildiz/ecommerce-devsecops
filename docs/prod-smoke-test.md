# Production Smoke Test

Run this after a production deploy to verify the public API and admin web are alive.

```bash
./scripts/smoke-prod.sh
```

The script checks:

- API health endpoint
- Public product catalog
- Public storefront config
- Admin web HTML

To run the same check against test domains:

```bash
API_URL=https://test-api.yigithanyildiz.com ADMIN_URL=https://test-admin.yigithanyildiz.com ./scripts/smoke-prod.sh
```

The script is read-only. It does not create users, carts, orders, or admin data.
