const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('./docs/audit/18-google-drive');

console.log('Writing Part 2 docs (11-20)...');

// 11. file-id-audit.md
fs.writeFileSync(path.join(targetDir, 'file-id-audit.md'), `# Drive File ID Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 11 of 40  

---

## 1. File Identifier Architecture

In BP-CMS, multiple ID schemes intersect when handling file assets:

| Identifier Type | Example Value | Generating System | Storage Location | Domain Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Google Drive File ID** | \`1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB\` | Google Drive API v3 | \`VIDEOS.drive_file_id\`, \`MEDIA_ASSETS.drive_file_id\` | Opaque 33-character alphanumeric Google resource pointer |
| **Media Asset ID** | \`MEDIA-000001-RAW-1\` | \`video.service.ts\` | \`MEDIA_ASSETS.id\` (PK) | Structured business identifier encoding Content ID, Stage, and Take |
| **Video Production ID** | \`BP-V-000001\` | \`SequencesRepository\` | \`VIDEOS.id\` (PK) | Canonical video production conveyor entity ID |
| **Content Master ID** | \`BP-CNT-000001\` | \`SequencesRepository\` | \`CONTENT_MASTERS.id\` (PK) | Canonical content umbrella ID determining Drive folder name |
| **Synthetic Test File ID**| \`fixed_drive_file_id_12345\` | Test Fixture | \`MEDIA_ASSETS\` (Rows 7-9) | Non-functional mock string injected during synthetic testing |

---

## 2. Field Name Aliasing & Drift
Across repositories and services, the Google Drive file ID is referenced under different property names:
- \`driveFileId\`: Canonical TypeScript property name across \`Video\`, \`MediaAsset\`, and \`Thumbnail\`.
- \`drive_file_id\`: Google Sheets column name in \`VIDEOS\`, \`MEDIA_ASSETS\`, and \`THUMBNAILS\`.
- \`fileId\`: Parameter name in \`google-drive.service.ts\` and \`media/download/:fileId\` API route.
- \`rawFootagePath\`: Legacy column in \`VIDEOS\` storing \`https://drive.google.com/file/d/{fileId}/view\`.
`);

// 12. file-metadata-audit.md
fs.writeFileSync(path.join(targetDir, 'file-metadata-audit.md'), `# File Metadata Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 12 of 40  

---

## 1. Metadata Field Distribution Matrix

Metadata describing stored files is distributed across Google Drive and Google Sheets:

| Metadata Field | Stored in Google Drive | Stored in Google Sheets | Authoritative Source | Synchronization Risk |
| :--- | :---: | :---: | :---: | :--- |
| **File ID** | ✅ Native (\`id\`) | ✅ Tabular Cell (\`drive_file_id\`) | Google Drive | High: Sheets cell can hold invalid/stale ID |
| **File Name** | ✅ Native (\`name\`) | ✅ Tabular Cell (\`file_name\`) | Google Sheets | Low: Drive name matches uploaded name |
| **MIME Type** | ✅ Native (\`mimeType\`)| ✅ Tabular Cell (\`mime_type\`) | Google Drive | Low: Validated on upload |
| **File Size (Bytes)**| ✅ Native (\`size\`) | ✅ Tabular Cell (\`file_size\`) | Google Drive | Low: Numeric byte count |
| **Creation Timestamp**| ✅ Native (\`createdTime\`)| ✅ Tabular Cell (\`created_at\`) | Google Drive | Medium: Drive createdTime vs client clock |
| **Drive Folder ID** | ✅ Native (\`parents\`)| ✅ Tabular Cell (\`drive_folder_id\`)| Google Drive | High: If file moved in Drive UI, Sheet is desynced |
| **Web View URL** | ✅ Computed | ✅ Tabular Cell (\`drive_folder_url\`)| Google Drive | Low: Deterministic format |
| **Media Stage** | ❌ None | ✅ Tabular Cell (\`media_stage\`) | Google Sheets | Sole source: Drive has no stage metadata |
| **Take / Version** | ❌ None | ✅ Tabular Cell (\`version\`) | Google Sheets | Sole source: Monotonic integer |
| **Associated Content ID**| ❌ (Only folder name) | ✅ Tabular Cell (\`content_id\`) | Google Sheets | Sole source: Tabular foreign key |

---

## 2. Forensic Finding on Metadata Divergence
Google Drive does NOT use custom file properties (\`appProperties\` or \`properties\`) to store BP-CMS business metadata. All business context (Content ID, Take Version, Stage, Approval Status) exists **exclusively in Google Sheets**. If a file is orphaned in Drive, its business context is completely lost.
`);

