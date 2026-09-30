# Repository Terminology Cleanup: 01 — Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Terminology Elimination & Repository Cleanup Inventory  
**Status:** **AUTHORITATIVE INVENTORY**  
**Date:** 2026-09-29  

---

## 1. Inventory Overview

This inventory records all active source files, services, repositories, types, AI modules, routes, and package scripts across the repository to guide the complete elimination of artificial numbered phase/stage terminology.

```
/
├── src/
│   ├── lib/
│   │   ├── services/       # Domain and workflow services (Target: Pure domain naming)
│   │   ├── repositories/   # Storage repositories (Target: Domain repositories)
│   │   ├── ai/             # Multi-provider AI core (Target: ai-orchestration, provider registry)
│   │   └── validation/     # Mathematical & question validation engines
│   ├── types/              # Domain interfaces & models (Target: ai-orchestration, studio-copilot types)
│   ├── server/             # Express REST endpoints & internal test runners
│   └── tests/              # Automated unit, regression, and pipeline verification tests
├── docs/
│   ├── cleanup/repository-terminology-cleanup/  # Normalization control & verification
│   ├── architecture/29-target/                 # Target architecture specifications
│   ├── engineering/30-master-plan/             # Master SDLC delivery blueprint
│   └── audit/                                  # Isolated historical forensic audit records
└── package.json            # Standardized task scripts (test:unit, test:workflow, test:all)
```

---

## 2. Definitive Business Workflow Terminology Invariant

The Burra Pariksha content production workflow is strictly and exclusively defined as **Step 01** through **Step 15**:

- **Step 01:** Question Generation
- **Step 02:** Question Verification
- **Step 03:** Audience Script
- **Step 04:** Teleprompter & Filming
- **Step 05:** Raw Video
- **Step 06:** Editing Bay
- **Step 07:** Final QC
- **Step 08:** Thumbnail
- **Step 09:** Social Review
- **Step 10:** Publishing Setup
- **Step 11:** Published
- **Step 12:** Platform Sync
- **Step 13:** Analytics
- **Step 14:** Performance Review
- **Step 15:** Intelligence Loop

All artificial "Phase XX" and "Stage XX" engineering labels are eliminated from active application architecture.
