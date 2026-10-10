/**
 * BURRA PARIKSHA CMS - Pinned Comments & Pinned Comment Versions Repositories
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { PinnedComment, PinnedCommentVersion } from '../../types';

export class PinnedCommentsRepository extends BaseRepository<PinnedComment> {
  private static instance: PinnedCommentsRepository | null = null;

  private constructor() {
    super('pinned_comments', 'BP-PIN-');
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
    super('pinned_comment_versions');
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
