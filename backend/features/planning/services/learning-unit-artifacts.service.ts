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
  drafts: QuestionDraft[];
  questions: Question[];
  videos: Video[];
  correctionReview: {
    supported: false;
    reason: string;
  };
}

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
      drafts,
      questions,
      videos,
      correctionReview: {
        supported: false,
        reason: 'Correction-review flags require an approved correction version, persistence field, and transition policy.',
      },
    };
  }
}

export const learningUnitArtifactsService = new LearningUnitArtifactsService();
