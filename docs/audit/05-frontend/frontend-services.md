# Frontend Service Layer Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Direct Service Imports in Frontend Code

An audit of imports across all 115 frontend files reveals that **only 4 files** directly import from backend/service directories:

1. **`src/pages/ContentMasterPage.tsx`**:
   - Imports type: `import { ContentMasterDetails } from "../lib/services/content-master.service"` (Type-only import).
2. **`src/pages/PlanningPage.tsx`**:
   - Imports types: `import { DiversityRadarReport, QuestionSimilarityMatch } from "../lib/services/similarity.service"` (Type-only imports).
3. **`src/pages/SettingsPage.tsx`**:
   - Imports types: `import { OperationalHealthReport } from "../lib/services/operational-health.service"`
   - Imports types: `import { SequenceSafetyReport } from "../lib/services/sequence-safety.service"`
   - Imports types: `import { OperationalRecoveryState } from "../lib/services/operational-recovery.service"` (Type-only imports).
4. **`src/components/publishing/PublishingTable.tsx`**:
   - Imports runtime service: `import { ProductionAssetValidationService } from "../../lib/services/production-asset-validation.service"`.
   - **Severe Architectural Leakage:** Frontend component instantiates and calls backend validation logic directly rather than delegating to an API endpoint!

---

## 2. Architectural Boundary Evaluation
- With the exception of `PublishingTable.tsx`, frontend files cleanly avoid importing backend Google Sheets repositories or filesystem utilities.
- However, TypeScript type interfaces are frequently imported across the boundary from `src/lib/services/`.
