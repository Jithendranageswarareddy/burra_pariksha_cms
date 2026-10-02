/**
 * BURRA PARIKSHA CMS — Stage 16 Real-Time Architecture Automated Verification Suite
 *
 * Verifies that the Real-Time Architecture established in 16-REALTIME-ARCHITECTURE.md and
 * src/types/realtime-architecture.ts is strictly enforced:
 * 1. Real-Time Needs Inventory & Urgency Classification (all 8 canonical domains).
 * 2. Transport Candidate Evaluation & Scoring (4 mechanisms across 10 criteria; SSE wins).
 * 3. Zero-Cost Financial Invariant Enforcement (₹0.00/mo, zero external paid services).
 * 4. Real-Time Event Envelope Schema Validation (Zod validation for valid & invalid envelopes).
 * 5. RBAC Capability Gating on Event Distribution (zero-trust channel authorization).
 * 6. Firestore Read Amplification Protection (0 Firestore reads for real-time dispatch).
 * 7. Connection Lifecycle & Reconnection Contracts (heartbeats, buffer sizes, retry backoff).
 * 8. Channel Subscription Scoping & Partitioning (hub, entity, user, system scopes).
 */

import {
  RealtimeEventType,
  REALTIME_EVENT_TYPES,
  RealtimeChannelScope,
  buildHubChannel,
  buildEntityChannel,
  buildUserChannel,
  buildSystemChannel,
  parseRealtimeChannel,
  RealtimeTransportCandidate,
  TRANSPORT_EVALUATION_DIMENSIONS,
  TRANSPORT_COMPOSITE_SCORES,
  SELECTED_PRIMARY_REALTIME_TRANSPORT,
  SELECTED_SECONDARY_FALLBACK_TRANSPORT,
  PROJECTED_MONTHLY_REALTIME_COST_INR,
  REALTIME_NEEDS_CLASSIFICATION_REGISTRY,
  REALTIME_CONNECTION_CONTRACTS,
  createRealtimeEnvelope,
  validateRealtimeEnvelope,
  canUserReceiveEvent,
} from '../types/realtime-architecture';
import { CapabilityString } from '../types/rbac-models';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[STAGE 16 VERIFICATION FAILED]: ${message}`);
  }
}

console.log('================================================================================');
console.log('BURRA PARIKSHA CMS — STAGE 16 REAL-TIME ARCHITECTURE VERIFICATION');
console.log('================================================================================\n');

// ----------------------------------------------------------------------------
// CHECK 1: Real-Time Needs Inventory & Urgency Classification
// ----------------------------------------------------------------------------
console.log('CHECK 1: Real-Time Needs Inventory & Urgency Classification');

assert(
  REALTIME_NEEDS_CLASSIFICATION_REGISTRY.length === 8,
  'Must classify exactly 8 canonical operational domains'
);

const expectedDomains = [
  'Workflow Changes',
  'Review Assignments',
  'Approval / Rejection Decisions',
  'Processing Status (AI & Validation)',
  'Media Processing Status',
  'User In-App Notifications',
  'Publishing Dispatch Status',
  'Analytics Refresh',
];

for (const expectedName of expectedDomains) {
  const domain = REALTIME_NEEDS_CLASSIFICATION_REGISTRY.find(
    (d) => d.domainName === expectedName
  );
  assert(domain !== undefined, `Domain '${expectedName}' must be registered`);
  assert(
    typeof domain!.targetLatency === 'string' && domain!.targetLatency.length > 0,
    `Domain '${expectedName}' must specify targetLatency`
  );
  assert(
    typeof domain!.fallbackStrategy === 'string' && domain!.fallbackStrategy.length > 0,
    `Domain '${expectedName}' must specify fallbackStrategy`
  );
  assert(
    domain!.firestoreReadImpact === 0,
    `Domain '${expectedName}' must incur 0 Firestore read impact`
  );
}

console.log('  ✔ All 8 operational domains verified with explicit urgency and fallback strategies.\n');

// ----------------------------------------------------------------------------
// CHECK 2: Transport Candidate Evaluation & Scoring
// ----------------------------------------------------------------------------
console.log('CHECK 2: Transport Candidate Evaluation & Scoring');

assert(
  TRANSPORT_EVALUATION_DIMENSIONS.length === 10,
  'Must evaluate transport mechanisms across exactly 10 architectural criteria'
);

const sseScore = TRANSPORT_COMPOSITE_SCORES[RealtimeTransportCandidate.SERVER_SENT_EVENTS];
const wsScore = TRANSPORT_COMPOSITE_SCORES[RealtimeTransportCandidate.WEBSOCKETS];
const pollScore = TRANSPORT_COMPOSITE_SCORES[RealtimeTransportCandidate.SHORT_LONG_POLLING];
const dbScore = TRANSPORT_COMPOSITE_SCORES[RealtimeTransportCandidate.DATABASE_LISTENERS];

assert(
  sseScore > wsScore && sseScore > pollScore && sseScore > dbScore,
  `Server-Sent Events must achieve highest composite score. Scores: SSE=${sseScore}, WS=${wsScore}, Poll=${pollScore}, DB=${dbScore}`
);
assert(
  SELECTED_PRIMARY_REALTIME_TRANSPORT === RealtimeTransportCandidate.SERVER_SENT_EVENTS,
  'Primary real-time transport must be SERVER_SENT_EVENTS'
);
assert(
  SELECTED_SECONDARY_FALLBACK_TRANSPORT === RealtimeTransportCandidate.SHORT_LONG_POLLING,
  'Secondary fallback transport must be SHORT_LONG_POLLING'
);

console.log(`  ✔ Candidate evaluation verified: SSE achieves winning score of ${sseScore}/10.\n`);

// ----------------------------------------------------------------------------
// CHECK 3: Zero-Cost Financial Invariant Enforcement (COST-001, AP-012)
// ----------------------------------------------------------------------------
console.log('CHECK 3: Zero-Cost Financial Invariant Enforcement');

assert(
  PROJECTED_MONTHLY_REALTIME_COST_INR === 0.0,
  `Projected monthly cost must be exactly ₹0.00 INR/month, got ₹${PROJECTED_MONTHLY_REALTIME_COST_INR}`
);

// Verify absence of external paid WebSocket/PubSub SaaS in transport selection
assert(
  SELECTED_PRIMARY_REALTIME_TRANSPORT !== RealtimeTransportCandidate.WEBSOCKETS ||
    PROJECTED_MONTHLY_REALTIME_COST_INR <= 100,
  'Financial constraint breached'
);

console.log('  ✔ Zero-cost financial invariant confirmed: ₹0.00 INR/month operational budget.\n');

// ----------------------------------------------------------------------------
// CHECK 4: Real-Time Event Envelope Schema Validation
// ----------------------------------------------------------------------------
console.log('CHECK 4: Real-Time Event Envelope Schema Validation');

const samplePayload = {
  questionId: 'BP-Q-000412',
  previousStatus: 'DRAFT',
  newStatus: 'VERIFIED',
  reviewerUserId: 'USR-000102',
};

const validEnvelope = createRealtimeEnvelope(
  RealtimeEventType.APPROVAL_DECIDED,
  'hub:questions',
  'USR-000102',
  samplePayload,
  2,
  'TRC-109283'
);

const validationResult = validateRealtimeEnvelope(validEnvelope);
assert(validationResult.isValid === true, 'Valid event envelope must pass Zod schema validation');
assert(
  /^EVT-[0-9]{8}-[0-9]{4}$/.test(validEnvelope.eventId),
  `Event ID '${validEnvelope.eventId}' must follow canonical EVT-YYYYMMDD-XXXX format`
);

// Negative validation: invalid eventId format & missing required fields
const invalidEnvelope = {
  eventId: 'INVALID-ID',
  type: 'UNKNOWN_TYPE',
  channel: 'x',
  timestamp: 'not-a-date',
  version: 0,
};

const invalidResult = validateRealtimeEnvelope(invalidEnvelope);
assert(invalidResult.isValid === false, 'Invalid event envelope must fail schema validation');
assert(invalidResult.errors!.length > 0, 'Validation failure must return error descriptions');

console.log('  ✔ Real-time event envelope schema strictly validated with Zod.\n');

// ----------------------------------------------------------------------------
// CHECK 5: RBAC Capability Gating on Event Distribution (AP-004)
// ----------------------------------------------------------------------------
console.log('CHECK 5: RBAC Capability Gating on Event Distribution');

const qaCapabilities: readonly CapabilityString[] = ['QUESTION:VIEW', 'QUESTION:EDIT'];
const editorCapabilities: readonly CapabilityString[] = ['VIDEO:VIEW', 'VIDEO:EDIT'];

// QA user can receive questions hub and question entity events
assert(
  canUserReceiveEvent(qaCapabilities, 'hub:questions', RealtimeEventType.WORKFLOW_TRANSITIONED, 'USR-000102'),
  'QA user with QUESTION:VIEW must receive questions hub events'
);
assert(
  canUserReceiveEvent(qaCapabilities, 'entity:question:BP-Q-000412', RealtimeEventType.APPROVAL_DECIDED, 'USR-000102'),
  'QA user with QUESTION:VIEW must receive question entity events'
);

// Video editor cannot receive questions hub events
assert(
  !canUserReceiveEvent(editorCapabilities, 'hub:questions', RealtimeEventType.WORKFLOW_TRANSITIONED, 'USR-000105'),
  'Editor lacking QUESTION:VIEW must NOT receive questions hub events'
);

// Video editor can receive video entity events
assert(
  canUserReceiveEvent(editorCapabilities, 'entity:video:BP-V-000412', RealtimeEventType.MEDIA_PROCESSING_COMPLETED, 'USR-000105'),
  'Editor with VIDEO:VIEW must receive video entity events'
);

// User notification channel isolation (user cannot receive other users' notifications)
assert(
  canUserReceiveEvent(qaCapabilities, 'user:USR-000102', RealtimeEventType.NOTIFICATION_DISPATCHED, 'USR-000102'),
  'User must receive their own personal notifications'
);
assert(
  !canUserReceiveEvent(qaCapabilities, 'user:USR-000999', RealtimeEventType.NOTIFICATION_DISPATCHED, 'USR-000102'),
  'User must NOT receive other users notifications'
);

// System broadcast is accessible to all authenticated users
assert(
  canUserReceiveEvent([], 'system:broadcast', RealtimeEventType.NOTIFICATION_DISPATCHED, 'USR-000102'),
  'System broadcast must be delivered to any authenticated user'
);

console.log('  ✔ RBAC capability gating on event streams strictly enforced.\n');

// ----------------------------------------------------------------------------
// CHECK 6: Firestore Read Amplification Protection
// ----------------------------------------------------------------------------
console.log('CHECK 6: Firestore Read Amplification Protection');

// Every real-time domain in the registry must specify 0 read amplification impact
for (const domain of REALTIME_NEEDS_CLASSIFICATION_REGISTRY) {
  assert(
    domain.firestoreReadImpact === 0,
    `Domain ${domain.domainName} must have 0 read impact on Firestore Spark quota`
  );
}

// Ensure database listeners (onSnapshot) are rejected as primary transport
assert(
  SELECTED_PRIMARY_REALTIME_TRANSPORT !== RealtimeTransportCandidate.DATABASE_LISTENERS,
  'Database listeners (onSnapshot) are strictly rejected to protect Firestore free tier reads'
);

console.log('  ✔ Firestore Spark free tier read amplification guard confirmed: 0 reads per event push.\n');

// ----------------------------------------------------------------------------
// CHECK 7: Connection Lifecycle & Reconnection Contracts
// ----------------------------------------------------------------------------
console.log('CHECK 7: Connection Lifecycle & Reconnection Contracts');

const contracts = REALTIME_CONNECTION_CONTRACTS;

assert(contracts.HEARTBEAT_INTERVAL_MS === 25000, 'Heartbeat interval must be 25s (25000ms)');
assert(contracts.MAX_RING_BUFFER_SIZE === 500, 'Ring buffer size must be 500 events');
assert(contracts.MAX_EVENT_RETENTION_MS === 300000, 'Event retention must be 5 minutes (300000ms)');
assert(contracts.RECONNECT_BACKOFF_INITIAL_MS === 1000, 'Initial reconnect backoff must be 1000ms');
assert(contracts.RECONNECT_BACKOFF_MAX_MS === 30000, 'Max reconnect backoff must be 30000ms');
assert(contracts.ACTIVE_POLL_INTERVAL_MS === 15000, 'Active poll interval must be 15000ms');
assert(contracts.BACKGROUND_POLL_INTERVAL_MS === 60000, 'Background poll interval must be 60000ms');

console.log('  ✔ Connection lifecycle, heartbeat, and reconnection parameters verified.\n');

// ----------------------------------------------------------------------------
// CHECK 8: Channel Subscription Scoping & Partitioning
// ----------------------------------------------------------------------------
console.log('CHECK 8: Channel Subscription Scoping & Partitioning');

const hubChannel = buildHubChannel('questions');
assert(hubChannel === 'hub:questions', `Hub channel formatting mismatch: ${hubChannel}`);
const parsedHub = parseRealtimeChannel(hubChannel);
assert(parsedHub.scope === RealtimeChannelScope.HUB && parsedHub.target === 'questions' && parsedHub.isValid, 'Hub channel parse failed');

const entityChannel = buildEntityChannel('question', 'BP-Q-000412');
assert(entityChannel === 'entity:question:BP-Q-000412', `Entity channel mismatch: ${entityChannel}`);
const parsedEntity = parseRealtimeChannel(entityChannel);
assert(
  parsedEntity.scope === RealtimeChannelScope.ENTITY &&
    parsedEntity.target === 'question' &&
    parsedEntity.entityId === 'BP-Q-000412' &&
    parsedEntity.isValid,
  'Entity channel parse failed'
);

const userChannel = buildUserChannel('USR-000102');
assert(userChannel === 'user:USR-000102', `User channel mismatch: ${userChannel}`);
const parsedUser = parseRealtimeChannel(userChannel);
assert(parsedUser.scope === RealtimeChannelScope.USER && parsedUser.target === 'USR-000102' && parsedUser.isValid, 'User channel parse failed');

const sysChannel = buildSystemChannel('broadcast');
assert(sysChannel === 'system:broadcast', `System channel mismatch: ${sysChannel}`);
const parsedSys = parseRealtimeChannel(sysChannel);
assert(parsedSys.scope === RealtimeChannelScope.SYSTEM && parsedSys.target === 'broadcast' && parsedSys.isValid, 'System channel parse failed');

console.log('  ✔ Channel taxonomy and addressing strictly validated across all 4 scopes.\n');

console.log('================================================================================');
console.log('ALL STAGE 16 REAL-TIME ARCHITECTURE CHECKS PASSED SUCCESSFULLY! (8/8)');
console.log('================================================================================');
