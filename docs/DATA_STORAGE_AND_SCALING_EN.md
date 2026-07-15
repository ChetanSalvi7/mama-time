# Data Storage and Scaling

## Current storage

The application uses an atomic JSON file store. This was selected for a short marketing campaign because it has:

- zero database service dependency;
- transparent backup and restore;
- simple deployment;
- no native Node add-on;
- deterministic operation in one Node process.

## Supported operating model

- one Node process;
- one writable persistent filesystem;
- hundreds to low thousands of campaign leads;
- routine backups;
- no horizontal scaling.

## Unsupported operating model

- PM2 cluster mode;
- multiple Docker replicas sharing the same JSON file;
- network filesystems with unreliable atomic rename semantics;
- high-frequency concurrent writes;
- permanent CRM-scale storage without migration.

## PostgreSQL migration path

When scaling is required, keep the REST contract and React frontend. Replace functions in `backend/src/db.js` and `backend/src/services/leadService.js` with a PostgreSQL repository.

Recommended tables:

- admins;
- settings;
- leads;
- lead_activities.

Recommended constraints/indexes:

- unique admin email;
- unique lead reference;
- index lead created_at;
- index lead status;
- index normalized email;
- index normalized phone;
- index UTM source;
- foreign key activity → lead.

Before migration, stop writes, back up the JSON file, import records, compare counts and sample records, then switch the storage adapter in staging.
