/**
 * BURRA PARIKSHA CMS — In-Memory Audit Dispatcher & Test Double
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY
 *
 * Implements IAuditDispatcher with append-only semantics, Zod validation,
 * automatic sensitive-data redaction, and deterministic query filtering.
 */

import {
  AuditEvent,
  CreateAuditEventInput,
  AuditQueryFilters,
  CreateAuditEventInputSchema,
  redactSensitiveData,
} from '../../types/audit';
import { IAuditDispatcher, AuditQueryResult } from './audit-dispatcher.interface';
import { canonicalIdService } from '../id.service';
import { ValidationError } from '../errors';

export class InMemoryAuditDispatcher implements IAuditDispatcher {
  private readonly events: (AuditEvent & { _seq: number })[] = [];
  private sequenceCounter = 0;

  public async dispatch(input: CreateAuditEventInput): Promise<AuditEvent> {
    const parseResult = CreateAuditEventInputSchema.safeParse(input);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => ({
        field: i.path.join('.') || 'input',
        issue: i.message,
      }));
      throw new ValidationError('Audit event validation failed: mandatory fields missing or invalid.', issues);
    }

    const validatedInput = parseResult.data;
    const sanitizedInput = redactSensitiveData(validatedInput);

    const id = sanitizedInput.id || canonicalIdService.generateAuditId();
    const timestamp = sanitizedInput.timestamp || new Date().toISOString();

    const event: AuditEvent = {
      id,
      timestamp,
      actor: {
        actorId: sanitizedInput.actor.actorId,
        actorRole: sanitizedInput.actor.actorRole,
        actorName: sanitizedInput.actor.actorName,
        impersonatorId: sanitizedInput.actor.impersonatorId,
      },
      action: sanitizedInput.action,
      resource: {
        resourceType: sanitizedInput.resource.resourceType,
        resourceId: sanitizedInput.resource.resourceId,
        resourceVersion: sanitizedInput.resource.resourceVersion,
      },
      context: {
        requestId: sanitizedInput.context.requestId,
        traceId: sanitizedInput.context.traceId,
        ipAddress: sanitizedInput.context.ipAddress,
        userAgent: sanitizedInput.context.userAgent,
        workflowStep: sanitizedInput.context.workflowStep,
        jobId: sanitizedInput.context.jobId,
        aiRequestId: sanitizedInput.context.aiRequestId,
      },
      result: sanitizedInput.result || 'SUCCESS',
      reason: sanitizedInput.reason,
      stateChange: sanitizedInput.stateChange,
      errorMessage: sanitizedInput.errorMessage,
    };

    const seq = ++this.sequenceCounter;
    // Append-only with sequence tracking
    this.events.push({ ...JSON.parse(JSON.stringify(event)), _seq: seq });

    return JSON.parse(JSON.stringify(event));
  }

  public async query(filters?: AuditQueryFilters): Promise<AuditQueryResult> {
    let result = [...this.events];

    if (filters?.resourceType) {
      result = result.filter(
        (e) => e.resource.resourceType.toLowerCase() === filters.resourceType!.toLowerCase()
      );
    }

    if (filters?.resourceId) {
      result = result.filter((e) => e.resource.resourceId === filters.resourceId);
    }

    if (filters?.actorId) {
      result = result.filter((e) => e.actor.actorId === filters.actorId);
    }

    if (filters?.action) {
      result = result.filter(
        (e) => e.action.toLowerCase() === filters.action!.toLowerCase()
      );
    }

    if (filters?.startDate) {
      const startTime = new Date(filters.startDate).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= startTime);
    }

    if (filters?.endDate) {
      const endTime = new Date(filters.endDate).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() <= endTime);
    }

    // Sort descending by timestamp; tie-break deterministically by sequence counter
    result.sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;
      return b._seq - a._seq;
    });

    const total = result.length;
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;

    const offset = (page - 1) * limit;
    const paginatedEvents = result.slice(offset, offset + limit).map(({ _seq, ...e }) => e as AuditEvent);

    return {
      events: JSON.parse(JSON.stringify(paginatedEvents)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  public clear(): void {
    this.events.length = 0;
    this.sequenceCounter = 0;
  }
}
