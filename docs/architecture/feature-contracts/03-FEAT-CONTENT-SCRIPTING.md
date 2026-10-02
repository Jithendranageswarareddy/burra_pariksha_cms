# Feature Contract: FEAT-03 Explanatory Content & Scripting

**Feature ID:** `FEAT-03`  
**Feature Name:** Explanatory Content & Scripting  
**Workflow Steps:** Step 03 (AI Script Generation) & Step 04 (Human Script Polish)  
**Primary Hub:** Content Hub (`/content/scripts`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Generate engaging, pedagogically sound Telugu YouTube short script breakdowns with visual cues, followed by human script polishing and timing verification.
- **Goal:** Combine Gemini generative capabilities (`@google/genai`) with strict human oversight, ensuring natural Telugu phrasing and optimal 60-second video pacing.

### 2. Business Acceptance Criteria
- AI generates structured multi-beat script (Hook, Question, Timer/Tension, Solution, Call-to-Action) with Telugu SSML annotations.
- Step 03 to Step 04 transition does NOT bypass human polish; AI cannot mark a script as `POLISHED` or `READY_FOR_AUDIO` (`AP-009`, Non-Authoritative AI).
- Human editor can modify dialogue, visual prompts, and timing markers.

### 3. Domain Entities
- `ScriptEntity`, `ScriptBeat`, `VisualCue`, `AudioCue`, `SsmlAnnotation`.

### 4. Database Persistence
- **Collection:** `scripts`, `script_versions`
- **Keys:** `scriptId` (UUID v4), `questionId`
- **Indexes:** `questionId + version`, `status + updatedAt`
- **Concurrency:** OCC `version` increment on script updates.

### 5. API Contract
- **AI Generation Path:** `POST /api/v1/scripts/generate` (Step 03)
- **Human Polish Path:** `PUT /api/v1/scripts/:id/polish` (Step 04)
- **Envelope:** `ApiResponseEnvelope<ScriptResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Content Hub (`/content/scripts`)
- **Layout:** Two-column Teleprompter & Beat-Editor with estimated word-per-minute meter and Telugu keyboard assist.

### 7. RBAC & Access Control
- **Required Capability:** `content:script` (Script Author / Editor)
- **Allowed Roles:** `SCRIPTWRITER`, `EDITOR`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 02 (Approved Question) $\to$ Step 03 (AI Script Drafted) $\to$ Step 04 (Human Script Polished)
- **Initial Status:** `SCRIPT_PENDING`
- **Target Status:** `SCRIPT_POLISHED` (Proceeds to Step 05)
- **Human Gate:** Mandatory Human Gate at Step 04.

### 9. Validation Schemas
- **Schema:** `ScriptContentSchema`, `ScriptBeatSchema` (Zod)
- **Rules:** Script duration between 30 and 65 seconds, Telugu Unicode presence $\ge 60\%$, at least 3 distinct beats.

### 10. Error Handling & Codes
- `ERR_SCRIPT_TOO_LONG` (422 Unprocessable Entity)
- `ERR_GEMINI_QUOTA_EXCEEDED` (429 Rate Limit)
- `ERR_UNAUTHORIZED_AUTO_PROCEED` (403 Forbidden)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_SCRIPT_GENERATED`, `AUDIT_SCRIPT_POLISHED`
- **Severity:** `INFO`
- **Payload:** Script ID, Version, Model ID (gemini-2.5-flash), Editor ID, Token Count.

### 12. Realtime SSE Events
- **Topic:** `script.updated`
- **Payload:** `{ scriptId, step: "04_HUMAN_POLISH", status: "SCRIPT_POLISHED" }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including AI rate-limit recovery and script validation length checks.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, Gemini API proxy (`/api/ai/*`), Firestore Native mode.

### 15. Rollback Safety Net
- Revert to prior script version via `script_versions` collection, state fallback to `SCRIPT_DRAFT`.
