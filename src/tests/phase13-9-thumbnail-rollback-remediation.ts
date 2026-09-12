/**
 * BURRA PARIKSHA CMS - Phase 13.9 Thumbnail Drive Rollback Remediation Test Suite
 * 
 * Verifies:
 * 1. Successful thumbnail upload (initial V1 creation).
 * 2. Drive upload succeeds + Sheets persistence succeeds.
 * 3. Drive upload succeeds + Sheets persistence fails -> Drive deleteFile is invoked with created fileId.
 * 4. Original persistence error is propagated.
 * 5. Drive upload itself fails -> no invalid cleanup attempt.
 * 6. Existing thumbnail versioning behavior (V1 -> V2) remains intact.
 */

import { thumbnailService } from '../lib/services/thumbnail.service';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { thumbnailVersionsRepository } from '../lib/repositories/thumbnail-versions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { googleDriveService } from '../lib/services/google-drive.service';
import { idService } from '../lib/services/id.service';
import { auditService } from '../lib/services/audit.service';
import { Thumbnail, ThumbnailVersion, UserRole } from '../types';

export async function runPhase139RemediationTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}${message ? ` - ${message}` : ''}`);
  };

  console.log('================================================================');
  console.log('PHASE 13.9 REMEDIATION — THUMBNAIL DRIVE ROLLBACK TEST SUITE');
  console.log('================================================================\n');

  // Backup original methods
  const origFindVideo = videosRepository.findById.bind(videosRepository);
  const origEnsureHierarchy = googleDriveService.ensureContentHierarchy.bind(googleDriveService);
  const origUploadFile = googleDriveService.uploadFile.bind(googleDriveService);
  const origDeleteFile = googleDriveService.deleteFile.bind(googleDriveService);
  const origFindByVideoId = thumbnailsRepository.findByVideoId.bind(thumbnailsRepository);
  const origAppendThumb = thumbnailsRepository.appendRecord.bind(thumbnailsRepository);
  const origUpdateThumb = thumbnailsRepository.updateRecord.bind(thumbnailsRepository);
  const origAppendVersion = thumbnailVersionsRepository.appendRecord.bind(thumbnailVersionsRepository);
  const origAllocateId = idService.allocateThumbnailId.bind(idService);
  const origLogAudit = auditService.log.bind(auditService);

  let deletedDriveFileIds: string[] = [];
  let inMemoryThumbnails: Thumbnail[] = [];
  let inMemoryVersions: ThumbnailVersion[] = [];
  let nextSeq = 1;

  const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };

  try {
    // Setup base mocks
    videosRepository.findById = async (id: string) => {
      if (id === 'NON-EXISTENT') return null;
      return {
        id,
        contentId: 'BP-CNT-000101',
        contentMasterId: 'BP-CNT-000101',
        title: 'Sample Test Video',
        status: 'READY_TO_UPLOAD',
      } as any;
    };

    googleDriveService.ensureContentHierarchy = async (contentId: string) => {
      return {
        rootFolderId: 'fld-root',
        parentContentFolderId: 'fld-parent',
        contentFolderId: `fld-${contentId}`,
        videosFolderId: 'fld-videos',
        thumbnailsFolderId: 'fld-thumbnails',
        scriptsFolderId: 'fld-scripts',
      };
    };

    idService.allocateThumbnailId = async () => {
      return `BP-THM-${String(nextSeq++).padStart(6, '0')}`;
    };

    auditService.log = async () => {
      return {} as any;
    };

    // --------------------------------------------------------------------------
    // Test 1 & 2: Successful initial thumbnail upload & persistence
    // --------------------------------------------------------------------------
    try {
      deletedDriveFileIds = [];
      inMemoryThumbnails = [];
      inMemoryVersions = [];

      googleDriveService.uploadFile = async (params: any) => {
        return {
          fileId: 'DRIVE-FILE-SUCCESS-001',
          name: params.fileName,
          webViewLink: 'https://drive.google.com/file/d/DRIVE-FILE-SUCCESS-001/view',
          size: 1024,
        } as any;
      };

      thumbnailsRepository.findByVideoId = async (vid: string) => {
        return inMemoryThumbnails.find((t) => t.videoId === vid) || null;
      };

      thumbnailsRepository.appendRecord = async (record: Thumbnail) => {
        inMemoryThumbnails.push({ ...record });
        return { ...record };
      };

      thumbnailVersionsRepository.appendRecord = async (record: ThumbnailVersion) => {
        inMemoryVersions.push({ ...record });
        return { ...record };
      };

      const result = await thumbnailService.uploadThumbnailAsset({
        videoId: 'BP-VID-000001',
        fileName: 'cover_v1.jpg',
        mimeType: 'image/jpeg',
        fileStreamOrBuffer: Buffer.from('fake image data'),
        size: 1024,
        designerNotes: 'Initial cover mockup',
        actor: adminActor,
      });

      const passed =
        result.thumbnail.id.startsWith('BP-THM-') &&
        result.thumbnail.currentVersion === 1 &&
        result.thumbnail.driveFileId === 'DRIVE-FILE-SUCCESS-001' &&
        result.version.versionNumber === 1 &&
        inMemoryThumbnails.length === 1 &&
        inMemoryVersions.length === 1 &&
        deletedDriveFileIds.length === 0;

      addResult(
        '1 & 2. Successful thumbnail upload persists metadata and creates version 1 without deletion',
        passed,
        `Created ID: ${result.thumbnail.id}, Version: ${result.version.versionNumber}, DriveFileId: ${result.thumbnail.driveFileId}`
      );
    } catch (err: any) {
      addResult('1 & 2. Successful thumbnail upload', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 3 & 4: Drive upload succeeds + Sheets persistence fails -> Drive deleteFile invoked & error propagated
    // --------------------------------------------------------------------------
    try {
      deletedDriveFileIds = [];
      inMemoryThumbnails = [];
      inMemoryVersions = [];

      googleDriveService.uploadFile = async (params: any) => {
        return {
          fileId: 'DRIVE-FILE-ORPHAN-002',
          name: params.fileName,
          webViewLink: 'https://drive.google.com/file/d/DRIVE-FILE-ORPHAN-002/view',
          size: 2048,
        } as any;
      };

      googleDriveService.deleteFile = async (fileId: string) => {
        deletedDriveFileIds.push(fileId);
      };

      thumbnailsRepository.findByVideoId = async () => null;

      // Simulate Sheets write failure on appendRecord
      thumbnailsRepository.appendRecord = async () => {
        throw new Error('Google Sheets quota exceeded (RATE_LIMIT_EXCEEDED)');
      };

      let thrownError: Error | null = null;
      try {
        await thumbnailService.uploadThumbnailAsset({
          videoId: 'BP-VID-000002',
          fileName: 'failing_sheet.png',
          mimeType: 'image/png',
          fileStreamOrBuffer: Buffer.from('fake image data'),
          actor: adminActor,
        });
      } catch (err: any) {
        thrownError = err;
      }

      const deletedInvoked = deletedDriveFileIds.includes('DRIVE-FILE-ORPHAN-002');
      const errorPropagated =
        thrownError !== null &&
        thrownError.message.includes('RATE_LIMIT_EXCEEDED') &&
        thrownError.message.includes('Failed to persist thumbnail metadata after Drive upload');

      addResult(
        '3. Drive upload succeeds + Sheets persistence fails -> Drive deleteFile is invoked as compensation',
        deletedInvoked,
        `Deleted file IDs: [${deletedDriveFileIds.join(', ')}]`
      );

      addResult(
        '4. Original Sheets persistence error is clearly propagated to the caller',
        errorPropagated,
        `Caught error message: "${thrownError?.message || 'none'}"`
      );
    } catch (err: any) {
      addResult('3 & 4. Rollback compensation test', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 5: Drive upload itself fails -> no invalid cleanup attempt
    // --------------------------------------------------------------------------
    try {
      deletedDriveFileIds = [];

      googleDriveService.uploadFile = async () => {
        throw new Error('Drive API network socket timeout');
      };

      let driveError: Error | null = null;
      try {
        await thumbnailService.uploadThumbnailAsset({
          videoId: 'BP-VID-000003',
          fileName: 'drive_fail.png',
          mimeType: 'image/png',
          fileStreamOrBuffer: Buffer.from('fake image data'),
          actor: adminActor,
        });
      } catch (err: any) {
        driveError = err;
      }

      const passed =
        driveError !== null &&
        driveError.message.includes('Drive API network socket timeout') &&
        deletedDriveFileIds.length === 0;

      addResult(
        '5. When Drive upload itself fails, no invalid deleteFile cleanup is attempted',
        passed,
        `Drive error: "${driveError?.message || 'none'}", Deleted IDs: [${deletedDriveFileIds.join(', ')}]`
      );
    } catch (err: any) {
      addResult('5. Drive upload failure test', false, err.message);
    }

    // --------------------------------------------------------------------------
    // Test 6: Thumbnail versioning (V1 -> V2) increment remains intact
    // --------------------------------------------------------------------------
    try {
      deletedDriveFileIds = [];
      const existingThumb: Thumbnail = {
        id: 'BP-THM-000088',
        contentId: 'BP-CNT-000101',
        videoId: 'BP-VID-000088',
        hookHeadline: 'Existing Hook',
        driveAssetUrl: 'https://drive.google.com/old',
        previewUrl: '',
        status: 'DESIGNED',
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryThumbnails = [existingThumb];
      inMemoryVersions = [];

      googleDriveService.uploadFile = async (params: any) => {
        return {
          fileId: 'DRIVE-FILE-V2-003',
          name: params.fileName,
          webViewLink: 'https://drive.google.com/file/d/DRIVE-FILE-V2-003/view',
          size: 4096,
        } as any;
      };

      thumbnailsRepository.findByVideoId = async (vid: string) => {
        return inMemoryThumbnails.find((t) => t.videoId === vid) || null;
      };

      thumbnailsRepository.updateRecord = async (id: string, patch: Partial<Thumbnail>) => {
        const found = inMemoryThumbnails.find((t) => t.id === id);
        if (!found) return null;
        Object.assign(found, patch);
        return { ...found };
      };

      thumbnailVersionsRepository.appendRecord = async (record: ThumbnailVersion) => {
        inMemoryVersions.push({ ...record });
        return { ...record };
      };

      const result = await thumbnailService.uploadThumbnailAsset({
        videoId: 'BP-VID-000088',
        fileName: 'cover_v2.jpg',
        mimeType: 'image/jpeg',
        fileStreamOrBuffer: Buffer.from('fake v2 image data'),
        size: 4096,
        designerNotes: 'Version 2 revision',
        actor: adminActor,
      });

      const passed =
        result.thumbnail.id === 'BP-THM-000088' &&
        result.thumbnail.currentVersion === 2 &&
        result.thumbnail.driveFileId === 'DRIVE-FILE-V2-003' &&
        result.version.versionNumber === 2 &&
        result.version.id === 'BP-THM-000088-V2' &&
        deletedDriveFileIds.length === 0;

      addResult(
        '6. Subsequent upload increments version to V2 and creates V2 version record',
        passed,
        `Thumbnail ID: ${result.thumbnail.id}, New Version: ${result.thumbnail.currentVersion}, Version Record: ${result.version.id}`
      );
    } catch (err: any) {
      addResult('6. Version increment test', false, err.message);
    }

  } finally {
    // Teardown mocks
    videosRepository.findById = origFindVideo;
    googleDriveService.ensureContentHierarchy = origEnsureHierarchy;
    googleDriveService.uploadFile = origUploadFile;
    googleDriveService.deleteFile = origDeleteFile;
    thumbnailsRepository.findByVideoId = origFindByVideoId;
    thumbnailsRepository.appendRecord = origAppendThumb;
    thumbnailsRepository.updateRecord = origUpdateThumb;
    thumbnailVersionsRepository.appendRecord = origAppendVersion;
    idService.allocateThumbnailId = origAllocateId;
    auditService.log = origLogAudit;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${results.length} TOTAL | ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('================================================================\n');

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

// Direct CLI execution
runPhase139RemediationTests()
  .then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
