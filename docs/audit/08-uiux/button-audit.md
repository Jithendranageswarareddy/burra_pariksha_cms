# Button Forensic Audit (All 369 Button Elements)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 09 of 30  

---

## 1. Button Audit Overview

AST analysis across all 31 page files identified **369 interactive button instances**.
Buttons fall into primary variants:
- **Primary Action (Solid Indigo/Violet)**: Key workflow progression triggers.
- **Secondary / Outline**: Supportive actions, filter toggles, draft saves.
- **Danger (Solid Rose/Red)**: Rejection triggers, cancel actions, disaster restore.
- **Ghost / Icon**: Collapse toggles, refresh icons, pagination chevrons.

---

## 2. High-Risk Button Patterns Discovered

1. **Competing Primary Actions**:
   - In `QuestionStudioPage.tsx`, "Generate AI Batch" and "Save & Continue" both render with primary visual weight.
2. **Duplicate Labels with Divergent Behaviors**:
   - "Back" button in `NotFoundPage` uses browser history (`navigate(-1)`), while "Back" in `QuestionDetailPage` uses static navigation (`navigate("/questions")`).
3. **Buttons Lacking Loading Spinners**:
   - Several secondary action buttons in `PlanningPage.tsx` execute un-memoized fetches without visual loading feedback, allowing accidental double-clicks.
4. **Permanent Disabled Trap**:
   - In `QuestionVerifyApprovePage.tsx`, the "Approve" button remains disabled until all 5 checklist items are checked, but no tooltip or instruction indicates this prerequisite to the user.
