import { ProductionEffortRecord } from '../../../shared/contracts/production-effort.contract';
import { BaseRepository } from './base.repository';

/**
 * Authoritative Firestore persistence for explicitly recorded production
 * effort. This record is separate from immutable audience analytics snapshots.
 */
export class ProductionEffortRepository extends BaseRepository<ProductionEffortRecord> {
  public constructor() {
    super('production_effort', 'eff_');
  }

  public async findByArtifactPlatform(
    artifactId: string,
    platform: string
  ): Promise<ProductionEffortRecord[]> {
    const records = await this.findAll();
    return records
      .filter((record) => record.artifactId === artifactId && record.platform === platform)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async findLatestByArtifactPlatform(
    artifactId: string,
    platform: string
  ): Promise<ProductionEffortRecord | null> {
    const records = await this.findByArtifactPlatform(artifactId, platform);
    return records[0] || null;
  }
}

export const productionEffortRepository = new ProductionEffortRepository();
