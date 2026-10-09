# Current Sprint: Sprint 4

**Sprint:** 4  
**Name:** Production Data Layer Migration (Firebase / Cloud Firestore)  
**Status:** COMPLETE (S4-T01 through S4-T12 READY)  
**Start Date:** 2026-10-08  
**Primary Target:** Migrate BP-CMS operational persistence model from Google Sheets to Firebase / Cloud Firestore as authoritative production data store.

## Sprint 4 Task Breakdown

| Task ID | Task Name | Priority | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **S4-T01** | **Database Migration Baseline** | P0 | DONE | Inventory of all 32 domain entities, IRepository abstractions, and OCC/audit contracts (`docs/execution/S4-T01-DATABASE-MIGRATION-BASELINE.md`). |
| **S4-T02** | **Firebase Project & Environment Integration** | P0 | DONE | Provisioned Firebase project and database via `ProvisionFirebase` RPC; initialized secure client SDK via `firebase-applet-config.json` and `.env.example`. |
| **S4-T03** | **Firestore Repository Production Implementation** | P0 | DONE | Implemented production `FirestoreRepository<T>` behind existing `IRepository<T>` contract with OCC atomic version increments and error handling. |
| **S4-T04** | **Canonical Firestore Domain Collections** | P1 | DONE | Synchronized `firebase-blueprint.json` schemas for all core production collections. |
| **S4-T05** | **Firestore Security Rules & Deployment** | P0 | DONE | Authored defensive `firestore.rules` (AP-004 gatekeeper, GAR-02 anti-self-approval, audit immutability) and deployed via `DeployRules` RPC. |
| **S4-T06** | **Backend Authorization & Firestore Integration** | P0 | DONE | Integrated backend authorization middleware (`requireAuth`, `centralAuthorizationService`) with Firestore data access. |
| **S4-T07** | **Persistence / OCC / Audit Integration** | P0 | DONE | Preserved optimistic concurrency control and auto-streaming of repository mutations to `IAuditDispatcher`. |
| **S4-T08** | **Replace Google Sheets Transactional Writes** | P0 | DONE | Implemented `FirestoreBaseRepository` adapter decoupling live transactional operations from Google Sheets. |
| **S4-T09** | **Clean Production Dataset Initialization** | P1 | DONE | Delivered idempotent `firestoreProductionInitializer` seeding foundational users, taxonomy, and sequence counters. |
| **S4-T10** | **Full Persistence Regression Suite** | P0 | DONE | Automated test suite `tests/s4-t10-firestore-persistence.test.ts` (4/4 passed) verifying CRUD, OCC, soft-deletes, audit hooks, and initialization. |
| **S4-T11** | **Analytics Data-Store Architecture Decision** | P1 | DONE | Documented ADR (`docs/architecture/S4-T11-ANALYTICS-DATASTORE-DECISION.md`) designating Firestore as authoritative for analytics summaries. |
| **S4-T12** | **Production Readiness Gate** | P0 | DONE | Verified production readiness and gate criteria (`docs/execution/S4-T12-PRODUCTION-READINESS-GATE.md`). |
