/**
 * BURRA PARIKSHA CMS - QuestionVideos & Videos Repositories
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { QuestionVideo, Video } from '../../types';
import { MOCK_QUEUE } from '../mock-data/queue';

export class QuestionVideosRepository extends BaseRepository<QuestionVideo> {
  private static instance: QuestionVideosRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.QUESTION_VIDEOS]);
  }

  public static getInstance(): QuestionVideosRepository {
    if (!QuestionVideosRepository.instance) {
      QuestionVideosRepository.instance = new QuestionVideosRepository();
    }
    return QuestionVideosRepository.instance;
  }

  public async findByQuestionId(questionId: string): Promise<QuestionVideo[]> {
    const all = await this.findAll();
    return all.filter((qv) => qv.questionId === questionId);
  }

  public async findByVideoId(videoId: string): Promise<QuestionVideo[]> {
    const all = await this.findAll();
    return all.filter((qv) => qv.videoId === videoId);
  }
}

export class VideosRepository extends BaseRepository<Video> {
  private static instance: VideosRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.VIDEOS]);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      // Seed initial mock queue items with canonical BP-V-00000X format
      const videos: Video[] = MOCK_QUEUE.map((item, idx) => ({
        id: `BP-V-${String(idx + 1).padStart(6, '0')}`,
        questionId: item.questionId,
        title: item.title,
        status: item.productionStatus,
        priority: item.priority,
        queuePosition: item.queuePosition,
        targetDurationSeconds: 45,
        actualDurationSeconds: item.productionStatus === 'UPLOADED' ? 42 : undefined,
        notes: item.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      this.seedFallbackData(videos);
    }
  }

  public static getInstance(): VideosRepository {
    if (!VideosRepository.instance) {
      VideosRepository.instance = new VideosRepository();
    }
    return VideosRepository.instance;
  }

  public async findByQuestionId(questionId: string): Promise<Video[]> {
    const all = await this.findAll();
    return all.filter((v) => v.questionId === questionId);
  }

  public async findByStatus(status: string): Promise<Video[]> {
    const all = await this.findAll();
    return all.filter((v) => v.status === status);
  }
}

export const questionVideosRepository = QuestionVideosRepository.getInstance();
export const videosRepository = VideosRepository.getInstance();
