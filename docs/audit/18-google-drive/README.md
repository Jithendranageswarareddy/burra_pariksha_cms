# Step 18: Google Drive & File Storage Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Audit Date:** 2026-09-29  
**Audit Mode:** Read-Only Forensic Analysis  
**Auditor:** Cloud Storage Architecture & Media Infrastructure Specialist  

---

## 1. Executive Summary & Audit Objective

The objective of Step 18 is to perform an exhaustive, evidence-backed forensic audit of the **Google Drive and File Storage Architecture** utilized by the Burra Pariksha CMS. The audit reconstructs the complete lifecycle of every media asset:

```
UPLOAD -> FILE CREATION -> GOOGLE DRIVE -> FOLDER -> FILE ID -> METADATA
  -> APPLICATION ENTITY -> REFERENCE -> RETRIEVAL -> DOWNLOAD / PLAYBACK / DISPLAY
  -> UPDATE / REPLACEMENT -> ARCHIVE / DELETE
```

The primary audit resolves core operational and architectural realities:
1. **What file storage technologies are active?**  
   **Google Drive API v3** (via `googleapis ^176.0.0`) serves as the authoritative binary media store. Ephemeral in-memory storage (`mockFiles` in `GoogleDriveService`) acts as a fallback when credentials are absent.
2. **What authentication mechanism connects to Drive?**  
   Drive operations execute in **OAuth 2.0 Mode** using `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`. Legacy Service Account JWT authentication is restricted to non-production environments.
3. **What folder hierarchies exist?**  
   Live Drive inspection confirms **two competing folder conventions**:
   - **Phase 7 Convention:** `Root -> Content -> BP-CNT-###### -> { Videos, Scripts, Thumbnails }`
   - **Phase 14 Convention:** `Root -> BP-CNT-###### -> { Raw, Edited, Final, Thumbnail }`
4. **What files are stored and how are they referenced?**  
   Raw video takes (`vd1.1.mp4`, `vd1.2.mp4`), edited cuts, and final renders are stored as binary files in Drive and tracked via `driveFileId` across Google Sheets tabs (`VIDEOS`, `MEDIA_ASSETS`, `THUMBNAILS`).
5. **What is the Source of Truth?**  
   Google Drive is authoritative for binary content, while Google Sheets is authoritative for business metadata, creating an asynchronous coupling without distributed ACID transactions.

### Read-Only Audit Charter Statement
In strict adherence to the project audit charter:
- **Zero files were uploaded, downloaded unnecessarily, renamed, copied, moved, or deleted.**
- **Zero Drive folders were created, altered, or restructured.**
- **Zero permissions, ACLs, or sharing links were modified.**
- **Zero Google Sheets rows, cells, or database entities were modified.**
- **Zero source code, routes, or services were changed.**
- **Zero deployments, test runs, or git operations were executed.**

---

## 2. Key File Storage Audit Metrics Summary

| Metric / Dimension | Verified Value | Evidence Classification |
| :--- | :--- | :---: |
| **Active Binary Storage Engine** | **Google Drive API v3** (REST API) | CONFIRMED (`src/lib/services/google-drive.service.ts`) |
| **Local Fallback Storage Engine**| **In-Memory Buffer Store** (`mockFiles`) | CONFIRMED (`src/lib/services/google-drive.service.ts:68`) |
| **Cloud Object Storage (GCS/S3)**| **0 Connections** (Not configured) | CONFIRMED (`package.json`, `.env.example`) |
| **Live Drive Auth Mode** | **OAuth 2.0 Refresh Token** (`OAUTH2`) | CONFIRMED (`scripts/verify-drive-state.ts` live run) |
| **Root Folder ID** | `1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN` | CONFIRMED (Configured via `GOOGLE_DRIVE_ROOT_FOLDER_ID`) |
| **Active Root Content Folder ID** | `1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx` | CONFIRMED (Live Google Drive Query) |
| **Folder Hierarchy Conventions** | **2 Competing Conventions** (Phase 7 vs Phase 14)| CONFIRMED (Live Drive & Service Code) |
| **Live Content Folders Audited**| **6 Active Folders** under Content Root | CONFIRMED (`BP-CNT-000001`, `172872`, `875634`, etc.) |
| **Subfolders per Content Folder**| **3 Subfolders** (`Videos`, `Scripts`, `Thumbnails`)| CONFIRMED (Live Drive Query) |
| **Verified Live Binary Assets** | **vd1.1.mp4** (2.65MB), **vd1.2.mp4** (2.68MB) | CONFIRMED (Live Drive `files.get` inspection) |
| **Sheet MediaAsset Records** | **9 Records** in `MEDIA_ASSETS` tab | CONFIRMED (`src/lib/repositories/media-assets.repository.ts`) |
| **Synthetic Placeholder File IDs**| **3 Records** with `fixed_drive_file_id_12345` | CONFIRMED (`MEDIA_ASSETS` rows 7-9) |
| **Video Production Records** | **7 Records** in `VIDEOS` tab | CONFIRMED (`src/lib/repositories/videos.repository.ts`) |
| **Entity Without Drive Asset** | **1 Record** (`BP-V-372937` has `driveFileId: undefined`)| CONFIRMED (`VIDEOS` row 2) |
| **Thumbnail Sheet Records** | **0 Records** in `THUMBNAILS` tab | CONFIRMED (`THUMBNAILS` query) |
| **Drive Problem Findings** | **26 classified problems** (5 Crit, 12 High, 6 Med, 3 Low)| CONFIRMED (`drive-problem-register.md`) |

