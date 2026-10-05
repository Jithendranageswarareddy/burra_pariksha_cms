# Architecture Spike: Firebase as BP-CMS Operational Data Platform

**Document ID:** ADR-018  
**Sprint:** Sprint 3 (Role-Aware BP-CMS + RBAC + Firebase Architecture)  
**Status:** PROPOSED & EVALUATED  
**Author:** Antigravity Engineering  
**Primary Target:** Burra Pariksha Content Management System (BP-CMS)

---

## 1. Firebase Architecture Decision (ADR-018)

### Context
Burra Pariksha CMS currently operates on a Google Sheets datastore layer (Sprint 2 stabilization target) running via service account / OAuth2 credentials. While Google Sheets provided immediate transparency and zero-infrastructure bootstrapping, high-frequency concurrent operations, multi-stage state transitions, and real-time collaborative editing expose structural limitations:
1. **Concurrency & Rate Limits:** Google Sheets API limits requests to 60 requests per minute per user/project, causing latency spikes under rapid multi-tab production workflows.
2. **Atomic Batching & Transaction Locks:** Google Sheets lacks row-level transactions and atomic conditional mutations (e.g. CAS — Compare-And-Swap).
3. **Real-time Subscriptions:** Web client updates require polling rather than push-based reactive subscriptions.

### Decision
Adopt **Google Cloud Firestore (Native Mode)** and **Firebase Authentication** as the future primary operational data platform for BP-CMS, while retaining binary media files externalized in Google Drive / GCS.

### Core Architectural Guardrail (Authoritative Server Gate)
As established by Principle AP-004 and the Sprint 3 security requirements:
- **Server Authoritative:** The Node.js / Express backend remains the primary, authoritative gatekeeper for all business workflow state mutations.
- **Rules as Defense-in-Depth:** Firestore Security Rules enforce document-level schema validation and authorization for any direct client SDK operations, but server-side business logic and 12-step RBAC enforcement remain authoritative.
- **No Premature Deletion:** Google Sheets remains active as the operational source of record throughout Sprint 3. Migration is planned via a verified dual-write and reconciliation phase.

---

## 2. Firestore Domain Model

The Firestore database schema maps canonical domain entities into root collections with document ID conventions:

```
/users/{userId}
/question_drafts/{draftId}
/questions/{questionId}
/scripts/{scriptId}
/video_productions/{videoId}
/editing_records/{editId}
/qc_reviews/{qcId}
/thumbnails/{thumbnailId}
/social_reviews/{reviewId}
/publishing_packages/{packageId}
/analytics_snapshots/{snapshotId}
/assignments/{assignmentId}
/audit_logs/{eventId}
/workflow_instances/{instanceId}
/content_masters/{contentMasterId}
```

### Document Schemas & Indexing Requirements

1. **`/users/{userId}`**:
   - `id`: `string` (`USR-001`)
   - `email`: `string` (indexed, unique)
   - `name`: `string`
   - `role`: `string` (Canonical RBAC role: `ADMIN`, `CONTENT_LEAD`, etc.)
   - `roles`: `string[]` (Multi-role support)
   - `dataScope`: `string` (`ALL`, `ASSIGNED`, `STAGE`, `OWN`)
   - `isActive`: `boolean`
   - `sessionVersion`: `number`
   - `updatedAt`: `timestamp`

2. **`/question_drafts/{draftId}`**:
   - `id`: `string` (`BP-DFT-XXXXXX`)
   - `topicId`: `string` (indexed)
   - `subtopicId`: `string` (indexed)
   - `authorId`: `string` (indexed for `DataScope.OWN`)
   - `difficulty`: `string`
   - `language`: `string` (`TELUGU`)
   - `question`: `string`
   - `options`: `map` (`{ a, b, c, d }`)
   - `correctAnswer`: `string`
   - `explanation`: `string`
   - `status`: `string` (`DRAFT`, `SUBMITTED`, `REJECTED`, `APPROVED`)
   - `createdAt`: `timestamp`
   - `updatedAt`: `timestamp`

3. **`/questions/{questionId}`**:
   - `id`: `string` (`BP-Q-XXXXXX`)
   - `contentMasterId`: `string` (indexed)
   - `authorId`: `string` (indexed)
   - `status`: `string` (`APPROVED`, `IN_PRODUCTION`, `PUBLISHED`, `ARCHIVED`)
   - `videoStatus`: `string` (`NOT_STARTED`, `QUEUED`, `IN_PROGRESS`, `COMPLETED`)
   - `currentStage`: `number` (1 to 15, indexed)
   - `mathematicalVerification`: `map`
   - `approvedBy`: `string`
   - `approvedAt`: `timestamp`
   - `isOverrideApproval`: `boolean`
   - `overrideReason`: `string` (optional)

