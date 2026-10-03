# FEATURE CONTRACT: FC-022-STRANGLER-MIGRATION-DUAL-WRITE

## 1. Feature Identity
- **Feature ID**: FC-022
- **Feature Name**: Strangler Fig Dual-Write & Sheets Migration
- **Business Area**: Migration & Legacy Coexistence / Strangler Fig Engine
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P2 (Migration & Parity)
- **Owner / Domain**: Migration Architecture Context
- **Related Workflow Stage(s)**: Universal (Maintains coexistence during Stages 27–29)

---

## 2. Requirement
- **Business Requirement**: BR-009 (Zero Business Disruption) & Architectural Principle AP-012 (Strangler Fig Incremental Migration).
- **User Problem**: Attempting a "big-bang" cutover from Google Sheets to Firestore risks catastrophic data loss, operational downtime, and disruption of active daily publishing schedules.
- **Business Purpose**: Provide a Strangler Fig migration engine featuring dual-write adapters, batch historical data importers, shadow parity diff checkers, and legacy route aliasing to migrate BP-CMS incrementally without disrupting daily operations.
- **Expected Capability**:
  - `CompositeRepository<T>` dual-write adapter: Writes authoritative transactions to Firestore and async shadow writes to legacy Google Sheets.
  - Batch historical data importer script importing past questions, scripts, video links, and publications from Google Sheets into Firestore with canonical IDs.
  - Parity verification diff engine checking 100% field equivalence between Firestore and Google Sheets.
  - Backward-compatible legacy route aliases (`/api/legacy/*` mapping to modern v1 endpoints).
  - Decommissioning criteria: Legacy Sheets synchronization retired only after 30 consecutive days of 100% parity verification.
- **Scope**: Dual-write repository, batch importer script, shadow diff engine, legacy route aliases.
- **Explicit Non-Scope**: Rewriting third-party spreadsheets not belonging to BP-CMS.

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Importer script migrates all historical questions and scripts from Google Sheets into Firestore; all records receive typed IDs (`qst_`, `scr_`) and `version = 1`.
  - While dual-write is enabled, editing a question in BP-CMS updates Firestore immediately and mirrors the update to the corresponding Google Sheets row within $< 5\text{s}$.
  - Parity diff checker reports 0 discrepancies across 1,000+ historical rows.
- **Failure & Isolation Acceptance**:
  - If Google Sheets API times out, the primary Firestore transaction succeeds without rolling back; the Sheets shadow write is queued for background retry.
- **Safety Acceptance**:
  - Legacy Google Sheets data is never deleted during the migration phase.
- **Audit Acceptance**:
  - `MIGRATION_BATCH_IMPORTED` and `PARITY_CHECK_COMPLETED` logged with row counts and diff counts.

---

