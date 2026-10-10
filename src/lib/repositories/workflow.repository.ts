/**
 * BURRA PARIKSHA CMS - Workflow Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Workflow } from '../../types';

export class WorkflowRepository extends BaseRepository<Workflow> {
  private static instance: WorkflowRepository | null = null;

  private constructor() {
    super('workflow_instances');
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
