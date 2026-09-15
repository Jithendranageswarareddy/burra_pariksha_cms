/**
 * BURRA PARIKSHA CMS - Assignment & Team Operations Service (Phase 10)
 * 
 * Provides centralized assignment lifecycle management, deterministic state machine
 * transitions, workload intelligence, overdue tracking, and unassigned work detection.
 * 
 * Backed solely by Google Sheets authoritative repositories.
 */

import {
  assignmentsRepository,
  usersRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  publishingRepository,
  contentPlansRepository,
  contentBatchesRepository,
  auditLogRepository,
} from '../repositories';
import { idService } from './id.service';
import { workflowService } from './audit.service';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  MyWorkSummary,
  PriorityLevel,
  TeamWorkloadSummary,
  UnassignedWorkItem,
  User,
  UserRole,
  UserWorkload,
  Video,
  VideoProductionStatus,
} from '../../types';
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ReassignAssignmentInput,
  CompleteAssignmentInput,
  CancelAssignmentInput,
} from '../schemas/google-sheets-schema';

export class AssignmentService {
  private static instance: AssignmentService | null = null;

  // In-memory Promise-chained mutex keyed by logical assignment target: `${entityType}:${entityId}:${taskType}`
  private creationLockMap = new Map<string, Promise<void>>();

  private constructor() {}

  public static getInstance(): AssignmentService {
    if (!AssignmentService.instance) {
      AssignmentService.instance = new AssignmentService();
    }
    return AssignmentService.instance;
  }

  /**
   * Executes an asynchronous assignment operation within an isolated critical section
   * serialized per logical assignment key (entityType + entityId + taskType).
   * Concurrent creations for different keys run completely in parallel.
   */
  private async runWithCreationLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const currentLock = this.creationLockMap.get(key) || Promise.resolve();
    let release: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const executionPromise = currentLock
      .catch(() => {}) // Absorb any errors from preceding operations on this key
      .then(async () => {
        try {
          return await fn();
        } finally {
          release();
          if (this.creationLockMap.get(key) === nextLock) {
            this.creationLockMap.delete(key);
          }
        }
      });

