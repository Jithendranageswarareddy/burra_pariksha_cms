# Stage 15: Intelligence Loop & Flywheel Feedback

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 17 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 15 Intelligence Loop
- **Canonical Purpose:** AI pedagogical insights synthesis, topic recommendation generation, and loopback to Stage 01.
- **Current Implementation:** `AnalyticsExperiencePage.tsx` (Tab: `/analytics/intelligence`), `SocialPerformanceIntelligenceService`, `intelligenceRepository`.
- **Active Route:** `/analytics/intelligence`

---

## 2. Operational Flow Reconstructed

### INPUT
- Aggregated analytics summaries, drop-off diagnostics, and syllabus taxonomy.
- Gemini AI SDK / `AIOrchestratorService` prompts.

### WORK
- Executes multi-dimensional analysis with Gemini LLM.
- Generates structured pedagogical recommendations:
  - Top recommended topics, ideal video pacing duration, high-converting hook structures.
- Writes advisory report to `ANALYTICS_INTELLIGENCE` worksheet.
- Offers "Apply to Question Studio" button:
  - Pre-populates query parameters (`?topicId=...&difficulty=...`) and redirects to `/studio`.

### OUTPUT
- `SocialPerformanceIntelligenceRecord` (`INT-######`).
- Strategy parameters dispatched to Stage 01.

### STATE
- **Entity:** `SocialPerformanceIntelligenceRecord`
- **Field:** `recommendations`
- **Current State:** `ADVISORY`
- **State Machine:** Intelligence Loop Lifecycle.
- **Authoritative Storage:** Google Sheets (`ANALYTICS_INTELLIGENCE` tab).

### NEXT STAGE
- **Expected Canonical Next Stage:** 01 Question Generation (Flywheel Loopback)
- **Actual Implementation Next Stage:** Dispatches to `/studio` with URL query parameters.
- **Status Finding:** Partially implemented (loopback pre-populates URL parameters, but cannot automatically generate batch questions without human confirmation).

---

## 3. Evidence & Status

- **Evidence:** `src/lib/services/social-performance-intelligence.service.ts:59-200`, `src/pages/AnalyticsExperiencePage.tsx`.
- **Implementation Status:** **PARTIALLY IMPLEMENTED**
