# FEATURE CONTRACT: FC-018-REALTIME-SSE-NOTIFICATIONS

## 1. Feature Identity
- **Feature ID**: FC-018
- **Feature Name**: Realtime SSE Bus & In-App Alerts
- **Business Area**: UX & Realtime / Server-Sent Events & Notifications
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P2 (UX Enhancement)
- **Owner / Domain**: Realtime & Communications Context
- **Related Workflow Stage(s)**: Cross-cutting (Updates all 15 workflow hubs)

---

## 2. Requirement
- **Business Requirement**: NFR-001 (Responsive Real-Time Experience) & BR-009 (Collaborative Multi-User Operations).
- **User Problem**: Users working on different stages of content manufacturing must manually refresh pages to see when a question is approved, a video is uploaded, or a revision is requested.
- **Business Purpose**: Provide a lightweight, in-process Server-Sent Events (SSE) bus broadcasting real-time state changes to connected browsers, coupled with persistent in-app notifications and automatic HTTP polling fallback.
- **Expected Capability**:
  - `ISSEEventBus` in-process event emitter broadcasting typed events (`workflow.transitioned`, `review.submitted`, `job.completed`).
  - Authenticated SSE streaming endpoint: `GET /api/v1/realtime` with auto-heartbeat ($30\text{s}$).
  - Browser SSE hook (`useRealtime()`) with exponential backoff and seamless fallback to 15-second HTTP polling.
  - In-app notification bell UI displaying unread alerts and direct links to affected assets.
  - Notification management APIs: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`.
- **Scope**: In-process SSE bus, streaming route, browser hook, notification collection & bell UI.
- **Explicit Non-Scope**: WebSockets, third-party push notification providers (OneSignal/Firebase Cloud Messaging).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - User opens Question Hub. An SME approves a question in another browser.
  - Within $< 500\text{ms}$, the first browser's Question Hub automatically updates its table row without a manual refresh.
  - Assigned author receives an in-app notification badge on the bell icon.
- **Graceful Degradation Acceptance**:
  - If network firewall or corporate proxy blocks SSE streaming, browser hook detects disconnection and seamlessly switches to 15-second HTTP polling without throwing user errors.
- **Cost Acceptance**:
  - In-process Node.js `EventEmitter` consumes ₹0.00 infrastructure cost (no paid Redis or external Pub/Sub instances).
- **Audit Acceptance**:
  - Notification delivery and read status updates tracked.

---

## 4. Domain Entities
- **Entities Involved**: `RealtimeEvent`, `Notification`, `ClientSubscription`.
- **Entity Ownership**: Realtime Communications Context.
- **Relationships**: A `Notification` belongs to a specific `User`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `recipientUserId`, `title`, `message`, `entityType`, `entityId`, `createdAt`.
- **Mutable Fields**: `isRead`, `readAt`.
- **Lifecycle**: `UNREAD` $\to$ `READ`.

---

## 5. Database / Data Contract
- **Collections Involved**: `notifications`.
- **Document Structure**:
  ```typescript
  export interface NotificationDocument extends BaseEntity {
    id: string; // not_ + UUIDv4
    recipientUserId: string;
    title: string;
    message: string;
    actionUrl: string;
    entityType: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'PACKAGE';
    entityId: string;
    isRead: boolean;
    readAt?: string;
  }
  ```
- **Indexes**: Composite index on `(recipientUserId, isRead, createdAt DESC)`.
- **Source of Truth**: Firestore `notifications` collection for persistent alerts; in-memory bus for ephemeral broadcasts.

---

## 6. API Contract
### 6.1 `GET /api/v1/realtime`
- **Authentication**: Required (Cookie / Bearer).
- **Headers**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
- **Stream Format**: `event: <eventType>\ndata: <JSON>\n\n`.

### 6.2 `GET /api/v1/notifications`
- **Authentication**: Required.
- **Response Schema**: `ApiResponseEnvelope<{ notifications: NotificationDocument[], unreadCount: number }>`.

### 6.3 `PATCH /api/v1/notifications/:id/read`
- **Authentication**: Required.
- **Response Schema**: `ApiResponseEnvelope<{ success: true }>`.

---

## 7. Frontend Contract
- **Canonical Route**: Integrated across entire application shell header (`<NotificationBell>`).
- **Allowed Roles / Capabilities**: All authenticated users.
- **UI Behavior**:
  - Bell icon with unread count badge.
  - Dropdown drawer listing recent alerts with relative timestamps (*"5m ago"*).
  - Clicking notification marks it read and navigates to the target workspace route.

---

## 8. RBAC / Capability Contract
- **Access**: Any authenticated user can subscribe to the SSE stream and read their own notifications (`recipientUserId === req.user.id`).

---

## 9. Workflow Contract
- **Non-Blocking Rule**: Realtime is strictly a UX notification layer. Core business transactions succeed even if zero clients are listening to SSE.

---

## 10. Validation Contract
- **Event Schema**: Events must match standard `RealtimeEventPayload` interface.

---

## 11. Error Contract
- `401 UNAUTHORIZED`: Unauthenticated connection to SSE stream.
- `404 NOT_FOUND`: Notification ID not found.

---

## 12. Audit Contract
- **Events**: `NOTIFICATION_DISPATCHED`, `NOTIFICATION_READ`.
- **Payload**: `notificationId`, `recipientUserId`, `entityId`.

---

## 13. Realtime Contract
- Self-referential: Implements the SSE broadcasting system.

---

## 14. Job / Async Contract
- **Async Delivery**: Notifications are dispatched asynchronously via in-process setImmediate or background worker.

---

## 15. AI Contract
- **Applicable**: Dispatches alert when long-running AI batch proposals complete.

---

## 16. Media Contract
- **Applicable**: Dispatches alert when video upload/transcode finishes.

---

## 17. Analytics Contract
- **Applicable**: No.

---

## 18. Security Contract
- **Client Segregation**: SSE events filtered by user ID / role so private review notes are only broadcast to authorized users.

---

## 19. Observability Contract
- **Metrics**: Gauge `realtime.active_sse_connections`, counter `realtime.events_dispatched_total`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. In-memory Node.js streaming. Cloud Run charges only for active CPU time, minimized via 30s heartbeat.

---

## 21. Migration Contract
- **Legacy Parity**: Replaces manual page reloads and WhatsApp notification threads.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-RT-01`: SSE event bus dispatches events to registered client response streams.
  - `TC-RT-02`: Heartbeat ping keeps connection alive.
  - `TC-RT-03`: Disconnected clients automatically removed from active listener pool.
