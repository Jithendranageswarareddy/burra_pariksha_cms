# FEATURE CONTRACT: FC-011-EDITING-BAY-TIMELINE

## 1. Feature Identity
- **Feature ID**: FC-011
- **Feature Name**: Editing Bay & 9:16 Timeline
- **Business Area**: Video Production / Editing & Assembly
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Video Production Context
- **Related Workflow Stage(s)**: Step 06 (Editing Bay)

---

## 2. Requirement
- **Business Requirement**: BR-006 (Short-Form Video Production & Mobile Safe-Zone Formatting).
- **User Problem**: Video editors lack standardized tracking for trim points, on-screen text callouts, captions, and edited master file delivery, causing discrepancies between script and final render.
- **Business Purpose**: Provide an editing management console where video editors view the script and raw takes, maintain timeline cut notes, verify 9:16 aspect ratio compliance, and submit final edited masters for Quality Control.
- **Expected Capability**:
  - Editing Bay Workspace (`/editing/:videoId`).
  - Timeline Manifest tracking trim in/out timestamps, caption tracks, and visual asset callouts.
  - 9:16 vertical video player with mobile UI safe-zone guides (YouTube Shorts & Instagram Reels overlays).
  - Edited master video upload ticket generation and checksum linking.
  - Automatic workflow transition to Step 07 (`QC_PENDING`) upon master upload.
- **Scope**: Editing workspace, timeline state persistence, safe-zone viewer, master upload ticket.
- **Explicit Non-Scope**: Server-side video transcoding (handled in external editor / optional cloud job).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Video editor loads raw take into Editing Bay, records trim points and caption notes, and uploads finished 1080×1920 MP4 master.
  - Master video checksum verified; `mediaStatus` marked `READY`.
  - Item transitions to Step 07 with `workflowStatus = QC_PENDING`.
- **Safe-Zone Validation Acceptance**:
  - Frontend player renders interactive toggle overlaying YouTube Shorts buttons (Like, Comment, Title area) to ensure captions aren't obscured.
- **Authorization Acceptance**:
  - Requires `VIDEO_EDIT` capability.
- **Concurrency Acceptance**:
  - Updates to timeline manifest require OCC version checking.
- **Audit Acceptance**:
  - `EDITING_TIMELINE_SAVED` and `EDITED_MASTER_SUBMITTED` events recorded.

---

## 4. Domain Entities
- **Entities Involved**: `Video`, `EditingTimelineManifest`, `MediaReference`.
- **Entity Ownership**: Video Domain Context.
- **Relationships**: A `Video` entity owns an `EditingTimelineManifest` and references the edited master `MediaAsset`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `videoId`, `createdAt`.
- **Mutable Fields**: `trimStartSeconds`, `trimEndSeconds`, `captionStatus`, `editorNotes`, `masterMediaAssetId`.
- **Lifecycle**: `E_IN_PROGRESS` $\to$ `E_RENDERED` $\to$ `QC_PENDING`.

---

