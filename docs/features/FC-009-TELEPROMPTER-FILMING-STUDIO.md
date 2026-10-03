# FEATURE CONTRACT: FC-009-TELEPROMPTER-FILMING-STUDIO

## 1. Feature Identity
- **Feature ID**: FC-009
- **Feature Name**: Teleprompter & Filming Studio
- **Business Area**: Studio Production / Teleprompter & Filming
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Studio Operations Context
- **Related Workflow Stage(s)**: Step 04 (Teleprompter & Filming)

---

## 2. Requirement
- **Business Requirement**: BR-004 (Teleprompter Operations & Studio Logging).
- **User Problem**: Presenters currently read scripts from printed paper or static spreadsheets, leading to inconsistent pacing, camera eye-line misalignment, and lack of take metadata for editors.
- **Business Purpose**: Provide a dedicated, high-performance web-based teleprompter with mirrored display capabilities, adjustable scroll speeds, eye-line guide markers, and a real-time filming take logging console.
- **Expected Capability**:
  - Fullscreen teleprompter view (`/prompter/:scriptId`).
  - Hardware mirror toggle (horizontal flip for glass beam-splitters).
  - Variable scroll speed (WPM control via keyboard arrows, mouse wheel, or Bluetooth remote).
  - Font scaling, high-contrast dark theme, and eye-line indicator line.
  - In-studio take logger recording take number, duration, presenter notes, and "Best Take" flag.
  - Workflow progression to Step 05 (`F_COMPLETED`).
- **Scope**: Prompter rendering, hardware mirror mode, keyboard shortcut navigation, take logging.
- **Explicit Non-Scope**: Video file upload (FC-010), video editing (FC-011).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Presenter opens verified script in prompter mode; script scrolls smoothly at selected WPM without jitter ($60\text{fps}$).
  - Hardware mirror mode inverts text horizontally with $< 1\text{ms}$ rendering overhead.
  - Studio operator logs Take 1, Take 2, marks Take 2 as "Best Take", and marks filming complete.
  - Item transitions to Step 05 with `workflowStatus = F_COMPLETED`.
- **Validation Acceptance**:
  - Prompter cannot be opened for scripts that have not reached Step 04 (`F_READY`).
- **Authorization Acceptance**:
  - Requires `TELEPROMPTER_OPERATE` capability for prompter view; `FILMING_LOG` capability for take logging.
- **Offline / Reliability Acceptance**:
  - Prompter script text is cached in browser memory/localStorage; network interruption during filming does not stop scrolling.
- **Audit Acceptance**:
  - `FILMING_SESSION_STARTED`, `TAKE_LOGGED`, and `FILMING_COMPLETED` events recorded.

---

## 4. Domain Entities
- **Entities Involved**: `Script`, `FilmingSession`, `VideoTake`.
- **Entity Ownership**: Studio Production Context.
- **Relationships**: A `Script` has one `FilmingSession` which contains multiple `VideoTake` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `takeId`, `scriptId`, `takeNumber`, `createdAt`.
- **Mutable Fields**: `notes`, `isBestTake`, `durationSeconds`.
- **Lifecycle**: `F_READY` $\to$ `F_IN_PROGRESS` $\to$ `F_COMPLETED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `filming_sessions`, `video_takes`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface VideoTakeDocument extends BaseEntity {
    id: string; // tak_ + UUIDv4
    scriptId: string;
    filmingSessionId: string;
    takeNumber: number;
    durationSeconds: number;
    isBestTake: boolean;
    notes: string;
    presenterId: string;
  }
  ```
- **Indexes**: Composite index on `(scriptId, takeNumber ASC)`.
- **Source of Truth**: Firestore `video_takes` collection.

---

## 6. API Contract
### 6.1 `GET /api/v1/scripts/:id/teleprompter`
- **Authentication**: Required.
- **Required Capability**: `TELEPROMPTER_OPERATE`.
- **Response Schema**: `ApiResponseEnvelope<{ script: ScriptDocument, prompterText: string, targetWpm: number }>`.

### 6.2 `POST /api/v1/scripts/:id/takes`
- **Authentication**: Required.
- **Required Capability**: `FILMING_LOG`.
- **Request Schema**:
  ```typescript
  {
    takeNumber: z.number().int().positive(),
    durationSeconds: z.number().positive(),
    isBestTake: z.boolean(),
    notes: z.string().optional()
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ take: VideoTakeDocument }>`.