- **API Tests**:
  - `TC-RT-04`: `GET /api/v1/realtime` sets correct SSE headers.
  - `TC-RT-05`: Notification unread count updates correctly on mark-read.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005.
- **Stage 25 Node**: `D-20 (Notifications)`, `D-24 (Realtime SSE)`.
- **Downstream Consumers**: Frontend Studio Hubs.

---

## 24. Implementation Sequence
1. Define Realtime and Notification schemas (`src/types/realtime.ts`).
2. Implement in-memory `SSEEventBus` (`src/lib/realtime/sse-bus.ts`).
3. Implement `GET /api/v1/realtime` stream handler and heartbeat interval.
4. Implement `NotificationRepository` and route handlers.
5. Create React `useRealtime()` hook and `<NotificationBell>` header component.
6. Verify against `TC-RT-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Clients fall back to HTTP polling.

---

## 27. Feature Completion Criteria
- [ ] SSE stream connects and sends 30s heartbeats.
- [ ] UI auto-updates workspace data on workflow state change.
- [ ] Fallback to 15s polling verified when SSE connection severed.
- [ ] Notification bell badge updates unread count.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 15, 16, and 22.

---

## 29. Traceability
- **Stage 01**: NFR-001, BR-009
- **Stage 04**: Event Decoupling P-07
- **Stage 10**: Global Shell Notification Architecture
- **Stage 13**: `notifications` schema
- **Stage 15**: `/api/v1/realtime`, `/api/v1/notifications/*`
- **Stage 16**: Authoritative Realtime SSE Architecture
- **Stage 24**: TC-RT01..05
- **Stage 25**: Nodes `D-20`, `D-24`
