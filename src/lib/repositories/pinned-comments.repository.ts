/**
 * BURRA PARIKSHA CMS - Pinned Comments & Pinned Comment Versions Repositories
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { PinnedComment, PinnedCommentVersion } from '../../types';

export class PinnedCommentsRepository extends BaseRepository<PinnedComment> {
  private static instance: PinnedCommentsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.PINNED_COMMENTS]);
  }

  public static getInstance(): PinnedCommentsRepository {
    if (!PinnedCommentsRepository.instance) {
      PinnedCommentsRepository.instance = new PinnedCommentsRepository();
    }
    return PinnedCommentsRepository.instance;
  }

  public async findByVideoId(videoId: string): Promise<PinnedComment | null> {
    const all = await this.findAll();
    return all.find((p) => p.videoId === videoId) || null;
  }
}

export class PinnedCommentVersionsRepository extends BaseRepository<PinnedCommentVersion> {
  private static instance: PinnedCommentVersionsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.PINNED_COMMENT_VERSIONS]);
  }

  public static getInstance(): PinnedCommentVersionsRepository {
    if (!PinnedCommentVersionsRepository.instance) {
      PinnedCommentVersionsRepository.instance = new PinnedCommentVersionsRepository();
    }
    return PinnedCommentVersionsRepository.instance;
  }

  public async findByPinnedCommentId(pinnedCommentId: string): Promise<PinnedCommentVersion[]> {
    const all = await this.findAll();
    return all.filter((pv) => pv.pinnedCommentId === pinnedCommentId);
  }
}

export const pinnedCommentsRepository = PinnedCommentsRepository.getInstance();
export const pinnedCommentVersionsRepository = PinnedCommentVersionsRepository.getInstance();
