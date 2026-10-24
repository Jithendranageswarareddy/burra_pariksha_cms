import { z } from 'zod';
import {
  CanonicalContentModeSchema,
  PresentationFormatSchema,
} from './learning-unit.contract';

const LearningUnitIdSchema = z.string().regex(
  /^lnu_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  'Expected canonical LearningUnit ID.',
);

const MediaMetadataSchema = z.object({
  mediaId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  checksum: z.string().min(1),
  version: z.number().int().positive(),
}).strict();

const ProjectionBaseSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  mode: CanonicalContentModeSchema,
  title: z.string().trim().min(3).max(180),
  updatedAt: z.string().datetime({ offset: true }),
});

/**
 * One projection supports both editor and audience preview consumers. Text
 * remains structured application content; media formats expose metadata only,
 * so binary payloads never cross the shared frontend/backend contract.
 */
export const ArtifactEditorProjectionSchema = z.discriminatedUnion('format', [
  ProjectionBaseSchema.extend({
    format: z.literal('TEXT'),
    content: z.object({
      body: z.string().min(1),
      language: z.enum(['TELUGU', 'ENGLISH', 'BILINGUAL']),
    }).strict(),
  }).strict(),
  ProjectionBaseSchema.extend({
    format: z.literal('VIDEO'),
    media: MediaMetadataSchema,
  }).strict(),
  ProjectionBaseSchema.extend({
    format: z.literal('AUDIO'),
    media: MediaMetadataSchema,
  }).strict(),
  ProjectionBaseSchema.extend({
    format: z.literal('IMAGE'),
    media: MediaMetadataSchema,
  }).strict(),
  ProjectionBaseSchema.extend({
    format: z.literal('ANIMATION'),
    media: MediaMetadataSchema,
  }).strict(),
]);

export const ArtifactPreviewProjectionSchema = ArtifactEditorProjectionSchema;

export type ArtifactEditorProjection = z.infer<typeof ArtifactEditorProjectionSchema>;
export type ArtifactPreviewProjection = z.infer<typeof ArtifactPreviewProjectionSchema>;

export function createArtifactEditorProjection(input: unknown): ArtifactEditorProjection {
  return ArtifactEditorProjectionSchema.parse(input);
}

export function createArtifactPreviewProjection(input: unknown): ArtifactPreviewProjection {
  return ArtifactPreviewProjectionSchema.parse(input);
}

// Keep the format schema available to projection consumers without duplicating
// the canonical five-format list in frontend code.
export { PresentationFormatSchema };
