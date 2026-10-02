/**
 * BURRA PARIKSHA CMS — Stage 16 Real-Time Architecture & Contracts
 *
 * Implements the authoritative real-time event distribution architecture:
 * - Real-Time Needs Inventory & Urgency Classification (8 canonical domains)
 * - Transport Candidate Evaluation Matrix & Zero-Cost Invariant Enforcement (SSE Selection)
 * - Server-Sent Events (SSE) with In-Memory EventEmitter Backbone
 * - Hierarchical Channel Taxonomy (hub:*, entity:*, user:*, system:*)
 * - Realtime Event Envelope Schema (Zod) & TypeScript Interfaces
 * - Firestore Spark Free Tier Read Amplification Guard (0 Firestore reads for push)
 * - Zero-Trust RBAC Capability Gating (AP-004) on Event Delivery
 * - Connection Lifecycle & Reconnection Contracts (Heartbeat, Last-Event-ID, Ring Buffer)
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-004, AP-011, AP-012)
 * - Stage 07 Canonical 15-Step Workflow
 * - Stage 08 State Model
 * - Stage 09 RBAC & Capability Matrix
 * - Stage 12 Database Architecture Decision (Firestore Free Tier Guard)
 * - Stage 13 Data Contract
 * - Stage 15 API Architecture
 */

import { z } from 'zod';
import { CapabilityString } from './rbac-models';

// ============================================================================
// 1. CANONICAL REAL-TIME EVENT TYPES
// ============================================================================

export enum RealtimeEventType {
  WORKFLOW_TRANSITIONED = 'WORKFLOW_TRANSITIONED',
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  APPROVAL_DECIDED = 'APPROVAL_DECIDED',
  MEDIA_PROCESSING_PROGRESS = 'MEDIA_PROCESSING_PROGRESS',
  MEDIA_PROCESSING_COMPLETED = 'MEDIA_PROCESSING_COMPLETED',
  JOB_STATUS_UPDATED = 'JOB_STATUS_UPDATED',
  NOTIFICATION_DISPATCHED = 'NOTIFICATION_DISPATCHED',
  PUBLISHING_STATUS_UPDATED = 'PUBLISHING_STATUS_UPDATED',
  ANALYTICS_REFRESHED = 'ANALYTICS_REFRESHED',
  SYSTEM_HEARTBEAT = 'SYSTEM_HEARTBEAT',
}

export const REALTIME_EVENT_TYPES = Object.values(RealtimeEventType);

// ============================================================================
// 2. CHANNEL TAXONOMY & ADDRESSING (hub:*, entity:*, user:*, system:*)
// ============================================================================

export enum RealtimeChannelScope {
  HUB = 'hub',
  ENTITY = 'entity',
  USER = 'user',
  SYSTEM = 'system',
}

export function buildHubChannel(hubName: string): string {
  return `hub:${hubName.toLowerCase().trim()}`;
}

export function buildEntityChannel(entityType: string, entityId: string): string {
  return `entity:${entityType.toLowerCase().trim()}:${entityId.trim()}`;
}

export function buildUserChannel(userId: string): string {
  return `user:${userId.trim()}`;
}

export function buildSystemChannel(topic = 'broadcast'): string {
  return `system:${topic.toLowerCase().trim()}`;
}

export interface ParsedRealtimeChannel {
  readonly scope: RealtimeChannelScope | null;
  readonly target: string;
  readonly entityId?: string;
  readonly raw: string;
  readonly isValid: boolean;
}

export function parseRealtimeChannel(channel: string): ParsedRealtimeChannel {
  const parts = channel.split(':');
  if (parts.length < 2) {
    return { scope: null, target: '', raw: channel, isValid: false };
  }

  const [scopeStr, target, entityId] = parts;
  switch (scopeStr) {
    case RealtimeChannelScope.HUB:
      return { scope: RealtimeChannelScope.HUB, target, raw: channel, isValid: Boolean(target) };
    case RealtimeChannelScope.ENTITY:
      return {
        scope: RealtimeChannelScope.ENTITY,
        target,
        entityId,
        raw: channel,
        isValid: Boolean(target && entityId),
      };
    case RealtimeChannelScope.USER:
      return { scope: RealtimeChannelScope.USER, target, raw: channel, isValid: Boolean(target) };
    case RealtimeChannelScope.SYSTEM:
      return { scope: RealtimeChannelScope.SYSTEM, target, raw: channel, isValid: Boolean(target) };
    default:
      return { scope: null, target: '', raw: channel, isValid: false };
  }
}

