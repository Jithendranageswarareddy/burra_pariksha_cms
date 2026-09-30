# Cross-Page UI Consistency Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 26 of 30  

---

## 1. Visual & Interactive Consistency Audit

This audit evaluates semantic consistency across all 31 page files without proposing redesigns.

---

## 2. Inconsistencies Discovered

### 1. Typography & Hierarchy Inconsistencies
- `DashboardPage` and `QuestionLibraryPage` use `text-2xl font-bold text-slate-900` for headings.
- `PlanningPage` uses bespoke `text-3xl font-extrabold tracking-tight text-slate-800`.
- `SettingsPage` uses `text-xl font-semibold`.

### 2. Action Button Placement & Terminology
- "Cancel" actions: `QuestionStudioPage` places Cancel on the bottom-left; `QuestionImprovePage` places Cancel in the top-right header.
- Progression terms: The app mixes "Continue to Verification", "Advance to Filming", "Approve & Next", and "Submit".

### 3. Status Badge Color Token Fragmentation
- `QuestionLibraryPage` uses Tailwind palette: `bg-emerald-100 text-emerald-700`.
- `ProductionTrackerPage` uses hex colors or `bg-green-500/10 text-green-600`.
- Both represent the identical conceptual state ("VERIFIED" / "APPROVED").

### 4. Back Navigation Semantics
- 14 pages use static route back buttons (`navigate("/questions")`).
- 2 pages use history back (`navigate(-1)`), which strands users arriving via external deep-links.
