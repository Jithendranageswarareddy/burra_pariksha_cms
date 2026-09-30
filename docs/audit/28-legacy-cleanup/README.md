# Step 28: Naming, Duplication & Legacy Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Forensic Naming, Duplication & Legacy Cleanup Map  
**Phase:** Step 28 of 30  
**Status:** **AUTHORITATIVE AUDIT (READ-ONLY CLEANUP MAP)**  
**Date:** 2026-09-29  

---

## 1. Audit Scope & Summary

This forensic audit analyzes naming conventions, directory structure, file naming, component duplication, page duplication, service duplication, repository duplication, route aliases, state naming divergence, legacy workflow implementations, and duplicated business rules across the entire BP-CMS repository.

### STRICT NO-MODIFICATION RULE:
This step establishes a forensic cleanup map only. **NO files, directories, components, services, routes, states, or database fields were deleted, renamed, merged, or modified.**

### Key Forensic Findings:
1. **Design System Duplication:** Dual component sets between `src/components/ui/` (Tailwind / Radix style) and `src/components/common/` (legacy bespoke components).
2. **Drive Service Duplication:** `src/lib/services/phase14-drive.service.ts` and `src/lib/services/google-drive.service.ts` contain overlapping upload and folder resolution methods.
3. **State & Workflow Terminology Divergence:** `Video.status` vs `Question.videoStatus` divergence; "Phase", "Stage", and "Step" used interchangeably across legacy documentation and test scripts.
4. **Legacy Phase Test Clutter:** 120+ incremental task verification scripts in `src/tests/` that duplicate core regression suite functionality.
5. **Artifact Classification Totals:**
   - **KEEP:** 185 core application files
   - **MODIFY:** 42 files requiring targeted bug fixes or security guards
   - **MERGE:** 14 candidate pairs (Design system components, Drive services)
   - **DEPRECATE:** 28 historical phase scripts and unused UI stubs
   - **REMOVE:** 18 dead files (after dependency verification)
   - **CREATE:** 8 target files (Unified PostgreSQL schemas, React Router role guards, BullMQ workers)

---

## 2. Document Catalog

- `README.md` — Scope, summary, and strict read-only governance rules
- `master-cleanup-map.md` — Master inventory of all audited artifacts with KEEP/MODIFY/MERGE/DEPRECATE/REMOVE/CREATE classifications
- `keep-map.md` — Valid artifacts to retain
- `modify-map.md` — Artifacts requiring targeted modifications
- `merge-map.md` — Candidate pairs for future consolidation
- `deprecate-map.md` — Candidate legacy artifacts for phased retirement
- `remove-map.md` — Candidate dead files for eventual deletion
- `create-map.md` — Required target architecture artifacts to be created
- `duplication-register.md` — Inventory of duplicated business logic, components, and services
- `legacy-register.md` — Inventory of legacy phase scripts and obsolete patterns
- `cleanup-problem-register.md` — Classified cleanup problem register
- `final-cleanup-baseline.md` — Definitive 33-point cleanup baseline