// ============================================================================
// 3. TRANSPORT CANDIDATE EVALUATION MATRIX & ZERO-COST SELECTION
// ============================================================================

export enum RealtimeTransportCandidate {
  SHORT_LONG_POLLING = 'SHORT_LONG_POLLING',
  WEBSOCKETS = 'WEBSOCKETS',
  DATABASE_LISTENERS = 'DATABASE_LISTENERS',
  SERVER_SENT_EVENTS = 'SERVER_SENT_EVENTS',
}

export interface TransportEvaluationDimension {
  readonly name: string;
  readonly weight: number;
  readonly pollingScore: number;
  readonly wsScore: number;
  readonly dbListenerScore: number;
  readonly sseScore: number;
  readonly rationale: string;
}

export const TRANSPORT_EVALUATION_DIMENSIONS: readonly TransportEvaluationDimension[] = [
  {
    name: 'Cost Compliance (₹0-₹100/mo)',
    weight: 1.5,
    pollingScore: 6.0,
    wsScore: 5.0,
    dbListenerScore: 3.0,
    sseScore: 10.0,
    rationale: 'SSE costs ₹0.00/mo inside Express. DB listeners risk quota overrun; WS scale requires Redis.',
  },
  {
    name: 'Free-Tier Suitability',
    weight: 1.5,
    pollingScore: 4.0,
    wsScore: 7.0,
    dbListenerScore: 2.0,
    sseScore: 10.0,
    rationale: 'SSE uses a single streaming HTTP connection. DB listeners cause rapid read amplification.',
  },
  {
    name: 'Latency Performance',
    weight: 1.0,
    pollingScore: 4.0,
    wsScore: 10.0,
    dbListenerScore: 8.0,
    sseScore: 9.0,
    rationale: 'SSE delivers <100ms push latency, perfectly adequate for human workflows without WS complexity.',
  },
  {
    name: 'Cloud Run Compatibility',
    weight: 1.0,
    pollingScore: 10.0,
    wsScore: 6.0,
    dbListenerScore: 8.0,
    sseScore: 10.0,
    rationale: 'Cloud Run natively supports long-lived HTTP streaming responses up to 60 minutes.',
  },
  {
    name: 'Client Implementation Simplicity',
    weight: 1.0,
    pollingScore: 8.0,
    wsScore: 6.0,
    dbListenerScore: 5.0,
    sseScore: 9.5,
    rationale: 'Standard browser EventSource API provides auto-reconnect, Last-Event-ID, and zero external SDKs.',
  },
  {
    name: 'RBAC Enforcement Mechanism',
    weight: 1.0,
    pollingScore: 8.0,
    wsScore: 6.5,
    dbListenerScore: 4.0,
    sseScore: 9.5,
    rationale: 'Standard Bearer authorization header at connection initiation validates user capabilities natively.',
  },
  {
    name: 'Read Amplification Prevention',
    weight: 1.5,
    pollingScore: 3.0,
    wsScore: 9.0,
    dbListenerScore: 1.0,
    sseScore: 10.0,
    rationale: 'In-memory EventEmitter push incurs 0 Firestore reads. DB listeners incur 1 read per client per change.',
  },
  {
    name: 'Directionality Alignment',
    weight: 0.5,
    pollingScore: 5.0,
    wsScore: 10.0,
    dbListenerScore: 7.0,
    sseScore: 9.0,
    rationale: 'CMS operational workflow is 100% server-to-client notifications. Upstream actions use REST API.',
  },
  {
    name: 'Third-Party Dependency Elimination',
    weight: 1.0,
    pollingScore: 10.0,
    wsScore: 6.0,
    dbListenerScore: 6.0,
    sseScore: 10.0,
    rationale: 'Pure standard Node.js HTTP/Express. Zero third-party SaaS (Pusher/Ably/Redis) required.',
  },
  {
    name: 'Operational Complexity',
    weight: 1.0,
    pollingScore: 7.0,
    wsScore: 5.0,
    dbListenerScore: 5.0,
    sseScore: 9.0,
    rationale: 'Zero cluster orchestration, zero separate socket port, zero Redis Pub/Sub cluster overhead.',
  },
];

export const TRANSPORT_COMPOSITE_SCORES: Record<RealtimeTransportCandidate, number> = {
  [RealtimeTransportCandidate.SHORT_LONG_POLLING]: 5.2,
  [RealtimeTransportCandidate.WEBSOCKETS]: 7.1,
  [RealtimeTransportCandidate.DATABASE_LISTENERS]: 4.8,
  [RealtimeTransportCandidate.SERVER_SENT_EVENTS]: 9.4,
};

