# Duplicate Action Implementation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 26 of 30  

---

## 1. Duplicate Action Architecture

Duplicate actions occur when identical business operations (such as approving a question or reviewing a script) are implemented independently across different components or pages.

---

## 2. Competing & Duplicate Implementations Register

| Semantic Business Action | Implementation A (Modern) | Implementation B (Legacy / Duplicate) | Behavior Divergence |
| :--- | :--- | :--- | :--- |
| **Question Creation** | `QuestionStudioPage.tsx` (4-step wizard with Gemini) | `PlanningPage.tsx` ("Quick Draft" inline modal) | Wizard validates Zod schema; inline modal omits distractor explanations! |
| **Script Generation** | `ScriptWorkspace.tsx` (`POST /api/scripts/:id/approve`)| `VideoCreateScriptPage.tsx` (`POST /api/scripts/generate`)| Standalone page generates raw script without teleprompter timing markers |
| **Social Review Signoff**| `VideoDetailPage.tsx?tab=social` (`<SocialSimulatorWorkspace>`)| `SocialReviewPage.tsx` (`SocialReviewPage.tsx` standalone)| Standalone view displays full comment thread; workspace tab shows preview mockup |
| **Production Tracking** | `ProductionTrackerPage.tsx` (Kanban + table) | `ProductionBoardPage.tsx` (Unrouted duplicate) | Unrouted file contains outdated stage definitions from early sprint |
