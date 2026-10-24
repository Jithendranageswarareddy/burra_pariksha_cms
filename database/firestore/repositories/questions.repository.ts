/**
 * BURRA PARIKSHA CMS - Questions Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Question, QuestionDifficulty, QuestionStatus, VideoProductionStatus } from '../../../shared';
import { ValidationError } from '../../../src/lib/errors';

export interface QuestionFilterInput {
  search?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  videoStatus?: VideoProductionStatus;
}

export class QuestionsRepository extends BaseRepository<Question> {
  private static instance: QuestionsRepository | null = null;

  private constructor() {
    super('questions', 'BP-Q-');
  }

  public static getInstance(): QuestionsRepository {
    if (!QuestionsRepository.instance) {
      QuestionsRepository.instance = new QuestionsRepository();
    }
    return QuestionsRepository.instance;
  }

  /**
   * Primary key uniqueness guard before appending a new question.
   */
  public override async appendRecord(record: Question): Promise<Question> {
    if (record.id) {
      const existing = await this.findById(record.id);
      if (existing) {
        throw new ValidationError(
          `Primary Key Uniqueness Guard Rejected Append: Question with ID "${record.id}" already exists.`
        );
      }
    }
    return super.appendRecord(record);
  }

  /**
   * Queries questions applying multi-parameter filters.
   */
  public async query(filter?: QuestionFilterInput): Promise<Question[]> {
    const all = await this.findAll();
    if (!filter) return all;

    return all.filter((q) => {
      // Search text filter (Case-insensitive multi-field search)
      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matchesText = q.questionText?.toLowerCase().includes(query);
        const matchesId = q.id?.toLowerCase().includes(query);
        const matchesTopic = q.topicName?.toLowerCase().includes(query);
        const matchesSubtopic = q.subtopicName?.toLowerCase().includes(query);
        const matchesTag = q.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesRealWorldContext = q.realWorldContext?.toLowerCase().includes(query);
        const matchesExplanation = q.explanation?.toLowerCase().includes(query);
        const matchesOptions = q.options && (
          q.options.a?.toLowerCase().includes(query) ||
          q.options.b?.toLowerCase().includes(query) ||
          q.options.c?.toLowerCase().includes(query) ||
          q.options.d?.toLowerCase().includes(query)
        );

        if (!matchesText && !matchesId && !matchesTopic && !matchesSubtopic && !matchesTag && !matchesOptions && !matchesRealWorldContext && !matchesExplanation) {
          return false;
        }
      }

      // Exact topic
      if (filter.topicId && q.topicId !== filter.topicId) {
        return false;
      }

      // Exact subtopic
      if (filter.subtopicId && q.subtopicId !== filter.subtopicId) {
        return false;
      }

      // Difficulty level
      if (filter.difficulty && q.difficulty !== filter.difficulty) {
        return false;
      }

      // Status
      if (filter.status && q.status !== filter.status) {
        return false;
      }

      // Video Status
      if (filter.videoStatus && q.videoStatus !== filter.videoStatus) {
        return false;
      }

      return true;
    });
  }

  public async findByContentMasterId(contentMasterId: string): Promise<Question[]> {
    const all = await this.findAll();
    return all.filter((q) => q.contentMasterId === contentMasterId);
  }

  /**
   * Restricts reverse-link reads to the canonical relationship field and a
   * bounded result set; legacy questions without the field are excluded.
   */
  public async findByLearningUnitId(learningUnitId: string, limit = 100): Promise<Question[]> {
    const repository = await this.getFirestoreRepository();
    return repository.findMany({ where: { learningUnitId }, limit });
  }

  public async delete(id: string, options?: { actor?: { id: string; name: string }; reason?: string }): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const questionsRepository = QuestionsRepository.getInstance();
