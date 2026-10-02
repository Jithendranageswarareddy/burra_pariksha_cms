/**
 * BURRA PARIKSHA CMS — Stage 14 Media Architecture Automated Verification Suite
 *
 * Verifies that the Media Architecture established in 14-MEDIA-ARCHITECTURE.md and
 * src/types/media-architecture.ts is strictly enforced:
 * 1. 4 Media Types & MIME Vocabulary Coverage (Image, Audio, Video, Document).
 * 2. Provider-Independent Reference Decoupling (AP-007 / AP-008).
 * 3. Cryptographic Hash & Size Integrity Validation (SHA-256).
 * 4. Media Lifecycle State Transitions (HOT_ACTIVE through COLD_ARCHIVED).
 * 5. Archive Verification Algorithm (pre-retirement checksum match).
 * 6. Asynchronous Restore Process Contract & Audit Trail.
 * 7. Broken Reference Quarantine & Fallback Handling.
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  MediaType,
  MEDIA_TYPES,
  CanonicalMimeType,
  MEDIA_TYPE_TO_MIMES_MAP,
  MediaProcessingState,
  MediaArchiveState,
  MEDIA_ARCHIVE_STATES,
  MEDIA_ID_PATTERNS,
  MediaAssetSchema,
  DriveReferenceSchema,
  ArchiveReferenceSchema,
  verifyArchiveIntegrity,
  handleBrokenReference,
  initiateMediaRestore,
  type MediaAsset,
  type DriveReference,
} from '../types/media-architecture';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 14 MEDIA ARCHITECTURE VIOLATION] ${msg}`);
  }
}

export async function runStage14MediaArchitectureTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 14 MEDIA ARCHITECTURE VERIFICATION SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: 4 Media Types & MIME Vocabulary Coverage
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 4 Media Types & MIME Vocabulary Coverage...');
  assert(MEDIA_TYPES.length === 4, `Expected 4 media types, got ${MEDIA_TYPES.length}`);
  assert(MEDIA_TYPES.includes(MediaType.IMAGE), 'Missing IMAGE type');
  assert(MEDIA_TYPES.includes(MediaType.AUDIO), 'Missing AUDIO type');
  assert(MEDIA_TYPES.includes(MediaType.VIDEO), 'Missing VIDEO type');
  assert(MEDIA_TYPES.includes(MediaType.DOCUMENT), 'Missing DOCUMENT type');

  // Verify Image MIMEs
  const imageMimes = MEDIA_TYPE_TO_MIMES_MAP[MediaType.IMAGE];
  assert(imageMimes.includes(CanonicalMimeType.IMAGE_PNG), 'Missing image/png');
  assert(imageMimes.includes(CanonicalMimeType.IMAGE_JPEG), 'Missing image/jpeg');
  assert(imageMimes.includes(CanonicalMimeType.IMAGE_WEBP), 'Missing image/webp');

  // Verify Audio MIMEs
  const audioMimes = MEDIA_TYPE_TO_MIMES_MAP[MediaType.AUDIO];
  assert(audioMimes.includes(CanonicalMimeType.AUDIO_WAV), 'Missing audio/wav');
  assert(audioMimes.includes(CanonicalMimeType.AUDIO_MPEG), 'Missing audio/mpeg');
  assert(audioMimes.includes(CanonicalMimeType.AUDIO_AAC), 'Missing audio/aac');

  // Verify Video MIMEs
  const videoMimes = MEDIA_TYPE_TO_MIMES_MAP[MediaType.VIDEO];
  assert(videoMimes.includes(CanonicalMimeType.VIDEO_MP4), 'Missing video/mp4');
  assert(videoMimes.includes(CanonicalMimeType.VIDEO_QUICKTIME), 'Missing video/quicktime');

  // Verify Document MIMEs
  const docMimes = MEDIA_TYPE_TO_MIMES_MAP[MediaType.DOCUMENT];
  assert(docMimes.includes(CanonicalMimeType.DOCUMENT_PDF), 'Missing application/pdf');
  assert(docMimes.includes(CanonicalMimeType.DOCUMENT_PLAIN), 'Missing text/plain');
  assert(docMimes.includes(CanonicalMimeType.DOCUMENT_JSON), 'Missing application/json');

  console.log('  -> PASSED: All 4 canonical media types and 11 MIME formats verified.');

  // --------------------------------------------------------------------------
  // TEST 2: Provider-Independent Reference Decoupling (AP-007 / AP-008)
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: Provider-Independent Reference Decoupling...');
  const sampleMediaAsset: MediaAsset = {
    id: 'MED-000412',
    name: 'Class10_Physics_Reflection_MasterCut.mp4',
    mediaType: MediaType.VIDEO,
    mimeType: CanonicalMimeType.VIDEO_MP4,
    sizeBytes: 25482910,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ownerUserId: 'USR-000101',
    processingState: MediaProcessingState.PROCESSED,
    archiveState: MediaArchiveState.HOT_ACTIVE,
    activeDriveReferenceId: 'REF-000412',
    activeArchiveReferenceId: null,
    isQuarantined: false,
    version: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  };

  const parsedAsset = MediaAssetSchema.safeParse(sampleMediaAsset);
  assert(parsedAsset.success, `MediaAsset failed schema: ${JSON.stringify(parsedAsset)}`);

  // Verify DriveReference decoupling
  const sampleDriveRef: DriveReference = {
    id: 'REF-000412',
    mediaAssetId: 'MED-000412',
    driveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456',
    driveFolderId: '0B1c2D3e4F5g6H7i8J9k0L1m2N3o4P5q',
    folderHierarchyPath: '/BP-Production/2026-W40/MasterCuts/',
    webViewLink: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view',
    webContentLink: 'https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUvWxYz123456',
    isAccessible: true,
    isQuarantined: false,
    quarantineReason: null,
    lastVerifiedAt: '2026-10-02T10:00:00.000Z',
  };

  const parsedDriveRef = DriveReferenceSchema.safeParse(sampleDriveRef);
  assert(parsedDriveRef.success, `DriveReference failed schema: ${JSON.stringify(parsedDriveRef)}`);

  // Verify ArchiveReference decoupling
  const sampleArchiveRef = {
    id: 'ARC-000412',
    mediaAssetId: 'MED-000412',
    archiveProvider: 'GCS_COLDLINE' as const,
    bucketName: 'bp-cms-coldline-archive',
    objectPath: '2026/10/MED-000412.mp4',
    archiveSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    manifestId: 'MNF-202610-001',
    archivedAt: '2026-10-02T10:30:00.000Z',
    restoredAt: null,
  };

  const parsedArchiveRef = ArchiveReferenceSchema.safeParse(sampleArchiveRef);
  assert(parsedArchiveRef.success, `ArchiveReference failed schema: ${JSON.stringify(parsedArchiveRef)}`);
  console.log('  -> PASSED: Provider-independent references decoupled across metadata, active Drive, and cold storage.');

  // --------------------------------------------------------------------------
  // TEST 3: Cryptographic Hash & Size Integrity Validation
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Cryptographic Hash & Size Integrity Validation...');
  assert(MEDIA_ID_PATTERNS.SHA256_HASH.test('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'), 'Valid SHA-256 hash failed regex');
  assert(!MEDIA_ID_PATTERNS.SHA256_HASH.test('short-hash'), 'Short hash unexpectedly passed regex');
  assert(!MEDIA_ID_PATTERNS.SHA256_HASH.test('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'), 'Uppercase hash must be lowercase');

  // Assert size validation (must be positive integer)
  const badSizeAsset = { ...sampleMediaAsset, sizeBytes: -100 };
  assert(!MediaAssetSchema.safeParse(badSizeAsset).success, 'Negative sizeBytes must be rejected');
  console.log('  -> PASSED: SHA-256 lowercase 64-character hash and positive size integrity enforced.');

  // --------------------------------------------------------------------------
  // TEST 4: Media Lifecycle State Transitions
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Media Lifecycle State Transitions...');
  assert(MEDIA_ARCHIVE_STATES.length === 5, `Expected 5 archive states, got ${MEDIA_ARCHIVE_STATES.length}`);
  assert(MEDIA_ARCHIVE_STATES.includes(MediaArchiveState.HOT_ACTIVE), 'Missing HOT_ACTIVE state');
  assert(MEDIA_ARCHIVE_STATES.includes(MediaArchiveState.STAGED_FOR_ARCHIVE), 'Missing STAGED_FOR_ARCHIVE state');
  assert(MEDIA_ARCHIVE_STATES.includes(MediaArchiveState.ARCHIVING), 'Missing ARCHIVING state');
  assert(MEDIA_ARCHIVE_STATES.includes(MediaArchiveState.COLD_ARCHIVED), 'Missing COLD_ARCHIVED state');
  assert(MEDIA_ARCHIVE_STATES.includes(MediaArchiveState.RESTORE_IN_PROGRESS), 'Missing RESTORE_IN_PROGRESS state');
  console.log('  -> PASSED: All 5 media lifecycle states aligned with Stage 08 state model.');

  // --------------------------------------------------------------------------
  // TEST 5: Archive Verification Algorithm (pre-retirement checksum match)
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Archive Verification Algorithm...');
  const activeHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const identicalHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const mismatchedHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  // Matching hashes must return true
  assert(verifyArchiveIntegrity(activeHash, identicalHash) === true, 'Identical hashes must verify successfully');

  // Mismatched hashes must throw CORRUPTED_ARCHIVE_ABORT
  let caughtAbort = false;
  try {
    verifyArchiveIntegrity(activeHash, mismatchedHash);
  } catch (err: any) {
    caughtAbort = true;
    assert(err.message.includes('CORRUPTED_ARCHIVE_ABORT'), 'Error must contain CORRUPTED_ARCHIVE_ABORT');
  }
  assert(caughtAbort, 'Mismatched hash must trigger CORRUPTED_ARCHIVE_ABORT exception');
  console.log('  -> PASSED: Archive integrity check prevents premature active binary deletion on corruption.');

  // --------------------------------------------------------------------------
  // TEST 6: Asynchronous Restore Process Contract & Audit Trail
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: Asynchronous Restore Process Contract...');
  const coldAsset: MediaAsset = {
    ...sampleMediaAsset,
    archiveState: MediaArchiveState.COLD_ARCHIVED,
    activeDriveReferenceId: null,
    activeArchiveReferenceId: 'ARC-000412',
  };

  const restoreInitiation = initiateMediaRestore(coldAsset, 'USR-000001');
  assert(restoreInitiation.updatedAsset.archiveState === MediaArchiveState.RESTORE_IN_PROGRESS, 'Asset must transition to RESTORE_IN_PROGRESS');
  assert(restoreInitiation.updatedAsset.version === coldAsset.version + 1, 'Version must increment on restore');
  assert(restoreInitiation.auditAction === 'MEDIA_RESTORE_INITIATED', 'Audit action must be MEDIA_RESTORE_INITIATED');

  // Attempting to restore non-cold asset must throw
  let restoreFailed = false;
  try {
    initiateMediaRestore(sampleMediaAsset, 'USR-000001'); // asset is HOT_ACTIVE
  } catch (err: any) {
    restoreFailed = true;
    assert(err.message.includes('RESTORE_STATE_INVALID'), 'Must reject restore for non-cold asset');
  }
  assert(restoreFailed, 'Restore of HOT_ACTIVE asset must fail');
  console.log('  -> PASSED: Restore state validation and audit trail emission verified.');

  // --------------------------------------------------------------------------
  // TEST 7: Broken Reference Quarantine & Fallback Handling
  // --------------------------------------------------------------------------
  console.log('Checking Check 7: Broken Reference Quarantine & Fallback Handling...');
  const resolution = handleBrokenReference(sampleDriveRef, 'HTTP 404 Google Drive File Not Found');
  assert(resolution.quarantinedReference.isAccessible === false, 'Quarantined ref must be marked inaccessible');
  assert(resolution.quarantinedReference.isQuarantined === true, 'Quarantined ref must have isQuarantined: true');
  assert(resolution.quarantinedReference.quarantineReason?.includes('HTTP 404'), 'Reason must be recorded');
  assert(resolution.fallbackPlaceholderUri.includes('placeholder'), 'Fallback URI must point to placeholder asset');
  assert(resolution.alertNotificationPayload.alertType === 'BROKEN_MEDIA_REFERENCE', 'Alert type must be BROKEN_MEDIA_REFERENCE');
  console.log('  -> PASSED: Broken references safely quarantined with UI fallback and alert dispatch.');

  console.log('\n============================================================');
  console.log('ALL STAGE 14 MEDIA ARCHITECTURE VERIFICATIONS PASSED (7/7)');
  console.log('============================================================\n');
}

// Direct CLI Execution Runner
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('stage14')) {
  runStage14MediaArchitectureTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