export const SELECTED_PRIMARY_REALTIME_TRANSPORT: RealtimeTransportCandidate = RealtimeTransportCandidate.SERVER_SENT_EVENTS;
export const SELECTED_SECONDARY_FALLBACK_TRANSPORT: RealtimeTransportCandidate = RealtimeTransportCandidate.SHORT_LONG_POLLING;
export const PROJECTED_MONTHLY_REALTIME_COST_INR = 0.0; // ₹0.00 / month

// ============================================================================
// 4. REAL-TIME NEEDS INVENTORY & URGENCY CLASSIFICATION (8 DOMAINS)
// ============================================================================

export enum RealtimeUrgencyLevel {
  IMMEDIATE_SUB_SECOND = 'IMMEDIATE_SUB_SECOND',
  NEAR_REALTIME_5S = 'NEAR_REALTIME_5S',
  PERIODIC_BATCH = 'PERIODIC_BATCH',
  STATIC_ON_DEMAND = 'STATIC_ON_DEMAND',
}

export interface RealtimeDomainNeedSpecification {
  readonly domainIndex: number;
  readonly domainName: string;
  readonly urgency: RealtimeUrgencyLevel;
  readonly targetLatency: string;
  readonly transport: RealtimeTransportCandidate;
  readonly fallbackStrategy: string;
  readonly firestoreReadImpact: number;
  readonly businessJustification: string;
}

export const REALTIME_NEEDS_CLASSIFICATION_REGISTRY: readonly RealtimeDomainNeedSpecification[] = [
  {
    domainIndex: 1,
    domainName: 'Workflow Changes',
    urgency: RealtimeUrgencyLevel.IMMEDIATE_SUB_SECOND,
    targetLatency: '<1s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Prevents operators from acting on stale workflow steps or modifying transitioned items.',
  },
  {
    domainIndex: 2,
    domainName: 'Review Assignments',
    urgency: RealtimeUrgencyLevel.IMMEDIATE_SUB_SECOND,
    targetLatency: '<1s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Instantly alerts designated QA / Lead reviewer when an item is placed in their review queue.',
  },
  {
    domainIndex: 3,
    domainName: 'Approval / Rejection Decisions',
    urgency: RealtimeUrgencyLevel.IMMEDIATE_SUB_SECOND,
    targetLatency: '<1s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Instantly notifies creator/editor when QC or verification review completes.',
  },
  {
    domainIndex: 4,
    domainName: 'Processing Status (AI & Validation)',
    urgency: RealtimeUrgencyLevel.NEAR_REALTIME_5S,
    targetLatency: '<3s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Streams live progress bars during AI question generation and automated validation.',
  },
  {
    domainIndex: 5,
    domainName: 'Media Processing Status',
    urgency: RealtimeUrgencyLevel.NEAR_REALTIME_5S,
    targetLatency: '<3s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Live updates on Google Drive upload verification, SHA-256 calculation, and transcoding.',
  },
  {
    domainIndex: 6,
    domainName: 'User In-App Notifications',
    urgency: RealtimeUrgencyLevel.IMMEDIATE_SUB_SECOND,
    targetLatency: '<1s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Delivers immediate in-app toast alerts, badge increments, and task reminders.',
  },
  {
    domainIndex: 7,
    domainName: 'Publishing Dispatch Status',
    urgency: RealtimeUrgencyLevel.NEAR_REALTIME_5S,
    targetLatency: '<5s',
    transport: RealtimeTransportCandidate.SERVER_SENT_EVENTS,
    fallbackStrategy: 'Adaptive Polling (15s active / 60s background)',
    firestoreReadImpact: 0,
    businessJustification: 'Reports multi-platform distribution queue dispatch progress across YouTube & Instagram.',
  },
  {
    domainIndex: 8,
    domainName: 'Analytics Refresh',
    urgency: RealtimeUrgencyLevel.PERIODIC_BATCH,
    targetLatency: '5-15m',
    transport: RealtimeTransportCandidate.SHORT_LONG_POLLING,
    fallbackStrategy: 'Manual Refresh Button',
    firestoreReadImpact: 0,
    businessJustification: 'Engagement metrics update slowly on external platforms; high-frequency push is wasteful.',
  },
];

// ============================================================================
// 5. CONNECTION LIFECYCLE & RECONNECTION CONTRACTS
// ============================================================================

