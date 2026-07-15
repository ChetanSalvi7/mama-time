# Security and Privacy

## Implemented controls

- Helmet security headers;
- production content security policy;
- Express signature disabled;
- HTTPS-only admin cookie in production;
- HttpOnly and SameSite cookie;
- signed JWT sessions;
- independent CSRF token for modifications;
- bcrypt password hashing with cost 12;
- login and public-form rate limits;
- server-side Zod validation;
- small request-body limits;
- honeypot and minimum form completion time;
- HMAC IP hash instead of raw IP;
- data file mode requested as 0600;
- atomic write/rename;
- no password hash in browser/API backup;
- no secrets in public config;
- optional SMTP credentials stored only in `.env`;
- no invented public reviews.

## Production requirements

- TLS must terminate at Nginx/proxy;
- `APP_BASE_URL` must be HTTPS;
- `TRUST_PROXY=1` with one trusted reverse proxy;
- use unique JWT and IP-hash secrets;
- use a unique administrator password;
- restrict SSH and filesystem access;
- do not expose application source directories;
- back up data and encrypt off-server copies;
- keep Node and npm packages patched;
- run `npm audit --omit=dev` during maintenance;
- set a documented data-retention period;
- remove or anonymize leads when no longer needed;
- review access by developers or processors outside Switzerland;
- complete the legal privacy notice before launch.

## India-based developer access

When developers outside Switzerland access a staging or production system:

- staging should contain synthetic data only;
- production access must be explicitly authorized and time-limited;
- use named accounts and strong MFA for infrastructure access;
- do not send `.env` or customer exports through unsecured chat;
- maintain processor/data-transfer documentation as required by the responsible company and legal adviser;
- revoke access after delivery;
- rotate secrets after external development access ends.

## Incident response

1. isolate the server;
2. preserve logs and backups;
3. rotate JWT, IP hash, SMTP, SSH and admin credentials;
4. review the data file and access logs;
5. restore from a known-good backup if required;
6. document affected data and dates;
7. follow the legally required notification process determined by the responsible organization.
