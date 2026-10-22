/**
 * BURRA PARIKSHA CMS — Firestore-Native Architecture, ID Integrity, and Persistence Unit Tests
 *
 * Deterministically tests:
 * 1. Canonical ID Service: Cryptographically secure UUIDv4 generation without Math.random fallback
 * 2. Publishing Repository: Canonical pub_<uuid> ID generation and elimination of idCounter & in-memory Map
 * 3. Repository Remediation: Elimination of rogue in-memory stores across platform adaptations, social reviews,
 *    pinned comments, thumbnail candidates, and refinement candidates.
 * 4. Domain Ownership & Validation: Acceptance of canonical UUID IDs in schema validators
 */

import assert from 'node:assert';
import { canonicalIdService, CANONICAL_PREFIXES, UUID_V4_PATTERN } from '../../shared/lib/id.service';
import { isCanonicalDomainId } from '../../backend/infrastructure/security/data-ownership';
import { CreateSocialCommentInputSchema } from '../../backend/server/validation/request-schemas';
import { publishingRepository, PublishingRepository } from '../../database/firestore/repositories/publishing.repository';
import { socialReviewsRepository, SocialReviewsRepository } from '../../database/firestore/repositories/social-reviews.repository';
import { platformAdaptationsRepository, PlatformAdaptationsRepository } from '../../database/firestore/repositories/platform-adaptations.repository';
import { pinnedCommentPackagesRepository, PinnedCommentPackagesRepository } from '../../database/firestore/repositories/pinned-comment-packages.repository';
import { thumbnailCandidatesRepository, ThumbnailCandidatesRepository } from '../../database/firestore/repositories/thumbnail-candidates.repository';
import { refinementCandidatesRepository, RefinementCandidatesRepository } from '../../database/firestore/repositories/refinement-candidates.repository';
import { BaseRepository } from '../../database/firestore/repositories/base.repository';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