4. **`/assignments/{assignmentId}`**:
   - `id`: `string` (`ASN-XXXXXX`)
   - `entityType`: `string` (`QUESTION`, `VIDEO`, `SCRIPT`, etc.)
   - `entityId`: `string` (indexed)
   - `assigneeId`: `string` (indexed for `/my-work`)
   - `assigneeRole`: `string` (indexed)
   - `stageNumber`: `number` (indexed)
   - `status`: `string` (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`)
   - `priority`: `string` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
   - `dueDate`: `timestamp` (indexed)
   - `completedAt`: `timestamp`

5. **`/audit_logs/{eventId}`**:
   - `id`: `string` (`AUD-XXXXXX`)
   - `actorUserId`: `string` (indexed)
   - `actorRole`: `string`
   - `actionVerb`: `string` (indexed)
   - `targetResourceType`: `string`
   - `targetResourceId`: `string` (indexed)
   - `isOverride`: `boolean` (indexed for compliance audit)
   - `overrideReason`: `string`
   - `overrideActionType`: `string`
   - `previousState`: `string`
   - `newState`: `string`
   - `timestamp`: `timestamp` (indexed desc)
   - `verdict`: `string` (`ALLOWED`, `DENIED`, `ALLOWED_BY_ADMIN_OVERRIDE`)

---

## 3. Auth Model & Custom Claims

### Token Lifecycle & Claims
Firebase Authentication issues OpenID Connect JWT tokens. For low-latency authorization checks, user claims are embedded in the Firebase Auth token:

```json
{
  "uid": "USR-001",
  "email": "jithendrareddy629@gmail.com",
  "role": "ADMIN",
  "roles": ["ADMIN"],
  "dataScope": "ALL",
  "sessionVersion": 19
}
```

### Claim Synchronization
When an administrator modifies a user's role in BP-CMS:
1. Backend calls `firebaseAuth.setCustomUserClaims(uid, { role, roles, dataScope, sessionVersion })`.
2. Backend increments `sessionVersion` in `/users/{userId}`.
3. Next API request detects version mismatch and forces token refresh, ensuring instantaneous permission revocation.

---

## 4. RBAC Model & Segregation of Duties

The 11 Canonical RBAC Roles map to custom claims and authorization rules:

| Role | Canonical Role | Default Scope | Normal Approval | Audited Override |
| :--- | :--- | :---: | :---: | :---: |
| Administrator | `ADMIN` | `ALL` | Restricted by GAR-02 | ALLOWED with mandatory reason |
| Content Manager / Lead | `CONTENT_LEAD` | `ALL` | Restricted by GAR-02 | Restricted to Admin |
| Quality Reviewer | `QA_REVIEWER` | `STAGE` | ALLOWED for non-authored items | None |
| Question Author / Creator | `QUESTION_AUTHOR` | `OWN` | Prohibited | None |
| Question Editor | `QUESTION_EDITOR` | `ASSIGNED` | Prohibited | None |
| Scriptwriter | `SCRIPTWRITER` | `ASSIGNED` | Prohibited | None |
| Presenter / Speaker | `PRESENTER` | `ASSIGNED` | Prohibited | None |
| Video Editor | `VIDEO_EDITOR` | `ASSIGNED` | Prohibited | None |
| Graphic Designer | `DESIGNER` | `ASSIGNED` | Prohibited | None |
| Publishing Lead | `PUBLISHING_LEAD` | `ALL` | Step 10/11 Allowed | None |
| Performance Analyst | `ANALYST` | `ALL` | Prohibited | None |

---

## 5. Security Rules Design (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return request.auth.token;
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        getUserData().role == 'ADMIN' || 
        'ADMIN' in getUserData().roles
      );
    }
    
    function isAssignee(resourceData) {
      return isAuthenticated() && resourceData.assigneeId == request.auth.uid;
    }
    
    function isAuthor(resourceData) {
      return isAuthenticated() && (
        resourceData.authorId == request.auth.uid ||
        resourceData.createdBy == request.auth.uid
      );
    }
    
    // User Collection: Read by authenticated, write only by Admin
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Question Drafts: Author can read/write, Reviewer can read/approve, Admin full access
    match /question_drafts/{draftId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isAuthor(resource.data) || 
        getUserData().role in ['QA_REVIEWER', 'CONTENT_LEAD']
      );
      
      allow create: if isAuthenticated() && (
        request.resource.data.authorId == request.auth.uid || isAdmin()
      );
      
      allow update: if isAuthenticated() && (
        // Regular update by author before approval
        (isAuthor(resource.data) && resource.data.status == 'DRAFT') ||
        // Normal approval: reviewer != author (GAR-02)
        (getUserData().role in ['QA_REVIEWER', 'CONTENT_LEAD'] && !isAuthor(resource.data)) ||
        // Admin audited override
        (isAdmin() && request.resource.data.override.isOverride == true)
      );
      
      allow delete: if isAdmin();
    }
    
    // Production Questions: Immutable once published, read by all authenticated
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || getUserData().role in ['CONTENT_LEAD', 'PUBLISHING_LEAD'];
    }
    
    // Audit Logs: Append-only, never editable or deletable
    match /audit_logs/{eventId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Strict immutability
    }
    
    // Assignments: Viewable by assignee or Admin
    match /assignments/{assignmentId} {
      allow read: if isAuthenticated() && (isAdmin() || isAssignee(resource.data));
      allow write: if isAdmin() || getUserData().role in ['CONTENT_LEAD', 'PUBLISHING_LEAD'];
    }
  }
}
```

---

## 6. Backend Authorization Design

Even with client-side Firestore SDK access, the BP-CMS Node.js/Express server remains authoritative:
1. **Client requests state transition:** Client submits `POST /api/questions/draft/:id/approve` with bearer session token.
2. **Server Middleware (`auth.middleware.ts`):** Validates HMAC / Firebase token, derives canonical roles, and extracts resource context.
3. **RBAC Engine (`rbac-evaluator.ts`):** Evaluates the 12-step pipeline (capabilities, segregation-of-duties GAR-02, AI gates AP-009, audited overrides).
4. **Data Mutation:** Server executes atomic Firestore batch write using Firebase Admin SDK.
5. **Audit Trail:** Server appends immutable `audit_logs` record within the same batch.

---

## 7. Migration Mapping (Google Sheets -> Firestore)

| Google Sheets Tab | Firestore Collection | Key Transformations |
| :--- | :--- | :--- |
| `USERS` | `/users` | Parse comma-delimited roles into `roles: string[]`; hash passwords |
| `QUESTION_DRAFTS` | `/question_drafts` | Parse JSON options `{ a, b, c, d }`; convert strings to timestamps |
| `QUESTIONS` | `/questions` | Normalize status to `QuestionStatus`; link `contentMasterId` |
| `SCRIPTS` | `/scripts` | Retain version history as subcollection `/scripts/{id}/versions` |
| `VIDEOS` | `/video_productions` | Store Google Drive IDs and YouTube metadata; isolate media binaries |
| `ASSIGNMENTS` | `/assignments` | Map dates to ISO 8601 timestamps; index by `assigneeId` |
| `AUDIT_LOGS` | `/audit_logs` | Write as append-only records with indexed timestamps |

---

## 8. Test Strategy

1. **Local Emulator Suite:** Run `@firebase/rules-unit-testing` against Firestore Local Emulator to verify security rules and anti-self-approval rejections.
2. **Dual-Write Verification:** During migration dry-run, shadow write operations to both Google Sheets and Firestore, verifying hash equality across all records.
3. **Load & Latency Testing:** Verify that 100 concurrent question queries execute in `< 150ms` on Firestore compared to Google Sheets rate limits.

---

## 9. Operational Cost Estimate

Based on expected Burra Pariksha production volume (1 Short per day, ~30 questions/month, 50 team actions/day):

| Metric | Daily Volume | Monthly Volume | Firestore Free Tier | Estimated Monthly Cost |
| :--- | :---: | :---: | :---: | :---: |
| Document Reads | ~5,000 | ~150,000 | 50,000 / day (1.5M/mo) | **$0.00** |
| Document Writes | ~500 | ~15,000 | 20,000 / day (600K/mo) | **$0.00** |
| Document Deletes | ~10 | ~300 | 20,000 / day (600K/mo) | **$0.00** |
| Storage | < 50 MB | < 500 MB | 1 GiB | **$0.00** |

**Conclusion:** BP-CMS operational usage comfortably sits within the Google Cloud / Firebase Free Tier, resulting in $0.00/mo database cost.

---

## 10. Rollback Strategy

1. **Dual-Write Phase:** All server mutations write first to Google Sheets, then shadow-write to Firestore.
2. **Feature Flag (`DATASTORE_PRIMARY=GOOGLE_SHEETS` vs `DATASTORE_PRIMARY=FIRESTORE`):** Allows zero-downtime rollback in under 5 seconds by flipping an environment variable.
3. **Google Sheets Export:** Daily automated snapshot of Firestore collections back into Google Sheets format as an external human-readable disaster recovery backup.
4. **Zero Data Loss Guarantee:** Google Sheets data is never deleted until Firestore production parity is proven over a continuous 14-day operational cycle.
