/**
 * BURRA PARIKSHA CMS - Thumbnails & Thumbnail Versions Repositories
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Thumbnail, ThumbnailVersion } from '../../types';

export class ThumbnailsRepository extends BaseRepository<Thumbnail> {
  private static instance: ThumbnailsRepository | null = null;

  private constructor() {
    super('thumbnails', 'BP-T-');
  }

  public static getInstance(): ThumbnailsRepository {
    if (!ThumbnailsRepository.instance) {
      ThumbnailsRepository.instance = new ThumbnailsRepository();
    }
    return ThumbnailsRepository.instance;
  }

  public async findByVideoId(videoId: string): Promise<Thumbnail | null> {
    const all = await this.findAll();
    return all.find((t) => t.videoId === videoId) || null;
  }

  public async findByQuestionId(questionId: string): Promise<Thumbnail | null> {
    const all = await this.findAll();
    return all.find((t) => (t as any).questionId === questionId) || null;
  }

  public async findByContentId(contentId: string): Promise<Thumbnail | null> {
    const all = await this.findAll();
    return all.find((t) => (t as any).contentId === contentId) || null;
  }
}

export class ThumbnailVersionsRepository extends BaseRepository<ThumbnailVersion> {
  private static instance: ThumbnailVersionsRepository | null = null;

  private constructor() {
    super('thumbnail_versions');
  }

  public static getInstance(): ThumbnailVersionsRepository {
    if (!ThumbnailVersionsRepository.instance) {
      ThumbnailVersionsRepository.instance = new ThumbnailVersionsRepository();
    }
    return ThumbnailVersionsRepository.instance;
  }

  public async findByThumbnailId(thumbnailId: string): Promise<ThumbnailVersion[]> {
    const all = await this.findAll();
    return all.filter((tv) => tv.thumbnailId === thumbnailId);
  }
}

export const thumbnailsRepository = ThumbnailsRepository.getInstance();
export const thumbnailVersionsRepository = ThumbnailVersionsRepository.getInstance();
