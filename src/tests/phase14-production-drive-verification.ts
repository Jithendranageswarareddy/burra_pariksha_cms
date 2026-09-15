/**
 * BURRA PARIKSHA CMS - Phase 14 Google Drive Production Infrastructure Verification Suite
 */

import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { googleDriveService } from '../lib/services/google-drive.service';
import { phase14DriveService } from '../lib/services/phase14-drive.service';
import { ContentMasterStatus, UserRole } from '../types';
import { ValidationError } from '../lib/google-sheets/errors';
import { Readable } from 'stream';

export interface Phase14CheckResult {
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface Phase14SuiteResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Phase14CheckResult[];
}

export async function runPhase14Verification(): Promise<Phase14SuiteResult> {
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = ''; // force fallback in-memory mode

  // Clear states to avoid test leakage
  contentMastersRepository.clearFallbackData();
  mediaAssetsRepository.clearFallbackData();
  googleDriveService.clearFolderCache();

  const results: Phase14CheckResult[] = [];

  function record(check: string, condition: boolean, details: string) {
    results.push({
      check,
      status: condition ? 'PASS' : 'FAIL',
      details,
    });
  }

  try {
    const testContentId = 'BP-CNT-999999';

    // Seed Content Master record
    await contentMastersRepository.create({
      id: testContentId,
      contentId: testContentId,
      title: 'Drive Integration Test Content',
      status: ContentMasterStatus.DRAFT,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. P14-01: Ensure folder hierarchy for content ID matches BP-CNT-######/{Raw,Edited,Final,Thumbnail}
    const hierarchy = await googleDriveService.ensureProductionHierarchy(testContentId);
    record(
      'P14-01: Correct subfolder names created under BP-CNT-######',
      hierarchy.rawFolderId !== '' &&
        hierarchy.editedFolderId !== '' &&
        hierarchy.finalFolderId !== '' &&
        hierarchy.thumbnailFolderId !== '',
      `Folder mapping: Raw=${hierarchy.rawFolderId}, Edited=${hierarchy.editedFolderId}, Final=${hierarchy.finalFolderId}, Thumbnail=${hierarchy.thumbnailFolderId}`
    );

    // 2. P14-02: Prevent duplicate parent content folder creation on subsequent requests
    const nextHierarchy = await googleDriveService.ensureProductionHierarchy(testContentId);
    record(
      'P14-02: Root content subfolders resolved deterministically (cached / zero-redundancy)',
      hierarchy.contentFolderId === nextHierarchy.contentFolderId &&
        hierarchy.rawFolderId === nextHierarchy.rawFolderId,
      `Original contentFolderId: "${hierarchy.contentFolderId}", Resolved contentFolderId: "${nextHierarchy.contentFolderId}"`
    );

    // 3. P14-03: MIME type validation accepts correct image formats for THUMBNAIL stage
    let passThumbMime = true;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'THUMBNAIL',
        fileName: 'lesson_cover.png',
        mimeType: 'image/png',
        fileSize: 1024 * 1024,
      });
    } catch {
      passThumbMime = false;
    }
    record(
      'P14-03: Thumbnail MIME validation accepts valid inputs (image/png)',
      passThumbMime,
      'Valid thumbnail type (image/png with .png) successfully passed validation gates'
    );

    // 4. P14-04: Reject unsupported MIME type for THUMBNAIL stage (e.g. video/mp4)
    let rejectThumbMime = false;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'THUMBNAIL',
        fileName: 'lesson_cover.mp4',
        mimeType: 'video/mp4',
        fileSize: 1024 * 1024,
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Unsupported MIME type')) {
        rejectThumbMime = true;
      }
    }
    record(
      'P14-04: Reject invalid MIME types for THUMBNAIL stage',
      rejectThumbMime,
      'MIME type video/mp4 was rejected for THUMBNAIL stage as expected'
    );

    // 5. P14-05: Reject mismatched filename extension and MIME type (MIME hijacking defense)
    let rejectMismatchedThumb = false;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'THUMBNAIL',
        fileName: 'malicious.png',
        mimeType: 'image/jpeg',
        fileSize: 1024,
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('does not match file extension')) {
        rejectMismatchedThumb = true;
      }
    }
    record(
      'P14-05: Reject mismatched filename extension and MIME type for Thumbnail',
      rejectMismatchedThumb,
      'image/jpeg with filename extension .png was correctly intercepted and rejected'
    );

    // 6. P14-06: Size validation limits thumbnail uploads to configurable threshold (max 5MB)
    let rejectOversizedThumb = false;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'THUMBNAIL',
        fileName: 'huge_cover.jpg',
        mimeType: 'image/jpeg',
        fileSize: 6 * 1024 * 1024, // 6MB
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('file exceeds size limit')) {
        rejectOversizedThumb = true;
      }
    }
    record(
      'P14-06: Reject oversized thumbnail uploads (>5MB)',
      rejectOversizedThumb,
      '6MB thumbnail was successfully blocked prior to starting the Google Drive transfer'
    );

    // 7. P14-07: MIME validation permits standard video formats for video stages
    let passVideoMime = true;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'RAW',
        fileName: 'raw_recording.mov',
        mimeType: 'video/quicktime',
        fileSize: 10 * 1024 * 1024,
      });
    } catch {
      passVideoMime = false;
    }
    record(
      'P14-07: Raw video stage accepts mov formats with matching MIME type',
      passVideoMime,
      'Raw video stage accepted video/quicktime (.mov) correctly'
    );

    // 8. P14-08: FINAL media stage strictly enforces standard video/mp4 format
    let rejectNonMp4Final = false;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'FINAL',
        fileName: 'lesson_render.mov',
        mimeType: 'video/quicktime',
        fileSize: 15 * 1024 * 1024,
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('FINAL stage strictly requires "video/mp4"')) {
        rejectNonMp4Final = true;
      }
    }
    record(
      'P14-08: FINAL stage strictly enforces video/mp4 MIME types',
      rejectNonMp4Final,
      'FINAL stage rejected non-mp4 format (video/quicktime) as expected'
    );

    // 9. P14-09: Size validation blocks oversized video uploads
    let rejectOversizedVideo = false;
    try {
      phase14DriveService.validateMediaAsset({
        mediaStage: 'RAW',
        fileName: 'gargantuan_render.mp4',
        mimeType: 'video/mp4',
        fileSize: 101 * 1024 * 1024, // 101MB (limit 100MB)
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('exceeds size limit')) {
        rejectOversizedVideo = true;
      }
    }
    record(
      'P14-09: Reject oversized video uploads (>100MB)',
      rejectOversizedVideo,
      '101MB video was successfully blocked before upload execution'
    );

    // 10. P14-10: Reject upload attempts referencing invalid or missing Content IDs
    let rejectInvalidContentId = false;
    try {
      await phase14DriveService.uploadProductionAsset({
        contentId: 'BP-CNT-UNKNOWN-99',
        mediaStage: 'RAW',
        fileName: 'raw_lesson.mp4',
        mimeType: 'video/mp4',
        bodyStreamOrBuffer: Buffer.from('FAKE_VIDEO_CONTENT'),
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('does not exist')) {
        rejectInvalidContentId = true;
      }
    }
    record(
      'P14-10: Reject uploads referencing non-existent Content IDs',
      rejectInvalidContentId,
      'Upload attempt blocked because Content ID BP-CNT-UNKNOWN-99 is not registered'
    );

    // 11. P14-11: Uploading a valid asset correctly yields a registered media asset metadata record
    const testVideoBuffer = Buffer.from('RAW_UNCOMPRESSED_VIDEO_FRAMES_E2E');
    const assetV1 = await phase14DriveService.uploadProductionAsset({
      contentId: testContentId,
      mediaStage: 'RAW',
      fileName: 'raw_lesson_v1.mp4',
      mimeType: 'video/mp4',
      bodyStreamOrBuffer: testVideoBuffer,
    });

    record(
      'P14-11: Successfully upload valid asset and persist structured metadata',
      assetV1.id !== '' &&
        assetV1.contentId === testContentId &&
        assetV1.mediaStage === 'RAW' &&
        assetV1.version === 1 &&
        assetV1.fileSize === testVideoBuffer.length &&
        assetV1.checksum !== undefined,
      `Uploaded Asset: ID=${assetV1.id}, stage=${assetV1.mediaStage}, version=${assetV1.version}, size=${assetV1.fileSize} bytes, checksum=${assetV1.checksum}`
    );

    // 12. P14-12: Replacement upload resolves next version number and preserves history
    const testVideoBufferV2 = Buffer.from('RAW_UNCOMPRESSED_VIDEO_FRAMES_E2E_VERSION_2');
    const assetV2 = await phase14DriveService.uploadProductionAsset({
      contentId: testContentId,
      mediaStage: 'RAW',
      fileName: 'raw_lesson_v2.mp4',
      mimeType: 'video/mp4',
      bodyStreamOrBuffer: testVideoBufferV2,
    });

    const allRawAssets = await mediaAssetsRepository.findByContentIdAndStage(testContentId, 'RAW');
    record(
      'P14-12: Replacement upload resolves next version and preserves historical versions',
      assetV2.version === 2 && allRawAssets.length === 2,
      `V1 version=${assetV1.version}, V2 version=${assetV2.version}, Total raw assets tracked in history: ${allRawAssets.length}`
    );

    // 13. P14-13: Safe Rollback - metadata persistence failure triggers automatic deletion from Google Drive
    // Stub the repository to force throw error on create
    const originalCreate = mediaAssetsRepository.create;
    mediaAssetsRepository.create = async () => {
      throw new Error('Database transaction timeout during metadata persistence');
    };

    let driveDeletedCount = 0;
    const originalDeleteFile = googleDriveService.deleteFile;
    googleDriveService.deleteFile = async (fileId: string) => {
      driveDeletedCount++;
      return originalDeleteFile.call(googleDriveService, fileId);
    };

    let rejectWithRollback = false;
    try {
      await phase14DriveService.uploadProductionAsset({
        contentId: testContentId,
        mediaStage: 'FINAL',
        fileName: 'final_lesson.mp4',
        mimeType: 'video/mp4',
        bodyStreamOrBuffer: Buffer.from('FINAL_PRODUCTION_RENDER'),
      });
    } catch (err: any) {
      if (err.message.includes('metadata. Upload rolled back successfully')) {
        rejectWithRollback = true;
      }
    }

    // Restore stubs
    mediaAssetsRepository.create = originalCreate;
    googleDriveService.deleteFile = originalDeleteFile;

    record(
      'P14-13: Safe Rollback triggers automatic cleanup of uploaded Drive files on metadata failure',
      rejectWithRollback && driveDeletedCount === 1,
      `Upload failed caught: ${rejectWithRollback}, drive deletion rollback triggered: ${driveDeletedCount === 1}`
    );

    // 14. P14-14: Bounded retries successfully rescue transient errors
    let transientAttempts = 0;
    const transientSuccess = await googleDriveService.executeWithRetry(async () => {
      transientAttempts++;
      if (transientAttempts < 3) {
        const transientErr: any = new Error('Service Unavailable');
        transientErr.status = 503;
        throw transientErr;
      }
      return 'RESCUED_SUCCESS';
    }, 3, 5);

    record(
      'P14-14: Bounded retry rescues transient API exceptions (e.g. HTTP 503)',
      transientSuccess === 'RESCUED_SUCCESS' && transientAttempts === 3,
      `Attempts executed: ${transientAttempts}, returned outcome: "${transientSuccess}"`
    );

    // 15. P14-15: Retry mechanism exits immediately on permanent validation failures
    let permanentAttempts = 0;
    let caughtPermanentErr = false;
    try {
      await googleDriveService.executeWithRetry(async () => {
        permanentAttempts++;
        const permanentErr: any = new Error('Permission Denied / Unauthorized scope');
        permanentErr.status = 403;
        throw permanentErr;
      }, 3, 5);
    } catch {
      caughtPermanentErr = true;
    }

    record(
      'P14-15: Bounded retry exits immediately on permanent validation or auth errors',
      caughtPermanentErr && permanentAttempts === 1,
      `Permanent error caught: ${caughtPermanentErr}, total retry attempts executed: ${permanentAttempts}`
    );

    // 16. P14-16: Stream binary data securely (Express integration download)
    const testFileId = assetV1.driveFileId;
    const downloadResult = await googleDriveService.downloadFile(testFileId);
    let downloadedChunks: Buffer[] = [];
    for await (const chunk of downloadResult.stream) {
      downloadedChunks.push(chunk);
    }
    const downloadedBuffer = Buffer.concat(downloadedChunks);

    record(
      'P14-16: Safe streaming/download of production media bytes',
      downloadedBuffer.toString() === testVideoBuffer.toString(),
      `Uploaded payload: "${testVideoBuffer.toString()}", Streamed payload: "${downloadedBuffer.toString()}"`
    );

    // 17. P14-17: HTTP Range header support in streaming downloader
    const rangeResult = await googleDriveService.downloadFile(testFileId, 'bytes=4-15');
    let rangeChunks: Buffer[] = [];
    for await (const chunk of rangeResult.stream) {
      rangeChunks.push(chunk);
    }
    const rangeBuffer = Buffer.concat(rangeChunks);
    const expectedSub = testVideoBuffer.subarray(4, 16); // inclusive bounds

    record(
      'P14-17: HTTP Range header support slices binary buffer with precision',
      rangeResult.statusCode === 206 && rangeBuffer.toString() === expectedSub.toString(),
      `Expected substring slice: "${expectedSub.toString()}", Received slice payload: "${rangeBuffer.toString()}"`
    );

  } catch (err: any) {
    console.error('Phase 14 Verification Error:', err);
    record('Phase 14 Verification Blocked', false, err?.message || 'Unknown error');
  } finally {
    process.env.GOOGLE_SHEETS_ID = originalSheetId;
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;
  const passed = failedChecks === 0 && passedChecks > 0;

  return {
    passed,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}
