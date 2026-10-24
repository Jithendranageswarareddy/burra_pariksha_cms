import { canonicalIdService } from '../../../../shared/lib/id.service';
import {
  ProductionEffortRecord,
  ProductionEffortRecordSchema,
  RecordProductionEffortInput,
  RecordProductionEffortInputSchema,
} from '../../../../shared/contracts/production-effort.contract';
import { productionEffortRepository } from '../../../../database/firestore/repositories/production-effort.repository';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import { ForbiddenError, NotFoundError } from '../../../../src/lib/errors';

export interface ProductionEffortActor {
  id: string;
  role?: string;
}

export interface ProductionEffortPersistence {
  create(record: ProductionEffortRecord): Promise<ProductionEffortRecord>;
  findById(id: string): Promise<ProductionEffortRecord | null>;
  findByArtifactPlatform(artifactId: string, platform: string): Promise<ProductionEffortRecord[]>;
  findLatestByArtifactPlatform(artifactId: string, platform: string): Promise<ProductionEffortRecord | null>;
  update(
    id: string,
    expectedVersion: number,
    patch: Partial<ProductionEffortRecord>,
    context?: { actorId: string }
  ): Promise<ProductionEffortRecord>;
}

export interface ProductionEffortAudit {
  log(
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, unknown>
  ): Promise<unknown>;
}

const productionEffortPersistence: ProductionEffortPersistence = {
  create: (record) => productionEffortRepository.create(record),
  findById: (id) => productionEffortRepository.findById(id),
  findByArtifactPlatform: (artifactId, platform) =>
    productionEffortRepository.findByArtifactPlatform(artifactId, platform),
  findLatestByArtifactPlatform: (artifactId, platform) =>
    productionEffortRepository.findLatestByArtifactPlatform(artifactId, platform),
  update: async (id, expectedVersion, patch) => {
    const updated = await productionEffortRepository.updateRecord(id, patch, { expectedVersion });
    if (!updated) {
      throw new NotFoundError(`Production effort record "${id}" does not exist.`);
    }
    return updated;
  },
};

const PRODUCTION_EFFORT_ROLES = new Set([
  'ADMIN',
  'CONTENT_LEAD',
  'CONTENT_MANAGER',
  'CONTENT_WRITER',
  'QUESTION_AUTHOR',
  'QUESTION_CREATOR',
  'QUESTION_EDITOR',
  'CREATOR',
  'TOPIC_LEAD',
  'QA_REVIEWER',
  'REVIEWER',
]);

export class ProductionEffortService {
  public constructor(
    private readonly repository: ProductionEffortPersistence = productionEffortPersistence,
    private readonly audit: ProductionEffortAudit = auditService
  ) {}

  public async record(
    input: RecordProductionEffortInput,
    actor: ProductionEffortActor,
    actorName = actor.id
  ): Promise<ProductionEffortRecord> {
    this.assertActor(actor);
    const parsed = RecordProductionEffortInputSchema.parse(input);
    const now = new Date().toISOString();
    const existing = parsed.expectedVersion !== undefined
      ? await this.repository.findLatestByArtifactPlatform(parsed.artifactId, parsed.platform)
      : null;

    if (parsed.expectedVersion !== undefined) {
      if (!existing) {
        throw new NotFoundError(`Production effort record for artifact "${parsed.artifactId}" does not exist.`);
      }
      const updated = await this.repository.update(
        existing.id,
        parsed.expectedVersion,
        {
          ...parsed,
          expectedVersion: undefined,
          recordedBy: actor.id,
          recordedAt: now,
          updatedAt: now,
        } as Partial<ProductionEffortRecord>,
        { actorId: actor.id }
      );
      await this.audit.log(actor.id, actorName, 'PRODUCTION_EFFORT_UPDATED', 'PRODUCTION_EFFORT', updated.id, {
        artifactId: updated.artifactId,
        platform: updated.platform,
        version: updated.version,
      });
      return updated;
    }

    const record = ProductionEffortRecordSchema.parse({
      ...parsed,
      id: canonicalIdService.generateCanonicalId('eff_'),
      // S17-T01 keeps operator observations authoritative and prevents
      // reporting code from silently treating workflow timestamps as metrics.
      provenance: {
        kind: 'OBSERVED',
        sourceReference: actor.id,
        observedAt: now,
      },
      recordedBy: actor.id,
      recordedAt: now,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    const created = await this.repository.create(record);
    await this.audit.log(actor.id, actorName, 'PRODUCTION_EFFORT_RECORDED', 'PRODUCTION_EFFORT', created.id, {
      artifactId: created.artifactId,
      platform: created.platform,
      version: created.version,
    });
    return created;
  }

  public async listForArtifact(
    artifactId: string,
    platform: string,
    actor: ProductionEffortActor
  ): Promise<ProductionEffortRecord[]> {
    this.assertActor(actor);
    return this.repository.findByArtifactPlatform(artifactId, platform);
  }

  private assertActor(actor: ProductionEffortActor): void {
    if (!actor.id.trim() || !actor.role || !PRODUCTION_EFFORT_ROLES.has(actor.role.toUpperCase())) {
      throw new ForbiddenError('A recognized content-production capability is required to record production effort.');
    }
  }
}

export const productionEffortService = new ProductionEffortService();
