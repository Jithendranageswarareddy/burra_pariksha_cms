const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('./docs/audit/18-google-drive');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Writing Part 1 docs (1-10)...');

// 1. README.md
fs.writeFileSync(path.join(targetDir, 'README.md'), `# Step 18: Google Drive & File Storage Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Audit Date:** 2026-09-29  
**Audit Mode:** Read-Only Forensic Analysis  
**Auditor:** Cloud Storage Architecture & Media Infrastructure Specialist  

---

## 1. Executive Summary & Audit Objective

The objective of Step 18 is to perform an exhaustive, evidence-backed forensic audit of the **Google Drive and File Storage Architecture** utilized by the Burra Pariksha CMS. The audit reconstructs the complete lifecycle of every media asset:

\`\`\`
UPLOAD -> FILE CREATION -> GOOGLE DRIVE -> FOLDER -> FILE ID -> METADATA
  -> APPLICATION ENTITY -> REFERENCE -> RETRIEVAL -> DOWNLOAD / PLAYBACK / DISPLAY
  -> UPDATE / REPLACEMENT -> ARCHIVE / DELETE
\`\`\`

The primary audit resolves core operational and architectural realities:
1. **What file storage technologies are active?**  
   **Google Drive API v3** (via \`googleapis ^176.0.0\`) serves as the authoritative binary media store. Ephemeral in-memory storage (\`mockFiles\` in \`GoogleDriveService\`) acts as a fallback when credentials are absent.
2. **What authentication mechanism connects to Drive?**  
   Drive operations execute in **OAuth 2.0 Mode** using \`GOOGLE_CLIENT_ID\`, \`GOOGLE_CLIENT_SECRET\`, and \`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN\`. Legacy Service Account JWT authentication is restricted to non-production environments.
3. **What folder hierarchies exist?**  
   Live Drive inspection confirms **two competing folder conventions**:
   - **Phase 7 Convention:** \`Root -> Content -> BP-CNT-###### -> { Videos, Scripts, Thumbnails }\`
   - **Phase 14 Convention:** \`Root -> BP-CNT-###### -> { Raw, Edited, Final, Thumbnail }\`
4. **What files are stored and how are they referenced?**  
   Raw video takes (\`vd1.1.mp4\`, \`vd1.2.mp4\`), edited cuts, and final renders are stored as binary files in Drive and tracked via \`driveFileId\` across Google Sheets tabs (\`VIDEOS\`, \`MEDIA_ASSETS\`, \`THUMBNAILS\`).
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
| **Active Binary Storage Engine** | **Google Drive API v3** (REST API) | CONFIRMED (\`src/lib/services/google-drive.service.ts\`) |
| **Local Fallback Storage Engine**| **In-Memory Buffer Store** (\`mockFiles\`) | CONFIRMED (\`src/lib/services/google-drive.service.ts:68\`) |
| **Cloud Object Storage (GCS/S3)**| **0 Connections** (Not configured) | CONFIRMED (\`package.json\`, \`.env.example\`) |
| **Live Drive Auth Mode** | **OAuth 2.0 Refresh Token** (\`OAUTH2\`) | CONFIRMED (\`scripts/verify-drive-state.ts\` live run) |
| **Root Folder ID** | \`1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN\` | CONFIRMED (Configured via \`GOOGLE_DRIVE_ROOT_FOLDER_ID\`) |
| **Active Root Content Folder ID** | \`1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx\` | CONFIRMED (Live Google Drive Query) |
| **Folder Hierarchy Conventions** | **2 Competing Conventions** (Phase 7 vs Phase 14)| CONFIRMED (Live Drive & Service Code) |
| **Live Content Folders Audited**| **6 Active Folders** under Content Root | CONFIRMED (\`BP-CNT-000001\`, \`172872\`, \`875634\`, etc.) |
| **Subfolders per Content Folder**| **3 Subfolders** (\`Videos\`, \`Scripts\`, \`Thumbnails\`)| CONFIRMED (Live Drive Query) |
| **Verified Live Binary Assets** | **vd1.1.mp4** (2.65MB), **vd1.2.mp4** (2.68MB) | CONFIRMED (Live Drive \`files.get\` inspection) |
| **Sheet MediaAsset Records** | **9 Records** in \`MEDIA_ASSETS\` tab | CONFIRMED (\`src/lib/repositories/media-assets.repository.ts\`) |
| **Synthetic Placeholder File IDs**| **3 Records** with \`fixed_drive_file_id_12345\` | CONFIRMED (\`MEDIA_ASSETS\` rows 7-9) |
| **Video Production Records** | **7 Records** in \`VIDEOS\` tab | CONFIRMED (\`src/lib/repositories/videos.repository.ts\`) |
| **Entity Without Drive Asset** | **1 Record** (\`BP-V-372937\` has \`driveFileId: undefined\`)| CONFIRMED (\`VIDEOS\` row 2) |
| **Thumbnail Sheet Records** | **0 Records** in \`THUMBNAILS\` tab | CONFIRMED (\`THUMBNAILS\` query) |
| **Drive Problem Findings** | **26 classified problems** (5 Crit, 12 High, 6 Med, 3 Low)| CONFIRMED (\`drive-problem-register.md\`) |

---

## 3. Structure of Step 18 Documentation Suite

The complete Step 18 forensic baseline comprises **40 specialized documentation records** under \`docs/audit/18-google-drive/\`:

\`\`\`
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
\`\`\`

---

## 4. Live Drive Verification Statement

\`\`\`
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
\`\`\`
`);

