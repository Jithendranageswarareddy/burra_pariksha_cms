import {
  CreateLearningUnitInput,
  LearningUnit,
  LearningUnitPlanningDto,
  LearningUnitPlanningResponse,
  UpdateLearningUnitInput,
} from '../../../../shared';
import {
  learningUnitsRepository,
  LearningUnitActor,
  LearningUnitFilterInput,
} from '../../../../database/firestore/repositories/learning-units.repository';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import { NotFoundError } from '../../../../src/lib/errors';

interface LearningUnitPlanningRepository {
  create(input: CreateLearningUnitInput, options: { actor: LearningUnitActor }): Promise<LearningUnit>;
  update(
    id: string,
    updates: UpdateLearningUnitInput,
    options: { expectedVersion: number; actor: LearningUnitActor }
  ): Promise<LearningUnit>;
  findById(id: string): Promise<LearningUnit | null>;
  query(filter?: LearningUnitFilterInput): Promise<LearningUnit[]>;
}

interface LearningUnitPlanningAuditLogger {
  log(
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, unknown>
  ): Promise<unknown>;
}

export class LearningUnitPlanningService {
  public constructor(
    private readonly repository: LearningUnitPlanningRepository = learningUnitsRepository,
    private readonly auditLogger: LearningUnitPlanningAuditLogger = auditService
  ) {}

  public async list(filter?: LearningUnitFilterInput): Promise<LearningUnitPlanningDto[]> {
    const records = await this.repository.query(filter);
    return records.map((record) => this.toPlanningDto(record));
  }

  public async get(id: string): Promise<LearningUnitPlanningDto> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError(`LearningUnit with ID "${id}" does not exist.`);
    }
    return this.toPlanningDto(record);
  }

  public async saveDraft(
    input: Omit<CreateLearningUnitInput, 'authorId' | 'authorName' | 'planningStatus'>,
    actor: LearningUnitActor
  ): Promise<LearningUnitPlanningResponse> {
    const record = await this.repository.create(
      { ...input, planningStatus: 'DRAFT', authorId: actor.id, authorName: actor.name },
      { actor }
    );
    await this.auditLogger.log(actor.id, actor.name || actor.id, 'SAVE_LEARNING_UNIT_DRAFT', 'LEARNING_UNIT', record.id, {
      operation: 'SAVE_DRAFT',
      planningStatus: 'DRAFT',
    });
    return this.toResponse(record, 'SAVE_DRAFT');
  }

  public async updateDraft(
    id: string,
    input: UpdateLearningUnitInput,
    expectedVersion: number,
    actor: LearningUnitActor
  ): Promise<LearningUnitPlanningResponse> {
    const record = await this.repository.update(
      id,
      { ...input, planningStatus: 'DRAFT' },
      { expectedVersion, actor }
    );
    await this.auditLogger.log(actor.id, actor.name || actor.id, 'SAVE_LEARNING_UNIT_DRAFT', 'LEARNING_UNIT', record.id, {
      operation: 'SAVE_DRAFT',
      planningStatus: 'DRAFT',
    });
    return this.toResponse(record, 'SAVE_DRAFT');
  }

  public async submitForVerification(
    id: string,
    expectedVersion: number,
    actor: LearningUnitActor
  ): Promise<LearningUnitPlanningResponse> {
    const record = await this.repository.update(
      id,
      { planningStatus: 'SUBMITTED_FOR_VERIFICATION' },
      { expectedVersion, actor }
    );
    await this.auditLogger.log(actor.id, actor.name || actor.id, 'SUBMIT_LEARNING_UNIT_FOR_VERIFICATION', 'LEARNING_UNIT', record.id, {
      operation: 'SUBMIT_FOR_VERIFICATION',
      planningStatus: 'SUBMITTED_FOR_VERIFICATION',
    });
    return this.toResponse(record, 'SUBMIT_FOR_VERIFICATION');
  }

  private toResponse(record: LearningUnit, operation: LearningUnitPlanningResponse['operation']): LearningUnitPlanningResponse {
    return { learningUnit: this.toPlanningDto(record), operation, workflowAdvanced: false };
  }

  private toPlanningDto(record: LearningUnit): LearningUnitPlanningDto {
    const {
      authorId: _authorId,
      authorName: _authorName,
      ...audienceSafeFields
    } = record;
    return {
      ...audienceSafeFields,
      planningStatus: record.planningStatus || 'DRAFT',
    };
  }
}

export const learningUnitPlanningService = new LearningUnitPlanningService();
