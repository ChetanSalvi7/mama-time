# Developer Handoff

## Product objective

Build and deploy the MAMA TIME acquisition campaign for Sentinators Gym in Weite SG. Mothers purchase or request one of two daytime membership offers while their children are in kindergarten or school.

Public campaign facts:

- campaign: **MAMA TIME**;
- period: **20 July 2026 through 20 August 2026**;
- single offer: **CHF 550 per mama, member card included**;
- besties offer: **CHF 990 for two mamas, two member cards included**;
- normal combined price: CHF 1,100;
- joint saving: CHF 110;
- saving per mama: 10%;
- effective besties price: CHF 495 per mama;
- positioning: secure the place now and start after the school holidays;
- default daytime hours: Monday–Friday, 08:00–16:30.

## What is already implemented

### Public React frontend

- exact campaign hierarchy and premium anthracite/rose/gold visual system;
- desktop, laptop, tablet, mobile and small-mobile layouts;
- responsive hero image art direction;
- single and besties pricing cards;
- mobile sticky conversion bar;
- native accessible dialog on desktop and bottom sheet on mobile;
- German validation and success states;
- FAQ accordion;
- WhatsApp fallback;
- UTM, fbclid and gclid persistence;
- dataLayer and Meta Pixel event hooks;
- SEO and Open Graph metadata;
- German placeholder legal pages.

### Node/Express backend

- public campaign configuration endpoint;
- public lead endpoint;
- strict schema validation;
- rate limiting;
- honeypot and minimum-fill-time protection;
- duplicate detection by normalized email or phone;
- HMAC IP hashing instead of raw IP storage;
- optional SMTP lead notifications;
- atomic file persistence;
- protected admin authentication with HttpOnly cookie;
- JWT session with CSRF protection for mutations;
- lead list, search, filtering, sorting and pagination;
- lead detail, status, assignee, callback, notes and lost reason;
- activity history;
- revenue and conversion statistics;
- CSV lead export;
- sanitized JSON campaign backup;
- live campaign settings;
- password change;
- campaign-window enforcement.

## Exact production recommendation

Use the responsive build as-is. Do not create separate desktop and mobile websites. React renders one semantic page; CSS media queries change layout and order.

Recommended stack:

- Node.js 22 LTS-compatible runtime;
- one Express process;
- Nginx reverse proxy;
- HTTPS;
- persistent and backed-up `backend/data` directory;
- optional SMTP provider;
- process manager: systemd, PM2 in fork mode with one instance, or Docker Compose.

## Non-negotiable implementation rules

1. Do not flatten the page into the 300-dpi image. Text, links, buttons and forms must remain real HTML.
2. Do not run PM2 cluster mode or multiple containers on the JSON store.
3. Do not expose `.env`, `backend/`, `docs/`, `reference/` or `node_modules/` through the web server.
4. Do not activate production without HTTPS.
5. Do not leave the documented example password active.
6. Do not publish sample testimonials as real reviews.
7. Do not remove client-side or server-side validation.
8. Do not remove CSRF, rate limiting, security headers or the IP hash secret.
9. Do not store test leads in the production data file.
10. Do not change German campaign copy without marketing approval.

## Acceptance definition

The implementation is accepted only when:

- all `npm run verify` checks pass;
- the visual QA matrix passes;
- one single lead and one besties lead reach the backoffice;
- duplicate detection is verified;
- CSV and JSON export work;
- login, logout and password change work;
- campaign settings update the public page;
- HTTPS, cookies and reverse proxy headers are correct;
- mobile sticky CTA and bottom-sheet form work on iOS and Android;
- legal pages contain final approved content;
- backup and restore procedures are documented and tested.
