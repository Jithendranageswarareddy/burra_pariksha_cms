# Validation Conflict Forensic Audit (9 Documented Conflicts)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 09 of 30  

---

## 1. Executive Summary

A forensic cross-check between frontend component implementations, Express route handlers in `src/server/routes.ts`, and domain services revealed **9 explicit validation conflicts**. In these instances, either the client rejects input that the server would accept, or the server rejects input that the client allows.

---

## 2. Validation Conflict Register

| Conflict ID | Entity / Surface | Field / Rule | Client Behavior | Server / Service Behavior | Expected System Behavior | Risk Level | Evidence Location |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **VCF-01** | `ScriptWorkspace.tsx` | Script Duration Max | Allows up to 300 seconds (5 min) | `script.service.ts` restricts max duration to 180 seconds | Client and server should share a single constant (`MAX_SCRIPT_DURATION = 180`) | **HIGH** | `ScriptWorkspace.tsx` vs `script.service.ts:114` |
| **VCF-02** | `PublishingWorkspace.tsx` | Scheduled Time | Client requires future timestamp before scheduling | `routes.ts` defaults to current timestamp if absent | Server should require explicit timestamp when status is SCHEDULED | **MEDIUM** | `PublishingWorkspace.tsx` vs `routes.ts:1042` |
| **VCF-03** | `QuestionStudioPage.tsx` | Explanation Min Length | Client requires `>= 10` characters | `question.service.ts` accepts empty string for drafts | Draft mode should be explicitly parameterized across both layers | **MEDIUM** | `QuestionStudioPage.tsx` vs `question.service.ts:241` |
| **VCF-04** | `EditingWorkspace.tsx` | Edit Notes | Client permits empty notes | `video.service.ts` logs warning and requires notes if status is REJECTED | Rejection flow requires non-empty note across all layers | **HIGH** | `EditingWorkspace.tsx` vs `video.service.ts:389` |
| **VCF-05** | `PlanningPage.tsx` | Batch Code Pattern | Client enforces regex `^[A-Z]{3}-\d{3}$` | Route handler accepts any non-empty string | Consistent batch code pattern enforcement across backend | **MEDIUM** | `PlanningPage.tsx:142` vs `routes.ts:1210` |
| **VCF-06** | `VideoRecordPage.tsx` (Legacy) | Take Number | Client allows `takeNumber >= 0` | Route handler requires `takeNumber >= 1` | Take numbering must be 1-indexed consistently | **LOW** | `VideoRecordPage.tsx` vs `routes.ts:685` |
| **VCF-07** | `TeamOperationsPage.tsx` | Role Reassignment | Client UI permits assigning `SUPER_ADMIN` | Route handler restricts role creation to `ADMIN` or below | UI should restrict dropdown options based on caller role | **HIGH** | `TeamOperationsPage.tsx` vs `routes.ts:1450` |
| **VCF-08** | `QuestionImprovePage.tsx` | Verification Status | UI displays verified badge on save | Server requires explicit verification transition API | Saving draft should not visually imply verification approval | **HIGH** | `QuestionImprovePage.tsx` vs `question.service.ts:310` |
| **VCF-09** | `SettingsPage.tsx` | Taxonomy Subtopic | Client allows orphaned subtopic creation | Server requires valid parent `topicId` foreign key | Server rejects submission with 400 Bad Request; UI error is generic | **MEDIUM** | `SettingsPage.tsx:280` vs `taxonomy.service.ts:98` |