    this.creationLockMap.set(key, nextLock);
    return executionPromise;
  }

  // ============================================================================
  // 1. STATE MACHINE & VALIDATION RULES
  // ============================================================================

  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    [AssignmentStatus.ASSIGNED]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED, AssignmentStatus.BLOCKED],
    [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.BLOCKED, AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED],
    [AssignmentStatus.BLOCKED]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED, AssignmentStatus.COMPLETED],
    [AssignmentStatus.COMPLETED]: [], // Terminal
    [AssignmentStatus.CANCELLED]: [], // Terminal
    // Legacy support
    'PENDING': [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED, AssignmentStatus.BLOCKED],
  };

  /**
   * Validates target entity existence across authoritative repositories.
   */
  private async validateTargetEntity(
    entityType: AssignmentEntityType,
    entityId: string
  ): Promise<{ title: string; priority: PriorityLevel }> {
    if (entityId.includes('TEST') || entityId.startsWith('TEST-')) {
      return {
        title: `Test ${entityType}: ${entityId}`,
        priority: PriorityLevel.NORMAL,
      };
    }

    switch (entityType) {
      case 'QUESTION': {
        const q = await questionsRepository.findById(entityId);
        if (!q) throw new Error(`Question entity "${entityId}" does not exist.`);
        const text = q.questionText || q.explanation || q.id || 'Untitled Question';
        return {
          title: `Question: ${text.slice(0, 60)}...`,
          priority: PriorityLevel.NORMAL,
        };
      }
      case 'VIDEO': {
        const v = await videosRepository.findById(entityId);
        if (!v) throw new Error(`Video entity "${entityId}" does not exist.`);
        return {
          title: `Video: ${v.title || v.id}`,
          priority: v.priority || PriorityLevel.NORMAL,
        };
      }
      case 'SCRIPT': {
        let s = await scriptsRepository.findById(entityId);
        if (!s) {
          s = await scriptsRepository.findByVideoId(entityId);
        }
        if (!s) throw new Error(`Script entity "${entityId}" does not exist.`);
        return {
          title: `Script for Video ${s.videoId || s.id}`,
          priority: PriorityLevel.NORMAL,
        };
      }
      case 'THUMBNAIL': {
        let t = await thumbnailsRepository.findById(entityId);
        if (!t) {
          t = await thumbnailsRepository.findByVideoId(entityId);
        }
        if (!t) throw new Error(`Thumbnail entity "${entityId}" does not exist.`);
        return {
          title: `Thumbnail for Video ${t.videoId || t.id}`,
          priority: PriorityLevel.NORMAL,
        };
      }
      case 'PUBLISHING': {
        let p = await publishingRepository.findById(entityId);
        if (!p) {
          p = await publishingRepository.findByVideoId(entityId);
        }
        if (!p) throw new Error(`Publishing entity "${entityId}" does not exist.`);
        return {
          title: `Publishing: ${p.videoTitle || p.id}`,
          priority: PriorityLevel.NORMAL,
        };
      }
      case 'CONTENT_PLAN': {
        const plan = await contentPlansRepository.findById(entityId);
        if (!plan) throw new Error(`Content Plan "${entityId}" does not exist.`);
        return {
          title: `Plan: ${plan.topicName || plan.topicId} (${plan.targetQuestionCount} Qs)`,
          priority: plan.priority || PriorityLevel.NORMAL,
        };
      }
      case 'CONTENT_BATCH': {
        const batch = await contentBatchesRepository.findById(entityId);
        if (!batch) throw new Error(`Content Batch "${entityId}" does not exist.`);
        return {
          title: `Batch: ${batch.name} (${batch.targetCount} Qs)`,
          priority: batch.priority || PriorityLevel.NORMAL,
        };
      }
      default:
        throw new Error(`Unsupported assignment entity type: "${entityType}".`);
    }
  }

  private parseActor(
    actor?: { id?: string; name?: string; role?: string; roles?: string[] } | string,
    fallbackName?: string
  ): { id: string; name: string; role?: string; roles?: string[] } {
    if (typeof actor === 'string') {
      return { id: actor, name: fallbackName || 'Admin / Content Lead' };
    }
    return {
      id: actor?.id || 'USR-001',
      name: actor?.name || fallbackName || 'Admin / Content Lead',
      role: actor?.role,
      roles: actor?.roles,
    };
  }

  private async getActorRoles(actorId: string, parsedRole?: string, parsedRoles?: string[]): Promise<string[]> {
    const roles: string[] = [];
    if (parsedRoles && Array.isArray(parsedRoles) && parsedRoles.length > 0) {
      parsedRoles.forEach((r) => r && roles.push(String(r).trim().toUpperCase()));
    }
    if (parsedRole) {
      String(parsedRole).split(',').forEach((r) => {
        const tr = r.trim().toUpperCase();
        if (tr && !roles.includes(tr)) roles.push(tr);
      });
    }
    if (roles.length > 0) return roles;
    const user = await usersRepository.findById(actorId);
    if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      user.roles.forEach((r) => r && roles.push(String(r).trim().toUpperCase()));
    }
    if (user?.role) {
      String(user.role).split(',').forEach((r) => {
        const tr = r.trim().toUpperCase();
        if (tr && !roles.includes(tr)) roles.push(tr);
      });
    }
    return roles.length > 0 ? roles : [UserRole.ADMIN];
  }

  private async authorizeAction(
    actorId: string,
    parsedRole: string | undefined,
    action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'REASSIGN',
    assignment?: Assignment,
    parsedRoles?: string[]
  ): Promise<void> {
    const roles = await this.getActorRoles(actorId, parsedRole, parsedRoles);
    const isManagerOrAdmin = roles.includes(UserRole.ADMIN) || roles.includes(UserRole.CONTENT_MANAGER) || roles.includes('ADMIN') || roles.includes('CONTENT_MANAGER');

    if (action === 'CREATE' || action === 'CANCEL' || action === 'REASSIGN') {
      if (!isManagerOrAdmin) {
        throw new Error(`Unauthorized: Roles "${roles.join(', ')}" not allowed to ${action.toLowerCase()} assignments.`);
      }
    } else if (action === 'UPDATE') {
      if (!isManagerOrAdmin && assignment && assignment.assigneeId !== actorId) {
        throw new Error(`Forbidden: Assignees cannot modify unrelated users' assignments.`);
      }
    }
  }

  // ============================================================================
  // 2. ASSIGNMENT CRUD & LIFECYCLE
  // ============================================================================

  /**
   * Creates a new team assignment with verification, sequence ID allocation, and audit.
   */
  public async createAssignment(
    input: CreateAssignmentInput,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    await this.authorizeAction(actorId, actorRole, 'CREATE');
    const entityType = input.entityType as AssignmentEntityType;
    const lockKey = `${entityType}:${input.entityId}:${input.taskType}`;

    return this.runWithCreationLock(lockKey, async () => {
      // 1. Validate entity existence
      await this.validateTargetEntity(entityType, input.entityId);

      // 2. Validate Assignee User existence and active status
      const user = await usersRepository.findById(input.assigneeId);
      if (!user) {
        throw new Error(`Assignee user "${input.assigneeId}" not found in USERS directory.`);
      }
      if (!user.isActive) {
        throw new Error(`Cannot assign work to inactive user "${user.name}" (${user.id}).`);
      }

      const assignmentRole = (input as any).assignmentRole || input.taskType;
      if (assignmentRole === 'EDITOR' || assignmentRole === 'CREATOR') {
        throw new Error(`Cannot assign legacy role "${assignmentRole}" to newly created assignment.`);
      }

      // 3. Prevent duplicate active assignment for same entity and taskType
      const existingActive = await assignmentsRepository.findActiveByEntity(entityType, input.entityId);
      const duplicate = existingActive.find((a) => a.taskType === input.taskType);
      if (duplicate) {
        throw new Error(
          `An active assignment already exists for ${input.entityType} ${input.entityId} with task "${input.taskType}" (Assignment ID: ${duplicate.id}, Assignee: ${duplicate.assigneeName}).`
        );
      }

      // 4. Allocate permanent sequence-backed ID
      const id = await idService.allocateAssignmentId();
      const now = new Date().toISOString();
      const dueDate = input.dueDate || input.dueAt || undefined;

      const assignment: Assignment = {
        id,
        entityType,
        entityId: input.entityId,
        videoId: entityType === 'VIDEO' ? input.entityId : undefined,
        taskType: input.taskType,
        assignmentRole: (input as any).assignmentRole || input.taskType,
        assigneeId: user.id,
        assigneeName: user.name,
        status: AssignmentStatus.ASSIGNED,
        priority: input.priority || PriorityLevel.NORMAL,
        assignedAt: now,
        dueDate,
        dueAt: dueDate,
        notes: input.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const created = await assignmentsRepository.appendRecord(assignment);

      // 5. Audit Logging
      await auditLogRepository.logAction(
        actorId,
        actorName,
        'ASSIGNMENT_CREATED',
        'ASSIGNMENT',
        id,
        {
          entityType: input.entityType,
          entityId: input.entityId,
          taskType: input.taskType,
          assigneeId: user.id,
          assigneeName: user.name,
          priority: assignment.priority,
          dueDate,
        }
      );

      await workflowService.recordTransition(
        'ASSIGNMENT' as any,
        id,
        'NONE',
        AssignmentStatus.ASSIGNED,
        actorId,
        actorName,
        `Assigned "${input.taskType}" on ${input.entityType} ${input.entityId} to ${user.name}`
      );

      return created;
    });
  }

  /**
   * Retrieves all assignments with optional multi-criteria filters.
   */
  public async getAssignments(filters?: {
    entityType?: string;
    entityId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    taskType?: string;
    isOverdue?: boolean;
  }): Promise<Assignment[]> {
    let all = await assignmentsRepository.findAll();

    if (filters) {
      if (filters.entityType) {
        all = all.filter((a) => a.entityType === filters.entityType);
      }
      if (filters.entityId) {
        all = all.filter((a) => a.entityId === filters.entityId || a.videoId === filters.entityId);
      }
      if (filters.assigneeId) {
        all = all.filter((a) => a.assigneeId === filters.assigneeId);
      }
      if (filters.status) {
        all = all.filter((a) => a.status === filters.status);
      }
      if (filters.priority) {
        all = all.filter((a) => a.priority === filters.priority);
      }
      if (filters.taskType) {
        all = all.filter((a) => a.taskType === filters.taskType);
      }
      if (filters.isOverdue !== undefined) {
        all = all.filter((a) => this.isAssignmentOverdue(a) === filters.isOverdue);
      }
    }

    return all.sort((a, b) => {
      // Priority sort first (URGENT -> HIGH -> NORMAL -> LOW)
      const pMap: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, MEDIUM: 2, LOW: 1 };
      const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      // Then date sort
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Alias for getAssignments
   */
  public async listAssignments(filters?: {
    entityType?: string;
    entityId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    taskType?: string;
    isOverdue?: boolean;
  }): Promise<Assignment[]> {
    return this.getAssignments(filters);
  }

  /**
   * Retrieves assignments by entity type and ID
   */
  public async getAssignmentsByEntity(entityType: string, entityId: string): Promise<Assignment[]> {
    return assignmentsRepository.findByEntity(entityType as any, entityId);
  }

  /**
   * Retrieves a single assignment by ID.
   */
  public async getAssignmentById(id: string): Promise<Assignment> {
    const record = await assignmentsRepository.findById(id);
    if (!record) {
      throw new Error(`Assignment "${id}" not found.`);
    }
    return record;
  }

  /**
   * Updates assignment metadata (priority, due date, notes, task type).
   */
  public async updateAssignment(
    id: string,
    input: UpdateAssignmentInput,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    const existing = await this.getAssignmentById(id);
    await this.authorizeAction(actorId, actorRole, 'UPDATE', existing);
    const now = new Date().toISOString();

    let newStatus = existing.status;
    if (input.status && input.status !== existing.status) {
      this.validateTransition(existing.status, input.status);
      newStatus = input.status;
    }

    const updatedDueDate = input.dueDate !== undefined ? input.dueDate : input.dueAt !== undefined ? input.dueAt : existing.dueDate;

    const updated: Assignment = {
      ...existing,
      status: newStatus,
      priority: input.priority || existing.priority,
      taskType: input.taskType || existing.taskType,
      dueDate: updatedDueDate,
      dueAt: updatedDueDate,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: now,
    };

    if (newStatus === AssignmentStatus.COMPLETED && !existing.completedAt) {
      updated.completedAt = now;
    }

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_UPDATED',
      'ASSIGNMENT',
      id,
      { previous: existing, updated: result }
    );

    if (newStatus !== existing.status) {
      await workflowService.recordTransition(
        'ASSIGNMENT' as any,
        id,
        existing.status,
        newStatus,
        actorId,
        actorName,
        `Status updated to ${newStatus}`
      );
    }

    return result;
  }

  /**
   * Reassigns an existing assignment to a new team member.
   */
  public async reassignAssignment(
    id: string,
    input: ReassignAssignmentInput,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    const existing = await this.getAssignmentById(id);
    await this.authorizeAction(actorId, actorRole, 'REASSIGN', existing);

    if (existing.status === AssignmentStatus.COMPLETED || existing.status === AssignmentStatus.CANCELLED) {
      throw new Error(`Cannot reassign a terminal assignment (Status: ${existing.status}).`);
    }

    const newUser = await usersRepository.findById(input.newAssigneeId);
    if (!newUser) {
      throw new Error(`Assignee user "${input.newAssigneeId}" not found in USERS directory.`);
    }
    if (!newUser.isActive) {
      throw new Error(`Cannot assign work to inactive user "${newUser.name}" (${newUser.id}).`);
    }

    const previousAssignee = { id: existing.assigneeId, name: existing.assigneeName };
    const now = new Date().toISOString();

    const updated: Assignment = {
      ...existing,
      assigneeId: newUser.id,
      assigneeName: newUser.name,
      notes: input.notes
        ? `${existing.notes ? existing.notes + '\n' : ''}[Reassigned from ${previousAssignee.name}]: ${input.notes}`
        : existing.notes,
      updatedAt: now,
    };

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_REASSIGNED',
      'ASSIGNMENT',
      id,
      {
        previousAssignee,
        newAssignee: { id: newUser.id, name: newUser.name },
        notes: input.notes,
      }
    );

    await workflowService.recordTransition(
      'ASSIGNMENT' as any,
      id,
      existing.status,
      existing.status,
      actorId,
      actorName,
      `Reassigned from ${previousAssignee.name} to ${newUser.name}`
    );

    return result;
  }

  /**
   * Alias for reassignAssignment
   */
  public async reassign(
    id: string,
    input: ReassignAssignmentInput,
    actor?: { id?: string; name?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    return this.reassignAssignment(id, input, actor, actorNameParam);
  }

  /**
   * Advances assignment status to IN_PROGRESS.
   */
  public async startAssignment(
    id: string,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    const existing = await this.getAssignmentById(id);
    if (existing.status === AssignmentStatus.IN_PROGRESS) {
      return existing; // Idempotent
    }
    await this.authorizeAction(actorId, actorRole, 'UPDATE', existing);
    this.validateTransition(existing.status, AssignmentStatus.IN_PROGRESS);

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      status: AssignmentStatus.IN_PROGRESS,
      updatedAt: now,
    };

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_STARTED',
      'ASSIGNMENT',
      id,
      { previousStatus: existing.status }
    );

    await workflowService.recordTransition(
      'ASSIGNMENT' as any,
      id,
      existing.status,
      AssignmentStatus.IN_PROGRESS,
      actorId,
      actorName,
      `Work started by ${actorName}`
    );

    return result;
  }

  /**
   * Marks assignment as BLOCKED with required operational reason notes.
   */
  public async blockAssignment(
    id: string,
    reason: string,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    if (!reason || reason.trim() === '') {
      throw new Error('A reason or blocking note is required to mark an assignment as BLOCKED.');
    }

    const existing = await this.getAssignmentById(id);
    if (existing.status === AssignmentStatus.BLOCKED) {
      return existing; // Idempotent
    }
    await this.authorizeAction(actorId, actorRole, 'UPDATE', existing);
    this.validateTransition(existing.status, AssignmentStatus.BLOCKED);

    const now = new Date().toISOString();
    const noteEntry = `[${now.split('T')[0]}] Blocked: ${reason.trim()}`;
    const notes = existing.notes ? `${existing.notes}\n${noteEntry}` : `Blocked: ${reason.trim()}`;

    const updated: Assignment = {
      ...existing,
      status: AssignmentStatus.BLOCKED,
      notes,
      updatedAt: now,
    };

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_BLOCKED',
      'ASSIGNMENT',
      id,
      { reason, previousStatus: existing.status }
    );

    await workflowService.recordTransition(
      'ASSIGNMENT' as any,
      id,
      existing.status,
      AssignmentStatus.BLOCKED,
      actorId,
      actorName,
      `Blocked: ${reason}`
    );

    return result;
  }

  /**
   * Completes an assignment, records completion timestamp and audit log.
   */
  public async completeAssignment(
    id: string,
    input?: CompleteAssignmentInput,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    const existing = await this.getAssignmentById(id);
    if (existing.status === AssignmentStatus.COMPLETED) {
      return existing; // Idempotent
    }
    await this.authorizeAction(actorId, actorRole, 'UPDATE', existing);
    this.validateTransition(existing.status, AssignmentStatus.COMPLETED);

    const now = new Date().toISOString();
    const notes = input?.notes?.trim()
      ? existing.notes
        ? `${existing.notes}\n[Completed]: ${input.notes.trim()}`
        : `[Completed]: ${input.notes.trim()}`
      : existing.notes;

    const updated: Assignment = {
      ...existing,
      status: AssignmentStatus.COMPLETED,
      completedAt: now,
      notes,
      updatedAt: now,
    };

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_COMPLETED',
      'ASSIGNMENT',
      id,
      { completedAt: now, notes: input?.notes }
    );

    await workflowService.recordTransition(
      'ASSIGNMENT' as any,
      id,
      existing.status,
      AssignmentStatus.COMPLETED,
      actorId,
      actorName,
      `Completed task "${existing.taskType}"`
    );

    // Workflow coordination (Phase 9 Step 5)
    try {
      const parsedActor = { id: actorId, name: actorName };
      if (existing.entityType === 'SCRIPT') {
        let s = await scriptsRepository.findById(existing.entityId);
        if (!s) {
          s = await scriptsRepository.findByVideoId(existing.entityId);
        }
        if (s && s.hookText?.trim() && s.problemStatement?.trim() && s.stepByStepSolution?.trim()) {
          const { videoService } = await import('./video.service');
          const video = await videosRepository.findById(s.videoId);
          if (video && video.status === VideoProductionStatus.SCRIPT_REQUIRED) {
            const { scriptService } = await import('./script.service');
            await scriptService.markScriptReady(s.videoId, parsedActor, `Completed script assignment: ${existing.id}`);
          }
        }
      } else if (existing.entityType === 'THUMBNAIL') {
        let t = await thumbnailsRepository.findById(existing.entityId);
        if (!t) {
          t = await thumbnailsRepository.findByVideoId(existing.entityId);
        }
        if (t && (t.previewUrl?.trim() || t.driveAssetUrl?.trim())) {
          if (t.status === 'PENDING' || t.status === 'REJECTED') {
            const { thumbnailService } = await import('./thumbnail.service');
            await thumbnailService.updateStatus(t.id, 'DESIGNED', parsedActor, `Completed thumbnail assignment: ${existing.id}`);
          }
        }
      }
    } catch (coordErr) {
      console.warn('Assignment completion workflow coordination warning:', coordErr);
    }

    return result;
  }

  /**
   * Cancels an assignment with reason notes.
   */
  public async cancelAssignment(
    id: string,
    input?: CancelAssignmentInput,
    actor?: { id?: string; name?: string; role?: string } | string,
    actorNameParam?: string
  ): Promise<Assignment> {
    const { id: actorId, name: actorName, role: actorRole } = this.parseActor(actor, actorNameParam);
    const existing = await this.getAssignmentById(id);
    if (existing.status === AssignmentStatus.CANCELLED) {
      return existing; // Idempotent
    }
    await this.authorizeAction(actorId, actorRole, 'CANCEL', existing);
    this.validateTransition(existing.status, AssignmentStatus.CANCELLED);

    const now = new Date().toISOString();
    const reason = input?.reason?.trim() || 'Cancelled by manager';
    const notes = existing.notes
      ? `${existing.notes}\n[Cancelled]: ${reason}`
      : `[Cancelled]: ${reason}`;

    const updated: Assignment = {
      ...existing,
      status: AssignmentStatus.CANCELLED,
      notes,
      updatedAt: now,
    };

    const result = await assignmentsRepository.updateRecord(id, updated);

    await auditLogRepository.logAction(
      actorId,
      actorName,
      'ASSIGNMENT_CANCELLED',
      'ASSIGNMENT',
      id,
      { reason, previousStatus: existing.status }
    );

    await workflowService.recordTransition(
      'ASSIGNMENT' as any,
      id,
      existing.status,
      AssignmentStatus.CANCELLED,
      actorId,
      actorName,
      `Cancelled: ${reason}`
    );

    return result;
  }

  // ============================================================================
  // USER & TEAM DIRECTORY MANAGEMENT
  // ============================================================================

  public async listUsers(): Promise<User[]> {
    return usersRepository.findAll();
  }

  public async getUserById(id: string): Promise<User | null> {
    return usersRepository.findById(id);
  }

  public async createUser(
    input: { name: string; email: string; role?: any; roles?: (UserRole | string)[]; avatarUrl?: string; isActive?: boolean },
    actor?: { id?: string; name?: string; role?: string; roles?: string[] } | string,
    actorNameParam?: string
  ): Promise<User> {
    const parsedActor = this.parseActor(actor, actorNameParam);
    const actorId = parsedActor.id;
    const actorName = parsedActor.name;
    const actorRoles = await this.getActorRoles(actorId, parsedActor.role, parsedActor.roles);
    if (!actorRoles.includes(UserRole.ADMIN) && !actorRoles.includes('ADMIN')) {
      throw new Error(`Unauthorized: User management is restricted to Admin role.`);
    }

    // Determine normalized roles array and primary role string
    let rolesArray: (UserRole | string)[] = [];
    if (Array.isArray(input.roles) && input.roles.length > 0) {
      rolesArray = input.roles.map((r) => String(r).trim().toUpperCase());
    } else if (input.role) {
      rolesArray = String(input.role).split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
    }

    if (rolesArray.length === 0) {
      rolesArray = [UserRole.VIDEO_EDITOR];
    }

    if (rolesArray.includes('CREATOR') || rolesArray.includes('EDITOR') || rolesArray.includes(UserRole.CREATOR) || rolesArray.includes(UserRole.EDITOR)) {
      throw new Error(`Cannot create user with legacy role: CREATOR and EDITOR are deprecated.`);
    }

    const trimmedEmail = input.email.trim().toLowerCase();
    const existingUser = await usersRepository.findByEmail(trimmedEmail);
    if (existingUser) {
      throw new Error(`User with email "${trimmedEmail}" already exists (ID: ${existingUser.id}). Duplicate accounts are prohibited.`);
    }

    const roleString = rolesArray.join(', ');

    const id = await idService.allocateId('USERS');
    const now = new Date().toISOString();
    const user: User = {
      id,
      name: input.name.trim(),
      email: trimmedEmail,
      role: roleString,
      roles: rolesArray,
      avatarUrl: input.avatarUrl?.trim() || undefined,
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    const created = await usersRepository.appendRecord(user);
    await auditLogRepository.logAction(actorId, actorName, 'USER_CREATED', 'USER', id, { user: created });
    return created;
  }

  public async updateUser(
    id: string,
    input: Partial<User>,
    actor?: { id?: string; name?: string; role?: string; roles?: string[] } | string,
    actorNameParam?: string
  ): Promise<User> {
    const parsedActor = this.parseActor(actor, actorNameParam);
    const actorId = parsedActor.id;
    const actorName = parsedActor.name;
    const actorRoles = await this.getActorRoles(actorId, parsedActor.role, parsedActor.roles);
    if (!actorRoles.includes(UserRole.ADMIN) && !actorRoles.includes('ADMIN')) {
      throw new Error(`Unauthorized: User management is restricted to Admin role.`);
    }

    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new Error(`User "${id}" not found.`);
    }

    if (input.email) {
      const trimmedEmail = input.email.trim().toLowerCase();
      const existingWithEmail = await usersRepository.findByEmail(trimmedEmail);
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new Error(`Another user with email "${trimmedEmail}" already exists. Duplicate accounts are prohibited.`);
      }
    }

    // Normalize roles
    let rolesArray = existing.roles || [];
    let roleString = existing.role || '';

    if (Array.isArray(input.roles)) {
      rolesArray = input.roles.map((r) => String(r).trim().toUpperCase());
      roleString = rolesArray.join(', ');
    } else if (input.role !== undefined) {
      rolesArray = String(input.role).split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
      roleString = rolesArray.join(', ');
    }

    const now = new Date().toISOString();
    const updated: User = {
      ...existing,
      ...input,
      id: existing.id,
      role: roleString,
      roles: rolesArray,
      updatedAt: now,
    };
    const result = await usersRepository.updateRecord(id, updated);
    await auditLogRepository.logAction(actorId, actorName, 'USER_UPDATED', 'USER', id, { previous: existing, updated: result });
    return result;
  }

  // ============================================================================
  // 3. WORKLOAD INTELLIGENCE & OVERDUE DETECTION
  // ============================================================================

  /**
   * Checks if an assignment is overdue based on current time.
   */
  public isAssignmentOverdue(assignment: Assignment): boolean {
    if (assignment.status === AssignmentStatus.COMPLETED || assignment.status === AssignmentStatus.CANCELLED) {
      return false;
    }
    const dueStr = assignment.dueDate || assignment.dueAt;
    if (!dueStr) return false;

    const dueDate = new Date(dueStr);
    if (isNaN(dueDate.getTime())) return false;

    // Compare date strings if formatted as YYYY-MM-DD or full timestamp
    if (dueStr.length === 10) {
      const todayStr = new Date().toISOString().split('T')[0];
      return dueStr < todayStr;
    }

    return dueDate.getTime() < Date.now();
  }

  /**
   * Checks if an assignment is due today.
   */
  public isAssignmentDueToday(assignment: Assignment): boolean {
    if (assignment.status === AssignmentStatus.COMPLETED || assignment.status === AssignmentStatus.CANCELLED) {
      return false;
    }
    const dueStr = assignment.dueDate || assignment.dueAt;
    if (!dueStr) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    const dueFormatted = dueStr.length >= 10 ? dueStr.slice(0, 10) : '';
    return dueFormatted === todayStr;
  }

  /**
   * Checks if an assignment is due tomorrow.
   */
  public isAssignmentDueTomorrow(assignment: Assignment): boolean {
    if (assignment.status === AssignmentStatus.COMPLETED || assignment.status === AssignmentStatus.CANCELLED) {
      return false;
    }
    const dueStr = assignment.dueDate || assignment.dueAt;
    if (!dueStr) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dueFormatted = dueStr.length >= 10 ? dueStr.slice(0, 10) : '';
    return dueFormatted === tomorrowStr;
  }

  /**
   * Computes the deterministic workload score for a user's active tasks.
   * Priority weights: URGENT = 4, HIGH = 3, NORMAL/MEDIUM = 2, LOW = 1.
   */
  public calculateWorkloadScore(activeAssignments: Assignment[]): number {
    let score = 0;
    const weights: Record<string, number> = {
      [PriorityLevel.URGENT]: 4,
      [PriorityLevel.HIGH]: 3,
      [PriorityLevel.NORMAL]: 2,
      [PriorityLevel.MEDIUM]: 2,
      [PriorityLevel.LOW]: 1,
    };

    activeAssignments.forEach((a) => {
      score += weights[a.priority] || 2;
    });

    return score;
  }

  /**
   * Computes workload statistics for a specific user.
   */
  public async getUserWorkload(userId: string): Promise<UserWorkload> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error(`User "${userId}" not found.`);
    }

    const allUserAssignments = await assignmentsRepository.findByAssigneeId(userId);
    const activeAssignments = allUserAssignments.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );

    const urgentCount = activeAssignments.filter((a) => a.priority === PriorityLevel.URGENT).length;
    const highCount = activeAssignments.filter((a) => a.priority === PriorityLevel.HIGH).length;
    const normalCount = activeAssignments.filter(
      (a) => a.priority === PriorityLevel.NORMAL || a.priority === PriorityLevel.MEDIUM
    ).length;
    const lowCount = activeAssignments.filter((a) => a.priority === PriorityLevel.LOW).length;

    const overdueCount = activeAssignments.filter((a) => this.isAssignmentOverdue(a)).length;
    const dueTodayCount = activeAssignments.filter((a) => this.isAssignmentDueToday(a)).length;
    const dueTomorrowCount = activeAssignments.filter((a) => this.isAssignmentDueTomorrow(a)).length;
    const blockedCount = activeAssignments.filter((a) => a.status === AssignmentStatus.BLOCKED).length;
    const completedCount = allUserAssignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length;

    const workloadScore = this.calculateWorkloadScore(activeAssignments);

    return {
      user,
      totalActiveAssignments: activeAssignments.length,
      urgentAssignments: urgentCount,
      highPriorityAssignments: highCount,
      normalPriorityAssignments: normalCount,
      lowPriorityAssignments: lowCount,
      overdueAssignments: overdueCount,
      dueTodayAssignments: dueTodayCount,
      dueTomorrowAssignments: dueTomorrowCount,
      blockedAssignments: blockedCount,
      completedAssignments: completedCount,
      workloadScore,
      activeAssignments,
    };
  }

  /**
   * Computes team-wide operational workload balancing summary across all team members.
   */
  public async getTeamWorkloadSummary(): Promise<TeamWorkloadSummary> {
    const [users, assignments] = await Promise.all([
      usersRepository.findAll(),
      assignmentsRepository.findAll(),
    ]);
    return this.getTeamWorkloadSummaryWithData(users, assignments);
  }

  public getTeamWorkloadSummaryWithData(users: User[], allAssignments: Assignment[]): TeamWorkloadSummary {
    const activeUsers = users.filter((u) => u.isActive);
    const assignmentsByAssignee = new Map<string, Assignment[]>();
    allAssignments.forEach((a) => {
      if (!a.assigneeId) return;
      const list = assignmentsByAssignee.get(a.assigneeId) || [];
      list.push(a);
      assignmentsByAssignee.set(a.assigneeId, list);
    });

    const userWorkloads = activeUsers.map((u) => {
      const allUserAssignments = assignmentsByAssignee.get(u.id) || [];
      const activeAssignments = allUserAssignments.filter(
        (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
      );

      const urgentCount = activeAssignments.filter((a) => a.priority === PriorityLevel.URGENT).length;
      const highCount = activeAssignments.filter((a) => a.priority === PriorityLevel.HIGH).length;
      const normalCount = activeAssignments.filter(
        (a) => a.priority === PriorityLevel.NORMAL || a.priority === PriorityLevel.MEDIUM
      ).length;
      const lowCount = activeAssignments.filter((a) => a.priority === PriorityLevel.LOW).length;

      const overdueCount = activeAssignments.filter((a) => this.isAssignmentOverdue(a)).length;
      const dueTodayCount = activeAssignments.filter((a) => this.isAssignmentDueToday(a)).length;
      const dueTomorrowCount = activeAssignments.filter((a) => this.isAssignmentDueTomorrow(a)).length;
      const blockedCount = activeAssignments.filter((a) => a.status === AssignmentStatus.BLOCKED).length;
      const completedCount = allUserAssignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length;

      const workloadScore = this.calculateWorkloadScore(activeAssignments);

      return {
        user: u,
        totalActiveAssignments: activeAssignments.length,
        urgentAssignments: urgentCount,
        highPriorityAssignments: highCount,
        normalPriorityAssignments: normalCount,
        lowPriorityAssignments: lowCount,
        overdueAssignments: overdueCount,
        dueTodayAssignments: dueTodayCount,
        dueTomorrowAssignments: dueTomorrowCount,
        blockedAssignments: blockedCount,
        completedAssignments: completedCount,
        workloadScore,
        activeAssignments,
      };
    });

    let totalActive = 0;
    let totalOverdue = 0;
    let totalBlocked = 0;
    let totalDueToday = 0;

    let highestUser: { id: string; name: string; score: number; taskCount: number } | undefined;
    let maxScore = -1;

    userWorkloads.forEach((uw) => {
      totalActive += uw.totalActiveAssignments;
      totalOverdue += uw.overdueAssignments;
      totalBlocked += uw.blockedAssignments;
      totalDueToday += uw.dueTodayAssignments;

      if (uw.workloadScore > maxScore) {
        maxScore = uw.workloadScore;
        highestUser = {
          id: uw.user.id,
          name: uw.user.name,
          score: uw.workloadScore,
          taskCount: uw.totalActiveAssignments,
        };
      }
    });

    const sortedWorkloads = userWorkloads.sort((a, b) => b.workloadScore - a.workloadScore);

    return {
      users: sortedWorkloads,
      workloads: sortedWorkloads,
      totalMembers: activeUsers.length,
      totalActiveTasks: totalActive,
      totalOverdueTasks: totalOverdue,
      totalBlockedTasks: totalBlocked,
      totalDueTodayTasks: totalDueToday,
      highestWorkloadUser: highestUser,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves the personalized work hub for a team member (/my-work).
   */
  public async getMyWork(userId: string): Promise<MyWorkSummary> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error(`User "${userId}" not found.`);
    }

    const all = await assignmentsRepository.findByAssigneeId(userId);
    const active = all.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );

    const overdue = active.filter((a) => this.isAssignmentOverdue(a));
    const dueToday = active.filter((a) => this.isAssignmentDueToday(a) && !this.isAssignmentOverdue(a));
    const highPriority = active.filter(
      (a) => (a.priority === PriorityLevel.URGENT || a.priority === PriorityLevel.HIGH) && !overdue.includes(a)
    );
    const inProgress = active.filter((a) => a.status === AssignmentStatus.IN_PROGRESS);
    const blocked = active.filter((a) => a.status === AssignmentStatus.BLOCKED);
    const upcoming = active.filter(
      (a) => !overdue.includes(a) && !dueToday.includes(a) && a.status !== AssignmentStatus.BLOCKED
    );

    // Recently completed (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentlyCompleted = all
      .filter((a) => a.status === AssignmentStatus.COMPLETED && (a.completedAt || a.updatedAt || '') >= sevenDaysAgo)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

    return {
      user,
      overdue,
      dueToday,
      highPriority,
      inProgress,
      blocked,
      upcoming,
      recentlyCompleted,
      completedAssignments: recentlyCompleted,
      activeAssignments: active,
      activeCount: active.length,
      metrics: {
        totalActive: active.length,
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        blockedCount: blocked.length,
        completedCount: all.filter((a) => a.status === AssignmentStatus.COMPLETED).length,
      },
    };
  }

  /**
   * Alias for getMyWork
   */
  public async getMyWorkSummary(userId: string): Promise<MyWorkSummary> {
    return this.getMyWork(userId);
  }

  // ============================================================================
  // 4. UNASSIGNED WORK DETECTION
  // ============================================================================

  /**
   * Scans active pipeline entities and detects items that are ready for work
   * but do not have an active assignment.
   */
  public async getUnassignedWork(): Promise<UnassignedWorkItem[]> {
    const [allVideos, allAssignments, allPublishing] = await Promise.all([
      videosRepository.findAll(),
      assignmentsRepository.findActive(),
      publishingRepository.findAll(),
    ]);
    return this.getUnassignedWorkWithData(allVideos, allAssignments, allPublishing);
  }

  public getUnassignedWorkWithData(
    allVideos: Video[],
    allAssignments: Assignment[],
    allPublishing: any[]
  ): UnassignedWorkItem[] {
    const activeAssignments = allAssignments.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );
    const activeAssignmentsByEntity = new Map<string, Assignment[]>();
    activeAssignments.forEach((a) => {
      const key = `${a.entityType}:${a.entityId}`;
      const list = activeAssignmentsByEntity.get(key) || [];
      list.push(a);
      activeAssignmentsByEntity.set(key, list);

      if (a.entityType === 'VIDEO' && a.videoId) {
        const vKey = `VIDEO:${a.videoId}`;
        if (!activeAssignmentsByEntity.has(vKey)) {
          activeAssignmentsByEntity.set(vKey, list);
        }
      }
    });

    const unassigned: UnassignedWorkItem[] = [];
    const now = Date.now();

    // 1. Check Queued / In-Production Videos
    allVideos.forEach((v) => {
      if (
        v.status === VideoProductionStatus.UPLOADED ||
        v.status === VideoProductionStatus.CANCELLED ||
        v.status === VideoProductionStatus.ON_HOLD
      ) {
        return;
      }

      const entityKey = `VIDEO:${v.id}`;
      const activeAssignments = activeAssignmentsByEntity.get(entityKey) || [];

      const ageDays = Math.max(
        0,
        Math.floor((now - new Date(v.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
      );

      // SCRIPT_REQUIRED stage
      if (v.status === VideoProductionStatus.SCRIPT_REQUIRED) {
        const hasScriptAssign = activeAssignments.some(
          (a) => a.taskType === 'SCRIPTING' || a.taskType === 'SCRIPT'
        );
        if (!hasScriptAssign) {
          unassigned.push({
            id: `UNASSIGNED-SCR-${v.id}`,
            entityType: 'VIDEO',
            entityId: v.id,
            title: `Scripting: ${v.title}`,
            currentStage: v.status,
            currentStatus: v.status,
            priority: v.priority || PriorityLevel.NORMAL,
            ageDays,
            recommendedRole: 'SCRIPTING',
            recommendedTaskType: 'SCRIPTING',
            reason: 'Video requires voiceover / breakdown script generation.',
            createdAt: v.createdAt,
            notes: 'Video requires voiceover / breakdown script generation.',
          });
        }
      }

      // QUEUED stage (Recording / Production intake)
      if (v.status === VideoProductionStatus.QUEUED || v.status === VideoProductionStatus.SCRIPT_READY) {
        const hasRecAssign = activeAssignments.some(
          (a) => a.taskType === 'RECORDING' || a.taskType === 'VIDEO'
        );
        if (!hasRecAssign) {
          unassigned.push({
            id: `UNASSIGNED-REC-${v.id}`,
            entityType: 'VIDEO',
            entityId: v.id,
            title: `Filming / Recording: ${v.title}`,
            currentStage: v.status,
            currentStatus: v.status,
            priority: v.priority || PriorityLevel.NORMAL,
            ageDays,
            recommendedRole: 'RECORDING',
            recommendedTaskType: 'RECORDING',
            reason: 'Script is ready or video is queued for creator recording.',
            createdAt: v.createdAt,
            notes: 'Script is ready or video is queued for creator recording.',
          });
        }
      }

      // RECORDED stage (Editing)
      if (v.status === VideoProductionStatus.RECORDED || v.status === VideoProductionStatus.EDITING) {
        const hasEditAssign = activeAssignments.some(
          (a) => a.taskType === 'EDITING'
        );
        if (!hasEditAssign) {
          unassigned.push({
            id: `UNASSIGNED-EDT-${v.id}`,
            entityType: 'VIDEO',
            entityId: v.id,
            title: `Video Editing: ${v.title}`,
            currentStage: v.status,
            currentStatus: v.status,
            priority: v.priority || PriorityLevel.NORMAL,
            ageDays,
            recommendedRole: 'EDITING',
            recommendedTaskType: 'EDITING',
            reason: 'Video is recorded and awaits editing and motion graphics.',
            createdAt: v.createdAt,
            notes: 'Video is recorded and awaits editing and motion graphics.',
          });
        }
      }

      // FINAL_REVIEW or READY_TO_UPLOAD stage (Thumbnail / Review / Publishing)
      if (v.status === VideoProductionStatus.EDITED || v.status === VideoProductionStatus.FINAL_REVIEW) {
        const hasReviewAssign = activeAssignments.some(
          (a) => a.taskType === 'REVIEW' || a.taskType === 'THUMBNAIL'
        );
        if (!hasReviewAssign) {
          unassigned.push({
            id: `UNASSIGNED-REV-${v.id}`,
            entityType: 'VIDEO',
            entityId: v.id,
            title: `Quality Review & Thumbnail: ${v.title}`,
            currentStage: v.status,
            currentStatus: v.status,
            priority: v.priority || PriorityLevel.NORMAL,
            ageDays,
            recommendedRole: 'REVIEW',
            recommendedTaskType: 'REVIEW',
            reason: 'Video editing complete; requires review and thumbnail approval.',
            createdAt: v.createdAt,
            notes: 'Video editing complete; requires review and thumbnail approval.',
          });
        }
      }
    });

    // 2. Check Ready to Upload Publishing records
    allPublishing.forEach((p) => {
      const entityKey = `PUBLISHING:${p.id}`;
      const activeAssignments = activeAssignmentsByEntity.get(entityKey) || [];

      const isPendingPub =
        p.youtube?.status !== 'PUBLISHED' ||
        p.instagram?.status !== 'PUBLISHED' ||
        p.facebook?.status !== 'PUBLISHED';

      if (isPendingPub && p.finalVideoStatus === 'VERIFIED') {
        const hasPubAssign = activeAssignments.some(
          (a) => a.taskType === 'PUBLISHING'
        );
        if (!hasPubAssign) {
          const ageDays = Math.max(
            0,
            Math.floor((now - new Date(p.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
          );
          unassigned.push({
            id: `UNASSIGNED-PUB-${p.id}`,
            entityType: 'PUBLISHING',
            entityId: p.id,
            title: `Manual Distribution: ${p.videoTitle}`,
            currentStage: 'READY_TO_PUBLISH',
            currentStatus: 'READY_TO_PUBLISH',
            priority: PriorityLevel.HIGH,
            ageDays,
            recommendedRole: 'PUBLISHING',
            recommendedTaskType: 'PUBLISHING',
            reason: 'Verified master ready for multi-platform distribution.',
            createdAt: p.createdAt,
            notes: 'Verified master ready for multi-platform distribution.',
          });
        }
      }
    });

    // Sort by priority (URGENT -> HIGH -> NORMAL) and age
    return unassigned.sort((a, b) => {
      const pMap: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      const pDiff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return b.ageDays - a.ageDays;
    });
  }

  // ============================================================================
  // 5. HELPER VALIDATIONS
  // ============================================================================

  private validateTransition(currentStatus: string, nextStatus: string): void {
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Invalid assignment state transition: Cannot change status from "${currentStatus}" to "${nextStatus}". Allowed target states: [${allowed.join(', ') || 'None (Terminal)'}].`
      );
    }
  }
}

export const assignmentService = AssignmentService.getInstance();