## 5. Database / Data Contract
- **Collections Involved**: `videos`, `editing_manifests`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface EditingManifestDocument extends BaseEntity {
    id: string; // edm_ + UUIDv4
    videoId: string;
    editorId: string;
    trimStartSeconds: number;
    trimEndSeconds: number;
    aspectRatio: '9:16';
    resolution: '1080x1920';
    captionsLanguage: 'te' | 'en' | 'te-IN';
    masterMediaAssetId?: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(videoId, createdAt DESC)`.
- **Source of Truth**: Firestore `editing_manifests` collection.

---

## 6. API Contract
### 6.1 `PUT /api/v1/videos/:id/editor-state`
- **Authentication**: Required.
- **Required Capability**: `VIDEO_EDIT`.
- **Request Schema**:
  ```typescript
  {
    trimStartSeconds: z.number().nonnegative(),
    trimEndSeconds: z.number().positive(),
    captionsLanguage: z.string(),
    notes: z.string().optional(),
    expectedVersion: z.number().int().positive()
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ manifest: EditingManifestDocument }>`.

### 6.2 `POST /api/v1/videos/:id/submit-master`
- **Authentication**: Required.
- **Required Capability**: `VIDEO_EDIT`.
- **Request Schema**: `{ masterMediaAssetId: string }`.
- **Response Schema**: `ApiResponseEnvelope<{ video: VideoDocument, nextStep: 7 }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/editing` (Bay Hub), `/editing/:videoId` (Editor Workspace).
- **Allowed Roles / Capabilities**: `VideoEditor`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Left panel: Script and teleprompter cues.
  - Center panel: 9:16 vertical video player with semi-transparent overlay toggle for YouTube Shorts and Instagram Reels UI elements.
  - Right panel: Trim controls, caption status, and Master Video Upload drop zone.

---

## 8. RBAC / Capability Contract
- **`VIDEO_EDIT`**: Authorizes modifying editing timeline and submitting master renders.

---

## 9. Workflow Contract
- **Step 06 Entry**: Raw video uploaded in Step 05 (`RAW_VIDEO_INGESTED`).
- **Step 06 Exit**: Master render uploaded $\to$ Workflow transitions item to Step 07 (`QC_PENDING`).

---

## 10. Validation Contract
- **Aspect Ratio**: Must be 9:16 (vertical).
- **Duration Check**: Final trimmed duration must be between 30 and 60 seconds for Shorts eligibility.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Trim end seconds $\le$ trim start seconds.
- `409 CONFLICT`: Version mismatch on editor state save.
- `422 UNPROCESSABLE_ENTITY`: Master media asset not verified or missing.

---

## 12. Audit Contract
- **Events**: `EDITING_TIMELINE_SAVED`, `EDITED_MASTER_SUBMITTED`.
- **Payload**: `videoId`, `editorId`, `duration`, `masterMediaAssetId`.

---

## 13. Realtime Contract
- **SSE Event**: `video.master_submitted` broadcast to Quality Control team.

---

## 14. Job / Async Contract
- **Async Execution**: Optional automated proxy generation or caption transcribing worker via Cloud Tasks.

---

## 15. AI Contract
- **Automated Captions**: Optional integration with Gemini audio-to-text API for generating bilingual SRT/VTT caption files for the editor.

---

## 16. Media Contract
- **Master Storage**: Edited masters stored in Google Drive `/Masters` folder via FC-010 upload ticket.

---

## 17. Analytics Contract
- **Metrics**: Average editing turnaround hours per video.

---

## 18. Security Contract
- **Authorization**: Only assigned editor or Admin can submit final master.

---

## 19. Observability Contract
- **Logs**: Structured logs recording editing timeline revisions and master submission.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore operations within Spark tier.

---

## 21. Migration Contract
- **Legacy Parity**: Legacy video links in Google Sheets mapped to `masterMediaAssetId`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-EDT-01`: Safe-zone calculations verify caption placement bounds.
  - `TC-EDT-02`: Trim duration validation enforces 30–60 second boundary.
- **API Tests**:
  - `TC-EDT-03`: `PUT /api/v1/videos/:id/editor-state` updates manifest with OCC check.
  - `TC-EDT-04`: `POST /api/v1/videos/:id/submit-master` transitions to Step 07.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-008, FC-010.
- **Stage 25 Node**: `D-10 (Videos)`, `D-13 (Media References)`.
- **Downstream Consumers**: FC-012 (Final QC Review Gate).

---

## 24. Implementation Sequence
1. Define `EditingManifest` schemas (`src/types/editing.ts`).
2. Implement `EditingManifestRepository` and route handlers.
3. Build React 9:16 Video Player with SVG safe-zone overlay (`src/components/video/SafeZonePlayer.tsx`).
4. Build Editing Bay Workspace UI.
5. Verify against `TC-EDT-01..04`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] 9:16 video player renders with toggleable mobile safe-zone overlay.
- [ ] Timeline manifest persists trim points and notes.
- [ ] Master video upload verified and linked to video entity.
- [ ] Transition to Step 07 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 14.

---

## 29. Traceability
- **Stage 01**: BR-006
- **Stage 02**: DAC-006
- **Stage 07**: Step 06 Specification
- **Stage 10**: Editing Bay Hub
- **Stage 13**: `editing_manifests` schema
- **Stage 15**: `/api/v1/videos/:id/editor-state`
- **Stage 24**: TC-WF06-01..09
- **Stage 25**: Nodes `D-10`, `D-13`
