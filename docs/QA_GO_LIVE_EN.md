# QA and Go-Live Checklist

## Automated checks

```bash
npm ci
npm run verify
npm run doctor
npm audit --omit=dev
```

Expected result: no failed tests and no production dependency vulnerability.

## Viewport matrix

Test at minimum:

- 360 × 800;
- 390 × 844;
- 430 × 932;
- 768 × 1024;
- 1024 × 768;
- 1280 × 800;
- 1440 × 900;
- 1920 × 1080.

## Browser matrix

- current Chrome desktop and Android;
- current Safari macOS and iOS;
- current Firefox desktop;
- current Edge desktop.

## Public landing page

- logo and hero visible;
- German copy correct;
- CHF 550 and CHF 990 correct;
- CHF 110 / 10% / CHF 495 calculations correct;
- all CTA buttons open the correct offer;
- WhatsApp opens the configured number and text;
- mobile sticky CTA does not cover content;
- no horizontal scroll;
- images crop correctly;
- FAQ keyboard and pointer behavior correct;
- legal links open;
- campaign scheduled/active/expired messages correct;
- disabled state works when form is off.

## Form

- single lead submission;
- besties lead submission;
- required bestie names;
- invalid email and phone errors;
- privacy consent;
- duplicate detection;
- honeypot behavior;
- rate limit behavior;
- German success reference;
- network failure message;
- Enter/Tab/Escape behavior;
- iOS virtual keyboard and bottom sheet.

## Backoffice

- login and logout;
- expired-session handling;
- default password changed;
- lead count and revenue stats;
- search and filters;
- mobile lead cards;
- lead detail actions;
- status transitions;
- callback and notes;
- activity history;
- CSV export;
- JSON backup;
- settings save;
- password change and forced re-login.

## Infrastructure

- HTTPS active;
- HTTP redirects to HTTPS;
- `TRUST_PROXY` correct;
- secure cookie present;
- `/api/health` returns 200;
- application auto-restarts;
- persistent data survives restart;
- backup created and restored in staging;
- source directories cannot be downloaded;
- `.env` has mode 600;
- data directory is not public;
- logs contain no passwords or full form body.

## Marketing/tracking

- UTM values reach the lead detail/CSV;
- fbclid/gclid preserved;
- dataLayer events fire;
- Meta Pixel events fire only after the final tracking implementation and consent decision;
- test leads are removed before launch.

## Legal and business approval

- final Daytime hours approved;
- start-date wording approved;
- offer terms approved;
- availability/limitation wording approved;
- imprint approved;
- privacy statement approved;
- real reviews verified or omitted;
- retention and deletion process approved.
