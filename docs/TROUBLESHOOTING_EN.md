# Troubleshooting

## Frontend says it is not built

```bash
npm run build
```

Verify `frontend/dist/index.html` exists.

## `npm run dev` starts only one service

Check ports 3000 and 5173 are free. Stop old Node/Vite processes and rerun.

## Form submits but no email arrives

The lead should still appear in the backoffice. Check:

- `NOTIFICATION_EMAIL`;
- all SMTP fields;
- SMTP port and secure mode;
- provider application password;
- spam folder;
- server outbound SMTP restrictions.

## Leads disappear after container recreation

The Docker data volume was not mounted. Use the supplied `docker-compose.yml` or bind-mount `/app/backend/data`.

## Admin login fails after changing `.env`

The bootstrap credentials only create the first admin when the data store has no admin. Existing credentials remain in the data file. Use the backoffice password change or:

```bash
npm run create-admin -w backend -- admin@example.ch 'NewStrongPassword!2026' 'Sentinators Admin'
```

## Production startup rejects configuration

Read the startup error. Production requires:

- HTTPS `APP_BASE_URL`;
- strong JWT/IP secrets;
- non-default admin password;
- real admin email;
- valid campaign dates;
- complete or empty SMTP credentials.

## Permission error writing data

```bash
mkdir -p backend/data
chown -R APPLICATION_USER:APPLICATION_GROUP backend/data
chmod 700 backend/data
```

## Campaign form is disabled unexpectedly

Check backoffice settings:

- form enabled;
- campaign enforcement;
- campaign start/end;
- Europe/Zurich timezone.

## JSON data file is corrupt

The application preserves a `.broken-TIMESTAMP` copy and stops. Restore the latest backup while the server is stopped.

## Wrong client IP behind Nginx

Set `TRUST_PROXY=1` and ensure Nginx forwards `X-Forwarded-For` and `X-Forwarded-Proto`.
