# Frontend API Client Architecture Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Centralized vs Distributed API Client Architecture

The frontend communication layer is overwhelmingly dominated by a single monolithic client:
- **Centralized Client:** `src/lib/api-client.ts` (1,667 lines)
- **Direct Consumers:** **49 frontend files** (28 pages, 19 components, 2 contexts)

### Capabilities Encapsulated in `apiClient`:
- Session & Auth: `login()`, `logout()`, `getMe()`, `changePassword()`
- Questions: `getQuestions()`, `getQuestionById()`, `createQuestion()`, `updateQuestion()`, `verifyQuestion()`
- Videos: `getVideos()`, `getVideoById()`, `updateVideoStatus()`, `uploadVideoRawFootage()`
- Scripts: `getScriptByVideoId()`, `saveScriptDraft()`, `approveScript()`
- Thumbnails: `getThumbnailByVideoId()`, `generateThumbnailCandidates()`, `selectThumbnail()`
- Publishing: `getPublishingRecords()`, `schedulePublishing()`, `recordPublication()`
- Assignments: `getAssignments()`, `createAssignment()`, `completeAssignment()`
- Recovery & Backups: `getRecoveryStatus()`, `listSnapshots()`, `executeGranularRestore()`

---

## 2. Rogue API Calls: `PlanningPage.tsx`

While 48 frontend consumers route all API traffic through `apiClient`, **`src/pages/PlanningPage.tsx` contains 17 raw `fetch()` calls**:
- `fetch("/api/taxonomy/summary")`
- `fetch("/api/planning/plans")`
- `fetch("/api/planning/batches")`
- `fetch("/api/planning/coverage")`
- `fetch("/api/planning/gaps")`
- `fetch("/api/planning/similarity-radar")`
- `fetch("/api/planning/ai-recommendation")`

### Architectural Deficiency:
`PlanningPage.tsx` bypasses the centralized error handling, session token injection, and response type safety implemented in `apiClient`.