---

## 3. Structure of Step 18 Documentation Suite

The complete Step 18 forensic baseline comprises **40 specialized documentation records** under `docs/audit/18-google-drive/`:

```
docs/audit/18-google-drive/
├── README.md                                  # Executive summary, metrics, and audit charter
├── file-storage-inventory.md                  # Comprehensive inventory of all file storage tiers
├── google-drive-inventory.md                  # Google Drive API v3 client, auth modes, and capabilities
├── folder-structure.md                        # Dual folder hierarchy analysis (Phase 7 vs Phase 14)
├── file-type-inventory.md                     # Video, image, and text MIME types and extension rules
├── raw-video-audit.md                         # Raw video takes, versioning, and media asset tracking
├── edited-video-audit.md                      # Edited cuts, final published renders, and QC handoffs
├── thumbnail-audit.md                         # Thumbnail candidates, approval gates, and Drive links
├── script-document-audit.md                   # Script storage: Sheets text vs Drive document absence
├── generated-assets-audit.md                  # AI thumbnails, exported JSON snapshots, reports
├── file-id-audit.md                           # Drive file ID naming, format, and external ID mapping
├── file-metadata-audit.md                     # File metadata in Drive vs Google Sheets columns
├── entity-file-relationships.md               # 1:1, 1:N, and N:M relationships between entities & files
├── file-reference-audit.md                    # Auditing all driveFileId references across sheets & services
├── sheets-drive-reconciliation.md             # Reconciling Google Sheets records against live Drive files
├── database-drive-reconciliation.md           # Database tier vs Drive (0 SQL DBs, Sheets authoritative)
├── drive-source-of-truth.md                   # Storage tier authority: Binary in Drive vs Metadata in Sheets
├── upload-paths.md                            # Multipart busboy streaming uploads to Drive
├── retrieval-paths.md                         # Direct streaming proxy vs webViewLink redirections
├── download-playback.md                       # HTTP Range 206 streaming and browser playback mechanics
├── drive-permissions.md                       # OAuth scopes, service account ACLs, and RBAC mapping
├── file-ownership.md                          # Creator vs Uploader vs Owner across application and Drive
├── file-lifecycle.md                          # 15-stage conveyor file lifecycle and transition gates
├── file-replacement-versioning.md             # Monotonic take increments vs destructive overwrites
├── orphan-files.md                            # Drive files without Sheet rows & Sheet rows without files
├── duplicate-files.md                         # Multiple takes, duplicate uploads, and test remnants
├── folder-consistency.md                      # Folder naming, parent resolution, and caching rules
├── hardcoded-drive-references.md              # Audit of hardcoded folder/file IDs across codebase
├── test-production-file-separation.md         # Test asset pollution in production root folder
├── legacy-drive-structure.md                  # Phase 7 legacy Content folders vs Phase 14 stage folders
├── file-security.md                           # Credential protection, public links, and stream auth
├── file-validation.md                         # MIME checks, size limits, and filename sanitization
├── file-error-handling.md                     # Transient retry backoff, quota handling, error bubbles
├── partial-failure-atomicity.md               # Drive upload success with Sheet write failure (orphan risk)
├── file-cache-url-audit.md                    # Folder ID caching (folderCache) and webViewLink lifetimes
├── file-entity-data-flow.md                   # End-to-end data flow from user upload to playback
├── drive-problem-register.md                  # 26 classified storage and integration vulnerabilities
├── critical-file-traces.md                    # 4 detailed trace diagrams for core media operations
├── runtime-verification.md                    # 12 dynamic behaviors deferred to live runtime testing
└── final-google-drive-baseline.md             # Master 39-section architectural baseline specification
```

---

## 4. Live Drive Verification Statement

```
================================================================================
LIVE DRIVE VERIFICATION STATEMENT:
AUTHENTICATION: OAUTH 2.0 REFRESH TOKEN (ACTIVE & VALIDATED)
ROOT FOLDER ID: 1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN
LIVE ACCESS CONFIRMED: SAFE READ-ONLY METADATA INSPECTION PERFORMED.
VERIFIED LIVE FOLDERS: 1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx (Content)
VERIFIED LIVE ASSETS:
- vd1.1.mp4 (ID: 1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB, Size: 2,649,854 bytes, MIME: video/mp4)
- vd1.2.mp4 (ID: 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK, Size: 2,684,852 bytes, MIME: video/mp4)
ZERO LIVE FILES OR FOLDERS WERE CREATED, MODIFIED, OR DELETED.
================================================================================
```
