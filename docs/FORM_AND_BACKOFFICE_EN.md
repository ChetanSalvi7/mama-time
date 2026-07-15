# Form and Backoffice Functional Specification

## Public form offers

### Single mama

- offer code: `single`;
- price: CHF 550;
- one member card;
- one lead person.

### Mama besties

- offer code: `besties`;
- price: CHF 990 total;
- two member cards;
- second mama first and last name required;
- second mama email and phone optional but recommended.

## Fields

| Field | Required | Notes |
|---|---:|---|
| first name | yes | max 80 |
| last name | yes | max 80 |
| email | yes | valid email, max 180 |
| phone | yes | at least seven digits |
| bestie first/last name | besties only | max 80 each |
| bestie email | optional | validated when supplied |
| bestie phone | optional | max 50 |
| preferred contact | yes | phone, WhatsApp or email |
| start preference | yes | German option value |
| message | optional | max 2,000 |
| privacy consent | yes | timestamp stored |
| honeypot | hidden | bots receive a non-actionable success response |
| form start timestamp | automatic | detects implausibly fast submissions |
| attribution | automatic | UTM, click IDs, referrer, landing URL, screen |

Submitting the form does not create a paid contract. The confirmation text clearly states that the gym confirms availability, start date and conditions personally.

## Duplicate logic

Within the configured duplicate window, a new submission is marked as a possible duplicate when normalized email or normalized phone matches an existing non-archived lead. It is still stored so no legitimate enquiry is lost.

## Lead statuses

- `new` – unprocessed;
- `contacted` – first contact made;
- `callback` – follow-up planned;
- `won` – membership closed;
- `lost` – not converted;
- `duplicate` – possible duplicate;
- `archived` – hidden from default list.

## Backoffice dashboard

The dashboard provides:

- total leads;
- new leads;
- besties lead count;
- open pipeline value;
- won revenue;
- conversion rate;
- 30-day lead trend;
- source distribution;
- text search;
- status, offer and source filters;
- sorting;
- mobile card layout;
- CSV export.

## Lead detail

The detail view provides:

- complete contact and offer information;
- bestie data;
- source and attribution;
- privacy-consent timestamp;
- duplicate link/reference information;
- call, email and WhatsApp actions;
- status;
- assignee;
- callback date/time;
- internal notes;
- lost reason;
- audit activity timeline.

## Campaign settings

An authenticated admin can change:

- campaign and company labels;
- single and besties prices;
- Daytime hours;
- campaign start/end and enforcement;
- WhatsApp number and message;
- notification email;
- form enabled status.

The public React page reads these values from the Node API. Savings and per-person pricing are calculated automatically.

## Exports

- CSV: lead data suitable for spreadsheet import;
- JSON backup: settings, leads and activities without administrator password hashes;
- server backup script: complete internal data file for disaster recovery.
