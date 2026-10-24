import { Question, QuestionDraft, Video } from '../../../../shared';
import { questionDraftsRepository } from '../../../../database/firestore/repositories/question-drafts.repository';
import { questionsRepository } from '../../../../database/firestore/repositories/questions.repository';
import { videosRepository } from '../../../../database/firestore/repositories/videos.repository';
import { learningUnitsRepository } from '../../../../database/firestore/repositories/learning-units.repository';
import { validateLearningUnitLink, LearningUnitLinkActor } from './learning-unit-link.service';

export interface LearningUnitArtifactRepositories {
  learningUnits: Pick<typeof learningUnitsRepository, 'findById'>;
  drafts: Pick<typeof questionDraftsRepository, 'findByLearningUnitId'>;
  questions: Pick<typeof questionsRepository, 'findByLearningUnitId'>;
  videos: Pick<typeof videosRepository, 'findByLearningUnitId'>;
}

export interface LinkedLearningUnitArtifacts {
  learningUnitId: string;
  drafts: LearningUnitDraftArtifact[];
  questions: LearningUnitQuestionArtifact[];
  videos: LearningUnitVideoArtifact[];
  correctionReview: {
    supported: false;
    reason: string;
  };
}

export interface LearningSequenceFilters {
  mode?: string;
  format?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface LearningSequenceArtifact {
  id: string;
  kind: 'DRAFT' | 'QUESTION' | 'VIDEO';
  mode?: string;
  format?: string;
  status?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  source: LearningUnitDraftArtifact | LearningUnitQuestionArtifact | LearningUnitVideoArtifact;
}

export interface LearningSequencePage {
  learningUnitId: string;
  artifacts: LearningSequenceArtifact[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const normalizeContentMode = (mode: string | undefined): string | undefined => {
  const normalized = mode?.trim().toUpperCase();
  return normalized === 'EXPLAINED_QUESTIONS_VIDEO' ? 'WORKED_EXAMPLES' : normalized;
};

export type LearningUnitDraftArtifact = Pick<
  QuestionDraft,
  | 'id'
  | 'learningUnitId'
  | 'topicId'
  | 'topicName'
  | 'subtopicId'
  | 'subtopicName'
  | 'difficulty'
  | 'language'
  | 'questionText'
  | 'options'
  | 'correctAnswer'
  | 'explanation'
  | 'realWorldContext'
  | 'realLifeContext'
  | 'challengeType'
  | 'presentationType'
  | 'productionMode'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'version'
>;

export type LearningUnitQuestionArtifact = Pick<
  Question,
  | 'id'
  | 'learningUnitId'
  | 'contentId'
  | 'contentMasterId'
  | 'topicId'
  | 'topicName'
  | 'subtopicId'
  | 'subtopicName'
  | 'difficulty'
  | 'language'
  | 'questionText'
  | 'options'
  | 'correctAnswer'
  | 'explanation'
  | 'realWorldContext'
  | 'realLifeContext'
  | 'challengeType'
  | 'presentationType'
  | 'status'
  | 'videoStatus'
  | 'createdAt'
  | 'updatedAt'
>;

export type LearningUnitVideoArtifact = Pick<
  Video,
  | 'id'
  | 'learningUnitId'
  | 'contentId'
  | 'contentMasterId'
  | 'questionId'
  | 'title'
  | 'targetDurationSeconds'
  | 'status'
  | 'priority'
  | 'createdAt'
  | 'updatedAt'
>;

const DEFAULT_QUERY_LIMIT = 100;

/**
 * Returns artifacts for one authorized LearningUnit. Correction propagation is
 * intentionally not synthesized here: the approved model has no persisted
 * correction version, review-flag state, or authorized transition contract.
 */
export class LearningUnitArtifactsService {
  public constructor(
    private readonly repositories: LearningUnitArtifactRepositories = {
      learningUnits: learningUnitsRepository,
      drafts: questionDraftsRepository,
      questions: questionsRepository,
      videos: videosRepository,
    }
  ) {}

  public async findLinkedArtifacts(
    learningUnitId: string,
    actor: LearningUnitLinkActor,
    limit = DEFAULT_QUERY_LIMIT
  ): Promise<LinkedLearningUnitArtifacts> {
    const learningUnit = await validateLearningUnitLink(
      learningUnitId,
      actor,
      this.repositories.learningUnits
    );
    const boundedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : DEFAULT_QUERY_LIMIT;
    const normalizedId = learningUnit!.id;
    const [drafts, questions, videos] = await Promise.all([
      this.repositories.drafts.findByLearningUnitId(normalizedId, boundedLimit),
      this.repositories.questions.findByLearningUnitId(normalizedId, boundedLimit),
      this.repositories.videos.findByLearningUnitId(normalizedId, boundedLimit),
    ]);

    return {
      learningUnitId: normalizedId,
      drafts: drafts.map((draft) => this.toDraftArtifact(draft)),
      questions: questions.map((question) => this.toQuestionArtifact(question)),
      videos: videos.map((video) => this.toVideoArtifact(video)),
      correctionReview: {
        supported: false,
        reason: 'Correction-review flags require an approved correction version, persistence field, and transition policy.',
      },
    };
  }

  /**
   * Builds an operational read model from existing linked artifacts. The
   * preferred Intro -> Worked Examples -> Challenge order is editorial
   * guidance only; absent modes remain valid and do not block the sequence.
   */
  public async getLearningSequence(
    learningUnitId: string,
    actor: LearningUnitLinkActor,
    filters: LearningSequenceFilters = {}
  ): Promise<LearningSequencePage> {
    const linked = await this.findLinkedArtifacts(learningUnitId, actor, 500);
    const modeOrder = new Map([
      ['TOPIC_INTRODUCTION', 0],
      ['WORKED_EXAMPLES', 1],
      ['QUESTION_CHALLENGE_SHORT', 2],
    ]);
    const normalizedMode = normalizeContentMode(filters.mode);
    const normalizedFormat = filters.format?.trim().toUpperCase();
    const normalizedStatus = filters.status?.trim().toUpperCase();
    const artifacts: LearningSequenceArtifact[] = [
      ...linked.drafts.map((source) => ({
        id: source.id,
        kind: 'DRAFT' as const,
        mode: source.productionMode,
        format: source.presentationType,
        status: source.status,
        title: source.questionText,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        source,
      })),
      ...linked.questions.map((source) => ({
        id: source.id,
        kind: 'QUESTION' as const,
        mode: source.productionMode,
        format: source.presentationType,
        status: source.status,
        title: source.questionText,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        source,
      })),
      ...linked.videos.map((source) => ({
        id: source.id,
        kind: 'VIDEO' as const,
        mode: undefined,
        format: 'VIDEO',
        status: source.status,
        title: source.title,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        source,
      })),
    ]
      .filter((artifact) => !normalizedMode || normalizeContentMode(artifact.mode) === normalizedMode)
      .filter((artifact) => !normalizedFormat || artifact.format?.toUpperCase() === normalizedFormat)
      .filter((artifact) => !normalizedStatus || artifact.status?.toUpperCase() === normalizedStatus)
      .sort((left, right) =>
        (modeOrder.get(normalizeContentMode(left.mode) || '') ?? 99) -
          (modeOrder.get(normalizeContentMode(right.mode) || '') ?? 99) ||
        (left.createdAt || '').localeCompare(right.createdAt || '') ||
        left.id.localeCompare(right.id)
      );

    const limit = Number.isInteger(filters.limit) && filters.limit! > 0
      ? Math.min(filters.limit!, 100)
      : 25;
    const page = Number.isInteger(filters.page) && filters.page! > 0 ? filters.page! : 1;
    const start = (page - 1) * limit;
    return {
      learningUnitId: linked.learningUnitId,
      artifacts: artifacts.slice(start, start + limit),
      page,
      limit,
      total: artifacts.length,
      totalPages: Math.ceil(artifacts.length / limit) || 1,
    };
  }

  private toDraftArtifact(draft: QuestionDraft): LearningUnitDraftArtifact {
    const {
      id,
      learningUnitId,
      topicId,
      topicName,
      subtopicId,
      subtopicName,
      difficulty,
      language,
      questionText,
      options,
      correctAnswer,
      explanation,
      realWorldContext,
      realLifeContext,
      challengeType,
      presentationType,
      productionMode,
      status,
      createdAt,
      updatedAt,
      version,
    } = draft;
    return {
      id,
      learningUnitId,
      topicId,
      topicName,
      subtopicId,
      subtopicName,
      difficulty,
      language,
      questionText,
      options,
      correctAnswer,
      explanation,
      realWorldContext,
      realLifeContext,
      challengeType,
      presentationType,
      productionMode,
      status,
      createdAt,
      updatedAt,
      version,
    };
  }

  private toQuestionArtifact(question: Question): LearningUnitQuestionArtifact {
    const {
      id,
      learningUnitId,
      contentId,
      contentMasterId,
      topicId,
      topicName,
      subtopicId,
      subtopicName,
      difficulty,
      language,
      questionText,
      options,
      correctAnswer,
      explanation,
      realWorldContext,
      realLifeContext,
      challengeType,
      presentationType,
      productionMode,
      status,
      videoStatus,
      createdAt,
      updatedAt,
    } = question;
    return {
      id,
      learningUnitId,
      contentId,
      contentMasterId,
      topicId,
      topicName,
      subtopicId,
      subtopicName,
      difficulty,
      language,
      questionText,
      options,
      correctAnswer,
      explanation,
      realWorldContext,
      realLifeContext,
      challengeType,
      presentationType,
      productionMode,
      status,
      videoStatus,
      createdAt,
      updatedAt,
    };
  }

  private toVideoArtifact(video: Video): LearningUnitVideoArtifact {
    const {
      id,
      learningUnitId,
      contentId,
      contentMasterId,
      questionId,
      title,
      targetDurationSeconds,
      status,
      priority,
      createdAt,
      updatedAt,
    } = video;
    return {
      id,
      learningUnitId,
      contentId,
      contentMasterId,
      questionId,
      title,
      targetDurationSeconds,
      status,
      priority,
      createdAt,
      updatedAt,
    };
  }
}

export const learningUnitArtifactsService = new LearningUnitArtifactsService();
