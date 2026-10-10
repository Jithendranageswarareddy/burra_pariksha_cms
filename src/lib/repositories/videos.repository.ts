/**
 * BURRA PARIKSHA CMS - QuestionVideos & Videos Repositories
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { QuestionVideo, Video } from '../../types';

export class QuestionVideosRepository extends BaseRepository<QuestionVideo> {
  private static instance: QuestionVideosRepository | null = null;

  private constructor() {
    super('question_videos');
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
    super('videos', 'BP-V-');
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

  public async findByContentId(contentId: string): Promise<Video | null> {
    const all = await this.findAll();
    return all.find((v) => (v as any).contentId === contentId) || null;
  }

  public async findByStatus(status: string): Promise<Video[]> {
    const all = await this.findAll();
    return all.filter((v) => v.status === status);
  }
}

export const questionVideosRepository = QuestionVideosRepository.getInstance();
export const videosRepository = VideosRepository.getInstance();