// 13. entity-file-relationships.md
fs.writeFileSync(path.join(targetDir, 'entity-file-relationships.md'), `# Entity ↔ File Relationship Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 13 of 40  

---

## 1. Cardinality & Association Map

| Application Entity | Drive File Asset | Cardinality | Association Mechanism | Cascade Behavior on Entity Delete |
| :--- | :--- | :---: | :--- | :--- |
| **ContentMaster** (\`BP-CNT-######\`) | Drive Folder Hierarchy | 1 : 1 (Folder) | Folder named with Content ID | Deletion safety service prevents folder removal |
| **Video** (\`BP-V-######\`) | Active Master Video File | 1 : 1 (Active) | \`VIDEOS.drive_file_id\` pointer | Manual cleanup; no automatic Drive cascade |
| **Video** (\`BP-V-######\`) | Raw Recorded Takes | 1 : N (Takes) | Linked via \`MEDIA_ASSETS.content_id\` | Historical takes retained in Drive |
| **Video** (\`BP-V-######\`) | Edited Cut Sequences | 1 : N (Cuts) | Stored in \`Edited/\` folder | Historical cuts retained in Drive |
| **Thumbnail** (\`BP-THM-######\`) | Active Thumbnail Image | 1 : 1 (Active) | \`THUMBNAILS.drive_file_id\` | Replaced file retained as version |
| **Thumbnail** (\`BP-THM-######\`) | Revision Iterations | 1 : N (Revisions)| Linked via \`THUMBNAIL_VERSIONS\` | Previous images remain in Drive |
| **Script** (\`BP-SCR-######\`) | Drive Document | 1 : 0 (No file) | **NONE:** Scripts stored in Sheets text | N/A |
| **Question** (\`BP-Q-######\`) | Drive File | 1 : 0 (No file) | Linked indirectly via Video | N/A |

---

## 2. Active Pointer vs Historical Archive Model
BP-CMS implements an **Active Pointer Model**:
- The \`VIDEOS\` sheet stores only the **active/latest** Drive file ID in \`driveFileId\`.
- All historical takes are archived in the \`MEDIA_ASSETS\` sheet and reside permanently in the Drive \`Videos\` folder.
- Selecting an older take updates the pointer in \`VIDEOS.driveFileId\` without modifying Drive files.
`);

// 14. file-reference-audit.md
fs.writeFileSync(path.join(targetDir, 'file-reference-audit.md'), `# File Reference Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 14 of 40  

---

## 1. Drive File References Across Codebase

A complete audit of code references to \`driveFileId\` was performed across repositories, services, routes, and UI components:

| Location / File | Context | How Drive Reference is Consumed |
| :--- | :--- | :--- |
| \`src/lib/services/video.service.ts:895\` | Video Upload | Saves newly minted \`driveFile.fileId\` to \`mediaAsset\` and \`video\` records |
| \`src/lib/services/thumbnail.service.ts:264\` | Thumbnail Download | Invokes \`googleDriveService.downloadFile(thumb.driveFileId)\` to serve image |
| \`src/lib/services/thumbnail.service.ts:296\` | Thumbnail Approval | Verifies \`driveFileId\` is non-empty before permitting approval |
| \`src/lib/services/publishing.service.ts:249\` | Publishing Blocker Check | Blocks publishing if \`video.driveFileId\` is missing or empty |
| \`src/lib/services/publishing.service.ts:1788\`| Distribution Packaging | Packages \`video.driveFileId\` for multi-platform uploader integration |
| \`src/server/routes.ts:1728\` | Video Download Route | Passes \`video.driveFileId\` to \`googleDriveService.downloadFile()\` |
| \`src/server/routes.ts:1759\` | Video Stream Route | Passes \`video.driveFileId\` and \`Range\` header for browser streaming |
| \`src/server/routes.ts:6002\` | Generic Media Download | Downloads any file via \`GET /api/media/download/:fileId\` |
| \`src/components/production/VideoPlayer.tsx\` | Frontend Playback | Sets video source to \`/api/videos/\${video.id}/stream\` |

---

## 2. Reference Integrity Risks
- If a user deletes a file directly in the Google Drive web UI, all references in \`VIDEOS\`, \`MEDIA_ASSETS\`, and \`THUMBNAILS\` immediately become broken pointers.
- Attempting to stream or download returns HTTP 404 or Google API \`File not found\`.
`);

