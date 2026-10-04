/**
 * BURRA PARIKSHA CMS — Audit Subsystem Barrel & Hook Connector
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 */

import { BaseEntity, IRepository, RepositoryAuditEvent } from '../db/repository.interface';
import { IAuditDispatcher } from './audit-dispatcher.interface';
import { FirestoreAuditDispatcher } from './firestore-audit.dispatcher';
import { InMemoryAuditDispatcher } from './in-memory-audit.dispatcher';
import { CreateAuditEventInput } from '../../types/audit';

export * from './audit-dispatcher.interface';
export * from './in-memory-audit.dispatcher';
export * from './firestore-audit.dispatcher';

// Authoritative default audit dispatcher instance
export const auditDispatcher: IAuditDispatcher = new FirestoreAuditDispatcher();

/**
 * Connects an IRepository mutation stream to the IAuditDispatcher.
 * Automatically constructs and dispatches 7-dimensional audit records upon mutations.
 */
export function connectRepositoryToAudit<T extends BaseEntity>(
  repository: IRepository<T>,
  dispatcher: IAuditDispatcher = auditDispatcher
): void {
  repository.onMutation(async (mutation: RepositoryAuditEvent<T>) => {
    try {
      const actionMap: Record<string, string> = {
        CREATE: `${mutation.collection.toUpperCase()}.CREATED`,
        UPDATE: `${mutation.collection.toUpperCase()}.UPDATED`,
        DELETE: `${mutation.collection.toUpperCase()}.DELETED`,
        SOFT_DELETE: `${mutation.collection.toUpperCase()}.SOFT_DELETED`,
      };

      const action = actionMap[mutation.action] || `${mutation.collection.toUpperCase()}.${mutation.action}`;

      const auditPayload: CreateAuditEventInput = {
        actor: {
          actorId: mutation.context?.actorId || 'SYSTEM',
          actorRole: 'SYSTEM_WORKER',
        },
        action,
        resource: {
          resourceType: mutation.collection,
          resourceId: mutation.entityId,
          resourceVersion: mutation.version,
        },
        context: {
          requestId: mutation.context?.requestId || `req_mutation_${Date.now()}`,
          traceId: (mutation.context as any)?.traceId,
        },
        result: 'SUCCESS',
        stateChange: {
          changeType: mutation.action,
          after: mutation.entity ? (mutation.entity as any) : undefined,
        },
      };

      await dispatcher.dispatch(auditPayload);
    } catch (err) {
      console.warn(`[AuditBridge] Failed to dispatch mutation audit event for ${mutation.collection}/${mutation.entityId}:`, err);
    }
  });
}
