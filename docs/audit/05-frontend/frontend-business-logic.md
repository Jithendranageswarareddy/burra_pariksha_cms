# Business Logic in Frontend Code Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Inventory of Business Rules in UI Layer

The audit revealed multiple instances where core workflow rules, stage transitions, and data integrity checks are calculated client-side rather than enforced authoritatively by the backend:

### 1. Workflow Stage Blocker Calculations (`ProductionJourneyContext.tsx`)
- **Location:** Lines 220–480 of `src/contexts/ProductionJourneyContext.tsx`
- **Rule:** Evaluates whether each of the 15 stages is `isBlocked`, `isCompleted`, or `isCurrent`.
- **Evidence:** Checks if script is approved before unlocking teleprompter; checks if raw video is submitted before unlocking editing bay.
- **Risk:** Client-side rule divergence. If backend rules change, frontend context must be manually updated.

### 2. Question Candidate Validation Rules (`QuestionStudioPage.tsx`)
- **Location:** `src/pages/QuestionStudioPage.tsx`
- **Rule:** Enforces minimum 4 options, explanation character lengths, and Telugu script formatting.
- **Duplication:** Duplicates Zod schema validation performed on the backend server.

### 3. Publishing Readiness Checks (`PublishingTable.tsx`)
- **Location:** `src/components/publishing/PublishingTable.tsx`
- **Rule:** Evaluates YouTube title length (<=100 chars), Instagram caption rules, and thumbnail presence.
- **Risk:** Directly calls server-side `ProductionAssetValidationService` in browser context.

---

## 2. Severity Classification
- **Critical:** Workflow transition rules embedded in `ProductionJourneyContext`.
- **Medium:** Form-level validation rules duplicated across UI and Zod schemas.
