# FEATURE CONTRACT: FC-012-FINAL-QC-REVIEW-GATE

## 1. Feature Identity
- **Feature ID**: FC-012
- **Feature Name**: Final QC Review Gate with Safe-Zone Validation
- **Business Area**: Quality Assurance / Technical & Content QC
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Quality Control Context
- **Related Workflow Stage(s)**: Step 07 (Final QC)

---

## 2. Requirement
- **Business Requirement**: BR-006 (Video QC Verification) & NFR-004 (Anti-Self-Approval GAR-02 Rule).
- **User Problem**: Releasing videos with audio clipping, out-of-sync captions, mobile safe-zone violations (text covered by YouTube UI), or factual slips damages channel reputation and viewer trust.
- **Business Purpose**: Provide a rigorous, backend-enforced Quality Control workspace where independent QC controllers inspect rendered master videos against technical and editorial criteria, enforce GAR-02 anti-self-approval, and attach timestamped defect annotations.
- **Expected Capability**:
  - QC Inspection Workspace (`/qc/:videoId`) with frame-accurate 9:16 playback and safe-zone overlay.
  - 5-Point Mandatory QC Checklist:
    1. Audio clarity & normalization ($-14\text{LUFS}$).
    2. Video resolution & frame rate (1080×1920 @ 30/60fps).
    3. 9:16 Safe-Zone compliance (no text in bottom 25% or right 15%).
    4. Audio/visual synchronization.
    5. Syllabus & factual fidelity against original question.
  - Timestamped defect logging with category and screenshot annotations.
  - Strict GAR-02 enforcement: Editor who rendered the video cannot approve it.
  - Workflow transition: `APPROVE` $\to$ Step 08 (`T_READY`); `REJECT` $\to$ Step 06 (`E_REVISE`).
- **Scope**: QC checklist submission, timestamped defect logging, GAR-02 enforcement, workflow progression.
- **Explicit Non-Scope**: Video re-rendering (FC-011), thumbnail generation (FC-013).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Independent QC controller reviews video, checks all 5 mandatory items, enters approval notes, and clicks `APPROVE`.
  - Item transitions to Step 08 with `workflowStatus = QC_APPROVED`.
- **Rejection Acceptance**:
  - Controller clicks `REJECT`, adds timestamped defect markers (e.g. `00:14 - Caption obscured by Shorts like button`), and submits.
  - Item transitions back to Step 06 with `workflowStatus = QC_REJECTED`. Editor receives notification with defect list.
- **GAR-02 Anti-Self-Approval Acceptance**:
  - Video editor attempting to approve their own render receives HTTP 403 `SELF_APPROVAL_FORBIDDEN`.
- **Validation Acceptance**:
  - Submitting approval with unchecked mandatory checklist items returns HTTP 400 `CHECKLIST_INCOMPLETE`.
- **Audit Acceptance**:
  - `FINAL_QC_APPROVED` or `FINAL_QC_REJECTED` logged with `reviewerId`, `editorId`, and defect counts.

---

## 4. Domain Entities
- **Entities Involved**: `Video`, `VideoQcReview`, `QcChecklistItem`, `QcDefectMarker`.
- **Entity Ownership**: Quality Assurance Bounded Context.
- **Relationships**: A `Video` entity has zero or more `VideoQcReview` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `videoId`, `reviewerId`, `decision`, `checklistResults`, `defectMarkers`, `createdAt`.
- **Mutable Fields**: None (Append-only review ledger).
- **Lifecycle**: `Recorded`.

---

## 5. Database / Data Contract
- **Collections Involved**: `video_qc_reviews`, `videos`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface VideoQcReviewDocument extends BaseEntity {
    id: string; // qcr_ + UUIDv4
    videoId: string;
    reviewerId: string;
    editorId: string;
    decision: 'APPROVE' | 'REJECT';
    checklist: {
      audioClarity: boolean;
      videoQuality: boolean;
      safeZoneCompliance: boolean;
      avSync: boolean;
      factualFidelity: boolean;
    };
    defectMarkers: Array<{
      timestampSeconds: number;
      category: 'SAFE_ZONE' | 'AUDIO_GLITCH' | 'SPELLING_CAPTION' | 'VISUAL_DEFECT';
      notes: string;
    }>;
    generalComments: string;
    createdAt: string;
  }
  ```
- **Indexes**: Composite index on `(videoId, createdAt DESC)`.
- **Source of Truth**: Firestore `video_qc_reviews` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/videos/:id/qc-reviews`
- **Authentication**: Required.
- **Required Capability**: `VIDEO_QC_VERIFY`.
- **Request Schema**:
  ```typescript
  {
    decision: z.enum(['APPROVE', 'REJECT']),
    checklist: z.object({
      audioClarity: z.boolean(),
      videoQuality: z.boolean(),
      safeZoneCompliance: z.boolean(),
      avSync: z.boolean(),
      factualFidelity: z.boolean(),
    }),
    defectMarkers: z.array(z.object({
      timestampSeconds: z.number().nonnegative(),
      category: z.enum(['SAFE_ZONE', 'AUDIO_GLITCH', 'SPELLING_CAPTION', 'VISUAL_DEFECT']),
      notes: z.string().min(5),
    })).default([]),
    generalComments: z.string().min(10),
    expectedVersion: z.number().int().positive()
  }
  ```