async function runTests() {
  console.log('\n=== [1] Canonical ID Service Cryptographic UUIDv4 Verification ===');

  const questionId = canonicalIdService.generateQuestionId();
  assert.ok(questionId.startsWith('qst_'), 'Question ID must begin with qst_');
  assert.ok(canonicalIdService.isValidCanonicalId(questionId, 'qst_'), 'Question ID must be a valid canonical UUIDv4');
  pass('Question ID uses canonical qst_<uuid> format');

  const pubId = canonicalIdService.generatePublishingId();
  assert.ok(pubId.startsWith('pub_'), 'Publishing ID must begin with pub_');
  assert.ok(canonicalIdService.isValidCanonicalId(pubId, 'pub_'), 'Publishing ID must be a valid canonical UUIDv4');
  pass('Publishing ID uses canonical pub_<uuid> format');

  const wflId = canonicalIdService.generateWorkflowInstanceId();
  assert.ok(wflId.startsWith('wfl_'), 'Workflow ID must begin with wfl_');
  assert.ok(canonicalIdService.isValidCanonicalId(wflId, 'wfl_'), 'Workflow ID must be a valid canonical UUIDv4');
  pass('Workflow ID uses canonical wfl_<uuid> format');

  const revId = canonicalIdService.generateReviewId();
  assert.ok(revId.startsWith('rev_'), 'Review ID must begin with rev_');
  assert.ok(canonicalIdService.isValidCanonicalId(revId, 'rev_'), 'Review ID must be a valid canonical UUIDv4');
  pass('Review ID uses canonical rev_<uuid> format');

  const audId = canonicalIdService.generateAuditLogId();
  assert.ok(audId.startsWith('aud_'), 'Audit ID must begin with aud_');
  assert.ok(canonicalIdService.isValidCanonicalId(audId, 'aud_'), 'Audit ID must be a valid canonical UUIDv4');
  pass('Audit ID uses canonical aud_<uuid> format');

  console.log('\n=== [2] Publishing Repository ID & Memory Store Remediation ===');

  const generatedPubId = publishingRepository.generateId();
  assert.ok(generatedPubId.startsWith('pub_'), 'publishingRepository.generateId() must return pub_<uuid>');
  assert.ok(
    canonicalIdService.isValidCanonicalId(generatedPubId, 'pub_'),
    'publishingRepository.generateId() must be a valid canonical UUIDv4'
  );
  assert.ok(!generatedPubId.includes('BP-PUB-000'), 'Must not generate sequential BP-PUB-###### IDs');
  pass('publishingRepository.generateId() is canonical UUIDv4, not sequential counter');

  // Verify idCounter was removed
  assert.strictEqual(
    (publishingRepository as any).idCounter,
    undefined,
    'publishingRepository must not possess a process-local idCounter'
  );
  pass('publishingRepository process-local idCounter successfully eliminated');

  // Verify publishingPlatformStore Map was removed
  assert.strictEqual(
    (publishingRepository as any).publishingPlatformStore,
    undefined,
    'publishingRepository must not use an in-memory Map for platform records'
  );
  pass('publishingRepository in-memory publishingPlatformStore Map successfully eliminated');

  console.log('\n=== [3] Rogue In-Memory Store Elimination in Domain Repositories ===');

  // SocialReviewsRepository
  assert.ok(socialReviewsRepository instanceof BaseRepository, 'socialReviewsRepository must extend BaseRepository');
  assert.strictEqual(
    (socialReviewsRepository as any).socialReviewStore,
    undefined,
    'socialReviewsRepository must not use an in-memory socialReviewStore Map'
  );
  pass('socialReviewsRepository in-memory store successfully eliminated');

  // PlatformAdaptationsRepository
  assert.ok(platformAdaptationsRepository instanceof BaseRepository, 'platformAdaptationsRepository must extend BaseRepository');
  assert.strictEqual(
    (platformAdaptationsRepository as any).adaptationStore,
    undefined,
    'platformAdaptationsRepository must not use an in-memory adaptationStore Map'
  );
  assert.strictEqual(
    (platformAdaptationsRepository as any).versionStore,
    undefined,
    'platformAdaptationsRepository must not use an in-memory versionStore Map'
  );
  pass('platformAdaptationsRepository in-memory stores successfully eliminated');

  // PinnedCommentPackagesRepository
  assert.ok(pinnedCommentPackagesRepository instanceof BaseRepository, 'pinnedCommentPackagesRepository must extend BaseRepository');
  assert.strictEqual(
    (pinnedCommentPackagesRepository as any).packageStore,
    undefined,
    'pinnedCommentPackagesRepository must not use an in-memory packageStore Map'
  );
  assert.strictEqual(
    (pinnedCommentPackagesRepository as any).versionStore,
    undefined,
    'pinnedCommentPackagesRepository must not use an in-memory versionStore Map'
  );
  pass('pinnedCommentPackagesRepository in-memory stores successfully eliminated');

  // ThumbnailCandidatesRepository
  assert.ok(thumbnailCandidatesRepository instanceof BaseRepository, 'thumbnailCandidatesRepository must extend BaseRepository');
  assert.strictEqual(
    (thumbnailCandidatesRepository as any).candidateStore,
    undefined,
    'thumbnailCandidatesRepository must not use an in-memory candidateStore Map'
  );
  assert.strictEqual(
    (thumbnailCandidatesRepository as any).versionStore,
    undefined,
    'thumbnailCandidatesRepository must not use an in-memory versionStore Map'
  );
  pass('thumbnailCandidatesRepository in-memory stores successfully eliminated');

  // RefinementCandidatesRepository
  assert.ok(refinementCandidatesRepository instanceof BaseRepository, 'refinementCandidatesRepository must extend BaseRepository');
  assert.strictEqual(
    (refinementCandidatesRepository as any).store,
    undefined,
    'refinementCandidatesRepository must not use an in-memory store Map'
  );
  pass('refinementCandidatesRepository in-memory store successfully eliminated');

  console.log('\n=== [4] Schema and Data Ownership Canonical ID Acceptance ===');

  const testCanonicalPubId = 'pub_12345678-1234-4234-8234-1234567890ab';
  assert.ok(
    isCanonicalDomainId(testCanonicalPubId),
    'isCanonicalDomainId must accept canonical UUIDv4 publishing IDs'
  );
  pass('isCanonicalDomainId accepts canonical UUID IDs');

  const parsed = CreateSocialCommentInputSchema.safeParse({
    contentId: 'BP-CNT-000001',
    publishingId: testCanonicalPubId,
    platform: 'youtube',
    commentText: 'Great test question!',
  });
  assert.ok(parsed.success, `CreateSocialCommentInputSchema must accept canonical pub_<uuid>: ${parsed.error?.message}`);
  pass('CreateSocialCommentInputSchema accepts canonical pub_<uuid> identifier');

  console.log('\nAll Firestore-native ID integrity and persistence tests PASSED!\n');
}

runTests().catch((err) => {
  console.error('\nFAILED test:', err);
  process.exit(1);
});
