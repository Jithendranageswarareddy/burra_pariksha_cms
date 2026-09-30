# Duplicate Component Analysis Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. High-Severity Component Duplication Matrix

The audit discovered **5 critical pairs of competing UI components**:

### 1. `Button` Primitive
- **Candidate A:** `src/design-system/components/Button.tsx` (52 consumers)
- **Candidate B:** `src/components/common/Button.tsx` (51 consumers)
- **Shared:** Both provide `<button>` wrappers with primary, secondary, danger, outline styles.
- **Differences:** Design system version uses typed token variants (`buttonVariants`); common version uses raw Tailwind utility concatenations.
- **Evidence:** 103 consumers split evenly across the application.
- **Classification:** **STRONG DUPLICATE**

### 2. `PageHeader` Component
- **Candidate A:** `src/design-system/components/PageHeader.tsx` (28 consumers)
- **Candidate B:** `src/components/layout/PageHeader.tsx` (27 consumers)
- **Shared:** Page title, breadcrumbs, action buttons container, status badge slot.
- **Differences:** Minor prop naming differences (`description` vs `subtitle`; `badges` array vs single `badge`).
- **Classification:** **STRONG DUPLICATE**

### 3. `EmptyState` Component
- **Candidate A:** `src/design-system/components/EmptyState.tsx` (15 consumers)
- **Candidate B:** `src/components/common/EmptyState.tsx` (14 consumers)
- **Shared:** Icon, headline title, descriptive message, optional action button.
- **Differences:** Design system version imports Lucide icons dynamically; common version accepts ReactNode icon.
- **Classification:** **STRONG DUPLICATE**

### 4. `Modal` Component
- **Candidate A:** `src/design-system/components/Modal.tsx` (12 consumers)
- **Candidate B:** `src/components/common/Modal.tsx` (12 consumers)
- **Shared:** Fixed backdrop overlay, escape key listener, title header, close X button.
- **Classification:** **STRONG DUPLICATE**

### 5. `Badge` vs `StatusBadge`
- **Candidate A:** `src/design-system/components/Badge.tsx` (24 consumers)
- **Candidate B:** `src/components/common/StatusBadge.tsx` (8 consumers)
- **Shared:** Pill-shaped colored badge with status dot.
- **Differences:** StatusBadge hardcodes Question and Video status colors; Badge accepts general semantic color tokens.
- **Classification:** **STRONG DUPLICATE**

---

## 2. Competing Workflow Headers
In addition to UI primitives, 4 separate domain workflow headers exist:
- `src/components/video/VideoWorkflowHeader.tsx`
- `src/components/questions/QuestionWorkflowHeader.tsx`
- `src/components/social/AssetWorkflowHeader.tsx`
- `src/components/publishing/PublishingWorkflowHeader.tsx`
All 4 implement step progression bars with next/prev buttons, duplicating workflow navigation patterns.
