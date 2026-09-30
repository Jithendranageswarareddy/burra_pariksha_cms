# Step 19: Source-of-Truth & Data-Flow Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Audit Date:** 2026-09-29  
**Audit Mode:** Read-Only Forensic Analysis  
**Auditor:** Principal Data Architect & Enterprise Systems Auditor  

---

## 1. Executive Summary & Audit Objective

The primary objective of Step 19 is to conduct an evidence-backed forensic audit of how data moves through the BP-CMS codebase and live infrastructure, and to establish the canonical **Source of Truth** for every business entity.

The audit reconstructs the complete data movement path:
```
USER -> FRONTEND -> API -> SERVICE -> REPOSITORY -> SOURCE OF TRUTH -> EXTERNAL STORAGE
```

Rather than assuming this chain is cleanly adhered to, the audit interrogates real codebase implementation to answer 20 foundational architectural questions:
1. Where data originates
2. Where data enters the system
3. Which frontend page/component creates or edits it
4. Which API receives it
5. Which service processes it
6. Which repository/data-access layer persists or retrieves it
7. Which storage actually holds the authoritative value
8. Which systems contain copies, replicas, derived values, caches, or synchronized representations
9. Which system is the actual authority when two systems disagree
10. Whether there is ONE authoritative source of truth
11. Whether competing sources exist
12. Whether the application has multiple writers
13. Whether the application has multiple readers
14. Whether synchronization occurs
15. Whether synchronization is automatic, manual, eventual, or absent
16. What happens when synchronization fails
17. Whether stale data can be presented
18. Whether partial writes can occur
19. Whether IDs remain consistent across layers
20. Whether workflow/state values remain consistent across layers

### Read-Only Audit Charter Statement
In strict adherence to the project audit charter:
- **Zero source code files, frontend components, or routes were modified.**
- **Zero Google Sheets rows, cells, schemas, or formulas were altered.**
- **Zero database migrations, schemas, or records were executed or modified.**
- **Zero Google Drive folders, files, or permissions were changed.**
- **Zero workflow transitions, sequence allocations, or data cleanups were performed.**
- **Zero deployments, test runs, or git pushes were executed.**

---

## 2. Core Audit Findings & Key Metrics

| Metric / Dimension | Verified Audit Value | Evidence Classification |
| :--- | :--- | :---: |
| **Active Tabular Source of Truth** | **Google Sheets API v4** (25 Authoritative Tabs) | CONFIRMED (`src/lib/schemas/google-sheets-schema.ts`) |
| **Active Binary Source of Truth** | **Google Drive API v3** (Hierarchical Storage) | CONFIRMED (`src/lib/services/google-drive.service.ts`) |
| **SQL Database Source of Truth** | **0 Active SQL Databases** (None in runtime) | CONFIRMED (Step 17 Audit, `package.json`) |
| **Total Major Business Entities** | **28 Discrete Entities Cataloged** | CONFIRMED (`docs/audit/15-data-model/`) |
| **Entities with ONE Authoritative Source** | **19 Entities (67.9%)** | CONFIRMED (Single Sheet Tab Authority) |
| **Entities with Competing Sources** | **9 Entities (32.1%)** | CONFIRMED (`conflict-register.md`) |
| **Dual-Write Operations Cataloged** | **18 Operations without Distributed 2PC** | CONFIRMED (`dual-write-analysis.md`) |
| **Critical Source Conflicts** | **4 Major Asymmetries** (State, Join, Master ID, Drive) | CONFIRMED (`conflict-register.md`) |
| **In-Memory Volatile Caches** | **9 Unsynchronized Memory Stores** | CONFIRMED (`cache-data-flow.md`) |
| **Client Fetch Architecture** | **Raw `fetch()` with Local `useState`** (Zero React Query) | CONFIRMED (`src/lib/api-client.ts`) |
| **Sheets Client Row Cache TTL** | **2,500 ms (2.5 seconds)** | CONFIRMED (`src/lib/google-sheets/client.ts:343`) |
| **Sequence ID Mutation Mutex** | **Process-Bound In-Memory Promise Queue** | CONFIRMED (`src/lib/repositories/sequences.repository.ts`) |

---

## 3. Storage vs. Source of Truth Distinction

A critical architectural distinction is enforced throughout this audit:
- **Storage Location:** The physical or virtual medium where bytes reside (e.g. Google Drive file system, Google Sheets spreadsheet cell, Redis cache, local disk).
- **Source of Truth:** The authoritative system of record that controls canonical state, decides validation validity, governs access rights, and serves as the final adjudicator when representations conflict.

### Example: Video Asset
- **Binary Video File:** Physically stored in **Google Drive** (`vd1.1.mp4`). Google Drive is authoritative for byte content, MIME type, file size, and MD5 checksum.
- **Video Production Metadata:** Stored in **Google Sheets** (`VIDEOS` tab). Google Sheets is authoritative for business state (`QUEUED`, `RECORDING`, `EDITING`), title, assigned personnel, and workflow gate approvals.
- **Synchronization Coupling:** There is no transactional coordinator between Google Drive and Google Sheets. If an upload completes in Google Drive but sheet row persistence fails, Google Drive contains an orphaned binary file with zero business attribution.

---

## 4. Evidence Classification Standard

Every conclusion is backed by verified repository and runtime evidence:
- **CONFIRMED:** Directly verified via source code syntax, AST inspection, or direct live read-only query.
- **STRONGLY INDICATED:** Inferred from multiple converging code patterns, repository contracts, and schema declarations.
- **POSSIBLE:** Observed in partial implementations or theoretical edge cases.
- **UNDETERMINED:** Insufficient forensic evidence to state authoritatively without speculation.

---

## 5. Relationship to Steps 13–18

This audit synthesizes and reconciles findings across preceding audit phases:
- **Step 13 (Workflows):** Validated 15-stage workflow state machine and identified the `Video.status` vs `Question.videoStatus` state divergence.
- **Step 14 (Validation):** Audited multi-layer verification save gates and client/server validation duplication.
- **Step 15 (Data Model):** Cataloged all 28 entities, 32 cross-entity foreign key strings, and sequence ID conventions.
- **Step 16 (Google Sheets):** Analyzed sheet schemas, tab properties, header mappings, and batch update quotas.
- **Step 17 (Database):** Verified zero SQL databases in current architecture; Google Sheets is the sole tabular database.
- **Step 18 (Google Drive):** Verified Google Drive API v3 binary storage, dual folder hierarchies (Phase 7 vs Phase 14), and OAuth 2.0 refresh token authentication.