### 6.3 `POST /api/v1/scripts/:id/filming-complete`
- **Authentication**: Required.
- **Required Capability**: `FILMING_LOG`.
- **Response Schema**: `ApiResponseEnvelope<{ status: 'F_COMPLETED', nextStep: 5 }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/prompter/:scriptId` (Fullscreen Prompter), `/studio/filming/:scriptId` (Filming Console).
- **Allowed Roles / Capabilities**: `Presenter`, `ScriptWriter`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Fullscreen toggle (`F11`), spacebar play/pause, up/down arrows adjust speed ($\pm 5\text{WPM}$).
  - Toggle button: "Mirror Text (Glass Rig)" applies CSS `transform: scaleX(-1)`.
  - Fixed horizontal eye-line guide marker at upper 35% of the screen.

---

## 8. RBAC / Capability Contract
- **`TELEPROMPTER_OPERATE`**: Allows accessing prompter screen.
- **`FILMING_LOG`**: Allows creating take logs and completing filming stage.

---

## 9. Workflow Contract
- **Step 04 Entry**: Script ready for filming (`F_READY`).
- **Step 04 Exit**: Filming marked complete $\to$ Workflow transitions item to Step 05 (`RAW_VIDEO`).

---

## 10. Validation Contract
- **Take Validation**: `takeNumber` must be sequential; duration must be $> 0$.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Invalid take duration or non-sequential take number.
- `404 NOT_FOUND`: Script ID not found.
- `422 UNPROCESSABLE_ENTITY`: Script has not reached Step 04.

---

## 12. Audit Contract
- **Events**: `FILMING_SESSION_STARTED`, `FILMING_COMPLETED`.
- **Payload**: `scriptId`, `presenterId`, `bestTakeNumber`, `totalTakes`.

---

## 13. Realtime Contract
- **Applicable**: Realtime sync between prompter controller and teleprompter screen via WebSockets/SSE for remote prompter operator control.

---

## 14. Job / Async Contract
- **Async Execution**: None. In-studio operations are real-time synchronous.

---

## 15. AI Contract
- **Applicable**: No.

---

## 16. Media Contract
- **Applicable**: Video takes logged here are subsequently linked to physical Drive video files in FC-010.

---

## 17. Analytics Contract
- **Metrics**: Average filming takes per video; recording duration.

---

## 18. Security Contract
- **Session Pinning**: Teleprompter sessions can operate under restricted display tokens to allow dedicated studio hardware iPads without full user credentials.

---

## 19. Observability Contract
- **Logs**: Structured logs recording filming session start and end times.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Zero server bandwidth consumed during active scrolling (local client rendering).

---

## 21. Migration Contract
- **Legacy Parity**: Existing spreadsheet take logs imported into `video_takes`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-PRO-01`: Prompter formatter combines Hook, Body, CTA into seamless reading flow.
  - `TC-PRO-02`: Take logging increments take count and updates Best Take flag.
- **API Tests**:
  - `TC-PRO-03`: `POST /api/v1/scripts/:id/takes` records take and outputs standard envelope.
  - `TC-PRO-04`: `POST /api/v1/scripts/:id/filming-complete` transitions to Step 05.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-008.
- **Stage 25 Node**: `D-10 (Videos)`, `D-11 (Video Takes)`.
- **Downstream Consumers**: FC-010 (Raw Video & Media Storage).

---

## 24. Implementation Sequence
1. Define `VideoTake` and `FilmingSession` schemas (`src/types/filming.ts`).
2. Implement Teleprompter text formatter utility.
3. Implement `VideoTakeRepository` and route handlers.
4. Build React Teleprompter fullscreen component with smooth CSS animation (`src/pages/prompter/`).
5. Build Studio Filming Console UI.
6. Verify against `TC-PRO-01..04`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] Teleprompter scrolls smoothly with WPM speed control.
- [ ] Mirror mode functions correctly on beam-splitter display.
- [ ] In-studio take logging records best take and notes.
- [ ] Transition to Step 05 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 14.

---

## 29. Traceability
- **Stage 01**: BR-004
- **Stage 02**: DAC-004
- **Stage 07**: Step 04 Specification
- **Stage 10**: Studio Prompter Hub
- **Stage 13**: `video_takes` collection schema
- **Stage 15**: `/api/v1/scripts/:id/teleprompter`
- **Stage 24**: TC-WF04-01..09
- **Stage 25**: Nodes `D-10`, `D-11`
