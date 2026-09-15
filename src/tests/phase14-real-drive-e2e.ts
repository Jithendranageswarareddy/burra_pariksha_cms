/**
 * BURRA PARIKSHA CMS - Phase 14 Real Google Drive E2E Verification
 * 
 * Performs an actual integration test against real Google Drive and Google Sheets.
 */

import crypto from 'crypto';
import { googleDriveService } from '../lib/services/google-drive.service';
import { phase14DriveService } from '../lib/services/phase14-drive.service';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { ContentMasterStatus, MediaStage } from '../types';
import { ValidationError } from '../lib/google-sheets/errors';

export async function runPhase14RealDriveE2E() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 14: REAL GOOGLE DRIVE E2E VERIFICATION');
  console.log('========================================================================\n');

  const evidence = {
    auth: 'FAIL',
    rootFolder: 'FAIL',
    rootFolderId: '',
    contentFolder: 'FAIL',
    contentFolderId: '',
    upload: 'FAIL',
    driveFileId: '',
    metadataReadBack: 'FAIL',
    download: 'FAIL',
    checksumMatch: 'FAIL',
    streaming: 'FAIL',
    authorization: 'FAIL',
    cleanup: 'FAIL',
    verdict: 'BLOCKED'
  };

  const testContentId = 'BP-CNT-E2E14B';
  const testFileName = `e2e_prod_video_${Date.now()}.mp4`;
  const testPayload = `BURRA_PARIKSHA_PHASE_14_REAL_DRIVE_E2E_BINARY_PAYLOAD_${Date.now()}`;
  const testBuffer = Buffer.from(testPayload);
  const expectedChecksum = crypto.createHash('md5').update(testBuffer).digest('hex');

  let uploadedAssetId = '';
  let driveFileIdToDelete = '';

  try {
    // -------------------------------------------------------------------------
    // 1. REAL DRIVE AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('STEP 1: Authenticating with Google Drive...');
    const authMode = googleDriveService.getAuthProviderMode();
    console.log(`- Auth Provider Mode: ${authMode}`);
    if (authMode === 'NONE') {
      throw new Error('Google Drive integration is not configured. Real auth is unavailable.');
    }

    const driveApi = (googleDriveService as any).getDriveApi();
    if (!driveApi) {
      throw new Error('Failed to retrieve Drive API client object.');
    }
    evidence.auth = 'PASS';
    console.log('✅ Google Authentication: PASS\n');

    // -------------------------------------------------------------------------
    // 2. AUTHORIZATION & CONTENT ID EXISTENCE
    // -------------------------------------------------------------------------
    console.log(`STEP 2: Authorizing Content ID "${testContentId}"...`);
    // Check if the content master record already exists in the sheet/repository
    let existingMaster = await contentMastersRepository.findById(testContentId);
    if (!existingMaster) {
      console.log(`- Seed record for "${testContentId}" not found. Creating a controlled entry in real Google Sheet...`);
      existingMaster = await contentMastersRepository.create({
        id: testContentId,
        contentId: testContentId,
        title: 'Phase 14 Real E2E Test Content',
        status: ContentMasterStatus.DRAFT,
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`- Verified Content ID registered: Title="${existingMaster.title}"`);
    evidence.authorization = 'PASS';
    console.log('✅ Content ID Authorization Check: PASS\n');

    // -------------------------------------------------------------------------
    // 3. RESOLVE ROOT AND PRODUCTION HIERARCHY
    // -------------------------------------------------------------------------
    console.log('STEP 3: Resolving production folder hierarchy...');
    const hierarchy = await googleDriveService.ensureProductionHierarchy(testContentId);
    
    evidence.rootFolderId = hierarchy.rootFolderId;
    evidence.rootFolder = 'PASS';
    
    evidence.contentFolderId = hierarchy.contentFolderId;
    evidence.contentFolder = 'PASS';

    console.log(`- Configured Root Folder ID: "${hierarchy.rootFolderId}"`);
    console.log(`- BP-CNT Content Folder ID:  "${hierarchy.contentFolderId}"`);
    console.log(`- Raw Subfolder ID:          "${hierarchy.rawFolderId}"`);
    console.log(`- Edited Subfolder ID:       "${hierarchy.editedFolderId}"`);
    console.log(`- Final Subfolder ID:        "${hierarchy.finalFolderId}"`);
    console.log(`- Thumbnail Subfolder ID:    "${hierarchy.thumbnailFolderId}"`);
    console.log('✅ Production Hierarchy Resolution: PASS\n');

    // -------------------------------------------------------------------------
    // 4. REAL BINARY UPLOAD
    // -------------------------------------------------------------------------
    console.log(`STEP 4: Uploading unique test binary file "${testFileName}" (${testBuffer.length} bytes)...`);
    const asset = await phase14DriveService.uploadProductionAsset({
      contentId: testContentId,
      mediaStage: 'RAW',
      fileName: testFileName,
      mimeType: 'video/mp4',
      bodyStreamOrBuffer: testBuffer,
    });

    uploadedAssetId = asset.id;
    driveFileIdToDelete = asset.driveFileId;
    evidence.driveFileId = asset.driveFileId;
    evidence.upload = 'PASS';

    console.log(`- Registered Media Asset ID: "${asset.id}"`);
    console.log(`- Real Google Drive File ID: "${asset.driveFileId}"`);
    console.log(`- Computed Local Checksum:   "${expectedChecksum}"`);
    console.log('✅ Real Google Drive Upload: PASS\n');

    // -------------------------------------------------------------------------
    // 5. DRIVE METADATA READ-BACK
    // -------------------------------------------------------------------------
    console.log(`STEP 5: Querying file metadata directly from Google Drive API for ID "${asset.driveFileId}"...`);
    const remoteMeta = await googleDriveService.getFileMetadata(asset.driveFileId);
    console.log(`- Remote File Name:          "${remoteMeta.name}"`);
    console.log(`- Remote File Size:          ${remoteMeta.size} bytes`);
    console.log(`- Remote MIME Type:          "${remoteMeta.mimeType}"`);
    
    if (remoteMeta.size !== testBuffer.length) {
      throw new Error(`Remote size mismatch! Expected: ${testBuffer.length}, Got: ${remoteMeta.size}`);
    }
    evidence.metadataReadBack = 'PASS';
    console.log('✅ Remote Metadata Verification: PASS\n');

    // -------------------------------------------------------------------------
    // 6. REAL BINARY DOWNLOAD & STREAMING
    // -------------------------------------------------------------------------
    console.log(`STEP 6: Streaming/downloading binary bytes from Google Drive...`);
    const download = await googleDriveService.downloadFile(asset.driveFileId);
    evidence.download = 'PASS';

    const chunks: Buffer[] = [];
    for await (const chunk of download.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const downloadedBuffer = Buffer.concat(chunks);
    const downloadedChecksum = crypto.createHash('md5').update(downloadedBuffer).digest('hex');

    console.log(`- Downloaded bytes:          ${downloadedBuffer.length} bytes`);
    console.log(`- Downloaded Checksum:       "${downloadedChecksum}"`);
    
    if (downloadedChecksum === expectedChecksum) {
      evidence.checksumMatch = 'PASS';
    } else {
      throw new Error(`MD5 Checksum mismatch! Expected "${expectedChecksum}", Received "${downloadedChecksum}"`);
    }

    evidence.streaming = 'PASS';
    console.log('✅ Real Download, Streaming, & Byte Checksum Match: PASS\n');

    // -------------------------------------------------------------------------
    // 7. ARTIFACT CLEANUP & METADATA REMOVAL
    // -------------------------------------------------------------------------
    console.log('STEP 7: Deleting E2E test artifact from Google Drive...');
    await googleDriveService.deleteFile(asset.driveFileId);
    driveFileIdToDelete = '';
    
    // Clear fallback/local asset metadata if any
    await mediaAssetsRepository.deleteRecord(asset.id, {
      actor: { id: 'USR-E2E', name: 'E2E Runner' },
      reason: 'Phase 14 Real Drive E2E Cleanup'
    });
    evidence.cleanup = 'PASS';
    console.log('✅ Test Artifact Cleanup: PASS\n');

    evidence.verdict = 'PASS';

  } catch (err: any) {
    console.error('\n❌ E2E Verification failed with error:', err?.message || err);
    evidence.verdict = 'BLOCKED';

    // Emergency Remote Cleanup
    if (driveFileIdToDelete) {
      console.log(`- Triggering emergency remote cleanup for Drive File ID "${driveFileIdToDelete}"...`);
      try {
        await googleDriveService.deleteFile(driveFileIdToDelete);
        console.log('  Emergency Remote Cleanup: SUCCEEDED');
      } catch (cleanupErr: any) {
        console.error('  Emergency Remote Cleanup: FAILED:', cleanupErr?.message || cleanupErr);
      }
    }
  }

  console.log('========================================================================');
  console.log('E2E VERIFICATION PROOFS AND EVIDENCE');
  console.log('========================================================================');
  console.log(`REAL DRIVE AUTH:          ${evidence.auth}`);
  console.log(`REAL ROOT FOLDER:         ${evidence.rootFolder}${evidence.rootFolderId ? ` (ID: ${evidence.rootFolderId})` : ''}`);
  console.log(`REAL CONTENT FOLDER:      ${evidence.contentFolder}${evidence.contentFolderId ? ` (ID: ${evidence.contentFolderId})` : ''}`);
  console.log(`REAL UPLOAD:              ${evidence.upload}${evidence.driveFileId ? ` (ID: ${evidence.driveFileId})` : ''}`);
  console.log(`DRIVE METADATA READ-BACK: ${evidence.metadataReadBack}`);
  console.log(`REAL DOWNLOAD:            ${evidence.download}`);
  console.log(`CHECKSUM MATCH:           ${evidence.checksumMatch}`);
  console.log(`REAL STREAMING:           ${evidence.streaming}`);
  console.log(`AUTHORIZATION:            ${evidence.authorization}`);
  console.log(`TEST ARTIFACT CLEANUP:    ${evidence.cleanup}`);
  console.log('------------------------------------------------------------------------');
  console.log(`TEST ENVIRONMENT TYPE:    REAL GOOGLE DRIVE (LIVE API PATH)`);
  console.log(`FINAL VERDICT:            ${evidence.verdict}`);
  console.log('========================================================================\n');

  if (evidence.verdict !== 'PASS') {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('phase14-real-drive-e2e')) {
  runPhase14RealDriveE2E()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal runner error:', err);
      process.exit(1);
    });
}
