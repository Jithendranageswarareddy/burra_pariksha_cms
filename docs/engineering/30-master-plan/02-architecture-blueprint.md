# Step 30: 02 — Comprehensive Architecture Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Technical Architecture Blueprint  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. System Architecture Decomposition

The target BP-CMS platform is structured into five distinct, decoupled architectural layers:

```
+---------------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (React 19 + TypeScript + Vite + Tailwind CSS)                  |
|    - App Routing & Route Guards (ProtectedRoute, RequireRole)                        |
|    - 15-Stage Interactive Conveyor & Stage-Specific Workspaces                       |
|    - Unified UI Design System (Common Design Tokens, Modal/Toast Engines)            |
|    - Client-Side State & Optimistic UI Mutators (React Query / TanStack Query)       |
+---------------------------------------------------------------------------------------+
                                        │ (HTTPS / JSON REST API)
+---------------------------------------------------------------------------------------+
| 2. API & CONTROLLER GATEWAY (Node.js 22 LTS + Express + TypeScript)                   |
|    - Rate Limiting & DDOS Protection (express-rate-limit)                             |
|    - Cryptographic Authentication & Token Validation (HMAC / JWT)                     |
|    - Role & Capability Authorization Middleware (requireRole, requireCapability)      |
|    - Request DTO Validation & Sanitization (Zod Schema Validation)                   |
+---------------------------------------------------------------------------------------+
                                        │
+---------------------------------------------------------------------------------------+
| 3. DOMAIN SERVICE & STATE ENGINE LAYER                                                |
|    - Canonical 15-Stage Finite State Machine (FSM) Engine                             |
|    - Fine-Grained Object Authorization Service (ObjectAuthService)                    |
|    - Gemini AI Multi-Provider Synthesis Core (gemini-2.5-flash / pro)                 |
|    - Content, Video, Publishing, Analytics & Intelligence Domain Services             |
|    - Event Dispatcher & Domain Event Outbox Pattern                                   |
+---------------------------------------------------------------------------------------+
                                        │
+---------------------------------------------------------------------------------------+
| 4. ASYNCHRONOUS WORKER & INTEGRATION LAYER (Redis + BullMQ)                           |
|    - Video Transcoding & QC Analysis Worker                                           |
|    - Google Drive Chunked Upload & Folder Reconciler                                  |
|    - Social Publishing Workers (YouTube Data API v3, Meta Graph API v20.0)            |
|    - Analytics Polling & Ingestion Workers (Hourly/Daily sync)                        |
+---------------------------------------------------------------------------------------+
                                        │
+---------------------------------------------------------------------------------------+
| 5. PERSISTENCE & INFRASTRUCTURE LAYER                                                 |
|    - Relational Primary DB: PostgreSQL 16 (Cloud SQL) via Drizzle ORM                |
|    - Binary Media Storage: Google Drive API v3 (Targeted Folders) + Google Cloud Storage|
|    - Cache & Session Store: Redis 7.2 (Memorystore)                                  |
|    - Audit Log & Event Store: Append-only PostgreSQL Partitioned Tables               |
+---------------------------------------------------------------------------------------+
```

---

## 2. Frontend Layer Blueprint

### 2.1 Route Guard Topology
The presentation layer eliminates unsecured route mounting by implementing a nested guard pattern:

