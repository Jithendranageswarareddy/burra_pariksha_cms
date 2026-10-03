# FEATURE CONTRACT: FC-002-RBAC-CAPABILITY-MATRIX

## 1. Feature Identity
- **Feature ID**: FC-002
- **Feature Name**: Roles & Capability Authorization Matrix
- **Business Area**: Foundation / Access Control & Governance
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P0 (Blocker)
- **Owner / Domain**: Security & Governance Context
- **Related Workflow Stage(s)**: Universal (Governs all 15 manufacturing steps)

---

## 2. Requirement
- **Business Requirement**: BR-009 (Multi-User Governance & Separation of Duties) & NFR-004 (Strict RBAC Authorization).
- **User Problem**: Without role-to-capability enforcement, any user can trigger reviews, publish videos, or delete content, leading to regulatory and editorial chaos.
- **Business Purpose**: Provide an authoritative, backend-enforced RBAC model mapping 11 canonical roles to 37 granular capabilities, while strictly enforcing GAR-02 (Anti-Self-Approval).
- **Expected Capability**:
  - Authoritative role definition for 11 canonical roles (`SuperAdmin`, `Admin`, `SubjectMatterExpert`, `ScriptWriter`, `Presenter`, `VideoEditor`, `QualityController`, `Publisher`, `SocialMediaManager`, `AnalyticsViewer`, `ExternalReviewer`).
  - Mapping to 37 discrete capabilities (`QUESTION_CREATE`, `QUESTION_VERIFY`, `SCRIPT_APPROVE`, etc.).
  - Backend authorization middleware: `requireCapability(capability)` and `requireNotAuthor(resourceAuthorField)`.
  - Frontend capability reflection via `usePermissions()` hook for UX optimization (hiding/disabling controls).
- **Scope**: Capability resolution, authorization middleware, GAR-02 rule enforcement, role assignment data contracts.
- **Explicit Non-Scope**: Authentication tokens (FC-001), specific workflow state machine logic (FC-005).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - A user with role `SubjectMatterExpert` possessing `QUESTION_VERIFY` can successfully approve a question created by another user.
  - A user with role `Admin` can assign and reassign user roles.
- **Validation Acceptance**:
  - Request with unassigned or invalid role string rejected with HTTP 400.
- **Authorization Acceptance**:
  - A user attempting an action without the required capability receives HTTP 403 `FORBIDDEN` with error code `INSUFFICIENT_PERMISSIONS`.
- **GAR-02 Anti-Self-Approval Acceptance**:
  - An SME who authored a question (`authorId === actorId`) attempting to approve that same question receives HTTP 403 `SELF_APPROVAL_FORBIDDEN`.
- **Workflow Acceptance**:
  - Permission evaluation completes in memory in $< 1\text{ms}$ per request.
- **Data Acceptance**:
  - User role stored in Firestore `users.role` field; capabilities derived dynamically in code to avoid denormalization sync errors.
- **Performance Acceptance**:
  - Zero database queries required for capability lookups during request lifecycle (cached in memory or derived from authenticated user role).
- **Security Acceptance**:
  - Bypassing frontend UI controls (e.g. via direct cURL request) is 100% blocked by backend middleware.
- **Audit Acceptance**:
  - `AUTHORIZATION_FAILURE` logged for all 403 responses; `ROLE_ASSIGNED` logged on role changes.

---

## 4. Domain Entities
- **Entities Involved**: `Role`, `Capability`, `UserRoleAssignment`.
- **Entity Ownership**: Governance & Security Domain.
- **Relationships**: A `User` is assigned exactly one primary `Role`. A `Role` maps to a set of `Capability` enums.
- **Versions**: Role Matrix v1.0.
- **Immutable Fields**: Canonical `Capability` enum names.
- **Mutable Fields**: `users.role`.
- **References**: `userId` referenced in role assignments.
- **Lifecycle**: Active system configuration.

---

