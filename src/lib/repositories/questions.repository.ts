/**
 * BURRA PARIKSHA CMS - Questions Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { QuestionFilterInput, SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Question } from '../../types';
import { MOCK_QUESTIONS } from '../mock-data/questions';
import { ValidationError } from '../google-sheets/errors';

export class QuestionsRepository extends BaseRepository<Question> {
  private static instance: QuestionsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.QUESTIONS]);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      this.seedFallbackData(MOCK_QUESTIONS);
    }
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
        const matchesCategory = q.categoryName?.toLowerCase().includes(query);
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

        if (!matchesText && !matchesId && !matchesCategory && !matchesTopic && !matchesSubtopic && !matchesTag && !matchesOptions && !matchesRealWorldContext && !matchesExplanation) {
          return false;
        }
      }

      // Exact category
      if (filter.categoryId && q.categoryId !== filter.categoryId) {
        return false;
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

  public async delete(id: string, options?: { actor?: { id: string; name: string }; reason?: string }): Promise<boolean> {
    return this.deleteRecord(id, options);
  }
}

export const questionsRepository = QuestionsRepository.getInstance();
