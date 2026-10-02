# Burra Pariksha CMS
# 23 — Migration Architecture

Stage: 23 — Migration Architecture

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative Migration Architecture for the Burra Pariksha Content Management System (BP-CMS). Formally codifies:
1. **The 7-Phase Strangler Fig Pattern (`AP-013`):** Defines the strict phased modernization sequence (`CURRENT_SYSTEM` $\to$ `STABILIZE` $\to$ `ABSTRACT` $\to$ `MIGRATE` $\to$ `VERIFY` $\to$ `SWITCH` $\to$ `RETIRE_LEGACY`) eliminating "big-bang" rewrite risks.
2. **The 10 Migration Dimensions:** Comprehensive transition blueprints for Frontend (31 pages to 8 Hubs), Routes (78 to 14 canonical), Backend (Monolith to Domain Controllers), Sheets (25 tabs to Firestore ETL), Database (Sheets to Firestore Hybrid 28 collections), Media (Raw Drive URLs to SHA-256 hashed metadata), Authentication (Mock to JWT sessionVersion RBAC), Workflow (Free-text to 15-Step State Engine), Services (69 fragmented to 8 Clean Domain Workspaces), and Tests (Ad-hoc to Unified Regression Suite).
3. **The Anti-Breakage Invariant & Dual-Write Reconciliation:** Dual-write execution during migration with mathematical record count parity and cryptographic checksum matching before cutover authorization.
4. **Immediate Rollback Safety Net:** One-click rollback mechanisms configured across all domains with automatic triggers on error spikes or parity mismatch.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 23 Migration Architecture | FACT |
| **File Path** | `docs/architecture/23-MIGRATION-ARCHITECTURE.md` | FACT |
| **Document Stage** | Stage 23 — Migration Architecture | FACT |
| **Authority** | Authoritative Migration Strategy & Strangler Fig Specification (AP-013) | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 22 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 24+ (Physical Execution & Implementation Verification) | FACT |
| **Baseline Repository Commit** | `429b417` | FACT |
| **Migration Methodology** | 7-Phase Strangler Fig Pattern across 10 system dimensions | FACT |

---

## 02. The 7-Phase Migration Methodology

```
┌─────────────────┐     ┌───────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     ┌────────┐     ┌────────────────┐
│ 1. CURRENT_SYS  │ ──► │ 2. STABILIZE│ ──► │ 3. ABSTRACT│ ──► │ 4. MIGRATE│ ──► │ 5. VERIFY│ ──► │ 6. SWITCH│ ──► │ 7. RETIRE_LEG  │
└─────────────────┘     └───────────┘     └──────────┘     └─────────┘     └────────┘     └────────┘     └────────────────┘
```

1. **Phase 1: CURRENT_SYSTEM:** Baseline characterization, cataloging brownfield technical debt, schemas, and usage patterns.
2. **Phase 2: STABILIZE:** Fix critical blockers, freeze brownfield schemas, introduce audit logging, and establish telemetry baselines.
3. **Phase 3: ABSTRACT:** Introduce adapter interfaces (`RepositoryPort`, `MediaStoragePort`, `AuthPort`), isolating consumers from physical storage.
4. **Phase 4: MIGRATE:** Execute historical data ETL backfills, initiate dual-writes (Sheets + Firestore), and stream real-time mutations to both stores.
5. **Phase 5: VERIFY:** Automated reconciliation comparator verifies 100% record count parity, zero schema divergence, and SHA-256 binary hash preservation.
6. **Phase 6: SWITCH:** Flip authoritative feature flags (`USE_FIRESTORE_REPOSITORIES=true`), redirect legacy routes, and establish primary traffic.
7. **Phase 7: RETIRE_LEGACY:** Decommission legacy adapters, archive legacy Google Sheets tabs in read-only mode, and remove obsolete dead code.

---

## 03. The 10 Domain Migration Blueprints

| # | Migration Domain | Legacy Baseline | Target Architecture | Primary Transition Strategy | Rollback Mechanism |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Frontend** | 31 fragmented React pages | 8 Canonical Hubs with Unified Studio | Progressive Hub wrapping & component refactoring | Revert route table alias to brownfield component |
| **2** | **Routes** | 78 unstructured routes in `App.tsx` | 14 canonical production routes | HTTP 301 / React Router redirect mapping layer | Re-enable legacy route definitions in router |
| **3** | **Backend** | Monolithic `server.ts` & `routes.ts` | Modular Monolith domain controllers | Universal `ApiResponseEnvelope` + Express routers | Fall back to legacy endpoint handlers |
| **4** | **Sheets** | 25 authoritative Google Sheets tabs | Historical archive / ETL data source | Structured extraction into Firestore collections | Keep Sheets active in dual-write mode |
| **5** | **Database** | Google Sheets pseudo-database | `FIRESTORE_HYBRID` (28 collections) | Dual-write + backfill ETL with OCC locks | Flip `USE_FIRESTORE=false` to use SheetsAdapter |
| **6** | **Media** | Raw unversioned Google Drive URLs | Stage 14 Tri-Layer Media with SHA-256 | Metadata extraction, hash backfill, Drive API v3 | Serve direct Drive webContentLink fallback |
| **7** | **Authentication** | Mock user state / insecure cookies | Stage 19 Zero-Trust Session & RBAC | JWT with `sessionVersion` validation & capability checks | Fall back to legacy session validator |
| **8** | **Workflow** | Free-text status strings | Stage 07 & 08 15-Step Canonical Engine | Status enum mapper + transition validator | Allow loose status strings in legacy mode |
| **9** | **Services** | 69 fragmented domain services | 8 Clean Architecture Domain Workspaces | Service consolidation behind Domain Ports | Import legacy service module directly |
| **10** | **Tests** | Ad-hoc disconnected tests | Unified Stage 02-23 Regression Test Suite | Deterministic test harness with CI/CD gates | Re-run legacy individual test scripts |

---

## 04. Dual-Write & Reconciliation Strategy (Sheets vs Firestore)

During Phase 4 (`MIGRATE`), all write mutations execute in parallel against both storage systems:
- **Primary Write:** Google Sheets Adapter (or Firestore Adapter once switched).
- **Shadow Write:** Secondary repository adapter with error capture and logging.
- **Reconciliation Engine:** A scheduled background verification job queries both stores and validates:
  1. $\Delta_{\text{count}} = |\text{Count}_{\text{Sheets}} - \text{Count}_{\text{Firestore}}| == 0$
  2. Cryptographic checksum of field values $\text{Hash}(\text{Data}_{\text{Sheets}}) == \text{Hash}(\text{Data}_{\text{Firestore}})$
  3. Zero unhandled dual-write failure events in telemetry.

### Cutover Gate Invariant
Phase 6 (`SWITCH`) is strictly blocked unless:
- `reconciliationPassed === true`
- `automatedTestsPassing === true`
- `rollbackPlanActive === true`
- `stakeholderApproval === true`

---

## 05. Instant Rollback Safety Net

Every domain migration blueprint is paired with an instantaneous, deterministic rollback mechanism:
- **Configuration-Driven:** Feature flags (`USE_FIRESTORE_REPOSITORIES`, `USE_CANONICAL_ROUTES`, `USE_ZERO_TRUST_AUTH`) stored in environment and hot-reloaded.
- **Automatic Triggers:**
  - HTTP 5xx error rate $> 1\%$ over a 5-minute rolling window.
  - API response p95 latency degradation $> 500\text{ms}$.
  - Data discrepancy detected by background reconciler.
- **Data Integrity Preservation:** During rollback, writes continue to update the primary fallback store without corruption.