## 5. Database / Data Contract
- **Collections Involved**: `users`, `audit_events`.
- **Fields Created / Updated**: `users.role: RoleEnum`, `users.updatedAt: Timestamp`.
- **Fields Read**: `users.role` on authentication.
- **Constraints**: `users.role` must match one of the 11 valid `RoleEnum` strings.
- **Optimistic Concurrency**: Firestore document update with OCC versioning.
- **Timestamps**: UTC ISO 8601.
- **Audit Fields**: `updatedBy`, `updatedAt`.
- **Source of Truth**: Code-level `CAPABILITY_MATRIX` constant; database stores only role string.

---

## 6. API Contract
### 6.1 `GET /api/v1/users/:id/capabilities`
- **Authentication**: Required.
- **Required Capability**: `USER_VIEW` (or `actorId === params.id`).
- **Response Schema**: `ApiResponseEnvelope<{ role: string, capabilities: string[] }>`.

### 6.2 `PATCH /api/v1/users/:id/role`
- **Authentication**: Required.
- **Required Capability**: `USER_MANAGE_ROLES` (Admin / SuperAdmin only).
- **Request Schema**: `{ role: z.enum(VALID_ROLES) }`.
- **Response Schema**: `ApiResponseEnvelope<{ userId: string, role: string }>`.
- **Error Codes**: `400 INVALID_ROLE`, `403 FORBIDDEN`, `404 USER_NOT_FOUND`.
- **Audit Event**: `USER_ROLE_UPDATED`.

---

## 7. Frontend Contract
- **Canonical Route**: Integrated across all routes via `PermissionGate` component and `/admin/users` for role management.
- **Allowed Roles / Capabilities**: `Admin`, `SuperAdmin` for role assignment UI.
- **UX Behavior**:
  - Buttons for unauthorized actions are hidden or disabled with a tooltip: *"Requires <CAPABILITY> capability"*.
  - Warning banner shown if an author views their own item in a review queue: *"GAR-02 Rule: You cannot approve your own submission."*

---

## 8. RBAC / Capability Contract
- **Authoritative Matrix**:
  - `SuperAdmin`: All 37 capabilities.
  - `Admin`: User management, system configuration, all content capabilities except self-approval.
  - `SubjectMatterExpert`: `QUESTION_CREATE`, `QUESTION_UPDATE`, `QUESTION_VERIFY`, `SCRIPT_VIEW`.
  - `ScriptWriter`: `QUESTION_VIEW`, `SCRIPT_CREATE`, `SCRIPT_UPDATE`, `SCRIPT_SUBMIT`.
  - `Presenter`: `SCRIPT_VIEW`, `TELEPROMPTER_OPERATE`, `FILMING_LOG`.
  - `VideoEditor`: `SCRIPT_VIEW`, `VIDEO_RAW_VIEW`, `VIDEO_EDIT`, `VIDEO_RENDER`.
  - `QualityController`: `VIDEO_QC_VERIFY`, `QC_REJECT`, `GAR02_RULE`.
  - `Publisher`: `PUBLISHING_PACKAGE_CREATE`, `PUBLISHING_SCHEDULE`, `PUBLISH_EXECUTE`.
  - `SocialMediaManager`: `SOCIAL_REVIEW_APPROVE`, `SOCIAL_REVIEW_REJECT`, `PLATFORM_SYNC`.
  - `AnalyticsViewer`: `ANALYTICS_VIEW`, `REPORT_EXPORT`.
  - `ExternalReviewer`: Read-only review access to designated assets.

---

## 9. Workflow Contract
- **Workflow Stage**: Prerequisite authority for all state transitions in Steps 01–15.
- **GAR-02 Rule**: Whenever a transition represents an approval or verification, the state machine asserts:
  $$\text{request.actorId} \neq \text{resource.authorId}$$

---

## 10. Validation Contract
- **Role Validation**: Input role must strictly equal one of the 11 enum members.
- **Capability Check**: Dynamic evaluation via bitmask or `Set.has()`.

---

## 11. Error Contract
- `401 UNAUTHORIZED`: No valid session context.
- `403 FORBIDDEN`: Missing capability (`INSUFFICIENT_PERMISSIONS`) or self-approval attempt (`SELF_APPROVAL_FORBIDDEN`).
- `404 NOT_FOUND`: Target user does not exist.

