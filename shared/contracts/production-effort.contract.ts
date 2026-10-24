import { z } from 'zod';
import { PerformanceDimensionsSchema, PerformanceMetricSchema } from './performance.contract';

/**
 * Provenance is retained with the production-effort record rather than
 * inferred by reporting consumers. Derived values require a complete,
 * auditable source and derivation policy before they can be represented.
 */
export const ProductionEffortProvenanceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('OBSERVED'),
    sourceReference: z.string().min(1),
    observedAt: z.string().datetime({ offset: true }),
  }),
  z.object({
    kind: z.literal('DERIVED'),
    sourceReference: z.string().min(1),
    sourceVersion: z.string().min(1),
    sourceWindowStart: z.string().datetime({ offset: true }),
    sourceWindowEnd: z.string().datetime({ offset: true }),
    derivationPolicyId: z.string().min(1),
    derivedAt: z.string().datetime({ offset: true }),
  }),
]);

/**
 * Production-effort observations are explicitly supplied by an authorized
 * operator. They are not derived from workflow timestamps or audience data.
 */
export const ProductionEffortRecordSchema = PerformanceDimensionsSchema.extend({
  id: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  productionTimeMinutes: PerformanceMetricSchema,
  cost: PerformanceMetricSchema,
  revisionCount: PerformanceMetricSchema,
  rejectionCount: PerformanceMetricSchema,
  reuseCount: PerformanceMetricSchema,
  provenance: ProductionEffortProvenanceSchema,
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime({ offset: true }),
  version: z.number().int().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const RecordProductionEffortInputSchema = ProductionEffortRecordSchema
  .omit({
    id: true,
    provenance: true,
    recordedBy: true,
    recordedAt: true,
    version: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    expectedVersion: z.number().int().min(1).optional(),
  })
  .strict();

export type ProductionEffortRecord = z.infer<typeof ProductionEffortRecordSchema>;
export type RecordProductionEffortInput = z.infer<typeof RecordProductionEffortInputSchema>;
