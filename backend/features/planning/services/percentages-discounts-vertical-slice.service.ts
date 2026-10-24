import { Question, LearningUnit, PresentationFormat, QuestionStatus, VideoProductionStatus } from '../../../../shared';
import {
  AnimationBriefSchema,
  AudioNarrationSchema,
  ImageArtifactMetadataSchema,
  TextArtifactSchema,
} from '../../../../shared/contracts/content-artifacts.contract';
import { validateLearningUnitLink, LearningUnitLinkActor } from './learning-unit-link.service';
import { ContentArtifactService } from './content-artifact.service';
import {
  verifyDeterministicCalculation,
  DeterministicCalculationResult,
} from '../../../ai/validators/deterministic-calculation-verifier';
import { validateStage02Quality, Stage02QualityResult } from '../../../ai/validators/stage02-quality.validator';
import { ValidationError } from '../../../../src/lib/errors';

export interface PercentagesDiscountsSliceDependencies {
  validateLink?: typeof validateLearningUnitLink;
  artifactService?: ContentArtifactService;
}

export interface PercentagesDiscountsVerticalSlice {
  learningUnitId: string;
  contentId: string;
  modes: Array<{
    mode: 'TOPIC_INTRODUCTION' | 'WORKED_EXAMPLES' | 'QUESTION_CHALLENGE_SHORT';
    formats: PresentationFormat[];
  }>;
  question: Question;
  calculationChecks: DeterministicCalculationResult[];
  qualityChecks: Stage02QualityResult;
  artifacts: {
    text: ReturnType<typeof TextArtifactSchema.parse>;
    image: ReturnType<typeof ImageArtifactMetadataSchema.parse>;
    audio: ReturnType<typeof AudioNarrationSchema.parse>;
    animation: ReturnType<typeof AnimationBriefSchema.parse>;
    audioMedia: Awaited<ReturnType<ContentArtifactService['uploadAudioArtifact']>>;
    animationMedia: Awaited<ReturnType<ContentArtifactService['uploadAnimationArtifact']>>;
    video: {
      id: string;
      learningUnitId: string;
      contentId: string;
      questionId: string;
      format: 'VIDEO';
    };
  };
}

/**
 * Builds one synthetic lesson without persisting it. The service is an
 * integration seam: domain validation runs normally, while binary storage is
 * supplied by the test's mocked Drive adapter.
 */
export class PercentagesDiscountsVerticalSliceService {
  private readonly validateLink: typeof validateLearningUnitLink;
  private readonly artifactService: ContentArtifactService;

  constructor(dependencies: PercentagesDiscountsSliceDependencies = {}) {
    this.validateLink = dependencies.validateLink || validateLearningUnitLink;
    this.artifactService = dependencies.artifactService || new ContentArtifactService({
      validateLink: this.validateLink,
    });
  }

