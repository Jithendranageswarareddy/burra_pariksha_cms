# Stage 03: Audience Script

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 05 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 03 Audience Script
- **Canonical Purpose:** Short-form presenter script with 3-second hook, step-by-step solution, and speed trick.
- **Current Implementation:** `VideoDetailPage.tsx?tab=script`, `ScriptWorkspace.tsx`, `script.service.ts`, `scripts.repository.ts`.
- **Active Route:** `/videos/:id?tab=script`

---

## 2. Operational Flow Reconstructed

### INPUT
- Queued `Video` (`BP-V-######`) and parent `Question` (`BP-Q-######`).
- Script drafting template: Hook, Problem Statement, Step-by-Step Solution, Speed Trick, Call To Action.

### WORK
- Content creator drafts short-form presenter script.
- Enforces the Telugu audience CTA format:
  `"మీ సమాధానం ఏదో కామెంట్ చేయండి"`.
- Computes estimated pacing duration in seconds.
- Persists version 1 (or appends new version in `SCRIPT_VERSIONS`).

### OUTPUT
- `Script` entity with ID format `BP-S-######`.
- Appended row in `SCRIPTS` and `SCRIPT_VERSIONS` worksheets.

### STATE
- **Entity:** `Script` (version: 1), `Video` (status: `SCRIPT_READY` or `QUEUED`).
- **State Machine:** Video Production Machine (`VALID_VIDEO_TRANSITIONS`).
- **Authoritative Storage:** Google Sheets (`SCRIPTS`, `SCRIPT_VERSIONS`).

### NEXT STAGE
- **Expected Canonical Next Stage:** 04 Teleprompter & Filming
- **Actual Implementation Next Stage:** Switches tab to `/videos/:id?tab=recording`.
- **Mismatch:** None. Stage 03 transitions directly to Stage 04 within the unified workspace.

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/ScriptWorkspace.tsx`, `src/lib/services/script.service.ts:162-230`.
- **Implementation Status:** **FULLY IMPLEMENTED**
