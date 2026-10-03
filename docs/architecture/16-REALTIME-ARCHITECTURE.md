# 16 — REAL-TIME ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 16 of 30-Stage Modernization Program — Authoritative Real-Time Architecture, Event Distribution & Transport Contract

```
================================================================================
Document ID:       BP-ARCH-16-REALTIME
Version:           16.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Real-Time Needs Inventory, Transport Candidate Evaluation,
                   Server-Sent Events (SSE) Contract, Event Taxonomy & RBAC Gating
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-004, AP-005, AP-010)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md
                   15-API-CONTRACT.md
Downstream Stages: 17-JOB-ASYNC-ARCHITECTURE.md
                   18-AI-ARCHITECTURE.md
                   19-SECURITY-ARCHITECTURE.md
                   20-ANALYTICS-ARCHITECTURE.md
                   21-AUDIT-OBSERVABILITY.md
                   22-COST-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Primary Transport: Server-Sent Events (SSE) via Native Node.js HTTP Streaming
Fallback Transport:Adaptive HTTP Polling (15s active / 60s background)
Budget Constraint: Hard Initial Infrastructure Ceiling: ₹0–₹100 (Zero-Cost Invariant)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Real-Time Architecture, Event Taxonomy, and Transport Contract** for the Burra Pariksha Content Management System (BP-CMS). Its purpose is to define exactly where, why, and how real-time behavior is incorporated into BP-CMS. Grounded in Architecture Principle **AP-002** (*Backend Authoritative Governance*), **AP-005** (*Optimistic Concurrency Control*), and **AP-010** (*Single State Ownership*), this specification resolves the transport mechanism, connection lifecycle, RBAC capability gating, reconnection semantics, and event envelope schemas across the 15-step studio production lifecycle.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *conceptual and logical real-time architecture*. It does **not** assert that runtime SSE endpoints, WebSocket listeners, Socket.IO daemons, or polling workers have been deployed or activated.
2. **Zero Runtime Code Modification:** No application source code, Express router files (`src/server/routes.ts`), React frontend contexts, or client hooks are modified in Stage 16.
3. **No External Infrastructure or Paid Dependencies:** No paid real-time PaaS products (such as Pusher, Ably, PubNub), managed Redis clusters, or GCP Cloud Pub/Sub topics are introduced.
4. **Contractual Boundary:** Stage 16 establishes the binding architectural contract that **Stage 27 (Implementation)** and **Stage 28 (Integration & Testing)** will physically implement and verify.

---

## 2. Scope & Architectural Boundaries

### 2.1 The Fundamental Real-Time Axiom
In BP-CMS, real-time events adhere strictly to the **Fundamental Real-Time Axiom**:
$$\text{Real-Time Event} = \text{Coordination Signal / Cache Invalidation Trigger}$$
$$\text{Real-Time Event} \neq \text{Authoritative Business State}$$

Real-time events notify connected clients that a business entity, workflow stage, or asynchronous job has transitioned. **Events do not replace database state.** When a client receives a real-time event, it uses the canonical REST APIs established in Stage 15 (`GET /api/v1/*`) to fetch authoritative, verified data from Cloud Firestore.

### 2.2 System Boundary Governance
- **Server Authority:** The server decides which events are dispatched and to whom. Clients never broadcast events to other clients directly.
- **Zero Firestore Read Amplification:** Real-time push events are routed entirely **in-memory** within the Node.js application process via standard `EventEmitter` primitives. Pushing a real-time update to 50 connected browser tabs incurs **zero Firestore read operations**, preserving the perpetual free-tier budget ceiling.

---

## 3. Current-State Real-Time Inventory (Brownfield Audit)

An inspection of the existing codebase reveals the current baseline state:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD REAL-TIME AUDIT                                │
├──────────────────────────┬──────────────┬──────────────────────────────────────────────┤
│ Current Implementation   │ Disposition  │ Architectural Analysis                       │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Manual Page Refresh      │ REPLACE      │ Current UI requires manual F5 or re-mount    │
│ on HTTP GET              │              │ to observe workflow stage changes.           │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Mock `setInterval` Timers│ REMOVE       │ `VideoRecordPage.tsx` and `VideoEditPage.tsx`│
│ in React Components      │              │ run local intervals simulating video render. │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Snapshot Exporter        │ MODIFY       │ `snapshot-scheduler.service.ts` uses internal│
│ Background Interval      │              │ `setInterval` for hourly GCS exports.        │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ WebSockets / Socket.io   │ NOT PRESENT  │ No WebSocket servers or socket clients exist │
│                          │              │ in `package.json` or `server.ts`.            │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Firestore `onSnapshot`   │ NOT PRESENT  │ No direct Firestore listeners are exposed    │
│ Browser Listeners        │              │ to the client bundle (protects credentials). │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ TypeScript Definitions   │ KEEP         │ `src/types/realtime-architecture.ts` provides│
│ in `realtime-arch.ts`    │              │ canonical event types and Zod schemas.       │
└──────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

---

## 4. Genuine Real-Time Requirements Analysis

BP-CMS is an operational studio workflow system, not a consumer chat or high-frequency trading platform. Every candidate capability is evaluated against ten rigorous architectural questions:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               10-POINT EVALUATION QUESTIONS                            │
├────┬───────────────────────────────────────────────────────────────────────────────────┤
│ 1  │ Does the user actually need immediate updates to perform their work?              │
│ 2  │ Who specifically needs the update (role, assignee, or global team)?               │
│ 3  │ What exact business event causes the update?                                      │
│ 4  │ What underlying domain resource changed?                                          │
│ 5  │ How quickly must the update arrive (latency tolerance: <1s, <5s, or minutes)?     │
│ 6  │ Is eventual consistency acceptable without corrupting business operations?        │
│ 7  │ What happens if the client is disconnected when the event fires?                  │
│ 8  │ Can the client safely refetch state via canonical REST APIs upon reconnecting?    │
│ 9  │ Is real-time required for data correctness or merely for user experience?         │
│ 10 │ What is the deterministic fallback behavior if the real-time stream drops?        │
└────┴───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Real-Time Use-Case Classification Matrix

Applying the 10-point evaluation to all 17 system operations establishes the authoritative classification:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              USE-CASE CLASSIFICATION MATRIX                            │
├────┬──────────────────────┬──────────────────────┬─────────────┬───────────────────────┤
│ #  │ Candidate Use Case   │ Urgency Level        │ Target Lat. │ Classification        │
├────┼──────────────────────┼──────────────────────┼─────────────┼───────────────────────┤
│ 1  │ Workflow Stage Move  │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 2  │ Review Assignment    │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 3  │ Review Status Change │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 4  │ Verification Approval│ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 5  │ Rejection / Rework   │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 6  │ AI Batch Progress    │ NEAR_REALTIME_5S     │ < 3.0s      │ REALTIME BENEFICIAL   │
│ 7  │ Media Ingestion QC   │ NEAR_REALTIME_5S     │ < 3.0s      │ REALTIME BENEFICIAL   │
│ 8  │ Media Availability   │ NEAR_REALTIME_5S     │ < 3.0s      │ REALTIME BENEFICIAL   │
│ 9  │ Archive/Restore Prog │ NEAR_REALTIME_5S     │ < 5.0s      │ REALTIME BENEFICIAL   │
│ 10 │ In-App Notifications │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 11 │ Publishing Status    │ NEAR_REALTIME_5S     │ < 5.0s      │ REALTIME BENEFICIAL   │
│ 12 │ Platform Sync Check  │ NEAR_REALTIME_5S     │ < 5.0s      │ REALTIME BENEFICIAL   │
│ 13 │ Analytics Refresh    │ PERIODIC_BATCH       │ 5–15 min    │ POLLING SUFFICIENT    │
│ 14 │ Performance Scorecard│ PERIODIC_BATCH       │ On Demand   │ REQUEST/RESPONSE SUFF │
│ 15 │ Intelligence Direct. │ STATIC_ON_DEMAND     │ On Demand   │ REQUEST/RESPONSE SUFF │
│ 16 │ Concurrent Edit Warn │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
│ 17 │ System / Job Failure │ IMMEDIATE_SUB_SECOND │ < 1.0s      │ REALTIME REQUIRED     │
└────┴──────────────────────┴──────────────────────┴─────────────┴───────────────────────┘
```

### 5.1 Analysis of Key Classifications
- **Workflow & Reviews (1–5, 10, 16, 17): `REALTIME REQUIRED`.** If a Question is rejected by a Faculty Reviewer in Stage 02, the Question Author must be alerted instantly to prevent wasted effort. If an editor attempts to submit a cut on an item that was already transitioned by the Content Lead, the editor must receive an immediate lock notification to prevent OCC collisions.
- **Media, Jobs & Publishing (6–9, 11, 12): `REALTIME BENEFICIAL`.** File uploads to Google Drive and multi-platform distribution dispatch take between 5 and 60 seconds. Streaming progress signals creates a responsive studio UX, but if an event is dropped, the final state is safely retrieved via standard REST polling.
- **Analytics & Intelligence (13–15): `POLLING SUFFICIENT` / `REQUEST/RESPONSE`.** External social platforms (YouTube, Instagram) update view counts and retention curves asynchronously over hours. Pushing analytics via sub-second real-time streams is technically wasteful and provides zero business value.

---

## 6. Transport Alternatives Evaluation

Every transport option is evaluated across 16 technical criteria against the **₹0–₹100 initial infrastructure investment constraint**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TRANSPORT EVALUATION MATRIX                               │
├──────────────────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ Technical Dimension      │ HTTP Polling │ WebSockets   │ DB Listeners │ SSE (Selected) │
├──────────────────────────┼──────────────┼──────────────┼──────────────┼────────────────┤
│ 1. Initial Monthly Cost  │ ₹0.00        │ ₹0–₹1,500+   │ Risk > ₹0    │ ₹0.00          │
│ 2. Free-Tier Suitability │ Poor (Spam)  │ Moderate     │ Very Poor    │ Excellent      │
│ 3. Latency Performance   │ 5s–30s       │ < 50ms       │ 500ms–2s     │ < 100ms        │
│ 4. Cloud Run Compat.     │ Excellent    │ Moderate     │ Good         │ Native         │
│ 5. Connection Overhead   │ Low          │ High (TCP)   │ High         │ Minimal (HTTP) │
│ 6. Directionality Fit    │ Client Pull  │ Full Duplex  │ Server Push  │ Simplex Push   │
│ 7. Browser Native Client │ Fetch / XHR  │ WebSocket    │ Firebase SDK │ EventSource    │
│ 8. Auto-Reconnection     │ Manual Loop  │ Manual Logic │ SDK Internal │ Built-in       │
│ 9. Last-Event-ID Catchup │ None         │ Custom       │ Snapshot     │ Native Spec    │
│ 10. RBAC Authorization   │ Header/Cookie│ Initial WS   │ Rule-based   │ Standard Auth  │
│ 11. Read Amplification   │ High         │ Zero         │ Extreme      │ Zero (Memory)  │
│ 12. Firewall / Proxy Pen │ Universal    │ Blocked often│ HTTPS        │ Standard HTTPS │
│ 13. Horizontal Scaling   │ Trivial      │ Requires Bus │ Handled by DB│ SSE + Pub/Sub  │
│ 14. Testing Simplicity   │ Trivial      │ Complex      │ Complex      │ Straightforward│
│ 15. Operational Burden   │ Low          │ Moderate/High│ Low          │ Negligible     │
│ 16. Suitability Score    │ 5.2 / 10     │ 7.1 / 10     │ 4.8 / 10     │ 9.4 / 10       │
└──────────────────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
```

### 6.1 Why Direct Firestore Database Listeners Were Rejected
Direct Firestore client SDK listeners (`onSnapshot` in the React frontend) were explicitly rejected for three critical architectural reasons:
1. **Severe Read Amplification & Budget Breach:** Under Firestore pricing, every document delivered via `onSnapshot` counts as a billable document read. If 10 studio users keep dashboards open while 50 items transition, listener churn can exhaust the 50,000 daily free-tier read quota within hours, violating the ₹0–₹100 constraint.
2. **Breach of Server Authority (AP-002):** Exposing collections directly to the browser requires shifting authorization into Firestore Security Rules, fragmenting the server-authoritative RBAC pipeline established in Stage 09.
3. **Over-Coupling to Vendor SDKs:** Binds the React frontend directly to the Google Firebase SDK, making migration to PostgreSQL or another store prohibitive.

### 6.2 Why WebSockets Were Not Selected as Primary
WebSockets provide full-duplex communication, which is necessary for collaborative text editing (like Google Docs) or live multi-user whiteboards. However:
1. **Unnecessary Bidirectional Overhead:** In BP-CMS, 100% of client-to-server mutations traverse strongly-validated, authenticated REST APIs (`POST`, `PUT`, `PATCH`). The browser never needs to send raw binary or text over a reverse socket channel.
2. **Cloud Run Scaling Complications:** In multi-instance Cloud Run deployments, WebSocket connections require sticky sessions or an external Redis Pub/Sub cluster to broadcast events across instances, which costs ~$15–$30/mo, violating the budget ceiling.

---

## 7. Selected Architecture: Hybrid SSE + Adaptive Polling

BP-CMS establishes **Candidate F: Hybrid Architecture** as its canonical real-time model:
1. **Primary Transport — Server-Sent Events (SSE):** Native HTTP streaming (`/api/v1/realtime/stream`) pushing lightweight JSON event notifications from server to client with $<100\text{ms}$ latency.
2. **Secondary Fallback Transport — Adaptive HTTP Polling:** If the client network environment drops SSE, the client gracefully falls back to adaptive polling (`GET /api/v1/notifications` and `GET /api/v1/workflow-instances` every 15s active / 60s background).
3. **Authoritative REST Synchronization:** Upon receiving any SSE notification, the client invalidates its local query cache and refetches authoritative entity data via canonical Stage 15 REST endpoints.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              HYBRID EVENT-DATA FLOW DIAGRAM                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [Client Action]                                                                       │
│         │                                                                              │
│         ▼ 1. POST /api/v1/questions/BP-Q-000142/reviews (Approve)                      │
│  ┌──────────────┐                                                                      │
│  │ Express API  │ ──► 2. Execute Firestore Transaction (Commit State & Audit)          │
│  └──────┬───────┘                                                                      │
│         │                                                                              │
│         ▼ 3. Emit In-Memory Event to Process EventEmitter                              │
│  ┌──────────────┐                                                                      │
│  │ EventEmitter │                                                                      │
│  └──────┬───────┘                                                                      │
│         │                                                                              │
│         ▼ 4. Push Lightweight SSE Signal: `APPROVAL_DECIDED` (<100ms)                  │
│  ┌──────────────────────┐                                                              │
│  │ Client EventSource   │                                                              │
│  │ (Question Author Tab)│                                                              │
│  └──────┬───────────────┘                                                              │
│         │                                                                              │
│         ▼ 5. Invalidate Query Cache & Execute GET /api/v1/questions/BP-Q-000142        │
│  ┌──────────────┐                                                                      │
│  │ Client Cache │ ◄── 6. Return Authoritative Document & Re-render UI                  │
│  └──────────────┘                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Canonical Real-Time Event Model & Taxonomy

### 8.1 Universal Real-Time Event Envelope Schema
Every event transmitted over the SSE stream conforms to the strongly-typed `RealtimeEventEnvelope`:

```typescript
export interface RealtimeEventEnvelope<T = Record<string, unknown>> {
  readonly eventId: string;           // Regex: ^EVT-[0-9]{8}-[0-9]{4}$ (Deterministic sequence)
  readonly type: RealtimeEventType;   // Canonical event enum
  readonly category: EventCategory;   // WORKFLOW, REVIEW, MEDIA, JOB, NOTIFICATION, etc.
  readonly channel: string;           // Target routing channel (hub:*, entity:*, user:*)
  readonly timestamp: string;         // ISO 8601 UTC timestamp
  readonly version: number;           // Concurrency token of target entity
  readonly actorId: string;           // User ID who triggered the mutation (USR-xxxxxx)
  readonly resourceType: string;      // Canonical collection name (e.g. 'questions')
  readonly resourceId: string;        // Canonical entity ID (e.g. 'BP-Q-000142')
  readonly payload: T;                // Lightweight notification payload (No bulky data)
  readonly correlationId?: string;    // Distributed request tracing UUID
}
```

### 8.2 Event Category Taxonomy
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EVENT CATEGORY TAXONOMY                                   │
├──────────────┬───────────────────────────────┬─────────────────────────────────────────┤
│ Category     │ Canonical Event Types         │ Target Channel & Payload Summary        │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ WORKFLOW     │ `WORKFLOW_TRANSITIONED`       │ `hub:production`, `entity:content:*`    │
│              │ `WORKFLOW_STAGE_BLOCKED`      │ { fromStep, toStep, reason, assigneeId }│
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ REVIEW       │ `REVIEW_ASSIGNED`             │ `user:USR-xxxxxx`, `hub:reviews`        │
│              │ `APPROVAL_DECIDED`            │ { reviewId, verdict, defectCount }      │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ MEDIA        │ `MEDIA_PROCESSING_PROGRESS`   │ `entity:video:*`, `hub:production`      │
│              │ `MEDIA_PROCESSING_COMPLETED`  │ { mediaAssetId, percent, sha256Verified}│
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ JOB          │ `JOB_STATUS_UPDATED`          │ `entity:job:*`, `user:USR-xxxxxx`       │
│              │ `JOB_FAILED`                  │ { jobId, jobType, progress, error }     │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ NOTIFICATION │ `NOTIFICATION_DISPATCHED`     │ `user:USR-xxxxxx`                       │
│              │ `NOTIFICATION_DISMISSED`      │ { notificationId, title, severity }     │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ PUBLISHING   │ `PUBLISHING_STATUS_UPDATED`   │ `hub:publishing`, `entity:package:*`    │
│              │ `BROADCAST_CONFIRMED_LIVE`    │ { packageId, platform, liveUrl }        │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ ANALYTICS    │ `ANALYTICS_MILESTONE_INGESTED`│ `hub:analytics`, `entity:content:*`     │
│              │                               │ { contentId, milestone, viewCount }     │
├──────────────┼───────────────────────────────┼─────────────────────────────────────────┤
│ SYSTEM       │ `SYSTEM_HEARTBEAT`            │ `system:broadcast`                      │
│              │ `MAINTENANCE_SCHEDULED`       │ { serverTimestamp, activeConnections }  │
└──────────────┴───────────────────────────────┴─────────────────────────────────────────┘
```

---

## 9. Hierarchical Channel Taxonomy & RBAC Event Gating

### 9.1 Channel Addressing Hierarchy
Clients subscribe to fine-grained event channels matching their active workspace and permissions:
1. **Workspace Hub Channels (`hub:*`):** Broad operational broadcasts for functional workspaces (`hub:questions`, `hub:production`, `hub:publishing`, `hub:analytics`).
2. **Entity Channels (`entity:*`):** Deep focus channels for specific assets (`entity:content:BP-CNT-000142`, `entity:video:BP-V-000089`).
3. **Personal User Channels (`user:*`):** Strictly private notification streams directed to a specific authenticated user (`user:USR-000004`).
4. **System Broadcast (`system:*`):** Platform-wide operational alerts and keepalive heartbeats (`system:broadcast`).

### 9.2 Zero-Trust RBAC Gating on Event Dispatch (AP-004)
The server evaluates the recipient's authorized capabilities before dispatching an event frame over their SSE connection:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RBAC EVENT GATING MATRIX                                  │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ Event Channel / Scope         │ Required Capability           │ Default-Deny Fallback  │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ `hub:questions`               │ `QUESTION:VIEW`               │ Suppress frame delivery│
│ `hub:reviews`                 │ `QUESTION_REVIEW:VIEW`        │ Suppress frame delivery│
│ `hub:production`              │ `VIDEO:VIEW`                  │ Suppress frame delivery│
│ `hub:publishing`              │ `PUBLICATION:VIEW`            │ Suppress frame delivery│
│ `hub:analytics`               │ `PERFORMANCE_RECORD:REVIEW`   │ Suppress frame delivery│
│ `user:USR-xxxxxx`             │ Match `req.user.id`           │ Strict socket isolation│
│ `system:broadcast`            │ Any authenticated session     │ Require valid token    │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┤
```

---

## 10. Connection Lifecycle, Reconnection & Ring Buffer

### 10.1 Connection Lifecycle State Machine
```text
  [INITIALIZE] ──► EventSource connection request to `/api/v1/realtime/stream`
        │
        ▼
  [AUTHENTICATE] ──► Verify `bp_session` cookie or `Authorization: Bearer` header
        │
        ▼
  [AUTHORIZE] ──► Extract `ApiRequestContext` and register client capabilities
        │
        ▼
  [CONNECTED] ──► HTTP 200 with `Content-Type: text/event-stream; charset=utf-8`
        │         Client receives initial `SYSTEM_HEARTBEAT` frame
        │
        ▼
  [STREAMING] ──► Server pushes formatted SSE frames; sends heartbeat every 25s
        │
        ├──(Network Drop / Timeout)──► [DISCONNECTED]
        │                                    │
        ▼                                    ▼
  [CLIENT AUTO-RECONNECT] ◄──────────────────┘ (Native browser retry with exponential backoff)
        │
        ▼ Sends `Last-Event-ID: EVT-20261004-0042`
  [REPLAY FROM RING BUFFER]
        │
        ├──(Found in Buffer)──► Replay missed events ──► Resume [STREAMING]
        │
        └──(Expired / Absent)──► Push `RESYNC_REQUIRED` ──► Client refetches REST APIs
```

### 10.2 In-Memory Ring Buffer Contract
To guarantee seamless recovery across temporary Wi-Fi blips or tab backgrounding:
- The server maintains a rolling **In-Memory Ring Buffer** of the last **500 events** (with a 5-minute rolling expiration).
- When a client reconnects presenting `Last-Event-ID: EVT-YYYYMMDD-XXXX`, the server replays all events with sequence numbers greater than the requested ID before resuming live streaming.
- If the requested ID has fallen out of the buffer, the server emits a special event:
  `event: resync_required`
  Prompting the client to trigger a full query cache invalidation via REST.

### 10.3 Heartbeat & Cloud Run Timeout Defense
Cloud Run terminates HTTP streaming requests if no bytes are transferred for longer than the response timeout. To guarantee connection longevity:
- The server transmits a keepalive comment frame every **25 seconds**:
  `:heartbeat 2026-10-04T02:15:00.000Z\n\n`
- This resets Cloud Run's idle connection timer, allowing streams to persist smoothly up to Cloud Run's 60-minute maximum request ceiling.

---

## 11. Multi-User Behavior & Concurrency Safety

BP-CMS is an active collaborative studio. The real-time architecture prevents multi-user editing collisions without bypassing Stage 08 OCC invariants:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-USER CONCURRENCY PROTOCOL                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Scenario:                                                                              │
│   User A (Scriptwriter) and User B (Content Lead) both view Content `BP-CNT-000142`    │
│                                                                                        │
│ 1. User B approves Script and advances workflow from Step 3 to Step 4.                 │
│ 2. Server commits transaction, advancing `content.version = 5`.                        │
│ 3. Server emits `WORKFLOW_TRANSITIONED` on channel `entity:content:BP-CNT-000142`.     │
│ 4. User A's browser receives event instantly.                                          │
│ 5. UI Action:                                                                          │
│    - If User A has NO unsaved local edits: UI automatically refreshes to Step 4.       │
│    - If User A HAS unsaved local edits: UI displays an unobtrusive conflict warning:   │
│      "This item was updated to Step 4 by Content Lead. Your draft is preserved locally.│
│       Please review changes before submitting."                                        │
│ 6. If User A attempts to submit using stale version 4:                                 │
│    Server rejects mutation with HTTP 409 Conflict (`CONFLICT_OPTIMISTIC_LOCK`).        │
│    Stage 08 OCC invariants are 100% preserved.                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Real-Time Notifications Architecture

In-app notifications operate on a dual-track model:
1. **Durable Persistence (`notifications` collection):** Every assignment, review rejection, and mention generates a persistent document in Firestore (`NOTIF-######`).
2. **Ephemeral Real-Time Push (`user:USR-xxxxxx`):** The server simultaneously emits a `NOTIFICATION_DISPATCHED` event over the user's private SSE stream.
3. **Instant Badge Increment:** The frontend notification bell increments its unread badge count immediately upon event receipt without executing a database query.
4. **Mark as Read:** Clicking the notification fires `PATCH /api/v1/notifications/:id/read`, synchronizing read status across all open tabs.

---

## 13. Cloud Run Compatibility & Horizontal Scaling

### 13.1 Stateless Runtime Alignment
- **Single Container Scale (Initial Phase ₹0–₹100):** Cloud Run concurrency is configured to allow up to 80 concurrent connections per container instance. For the studio team of 5–15 operators, all active connections land comfortably on a single warm container instance. In-memory `EventEmitter` distribution operates at **zero cost** and with **zero operational complexity**.
- **Multi-Instance Horizontal Scaling (Future Trigger):** When studio traffic expands beyond a single container instance, cross-container event fan-out is implemented using an asynchronous broker:
  $$\text{Container A Mutation} \longrightarrow \text{GCP Cloud Pub/Sub (Lightweight Topic)} \longrightarrow \text{Container B SSE Fans}$$
  Because Pub/Sub costs ₹0 for the first 10 GB/month under GCP free tier, this upgrade path preserves the zero-cost invariant when scaling occurs.

---

## 14. Cost & Free-Tier Suitability Analysis

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REAL-TIME COST ANALYSIS MATRIX                            │
├─────────────────────────┬─────────────────────────┬────────────────────────────────────┤
│ Architecture Component  │ Selected Technology     │ Monthly Cost Impact (Initial Phase)│
├─────────────────────────┼─────────────────────────┼────────────────────────────────────┤
│ Real-Time Transport     │ Server-Sent Events (SSE)│ ₹0.00 / month (Native Node.js HTTP)│
│ Event Distribution      │ In-Memory EventEmitter  │ ₹0.00 / month (Zero PaaS fees)     │
│ Database Read Impact    │ Ring Buffer + Reconnect │ ₹0.00 / month (0 Firestore reads)  │
│ External PaaS Services  │ None (Zero Pusher/Ably) │ ₹0.00 / month (Zero vendor lock-in)│
├─────────────────────────┴─────────────────────────┴────────────────────────────────────┤
│ TOTAL PROJECTED REAL-TIME COST:                     ₹0.00 / month (100% Zero-Cost)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Real-Time Failure & Recovery Model

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                REAL-TIME FAILURE MATRIX                                │
├─────┬──────────────────────┬──────────────────────┬───────────────────┬────────────────┤
│ ID  │ Failure Scenario     │ Detection Mechanism  │ System Behavior   │ Recovery Path  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R01 │ Wi-Fi / Network Drop │ Client `error` event │ EventSource auto- │ Replay from    │
│     │                      │ on EventSource       │ retries with back-│ Ring Buffer via│
│     │                      │                      │ off (1s, 2s, 4s)  │ Last-Event-ID  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R02 │ Browser Tab Sleeping │ Page Visibility API  │ Reconnect on tab  │ Query cache    │
│     │ (Backgrounded tab)   │ (`visibilitychange`) │ focus; check ring │ invalidation   │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R03 │ Container Recycling  │ HTTP stream close    │ Client reconnects │ Next container │
│     │ (Cloud Run deploy)   │ (EOF)                │ to new instance   │ issues resync  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R04 │ Ring Buffer Overrun  │ Last-Event-ID older  │ Server emits      │ Client refetch │
│     │ (>5 min disconnect)  │ than buffer window   │ `resync_required` │ via REST APIs  │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R05 │ Session Expiration   │ 401 Unauthorized on  │ Close EventSource;│ User re-logins;│
│     │ during active stream │ reconnect request    │ prompt login modal│ rebuild stream │
├─────┼──────────────────────┼──────────────────────┼───────────────────┼────────────────┤
│ R06 │ Malformed Payload    │ Zod schema validation│ Discard frame; log│ Fetch canonical│
│     │                      │ error in client hook │ client error      │ state via REST │
└─────┴──────────────────────┴──────────────────────┴───────────────────┴────────────────┘
```

---

## 16. Dependencies on Future Architecture Stages

Stage 16 defines the real-time transport boundary. Downstream architecture stages integrate as follows:
- **Stage 17 (Job / Async Architecture):** Asynchronous background workers emit `JOB_STATUS_UPDATED` events during video transcoding, GCS archival, and social platform publishing.
- **Stage 18 (AI Architecture):** Gemini assistive generation streams token progress or batch completion signals via `MEDIA_PROCESSING_PROGRESS`.
- **Stage 19 (Security Architecture):** Security hardening will establish CSRF tokens on connection handshakes and enforce IP rate-limiting on `/api/v1/realtime/stream`.
- **Stage 20 (Analytics Architecture):** Establishes the scheduled batch aggregation rules that trigger periodic `ANALYTICS_MILESTONE_INGESTED` events.
- **Stage 21 (Audit & Observability):** Real-time connection count, event throughput, and ring buffer utilization metrics are exported to Prometheus/Cloud Monitoring.

---

## 17. Authoritative Real-Time Architecture Decision

```text
================================================================================
REAL-TIME ARCHITECTURE DECISION (RTR-001)
================================================================================
Decision:            ADOPT CANDIDATE F: HYBRID SSE + ADAPTIVE POLLING
Primary Transport:   Server-Sent Events (SSE) via `/api/v1/realtime/stream`
Secondary Fallback:  Adaptive HTTP Polling (15s active / 60s background)
In-Memory Engine:    Node.js EventEmitter with 500-Event Ring Buffer
Data Sync Axiom:     Events are notification signals; state refetched via REST
Read Cost Guard:     0 Firestore reads incurred during event dispatch
Total Monthly Cost:  ₹0.00 / month (Fully compliant with ₹0–₹100 constraint)
================================================================================
```

### 17.1 Rationale for Decision
1. **Zero Cash Outlay:** Implemented entirely using native Node.js HTTP streaming without requiring commercial WebSocket brokers, Redis clusters, or third-party subscription tiers.
2. **Directionality Match:** Studio workflows require server-to-client notifications (stage advancements, review alerts, progress meters); upstream actions execute via REST APIs.
3. **Simplicity & Resilience:** The native browser `EventSource` API handles reconnections, backoff, and event replay (`Last-Event-ID`) natively with zero frontend runtime dependencies.

---

## 18. Decision & Conflict Registers

### 18.1 Real-Time Decision Register (RTR)
- **RTR-001 (Transport Selection):** Selected SSE over WebSockets and direct Firestore listeners.
- **RTR-002 (In-Memory Fan-out):** Selected single-process EventEmitter with 500-slot ring buffer for initial phase.
- **RTR-003 (Heartbeat Cadence):** Set 25-second keepalive interval to eliminate Cloud Run gateway timeouts.
- **RTR-004 (Cache Invalidation Pattern):** Mandated that events trigger REST refetches rather than carrying entire document state trees.

### 18.2 Real-Time Conflict Register (RTCR)
- **RTCR-001 (Mock Intervals vs. Live Stream):** Brownfield UI used mock `setInterval` loops. Resolved: Replaced by canonical `RealtimeEventEnvelope` contracts; physical wiring in Stage 27.
- **RTCR-002 (Firestore Read Amplification Risk):** Early concepts proposed client-side `onSnapshot`. Resolved: Rejected to prevent exhausting daily free-tier read limits.

---

## 19. Downstream Implementation Contract

Downstream stages must implement the contracts defined herein:
- **Stage 27 (Implementation):**
  1. Implement Express SSE streaming route handler at `GET /api/v1/realtime/stream`.
  2. Implement `RealtimeEventBroadcaster` wrapping Node.js `EventEmitter`.
  3. Implement the in-memory 500-event ring buffer with `Last-Event-ID` lookup.
  4. Implement React `useRealtimeSubscription` custom hook with auto-reconnect and query cache invalidation.
- **Stage 28 (Integration & Testing):**
  1. Test SSE connection establishment with valid session cookie.
  2. Verify 401 Unauthorized rejection when unauthenticated.
  3. Verify RBAC channel filtering (e.g. non-faculty cannot receive review queue events).
  4. Test ring buffer event replay on simulated Wi-Fi disconnect.

---

## 20. Traceability Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STAGE 16 TRACEABILITY MATRIX                              │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ Upstream Principle / Input │ Stage 16 Contract Section   │ Downstream Implementation   │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ AP-002 (Server Authorit.)  │ Section 2.1, 7              │ Stage 27 (Event Router)     │
│ AP-004 (RBAC Gating)       │ Section 9.2                 │ Stage 27 (Capability Filter)│
│ AP-005 (OCC Versioning)    │ Section 11                  │ Stage 27 (Conflict Guard)   │
│ Stage 07 (15-Step Workflow)│ Section 5, 8.2              │ Stage 27 (Workflow Emitter) │
│ Stage 08 (State Model)     │ Section 2.1, 5              │ Stage 27 (State Machine)    │
│ Stage 09 (RBAC Matrix)     │ Section 9.2                 │ Stage 27 (Auth Middleware)  │
│ Stage 12 (Zero-Cost Invar) │ Section 6.1, 14             │ Stage 27 (Memory Broadcast) │
│ Stage 15 (API Contracts)   │ Section 2.1, 7              │ Stage 27 (REST Refetch)     │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 21. Architectural Invariants

The Real-Time Architecture enforces **14 non-negotiable invariants**:
1. **Events Are Signals, Not State:** Real-time events coordinate cache invalidation; authoritative business data resides in Firestore and is retrieved via REST.
2. **Zero Direct Database Listeners:** Frontend clients never connect directly to Firestore snapshot listeners.
3. **Strict Zero-Cost Compliance:** Real-time infrastructure operates 100% within free tiers (₹0.00/month initial outlay).
4. **Zero-Trust Capability Enforcement:** Events are dispatched only to connected clients holding verified `RESOURCE:ACTION` capabilities.
5. **Private User Channel Isolation:** Personal notification channels (`user:USR-xxxxxx`) are strictly accessible only by the verified token owner.
6. **No Client-to-Client Broadcasting:** All events originate from server-side domain mutations.
7. **Deterministic Event IDs:** Events carry sequential identifiers (`EVT-YYYYMMDD-XXXX`) enabling gap detection and ring buffer replay.
8. **Cloud Run Timeout Resilience:** Streams emit periodic comment heartbeats every 25 seconds to maintain active HTTP connections.
9. **OCC Invariant Preservation:** Real-time conflict notifications preserve Stage 08 OCC versioning; clients cannot force-overwrite newer state.
10. **Universal Fallback Availability:** If SSE is blocked by client proxies, the application gracefully degrades to adaptive polling.
11. **Lightweight Event Payloads:** Payloads contain IDs and status tokens; bulky document trees and binary blobs are prohibited.
12. **Transient Event Non-Persistence:** Real-time push frames are not duplicated into permanent event stores unless designated as business audit logs.
13. **Idempotent Client Invalidation:** Receiving duplicate event frames causes idempotent query invalidation without side effects.
14. **Graceful Disconnect Recovery:** Clients automatically resynchronize state via canonical REST APIs upon stream re-establishment.

---

## 22. Completion Checklist & Sign-off

- [x] Defined genuine real-time requirements across all 17 candidate operational use cases.
- [x] Evaluated all four transport alternatives (Polling, WebSockets, DB Listeners, SSE).
- [x] Enforced the hard ₹0–₹100 initial infrastructure investment constraint (₹0.00/mo selected).
- [x] Codified the Fundamental Real-Time Axiom (events as signals, not state).
- [x] Established Server-Sent Events (SSE) as primary transport and Adaptive Polling as fallback.
- [x] Specified canonical `RealtimeEventEnvelope` schema and 10-category event taxonomy.
- [x] Codified hierarchical channel taxonomy (`hub:*`, `entity:*`, `user:*`, `system:*`).
- [x] Defined zero-trust RBAC capability gating on event dispatch.
- [x] Specified connection lifecycle, 25-second keepalive heartbeat, and 500-slot ring buffer.
- [x] Defined multi-user concurrency and OCC conflict warning protocol.
- [x] Formulated Cloud Run stateless runtime compatibility and scaling roadmap.
- [x] Documented Decision (RTR) and Conflict (RTCR) registers.
- [x] Established downstream implementation contract for Stage 27 and 28.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or physical infrastructure created.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 16 — REAL-TIME ARCHITECTURE
================================================================================
Artifact:            docs/architecture/16-REALTIME-ARCHITECTURE.md
Version:             16.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 16 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Realtime Infrastructure Added)
Stage Boundary:      HALTED AT STAGE 16. Awaiting Stage 17 Instruction.
================================================================================
```

---

## 23. Anti-Overclaim Statement

> **CONFIRMATION:**
> SDLC Stage 16 is an ARCHITECTURE ONLY stage.
> 
> **REAL-TIME ARCHITECTURE CONTRACT COMPLETE.**
> **REAL-TIME RUNTIME IMPLEMENTATION NOT PERFORMED.**
> 
> No SSE route handlers, WebSocket listeners, or client polling loops were implemented. No external packages (Socket.IO, Redis, Pub/Sub) were installed. No database schemas were altered. No frontend contexts were modified. All physical SSE route construction, event emitter wiring, and automated integration tests are deferred strictly to **Stage 27 (Implementation)** and **Stage 28 (Integration & Testing)**.