// 15. sheets-drive-reconciliation.md
fs.writeFileSync(path.join(targetDir, 'sheets-drive-reconciliation.md'), `# Google Sheets ↔ Google Drive Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 15 of 40  

---

## 1. Live Reconciliation Audit Results

A direct reconciliation between live Google Sheets records and live Google Drive files was executed on **2026-09-29**:

| Sheet Entity & ID | Stored \`driveFileId\` in Sheet | Live Google Drive File State | Reconciliation Classification |
| :--- | :--- | :--- | :---: |
| **MediaAsset:** \`MEDIA-000001-RAW-1\` | \`1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB\` | **EXISTS** (\`vd1.1.mp4\`, 2.65MB, inside \`Videos\` folder) | **PERFECT MATCH** |
| **MediaAsset:** \`MEDIA-000001-RAW-2\` | \`1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK\` | **EXISTS** (\`vd1.2.mp4\`, 2.68MB, inside \`Videos\` folder) | **PERFECT MATCH** |
| **Video:** \`BP-V-000001\` | \`1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK\` | **EXISTS** (Matches Take 2 file) | **PERFECT MATCH** |
| **Video:** \`BP-V-372937\` | \`undefined\` (empty cell) | ❌ **NO FILE ATTACHED** | **ENTITY WITHOUT DRIVE ASSET** |
| **MediaAsset:** \`MEDIA-172872-RAW-1\` | \`1La1zcgjPW7whpuCo3fp2qJrNqIx2rb-p\` | In Trash / Cleaned up | **DANGLING REFERENCE** |
| **MediaAsset:** \`MEDIA-172872-RAW-2\` | \`1_BHViPhsSObQtX-Wnwoy1tpRvjvWYdV4\` | In Trash / Cleaned up | **DANGLING REFERENCE** |
| **MediaAsset:** \`MEDIA-731056-RAW-1\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **MediaAsset:** \`MEDIA-561774-RAW-1\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **MediaAsset:** \`MEDIA-743611-RAW-1\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** \`BP-V-731056\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** \`BP-V-561774\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** \`BP-V-743611\` | \`fixed_drive_file_id_12345\` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |

---

## 2. Reconciliation Summary
- **Live Valid Assets:** 2 files in \`BP-CNT-000001\` perfectly match between Google Sheets and Google Drive.
- **Synthetic Contamination:** 3 video records and 3 media asset records contain \`fixed_drive_file_id_12345\` from automated test seeders.
- **Orphan Entities:** 1 video entity has no Drive file attached.
`);

// 16. database-drive-reconciliation.md
fs.writeFileSync(path.join(targetDir, 'database-drive-reconciliation.md'), `# Database ↔ Google Drive Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 16 of 40  

---

## 1. Database Tier Status vs Google Drive

As established in Step 17:
- **Relational SQL Database:** **0 SQL databases exist.**
- **Persistence Store:** Google Sheets is the tabular database.

Therefore:
- There is **no secondary relational SQL database** holding competing Drive file pointers.
- Google Sheets is the sole registry of Drive file IDs.
- If Google Sheets row data is lost, all relational mappings to Google Drive binary assets are destroyed.
`);

// 17. drive-source-of-truth.md
fs.writeFileSync(path.join(targetDir, 'drive-source-of-truth.md'), `# Storage Source-of-Truth Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 17 of 40  

---

## 1. Dual-Tier Source of Truth Architecture

BP-CMS divides its Source of Truth across two cloud storage tiers:

\`\`\`
┌────────────────────────────────────────────────────────┐
│                   BURRA PARIKSHA CMS                   │
├──────────────────────────┬─────────────────────────────┤
│   TABULAR PERSISTENCE    │      BINARY ASSET STORE     │
│      (Google Sheets)     │       (Google Drive)        │
├──────────────────────────┼─────────────────────────────┤
│ - Canonical Entity IDs   │ - Actual Video Bitstreams   │
│ - Conveyor Stage States  │ - Real Audio Tracks         │
│ - Script Text & Prompter │ - High-Res Thumbnail Images │
│ - User RBAC & Roles      │ - Master Final MP4 Renders  │
│ - Audit Event Logs       │                             │
│ - Monotonic Version #s   │                             │
└──────────────────────────┴─────────────────────────────┘
\`\`\`

---

## 2. Authority Rules
1. **Binary Content:** Google Drive is **AUTHORITATIVE**. The actual pixels and audio frequencies exist only in Drive.
2. **Entity Metadata:** Google Sheets is **AUTHORITATIVE**. The production status, title, assigned editor, and quality approval state exist only in Sheets.
3. **Linkage Mechanism:** The string \`driveFileId\` is the sole foreign key connecting the two systems.
`);

