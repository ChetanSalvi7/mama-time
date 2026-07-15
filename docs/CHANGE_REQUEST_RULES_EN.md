# Change Request Rules

To protect campaign conversion and prevent regression:

1. Marketing copy changes require German-language approval.
2. Price changes must be made through backoffice settings and checked on every public price location.
3. Structural design changes require desktop, tablet and mobile review.
4. Form-field changes require frontend validation, Zod validation, storage, email, lead detail, CSV and tests to be updated together.
5. Status changes require labels, statistics, filters and CSS to be updated together.
6. API changes must remain backward compatible or receive a versioned endpoint.
7. Storage changes require a tested migration and rollback.
8. Security middleware may not be removed to solve a deployment problem.
9. Any new third-party tracking must receive privacy/consent review.
10. Run `npm run verify` after every release candidate.
