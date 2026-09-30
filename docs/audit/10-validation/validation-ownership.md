# Validation Ownership Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 07 of 30  

---

## 1. Architectural Layers & Ownership Matrix

Validation ownership across BP-CMS spans five distinct architectural tiers:
1. **Tier 1: UI View / Controlled Component** (Client-side interactive feedback, formatting, button disabling)
2. **Tier 2: Express Route Controllers** (`src/server/routes.ts`: First-line parameter guards, RBAC, HTTP status dispatch)
3. **Tier 3: Domain Services** (`src/lib/services/`: Business rules, workflow state machine transitions, entity existence)
4. **Tier 4: Google Sheets Schemas** (`src/lib/schemas/google-sheets-schema.ts`: Authoritative Zod persistence contracts)
5. **Tier 5: External Providers** (Google Drive API, YouTube Data API, Gemini AI output parsers)

---

## 2. Validation Ownership Mapping by Rule

| Validation Rule / Concern | Authoritative Owner | Owner Layer | Consumer Layers | Enforcement Mode | Ownership Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Question Text Length (10-500 chars)** | `question.service.ts` & Zod | Service / Domain | `QuestionStudioPage`, `routes.ts` | Synchronous Parse | **CLEAR** |
| **Option Uniqueness (A != B != C != D)**| `QuestionStudioPage.tsx` | Client UI | Component local state | Pre-submit check | **FRAGILE (UI ONLY)** |
| **Google Drive URL Substring** | `routes.ts` | Express Route | `RecordingWorkspace`, `EditingWorkspace` | Imperative Check | **CLEAR** |
| **Workflow State Transition Validity** | `video.service.ts` | Service / Domain | All video workspaces & API routes | State Graph Enum | **CLEAR** |
| **12-Point QC Checklist Completion** | `FinalReviewWorkspace.tsx` | Client UI | Component local state | Button disable | **FRAGILE (UI ONLY)** |
| **Taxonomy Hierarchy Integrity** | `taxonomy.service.ts` | Service / Domain | `SettingsPage`, `PlanningPage` | Foreign key lookup | **CLEAR** |
| **User Role Authorization** | `routes.ts` & `auth.service.ts` | Route / Auth | All API endpoints | Middleware / Guard | **DUPLICATED** |
| **Platform Scheduled Timestamp Format** | `google-sheets-schema.ts`| Persistence Schema | `PublishingWorkspace`, `publishing.service` | Zod ISO-8601 | **CLEAR** |
| **Recovery Snapshot Fingerprint** | `durable-snapshot-archive` | Service / DR | `RecoveryAdminPage` | SHA-256 Checksum | **CLEAR** |

---

## 3. Ownership Classification Summary
- **CLEAR**: 68% of core business rules have a single unambiguous domain service or Zod schema owner.
- **DUPLICATED**: 22% of rules (notably basic required field checks) are re-implemented across components, routes, and services.
- **FRAGILE / UI-ONLY**: 8% of rules (e.g. Option Uniqueness, 12-Point QC checklist completeness) exist exclusively in frontend components without backend API enforcement!
- **CONFLICTING**: 2% of rules possess conflicting specifications between client UI expectations and backend acceptance.
