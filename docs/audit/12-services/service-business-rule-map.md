# Service Business Rule Distribution Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 38 of 30  

---

## 1. Cross-Layer Business Rule Mapping Register

| Business Rule Domain | Rule Statement | Primary Implementing Service | Secondary / Conflicting Implementation | Location Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **Question Structure** | Exactly 4 options; single correct answer | `question.service.ts` | `QuestionStudioPage.tsx` | **CLEAN** (Both agree) |
| **Option Uniqueness** | Options A, B, C, D must all be distinct | NONE (Missing in backend!) | `QuestionStudioPage.tsx` only | **LEAKED TO UI** |
| **QC Checklist** | 12 inspection points must be true | `video.service.ts` (Status check only)| `FinalReviewWorkspace.tsx` | **LEAKED TO UI** |
| **Teleprompter Speed** | Spoken pacing between 100-200 WPM | `script.service.ts` | `phase15-script-production.service` | **DUPLICATED** |
| **Platform Truncation** | YouTube title <= 100 chars, IG <= 2200 | `platform-adaptation.service.ts` | `publishing.service.ts` | **DUPLICATED** |
| **Workload Cap** | Max 5 active tasks per member | `assignment.service.ts` | None | **CLEAN** |
| **Restore Preflight** | Target sheet headers must match schema | `full-snapshot-preflight.service` | `spreadsheet-verification.service` | **DUPLICATED** |
