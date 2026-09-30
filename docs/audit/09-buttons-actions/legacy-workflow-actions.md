# Legacy Workflow Logic & Action Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 12 of 30  

---

## 1. Legacy Action Archaeology

As documented in Step 05 and Step 06, BP-CMS originally evolved through numbered "Phases" (Phase 12 through Phase 26). While modern workspaces have consolidated around `VideoDetailPage.tsx`, several legacy service wrappers and deprecated handlers remain active in the execution chain.

---

## 2. Legacy Actions Inventory

| Action / Handler | Invoked Legacy Service | Modern Canonical Successor | Risk / Observation |
| :--- | :--- | :--- | :--- |
| `VideoCreateScriptPage.tsx` | `Phase15ScriptProductionService` | `ScriptWorkspace.tsx` via `ScriptService` | Standalone page bypassed by tab workspace |
| `ThumbnailWorkspace.tsx` | `Phase18ThumbnailIntelligenceService` | `ThumbnailService.saveThumbnail()` | Legacy intelligence wrapper calls duplicate Gemini client |
| `SocialReviewPage.tsx` | `Phase20SocialReviewService` | `SocialReviewService.approveReview()` | Calls legacy review schema with extra unused fields |
| `VideoEditPage.tsx` (Unrouted) | `Phase17VideoProductionService` | `EditingWorkspace.tsx` | Unrouted file contains dead legacy mutation code |
| `VideoFinalPage.tsx` (Unrouted)| `Phase17VideoProductionService` | `FinalReviewWorkspace.tsx` | Unrouted file contains dead legacy QC check code |
