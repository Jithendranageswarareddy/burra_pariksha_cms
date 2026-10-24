/**
 * BURRA PARIKSHA CMS — S11-T01: Core Requirements Contracts & Compatibility Tests
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * Architectural Decision: ADR-015
 *
 * Verifies:
 * 1. Three Canonical Content Modes and explicit legacy mapping for EXPLAINED_QUESTIONS_VIDEO.
 * 2. Content Mode Registry alias transparency for WORKED_EXAMPLES.
 * 3. Five Presentation Formats: TEXT, VIDEO, AUDIO, IMAGE, ANIMATION.
 * 4. Seven Audience Contexts defined by the requirements.
 * 5. Four Skill Levels (FOUNDATION, BEGINNER, INTERMEDIATE, ADVANCED) and difficulty mapping.
 * 6. Initial Editorial Pillars A–F.
 * 7. LearningUnit entity and DTO Zod validation contracts.
 * 8. Canonical ID Service support for 'lnu_' prefix.
 * 9. Compatibility with representative existing QuestionDraft, Video, and ProductionContext payloads.
 */

import assert from 'node:assert/strict';
import {
  CANONICAL_CONTENT_MODES,
  CANONICAL_CONTENT_MODE_METADATA,
  SUPPORTED_CONTENT_MODES,
  resolveCanonicalContentMode,
  toLegacyContentMode,
  isCanonicalContentMode,
  isSupportedContentMode,
  PRESENTATION_FORMATS,
  PRESENTATION_FORMAT_METADATA,
  isPresentationFormat,
  AUDIENCE_CONTEXTS,
  AUDIENCE_CONTEXT_METADATA,
  isAudienceContext,
  SKILL_LEVELS,
  SKILL_LEVEL_METADATA,
  isSkillLevel,
  mapDifficultyToSkillLevel,
  EDITORIAL_PILLARS,
  EDITORIAL_PILLAR_METADATA,
  isEditorialPillar,
} from '../../../shared/constants/core-requirements';
import {
  CanonicalContentModeSchema,
  SupportedContentModeSchema,
  PresentationFormatSchema,
  AudienceContextSchema,
  SkillLevelSchema,
  EditorialPillarSchema,
  validateLearningUnit,
  validateCreateLearningUnitInput,
  validateUpdateLearningUnitInput,
} from '../../../shared/contracts/learning-unit.contract';
import { contentModeRegistry } from '../../../shared/registry/content-mode.registry';
import { canonicalIdService } from '../../../shared/lib/id.service';
import { QuestionDraft } from '../../../shared/types/question';
import { Video } from '../../../shared/types/content';
import { ProductionContextEntityIds } from '../../../shared/types/production-context';
import { DifficultyLevel, PriorityLevel, QuestionStatus, VideoProductionStatus } from '../../../shared/constants/enums';

