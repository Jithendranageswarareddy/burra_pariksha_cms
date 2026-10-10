/**
 * BURRA PARIKSHA CMS - Audit & Workflow Services
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { auditLogRepository, workflowRepository, sequencesRepository } from '../repositories';
import { AuditLog, Workflow } from '../../types';
import { SEQUENCE_ENTITIES } from '../schemas/domain-schemas';
import { sanitizeErrorMessage } from '../errors';

export class AuditService {
  private static instance: AuditService | null = null;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async log(
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, unknown>
  ): Promise<AuditLog> {
    // Sanitize any sensitive information in changes before persisting
    const sanitizedChanges = changes ? this.sanitizePayload(changes) : undefined;
    return auditLogRepository.logAction(actorId, actorName, action, entityType, entityId, sanitizedChanges);
  }

  /**
   * Logs operational and system events (connectivity, sequence anomaly, recovery) with guaranteed sanitization.
   */
  public async logOperationalEvent(
    action: string,
    category: 'CONNECTIVITY' | 'RECOVERY' | 'SEQUENCE_ANOMALY' | 'CONFIG',
    details: Record<string, unknown>,
    actor?: { id: string; name: string }
  ): Promise<AuditLog> {
    const actorId = actor?.id || 'SYSTEM-OPERATIONS';
    const actorName = actor?.name || 'Burra Pariksha System';
    const entityType = `SYSTEM_${category}`;
    const entityId = `OPS-${Date.now()}`;
    const sanitized = this.sanitizePayload(details);

    return auditLogRepository.logAction(actorId, actorName, action, entityType, entityId, sanitized);
  }

  /**
   * Recursively sanitizes data payloads, redacting private keys, tokens, and credentials.
   * Exempts non-credential fields such as `idempotencyKey` / `idempotency_key` / `primaryKey`.
   */
  private sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Explicit exemptions for safe identifiers containing 'key'
      const isExemptKey =
        lowerKey === 'idempotencykey' ||
        lowerKey === 'idempotency_key' ||
        lowerKey === 'idempotency-key';

      if (
        !isExemptKey &&
        (
          lowerKey.includes('key') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('auth') ||
          lowerKey.includes('credential') ||
          lowerKey.includes('password')
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeErrorMessage(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizePayload(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public async getLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    if (entityType && entityId) {
      return auditLogRepository.findByEntity(entityType, entityId);
    }
    return auditLogRepository.findAll();
  }
}

export class WorkflowService {
  private static instance: WorkflowService | null = null;
  private static workflowSeq = 0;

  private constructor() {}

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  public async recordTransition(
    entityType: 'QUESTION' | 'VIDEO' | 'SCRIPT' | 'PUBLISHING' | 'ASSIGNMENT' | string,
    entityId: string,
    fromStatus: string,
    toStatus: string,
    triggeredBy: string,
    actorNameOrRemarks?: string,
    remarks?: string
  ): Promise<Workflow> {
    const timestamp = new Date().toISOString();
    WorkflowService.workflowSeq += 1;
    const seq = String(WorkflowService.workflowSeq).padStart(5, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const id = `WF-${Date.now()}-${seq}-${randomSuffix}-${entityId}`;

    const actorName = remarks !== undefined ? actorNameOrRemarks : undefined;
    const finalRemarks = remarks !== undefined ? remarks : (actorNameOrRemarks || '');

    const record: Workflow = {
      id,
      entityType: entityType as any,
      entityId,
      fromStatus,
      toStatus,
      triggeredBy,
      actorName,
      remarks: finalRemarks,
      timestamp,
    };

    return workflowRepository.appendRecord(record);
  }

  public async getHistory(entityType: string, entityId: string): Promise<Workflow[]> {
    return workflowRepository.findByEntity(entityType, entityId);
  }
}

export const auditService = AuditService.getInstance();
export const workflowService = WorkflowService.getInstance();
