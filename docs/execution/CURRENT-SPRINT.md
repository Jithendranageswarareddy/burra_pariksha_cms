# Current Sprint: Sprint 3

**Sprint:** 3  
**Name:** Role-Aware BP-CMS + RBAC + Firebase Architecture  
**Status:** IN PROGRESS  
**Start Date:** 2026-10-05  
**Primary Target:** Canonical Authorization Model, Dynamic UI Actions, Audited Admin Override, Role-Aware Work Handoff, and Firebase Architecture Spike

## Sprint 3 Task Breakdown

| Task ID | Task Name | Priority | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **S3-T01** | **Canonical RBAC & Capability Model** | P0 | DONE | Formalized the 8-tier authorization separation: Identity -> Roles -> Capabilities -> Page -> Action -> Data Scope -> Workflow Eligibility -> Audited Admin Override. |
| **S3-T02** | **Role/Page/Action/Data Access Matrix** | P0 | DONE | Defined exact access rules and data scopes (`ALL`, `ASSIGNED`, `TEAM`, `STAGE`, `RESTRICTED`, `OWN`) across all 15 stages and 6 hubs. |
| **S3-T03** | **Central Authorization Service** | P0 | DONE | Implemented `centralAuthorizationService` providing unified server and client policy evaluations. |
| **S3-T04** | **Dynamic Role-Aware Navigation & UI Actions** | P0 | DONE | Dynamic UI action resolution (`VISIBLE`, `HIDDEN`, `READ_ONLY`, `ENABLED`, `DISABLED`) across navigation, action buttons, forms, and stage controls. |
| **S3-T05** | **Administrator Operational Mode & Audited Override** | P0 | DONE | Enabled full Admin visibility across all hubs while enforcing mandatory reason, explicit confirmation, and immutable audit logging for overrides (preserving GAR-02 segregation of duties for normal flow). |
| **S3-T06** | **Assignment & Workflow Handoff Model** | P1 | DONE | Built content-to-stage role routing: `content -> stage -> required action -> eligible role -> assignment queue -> next stage`. |
| **S3-T07** | **My Work Role-Aware Workbench Integration** | P1 | DONE | Delivered personalized operational views (`Assigned Work`, `Waiting for Me`, `Waiting for Other Role`, `Blocked`, `Team Overview` for Admin). |
| **S3-T08** | **Firebase Architecture Spike** | P0 | DONE | Documented architecture decision: Firebase Auth, Firestore data model, backend authorization, custom claims, query indexing, cost, and rollback strategy (`docs/architecture/FIREBASE-ARCHITECTURE-SPIKE.md`). |
| **S3-T09** | **Firestore Data Model & Security Architecture Prototype** | P1 | DONE | Authored blueprint schemas (`firebase-blueprint.json`), document collection structures, and generated hardened `firestore.rules`. |
| **S3-T10** | **Google Sheets -> Firestore Migration Design** | P1 | DONE | Field mapping, checksum verification hashing, dual-write strategy, and zero-data-loss rollback procedure (`src/lib/services/firestore-migration.service.ts`). |
| **S3-T11** | **RBAC & Security Regression Test Suite** | P0 | DONE | Automated test coverage for Flows A through E, role isolation, hidden/disabled actions, GAR-02 self-approval rejection, audited override approval, and data scopes (`tests/s3-t11-regression-suite.test.ts`). |
| **S3-T12** | **End-to-End Browser UAT Preparation** | P1 | DONE | End-to-end execution of live HTTP override suite (`tests/s3-t05-live-override.test.ts`) and modal UX validation. |
| **S3-T13** | **Sprint 3 UAT Remediation (UAT-01 to UAT-06)** | P0 | DONE | Remediated UAT findings: false negative upload error elimination, reactive state convergence without refresh, strict raw footage progression gate, dynamic primary CTA transition, uncheck-default admin override modal, and resolved Math Proof contradiction. |