  public async build(
    learningUnit: LearningUnit,
    actor: LearningUnitLinkActor,
    contentId: string,
    questionId: string
  ): Promise<PercentagesDiscountsVerticalSlice> {
    await this.validateLink(learningUnit.id, actor);
    if (!contentId || !questionId) {
      throw new ValidationError('Synthetic vertical slice requires content and question identifiers.');
    }

    const question: Question = {
      id: questionId,
      learningUnitId: learningUnit.id,
      contentId,
      topicId: learningUnit.topicId,
      topicName: learningUnit.topicName || 'Percentages',
      subtopicId: learningUnit.subtopicId,
      subtopicName: learningUnit.subtopicName || 'Discounts',
      difficulty: 'BEGINNER',
      language: 'ENGLISH',
      questionText: 'A marked price of ₹1000 has a 20% discount. What is the selling price?',
      options: { a: '₹800', b: '₹820', c: '₹1200', d: '₹200' },
      correctAnswer: 'A',
      explanation: 'The discount is ₹200, so the selling price is ₹800.',
      realLifeContext: 'This helps compare prices during everyday shopping.',
      status: QuestionStatus.DRAFT,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };

    const percentage = verifyDeterministicCalculation({
      operation: 'PERCENT_OF',
      operands: [1000, 20],
      claimedResult: 200,
      steps: ['1000 × 20 ÷ 100 = 200'],
      requiredStepCount: 1,
      contentMode: 'WORKED_EXAMPLES',
    });
    const discountedPrice = verifyDeterministicCalculation({
      operation: 'SUBTRACT',
      operands: [1000, 200],
      claimedResult: 800,
      options: [800, 820, 1200, 200],
      declaredOptionIndex: 0,
      steps: ['1000 − 200 = 800'],
      requiredStepCount: 1,
      contentMode: 'QUESTION_CHALLENGE_SHORT',
    });
    if (percentage.status !== 'VERIFIED' || discountedPrice.status !== 'VERIFIED') {
      throw new ValidationError('Synthetic percentage and discount calculations did not verify deterministically.');
    }

    const qualityChecks = validateStage02Quality(question);
    if (qualityChecks.errors.length > 0) {
      throw new ValidationError(`Synthetic question failed Stage 02 validation: ${qualityChecks.errors.join(' ')}`);
    }

    const timestamp = new Date(0).toISOString();
    for (const mode of ['TOPIC_INTRODUCTION', 'WORKED_EXAMPLES', 'QUESTION_CHALLENGE_SHORT'] as const) {
      for (const format of ['TEXT', 'VIDEO', 'AUDIO', 'IMAGE', 'ANIMATION'] as const) {
        this.artifactService.validateModeFormat(mode, format);
      }
    }
    const text = this.artifactService.validateTextArtifact({
      id: `${contentId}-text`,
      learningUnitId: learningUnit.id,
      title: 'Discount calculation',
      body: '20% of ₹1000 is ₹200; ₹1000 minus ₹200 equals ₹800.',
      language: 'ENGLISH',
      format: 'PLAIN_TEXT',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const image = await this.artifactService.uploadImageArtifact({
      id: `${contentId}-image`,
      learningUnitId: learningUnit.id,
      contentId,
      fileName: 'discount.png',
      mimeType: 'image/png',
      fileSize: 4,
      altText: 'A discount calculation showing ₹1000, 20%, and ₹800.',
      createdAt: timestamp,
    }, Buffer.from('test'), actor);
    const audio = this.artifactService.validateAudioNarration({
      id: `${contentId}-audio`,
      learningUnitId: learningUnit.id,
      title: 'Discount narration',
      narration: 'A thousand rupees with a twenty percent discount costs eight hundred rupees.',
      language: 'ENGLISH',
      timing: { estimatedDurationSeconds: 8 },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const animation = this.artifactService.validateAnimationBrief({
      id: `${contentId}-animation`,
      learningUnitId: learningUnit.id,
      title: 'Discount animation',
      scenes: [{
        sceneNumber: 1,
        description: 'Show the marked price, discount, and final price.',
        timing: { estimatedDurationSeconds: 4 },
      }],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const audioMedia = await this.artifactService.uploadAudioArtifact({
      id: `${contentId}-audio-media`,
      learningUnitId: learningUnit.id,
      contentId,
      fileName: 'discount-narration.wav',
      mimeType: 'audio/wav',
      fileSize: 4,
      createdAt: timestamp,
    }, Buffer.from('test'), actor);
    const animationMedia = await this.artifactService.uploadAnimationArtifact({
      id: `${contentId}-animation-media`,
      learningUnitId: learningUnit.id,
      contentId,
      fileName: 'discount-animation.mp4',
      mimeType: 'video/mp4',
      fileSize: 4,
      createdAt: timestamp,
    }, Buffer.from('test'), actor);

    return {
      learningUnitId: learningUnit.id,
      contentId,
      modes: [
        { mode: 'TOPIC_INTRODUCTION', formats: ['TEXT', 'IMAGE'] },
        { mode: 'WORKED_EXAMPLES', formats: ['TEXT', 'AUDIO', 'ANIMATION'] },
        { mode: 'QUESTION_CHALLENGE_SHORT', formats: ['VIDEO', 'AUDIO'] },
      ],
      question,
      calculationChecks: [percentage, discountedPrice],
      qualityChecks,
      artifacts: {
        text,
        image,
        audio,
        animation,
        audioMedia,
        animationMedia,
        video: { id: `${contentId}-video`, learningUnitId: learningUnit.id, contentId, questionId, format: 'VIDEO' },
      },
    };
  }
}
