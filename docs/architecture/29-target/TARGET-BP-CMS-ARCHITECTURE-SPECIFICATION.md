# Target BP-CMS Architecture Specification (Master Deliverable)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Master Architecture Specification  
**Phase:** Step 29 of 30  
**Status:** **AUTHORITATIVE TARGET SPECIFICATION (DESIGN ONLY)**  
**Date:** 2026-09-29  

---

## 1. Executive Summary & Architectural Invariants

The target architecture for BP-CMS transforms the application into an enterprise-grade, highly available, and reliable content creation and publishing engine. Grounded in brownfield preservation, it retains the proven UI/UX layouts, teleprompter tools, and bilingual aptitude workflows while replacing brittle foundational layers with robust, scalable infrastructure.

### Architectural Invariants:
1. **One Canonical Business Workflow:** Exactly 15 business stages with formal Stage Contracts.
2. **Distinct Business Stage vs Technical State:** Unified `WorkflowState` entity with atomic ACID state history.
3. **Relational Authority:** PostgreSQL 16 (Cloud SQL) via Drizzle ORM is the single source of truth for tabular metadata.
4. **Binary Storage Authority:** Google Drive API v3 (Weekly hierarchical folders) is the authoritative binary media store.
5. **Zero-Trust Multi-Layer RBAC:** React Router client route guards + Express middleware + Object ACLs.
6. **Assistive AI Boundary:** Gemini AI models assist with drafting and analysis but NEVER control state machines, permissions, or database schemas.
7. **Asynchronous External Integrations:** Long-running publishing and metrics jobs are managed via Redis + BullMQ worker queues.

---

## 2. Canonical 15-Stage Workflow & Stage Contracts

```
[01: Question Generation] ──► [02: Verification] ──► [03: Audience Script] ──► [04: Teleprompter & Filming]
                                                                                        │
                                                                                        ▼
[08: Thumbnail] ◄── [07: Final QC] ◄── [06: Editing Bay] ◄── [05: Raw Video Ingestion]
        │
        ▼
[09: Social Review] ──► [10: Publishing Setup] ──► [11: Published] ──► [12: Platform Sync]
                                                                               │
                                                                               ▼
[01: Next Question Draft] ◄── [15: Intelligence Loop] ◄── [14: Performance Review] ◄── [13: Analytics Ingestion]
```

### Critical Workflow Fixes Included:
- **Remediation of BRK-HD-01:** On draft approval in Stage 02, server returns `{ canonicalId, redirectUrl }`, and React Router executes `navigate('/questions/' + canonicalId, { replace: true })`, eliminating draft 404s on browser reload.
- **Remediation of BRK-HD-02:** State machine directly permits `QUEUED -> EDITING` and `FILMED -> EDITING` in `StateTransitionGraph`, eliminating the 3-step chained PATCH hop.
- **Remediation of BRK-SF-02:** Stage 11 publishing cascades status updates across `content_items`, `videos`, `questions`, and `publishing_records` in a single atomic database transaction.

---

## 3. Relational Schema & Persistence Strategy

```typescript
// Target Drizzle Schema (PostgreSQL 16)
export const contentItems = pgTable('content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g. BP-CNT-000001
  topic: text('topic').notNull(),
  subject: text('subject').notNull(),
  examCategory: text('exam_category').notNull(),
  difficulty: text('difficulty').notNull(),
  status: workflowStatusEnum('status').notNull().default('DRAFT'),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

---

## 4. Zero-Trust Multi-Layer RBAC Architecture

- **Client-Side:** React Router nested `RequireRole` route guards preventing unauthorized page mounting.
- **Server-Side:** Express `requireRole` and `requireCapability` middleware intercepting all REST endpoints.
- **Object-Level:** `ObjectAuthService` asserting author ownership, active assignments, and strict anti-self-approval rules for reviewers.

---

## 5. Implementation Boundaries & Quality Gates

Implementation teams are authorized to build according to these approved contracts and schemas. They MUST NOT redefine the 15 canonical stages, bypass backend authorization, or allow un-validated AI output to mutate core production states.