// 18. upload-paths.md
fs.writeFileSync(path.join(targetDir, 'upload-paths.md'), `# Upload Path Execution Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 18 of 40  

---

## 1. Multipart Streaming Upload Pipeline

All file uploads enter through Express routes using \`busboy\` multipart streaming:

\`\`\`
1. Client POST /api/videos/:id/upload (multipart/form-data)
2. Express Route Auth Guard: requireRole([ADMIN, CONTENT_MANAGER, VIDEO_EDITOR])
3. busboy parser receives stream chunks -> buffers in memory (chunks.push)
4. busboy 'finish' event triggers videoService.uploadVideoAsset()
5. Filename sanitization & MIME allowlist verification
6. googleDriveService.ensureContentHierarchy() resolves folder ID
7. googleDriveService.uploadFile() executes drive.files.create()
8. videosRepository.update() persists driveFileId to Google Sheets
9. Response 201 Created returned to client with updated Video entity
\`\`\`

---

## 2. Memory Buffering Risk on Large Video Uploads
In \`src/server/routes.ts:1659\`:
\`\`\`typescript
const chunks: Buffer[] = [];
fileStream.on('data', (chunk) => {
  chunks.push(chunk);
  fileSize += chunk.length;
});
\`\`\`
**Vulnerability:** The entire video file is buffered into V8 process memory before being piped to Google Drive. A concurrent upload of five 100MB videos consumes 500MB of Node.js RAM, risking container Out-Of-Memory (OOM) termination on Google Cloud Run.
`);

// 19. retrieval-paths.md
fs.writeFileSync(path.join(targetDir, 'retrieval-paths.md'), `# Retrieval Path Execution Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 19 of 40  

---

## 1. Media Asset Retrieval Architecture

BP-CMS provides two distinct retrieval mechanisms:

### 1. Authenticated Backend Proxy Stream (Primary)
- **Routes:**
  - \`GET /api/videos/:id/stream\` (Streaming video with HTTP Range)
  - \`GET /api/videos/:id/download\` (Attachment download)
  - \`GET /api/thumbnails/:id/download\` (Thumbnail download)
  - \`GET /api/media/download/:fileId\` (Generic asset download)
- **Execution:** Backend validates user session via \`requireAuth\`, verifies object permission via \`objectAuthService\`, fetches binary stream from Drive API, and pipes chunks directly to Express \`res\`.

### 2. Direct Google Drive Web Links (Secondary)
- **Fields:** \`driveFolderUrl\`, \`webViewLink\`, \`rawFootagePath\`.
- **Format:** \`https://drive.google.com/file/d/{fileId}/view\`.
- **Behavior:** Redirects user to Google Drive UI. Requires the user to be logged into a Google account with Drive permissions.
`);

// 20. download-playback.md
fs.writeFileSync(path.join(targetDir, 'download-playback.md'), `# Download & Playback Architecture Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 20 of 40  

---

## 1. HTTP Range (206 Partial Content) Streaming

In \`src/server/routes.ts:1751\` and \`src/lib/services/google-drive.service.ts:600\`:

\`\`\`typescript
// Client sends Range: bytes=0-1048575
const rangeHeader = req.headers.range;
const download = await googleDriveService.downloadFile(video.driveFileId, rangeHeader);

res.status(download.statusCode || 206);
res.setHeader('Content-Type', 'video/mp4');
res.setHeader('Accept-Ranges', 'bytes');
res.setHeader('Content-Range', download.contentRange);
download.stream.pipe(res);
\`\`\`

---

## 2. Browser Playback Compatibility
- **HTML5 Video Player:** The frontend \`<video>\` element streams directly from \`/api/videos/:id/stream\`.
- **Seeking Support:** Because the backend forwards HTTP Range headers to Google Drive, users can seek forward/backward in the video player without downloading the entire file.
- **Access Control:** Playback requires a valid \`ais_session\` cookie or Bearer token; unauthenticated requests are rejected with HTTP 401.
`);

console.log('Part 2 docs (11-20) written successfully.');
