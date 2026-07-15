# MAMA TIME – React + Node Production Kit

**Sentinators Gym, Weite SG**  
Version 1.0.0 · German public website and backoffice · English developer documentation

This package contains the complete responsive MAMA TIME campaign application:

- a production-ready React/Vite landing page matching the approved design direction;
- a Node.js/Express backend;
- a protected German-language lead backoffice;
- single-mama and mama-besties lead forms;
- campaign settings, lead status management, notes, callbacks, revenue statistics and CSV/JSON exports;
- responsive desktop, tablet and mobile layouts;
- Docker, PM2, systemd and Nginx deployment examples;
- automated API/integration tests and frontend build checks;
- the original 300-dpi visual reference and the complete creative prompt.

## 1. Recommended production path

Use **Node.js 20.19+ or Node.js 22.12+** and npm 10+.

```bash
npm ci
npm run setup -- --production=1 \
  --base-url=https://YOUR-PRODUCTION-DOMAIN \
  --admin-email=YOUR-ADMIN-EMAIL \
  --whatsapp=YOUR-WHATSAPP-NUMBER
npm run build
npm run doctor
npm test
npm start
```

The setup command prints a randomly generated administrator password. Store it in a password manager. Do not commit `.env`.

Open:

- public landing page: `https://YOUR-PRODUCTION-DOMAIN/`
- backoffice: `https://YOUR-PRODUCTION-DOMAIN/admin`
- health endpoint: `https://YOUR-PRODUCTION-DOMAIN/api/health`

## 2. Local development

```bash
npm ci
npm run setup
npm run dev
```

Local URLs:

- React/Vite development site: `http://localhost:5173`
- Node API: `http://localhost:3000`
- backoffice through Vite: `http://localhost:5173/admin`

The Vite development server proxies `/api` to Node on port 3000.

## 3. One-command start helpers

- Windows: `START_HERE_WINDOWS.bat`
- macOS/Linux: `./start_here_mac_linux.sh`

These helpers install dependencies when needed, create a development `.env`, build the React frontend, run the system check and start Node.

## 4. Critical values to replace before go-live

1. production domain in `.env` (`APP_BASE_URL`);
2. real administrator email and strong password;
3. WhatsApp number in international format without `+` or spaces;
4. SMTP credentials and notification recipient when email alerts are required;
5. legally approved imprint and privacy content in `frontend/src/pages/LegalPage.jsx`;
6. any verified testimonials; the application intentionally does not publish invented customer ratings;
7. campaign enforcement after staging tests are complete.

## 5. Data storage

The kit uses an **atomic JSON file store** at `backend/data/mama-time.json`. This is intentionally simple and reliable for one Node process and a campaign-sized lead volume. Never run several Node instances against the same JSON file. PM2 must use `instances: 1` and fork mode.

For multiple application instances or long-term CRM scale, replace the storage layer with PostgreSQL. The API and frontend can remain unchanged.

## 6. Package structure

```text
frontend/            React/Vite source and production build
backend/             Express API, authentication, form handling and backoffice data
backend/data/        Writable production lead data directory
deployment/          Nginx, systemd and backup examples
docs/                Full English developer documentation
reference/           Approved design references
Dockerfile           Multi-stage production image
docker-compose.yml   Single-container deployment with persistent data volume
tools/               Setup and system-check scripts
```

## 7. Quality commands

```bash
npm run build          # production React build
npm test               # backend integration tests + frontend build checks
npm run verify         # build and all tests
npm run doctor         # environment/deployment checks
npm run backup         # timestamped JSON backup
npm run seed:demo      # optional demo leads for staging only
npm run reset:data -- --confirm=RESET-MAMA-TIME  # removes all data; destructive
```

## 8. Owner and verification documents

- `OWNER_GO_LIVE_CHECKLIST_DE.md` – German owner go-live checklist.
- `docs/VERIFICATION_REPORT_EN.md` – final clean-install, test, audit and smoke-test record.
- `docs/PROJECT_TREE_EN.txt` – compact package tree.

## 8. Documentation reading order

1. `docs/DEVELOPER_HANDOFF_EN.md`
2. `docs/ARCHITECTURE_EN.md`
3. `docs/ENVIRONMENT_VARIABLES_EN.md`
4. `docs/DEPLOYMENT_EN.md`
5. `docs/FORM_AND_BACKOFFICE_EN.md`
6. `docs/QA_GO_LIVE_EN.md`

The entire public UI and backoffice UI are intentionally German. All implementation documentation is English for the development team.
