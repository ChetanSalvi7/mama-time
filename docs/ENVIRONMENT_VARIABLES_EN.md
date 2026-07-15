# Environment Variables

Create `.env` with `npm run setup`. Never commit `.env`.

| Variable | Required | Example / purpose |
|---|---:|---|
| `NODE_ENV` | yes | `production` on live server |
| `PORT` | yes | Express port, default `3000` |
| `TRUST_PROXY` | yes behind proxy | `1` with one Nginx proxy |
| `APP_BASE_URL` | yes | public HTTPS origin |
| `FRONTEND_DEV_ORIGIN` | development | Vite origin |
| `DATABASE_PATH` | yes | JSON data file path |
| `JWT_SECRET` | yes | random 40+ character session secret |
| `IP_HASH_SECRET` | yes | independent random 40+ character HMAC secret |
| `ADMIN_COOKIE_NAME` | optional | admin cookie name |
| `ADMIN_TOKEN_HOURS` | optional | admin session lifetime |
| `ADMIN_BOOTSTRAP_EMAIL` | first start | first administrator email |
| `ADMIN_BOOTSTRAP_PASSWORD` | first start | strong first administrator password |
| `ADMIN_BOOTSTRAP_NAME` | optional | administrator display name |
| `SHOW_DEFAULT_PASSWORD_WARNING` | optional | warning for documented default |
| `CAMPAIGN_ENFORCE` | yes | reject forms outside the campaign window |
| `CAMPAIGN_START` | yes | ISO date with Zurich offset |
| `CAMPAIGN_END` | yes | ISO date with Zurich offset |
| `CAMPAIGN_TIMEZONE` | yes | `Europe/Zurich` |
| `SINGLE_PRICE_CHF` | yes | default `550` |
| `BESTIES_PRICE_CHF` | yes | default `990` |
| `DAYTIME_HOURS` | yes | public training-hour text |
| `WHATSAPP_NUMBER` | recommended | international digits only |
| `WHATSAPP_MESSAGE` | recommended | prefilled public message |
| `NOTIFICATION_EMAIL` | optional | lead alert recipient |
| `SMTP_HOST` | optional | SMTP server |
| `SMTP_PORT` | optional | usually `587` |
| `SMTP_SECURE` | optional | `true` for implicit TLS, usually port 465 |
| `SMTP_USER` | optional | SMTP login |
| `SMTP_PASSWORD` | optional | SMTP password / application password |
| `SMTP_FROM` | optional | sender name and address |
| `PUBLIC_RATE_LIMIT_WINDOW_MINUTES` | optional | public form rate window |
| `PUBLIC_RATE_LIMIT_MAX` | optional | submissions per IP window |
| `PUBLIC_MIN_FORM_SECONDS` | optional | bot protection threshold |
| `DUPLICATE_WINDOW_HOURS` | optional | duplicate lookup window |
| `ALLOW_DESTRUCTIVE_RESET` | normally no | must be `true` only for an approved production reset |

## Safe production setup example

```bash
npm run setup -- \
  --production=1 \
  --base-url=https://mama-time.example.ch \
  --admin-email=marketing@example.ch \
  --whatsapp=41790000000 \
  --notification-email=marketing@example.ch
```

The command generates independent random secrets and a random administrator password.

## Runtime versus backoffice settings

Initial campaign values come from `.env`. On the first start they are copied into the data store. Thereafter the backoffice settings page is the active source for:

- campaign name;
- company name and location;
- prices;
- campaign dates;
- Daytime hours;
- WhatsApp information;
- notification recipient;
- campaign enforcement;
- form enabled/disabled.

SMTP credentials and security secrets remain in `.env` and are never exposed to the browser or backoffice.