## 4. Domain Entities
- **Entities Involved**: `MigrationBatch`, `ParityDiffRecord`, `LegacyMappingIndex`.
- **Entity Ownership**: Migration Architecture Context.
- **Relationships**: A `LegacyMappingIndex` maps legacy Spreadsheet Row IDs to modern Canonical Entity IDs (`qst_...`).
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `legacyRowId`, `canonicalId`, `importedAt`.
- **Mutable Fields**: `parityStatus`, `lastDiffCheckAt`.
- **Lifecycle**: `ACTIVE_DUAL_WRITE` $\to$ `PARITY_VERIFIED` $\to$ `DECOMMISSIONED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `legacy_mappings`, `parity_audit_logs`.
- **Document Structure**:
  ```typescript
  export interface LegacyMappingDocument extends BaseEntity {
    id: string; // map_ + UUIDv4
    entityType: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'PUBLICATION';
    legacyRowId: string;
    canonicalId: string;
    sheetName: string;
    dualWriteEnabled: boolean;
    lastSyncedAt: string;
    parityStatus: 'MATCH' | 'MISMATCH' | 'PENDING';
  }
  ```
- **Indexes**: Unique composite index on `(entityType, legacyRowId)` and `(canonicalId)`.
- **Source of Truth**: Firestore is PRIMARY authoritative store; Google Sheets is SHADOW secondary store.

---

## 6. API Contract
### 6.1 `POST /api/v1/migration/import-batch`
- **Authentication**: Required (SuperAdmin only).
- **Required Capability**: `SYSTEM_ADMIN`.
- **Request Schema**: `{ sheetId: string, sheetRanges: string[] }`.
- **Response Schema**: `ApiResponseEnvelope<{ importedRows: number, mappingCount: number }>`.

### 6.2 `GET /api/v1/migration/parity-report`
- **Authentication**: Required.
- **Required Capability**: `SYSTEM_ADMIN`.
- **Response Schema**: `ApiResponseEnvelope<{ totalChecked: number, matchCount: number, diffCount: number, mismatches: any[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/admin/migration` (Migration & Parity Console).
- **Allowed Roles / Capabilities**: `SuperAdmin`.
- **UI Behavior**:
  - Progress bar showing historical import completion percentage.
  - Live dual-write toggle switch with confirmation modal.
  - Parity diff explorer showing side-by-side comparison of Firestore JSON vs. Sheets row cells.

---

## 8. RBAC / Capability Contract
- **`SYSTEM_ADMIN`**: Required for executing migration imports, triggering parity checks, or toggling dual-write adapters.

---

## 9. Workflow Contract
- **Coexistence Invariant**: Content creators can continue authoring in BP-CMS while legacy stakeholders view real-time mirrored updates in Google Sheets.

---

## 10. Validation Contract
- **Schema Mapping**: Every legacy column mapped to a typed Firestore field via explicit transformation rules (e.g. `"Option A"` $\to$ `options[0].textTelugu`).

---

## 11. Error Contract
- `403 FORBIDDEN`: Non-SuperAdmin attempting migration operations.
- `422 UNPROCESSABLE_ENTITY`: Malformed spreadsheet structure.
- `502 BAD_GATEWAY`: Google Sheets API quota exceeded.

---

## 12. Audit Contract
- **Events**: `MIGRATION_IMPORT_STARTED`, `MIGRATION_BATCH_COMPLETED`, `DUAL_WRITE_TOGGLED`.
- **Payload**: `sheetId`, `recordsMigrated`, `actorId`.

---

## 13. Realtime Contract
- **SSE Event**: `migration.progress` emitted during batch import.

---

## 14. Job / Async Contract
- **Batch Worker**: Historical import and parity checks run as background tasks via FC-017 `CloudTasksQueue`.

---

## 15. AI Contract
- **Applicable**: No.

---

## 16. Media Contract
- **Applicable**: Maps legacy Google Drive folder URLs to canonical `media_assets`.

---

## 17. Analytics Contract
- **Historical Backfill**: Imports past view counts into `analytics_timeseries`.

---

## 18. Security Contract
- **Credentials**: Google Sheets Service Account credentials loaded securely from Secret Manager (`GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY`).

---

## 19. Observability Contract
- **Metrics**: Counter `migration.rows_imported_total`, gauge `migration.parity_mismatch_count`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Batch reads and writes stay within Google Sheets API (300 requests/minute) and Firestore free tier limits.

---

## 21. Migration Contract
- Self-referential: Implements the Strangler Fig migration architecture.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-MIG-01`: Spreadsheet row parser correctly maps to `QuestionDocument`.
  - `TC-MIG-02`: Dual-write failure to Sheets does not roll back Firestore write.
  - `TC-MIG-03`: Parity diff engine detects column-level mismatches.
- **API Tests**:
  - `TC-MIG-04`: `POST /api/v1/migration/import-batch` enforces SuperAdmin capability.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-004, FC-005, FC-006, FC-008, FC-017.
- **Stage 25 Node**: `D-30 (Migration / Legacy Compatibility)`.
- **Downstream Consumers**: Production Cutover (Stage 29).

---

## 24. Implementation Sequence
1. Define Migration and Mapping schemas (`src/types/migration.ts`).
2. Implement Google Sheets API adapter (`src/lib/migration/sheets-adapter.ts`).
3. Implement `CompositeRepository` dual-write wrapper (`src/lib/db/composite-repository.ts`).
4. Implement Parity Diff Checker service.
5. Implement `/api/v1/migration/*` route handlers.
6. Build React Migration Console (`src/pages/admin/MigrationPage.tsx`).
7. Verify against `TC-MIG-01..04`.

---

## 25. Deployment Contract
- **Required Secrets**: `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` (in GCP Secret Manager).
- **Required Env Vars**: `LEGACY_SPREADSHEET_ID`.

---

## 26. Rollback Contract
- **Strategy**: Disable dual-write toggle. Google Sheets remains fully intact and operational as independent fallback.

---

## 27. Feature Completion Criteria
- [ ] Historical questions and scripts imported into Firestore.
- [ ] Dual-write mirrors Firestore mutations to Sheets without blocking API.
- [ ] Parity diff checker reports 0 discrepancies.
- [ ] Decommissioning gate defined (30 days zero diffs).
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 03, 12, 13, 22, and 23.

---

## 29. Traceability
- **Stage 01**: BR-009
- **Stage 03**: Current System Baseline & Google Sheets Inventory
- **Stage 12**: Firestore Native Database Architecture
- **Stage 13**: Data Contracts & Canonical Collections
- **Stage 15**: `/api/v1/migration/*`
- **Stage 22**: Zero Cost Migration Gate
- **Stage 23**: Authoritative Strangler Fig Migration Architecture
- **Stage 24**: Parity Test Matrix
- **Stage 25**: Node `D-30`
