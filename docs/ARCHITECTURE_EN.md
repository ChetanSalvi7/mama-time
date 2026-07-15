# Architecture

## Runtime topology

```text
Browser
  │
  ├── GET /, /admin, /assets/* ──────────────┐
  └── /api/*                                 │
                                             ▼
                                   Nginx / TLS proxy
                                             │
                                             ▼
                                   Node.js / Express
                                      port 3000
                                  ┌──────────┴──────────┐
                                  │                     │
                          React static build      Express REST API
                          frontend/dist           /api/public/*
                                                  /api/admin/*
                                                          │
                                                          ▼
                                              atomic JSON data store
                                              backend/data/mama-time.json
```

## Frontend

- React 18;
- React Router 6;
- Vite 8;
- plain CSS design system;
- no external runtime CSS or font dependency;
- same-origin API requests with credentials;
- React production assets are served by Express.

Routes:

- `/` public campaign;
- `/impressum` legal placeholder;
- `/datenschutz` legal placeholder;
- `/admin/login` admin login;
- `/admin` lead dashboard;
- `/admin/leads/:id` lead detail;
- `/admin/settings` campaign settings;
- `/admin/account` password management.

## Backend

- Node.js ESM;
- Express 4;
- Zod request validation;
- bcryptjs password hashing;
- jsonwebtoken admin sessions;
- Helmet security headers;
- express-rate-limit;
- Nodemailer for optional SMTP alerts;
- Luxon for campaign timezone normalization.

## Authentication model

1. Admin posts email and password to `/api/admin/auth/login`.
2. Server verifies the bcrypt hash.
3. Server creates a short-lived JWT with an independent CSRF token.
4. JWT is stored in an HttpOnly, SameSite=Lax cookie.
5. React stores the CSRF value in memory only.
6. All modifying admin requests send `X-CSRF-Token`.
7. Password change clears the authentication cookie and requires a new login.

## Storage model

The store contains:

- `admins`;
- `settings`;
- `leads`;
- `activities`;
- monotonically increasing IDs and schema metadata.

Every mutation is synchronous inside the single Node process and is written to a temporary file followed by an atomic rename. File mode is requested as `0600`.

## Why the 300-dpi image is not used as the whole page

The visual reference is a static art-direction image. Using it as one large website image would create the following defects:

- unreadable and non-selectable text;
- inaccessible controls;
- no responsive reflow;
- no functional form or FAQ;
- poor loading and Core Web Vitals;
- poor SEO;
- inaccurate scaling on different phones;
- impossible content updates and tracking.

The React implementation reproduces the composition with semantic HTML, CSS, real controls and responsive image assets. The reference remains in `/reference` for visual comparison.
