# API Reference

All API responses use JSON unless explicitly stated. Admin cookies are same-origin and HttpOnly.

## Public

### `GET /api/health`

Returns service status, version, environment, storage type and current server time.

### `GET /api/public/config`

Returns public campaign configuration, prices, computed savings, WhatsApp configuration and campaign status.

### `POST /api/public/leads`

Creates a lead.

Example body:

```json
{
  "offer_type": "besties",
  "first_name": "Anna",
  "last_name": "Muster",
  "email": "anna@example.ch",
  "phone": "+41 79 000 00 00",
  "bestie_first_name": "Lisa",
  "bestie_last_name": "Muster",
  "bestie_email": "lisa@example.ch",
  "bestie_phone": "+41 79 000 00 01",
  "preferred_contact": "WhatsApp",
  "start_preference": "Direkt nach den Schulferien",
  "message": "Bitte am Nachmittag kontaktieren.",
  "privacy": true,
  "form_started_at": 1784040000000,
  "website": "",
  "utm_source": "facebook",
  "utm_medium": "paid_social",
  "utm_campaign": "mama-time-2026",
  "landing_url": "https://example.ch/",
  "page_variant": "react-responsive",
  "screen": "390x844"
}
```

Success: HTTP 201 with `reference`, `duplicate` and German message.

## Admin authentication

### `POST /api/admin/auth/login`

Body: `email`, `password`. Sets auth cookie and returns CSRF token.

### `GET /api/admin/auth/me`

Returns active user and CSRF token.

### `POST /api/admin/auth/logout`

Requires authentication and `X-CSRF-Token`.

### `POST /api/admin/auth/change-password`

Requires authentication and CSRF. Body: `current_password`, `new_password`.

## Admin leads

### `GET /api/admin/stats`

Dashboard statistics.

### `GET /api/admin/leads`

Query parameters:

- `q`;
- `status`;
- `offer`;
- `source`;
- `dateFrom`;
- `dateTo`;
- `sort` (`newest`, `oldest`, `value_desc`, `callback`);
- `page`;
- `perPage`;
- `includeArchived`.

### `GET /api/admin/leads/:id`

Single lead with activities.

### `PATCH /api/admin/leads/:id`

Requires CSRF. Fields: `status`, `assigned_to`, `callback_at`, `notes`, `lost_reason`.

### `GET /api/admin/leads/export.csv`

Authenticated CSV export.

### `GET /api/admin/backup.json`

Authenticated sanitized JSON backup. Administrator password hashes are omitted.

## Admin settings

### `GET /api/admin/settings`

Returns editable campaign settings.

### `PATCH /api/admin/settings`

Requires CSRF. Updates campaign, prices, period, contact and form state.

## Common error codes

- `400` invalid timing or request;
- `401` not authenticated / expired session;
- `403` invalid CSRF token;
- `404` resource not found;
- `410` campaign or form unavailable;
- `422` field validation errors;
- `429` rate limit;
- `500` unexpected server error.
