/**
 * BURRA PARIKSHA CMS - Media Assets Repository
 * Phase 14: Google Drive Production Infrastructure
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { MediaAsset, MediaStage } from '../../types';

export class MediaAssetsRepository extends BaseRepository<MediaAsset> {
  private static instance: MediaAssetsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.MEDIA_ASSETS]);
  }

  public static getInstance(): MediaAssetsRepository {
    if (!MediaAssetsRepository.instance) {
      MediaAssetsRepository.instance = new MediaAssetsRepository();
    }
    return MediaAssetsRepository.instance;
  }

  /**
   * Finds all media assets associated with a specific Content ID.
   */
  public async findByContentId(contentId: string): Promise<MediaAsset[]> {
    if (!contentId) return [];
    const all = await this.findAll();
    const targetNorm = contentId.trim();
    const targetClean = targetNorm.replace(/^BP-CNT-0*/, '');
    return all.filter((item) => {
      const itemNorm = (item.contentId || '').trim();
      return (
        itemNorm === targetNorm ||
        (targetClean.length > 0 && itemNorm.replace(/^BP-CNT-0*/, '') === targetClean)
      );
    });
  }

  /**
   * Finds all media assets associated with a specific Content ID and Media Stage.
   */
  public async findByContentIdAndStage(contentId: string, mediaStage: MediaStage): Promise<MediaAsset[]> {
    if (!contentId) return [];
    const all = await this.findAll();
    const targetNorm = contentId.trim();
    const targetClean = targetNorm.replace(/^BP-CNT-0*/, '');
    return all.filter((item) => {
      if (item.mediaStage !== mediaStage) return false;
      const itemNorm = (item.contentId || '').trim();
      return (
        itemNorm === targetNorm ||
        (targetClean.length > 0 && itemNorm.replace(/^BP-CNT-0*/, '') === targetClean)
      );
    });
  }

  /**
   * Gets the latest version of a media asset for a Content ID and Media Stage.
   */
  public async getLatestVersion(contentId: string, mediaStage: MediaStage): Promise<MediaAsset | null> {
    const stageAssets = await this.findByContentIdAndStage(contentId, mediaStage);
    if (stageAssets.length === 0) {
      return null;
    }
    // Sort descending by version number
    stageAssets.sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
    return stageAssets[0];
  }

  /**
   * Resolves the next version number for an upload.
   */
  public async getNextVersionNumber(contentId: string, mediaStage: MediaStage): Promise<number> {
    const stageAssets = await this.findByContentIdAndStage(contentId, mediaStage);
    const maxVersion = stageAssets.reduce((max, a) => Math.max(max, Number(a.version) || 0), 0);
    return maxVersion + 1;
  }
}

export const mediaAssetsRepository = MediaAssetsRepository.getInstance();
