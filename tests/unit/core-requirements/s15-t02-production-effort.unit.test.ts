import assert from 'node:assert/strict';
import { ProductionEffortService } from '../../../backend/features/analytics/services/production-effort.service';

const metric = (value: number) => ({ availability: 'AVAILABLE' as const, value });
const input = {
  artifactId: 'vid_550e8400-e29b-41d4-a716-446655440000',
  learningUnitId: 'lnu_550e8400-e29b-41d4-a716-446655440000',
  platform: 'youtube',
  mode: 'TOPIC_INTRODUCTION',
  format: 'VIDEO',
  audienceContext: 'STUDENTS',
  productionTimeMinutes: metric(120),
  cost: metric(10),
  revisionCount: metric(2),
  rejectionCount: metric(1),
  reuseCount: metric(3),
  currency: 'INR',
} as any;

const records = new Map<string, any>();
// The fake store models Firestore's version check so stale writes cannot pass
// merely because the metric payload itself is otherwise valid.
const repository = {
  create: async (record: any) => { records.set(record.id, record); return record; },
  findById: async (id: string) => records.get(id) || null,
  findLatestByArtifactPlatform: async (artifactId: string, platform: string) =>
    [...records.values()].find((record) => record.artifactId === artifactId && record.platform === platform) || null,
  findByArtifactPlatform: async (artifactId: string, platform: string) =>
    [...records.values()].filter((record) => record.artifactId === artifactId && record.platform === platform),
  update: async (id: string, expectedVersion: number, patch: any) => {
    const current = records.get(id);
    if (current.version !== expectedVersion) {
      throw new Error(`expected version ${expectedVersion}, current version ${current.version}`);
    }
    const updated = { ...current, ...patch, version: current.version + 1 };
    records.set(id, updated);
    return updated;
  },
};
const audit = { log: async (...args: unknown[]) => args };
const service = new ProductionEffortService(repository, audit);
const actor = { id: 'usr_recorder', role: 'CONTENT_WRITER' };

const created = await service.record(input, actor);
const secondPlatform = await service.record({ ...input, platform: 'instagram' }, actor);
assert.equal(created.version, 1);
assert.notEqual(created.id, secondPlatform.id);
assert.equal(created.recordedBy, actor.id);
assert.equal(created.currency, 'INR');
assert.deepEqual(created.provenance, {
  kind: 'OBSERVED',
  sourceReference: actor.id,
  observedAt: created.recordedAt,
});
if (created.productionTimeMinutes.availability === 'AVAILABLE') {
  assert.equal(created.productionTimeMinutes.value, 120);
}

const updated = await service.record({ ...input, expectedVersion: 1, cost: metric(12) }, actor);
assert.equal(updated.version, 2);
if (updated.cost.availability === 'AVAILABLE') {
  assert.equal(updated.cost.value, 12);
}

await assert.rejects(
  () => service.record({ ...input, expectedVersion: 1 }, actor),
  /does not exist|version/
);
await assert.rejects(
  () => service.record(input, { id: 'usr_viewer', role: 'VIEWER' }),
  /capability/
);
await assert.rejects(
  () => service.record({ ...input, productionTimeMinutes: 0 }, actor),
  /Invalid input/
);
await assert.rejects(
  () => service.record({ ...input, provenance: created.provenance }, actor),
  /provenance/
);
await assert.rejects(
  () => service.record({ ...input, recordedBy: 'spoofed-user' }, actor),
  /recordedBy/
);
console.log('S15-T02 production effort tests passed (persistence, actor attribution, OCC, validation, and authorization).');
