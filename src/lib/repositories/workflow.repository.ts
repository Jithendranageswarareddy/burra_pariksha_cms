/**
 * BURRA PARIKSHA CMS - Workflow Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Workflow } from '../../types';

export class WorkflowRepository extends BaseRepository<Workflow> {
  private static instance: WorkflowRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.WORKFLOW]);
  }

  public static getInstance(): WorkflowRepository {
    if (!WorkflowRepository.instance) {
      WorkflowRepository.instance = new WorkflowRepository();
    }
    return WorkflowRepository.instance;
  }

  public async findByEntity(entityType: string, entityId: string): Promise<Workflow[]> {
    const all = await this.findAll();
    return all.filter((w) => w.entityType === entityType && w.entityId === entityId);
  }
}

export const workflowRepository = WorkflowRepository.getInstance();