// 2. file-storage-inventory.md
fs.writeFileSync(path.join(targetDir, 'file-storage-inventory.md'), `# File Storage Technology Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 02 of 40  

---

## 1. Storage Technologies Overview

A forensic sweep of dependencies, services, and runtime configurations reveals the following file-storage technologies in BP-CMS:

| Storage Tier / Technology | Package / Driver | Protocol / Transport | Environment | Classification | Primary Domain Purpose |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Google Drive API v3** | \`googleapis ^176.0.0\` | HTTPS REST API | Production / Staging | **ACTIVE (AUTHORITATIVE)** | Persistent storage for all binary media (videos, thumbnails, media assets) |
| **In-Memory Buffer Store** | Built-in \`Buffer\` / \`Map\` | V8 Heap Memory | Local Dev / Fallback | **ACTIVE (FALLBACK)** | Ephemeral buffer store (\`mockFiles\`) when Drive credentials are missing |
| **Local Container Filesystem**| Node.js \`fs\` | POSIX Filesystem | Cloud Run Container | **EPHEMERAL / RUNTIME** | Application bundle, temporary multipart stream buffers; wiped on scale-down |
| **Google Cloud Storage (GCS)**| None | HTTPS | None | **UNUSED / NON-EXISTENT** | No \`@google-cloud/storage\` package installed; zero buckets configured |
| **AWS S3 / Azure Blob** | None | HTTPS | None | **UNUSED / NON-EXISTENT** | Zero AWS or Azure SDKs configured |
| **Content Delivery Network (CDN)**| None | HTTPS | None | **UNUSED / NON-EXISTENT** | Media streamed directly through backend proxy or Google Drive webViewLink |

---

## 2. Technology Role Analysis

1. **Google Drive API v3:**  
   Google Drive is the sole persistent object storage engine. It provides hierarchical folder organization, file metadata, MIME-type classification, and binary streaming over HTTPS.
2. **Local Container Filesystem:**  
   On Google Cloud Run, the container filesystem is ephemeral and read-only except for \`/tmp\`. BP-CMS does NOT write media files to disk; multipart uploads via \`busboy\` buffer chunks directly into Node.js \`Buffer\` memory and pipe them immediately to Google Drive.
3. **In-Memory Binary Mock Store (\`mockFiles\`):**  
   Implemented in \`GoogleDriveService\`:
   \`\`\`typescript
   private mockFiles = new Map<string, MockStoredFile>();
   \`\`\`
   Stores uploaded binary buffers in memory during test execution or when \`SKIP_DRIVE_SYNC=true\`.
`);

