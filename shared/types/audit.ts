/**
 * BURRA PARIKSHA CMS — Audit & Observability Types
 * Immutable audit trail records and workflow progression logs
 */

export interface AuditLog {
  id: string; // e.g. aud_uuid or LOG-8001
  actorId: string;
  actorName: string;
  action: string;
  eventType?: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  stageNumber?: number;
  version?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workflow {
  id: string; // e.g. wf_uuid or WF-901
  contentId?: string;
  contentMasterId?: string;
  entityType: 'QUESTION' | 'VIDEO' | 'SCRIPT' | 'PUBLISHING' | string;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  triggeredBy: string;
  actorName?: string;
  remarks?: string;
  timestamp: string;
}
