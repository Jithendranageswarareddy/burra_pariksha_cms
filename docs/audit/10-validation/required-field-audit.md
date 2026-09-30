# Required Field Authority & Implementation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 04 of 30  

---

## 1. Executive Summary

Of the 291 interactive fields cataloged, **118 fields** are classified as required either by the UI, by backend API route handlers, or by Google Sheets database schema contracts.
This audit cross-examines the enforcing authority for every required field:
- **UI Visual Authority**: HTML `required` attribute, asterisk labels (`*`), or pre-submit guards.
- **Route Handler Authority**: Imperative checks (`if (!field) return res.status(400)`) in `src/server/routes.ts`.
- **Service & Zod Authority**: Zod schemas (`z.string().min(1)`) in `src/lib/schemas/google-sheets-schema.ts`.
- **Database Authority**: Not-null or presence requirements in the Google Sheets persistence layer.

---

## 2. Cross-Layer Requirement Audit Matrix (Key Entities)

| Entity / Field | UI Visual | Client Guard | Route `routes.ts` | Service / Zod | Sheets Schema | Authority Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Question: questionText** | YES (*) | YES (`length>=10`) | YES (`res.status(400)`) | YES (`z.string().min(10)`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Question: subjectId** | YES (*) | YES (Non-empty) | YES (`res.status(400)`) | YES (`z.string().min(1)`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Question: topicId** | YES (*) | YES (Non-empty) | YES (`res.status(400)`) | YES (`z.string().min(1)`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Question: subtopicId** | NO | NO | NO (Optional) | NO (`z.string().optional()`) | NO | **CONFIRMED OPTIONAL** (All layers agree) |
| **Question: explanation** | YES (*) | YES (`length>=10`) | YES (`res.status(400)`) | YES (`z.string().min(10)`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Script: hook** | YES (*) | YES (`length>=10`) | NO (Accepts empty body)| YES (`z.string().min(5)`) | YES | **MISMATCH**: UI and Zod require; Route accepts null! |
| **Video: rawDriveUrl** | YES (*) | YES (Drive Regex) | YES (`res.status(400)`) | YES (`z.string().url()`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Video: editedDriveUrl**| YES (*) | YES (Drive Regex) | YES (`res.status(400)`) | YES (`z.string().url()`) | YES | **CONFIRMED ENFORCED** (All layers agree) |
| **Publishing: scheduledTime**| YES (*) | YES (Future date) | NO (Defaults to NOW) | YES (`z.string().datetime()`) | YES | **MISMATCH**: UI blocks submission; Route falls back! |
| **Settings: spreadsheetId**| YES (*) | YES (Length check) | YES (`res.status(400)`) | NO (Raw string check) | N/A | **CONFIRMED ENFORCED** |
| **Planning: batchCode** | YES (*) | YES (Format regex) | YES (`res.status(400)`) | YES (`z.string().min(3)`) | YES | **CONFIRMED ENFORCED** |

---

## 3. Critical Requirement Mismatch Discoveries

1. **Script Body vs Route Handler**: In `src/server/routes.ts`, `POST /api/videos/:id/script` accepts an empty `hook` string if `fullScript` is provided as a combined blob, whereas `ScriptWorkspace.tsx` disables the save button unless `hook`, `body`, and `callToAction` are all individually non-empty. Direct API calls can persist scripts with empty hooks.
2. **Publishing Scheduled Timestamp**: `PublishingWorkspace.tsx` requires the user to pick a timestamp before clicking "Schedule", but the backend `videoService.updatePublishing()` defaults `scheduledTime` to `new Date().toISOString()` if missing, resulting in accidental immediate publication requests.
