# FINAL TEST DATA DELETION MANIFEST

**Audit Timestamp:** 2026-09-26T19:12:26Z  
**Current Git SHA:** N/A (Read-Only Runtime Workspace, Git binary / repository not initialized)  
**Verification Mode:** 100% Read-Only Forensic Inventory Check

---

## 1. Executive Summary

This manifest establishes the final, authoritative pre-production data cleanup baseline for the **Burra Pariksha CMS** persistent ecosystems. Multiple runs of automated E2E testing, diagnostic, hardening, and verification sequences have been executed. 

Following a successful controlled internal cleanup, the active operational workspaces are currently **100% clean and pristine of active test-related row data, snapshots, and file systems.** The sole remaining physical testing residues are exactly **14 legacy E2E raw footage video files** currently residing in Google Drive Trash.

---

## 2. Protected Production & Foundational Elements (MUST PRESERVE)

The following core structures, configurations, and reference taxonomy accounts represent the foundational infrastructure of the application and **MUST NEVER** be deleted or modified:

| Storage Location | Resource / Worksheet | Preserved Identifiers / Row Range | Purpose / Dependency | Classification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Sheets** | `USERS` | A2:E3 (2 admin profiles) | Access control and security | ADMINISTRATIVE | **PROTECTED** |
| **Google Sheets** | `CATEGORIES` | A2:G5 (4 records) | Top-level aptitude fields | FOUNDATION | **PROTECTED** |
| **Google Sheets** | `TOPICS` | A2:I109 (108 records) | Taxonomy routing core | FOUNDATION | **PROTECTED** |
| **Google Sheets** | `SUBTOPICS` | A2:J109 (108 records) | Sub-skill taxonomy core | FOUNDATION | **PROTECTED** |
| **Google Sheets** | `QUESTION_CONFIG` | A2:F3 (2 records) | Creator configuration options | FOUNDATION | **PROTECTED** |
| **Google Sheets** | `SEQUENCES` | A2:E21 (20 records) | Auto-increment sequence states | ADMINISTRATIVE | **PROTECTED** |
| **Google Sheets** | All Worksheets | Row 1 (all headers) | Worksheet schema metadata | SCHEMA | **PROTECTED** |
| **Google Drive** | Root Folder | ID: `1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN` | Main CMS media storage root | INFRASTRUCTURE | **PROTECTED** |
| **Google Drive** | Content Folder | ID: `1jSHU8LIU6fQsd7Q2juNt5Mg0vOlafMMg` | Main content storage | INFRASTRUCTURE | **PROTECTED** |
| **GCS Bucket** | Snapshot Bucket | `burra-pariksha-snapshots-2026` | durable offsite backup bucket | INFRASTRUCTURE | **PROTECTED** |

---

## 3. Google Sheets Operational Worksheets (0 Active Rows)

The following transactional spreadsheets contain exactly **0 data rows** under Row 1, establishing a perfect zero-contamination state:

1.  `QUESTIONS` — **0 Rows** (Safe / Preserved structure)
2.  `QUESTION_VIDEOS` — **0 Rows** (Safe / Preserved structure)
3.  `VIDEOS` — **0 Rows** (Safe / Preserved structure)
4.  `SCRIPT` — **0 Rows** (Safe / Preserved structure)
5.  `SCRIPT_VERSIONS` — **0 Rows** (Safe / Preserved structure)
6.  `THUMBNAILS` — **0 Rows** (Safe / Preserved structure)
7.  `THUMBNAIL_VERSIONS` — **0 Rows** (Safe / Preserved structure)
8.  `PINNED_COMMENTS` — **0 Rows** (Safe / Preserved structure)
9.  `PINNED_COMMENT_VERSIONS` — **0 Rows** (Safe / Preserved structure)
10. `PUBLISHING` — **0 Rows** (Safe / Preserved structure)
11. `WORKFLOW` — **0 Rows** (Safe / Preserved structure)
12. `ASSIGNMENTS` — **0 Rows** (Safe / Preserved structure)
13. `AUDIT_LOG` — **0 Rows** (Safe / Preserved structure)
14. `CONTENT_MASTERS` — **0 Rows** (Safe / Preserved structure)
15. `QUESTION_VALIDATIONS` — **0 Rows** (Safe / Preserved structure)
16. `SOCIAL_REVIEWS` — **0 Rows** (Safe / Preserved structure)
17. `CONTENT_PLANS` — **0 Rows** (Safe / Preserved structure)
18. `CONTENT_BATCHES` — **0 Rows** (Safe / Preserved structure)
19. `MEDIA_ASSETS` — **0 Rows** (Safe / Preserved structure)
20. `SOCIAL_ANALYTICS` — **0 Rows** (Safe / Preserved structure)
21. `STRATEGY_RECOMMENDATIONS` — **0 Rows** (Safe / Preserved structure)
22. `ANALYTICS_INTELLIGENCE` — **0 Rows** (Safe / Preserved structure)
23. `COMMENT_INTELLIGENCE` — **0 Rows** (Safe / Preserved structure)
24. `SOCIAL_COMMENTS` — **0 Rows** (Safe / Preserved structure)

