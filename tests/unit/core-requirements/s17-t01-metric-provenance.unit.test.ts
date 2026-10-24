import assert from 'node:assert/strict';
import {
  ProductionEffortProvenanceSchema,
  ProductionEffortRecord,
  ProductionEffortRecordSchema,
} from '../../../shared/contracts/production-effort.contract';
import { ProductionEffortService } from '../../../backend/features/analytics/services/production-effort.service';

const metric = (value: number) => ({ availability: 'AVAILABLE' as const, value });
const input = {
  artifactId: 'vid_550e8400-e29b-41d4-a716-446655440000',
  platform: 'youtube',
  productionTimeMinutes: metric(45),
  cost: { availability: 'AVAILABLE' as const, value: 10 },
  revisionCount: metric(1),
  rejectionCount: metric(0),
  reuseCount: metric(0),
  currency: 'INR',
  recordedBy: 'client-value',
  recordedAt: '2026-10-24T12:00:00.000Z',
};

const records = new Map<string, ProductionEffortRecord>();
const repository = {
  create: async (record: ProductionEffortRecord) => {
    records.set(record.id, record);
    return record;
  },
  findById: async (id: string) => records.get(id) || null,
  findLatestByArtifactPlatform: async () => null,
  findByArtifactPlatform: async () => [...records.values()],
  update: async () => {
    throw new Error('not used');
  },
};
const audit = { log: async (...args: unknown[]) => args };
const service = new ProductionEffortService(repository, audit);

const created = await service.record(input, {
  id: 'usr_operator',
  role: 'CONTENT_WRITER',
});

assert.equal(created.provenance.kind, 'OBSERVED');
assert.equal(created.provenance.sourceReference, 'usr_operator');
if (created.productionTimeMinutes.availability === 'AVAILABLE') {
  assert.equal(created.productionTimeMinutes.value, 45);
}
assert.equal(created.currency, 'INR');
assert.equal(created.recordedAt, created.provenance.observedAt);
assert.equal(
  ProductionEffortRecordSchema.safeParse(created).success,
  true,
);

assert.equal(
  ProductionEffortProvenanceSchema.safeParse({
    kind: 'DERIVED',
    sourceReference: 'analytics-window-2026-10',
    sourceVersion: 'provider-v1',
    sourceWindowStart: '2026-10-01T00:00:00.000Z',
    sourceWindowEnd: '2026-11-01T00:00:00.000Z',
    derivationPolicyId: 'approved-policy-v1',
    derivedAt: '2026-10-25T00:00:00.000Z',
  }).success,
  true,
);
assert.equal(
  ProductionEffortProvenanceSchema.safeParse({
    kind: 'DERIVED',
    sourceReference: 'analytics-window-2026-10',
  }).success,
  false,
);

console.log('S17-T01 metric provenance tests passed (operator authority, native currency, and derived-value provenance requirements).');
