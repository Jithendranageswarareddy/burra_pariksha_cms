# Business Rule Location Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 23 of 30  

---

## 1. Distribution of Business Rules across Layers

A system-wide audit analyzed where business rules are actually hosted:
- **Domain Services (`src/lib/services/`)**: **68%** of rules (Properly encapsulated in services)
- **Express Route Handlers (`src/server/routes.ts`)**: **18%** of rules (Leaked into controllers)
- **Frontend Components & Pages (`src/pages/`)**: **14%** of rules (Implemented solely in the browser UI)

---

## 2. Leaked Business Rules Register

| Business Rule | Intended Architectural Layer | Actual Location Where Found | Consequence |
| :--- | :--- | :--- | :--- |
| Question Option Uniqueness (A != B) | Domain Service | `QuestionStudioPage.tsx` only | Direct API calls can persist duplicate options |
| 12-Point QC Checklist Verification | Domain Service | `FinalReviewWorkspace.tsx` only | Direct API calls can mark video READY_TO_PUBLISH without QC |
| Teleprompter WPM & Pacing Calculation | Domain Service | `ScriptWorkspace.tsx` only | Overlength scripts saved via legacy API |
| Sequential ID Allocation Gating | Domain Service | `routes.ts` route handler | Route controller manages lock state |
