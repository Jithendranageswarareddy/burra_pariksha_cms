# Current Sprint: Sprint 4

**Sprint:** 4  
**Name:** Production Data Layer Migration (Firebase / Cloud Firestore)  
**Status:** IN PROGRESS (CRITICAL READINESS REPAIRS VERIFIED)  
**Start Date:** 2026-10-08  
**Primary Target:** Migrate BP-CMS operational persistence model to Firebase / Cloud Firestore as authoritative production data store.

## Critical Sprint 4 Repairs Delivered (Zero-Tolerance Production Gate)
1. **Removed Silent In-Memory Fallback**:
   - `FirestoreRepository` rewritten to **FAIL CLOSED**.
   - No silent degradation of `PERMISSION_DENIED` or database errors into in-memory operations.
   - Mode strictly enforced (`FIRESTORE` vs `IN_MEMORY_TEST_ONLY`).
2. **Authoritative Backend-Only Gateway Architecture (Option A)**:
   - Server-side Express backend remains authoritative for user session authentication, RBAC capabilities, and anti-self-approval rules.
   - Privileged backend writes to Cloud Firestore without relying on client-side authentication tokens.
3. **Hardened Security Rules with Immutability Enforced**:
   - `firestore.rules` deployed enforcing default-deny, with strict immutability (`allow update, delete: if false;`) on `audit_logs`, `audit_events`, and `workflow_history`.
   - Automated rules execution test (`npm run test:firestore-rules`) verified against live Firestore.
4. **Real Firestore Integration & 15-Step Persistence Proven**:
   - `tests/s4-t10-firestore-persistence.test.ts` verified against live Cloud Firestore with atomic OCC versioning (4/4 tests passed).
   - `tests/s4-15-step-persistence.test.ts` verified complete lifecycle progression (Stages 01 through 15) with write, read-back, and restart persistence (100% passed).
   - Domain entity to collection registry explicitly documented in `docs/architecture/S4-T03-FIRESTORE-COLLECTION-REGISTRY.md`.
