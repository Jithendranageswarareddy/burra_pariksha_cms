/**
 * BURRA PARIKSHA CMS — Assignment API Contracts
 * Task assignment lifecycle and team coordination DTOs
 */

import { AssignmentEntityType, PriorityLevel } from '../constants';

export interface CancelAssignmentInput {
  reason?: string;
}

export interface CompleteAssignmentInput {
  notes?: string;
}

export interface CreateAssignmentInput {
  entityType: AssignmentEntityType | string;
  entityId: string;
  assigneeId: string;
  assignmentRole?: string;
  taskType: string;
  priority?: PriorityLevel;
  dueDate?: string;
  dueAt?: string;
  notes?: string;
}

export interface ReassignAssignmentInput {
  newAssigneeId: string;
  notes?: string;
}

export interface UpdateAssignmentInput {
  taskType?: string;
  status?: string;
  priority?: PriorityLevel;
  dueDate?: string;
  dueAt?: string;
  notes?: string;
}
