import assert from 'node:assert/strict';
import { ContentArtifactService } from '../../../backend/features/planning/services/content-artifact.service';
import { PercentagesDiscountsVerticalSliceService } from '../../../backend/features/planning/services/percentages-discounts-vertical-slice.service';
import { verifyDeterministicCalculation } from '../../../backend/ai/validators/deterministic-calculation-verifier';
import { validateStage02Quality } from '../../../backend/ai/validators/stage02-quality.validator';
import { PresentationFormatSchema } from '../../../shared/contracts/learning-unit.contract';
import { LearningUnit } from '../../../shared';

const timestamp = new Date(0).toISOString();
const learningUnit: LearningUnit = {
  id: 'lnu_12345678-1234-4234-8234-123456789abc',
  topicId: 'topic-percentages',
  topicName: 'Percentages',
  subtopicId: 'subtopic-discounts',
  subtopicName: 'Discounts',
  title: 'Calculate discounts',
  learningObjective: 'Calculate a percentage discount and compare final prices.',
  verifiedMethod: 'Find the discount amount, then subtract it from the marked price.',
  correctCalculations: '20% of ₹1000 is ₹200; ₹1000 - ₹200 = ₹800.',
  commonMistakes: ['Subtracting 20 instead of 20 percent.'],
  realLifeApplications: ['Compare prices while shopping.'],
  realLifeScenario: 'Comparing a percentage discount with a flat offer.',
  skillLevel: 'BEGINNER',
  editorialPillar: 'PILLAR_A',
  suggestedModes: ['TOPIC_INTRODUCTION', 'WORKED_EXAMPLES', 'QUESTION_CHALLENGE_SHORT'],
  primaryFormat: 'VIDEO',
  planningStatus: 'SUBMITTED_FOR_VERIFICATION',
  authorId: 'usr_owner',
  version: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const actor = { id: 'usr_owner' };
const artifactService = new ContentArtifactService({
  validateLink: async (id) => {
    assert.equal(id, learningUnit.id);
    return learningUnit;
  },
  uploadAsset: async (params) => ({
    id: `MEDIA-${params.mediaStage}-1`,
    contentId: params.contentId,
    learningUnitId: params.learningUnitId,
    driveFileId: `drive-${params.mediaStage.toLowerCase()}-1`,
    folderId: 'drive-synthetic-folder',
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: 4,
    checksum: '0123456789abcdef0123456789abcdef',
    version: 1,
    mediaStage: params.mediaStage,
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
});

const slice = await new PercentagesDiscountsVerticalSliceService({
  validateLink: async (id) => {
    assert.equal(id, learningUnit.id);
    return learningUnit;
  },
  artifactService,
}).build(learningUnit, actor, 'BP-CNT-SYNTHETIC-001', 'qst-synthetic-discount-001');

assert.deepEqual(slice.modes.map((mode) => mode.mode), [
  'TOPIC_INTRODUCTION',
  'WORKED_EXAMPLES',
  'QUESTION_CHALLENGE_SHORT',
]);
assert.deepEqual(slice.modes.flatMap((mode) => mode.formats).sort(), ['ANIMATION', 'AUDIO', 'AUDIO', 'IMAGE', 'TEXT', 'TEXT', 'VIDEO'].sort());
assert.deepEqual(slice.calculationChecks.map((check) => check.status), ['VERIFIED', 'VERIFIED']);
assert.equal(slice.question.learningUnitId, learningUnit.id);
assert.equal(slice.artifacts.image.driveFileId, 'drive-thumbnail-1');
assert.equal('body' in slice.artifacts.image, false);
assert.equal(slice.artifacts.audioMedia.driveFileId, 'drive-audio-1');
assert.equal(slice.artifacts.animationMedia.driveFileId, 'drive-animation-1');
assert.equal('binary' in slice.artifacts.audioMedia, false);
assert.equal(slice.artifacts.video.format, 'VIDEO');

const incorrectClaim = verifyDeterministicCalculation({
  operation: 'SUBTRACT',
  operands: [1000, 200],
  claimedResult: 820,
});
assert.equal(incorrectClaim.status, 'FAILED');

const inconsistentQuestion = {
  ...slice.question,
  correctAnswer: 'A' as const,
  explanation: 'The answer is ₹820.',
};
const consistency = validateStage02Quality(inconsistentQuestion);
assert.ok(consistency.warnings.some((warning) => warning.includes('exact answer option')));

await assert.rejects(
  () => new PercentagesDiscountsVerticalSliceService({
    validateLink: async () => {
      throw new Error('invalid Learning Unit link');
    },
    artifactService,
  }).build(learningUnit, actor, 'BP-CNT-SYNTHETIC-002', 'qst-synthetic-discount-002'),
  /invalid Learning Unit link/
);

assert.equal(PresentationFormatSchema.safeParse('AUDIOBOOK').success, false);

console.log('S12-T05 percentages/discounts vertical-slice tests passed (8 cases).');
