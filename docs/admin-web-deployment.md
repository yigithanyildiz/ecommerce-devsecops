# Admin Web Deployment

Admin web is deployed as a static React/Vite application served by an Nginx
container on the Azure VM.

## Domains

- PROD admin: `https://admin.yigithanyildiz.com`
- TEST admin: `https://test-admin.yigithanyildiz.com`

## Docker services

PROD compose adds:

- `ecommerce-admin-prod`
- Host binding: `127.0.0.1:8080 -> container:80`
- API base URL: `https://api.yigithanyildiz.com`

TEST compose adds:

- `ecommerce-admin-test`
- Host binding: `127.0.0.1:8081 -> container:80`
- API base URL: `https://test-api.yigithanyildiz.com`

## VM setup

On the VM, make sure these env files exist:

```bash
/opt/ecommerce/app/infrastructure/prod/.env
/opt/ecommerce/app/infrastructure/test/.env
```

The backend `CORS_ORIGIN` must include the admin domains.

PROD example:

```env
CORS_ORIGIN=https://admin.yigithanyildiz.com,http://localhost:5173
```

TEST example:

```env
CORS_ORIGIN=https://test-admin.yigithanyildiz.com,http://localhost:5173
```

## Deploy

PROD:

```bash
cd /opt/ecommerce/app
git pull origin main

cd infrastructure/prod
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
curl -i http://127.0.0.1:8080/health
```

TEST:

```bash
cd /opt/ecommerce/app
git pull origin develop

cd infrastructure/test
docker compose -f docker-compose.test.yml up -d --build
docker compose -f docker-compose.test.yml exec -T api npx prisma migrate deploy
curl -i http://127.0.0.1:8081/health
```

## Nginx

Copy or sync the repo Nginx config to the active Nginx sites path, then reload:

```bash
sudo cp /opt/ecommerce/app/infrastructure/nginx/ecommerce.conf /etc/nginx/sites-available/ecommerce.conf
sudo ln -sf /etc/nginx/sites-available/ecommerce.conf /etc/nginx/sites-enabled/ecommerce.conf
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

After DNS records point to the VM public IP, issue certificates:

```bash
sudo certbot --nginx -d admin.yigithanyildiz.com
sudo certbot --nginx -d test-admin.yigithanyildiz.com
sudo certbot renew --dry-run
```

## Checks

```bash
curl -i https://admin.yigithanyildiz.com
curl -i https://test-admin.yigithanyildiz.com
curl -i https://api.yigithanyildiz.com/health
curl -i https://test-api.yigithanyildiz.com/health
```
