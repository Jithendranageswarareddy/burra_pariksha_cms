# Duplicate Candidates Forensic Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

Identified Duplicate Candidates: **5** files

| Current File | Suspected Counterpart | Classification | Overlapping Responsibility / Forensic Evidence |
| :--- | :--- | :--- | :--- |
| `full-repo-inventory.json` | `repo-inventory.json` | **SAME FUNCTION / DIFFERENT IMPLEMENTATION** | Full dump vs subset of static repository analysis |
| `repo-inventory.json` | `full-repo-inventory.json` | **SAME FUNCTION / DIFFERENT IMPLEMENTATION** | Subset vs full dump of static repository analysis |
| `run-stage8-runner.ts` | `src/tests/stage8-continuous-verification.ts` | **POSSIBLE DUPLICATE** | Redundant runner wrapper around stage 8 suite |
| `src/lib/services/google-drive.service.ts` | `src/lib/services/phase14-drive.service.ts` | **STRONG DUPLICATE CANDIDATE** | Dual implementations of Google Drive folder resolution and upload logic |
| `src/lib/services/phase14-drive.service.ts` | `src/lib/services/google-drive.service.ts` | **STRONG DUPLICATE CANDIDATE** | Dual implementations of Google Drive folder resolution and upload logic |
