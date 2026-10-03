# FEATURE CONTRACT: FC-015-PUBLISHING-PACKAGE-SCHEDULING

## 1. Feature Identity
- **Feature ID**: FC-015
- **Feature Name**: Publishing Package Assembly & Scheduling
- **Business Area**: Distribution / Publishing Setup & Release
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Distribution Context
- **Related Workflow Stage(s)**: Steps 10 (Publishing Setup) & 11 (Published)

---

## 2. Requirement
- **Business Requirement**: BR-008 (Multi-Platform Publishing Setup) & NFR-003 (Deterministic State Transitions).
- **User Problem**: Content release assets (master video, thumbnail, tags, titles, platform selections) are scattered across drives and chat threads, resulting in publishing delays, missing hashtags, and accidental duplicate uploads.
- **Business Purpose**: Provide an atomic publishing package assembler that unifies all approved creative assets into a validated release payload, manages publication scheduling, and triggers execution at the designated release window.
- **Expected Capability**:
  - Assemble unified `PublishingPackage` linking question, script, master video, and thumbnail.
  - Multi-platform target selection (YouTube Shorts, Instagram Reels, Telegram).
  - Schedule release date/time (`scheduledReleaseAt`) in UTC.
  - Manual *"Publish Now"* or automated Cloud Tasks scheduled trigger.
  - Workflow transitions: Step 10 (`PUB_SCHEDULED`) $\to$ Step 11 (`PUB_RELEASED`).
  - Publishing Hub UI (`/publishing/schedule`, `/publishing/live`).
- **Scope**: Package assembly, scheduling metadata, release trigger, publishing hub UI.
- **Explicit Non-Scope**: Third-party YouTube/Meta OAuth2 upload API calls (FC-016).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Publisher selects approved package, configures title, tags, platform targets, and sets release time to tomorrow 09:00 AM IST.
  - Package transitions to Step 10 (`PUB_SCHEDULED`).
  - When release window arrives (or upon clicking *"Release Now"*), package transitions to Step 11 (`PUB_RELEASED`) and dispatches release job.
- **Validation Acceptance**:
  - Package cannot be scheduled without approved video (Step 07), thumbnail (Step 08), and social review (Step 09).
- **Authorization Acceptance**:
  - Requires `PUBLISHING_SCHEDULE` capability for Step 10; `PUBLISH_EXECUTE` capability for Step 11.
- **Audit Acceptance**:
  - `PUBLISHING_PACKAGE_SCHEDULED` and `CONTENT_RELEASED` events logged with package ID, targets, and actor ID.

---

## 4. Domain Entities
- **Entities Involved**: `PublishingPackage`, `Publication`, `PlatformProfile`.
- **Entity Ownership**: Distribution Domain Context.
- **Relationships**: A `PublishingPackage` bundles one `Question`, one `Script`, one `Video`, and one `ThumbnailAsset`. Produces one or more `Publication` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `videoId`, `thumbnailAssetId`, `createdAt`.
- **Mutable Fields**: `title`, `description`, `tags`, `targetPlatforms`, `scheduledReleaseAt`, `publicationStatus`.
- **Lifecycle**: `SETUP` $\to$ `SCHEDULED` $\to$ `RELEASED` | `CANCELLED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `publishing_packages`, `publications`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface PublishingPackageDocument extends BaseEntity {
    id: string; // pub_ + UUIDv4
    videoId: string;
    thumbnailAssetId: string;
    title: string;
    description: string;
    tags: string[];
    targetPlatforms: Array<'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS' | 'TELEGRAM'>;
    scheduledReleaseAt?: string;
    releasedAt?: string;
    publicationStatus: PublicationStatus;
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(publicationStatus, scheduledReleaseAt ASC)`.
- **Source of Truth**: Firestore `publishing_packages` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/publishing/:id/schedule`
- **Authentication**: Required.
- **Required Capability**: `PUBLISHING_SCHEDULE`.
- **Request Schema**:
  ```typescript
  {
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(5000),
    tags: z.array(z.string()).min(1).max(20),
    targetPlatforms: z.array(z.enum(['YOUTUBE_SHORTS', 'INSTAGRAM_REELS', 'TELEGRAM'])).min(1),
    scheduledReleaseAt: z.string().datetime().optional()
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ package: PublishingPackageDocument, nextStep: 10 }>`.

### 6.2 `POST /api/v1/publishing/:id/release`
- **Authentication**: Required.
- **Required Capability**: `PUBLISH_EXECUTE`.
- **Response Schema**: `ApiResponseEnvelope<{ package: PublishingPackageDocument, nextStep: 11 }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/publishing` (Hub), `/publishing/:id/schedule` (Scheduling Form), `/publishing/live` (Live Releases).
- **Allowed Roles / Capabilities**: `Publisher`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Interactive publishing checklist verifying upstream sign-offs.
  - Multi-platform checkbox selector with character counters per platform.
  - Date & time picker for scheduling with quick presets (*"Today 6 PM"*, *"Tomorrow 9 AM"*).

---

## 8. RBAC / Capability Contract
- **`PUBLISHING_SCHEDULE`**: Authorizes configuring release metadata and schedule time.
- **`PUBLISH_EXECUTE`**: Authorizes triggering live release.

---

## 9. Workflow Contract
- **Step 10 Entry**: Social review passed in Step 09 (`SOC_APPROVED`).
- **Step 10 Exit**: Package scheduled $\to$ Transitions to Step 10 (`PUB_SCHEDULED`).
- **Step 11 Exit**: Released to live distribution $\to$ Transitions to Step 11 (`PUB_RELEASED`).

---

## 10. Validation Contract
- **Title Validation**: Max 100 characters for YouTube Shorts compatibility.
- **Tag Validation**: 3 to 15 tags; hashtags prefixed with `#`.
- **Schedule Time**: If provided, `scheduledReleaseAt` must be at least 15 minutes in the future.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Title exceeds limit or missing target platforms.
- `403 FORBIDDEN`: Missing publishing capability.
- `422 UNPROCESSABLE_ENTITY`: Package missing upstream QC or Social approval.