---

## 4. Google Drive Active Contents (0 Active Files / Folders)

*   **Active `BP-CNT-*` folders inside CMS Root:** **0**
*   **Active E2E / STAGE8 video files inside CMS Root:** **0**
*   **CMS Root Content Folder Status:** Completely Empty (`0` active files).

---

## 5. Google Drive Trash (14 Permanent Purge Candidates)

These **14 files** matching `STAGE8_E2E_*` currently reside in Google Drive Trash and represent the final residue candidates for permanent cloud purging:

| Store | Type | ID | Name | Parent / Root | Reason | Evidence | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| Google Drive | Trash | `18iro3R6wSPBewFRpCciUvaZYgk9OPeA_` | `STAGE8_E2E_1790443526775_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1RyB6UelZfFgWNyb6WqfVS7pNySksQ_A_` | `STAGE8_E2E_1790443117487_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1yadgCA8yWCUEQiene04L8R-wylLsB4Wb` | `STAGE8_E2E_1790437986565_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `13wCR0_yxtWRfkd5QvoImx78YjAlPzRPh` | `STAGE8_E2E_1790437241013_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `15tGztpv1Nt0KeXHUZk2G-Jf5EauuAVlc` | `STAGE8_E2E_1790436624915_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1QYnoFLVCYNIuLZOhF2U0EDtT8bA427VQ` | `STAGE8_E2E_1790435994848_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1GGvAAW0ee04r30L17LypByOENj-1C0VW` | `STAGE8_E2E_1790435353356_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1B-EQMmJ17Gs4dI8vyFVQljhMWgETPKGQ` | `STAGE8_E2E_1790434657829_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1KUw0oOc7NoT9XQvVQZlWFkMiCAbTmGeu` | `STAGE8_E2E_1790432221103_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1x7JFf1T-J8Oj_hAq9eYTsNuSj6613Fa4` | `STAGE8_E2E_1790432047824_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1zAb74dDGKDXM245IcOGwUp-0Y1zDa-S-` | `STAGE8_E2E_1790431861084_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `116ayMoulPTKerdQn890sbm5mSEnm7yk0` | `STAGE8_E2E_1790431799782_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `1XA7h1WLA6JpErTPGQxs9t86RDzbmxMb1` | `STAGE8_E2E_1790431142271_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |
| Google Drive | Trash | `11lKtn9MT6yxLrSRA06RM_S6FKBNeg041` | `STAGE8_E2E_1790430972932_raw_footage.mp4` | `0ADR8Ogk1QotbUk9PVA` | Stage 8 Test residue | Name format & Shared parent | **HIGH** |

---

## 6. Snapshot & Backup Storage (0 Active Objects)

*   **Google Cloud Storage:** `0` active snap payloads and `0` manifest meta.json files remain in the bucket.
*   **Local Filesystem backups:** Exactly `0` temporary unit-testing assignment `.json` caches are present.

---

## 7. Unknown & Non-deletable Objects

*   **Unknown items detected:** **0**
*   *Verification verifies that all persistent elements inside the ecosystem represent either protected foundational assets or successfully cleared, empty operational spaces.*
