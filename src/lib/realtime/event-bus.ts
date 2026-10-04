/**
 * BURRA PARIKSHA CMS — Realtime Event Bus & SSE Backbone
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/architecture/16-REALTIME-ARCHITECTURE.md
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 *
 * Implements in-memory EventEmitter backbone delivering zero-cost SSE and pub/sub events.
 */

import { EventEmitter } from 'events';
import {
  RealtimeEventEnvelope,
  RealtimeEventType,
  createRealtimeEnvelope,
} from '../../types/realtime-architecture';

export interface WorkflowTransitionEventPayload {
  workflowId: string;
  entityId: string;
  entityType: string;
  fromStep: number;
  toStep: number;
  action: string;
  actorId: string;
  timestamp: string;
  version: number;
  stateDimensions: {
    workflowStep: number;
    contentStatus: string;
    mediaStatus: string;
    publicationStatus: string;
    jobStatus: string;
  };
}

export type RealtimeEventListener = (event: RealtimeEventEnvelope<any>) => void;

export class RealtimeEventBus {
  private static instance: RealtimeEventBus | null = null;
  private readonly emitter = new EventEmitter();
  private readonly eventHistory: RealtimeEventEnvelope<any>[] = [];
  private readonly maxHistory = 500;

  private constructor() {
    this.emitter.setMaxListeners(100);
  }

  public static getInstance(): RealtimeEventBus {
    if (!RealtimeEventBus.instance) {
      RealtimeEventBus.instance = new RealtimeEventBus();
    }
    return RealtimeEventBus.instance;
  }

  /**
   * Broadcasts a real-time event envelope to subscribers and retains it in rolling buffer.
   */
  public broadcast<T extends object = Record<string, unknown>>(
    envelope: RealtimeEventEnvelope<T>
  ): void {
    // 1. Maintain rolling history buffer for Last-Event-ID reconnection
    this.eventHistory.push(envelope);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // 2. Emit canonical event type and wildcard
    this.emitter.emit(envelope.type, envelope);
    this.emitter.emit('*', envelope);

    // 3. Emit channel-specific event
    this.emitter.emit(`channel:${envelope.channel}`, envelope);
  }

  /**
   * Specifically emits a workflow step transition event as required by FC-005.
   * Event name: 'workflow.step_transitioned'
   */
  public emitWorkflowTransition(payload: WorkflowTransitionEventPayload): RealtimeEventEnvelope<WorkflowTransitionEventPayload> {
    const envelope = createRealtimeEnvelope(
      RealtimeEventType.WORKFLOW_TRANSITIONED,
      `entity:${payload.entityType.toLowerCase()}:${payload.entityId}`,
      payload.actorId,
      payload,
      payload.version
    );

    // Broadcast standard envelope
    this.broadcast(envelope);

    // Also emit specific event string required by FC-005 contract: 'workflow.step_transitioned'
    this.emitter.emit('workflow.step_transitioned', payload);

    return envelope;
  }

  /**
   * Subscribes to an event type (e.g. 'workflow.step_transitioned' or RealtimeEventType.WORKFLOW_TRANSITIONED).
   */
  public subscribe(eventType: string, listener: (...args: any[]) => void): () => void {
    this.emitter.on(eventType, listener);
    return () => {
      this.emitter.off(eventType, listener);
    };
  }

  /**
   * Returns recent events after the specified Last-Event-ID for reconnection support.
   */
  public getEventsSince(lastEventId?: string): RealtimeEventEnvelope<any>[] {
    if (!lastEventId) {
      return this.eventHistory.slice(-50);
    }
    const idx = this.eventHistory.findIndex((e) => e.eventId === lastEventId);
    if (idx === -1) {
      return this.eventHistory.slice(-50);
    }
    return this.eventHistory.slice(idx + 1);
  }

  /**
   * Clears event history buffer (primarily for test isolation).
   */
  public clearHistory(): void {
    this.eventHistory.length = 0;
  }
}

export const realtimeEventBus = RealtimeEventBus.getInstance();
