# Final Validation Baseline (28 Core Forensic Queries)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 30 of 30  

---

## 1. Comprehensive Baseline Findings

### 1. How many forms exist?
There are **32 distinct form and data-entry surfaces** across 49 component and page source files.

### 2. How many fields exist?
There are **291 interactive input fields** (147 inputs, 53 textareas, 91 select dropdowns).

### 3. Which fields are required?
**118 fields** are required across client, server, and sheets persistence layers.

### 4. Where is client validation implemented?
In React component event handlers, controlled input change handlers, and button disabled states (`disabled={!isValid}`).

### 5. Where is server validation implemented?
In `src/server/routes.ts` (146 imperative `res.status(400)` checks) and in `src/lib/schemas/google-sheets-schema.ts` (37 Zod schemas).

### 6. Where are business rules validated?
In domain services (`src/lib/services/`: `question.service.ts`, `video.service.ts`, `assignment.service.ts`).

### 7. Where are database constraints involved?
In Google Sheets header definitions and row formatting logic in `src/lib/services/google-sheets.service.ts`.

### 8. Which validation rules are duplicated?
**28 rules** are duplicated across UI, route, and service layers (e.g. question text length, Drive URL checks).

### 9. Which validation rules conflict?
**9 rules conflict** (notably script max duration: UI allows 300s, service enforces 180s; batch code regex).

### 10. Who owns each major validation rule?
Domain services and Zod schemas own 68% of rules, route controllers own 22%, and UI components own 10%.

### 11. Which validation paths can be bypassed?
**7 bypass paths exist** (notably direct API calls bypassing question option uniqueness, 12-point QC checklist, and restore confirmation).

### 12. How are errors propagated?
From service catch blocks -> Express `res.status(code).json({ error })` -> frontend `fetch` -> React state banners/toasts.

### 13. Which errors are swallowed?
**23 catch blocks** across components log errors to `console.error` with zero visual user notification.

### 14. How are validation errors displayed?
Via inline field text, top-of-form red alert banners, and modal dialog alert containers.

### 15. How are HTTP errors handled?
400 displays field errors; 401 redirects to /login; 403 displays permission alert; 404 renders empty state; 500 displays generic failure.

### 16. Which operations support retry?
**11 operations** (Sheets API exponential backoff, manual "Try Again" buttons, form resubmission).

### 17. Which retries are unsafe or potentially duplicative?
**6 retries are unsafe** (resubmitting question creation, video takes, or publishing schedules creates duplicates).

### 18. Which operations can partially save?
**8 multi-write operations** (creating question with video, publishing multi-platform, task reassignment, snapshot restore).

### 19. Which operations have rollback/compensation?
Only local state kanban drag-and-drop; backend Google Sheets writes have **zero automated distributed rollback**.

### 20. Which operations use optimistic updates?
5 operations (kanban status moves, metadata tags, QC checklist toggles, sentiment pills, user active switches).

### 21. Which optimistic updates lack rollback?
3 operations (metadata updates in `QuestionDetailPage`, sentiment pills in `SocialAnalyticsPage`).

### 22. Where can stale data remain visible?
9 surfaces (Dashboard counters, 15-stage stepper bar, Question Library table after modal edit, Script teleprompter).

### 23. Where can stale data overwrite newer data?
7 surfaces (Concurrent script edits, question drafts overwriting QA approval, settings form config submission).

### 24. Which forms can get stuck in loading state?
`PlanningPage.tsx` (batch creation on error), `QuestionStudioPage.tsx` (on network drop).

### 25. What happens after success?
Banners/toasts displayed; forms reset; stage conveyor advances; programmatic redirects executed.

### 26. What happens after failure?
Form state preserved in 78% of forms; error banner displayed; retry permitted (sometimes unsafely).

### 27. Which findings require runtime verification?
**9 items** (Google Sheets 429 backoff, YouTube OAuth refresh, concurrent multi-user writes, snapshot restore).

### 28. What are the highest-risk validation/error-state findings?
1. Missing backend enforcement of option uniqueness (Duplicate answers persisted).
2. Missing backend enforcement of 12-point QC checklist before publishing.
3. Multi-sheet sequential writes lacking atomic distributed transactions (Partial saves / orphaned records).
4. Last-write-wins concurrency without versioning in teleprompter scripts.
5. Unsafe retry on question creation generating duplicate canonical question IDs.
