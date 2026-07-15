# Deployment Guide

## Option A – Nginx + systemd (recommended conventional VPS setup)

### 1. Server requirements

- Ubuntu/Debian or comparable Linux;
- Node.js 20.19+ or 22.12+;
- npm 10+;
- Nginx;
- HTTPS certificate;
- dedicated unprivileged Linux user;
- one application process only.

### 2. Install application

```bash
sudo mkdir -p /var/www/mama-time
sudo chown -R mamatime:mamatime /var/www/mama-time
# Upload/extract the package into /var/www/mama-time
cd /var/www/mama-time
npm ci
npm run setup -- --production=1 \
  --base-url=https://mama-time.example.ch \
  --admin-email=marketing@example.ch \
  --whatsapp=41790000000
npm run build
npm run doctor
npm test
```

### 3. Permissions

```bash
chmod 600 .env
mkdir -p backend/data
chmod 700 backend/data
chown -R mamatime:mamatime backend/data
```

### 4. systemd

Copy and adapt `deployment/mama-time.service.example`:

```bash
sudo cp deployment/mama-time.service.example /etc/systemd/system/mama-time.service
sudo systemctl daemon-reload
sudo systemctl enable --now mama-time
sudo systemctl status mama-time
```

### 5. Nginx and HTTPS

Adapt `deployment/nginx.conf.example`, install it in the Nginx site configuration and issue a TLS certificate. Set `TRUST_PROXY=1`.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Verify

```bash
curl -fsS https://mama-time.example.ch/api/health
```

Then test the public form and backoffice manually.

## Option B – Docker Compose

1. Create `.env` with the production setup command.
2. Build and start:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f mama-time
```

The named volume `mama_time_data` persists the JSON store. Put Nginx, Traefik or another HTTPS proxy in front of port 3000.

Backup the volume regularly. A straightforward logical backup is:

```bash
docker compose exec mama-time npm run backup
```

## Option C – PM2

```bash
npm ci
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

**Do not change `instances: 1`.** Cluster mode is not safe with the file store.

## Rolling back

1. stop the application;
2. back up the current data file;
3. restore the previous application code;
4. keep the current compatible data file or restore a known-good backup;
5. run `npm ci`, `npm run build`, `npm run doctor`, `npm test`;
6. restart and verify `/api/health`.

## Backup and restore

Create a backup:

```bash
npm run backup
```

Backups are written to `backend/data/backups/`.

Restore:

```bash
sudo systemctl stop mama-time
cp backend/data/backups/mama-time-TIMESTAMP.json backend/data/mama-time.json
chmod 600 backend/data/mama-time.json
sudo systemctl start mama-time
```

Always retain at least one off-server encrypted backup.
