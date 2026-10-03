# FEATURE CONTRACT: FC-014-SOCIAL-REVIEW-COMPLIANCE

## 1. Feature Identity
- **Feature ID**: FC-014
- **Feature Name**: Social Review & Compliance Gate
- **Business Area**: Publishing Governance / Policy & Social Compliance
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Social Media & Compliance Context
- **Related Workflow Stage(s)**: Step 09 (Social Review)

---

## 2. Requirement
- **Business Requirement**: BR-008 (Social Media Policy Compliance & Metadata Optimization) & NFR-004 (Anti-Self-Approval GAR-02 Rule).
- **User Problem**: Publishing content with clickbait titles, copyright infringements, missing syllabus tags, or platform guideline violations risks strikes, demonetization, or account suspension across YouTube and Meta.
- **Business Purpose**: Provide a final editorial and policy compliance checkpoint where dedicated Social Media Managers review the entire content package (video, thumbnail, title, tags, description), enforce GAR-02 anti-self-approval, and clear the item for distribution.
- **Expected Capability**:
  - Social Review Workspace (`/social-review/:packageId`).
  - Full package preview: Synchronized video playback with final title, description, hashtags, and thumbnail.
  - Policy Compliance Checklist:
    1. YouTube Community Guidelines & Terms of Service.
    2. Educational Accuracy & Telugu/English grammar check.
    3. Copyright & Music licensing clearance.
    4. Target audience appropriateness (Not Made for Kids / Made for Kids flag).
    5. SEO Metadata optimization (Title length $\le 100$ chars, 3–5 relevant hashtags).
  - Strict GAR-02 enforcement: Author, editor, or designer cannot approve social review.
  - Workflow transition: `APPROVE` $\to$ Step 10 (`PUB_SCHEDULED`); `REJECT` $\to$ Step 06 or Step 08.
- **Scope**: Social compliance checklist, metadata approval, GAR-02 validation, workflow progression.
- **Explicit Non-Scope**: Actual video release scheduling (FC-015), external API calls (FC-016).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Social Media Manager reviews the publishing package, verifies all 5 compliance checklist points, and clicks `APPROVE`.
  - Package transitions to Step 10 with `workflowStatus = SOC_APPROVED`.
- **Rejection Acceptance**:
  - Manager clicks `REJECT`, specifies reason (`METADATA_DEFECT`, `THUMBNAIL_POLICY`, `COPYRIGHT_CONCERN`), and adds revision notes.
  - Item returns to designated revision step with notifications sent to respective creators.
- **GAR-02 Anti-Self-Approval Acceptance**:
  - Any user who created the question, wrote the script, rendered the video, or designed the thumbnail attempting to approve social review receives HTTP 403 `SELF_APPROVAL_FORBIDDEN`.
- **Audit Acceptance**:
  - `SOCIAL_REVIEW_PASSED` or `SOCIAL_REVIEW_REJECTED` logged with `reviewerId` and checklist items.

---

## 4. Domain Entities
- **Entities Involved**: `PublishingPackage`, `SocialReview`, `ComplianceChecklist`.
- **Entity Ownership**: Social Governance Context.
- **Relationships**: A `PublishingPackage` has zero or more `SocialReview` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `packageId`, `reviewerId`, `decision`, `checklist`, `createdAt`.
- **Mutable Fields**: None (Append-only review ledger).
- **Lifecycle**: `Recorded`.

---

## 5. Database / Data Contract
- **Collections Involved**: `social_reviews`, `publishing_packages`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface SocialReviewDocument extends BaseEntity {
    id: string; // srv_ + UUIDv4
    packageId: string;
    reviewerId: string;
    decision: 'APPROVE' | 'REJECT';
    checklist: {
      communityGuidelines: boolean;
      copyrightClearance: boolean;
      metadataOptimization: boolean;
      audienceTargeting: boolean;
      educationalIntegrity: boolean;
    };
    rejectionReason?: 'METADATA_DEFECT' | 'THUMBNAIL_POLICY' | 'COPYRIGHT_CONCERN' | 'EDITORIAL_REVISION';
    comments: string;
    createdAt: string;
  }
  ```
- **Indexes**: Composite index on `(packageId, createdAt DESC)`.
- **Source of Truth**: Firestore `social_reviews` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/publishing/:id/social-reviews`
- **Authentication**: Required.
- **Required Capability**: `SOCIAL_REVIEW_APPROVE`.
- **Request Schema**:
  ```typescript
  {
    decision: z.enum(['APPROVE', 'REJECT']),
    checklist: z.object({
      communityGuidelines: z.boolean(),
      copyrightClearance: z.boolean(),
      metadataOptimization: z.boolean(),
      audienceTargeting: z.boolean(),
      educationalIntegrity: z.boolean()
    }),
    rejectionReason: z.string().optional(),
    comments: z.string().min(10),
    expectedVersion: z.number().int().positive()
  }
  ```
