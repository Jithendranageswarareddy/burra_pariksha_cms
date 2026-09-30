# SDLC Pre-Gate: 07 — Safe Rename & Normalization Plan

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Safe Normalization Execution Plan  
**Status:** **AUTHORITATIVE PLAN**  
**Date:** 2026-09-29  

---

## 1. Safe Normalization Execution Plan

This plan establishes the exact sequence for normalizing naming conventions while protecting all application behavior, build pipelines, and runtime dependencies:

### Step 1: Establish SDLC Governance Structure
- Provision `docs/sdlc/repository-normalization/` with pre-change impact analyses and verification protocols.

### Step 2: Canonical Barrel Re-Exports
- In `src/lib/services/index.ts` and `src/lib/repositories/index.ts`, ensure all domain services are exported under their canonical names while maintaining backward-compatible aliases for legacy identifiers (`phase14DriveService`, `phase22PublishingRepository`, etc.).

### Step 3: Package Script Normalization
- In `package.json`, retain existing `test:phaseXX` commands for backward compatibility while introducing standardized task aliases (`test:unit`, `test:workflow`, `test:regression`).

### Step 4: Verification & Build Gate Assertion
- Execute TypeScript typecheck (`npm run lint` / `tsc --noEmit`).
- Execute production build (`npm run build`).
- Execute automated regression test suites (`stage01-draft-workflow-separation.test.ts`, `stage02-video-transitions.test.ts`).
