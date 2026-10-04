/**
 * BURRA PARIKSHA CMS — Workflow Persistence Repositories
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md (Section 5)
 * - docs/architecture/12-DATA-ARCHITECTURE.md
 *
 * Implements authoritative persistence for workflow_instances and workflow_history.
 * Auto-streams all mutations into FC-004 Audit Ledger via connectRepositoryToAudit.
 */

import { IRepository } from '../db/repository.interface';
import { FirestoreRepository } from '../db/firestore.repository';
import { WorkflowInstanceDocument, WorkflowHistoryEntry } from '../../types/workflow';
import { connectRepositoryToAudit } from '../audit';

// Authoritative repositories using FC-003 generic Firestore adapter
export const workflowInstancesRepository: IRepository<WorkflowInstanceDocument> =
  new FirestoreRepository<WorkflowInstanceDocument>('workflow_instances', 'wfl_' as any);

export const workflowHistoryRepository: IRepository<WorkflowHistoryEntry> =
  new FirestoreRepository<WorkflowHistoryEntry>('workflow_history', 'wfh_' as any);

// Hook mutations directly to the FC-004 audit ledger
connectRepositoryToAudit(workflowInstancesRepository);
connectRepositoryToAudit(workflowHistoryRepository);
