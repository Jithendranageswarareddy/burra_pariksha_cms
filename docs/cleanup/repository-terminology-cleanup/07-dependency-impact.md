# Repository Terminology Cleanup: 07 — Dependency Impact

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Dependency & Safety Impact Analysis  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Zero-Discovery Dependency Principle

The codebase strictly enforces that numbered business steps (**Step 01** to **Step 15**) do NOT trigger automated discovery or implicit hierarchy loading:
- **No Glob Discovery:** Modules are imported explicitly via typed ES imports rather than dynamically discovered through string pattern globs (`step*` or `phase*`).
- **Explicit Registries:** All business workflow steps are registered explicitly in `src/config/constants.ts` and `src/config/navigation.ts`.
- **Compile-Time Safety:** All barrel exports in `src/lib/services/index.ts` and `src/lib/repositories/index.ts` export strongly-typed singletons without dynamic filesystem scanning.
