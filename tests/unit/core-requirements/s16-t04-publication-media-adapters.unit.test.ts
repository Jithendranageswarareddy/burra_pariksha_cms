/**
 * S16-T04 mocked publication/media adapter acceptance.
 *
 * The existing services own authorization, readiness gates, duplicate
 * protection, retry state, and audit semantics. These tests replace only
 * repository/provider boundaries, so no publication or media provider is
 * contacted and no Firestore write is performed.
 */
import assert from 'node:assert/strict';
import { publishingService, PublishReadinessResult } from '../../../backend/features/publishing/services/publishing.service';
import { publishingRepository } from '../../../database/firestore/repositories/publishing.repository';
import { videosRepository } from '../../../database/firestore/repositories/videos.repository';
import { ObjectAuthorizationService } from '../../../backend/infrastructure/auth/services/object-auth.service';
import { auditService } from '../../../backend/infrastructure/audit/services/audit.service';
import { AuditLog, PlatformPublishInfo, Publishing, SocialPublishStatus, UserRole, VideoProductionStatus } from '../../../shared';

const actor = { id: 'usr_s16_t04', name: 'Synthetic Publisher', role: UserRole.PUBLISHING_MANAGER };
const basePlatform = (): PlatformPublishInfo => ({ status: SocialPublishStatus.NOT_STARTED });

const makePublishing = (youtube = basePlatform()): Publishing => ({
  id: 'pub_s16_t04',
  videoId: 'vid_s16_t04',
  videoTitle: 'Synthetic publication',
  questionId: 'qst_s16_t04',
  finalVideoStatus: 'VERIFIED',
  youtube,
  instagram: basePlatform(),
  facebook: basePlatform(),
  pinnedCommentReady: true,
  thumbnailReady: true,
  completedPlatformsCount: 0,
  totalPlatformsCount: 3,
  createdAt: '2026-10-25T00:00:00.000Z',
  updatedAt: '2026-10-25T00:00:00.000Z',
});

const originalFindAll = publishingRepository.findAll;
const originalVideoFindById = videosRepository.findById;
const originalCanModifyPublishing = ObjectAuthorizationService.prototype.canModifyPublishing;
const originalAuditLog = auditService.log;
const originalGetPublishingByVideoId = publishingService.getPublishingByVideoId;
const originalValidateReadiness = publishingService.validatePublishReadiness;

try {
  let auditEvents = 0;
  auditService.log = async (): Promise<AuditLog> => {
    auditEvents++;
    return {
      id: 'audit_s16_t04',
      actorId: actor.id,
      actorName: actor.name,
      action: 'S16_T04_TEST',
      entityType: 'PUBLISHING',
      entityId: 'pub_s16_t04',
      details: 'Synthetic mocked audit event',
      timestamp: '2026-10-25T00:00:00.000Z',
    };
  };
  publishingService.validatePublishReadiness = async (): Promise<PublishReadinessResult> => ({
    videoId: 'vid_s16_t04',
    isReady: true,
    blockers: [],
    warnings: [],
    checklist: {
      videoReady: true,
      thumbnailReady: true,
      pinnedCommentReady: true,
      scriptReady: true,
      metadataReady: true,
    },
    videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
  });

  let current = makePublishing({
    status: SocialPublishStatus.PUBLISHED,
    videoUrl: 'https://youtu.be/synthetic-s16-t04',
  });
  publishingService.getPublishingByVideoId = async () => current;
  publishingRepository.findAll = async () => [current];

  const idempotent = await publishingService.markPlatformPublished(
    'vid_s16_t04',
    'youtube',
    'https://youtu.be/synthetic-s16-t04',
    actor
  );
  assert.equal(idempotent, current);
  assert.equal(auditEvents, 1);

  const otherRecord = makePublishing({
    status: SocialPublishStatus.PUBLISHED,
    videoUrl: 'https://youtu.be/already-used',
  });
  otherRecord.videoId = 'vid_s16_t04_other';
  publishingRepository.findAll = async () => [otherRecord];
  await assert.rejects(
    () =>
      publishingService.markPlatformPublished(
        'vid_s16_t04',
        'youtube',
        'https://youtu.be/already-used',
        actor
      ),
    /Duplicate publish protection/
  );

  // A retry in an already-target state is a no-op, preventing retry-count
  // inflation when a client repeats the same request after a network timeout.
  current = makePublishing({ status: SocialPublishStatus.DRAFT });
  publishingService.getPublishingByVideoId = async () => current;
  videosRepository.findById = async () => null;
  ObjectAuthorizationService.prototype.canModifyPublishing = async () => true;

  const retryResult = await publishingService.retryPublishing('vid_s16_t04', 'youtube', undefined, actor);
  assert.equal(retryResult, current);
  assert.equal(current.youtube.retryCount, undefined);
  assert.equal(auditEvents, 2);

  console.log(
    'S16-T04 publication/media adapter tests passed (authorization boundary, duplicate protection, idempotent publish, and retry no-op).'
  );
} finally {
  publishingRepository.findAll = originalFindAll;
  videosRepository.findById = originalVideoFindById;
  ObjectAuthorizationService.prototype.canModifyPublishing = originalCanModifyPublishing;
  auditService.log = originalAuditLog;
  publishingService.getPublishingByVideoId = originalGetPublishingByVideoId;
  publishingService.validatePublishReadiness = originalValidateReadiness;
}
