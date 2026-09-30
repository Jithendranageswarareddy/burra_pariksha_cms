# Database Migration Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 13 of 39  

---

## 1. Database Migration Frameworks

A forensic review of the repository confirms:
- **SQL Migration Folders:** ZERO (`migrations/`, `db/migrate/` do not exist).
- **Migration Tracking Tables:** ZERO (`knex_migrations`, `_prisma_migrations`, `schema_migrations` do not exist).
- **Migration Frameworks:** None installed.

---

## 2. Inventory of Operational Maintenance Scripts

Schema evolution and data maintenance are executed via standalone TypeScript scripts located in `scripts/`:

| Script Name | Purpose | Affected Tabs | Classification |
| :--- | :--- | :--- | :---: |
| `scripts/cleanup-and-migrate-users.ts` | Removes synthetic test users (`USR-INACTIVE-*`) and verifies referential integrity across sheets | `USERS`, `ASSIGNMENTS`, `QUESTIONS`, `AUDIT_LOG` | **OPERATIONAL MIGRATION** |
| `scripts/live-audit-and-reset.ts` | Audits live spreadsheet row counts and validates tab availability | All 25 tabs | **MAINTENANCE AUDIT** |
| `scripts/purge-test-data-for-production.ts` | Deletes test questions (`BP-Q-TEST-*`) and resets sequences | `QUESTIONS`, `VIDEOS`, `SEQUENCES` | **DATA RESET** |
| `scripts/restore-sequences-phase-e.ts` | Scans max primary key IDs across sheets and repairs `SEQUENCES` tab values | `SEQUENCES` | **SEQUENCE REPAIR** |
| `scripts/audit-and-clean-bp-cnt-000001.ts` | Reconciles orphaned content master records | `CONTENT_MASTERS`, `VIDEOS` | **REFERENTIAL REPAIR** |

---

## 3. Google Sheets Schema Evolution Strategy

In BP-CMS, schema additions (e.g. adding a new field to `QUESTIONS`) follow an append-only convention:
1. Update `src/lib/schemas/google-sheets-schema.ts` with the new column definition.
2. Manually append the new header name to Row 1, Column N+1 of the Google Sheet.
3. `allowUnknownColumns: true` allows the application to function even if extra columns exist in the sheet.
