import { z } from 'zod';

const LearningUnitIdSchema = z.string().regex(/^lnu_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, 'Expected canonical LearningUnit ID.');

export const TextArtifactSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(1).max(100_000),
  language: z.enum(['TELUGU', 'ENGLISH', 'BILINGUAL']).default('TELUGU'),
  format: z.enum(['PLAIN_TEXT', 'RICH_TEXT', 'TABLE', 'DIAGRAM_BRIEF']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ImageArtifactInputSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  contentId: z.string().min(1),
  fileName: z.string().regex(/^[^./\\][^/\\]*\.(?:png|jpe?g)$/i, 'Only safe PNG/JPEG filenames are accepted.'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg']),
  fileSize: z.number().int().positive(),
  altText: z.string().trim().min(1).max(500),
  createdAt: z.string().datetime(),
});

export const ImageArtifactMetadataSchema = ImageArtifactInputSchema.extend({
  driveFileId: z.string().min(1),
  folderId: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{32}$/i),
  version: z.number().int().positive(),
});

export type TextArtifact = z.infer<typeof TextArtifactSchema>;
export type ImageArtifactInput = z.infer<typeof ImageArtifactInputSchema>;
export type ImageArtifactMetadata = z.infer<typeof ImageArtifactMetadataSchema>;