- **Business Rule (GAR-02)**: Asserts `req.user.id` is not in package creator array `[authorId, scriptWriterId, editorId, designerId]`.
- **Response Schema**: `ApiResponseEnvelope<{ review: SocialReviewDocument, nextStep: 10 }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/social-review` (Review Queue), `/social-review/:packageId` (Compliance Workspace).
- **Allowed Roles / Capabilities**: `SocialMediaManager`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Unified package view: 9:16 Video player side-by-side with Title, Description, and Thumbnail card.
  - Interactive compliance checklist with mandatory verification toggles.
  - Persistent GAR-02 warning if current user participated in upstream creation.

---

## 8. RBAC / Capability Contract
- **Capability Required**: `SOCIAL_REVIEW_APPROVE`, `SOCIAL_REVIEW_REJECT`.
- **GAR-02 Constraint**: Upstream creators cannot approve social compliance.

---

## 9. Workflow Contract
- **Step 09 Entry**: Thumbnail approved in Step 08 (`T_APPROVED`).
- **Step 09 Exit**:
  - `APPROVE` $\to$ Step 10 (`PUB_SCHEDULED`).
  - `REJECT` $\to$ Step 06 or Step 08 (`REVISION_REQUIRED`).

---

## 10. Validation Contract
- **Checklist Invariant**: All 5 compliance checklist points must be `true` for approval.
- **Comment Invariant**: Minimum 10 characters required for all reviews.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Incomplete checklist on approval.
- `403 FORBIDDEN`: Attempted self-approval or missing capability.
- `422 UNPROCESSABLE_ENTITY`: Package not in Step 09.

---

## 12. Audit Contract
- **Events**: `SOCIAL_REVIEW_APPROVED`, `SOCIAL_REVIEW_REJECTED`, `GAR02_SOCIAL_VIOLATION_ATTEMPT`.
- **Payload**: `packageId`, `reviewerId`, `decision`, `checklist`.

---

## 13. Realtime Contract
- **SSE Event**: `social.approved` broadcast to publishing team.

---

## 14. Job / Async Contract
- **Async Execution**: Synchronous review submission.

---

## 15. AI Contract
- **Compliance Scanner**: Optional Gemini analysis checking title and description for policy-sensitive keywords before human review.

---

## 16. Media Contract
- **Applicable**: Review inspects both Master Video and Thumbnail assets.

---

## 17. Analytics Contract
- **Metrics**: Social review pass rate, rejection categories.

---

## 18. Security Contract
- **Tamper Proof**: Reviews stored in append-only Firestore collection.

---

## 19. Observability Contract
- **Metrics**: Counter `social_reviews.decisions_total{decision}`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore operations within Spark tier.

---

## 21. Migration Contract
- **Legacy Parity**: Historical releases seeded with initial approved social review records.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-SOC-01`: Approval rejected if any checklist item is unchecked.
  - `TC-SOC-02`: GAR-02 validator blocks review if reviewer is in creator list.
- **API Tests**:
  - `TC-SOC-03`: `POST /api/v1/publishing/:id/social-reviews` records review and transitions to Step 10.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-011, FC-012, FC-013.
- **Stage 25 Node**: `D-07 (Reviews / GAR-02)`, `D-16 (Publishing)`.
- **Downstream Consumers**: FC-015 (Publishing Package Assembly).

---

## 24. Implementation Sequence
1. Define Social Review schemas (`src/types/social-review.ts`).
2. Implement `SocialReviewRepository` and route handlers.
3. Build React Social Review Workspace (`src/pages/social-review/`).
4. Verify against `TC-SOC-01..03`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] 5-point social compliance checklist enforced.
- [ ] GAR-02 anti-self-approval rule verified against creator roster.
- [ ] Transition to Step 10 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 02, 07, 09, and 19.

---

## 29. Traceability
- **Stage 01**: BR-008, NFR-004
- **Stage 02**: DAC-006
- **Stage 07**: Step 09 Specification
- **Stage 09**: GAR-02 Rule Invariant
- **Stage 10**: Social Review Hub
- **Stage 13**: `social_reviews` schema
- **Stage 15**: `/api/v1/publishing/:id/social-reviews`
- **Stage 24**: TC-WF09-01..09
- **Stage 25**: Nodes `D-07`, `D-16`
