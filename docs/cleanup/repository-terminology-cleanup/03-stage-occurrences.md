# Repository Terminology Cleanup: 03 — Stage Occurrences & Step Normalization

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Business Workflow Step Alignment  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Business Workflow Step Normalization

The Burra Pariksha production content workflow is formalized into **Step 01** through **Step 15**.

```
[ Step 01: Question Generation ] ──► [ Step 02: Question Verification ] ──► [ Step 03: Audience Script ]
                                                                                   │
                                                                                   ▼
[ Step 06: Editing Bay ] ◄── [ Step 05: Raw Video ] ◄── [ Step 04: Teleprompter & Filming ]
        │
        ▼
[ Step 07: Final QC ] ──► [ Step 08: Thumbnail ] ──► [ Step 09: Social Review ] ──► [ Step 10: Publishing Setup ]
                                                                                           │
                                                                                           ▼
[ Step 15: Intelligence Loop ] ◄── [ Step 14: Performance Review ] ◄── [ Step 13: Analytics ] ◄── [ Step 11: Published ]
         │                                                                                         ▲
         │                                                                                         │
         └────────────────────────────────────────────────────────► [ Step 12: Platform Sync ] ────┘
```

---

## 2. Invariant Rules

1. **No Implicit Numbered Hierarchy:** The system does NOT automatically discover subsequent steps (e.g. working on Step 02 does not trigger inspection of Steps 03–15 unless explicitly modeled as a workflow dependency).
2. **Explicit Registries:** All 15 production steps are defined explicitly in domain constants (`src/config/constants.ts`) rather than inferred from filesystem globs or directory scans.
3. **No Artificial Stage Numbering in Code:** Domain services, repositories, and types use descriptive functional names instead of `StageXX` prefixes.