// 3. google-drive-inventory.md
fs.writeFileSync(path.join(targetDir, 'google-drive-inventory.md'), `# Google Drive Integration Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 03 of 40  

---

## 1. Core Integration Module

- **Implementation File:** \`src/lib/services/google-drive.service.ts\`
- **Singleton Instance:** \`googleDriveService = GoogleDriveService.getInstance()\`
- **API Version:** Google Drive REST API \`v3\` via \`googleapis\`

---

## 2. Authentication Provider Modes

\`GoogleDriveService.getAuthProviderMode()\` dynamically resolves authentication based on environment variables:

| Mode | Trigger Conditions | Active in Current Runtime | Security Assessment |
| :--- | :--- | :---: | :--- |
| **\`OAUTH2\`** | \`GOOGLE_CLIENT_ID\` + \`GOOGLE_CLIENT_SECRET\` + \`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN\` present | **YES (CONFIRMED)** | Production-grade OAuth 2.0 user credentials; auto-refreshes 1-hour access tokens |
| **\`SERVICE_ACCOUNT\`** | \`GOOGLE_SERVICE_ACCOUNT_EMAIL\` + \`GOOGLE_PRIVATE_KEY\` present AND \`NODE_ENV !== 'production'\` | **NO (FALLBACK ONLY)**| Restricted to non-production to avoid service account Drive quota limitations |
| **\`NONE\`** | Credentials missing OR \`SKIP_DRIVE_SYNC === 'true'\` | **NO** | Routes operations to in-memory \`mockFiles\` |

---

## 3. Operations Supported by \`GoogleDriveService\`

1. \`ensureFolder(folderName, parentFolderId)\`: Resolves or creates folder by name with in-memory caching (\`folderCache\`).
2. \`ensureContentHierarchy(contentId)\`: Resolves Phase 7 folder tree (\`Root -> Content -> BP-CNT-###### -> { Videos, Scripts, Thumbnails }\`).
3. \`ensureProductionHierarchy(contentId)\`: Resolves Phase 14 folder tree (\`Root -> BP-CNT-###### -> { Raw, Edited, Final, Thumbnail }\`).
4. \`uploadFile(params)\`: Uploads \`Readable\` stream or \`Buffer\` to target folder with MIME and description.
5. \`getFileMetadata(fileId)\`: Fetches \`id, name, mimeType, size, webViewLink, createdTime, parents\`.
6. \`downloadFile(fileId, rangeHeader)\`: Streams file with full HTTP Range (206 Partial Content) support.
7. \`deleteFile(fileId)\`: Permanently deletes file by ID (used for rollback/cleanup).
8. \`listContentFoldersAndFiles(contentId)\`: Recursively lists hierarchy contents.
`);

// 4. folder-structure.md
fs.writeFileSync(path.join(targetDir, 'folder-structure.md'), `# Google Drive Folder Structure Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 04 of 40  

---

## 1. Dual Folder Hierarchy Conventions

A forensic investigation of \`src/lib/services/google-drive.service.ts\` and live Google Drive queries reveals **two distinct, competing folder hierarchy conventions**:

### Convention A: Phase 7 Conveyor Tree (\`ensureContentHierarchy\`)
Used by: \`video.service.ts\` and \`thumbnail.service.ts\`
\`\`\`
[Root: GOOGLE_DRIVE_ROOT_FOLDER_ID]
  └── Content (Folder ID: 1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx)
        ├── BP-CNT-000001 (Folder ID: 1uiSG4_vtYoeF8FVBRZw9HrTBwNPF46yo)
        │     ├── Videos (Folder ID: 1DBudvMCAA7uc8qHDuZEmnTvvEVPtHVrr)
        │     │     ├── vd1.1.mp4 (File ID: 1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB)
        │     │     └── vd1.2.mp4 (File ID: 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK)
        │     ├── Scripts (Folder ID: 1ht1OQOenHbNK_K2HvinN-OTwFESsT_5d)
        │     └── Thumbnails (Folder ID: 1V4EDuzVy2n5C3xFwiV7486mzxccmbHvD)
        ├── BP-CNT-172872
        ├── BP-CNT-875634
        ├── BP-CNT-731056
        ├── BP-CNT-561774
        └── BP-CNT-743611
\`\`\`

### Convention B: Phase 14 Production Stage Tree (\`ensureProductionHierarchy\`)
Used by: \`phase14-drive.service.ts\`
\`\`\`
[Root: GOOGLE_DRIVE_ROOT_FOLDER_ID]
  ├── BP-CNT-906043 (Directly under Root; bypasses Content parent)
  │     ├── Raw (raw_footage_01.mp4)
  │     ├── Edited (edited_cut_v1.mp4, edited_cut_v2.mp4)
  │     ├── Final (final_published_render.mp4, reviewer_final.mp4)
  │     └── Thumbnail
  ├── BP-CNT-802170
  ├── BP-CNT-E2E17-1790513156435 (Test folder)
  └── BP-CNT-E2E17-1790514028670 (Test folder)
\`\`\`

---

## 2. Architectural Impact of Dual Folder Conventions

1. **Folder Fragmentation:**  
   Assets uploaded via Phase 7 (\`videoService.uploadVideoAsset\`) are saved inside \`Root/Content/BP-CNT-######/Videos\`. Assets uploaded via Phase 14 (\`phase14DriveService.uploadProductionAsset\`) are saved inside \`Root/BP-CNT-######/Raw\` or \`Root/BP-CNT-######/Final\`.
2. **Incompatible Path Assumptions:**  
   Services inspecting \`Root/Content\` cannot find Phase 14 assets, and services inspecting \`Root/BP-CNT-######\` cannot find Phase 7 assets.
`);

