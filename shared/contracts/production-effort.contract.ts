import { z } from 'zod';
import { PerformanceDimensionsSchema, PerformanceMetricSchema } from './performance.contract';

/**
 * Production-effort observations are explicitly supplied by an authorized
 * operator. They are not derived from workflow timestamps or audience data.
 */
export const ProductionEffortRecordSchema = PerformanceDimensionsSchema.extend({
  id: z.string().min(1),
  currency: z.string().length(3).optional(),
  productionTimeMinutes: PerformanceMetricSchema,
  cost: PerformanceMetricSchema,
  revisionCount: PerformanceMetricSchema,
  rejectionCount: PerformanceMetricSchema,
  reuseCount: PerformanceMetricSchema,
  recordedBy: z.string().min(1),
  recordedAt: z.string().datetime({ offset: true }),
  version: z.number().int().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const RecordProductionEffortInputSchema = ProductionEffortRecordSchema
  .omit({ id: true, version: true, createdAt: true, updatedAt: true })
  .extend({
    expectedVersion: z.number().int().min(1).optional(),
  });

export type ProductionEffortRecord = z.infer<typeof ProductionEffortRecordSchema>;
export type RecordProductionEffortInput = z.infer<typeof RecordProductionEffortInputSchema>;
