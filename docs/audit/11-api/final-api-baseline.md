# Final API Baseline (29 Core Forensic Queries)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 34 of 30  

---

## 1. Comprehensive Baseline Findings

### 1. How many endpoints exist?
There are **271 endpoints** in total (270 mounted on `apiRouter` in `src/server/routes.ts` and 1 SPA catch-all route in `server.ts`).

### 2. What HTTP methods are used?
- GET: 128 (47.2%)
- POST: 122 (45.0%)
- PUT: 7 (2.6%)
- PATCH: 11 (4.1%)
- DELETE: 3 (1.1%)

### 3. What are the major API domains?
Videos (32), Questions (21), Planning (18), Recovery (14), Publishing (9), Analytics (8), Taxonomy (8), AI Copilot (15), Adaptations (11), System (10), Auth (5), Media (4).

### 4. Which endpoints are public?
**14 endpoints** (including `/auth/login`, `/health`, public taxonomy endpoints, and asset manifests).

### 5. Which require authentication?
**257 endpoints** require an active user session / JWT Bearer token.

### 6. Which require authorization?
**48 endpoints** enforce explicit role checks (`requireRole`) across Super Admin, Admin, Manager, SME, and Lead.

### 7. Which endpoints have request validation?
**221 endpoints** enforce request parameter, body, or enum validation (184 imperative checks + 37 Zod schemas).

### 8. Which endpoints have business validation?
All workflow-mutating endpoints enforce business rules via domain services (e.g. stage transition legitimacy).

### 9. Which endpoints reach a service layer?
**270 endpoints (100% of API routes)** call domain services.

### 10. Which endpoints bypass the service layer?
**0 endpoints**. Zero direct storage calls occur in route handlers.

### 11. Which endpoints reach a repository?
All endpoints modifying Google Sheets reach the `googleSheetsService` repository adapter.

### 12. Which endpoints bypass the repository layer?
Zero endpoints bypass data access adapters.

### 13. Which endpoints directly access storage?
Zero controller handlers directly access storage. All access is mediated through domain services and repository adapters.

### 14. Which endpoints access Google Sheets?
**214 endpoints** interact with Google Sheets across 18 authoritative tabs.

### 15. Which endpoints access the database?
**0 endpoints** access a traditional SQL/relational database.

### 16. Which endpoints access Google Drive?
**18 endpoints** interact with Google Drive for binary video/image asset storage.

### 17. Which endpoints call AI services?
**42 endpoints** invoke Google Gen AI (Gemini 2.5 Flash/Pro and Imagen).

### 18. Which endpoints process uploads?
**8 endpoints** handle multipart file uploads via Multer.

### 19. Which endpoints process webhooks?
**1 endpoint** (`POST /api/publishing/webhook/youtube`).

### 20. Which endpoints have multiple side effects?
**19 endpoints** trigger 3 or more cascading writes to Google Sheets and audit logs.

### 21. Which endpoints have idempotency risks?
**16 mutating POST endpoints** lack idempotency keys, risking duplicate records on retry.

### 22. Which endpoints are duplicates?
**14 endpoints** have duplicate or overlapping operational paths.

### 23. Which endpoints are legacy?
**23 endpoints** belong to legacy phases (Phase 15, 16, 17, 18).

### 24. Which endpoints are orphaned?
**12 endpoints** have zero calling references in the frontend codebase.

### 25. Which endpoints have frontend/API contract mismatches?
Dashboard metric shapes, script duration limits, and assignment response objects.

### 26. Which endpoints have workflow-state conflicts?
Direct status update endpoints permit out-of-order stage transitions.

### 27. Which endpoints have inconsistent error handling?
Monolithic catch blocks that expose internal Google Cloud quota error strings to the browser.

### 28. Which endpoints require runtime verification?
**11 dynamic behaviors** (Google Sheets 429 backoff, YouTube webhook, concurrent script edits, snapshot restore).

### 29. What are the highest-risk API findings?
1. Missing role authorization on `POST /api/settings/sheets-config` (Vertical privilege escalation).
2. Unprotected `DELETE /api/videos/:id` endpoint allowing any logged-in user to delete video records.
3. Multi-sheet sequential writes lacking atomic distributed transactions (Partial save / orphan risk).
4. Missing idempotency keys on `POST /api/questions` and `POST /api/publishing/schedule`.
5. Missing HMAC signature verification on the YouTube publishing webhook callback.