---

## 12. Audit Contract
- **Audit Event Name**: `ROLE_ASSIGNMENT_CHANGED`, `ACCESS_DENIED_GAR02`, `UNAUTHORIZED_CAPABILITY_ATTEMPT`.
- **Payload**: `actorId`, `targetUserId`, `oldRole`, `newRole`, `attemptedCapability`, `resourceId`.

---

## 13. Realtime Contract
- **Realtime Requirement**: When a user's role is updated, a `user.role_changed` event is dispatched over SSE to force the client to refresh its session capabilities without logging out.

---

## 14. Job / Async Contract
- **Async Requirement**: Synchronous execution. Role evaluation is strictly in-process.

---

## 15. AI Contract
- **Applicable**: No. AI agents operate under a dedicated restricted role (`AI_ASSISTANT`) with 0 approval capabilities.

---

## 16. Media Contract
- **Applicable**: Governs media upload and deletion permissions (`MEDIA_UPLOAD`, `MEDIA_DELETE`).

---

## 17. Analytics Contract
- **Applicable**: Governs analytics viewing permissions (`ANALYTICS_VIEW`).

---

## 18. Security Contract
- **Defense in Depth**: Frontend permission checks are UX conveniences; backend route middleware is the absolute security perimeter.
- **Immutability of SuperAdmin**: The primary SuperAdmin account cannot have its role modified or revoked.

---

## 19. Observability Contract
- **Metrics**: Counter metric for `rbac.access_denied_total` partitioned by capability and route.
- **Alerts**: Alert triggered if access denied rate spikes $> 50$ events/minute.

---

## 20. Cost Contract
- **Cost**: ₹0.00. In-memory execution; zero external API or database reads on cached session evaluation.

---

## 21. Migration Contract
- **Legacy System**: Current system has no granular capabilities (all-or-nothing access).
- **Migration Strategy**: Map legacy user accounts to `Admin` or `SubjectMatterExpert` based on email domain during initial data import.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-RBAC-01`: Matrix resolves all 37 capabilities correctly for all 11 roles.
  - `TC-RBAC-02`: `requireCapability` middleware passes authorized caller.
  - `TC-RBAC-03`: `requireCapability` middleware rejects unauthorized caller with 403.
  - `TC-RBAC-04`: GAR-02 validator rejects approval when `actorId === authorId`.
- **Integration Tests**:
  - `TC-RBAC-05`: Protected API endpoint blocks non-admin role.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001 (Identity & Session Context).
- **Stage 25 Node**: `D-03 (Roles)`, `D-04 (Capabilities)`.
- **Downstream Consumers**: FC-003, FC-005, and all workflow feature contracts.

---

## 24. Implementation Sequence
1. Define TypeScript enums for `Role` and `Capability` (`src/types/rbac.ts`).
2. Implement immutable `CAPABILITY_MATRIX` constant lookup table.
3. Implement `hasCapability(role, capability): boolean`.
4. Implement `requireCapability` and `requireNonSelfApproval` Express middlewares.
5. Create React `usePermissions()` hook and `<PermissionGate>` component.
6. Verify against `TC-RBAC-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment. No database migration required.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision to previous stable build.

---

## 27. Feature Completion Criteria
- [ ] 11 roles and 37 capabilities strictly typed and tested.
- [ ] GAR-02 anti-self-approval rule tested with 100% test coverage.
- [ ] Backend middleware returns clean HTTP 403 envelopes.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Stage 09 and Stage 19 provide complete and authoritative capability definitions.

---

## 29. Traceability
- **Stage 01**: BR-009
- **Stage 02**: DAC-001, DAC-006
- **Stage 09**: Authoritative RBAC Capability Matrix & GAR-02 Rule
- **Stage 19**: Zero-Trust Authorization & Security Invariants
- **Stage 21**: Audit Events `ROLE_ASSIGNMENT_*`
- **Stage 24**: Security Test Matrix
- **Stage 25**: Nodes `D-03`, `D-04`
