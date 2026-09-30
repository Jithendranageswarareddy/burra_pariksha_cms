# QUEUED -> EDITING Code Evidence

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 35 of 41  

---

## 1. Verified Evidence Locations in Source Code

1. **State Machine Definition:**
   - **File:** `src/lib/services/video.service.ts`
   - **Lines:** 59–66
   - **Evidence:** `VALID_VIDEO_TRANSITIONS[QUEUED]` omits `EDITING`.

2. **Transition Enforcer:**
   - **File:** `src/lib/services/video.service.ts`
   - **Lines:** 155–172
   - **Evidence:** Throws `ValidationError: Illegal status transition from "QUEUED" to "EDITING"`.

3. **Client-Side Bypass Implementation:**
   - **File:** `src/components/video/RecordingWorkspace.tsx`
   - **Lines:** 227–248 and 335–362
   - **Evidence:** Explicit 3-stage sequential dispatch workaround (`QUEUED -> SCRIPT_READY -> RECORDED -> EDITING`).