- **Business Rule (GAR-02)**: Asserts `req.user.id !== video.editorId`.
- **Response Schema**: `ApiResponseEnvelope<{ review: VideoQcReviewDocument, nextStep: number }>`.
- **Error Codes**: `400 CHECKLIST_INCOMPLETE`, `403 SELF_APPROVAL_FORBIDDEN`, `409 CONCURRENCY_CONFLICT`.

### 6.2 `GET /api/v1/videos/:id/qc-reviews`
- **Authentication**: Required.
- **Required Capability**: `VIDEO_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ reviews: VideoQcReviewDocument[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/qc` (QC Queue), `/qc/:videoId` (QC Workspace).
- **Allowed Roles / Capabilities**: `QualityController`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - 9:16 Video Player with timeline scrubber featuring red marker pins at defect timestamps.
  - Interactive "Add Defect Marker at Current Timestamp" button.
  - 5-item checklist with mandatory verification switches.
  - Persistent GAR-02 banner if editor views their own video in the QC queue.

---

## 8. RBAC / Capability Contract
- **Capability Required**: `VIDEO_QC_VERIFY`.
- **GAR-02 Constraint**: Video editor cannot approve their own video render.

---

## 9. Workflow Contract
- **Step 07 Entry**: Master video submitted in Step 06 (`QC_PENDING`).
- **Step 07 Exit**:
  - `APPROVE` $\to$ Step 08 (`T_READY`).
  - `REJECT` $\to$ Step 06 (`E_REVISE`).

---

## 10. Validation Contract
- **Checklist Enforcement**: If `decision === 'APPROVE'`, all 5 checklist booleans must be `true`.
- **Rejection Marker Enforcement**: If `decision === 'REJECT'`, at least one defect marker or general comment $\ge 20$ chars is mandatory.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Checklist incomplete on approval attempt.
- `403 FORBIDDEN`: Attempted self-approval or missing QC capability.
- `409 CONFLICT`: Video updated concurrently.
- `422 UNPROCESSABLE_ENTITY`: Video not in `QC_PENDING` state.

---

## 12. Audit Contract
- **Events**: `FINAL_QC_APPROVED`, `FINAL_QC_REJECTED`, `GAR02_QC_VIOLATION_ATTEMPT`.
- **Payload**: `videoId`, `reviewerId`, `editorId`, `decision`, `defectCount`.

---

## 13. Realtime Contract
- **SSE Event**: `video.qc_completed` broadcast to editor and publishing team.

---

## 14. Job / Async Contract
- **Async Execution**: Synchronous review submission. Real-time notification dispatched asynchronously.

---

## 15. AI Contract
- **Automated Defect Detection**: Optional integration with Gemini 2.5 Flash video inspection to pre-flag potential safe-zone text overlaps. AI findings appear as suggestions; human QC controller must verify.

---

## 16. Media Contract
- **Applicable**: Review operates on the approved Master `MediaAsset`.

---

## 17. Analytics Contract
- **Metrics**: First-pass QC approval rate, defect category breakdown.

---

## 18. Security Contract
- **Tamper Resistance**: QC review records are immutable append-only documents.

---

## 19. Observability Contract
- **Metrics**: Counter `qc.reviews_total{decision, category}`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore operations within Spark tier.

---

## 21. Migration Contract
- **Legacy Parity**: Historical published videos seeded with initial passing QC review records.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-QC-01`: Approval fails if any of the 5 checklist items are false.
  - `TC-QC-02`: GAR-02 blocks approval when `reviewerId === editorId`.
  - `TC-QC-03`: Rejection transitions item back to Step 06.
- **API Tests**:
  - `TC-QC-04`: `POST /api/v1/videos/:id/qc-reviews` enforces capability and outputs envelope.
  - `TC-QC-05`: Rejection with timestamped markers records correctly.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-011.
- **Stage 25 Node**: `D-07 (Reviews / GAR-02)`, `D-10 (Videos)`.
- **Downstream Consumers**: FC-013 (Thumbnails), FC-014 (Social Review).

---

## 24. Implementation Sequence
1. Define QC review schemas (`src/types/qc.ts`).
2. Implement `VideoQcReviewRepository` and route handlers.
3. Build React QC Review Workspace with timestamped defect pins (`src/pages/qc/`).
4. Verify against `TC-QC-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] 5-point QC checklist enforced in both UI and backend API.
- [ ] GAR-02 anti-self-approval rule verified.
- [ ] Timestamped defect markers render on player scrubber.
- [ ] Transition to Step 08 on approval verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 02, 07, 09, and 19.

---

## 29. Traceability
- **Stage 01**: BR-006, NFR-004
- **Stage 02**: DAC-006
- **Stage 07**: Step 07 Specification
- **Stage 09**: GAR-02 Rule Invariant
- **Stage 10**: QC Workspace Architecture
- **Stage 13**: `video_qc_reviews` schema
- **Stage 15**: `/api/v1/videos/:id/qc-reviews`
- **Stage 24**: TC-WF07-01..09
- **Stage 25**: Nodes `D-07`, `D-10`
