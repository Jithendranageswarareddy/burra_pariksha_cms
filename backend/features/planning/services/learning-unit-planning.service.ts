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

export interface EditorialCalendarFilters extends LearningUnitFilterInput {
  mode?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface EditorialCalendarEntry {
  id: string;
  learningUnitId: string;
  title: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  mode?: string;
  format?: string;
  audienceContext?: string;
  status: string;
  updatedAt: string;
}

export interface EditorialCalendarPage {
  entries: EditorialCalendarEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

  /**
   * Projects planning records into an operational calendar. It deliberately
   * reads the existing LearningUnit repository and never creates calendar
   * records, dates, workflow states, or a competing persistence source.
   */
  public async listEditorialCalendar(
    filters: EditorialCalendarFilters = {}
  ): Promise<EditorialCalendarPage> {
    const {
      mode,
      status,
      page: requestedPage,
      limit: requestedLimit,
      ...planningFilters
    } = filters;
    const records = await this.repository.query(planningFilters);
    const normalizedMode = mode?.trim().toUpperCase() === 'EXPLAINED_QUESTIONS_VIDEO'
      ? 'WORKED_EXAMPLES'
      : mode?.trim().toUpperCase();
    const normalizedStatus = status?.trim().toUpperCase();
    const entries = records.flatMap((record) => {
      const modes = record.suggestedModes?.length ? record.suggestedModes : [undefined];
      return modes
        .filter((recordMode) => !normalizedMode || (
          recordMode === normalizedMode ||
          (recordMode === 'EXPLAINED_QUESTIONS_VIDEO' && normalizedMode === 'WORKED_EXAMPLES')
        ))
        .map((recordMode) => ({
          id: `${record.id}:${recordMode || 'UNSPECIFIED'}`,
          learningUnitId: record.id,
          title: record.title,
          topicId: record.topicId,
          topicName: record.topicName,
          subtopicId: record.subtopicId,
          subtopicName: record.subtopicName,
          mode: recordMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 'WORKED_EXAMPLES' : recordMode,
          format: record.primaryFormat,
          audienceContext: record.audienceContext,
          status: record.planningStatus || 'DRAFT',
          updatedAt: record.updatedAt,
        }));
    })
      .filter((entry) => !normalizedStatus || entry.status === normalizedStatus)
      .sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.learningUnitId.localeCompare(right.learningUnitId) ||
        (left.mode || '').localeCompare(right.mode || '')
      );
    const limit = Number.isInteger(requestedLimit) && requestedLimit! > 0
      ? Math.min(requestedLimit!, 100)
      : 25;
    const page = Number.isInteger(requestedPage) && requestedPage! > 0 ? requestedPage! : 1;
    const start = (page - 1) * limit;
    return {
      entries: entries.slice(start, start + limit),
      page,
      limit,
      total: entries.length,
      totalPages: Math.ceil(entries.length / limit) || 1,
    };
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
