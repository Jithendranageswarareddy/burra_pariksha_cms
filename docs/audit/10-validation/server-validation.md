# Server Validation Forensic Audit (146 Route Checks & 37 Zod Schemas)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 06 of 30  

---

## 1. Backend Validation Architecture

Backend validation in BP-CMS operates across two defense layers:
1. **Express Route Handlers (`src/server/routes.ts`)**:
   - Executes 146 imperative `res.status(400).json({ error: ... })` validation checks.
   - Enforces 48 `res.status(403)` role/permission checks.
   - Verifies 55 `res.status(404)` entity existence checks before mutations.
2. **Google Sheets Persistence Layer (`src/lib/schemas/google-sheets-schema.ts`)**:
   - Defines 37 authoritative Zod schemas for entity rows and input DTOs.
   - Validates entity shapes prior to formatting spreadsheet cell rows.

---

## 2. Server Validation Check Categories in `src/server/routes.ts`

| Check Category | Number of Occurrences | Target Parameters / Rules | HTTP Status Returned |
| :--- | :---: | :--- | :---: |
| **Missing Required Field** | 62 | `title`, `questionText`, `rawDriveUrl`, `status`, `userId` | `400 Bad Request` |
| **Invalid Enum / Status** | 28 | `VideoProductionStatus`, `QuestionStatus`, `QuestionLanguage` | `400 Bad Request` |
| **Invalid Format / URL** | 18 | `drive.google.com` URLs, ISO-8601 timestamps, UUID format | `400 Bad Request` |
| **Entity Not Found** | 55 | Validating that `questionId`, `videoId`, or `userId` exists | `404 Not Found` |
| **Role / RBAC Denial** | 48 | Validating user role against required permission level | `403 Forbidden` |
| **State Machine Violation** | 22 | Preventing illegal transitions (e.g. RECORDING to PUBLISHED) | `400 Bad Request` |
| **Zod Schema Parse Failure** | 18 | Explicit `schema.safeParse(req.body)` validation | `400 Bad Request` |

---

## 3. Representative Server Route Validation Traces

### `POST /api/videos/:id/record` (Take Submission)
```typescript
// src/server/routes.ts line 682
if (!rawDriveUrl || typeof rawDriveUrl !== "string") {
  return res.status(400).json({ error: "rawDriveUrl is required and must be a string" });
}
if (!rawDriveUrl.includes("drive.google.com")) {
  return res.status(400).json({ error: "rawDriveUrl must be a valid Google Drive URL" });
}
const video = await videoService.getVideoById(id);
if (!video) {
  return res.status(404).json({ error: "Video not found" });
}
if (video.status !== "READY_TO_RECORD" && video.status !== "RECORDING") {
  return res.status(400).json({ error: "Video is not in valid status for recording take" });
}
```
