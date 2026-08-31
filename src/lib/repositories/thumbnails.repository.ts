/**
 * BURRA PARIKSHA CMS - Thumbnails & Thumbnail Versions Repositories
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Thumbnail, ThumbnailVersion } from '../../types';

export class ThumbnailsRepository extends BaseRepository<Thumbnail> {
  private static instance: ThumbnailsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.THUMBNAILS]);
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
}

export class ThumbnailVersionsRepository extends BaseRepository<ThumbnailVersion> {
  private static instance: ThumbnailVersionsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.THUMBNAIL_VERSIONS]);
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
