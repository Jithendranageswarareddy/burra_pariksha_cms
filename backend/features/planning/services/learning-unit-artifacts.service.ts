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