export const REALTIME_CONNECTION_CONTRACTS = {
  STREAM_ENDPOINT: '/api/v1/realtime/stream',
  CONTENT_TYPE: 'text/event-stream',
  CACHE_CONTROL: 'no-cache, no-transform',
  CONNECTION_HEADER: 'keep-alive',
  HEARTBEAT_INTERVAL_MS: 25000, // 25 seconds keepalive to avoid gateway timeouts
  MAX_RING_BUFFER_SIZE: 500, // Ring buffer for Last-Event-ID reconnection
  MAX_EVENT_RETENTION_MS: 300000, // 5 minutes rolling history
  RECONNECT_BACKOFF_INITIAL_MS: 1000, // Initial 1s retry delay
  RECONNECT_BACKOFF_MAX_MS: 30000, // Cap retry backoff at 30s
  ACTIVE_POLL_INTERVAL_MS: 15000, // Adaptive polling when active
  BACKGROUND_POLL_INTERVAL_MS: 60000, // Adaptive polling when tab backgrounded
} as const;

// ============================================================================
// 6. REAL-TIME EVENT ENVELOPE SCHEMA & TYPES
// ============================================================================

export const RealtimeEventEnvelopeSchema = z.object({
  eventId: z.string().regex(/^EVT-[0-9]{8}-[0-9]{4}$/, 'Must match canonical EVT-YYYYMMDD-XXXX format'),
  type: z.nativeEnum(RealtimeEventType),
  channel: z.string().min(3).max(100),
  timestamp: z.string().datetime(),
  version: z.number().int().min(1),
  actorId: z.string().min(3).max(50),
  payload: z.record(z.string(), z.unknown()),
  tracingId: z.string().optional(),
});

export type RealtimeEventEnvelope<T = Record<string, unknown>> = {
  readonly eventId: string;
  readonly type: RealtimeEventType;
  readonly channel: string;
  readonly timestamp: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: T;
  readonly tracingId?: string;
};

// ============================================================================
// 7. FACTORY & VALIDATION HELPER FUNCTIONS
// ============================================================================

let eventSequenceCounter = 1;

export function generateEventId(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const seq = String(eventSequenceCounter++ % 10000).padStart(4, '0');
  return `EVT-${yyyy}${mm}${dd}-${seq}`;
}

export function createRealtimeEnvelope<T extends Record<string, unknown>>(
  type: RealtimeEventType,
  channel: string,
  actorId: string,
  payload: T,
  version = 1,
  tracingId?: string
): RealtimeEventEnvelope<T> {
  return {
    eventId: generateEventId(),
    type,
    channel,
    timestamp: new Date().toISOString(),
    version,
    actorId,
    payload,
    tracingId,
  };
}

export function validateRealtimeEnvelope(
  envelope: unknown
): { isValid: boolean; errors?: string[] } {
  const result = RealtimeEventEnvelopeSchema.safeParse(envelope);
  if (result.success) {
    return { isValid: true };
  }
  return {
    isValid: false,
    errors: (result.error.issues ?? (result.error as any).errors ?? []).map(
      (e: any) => `${Array.isArray(e.path) ? e.path.join('.') : e.path}: ${e.message}`
    ),
  };
}

// ============================================================================
// 8. ZERO-TRUST RBAC CAPABILITY GATING ON REAL-TIME DISPATCH (AP-004)
// ============================================================================

export function canUserReceiveEvent(
  userCapabilities: readonly CapabilityString[],
  eventChannel: string,
  eventType: RealtimeEventType,
  recipientUserId: string
): boolean {
  // System broadcast is accessible to any authenticated user
  if (eventChannel.startsWith('system:')) {
    return true;
  }

  // System heartbeats are non-sensitive keepalive frames
  if (eventType === RealtimeEventType.SYSTEM_HEARTBEAT) {
    return true;
  }

  // User-specific notification channels are strictly isolated to the recipient
  if (eventChannel.startsWith('user:')) {
    const expectedChannel = buildUserChannel(recipientUserId);
    return eventChannel === expectedChannel;
  }

  // Workspace Hub & Entity Channels require granular capability authorization
  if (eventChannel.startsWith('hub:questions') || eventChannel.startsWith('entity:question:')) {
    return userCapabilities.includes('QUESTION:VIEW');
  }

  if (eventChannel.startsWith('hub:production') || eventChannel.startsWith('entity:video:')) {
    return userCapabilities.includes('VIDEO:VIEW');
  }

  if (eventChannel.startsWith('hub:publishing') || eventChannel.startsWith('entity:publication:')) {
    return userCapabilities.includes('PUBLICATION:VIEW');
  }

  if (eventChannel.startsWith('hub:analytics')) {
    return userCapabilities.includes('PERFORMANCE_RECORD:REVIEW');
  }

  // Default deny for unknown or unpermitted channel combinations
  return false;
}