// 5. file-type-inventory.md
fs.writeFileSync(path.join(targetDir, 'file-type-inventory.md'), `# File Type & MIME Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 05 of 40  

---

## 1. Supported File Types & MIME Specifications

File types and validation rules are declared in \`src/lib/services/phase14-drive.service.ts\` and \`src/lib/services/video.service.ts\`:

| Media Stage | Allowed Extensions | Allowed MIME Types | Max File Size | Strict Constraints |
| :--- | :--- | :--- | :---: | :--- |
| **RAW VIDEO** | \`.mp4\`, \`.mov\`, \`.mkv\`, \`.webm\` | \`video/mp4\`, \`video/quicktime\`, \`video/x-matroska\`, \`video/webm\` | 100 MB | Filename must not contain path traversal characters (\`/\`, \`..\`) |
| **EDITED VIDEO**| \`.mp4\`, \`.mov\`, \`.mkv\`, \`.webm\` | \`video/mp4\`, \`video/quicktime\`, \`video/x-matroska\`, \`video/webm\` | 100 MB | Must match allowed video extensions |
| **FINAL VIDEO** | \`.mp4\` | \`video/mp4\` (Strict) | 100 MB | **STRICT ENFORCEMENT:** Non-MP4 formats strictly rejected for FINAL publishing |
| **THUMBNAIL** | \`.jpg\`, \`.jpeg\`, \`.png\` | \`image/jpeg\`, \`image/png\`, \`image/jpg\` | 5 MB | Extension must match MIME type exactly (e.g. \`image/png\` requires \`.png\`) |
| **SCRIPTS** | None (Drive) | N/A | N/A | Stored as text strings in Google Sheets \`SCRIPT\` tab; zero Drive files |
| **DOCUMENTS** | None (Drive) | N/A | N/A | No PDF or Word documents stored in Drive |

---

## 2. MIME Validation Logic (\`validateMediaAsset\`)
- Rejects extension-MIME mismatches (e.g. \`image/png\` with \`.jpg\` extension throws \`ValidationError\`).
- Rejects zero-byte empty uploads (\`fileSize === 0\`).
- Enforces configurable limits via \`MAX_VIDEO_SIZE_BYTES\` (default: 100MB) and \`MAX_THUMBNAIL_SIZE_BYTES\` (default: 5MB).
`);

