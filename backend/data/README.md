# Runtime data directory

The application creates `mama-time.json` here on first start. This directory must be writable by the Node process and must not be publicly served.

- keep one Node process only;
- back up this directory;
- do not commit production data;
- never include customer data in developer ZIP files;
- file permissions should be restricted to the application account.
