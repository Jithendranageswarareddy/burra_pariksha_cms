# Feature Contract: FEAT-04 Audio Narration & Voiceover Processing

**Feature ID:** `FEAT-04`  
**Feature Name:** Audio Narration & Voiceover Processing  
**Workflow Steps:** Step 05 (Audio Generation/Recording) & Step 06 (Audio Quality Check)  
**Primary Hub:** Media Lab (`/media/audio`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Generate crystal-clear Telugu voiceover audio or process human studio recordings, verifying phonetic pronunciation, background noise levels, and synchronization markers.
- **Goal:** Ingest narration tracks into Google Drive active binary store with SHA-256 integrity verification and Firestore metadata links.

### 2. Business Acceptance Criteria
- Support multi-take audio ingestion with duration matching script boundaries ($\pm 2.0$ seconds tolerance).
- Google Drive file creation with cryptographic SHA-256 checksum recorded in Firestore.
- Step 06 Human QC sign-off required before moving to video rendering.

### 3. Domain Entities
- `AudioTrackEntity`, `AudioTake`, `MediaAssetRecord`, `Sha256Checksum`, `AudioQcInspection`.

### 4. Database Persistence
- **Collection:** `audio_assets`, `media_assets`
- **Keys:** `audioId` (UUID v4), `scriptId`, `driveFileId`
- **Indexes:** `scriptId + isSelected`, `sha256Hash` (unique)
- **Concurrency:** OCC `version` increment.

### 5. API Contract
- **Upload Path:** `POST /api/v1/audio/upload`
- **QC Path:** `POST /api/v1/audio/:id/qc`
- **Envelope:** `ApiResponseEnvelope<AudioAssetResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Media Lab (`/media/audio`)
- **Layout:** Audio Waveform visualizer, multi-take selector, pitch/speed adjustment, and QC approval checklist.

### 7. RBAC & Access Control
- **Required Capability:** `media:audio`
- **Allowed Roles:** `VOICE_ARTIST`, `AUDIO_ENGINEER`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 04 (Script Polished) $\to$ Step 05 (Audio Generated/Recorded) $\to$ Step 06 (Audio QC Passed)
- **Initial Status:** `AUDIO_PENDING`
- **Target Status:** `AUDIO_APPROVED` (Proceeds to Step 07/09)
- **Human Gate:** Mandatory Human Gate at Step 06.

### 9. Validation Schemas
- **Schema:** `AudioUploadSchema`, `AudioQcSchema` (Zod)
- **Rules:** Format in (`audio/mpeg`, `audio/wav`, `audio/aac`), file size $\le 25\text{MB}$, duration 15–90s.

### 10. Error Handling & Codes
- `ERR_AUDIO_CORRUPTED` (422 Unprocessable Entity)
- `ERR_DRIVE_STORAGE_FAILED` (502 Bad Gateway)
- `ERR_SHA256_MISMATCH` (409 Conflict)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_AUDIO_UPLOADED`, `AUDIT_AUDIO_QC_APPROVED`
- **Severity:** `INFO`
- **Payload:** Audio ID, Drive File ID, SHA-256 Hash, Duration, Engineer ID.

### 12. Realtime SSE Events
- **Topic:** `audio.processed`
- **Payload:** `{ audioId, scriptId, status: "AUDIO_APPROVED", durationSeconds: 48 }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including Drive quota exhaustion and audio hash verification.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, Google Drive API v3, Firestore Native mode.

### 15. Rollback Safety Net
- Soft delete drive file reference, revert audio selection to previous take, reset state to `AUDIO_PENDING`.