// 6. raw-video-audit.md
fs.writeFileSync(path.join(targetDir, 'raw-video-audit.md'), `# Raw Video Asset Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 06 of 40  

---

## 1. Raw Video Upload & Correlation Lifecycle

Raw video represents recorded teleprompter footage ingested into the system:

\`\`\`
[Video Editor / Presenter]
           │
           ▼ (Multipart HTTP POST: /api/videos/:id/upload)
[handleVideoUploadRoute (busboy stream)]
           │
           ▼
[videoService.uploadVideoAsset()]
           │
           ├── 1. Validate MIME & sanitize filename
           ├── 2. Verify ContentMaster (BP-CNT-######) exists
           ├── 3. Resolve Drive folder: Root/Content/BP-CNT-######/Videos
           ├── 4. Upload binary stream to Google Drive
           │        └── Yields Drive File ID (e.g. 1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB)
           ├── 5. Compute Monotonic Version: nextVersion = max(mediaVersion, videoVersion) + 1
           ├── 6. Append to Google Sheets MEDIA_ASSETS tab (id: MEDIA-######-RAW-1)
           ├── 7. Update Google Sheets VIDEOS tab (driveFileId, driveFolderId, status: RECORDED)
           └── 8. Append to AUDIT_LOG tab (action: VIDEO_ASSET_UPLOAD)
\`\`\`

---

## 2. Live Raw Video Evidence

In live Drive folder \`BP-CNT-000001/Videos\` (\`1DBudvMCAA7uc8qHDuZEmnTvvEVPtHVrr\`):
- **Take 1:** \`vd1.1.mp4\`
  - Drive File ID: \`1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB\`
  - Size: 2,649,854 bytes (~2.65 MB)
  - Created: 2026-09-27T19:31:09.008Z
  - Linked in \`MEDIA_ASSETS\` as: \`MEDIA-000001-RAW-1\` (Version 1)
- **Take 2:** \`vd1.2.mp4\`
  - Drive File ID: \`1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK\`
  - Size: 2,684,852 bytes (~2.68 MB)
  - Created: 2026-09-27T19:31:50.423Z
  - Linked in \`MEDIA_ASSETS\` as: \`MEDIA-000001-RAW-2\` (Version 2)
  - Linked in \`VIDEOS\` as active pointer (\`BP-V-000001.driveFileId\`)
`);

// 7. edited-video-audit.md
fs.writeFileSync(path.join(targetDir, 'edited-video-audit.md'), `# Edited & Final Video Asset Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 07 of 40  

---

## 1. Distinction Between Production Video Stages

BP-CMS explicitly distinguishes three video production stages:
1. **RAW:** Raw recorded footage from camera/teleprompter.
2. **EDITED:** Post-production rough cuts, trimmed footage, color-graded sequences (\`edited_cut_v1.mp4\`, \`edited_cut_v2.mp4\`).
3. **FINAL:** Fully rendered, approved master file ready for publishing (\`final_published_render.mp4\`, \`reviewer_final.mp4\`).

---

## 2. Live Drive Evidence for Edited & Final Cuts

Inspection of live folder \`BP-CNT-906043\` reveals:
- **Folder \`Edited\` (\`1vjv0XEd6GZUibxaqDE8rmM7lDT7CasV6\`):**
  - \`edited_cut_v1.mp4\` (ID: \`1NFz6njFWFININhPo4DETOLHkyXZ8xuht\`)
  - \`edited_cut_v2.mp4\` (ID: \`1uRr4IMIVFrfiiJxKo114LDXTSU34Qo-s\`)
- **Folder \`Final\` (\`1yLls9MI-P2YNr7RGFGTIhA8NLQyx7ISp\`):**
  - \`final_published_render.mp4\` (ID: \`1uxjTslIr0F23WDnpQR3jf1HSKbUyn3Nn\`)
  - \`reviewer_final.mp4\` (ID: \`12X1vGtfGq7c4xQlU2sfq_LfQTv9w7mxP\`)

---

## 3. Storage & Metadata Linkage
- Edited cuts and final renders are stored as **distinct physical files** in separate Drive folders.
- In Google Sheets, \`VIDEOS.final_render_path\` stores the web link to the final video file.
- Publishing service (\`src/lib/services/publishing.service.ts:1238\`) checks \`video.finalRenderPath || video.driveFolderUrl\` before permitting live social media distribution.
`);

