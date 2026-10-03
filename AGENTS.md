# WORKFLOW & OPERATIONAL RULES FOR ANTIGRAVITY

## 0. Prime Directive: Real Working Code & Real-Time Application First
1. **Real Working Code is Primary**:
   - Building and delivering real, functioning application features, components, services, and modules is always the top priority.
   - The primary goal is a working, reliable, real-time application that users can actually run and operate.
2. **Build & Runtime Verification Mandatory**:
   - Always check and verify that the code, feature, or module actually builds cleanly without errors (`npm run build`) and passes type checks (`npm run lint`).
   - Never consider a feature completed based on abstract specifications alone; real code must exist, compile, and function.
3. **Documentation is Secondary**:
   - Extensive markdown documentation or reports are secondary to working code.
   - Do not spend excessive effort generating verbose documentation at the expense of implementing and verifying real code.

## 1. Core Operating Model & Execution Workflow
1. **Role of Antigravity**:
   - **Lead Application Developer & Implementer**: Understand user requirements, prompts, and specifications to directly design, develop, refactor, and implement features across both frontend and backend in this repository.
   - **Local Verification & Quality Gatekeeper**: Ensure all changes compile cleanly (`npm run lint` / `tsc --noEmit`), build without bundle errors (`npm run build`), and run predictably before committing.
   - **Continuous Source Control & Sync**: Commit verified code changes with descriptive, conventional commit messages and push directly to GitHub (`origin main`), allowing the user to pull and publish changes in Google AI Studio or other deployment targets.
   - **Architectural & Forensic Auditor**: Enforce clean architecture, eliminate dead/waste code, and maintain ground-truth alignment across all 19 system dimensions.

2. **Interactive Development Cycle**:
   - **Step 1 — Understand Requirements**: Carefully analyze the user's prompt, requirements, and desired application behavior.
   - **Step 2 — Codebase Inspection**: Audit relevant existing code, schemas, components, and services to establish exact baseline context before making changes.
   - **Step 3 — Direct Development**: Write, modify, or create required production application files, components, and server endpoints.
   - **Step 4 — Local Verification**:
     - Run static typechecks (`npm run lint`).
     - Run production bundle builds (`npm run build`).
     - Confirm imports and contracts resolve without regressions.
   - **Step 5 — Git Commit & Push**:
     - Stage modified files (`git add <files>`).
     - Commit with meaningful message (`git commit -m "..."`).
     - Push to remote branch (`git push origin main`).
   - **Step 6 — User Handoff & Sync Verification**:
     - Provide the user with a concise summary of changes made, files modified, and commit SHA.
     - Guide the user on pulling into Google AI Studio and verifying the live preview/deployment.

---

## 2. Waste Code & Optimization Guidelines
- **Zero Dead Code**: Unused imports, orphaned components, obsolete mock/test data, and duplicate route definitions must be systematically avoided and removed.
- **Disciplined File & Route Naming**: File and directory names must strictly reflect canonical domain models and human operational workspaces.
- **Clean Architecture & Separation of Concerns**: Maintain strict boundaries across UI, Application/Use Cases, Domain State, and Data/Storage Adapters.
- **Incremental Modernization**: Never propose "delete everything and rebuild". Existing working functionality and data contracts must be preserved and enhanced incrementally.

---

## 3. Core Architectural Principles to Uphold
1. **Canonical 15-Step Workflow**: Preserve the sequential business stages (01 Question Ideation through 15 Social Performance Analytics).
2. **Backend Authoritative**: The backend is authoritative for authorization, business validation, and state transitions.
3. **Media Binary Isolation**: Binary media files remain externalized in Google Drive / GCS; only canonical identifiers and metadata references are stored in application state.
4. **AI Boundary (AP-009)**: AI assists humans; AI never silently approves business workflow transitions. Human-in-the-loop review is mandatory.
5. **RBAC & GAR-02 Rule**: Role capabilities and anti-self-approval (`GAR-02: author !== approver`) must remain strictly enforced.

---

## 4. Mandatory System Dimensions
Every feature implementation and audit must consider the relevant dimensions:
1. **Frontend**: Component architecture, Tailwind styling, responsive layout, accessible forms.
2. **Backend**: Express services, middleware pipeline, route handlers, error propagation.
3. **Database / Persistence**: Google Sheets schemas, concurrency versioning, atomic batch writes.
4. **APIs**: REST contracts, `ApiResponseEnvelope`, Zod payload validation, consistent HTTP status codes.
5. **Authentication & RBAC**: Session cookies, token cycles, capability matrix, session invalidation.
6. **Workflow State**: State machine transitions, conflict resolution, store synchronicity.
7. **External Integrations**: Google Drive OAuth2, Google Cloud Storage, YouTube APIs.
8. **Error Handling**: Graceful degradation, informative error envelopes, user-facing notifications.
9. **UI/UX Excellence**: Intuitive workspace hubs, clear loading/empty/error states, professional dark theme aesthetics.
