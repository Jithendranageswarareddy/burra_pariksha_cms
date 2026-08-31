/**
 * BURRA PARIKSHA CMS - Assignments Repository
 * Phase 2 & Phase 10: Google Sheets Database Architecture & Team Operations
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Assignment, AssignmentEntityType, AssignmentStatus } from '../../types';

export class AssignmentsRepository extends BaseRepository<Assignment> {
  private static instance: AssignmentsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.ASSIGNMENTS]);
  }

  public static getInstance(): AssignmentsRepository {
    if (!AssignmentsRepository.instance) {
      AssignmentsRepository.instance = new AssignmentsRepository();
    }
    return AssignmentsRepository.instance;
  }

  /**
   * Normalizes an assignment entity to ensure backward compatibility between
   * legacy videoId and new entityType/entityId fields.
   */
  private normalizeAssignment(a: Assignment): Assignment {
    const entityType: AssignmentEntityType = (a.entityType as AssignmentEntityType) || AssignmentEntityType.VIDEO;
    const entityId = a.entityId || a.videoId || '';
    const videoId = a.videoId || (entityType === 'VIDEO' ? entityId : undefined);
    let dueDate = a.dueDate || a.dueAt || undefined;
    if (dueDate && /^\d{5}$/.test(String(dueDate).trim())) {
      const serial = Number(dueDate);
      const utcDays = serial - 25569;
      const utcMs = utcDays * 86400 * 1000;
      dueDate = new Date(utcMs).toISOString().split('T')[0];
    }
    const dueAt = a.dueAt || dueDate;
    const status = a.status === 'PENDING' ? AssignmentStatus.ASSIGNED : a.status;

    return {
      ...a,
      entityType,
      entityId,
      videoId,
      dueDate,
      dueAt,
      status,
    };
  }

  public override async findAll(): Promise<Assignment[]> {
    const all = await super.findAll();
    return all.map((a) => this.normalizeAssignment(a));
  }

  public override async findById(id: string): Promise<Assignment | null> {
    const record = await super.findById(id);
    return record ? this.normalizeAssignment(record) : null;
  }

  public async findByEntity(entityType: string, entityId: string): Promise<Assignment[]> {
    const all = await this.findAll();
    return all.filter((a) => {
      if (a.entityType === entityType && a.entityId === entityId) return true;
      if (entityType === 'VIDEO' && a.videoId === entityId) return true;
      return false;
    });
  }

  public async findByVideoId(videoId: string): Promise<Assignment[]> {
    return this.findByEntity('VIDEO', videoId);
  }

  public async findByAssigneeId(assigneeId: string): Promise<Assignment[]> {
    const all = await this.findAll();
    return all.filter((a) => a.assigneeId === assigneeId);
  }

  public async findActive(): Promise<Assignment[]> {
    const all = await this.findAll();
    return all.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );
  }

  public async findActiveByAssigneeId(assigneeId: string): Promise<Assignment[]> {
    const all = await this.findByAssigneeId(assigneeId);
    return all.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );
  }

  public async findActiveByEntity(entityType: string, entityId: string): Promise<Assignment[]> {
    const all = await this.findByEntity(entityType, entityId);
    return all.filter(
      (a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED
    );
  }
}

export const assignmentsRepository = AssignmentsRepository.getInstance();