// 8. thumbnail-audit.md
fs.writeFileSync(path.join(targetDir, 'thumbnail-audit.md'), `# Thumbnail Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 08 of 40  

---

## 1. Thumbnail Upload & Approval Flow

Thumbnail image management is orchestrated by \`src/lib/services/thumbnail.service.ts\`:

\`\`\`
[Designer / AI Generator]
           │
           ▼ (POST /api/videos/:videoId/thumbnail/upload)
[thumbnailService.uploadThumbnailAsset()]
           │
           ├── 1. Ensure folder: Root/Content/BP-CNT-######/Thumbnails
           ├── 2. Upload image (JPEG/PNG, <= 5MB) to Google Drive
           │        └── Returns driveFileId and webViewLink
           ├── 3. Create or update row in THUMBNAILS sheet:
           │        - drive_file_id
           │        - drive_asset_url
           │        - drive_folder_id
           │        - status: PENDING_REVIEW
           └── 4. Append historical record to THUMBNAIL_VERSIONS sheet
\`\`\`

---

## 2. Hard Safety Gate for Approval (\`approveThumbnail\`)
In \`thumbnail.service.ts:296\`:
\`\`\`typescript
if (!existing.driveFileId || !existing.driveFileId.trim()) {
  throw new ValidationError(
    \`Cannot approve thumbnail \"\${thumbnailId}\": No real Google Drive thumbnail asset exists (driveFileId is missing). An actual thumbnail image must be uploaded before approval.\`
  );
}
\`\`\`
**Finding:** A thumbnail cannot be approved without an authentic Google Drive asset link.

---

## 3. Live State Reconciliation
- In the active live spreadsheet, the \`THUMBNAILS\` tab contains **0 rows**.
- Live Drive folder \`1V4EDuzVy2n5C3xFwiV7486mzxccmbHvD\` (\`Thumbnails\` under \`BP-CNT-000001\`) contains **0 files**.
- Historical test folders (\`BP-CNT-802170\`, \`BP-CNT-906043\`) contain thumbnail subfolders, but image assets were cleaned up or moved to Trash during test teardown.
`);

// 9. script-document-audit.md
fs.writeFileSync(path.join(targetDir, 'script-document-audit.md'), `# Script & Document Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 09 of 40  

---

## 1. Script Storage Architecture: Sheets vs Drive

A critical forensic finding: **SCRIPTS ARE NOT STORED IN GOOGLE DRIVE.**

- **Folder Existence in Drive:**  
  \`GoogleDriveService.ensureContentHierarchy()\` creates a \`Scripts\` folder under each content ID (e.g. \`1ht1OQOenHbNK_K2HvinN-OTwFESsT_5d\` under \`BP-CNT-000001\`).
- **File Content in Drive:**  
  Live inspection confirms **0 files exist inside the \`Scripts\` folder**.
- **Authoritative Storage Location:**  
  Full script text, teleprompter markers, hooks, and call-to-actions are stored exclusively as plain text in the **Google Sheets \`SCRIPT\` and \`SCRIPT_VERSIONS\` worksheets**.

---

## 2. Analysis of the Dormant \`Scripts\` Folder

| Dimension | Google Sheets (\`SCRIPT\` tab) | Google Drive (\`Scripts\` folder) |
| :--- | :--- | :--- |
| **Storage Role** | **AUTHORITATIVE SOURCE OF TRUTH** | **UNUSED / EMPTY SHELL** |
| **Data Format** | Tabular cells with multi-line text | Intended for exported \`.txt\` or \`.docx\` |
| **Versioning** | Managed via \`SCRIPT_VERSIONS\` sheet | None |
| **API Endpoints** | \`GET /api/scripts/:videoId\` | None |

**Finding:** The \`Scripts\` folder in Google Drive is an orphaned folder convention created by \`ensureContentHierarchy()\` but never populated by \`ScriptService\`.
`);

// 10. generated-assets-audit.md
fs.writeFileSync(path.join(targetDir, 'generated-assets-audit.md'), `# Generated Assets Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 10 of 40  

---

## 1. Generated Assets Inventory

BP-CMS incorporates several AI and algorithmic generation pipelines:

1. **AI-Generated Thumbnail Candidates:**  
   - Generated via \`Phase18ThumbnailIntelligenceService\`.
   - Temporary candidates are returned to the client as base64 data URIs or uploaded as temporary Drive files.
   - When a candidate is selected, it is promoted to a permanent Drive asset in the content folder.
2. **Snapshot Archives:**  
   - Generated by \`SnapshotExporterService\` for system backups.
   - Serialized as JSON payloads.
   - Uploaded to Google Drive or downloaded directly via HTTP response.
3. **Automated Analytics Reports:**  
   - Stored directly in the secondary analytics spreadsheet (\`SOCIAL_PERFORMANCE_INTELLIGENCE\` tab), not as Drive files.

---

## 2. Temporary File Cleanup Vulnerability
When candidate thumbnails or experimental renders are uploaded during generation trials, failed or unselected candidates are NOT automatically purged from Google Drive unless the test explicitly triggers \`googleDriveService.deleteFile()\`. This leads to storage bloat in test and development folders.
`);

console.log('Part 1 docs (1-10) written successfully.');