---

## 12. Audit Contract
- **Events**: `PUBLISHING_PACKAGE_SCHEDULED`, `CONTENT_RELEASED`.
- **Payload**: `packageId`, `title`, `targetPlatforms`, `scheduledReleaseAt`, `actorId`.

---

## 13. Realtime Contract
- **SSE Event**: `publish.scheduled`, `publication.live` broadcast to distribution dashboard.

---

## 14. Job / Async Contract
- **Scheduled Release Worker**: Cloud Tasks job scheduled for `scheduledReleaseAt` to invoke FC-016 platform distributor.

---

## 15. AI Contract
- **SEO Optimization**: Optional Gemini suggestions for catchy titles, description summaries, and high-volume hashtags.

---

## 16. Media Contract
- **Master References**: Bundles pointers to approved Master Video and Thumbnail.

---

## 17. Analytics Contract
- **Metrics**: Publishing cadence, scheduled pipeline depth.

---

## 18. Security Contract
- **Protected Actions**: Publishing execution restricted to authorized Publishers and Admins.

---

## 19. Observability Contract
- **Logs**: Structured logs recording release scheduling and execution events.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore operations within Spark tier.

---

## 21. Migration Contract
- **Legacy Parity**: Existing YouTube video URLs mapped into completed `PublishingPackage` records.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-PUB-01`: Title and tag validation enforce YouTube Shorts constraints.
  - `TC-PUB-02`: Scheduling requires all upstream sign-offs.
- **API Tests**:
  - `TC-PUB-03`: `POST /api/v1/publishing/:id/schedule` updates package and transitions to Step 10.
  - `TC-PUB-04`: `POST /api/v1/publishing/:id/release` transitions to Step 11.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-012, FC-013, FC-014.
- **Stage 25 Node**: `D-16 (Publishing Package)`.
- **Downstream Consumers**: FC-016 (Platform Release & Sync).

---

## 24. Implementation Sequence
1. Define Publishing schemas (`src/types/publishing.ts`).
2. Implement `PublishingPackageRepository` and route handlers.
3. Build React Publishing Hub and Scheduling Workspace (`src/pages/publishing/`).
4. Verify against `TC-PUB-01..04`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] Publishing package bundles verified video and thumbnail.
- [ ] Scheduling metadata validated against platform limits.
- [ ] Transition to Step 10 and Step 11 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 13.

---

## 29. Traceability
- **Stage 01**: BR-008
- **Stage 02**: DAC-006
- **Stage 07**: Steps 10 & 11 Specification
- **Stage 10**: Publishing Hub Architecture
- **Stage 13**: `publishing_packages` schema
- **Stage 15**: `/api/v1/publishing/*`
- **Stage 24**: TC-WF10-01..09, TC-WF11-01..09
- **Stage 25**: Node `D-16`
