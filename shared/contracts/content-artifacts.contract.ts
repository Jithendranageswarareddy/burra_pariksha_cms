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

const TimingSchema = z.object({
  estimatedDurationSeconds: z.number().finite().nonnegative(),
  pauseAfterSeconds: z.array(z.number().finite().nonnegative()).default([]),
});

const AccessibilitySchema = z.object({
  transcript: z.string().trim().default(''),
  captions: z.string().trim().default(''),
  visualDescription: z.string().trim().default(''),
});

export const AudioNarrationSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  title: z.string().trim().min(3).max(180),
  narration: z.string().trim().default(''),
  language: z.enum(['TELUGU', 'ENGLISH', 'BILINGUAL']),
  timing: TimingSchema,
  pronunciationGuides: z.array(z.object({
    term: z.string().trim().min(1),
    pronunciation: z.string().trim().min(1),
  })).default([]),
  accessibility: AccessibilitySchema.default({
    transcript: '',
    captions: '',
    visualDescription: '',
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AnimationSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  description: z.string().trim().min(1),
  timing: TimingSchema,
  narration: z.string().trim().default(''),
  onScreenText: z.string().trim().default(''),
  accessibility: AccessibilitySchema.default({
    transcript: '',
    captions: '',
    visualDescription: '',
  }),
});

export const AnimationBriefSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  title: z.string().trim().min(3).max(180),
  scenes: z.array(AnimationSceneSchema).min(1),
  pronunciationGuides: z.array(z.object({
    term: z.string().trim().min(1),
    pronunciation: z.string().trim().min(1),
  })).default([]),
  accessibility: AccessibilitySchema.default({
    transcript: '',
    captions: '',
    visualDescription: '',
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AudioArtifactInputSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  contentId: z.string().min(1),
  fileName: z.string().regex(/^[^./\\][^/\\]*\.(?:wav|mp3|aac)$/i, 'Only safe WAV/MP3/AAC filenames are accepted.'),
  mimeType: z.enum(['audio/wav', 'audio/mpeg', 'audio/aac']),
  fileSize: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export const AnimationArtifactInputSchema = z.object({
  id: z.string().min(1),
  learningUnitId: LearningUnitIdSchema,
  contentId: z.string().min(1),
  fileName: z.string().regex(/^[^./\\][^/\\]*\.(?:mp4|webm|gif)$/i, 'Only safe MP4/WebM/GIF filenames are accepted.'),
  mimeType: z.enum(['video/mp4', 'video/webm', 'image/gif']),
  fileSize: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export const AudioArtifactMetadataSchema = AudioArtifactInputSchema.extend({
  driveFileId: z.string().min(1),
  folderId: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{32}$/i),
  version: z.number().int().positive(),
});

export const AnimationArtifactMetadataSchema = AnimationArtifactInputSchema.extend({
  driveFileId: z.string().min(1),
  folderId: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{32}$/i),
  version: z.number().int().positive(),
});

export type TextArtifact = z.infer<typeof TextArtifactSchema>;
export type ImageArtifactInput = z.infer<typeof ImageArtifactInputSchema>;
export type ImageArtifactMetadata = z.infer<typeof ImageArtifactMetadataSchema>;
export type AudioNarration = z.infer<typeof AudioNarrationSchema>;
export type AnimationBrief = z.infer<typeof AnimationBriefSchema>;
export type AudioArtifactInput = z.infer<typeof AudioArtifactInputSchema>;
export type AnimationArtifactInput = z.infer<typeof AnimationArtifactInputSchema>;
export type AudioArtifactMetadata = z.infer<typeof AudioArtifactMetadataSchema>;
export type AnimationArtifactMetadata = z.infer<typeof AnimationArtifactMetadataSchema>;