async function runS11T01Tests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE S11-T01: Core Requirements Contracts & Compatibility');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Canonical Content Modes & Metadata (bp_cms_core_requirements1.md Section 2)
  // --------------------------------------------------------------------------
  console.log('[Test 1] Canonical Content Modes and sequence integrity...');
  assert.strictEqual(CANONICAL_CONTENT_MODES.length, 3);
  assert.deepStrictEqual([...CANONICAL_CONTENT_MODES], [
    'TOPIC_INTRODUCTION',
    'WORKED_EXAMPLES',
    'QUESTION_CHALLENGE_SHORT',
  ]);

  // Mode 1: TOPIC_INTRODUCTION
  const m1Meta = CANONICAL_CONTENT_MODE_METADATA.TOPIC_INTRODUCTION;
  assert.strictEqual(m1Meta.code, 'MODE_1');
  assert.strictEqual(m1Meta.displayName, 'Topic Introduction Video');
  assert.strictEqual(m1Meta.defaultQuestionCount, 0);

  // Mode 2: WORKED_EXAMPLES
  const m2Meta = CANONICAL_CONTENT_MODE_METADATA.WORKED_EXAMPLES;
  assert.strictEqual(m2Meta.code, 'MODE_2');
  assert.strictEqual(m2Meta.displayName, 'Worked Examples Video');
  assert.strictEqual(m2Meta.legacyAlias, 'EXPLAINED_QUESTIONS_VIDEO');

  // Mode 3: QUESTION_CHALLENGE_SHORT
  const m3Meta = CANONICAL_CONTENT_MODE_METADATA.QUESTION_CHALLENGE_SHORT;
  assert.strictEqual(m3Meta.code, 'MODE_3');
  assert.strictEqual(m3Meta.displayName, 'Question Challenge Short');
  assert.strictEqual(m3Meta.defaultQuestionCount, 1);
  console.log('  -> PASS: All 3 canonical content modes verified with exact metadata.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Legacy Compatibility Mapping for EXPLAINED_QUESTIONS_VIDEO (Section 8)
  // --------------------------------------------------------------------------
  console.log('[Test 2] Legacy content mode mapping & alias resolution...');
  assert.strictEqual(resolveCanonicalContentMode('EXPLAINED_QUESTIONS_VIDEO'), 'WORKED_EXAMPLES');
  assert.strictEqual(resolveCanonicalContentMode('WORKED_EXAMPLES'), 'WORKED_EXAMPLES');
  assert.strictEqual(resolveCanonicalContentMode('TOPIC_INTRODUCTION'), 'TOPIC_INTRODUCTION');
  assert.strictEqual(resolveCanonicalContentMode('QUESTION_CHALLENGE_SHORT'), 'QUESTION_CHALLENGE_SHORT');

  assert.strictEqual(toLegacyContentMode('WORKED_EXAMPLES'), 'EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(toLegacyContentMode('TOPIC_INTRODUCTION'), 'TOPIC_INTRODUCTION');

  assert.strictEqual(isCanonicalContentMode('WORKED_EXAMPLES'), true);
  assert.strictEqual(isCanonicalContentMode('EXPLAINED_QUESTIONS_VIDEO'), false);
  assert.strictEqual(isSupportedContentMode('EXPLAINED_QUESTIONS_VIDEO'), true);
  assert.strictEqual(isSupportedContentMode('WORKED_EXAMPLES'), true);
  assert.strictEqual(isSupportedContentMode('INVALID_MODE'), false);

  assert.throws(() => resolveCanonicalContentMode('UNKNOWN_MODE'), /Unrecognized content production mode/);
  console.log('  -> PASS: Legacy mapping and bidirectional alias resolution verified.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Content Mode Registry Alias Transparency
  // --------------------------------------------------------------------------
  console.log('[Test 3] ContentModeRegistry transparent alias resolution for WORKED_EXAMPLES...');
  assert.strictEqual(contentModeRegistry.hasDefinition('WORKED_EXAMPLES'), true);
  assert.strictEqual(contentModeRegistry.hasDefinition('EXPLAINED_QUESTIONS_VIDEO'), true);
  assert.strictEqual(contentModeRegistry.hasDefinition('TOPIC_INTRODUCTION'), true);
  assert.strictEqual(contentModeRegistry.hasDefinition('QUESTION_CHALLENGE_SHORT'), true);
  assert.strictEqual(contentModeRegistry.hasDefinition('NON_EXISTENT'), false);

  const defByWorked = contentModeRegistry.getDefinition('WORKED_EXAMPLES');
  const defByLegacy = contentModeRegistry.getDefinition('EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(defByWorked.id, defByLegacy.id);
  assert.strictEqual(defByWorked.aspectRatio.defaultValue, '16:9');

  const validConfig = contentModeRegistry.validateConfig('WORKED_EXAMPLES', 10, '16:9');
  assert.strictEqual(validConfig.isValid, true);

  const invalidConfig = contentModeRegistry.validateConfig('WORKED_EXAMPLES', 3, '16:9');
  assert.strictEqual(invalidConfig.isValid, false);

  const stages = contentModeRegistry.getApplicableStages('WORKED_EXAMPLES');
  assert.strictEqual(stages.length, 15);
  console.log('  -> PASS: ContentModeRegistry resolves WORKED_EXAMPLES and legacy alias identically.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Five Presentation Formats (bp_cms_core_requirements1.md Section 3)
  // --------------------------------------------------------------------------
  console.log('[Test 4] Five Presentation Formats and schema validation...');
  assert.strictEqual(PRESENTATION_FORMATS.length, 5);
  assert.deepStrictEqual([...PRESENTATION_FORMATS], ['TEXT', 'VIDEO', 'AUDIO', 'IMAGE', 'ANIMATION']);

  for (const fmt of PRESENTATION_FORMATS) {
    assert.strictEqual(isPresentationFormat(fmt), true);
    assert.strictEqual(PresentationFormatSchema.safeParse(fmt).success, true);
    assert.ok(PRESENTATION_FORMAT_METADATA[fmt].displayName.length > 0);
  }

  assert.strictEqual(isPresentationFormat('PODCAST'), false);
  assert.strictEqual(PresentationFormatSchema.safeParse('RADIO').success, false);
  console.log('  -> PASS: Five presentation formats match Section 3 exactly.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Seven Audience Contexts (bp_cms_core_requirements1.md Section 5)
  // --------------------------------------------------------------------------
  console.log('[Test 5] Seven Audience Contexts and schema validation...');
  assert.strictEqual(AUDIENCE_CONTEXTS.length, 7);
  assert.deepStrictEqual([...AUDIENCE_CONTEXTS], [
    'CHILDREN',
    'STUDENTS',
    'COMPETITIVE_EXAM',
    'WORKING_ADULTS',
    'HOUSEHOLDS',
    'BUSINESS_OPERATORS',
    'OLDER_LEARNERS',
  ]);

  for (const ctx of AUDIENCE_CONTEXTS) {
    assert.strictEqual(isAudienceContext(ctx), true);
    assert.strictEqual(AudienceContextSchema.safeParse(ctx).success, true);
    assert.ok(AUDIENCE_CONTEXT_METADATA[ctx].label.length > 0);
  }

  assert.strictEqual(isAudienceContext('TEENAGERS'), false);
  assert.strictEqual(AudienceContextSchema.safeParse('INVALID_AUDIENCE').success, false);
  console.log('  -> PASS: Seven audience contexts verified with exact requirements semantics.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Four Canonical Skill Levels & Difficulty Mapping (Section 5)
  // --------------------------------------------------------------------------
  console.log('[Test 6] Four Skill Levels and difficulty mapping...');
  assert.strictEqual(SKILL_LEVELS.length, 4);
  assert.deepStrictEqual([...SKILL_LEVELS], ['FOUNDATION', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

  for (const level of SKILL_LEVELS) {
    assert.strictEqual(isSkillLevel(level), true);
    assert.strictEqual(SkillLevelSchema.safeParse(level).success, true);
    assert.ok(SKILL_LEVEL_METADATA[level].rank >= 1 && SKILL_LEVEL_METADATA[level].rank <= 4);
  }

  assert.strictEqual(isSkillLevel('EXPERT'), false);
  assert.strictEqual(SkillLevelSchema.safeParse('MASTER').success, false);

  // Mapping from DifficultyLevel
  assert.strictEqual(mapDifficultyToSkillLevel(DifficultyLevel.EASY), 'BEGINNER');
  assert.strictEqual(mapDifficultyToSkillLevel(DifficultyLevel.MEDIUM), 'INTERMEDIATE');
  assert.strictEqual(mapDifficultyToSkillLevel(DifficultyLevel.HARD), 'ADVANCED');
  assert.strictEqual(mapDifficultyToSkillLevel('FOUNDATION'), 'FOUNDATION');
  assert.strictEqual(mapDifficultyToSkillLevel(undefined), 'BEGINNER');
  console.log('  -> PASS: Four skill levels and difficulty mapping verified.\n');

  // --------------------------------------------------------------------------
  // TEST 7: Initial Editorial Pillars A–F (bp_cms_core_requirements1.md Section 4)
  // --------------------------------------------------------------------------
  console.log('[Test 7] Initial Editorial Pillars A through F...');
  assert.strictEqual(EDITORIAL_PILLARS.length, 6);
  assert.deepStrictEqual([...EDITORIAL_PILLARS], [
    'PILLAR_A',
    'PILLAR_B',
    'PILLAR_C',
    'PILLAR_D',
    'PILLAR_E',
    'PILLAR_F',
  ]);

  for (const pillar of EDITORIAL_PILLARS) {
    assert.strictEqual(isEditorialPillar(pillar), true);
    assert.strictEqual(EditorialPillarSchema.safeParse(pillar).success, true);
    assert.ok(EDITORIAL_PILLAR_METADATA[pillar].title.length > 0);
  }

  assert.strictEqual(isEditorialPillar('PILLAR_G'), false);
  assert.strictEqual(EditorialPillarSchema.safeParse('PILLAR_Z').success, false);
  console.log('  -> PASS: Six editorial pillars verified against Section 4.\n');

  // --------------------------------------------------------------------------
  // TEST 8: LearningUnit Entity & Validation Contracts (Section 6 & 7)
  // --------------------------------------------------------------------------
  console.log('[Test 8] LearningUnit entity and DTO validation contracts...');
  const validCreateInput = {
    topicId: 'top_11111111-1111-4111-8111-111111111111',
    topicName: 'Percentages & Everyday Math',
    subtopicId: 'sub_22222222-2222-4222-8222-222222222222',
    subtopicName: 'Retail Discounts & Price Comparison',
    title: 'Calculate 10% discount and compare final prices',
    learningObjective: 'Viewers will be able to calculate 10% in their head using division by 10 and compare competing store discounts.',
    prerequisiteSkills: ['Basic division by 10', 'Two-digit subtraction'],
    verifiedMethod: 'Step 1: Divide base price by 10 to find 10%. Step 2: Subtract discount from base price.',
    correctCalculations: 'Example: ₹350 base -> 10% = ₹35 -> Final = ₹315. Store B flat ₹30 off gives ₹320. Store A is cheaper.',
    commonMistakes: ['Subtracting the percentage directly from price (e.g. 350 - 10 = 340)', 'Confusing 10% with 10 rupees'],
    realLifeApplications: ['Shopping discounts in retail stores', 'Comparing e-commerce coupon codes'],
    realLifeScenario: 'Buying a ₹350 shirt with a 10% discount tag.',
    skillLevel: 'BEGINNER' as const,
    audienceContext: 'HOUSEHOLDS' as const,
    editorialPillar: 'PILLAR_C' as const,
    suggestedModes: ['TOPIC_INTRODUCTION', 'WORKED_EXAMPLES', 'QUESTION_CHALLENGE_SHORT'] as const,
    primaryFormat: 'VIDEO' as const,
    authorId: 'usr_33333333-3333-4333-8333-333333333333',
  };

  const createValidation = validateCreateLearningUnitInput(validCreateInput);
  assert.strictEqual(createValidation.isValid, true);
  assert.strictEqual(createValidation.data?.title, validCreateInput.title);

  // Full entity validation
  const fullEntity = {
    id: 'lnu_44444444-4444-4444-8444-444444444444',
    ...validCreateInput,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const entityValidation = validateLearningUnit(fullEntity);
  assert.strictEqual(entityValidation.isValid, true);
  assert.strictEqual(entityValidation.data?.id, fullEntity.id);

  // Rejection on invalid payload
  const invalidEntity = {
    id: 'lnu_123',
    topicId: '',
    title: 'AB', // too short
    learningObjective: 'short', // < 10 chars
    verifiedMethod: 'step', // < 10 chars
    skillLevel: 'NOT_A_LEVEL',
    authorId: '',
    version: 0,
    createdAt: '',
    updatedAt: '',
  };

  const failValidation = validateLearningUnit(invalidEntity);
  assert.strictEqual(failValidation.isValid, false);
  assert.ok((failValidation.errors?.length || 0) >= 5);

  // Update DTO validation
  const validUpdate = {
    title: 'Updated Lesson Title for Mental Math',
    expectedVersion: 1,
    skillLevel: 'INTERMEDIATE' as const,
  };
  const updateValidation = validateUpdateLearningUnitInput(validUpdate);
  assert.strictEqual(updateValidation.isValid, true);
  console.log('  -> PASS: LearningUnit creation, entity, and update contracts validated.\n');

  // --------------------------------------------------------------------------
  // TEST 9: Canonical ID Service support for 'lnu_' prefix
  // --------------------------------------------------------------------------
  console.log('[Test 9] CanonicalIdService lnu_ prefix generation and validation...');
  const newLnuId = canonicalIdService.generateLearningUnitId();
  assert.ok(newLnuId.startsWith('lnu_'));
  assert.strictEqual(canonicalIdService.validateCanonicalId(newLnuId, 'lnu_'), true);
  assert.strictEqual(canonicalIdService.isValidCanonicalId(newLnuId), true);

  const parsed = canonicalIdService.parseCanonicalId(newLnuId);
  assert.strictEqual(parsed?.prefix, 'lnu_');
  assert.ok(parsed?.uuid && parsed.uuid.length === 36);
  console.log('  -> PASS: Canonical ID Service produces and validates lnu_ identifiers.\n');

  // --------------------------------------------------------------------------
  // TEST 10: Backward Compatibility with Existing Payloads
  // --------------------------------------------------------------------------
  console.log('[Test 10] Compatibility with existing QuestionDraft, Video, and ProductionContext...');

  // Representative QuestionDraft without learningUnitId (existing brownfield format)
  const legacyDraft: QuestionDraft = {
    id: 'dft_55555555-5555-4555-8555-555555555555',
    topicId: 'top_11111111-1111-4111-8111-111111111111',
    subtopicId: 'sub_22222222-2222-4222-8222-222222222222',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'What is 10% of ₹350?',
    options: { a: '₹30', b: '₹35', c: '₹40', d: '₹45' },
    correctAnswer: 'B',
    explanation: 'Divide by 10 to get ₹35.',
    status: QuestionStatus.DRAFT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.strictEqual(legacyDraft.learningUnitId, undefined);

  // New QuestionDraft linked to learningUnitId
  const modernDraft: QuestionDraft = {
    ...legacyDraft,
    id: 'dft_66666666-6666-4666-8666-666666666666',
    learningUnitId: newLnuId,
  };
  assert.strictEqual(modernDraft.learningUnitId, newLnuId);

  // Representative Video without learningUnitId
  const legacyVideo: Video = {
    id: 'vid_77777777-7777-4777-8777-777777777777',
    questionId: 'qst_88888888-8888-4888-8888-888888888888',
    title: 'Percentages Lesson 1',
    status: VideoProductionStatus.NOT_STARTED,
    priority: PriorityLevel.MEDIUM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.strictEqual(legacyVideo.learningUnitId, undefined);

  // Video linked to learningUnitId
  const modernVideo: Video = {
    ...legacyVideo,
    id: 'vid_99999999-9999-4999-8999-999999999999',
    learningUnitId: newLnuId,
  };
  assert.strictEqual(modernVideo.learningUnitId, newLnuId);

  // ProductionContextEntityIds correlation
  const entityIds: ProductionContextEntityIds = {
    learningUnitId: newLnuId,
    draftId: legacyDraft.id,
    videoId: legacyVideo.id,
  };
  assert.strictEqual(entityIds.learningUnitId, newLnuId);
  console.log('  -> PASS: 100% backward compatibility preserved across drafts, videos, and context.\n');

  console.log('============================================================');
  console.log('ALL S11-T01 CONTRACTS & COMPATIBILITY TESTS PASSED (10/10)');
  console.log('============================================================');
}

runS11T01Tests().catch((err) => {
  console.error('\n[SUITE S11-T01 FAILED]:', err);
  process.exit(1);
});
