/**
 * BURRA PARIKSHA CMS - Phase 7 Real Google Drive E2E Verification
 * 
 * Verifies live Google Drive operations using configured OAuth 2.0 credentials.
 */

import { googleDriveService } from '../lib/services/google-drive.service';

export async function runRealDriveE2E() {
  console.log('\n==================================================');
  console.log('PHASE 7 REAL GOOGLE DRIVE E2E SMOKE TEST');
  console.log('==================================================\n');

  // STEP 1 — CONFIGURATION SAFETY CHECK
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || googleDriveService.getInMemoryAuth();

  console.log('Configuration Presence Checklist:');
  console.log(`- GOOGLE_CLIENT_ID:           ${clientId ? 'PRESENT (Configured)' : 'MISSING'}`);
  console.log(`- GOOGLE_CLIENT_SECRET:       ${clientSecret ? 'PRESENT (Configured)' : 'MISSING'}`);
  console.log(`- GOOGLE_REDIRECT_URI:        ${redirectUri ? 'PRESENT (Configured)' : 'MISSING'}`);
  console.log(`- GOOGLE_DRIVE_REFRESH_TOKEN: ${refreshToken ? 'PRESENT (Configured)' : 'MISSING'}`);

  if (!clientId || !clientSecret) {
    console.log('\n❌ [BLOCKED] Server-side OAuth Client ID or Client Secret is not configured.');
    console.log('Please define GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before proceeding.');
    return;
  }

  // STEP 2 — AUTHORIZATION URL GENERATION IF REFRESH TOKEN IS MISSING
  if (!refreshToken) {
    console.log('\n⚠️  GOOGLE_DRIVE_REFRESH_TOKEN is not configured yet.');
    console.log('Please follow these steps to generate the OAuth refresh token:\n');
    
    try {
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri || 'http://localhost:3000/api/auth/google/callback'
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        state: 'e2e-verification-state',
      });

      console.log('👉 ACTION REQUIRED:');
      console.log('1. Open this authorization URL in your browser:');
      console.log(`   \x1b[36m${authUrl}\x1b[0m\n`);
      console.log('2. Approve the permissions with your target Google administrator account.');
      console.log('3. Google will redirect you to the callback URI. The backend will intercept and securely capture the refresh token in memory.');
    } catch (err: any) {
      console.error('❌ Failed to generate authorization URL:', err?.message || err);
    }
    return;
  }

  // STEP 3 — REAL DRIVE OPERATIONS E2E TEST
  console.log('\n🚀 Starting real Google Drive API verification...');
  const testFileName = `e2e_smoke_test_${Date.now()}.txt`;
  const testContent = 'BURRA_PARIKSHA_OAUTH_SMOKE_TEST_PASSED_OK';
  const testBuffer = Buffer.from(testContent);

  let tempFileId: string | undefined;

  try {
    // 1. Resolve Hierarchy
    console.log('Resolving folder hierarchy in Google Drive...');
    const hierarchy = await googleDriveService.ensureContentHierarchy('BP-CNT-E2ETEST');
    console.log(`Hierarchy folders resolved successfully! Parent folder ID: "${hierarchy.contentFolderId}"`);

    // 2. Upload file
    console.log(`Uploading synthetic text file: "${testFileName}"...`);
    const uploadRes = await googleDriveService.uploadFile({
      folderId: hierarchy.videosFolderId,
      fileName: testFileName,
      mimeType: 'text/plain',
      bodyStreamOrBuffer: testBuffer,
    });

    tempFileId = uploadRes.fileId;
    console.log(`✅ File uploaded successfully! Google Drive File ID: "${tempFileId}"`);

    if (!tempFileId) {
      throw new Error('Upload returned an empty file ID.');
    }

    // 3. Retrieve metadata
    console.log(`Retrieving file metadata for ID: "${tempFileId}"...`);
    const meta = await googleDriveService.getFileMetadata(tempFileId);
    console.log(`✅ Metadata retrieved! Name: "${meta.name}", Size: ${meta.size} bytes`);

    // 4. Download file
    console.log(`Downloading file from ID: "${tempFileId}"...`);
    const downloadRes = await googleDriveService.downloadFile(tempFileId);
    console.log(`✅ Download finished with HTTP status: ${downloadRes.statusCode}`);

    // Read stream content
    const chunks: Buffer[] = [];
    for await (const chunk of downloadRes.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const downloadedContent = Buffer.concat(chunks).toString('utf8');

    // 5. Verify byte match
    if (downloadedContent !== testContent) {
      throw new Error(`Data mismatch! Sent: "${testContent}", Received: "${downloadedContent}"`);
    }
    console.log('✅ Byte-to-byte verification matches perfectly!');

    // 6. Cleanup (delete file)
    console.log(`Cleaning up: deleting test file ID "${tempFileId}"...`);
    await googleDriveService.deleteFile(tempFileId);
    console.log('✅ Cleanup succeeded! Test file deleted from Google Drive.');

  } catch (err: any) {
    console.log('\n❌ [FAILED] E2E Test completed with errors:');
    console.log(`Error type: ${err?.name || 'Unknown'}`);
    console.log(`Error message: ${err?.message || err}`);
    
    // Attempt cleanup if file was uploaded
    if (tempFileId) {
      console.log('Attempting emergency cleanup for file ID:', tempFileId);
      try {
        await googleDriveService.deleteFile(tempFileId);
        console.log('Emergency cleanup succeeded.');
      } catch (cleanupErr: any) {
        console.error('Emergency cleanup failed:', cleanupErr?.message || cleanupErr);
      }
    }
  }
}

// Runnable entry point
if (process.argv[1]?.includes('phase7-real-drive-e2e')) {
  runRealDriveE2E()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal E2E error:', err);
      process.exit(1);
    });
}