```tsx
// Target Route Guard Architecture (App.tsx)
<Routes>
  {/* Public Route */}
  <Route path="/login" element={<LoginPage />} />

  {/* Authenticated Base Layout */}
  <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
    <Route path="/" element={<DashboardHub />} />
    <Route path="/questions" element={<QuestionsHub />} />
    
    {/* Role-Restricted Workspaces */}
    <Route element={<RequireRole roles={['ADMIN', 'QUESTION_CREATOR', 'CONTENT_MANAGER']} />}>
      <Route path="/studio" element={<StudioPage />} />
      <Route path="/questions/new" element={<QuestionEditorPage />} />
    </Route>

    <Route element={<RequireRole roles={['ADMIN', 'REVIEWER', 'TOPIC_LEAD']} />}>
      <Route path="/questions/:id/verify" element={<QuestionVerifyPage />} />
    </Route>

    <Route element={<RequireRole roles={['ADMIN', 'STUDIO_PRESENTER', 'SPEAKER']} />}>
      <Route path="/record/:id" element={<RecordingWorkspace />} />
    </Route>

    <Route element={<RequireRole roles={['ADMIN', 'VIDEO_EDITOR', 'EDITOR']} />}>
      <Route path="/edit/:id" element={<VideoEditorWorkspace />} />
    </Route>

    <Route element={<RequireRole roles={['ADMIN', 'PUBLISHING_MANAGER', 'PUBLISHER']} />}>
      <Route path="/publishing" element={<PublishingHub />} />
    </Route>

    {/* Admin-Exclusive Infrastructure */}
    <Route element={<RequireRole roles={['ADMIN']} />}>
      <Route path="/recovery" element={<RecoveryAdminPage />} />
      <Route path="/users" element={<UserManagementPage />} />
    </Route>
  </Route>
</Routes>
```

### 2.2 Client Data Layer (TanStack Query)
- Replace ad-hoc `fetch()` and local state caching with centralized React Query hooks.
- Standardize query keys: `['questions', id]`, `['videos', id]`, `['workflow', entityId]`.
- Enforce automated cache invalidation upon successful state transition mutations.

---

## 3. Backend & Domain Service Layer Blueprint

### 3.1 Strict State Transition Engine
All lifecycle modifications MUST flow through the centralized `WorkflowEngineService`:

```typescript
export class WorkflowEngineService {
  async transitionState(
    entityType: 'QUESTION' | 'VIDEO' | 'CONTENT',
    entityId: string,
    targetState: CanonicalWorkflowState,
    actor: AuthenticatedUser,
    transitionData?: Record<string, unknown>
  ): Promise<WorkflowTransitionResult> {
    return await db.transaction(async (tx) => {
      // 1. Fetch current canonical state with row-level lock
      const current = await tx.select().from(contentItems).where(eq(contentItems.id, entityId)).for('update');
      
      // 2. Validate state machine transition graph
      const isValid = StateTransitionGraph[current.status]?.includes(targetState);
      if (!isValid) {
        throw new InvalidStateTransitionError(`Cannot transition from ${current.status} to ${targetState}`);
      }

      // 3. Verify actor capability and object-level authorization
      await objectAuthService.assertCanTransition(actor, current, targetState);

      // 4. Execute validation gate checks
      await this.runValidationGate(current.status, targetState, entityId, tx);

      // 5. Update atomic state across all child entities
      await tx.update(contentItems).set({ status: targetState, updatedAt: new Date() }).where(eq(contentItems.id, entityId));
      await tx.update(videos).set({ status: targetState }).where(eq(videos.contentId, entityId));
      await tx.update(questions).set({ videoStatus: targetState }).where(eq(questions.contentId, entityId));

      // 6. Write immutable audit log
      await tx.insert(auditLogs).values({
        entityId,
        actorId: actor.id,
        fromState: current.status,
        toState: targetState,
        metadata: transitionData,
        timestamp: new Date()
      });

      return { success: true, fromState: current.status, toState: targetState };
    });
  }
}
```

---

## 4. Resilience & Error Handling Architecture

1. **Transactional Integrity:** Zero single-row failures causing state desynchronization. If Google Drive fails during video attachment, the database transaction rolls back.
2. **Exponential Backoff:** All external API adapters (Google Drive, YouTube, Meta, Gemini) are wrapped with resilience interceptors providing 3 retries with jittered exponential backoff (1s, 2s, 4s).
3. **Graceful Degradation:** If background AI processing is temporarily throttled, the question authoring workflow falls back to manual entry mode with draft auto-saving.
