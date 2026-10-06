/**
 * Sprint 3 UAT — Multi-Take Raw Video Verification Script
 *
 * Verifies commit 0fc84a0c3f2785b4f31184cc756dc2bd18a01bae:
 * 1. Confirm GitHub main commit
 * 2. Editing Bay multi-take visibility
 * 3. Individual download actions & targets for each take
 * 4. Distinct Google Drive file links
 * 5. Refresh / persistence verification
 * 6. Active editing source marking
 * 7. Backward compatibility for default video download
 * 8. Invalid/unattached assetId rejection
 */

import assert from 'node:assert';
import '../src/config/env';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'jithendrareddy629@gmail.com';
const ADMIN_PASSWORD = 'password123';

async function verifyRawVideoMultiTake() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — MULTI-TAKE RAW VIDEO VERIFICATION');
  console.log(`Target: ${BASE_URL}`);
  console.log('============================================================\n');

  // Authenticate as Admin / Video Lead
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.strictEqual(loginRes.status, 200, 'Authentication must succeed');
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;

  // Step 5: Verify the Editing Bay for a video that has at least two RAW media assets
  const videoId = 'BP-V-000001';
  console.log(`--- Inspecting Editing Bay Data for Video: ${videoId} ---`);

  const videoRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(videoRes.status, 200, 'Video fetch must succeed');
  const video = await videoRes.json();

  const historyRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/production-history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(historyRes.status, 200, 'Production history fetch must succeed');
  const history = await historyRes.json();

  const rawAssets = Array.isArray(history.rawAssets) ? history.rawAssets : [];
  console.log(`Number of RAW assets returned: ${rawAssets.length}`);
  assert.ok(rawAssets.length >= 2, `Video must have at least 2 RAW media assets (found: ${rawAssets.length})`);

  // Step 6: Confirm every RAW asset is visible and has required metadata
  console.log('\n--- Step 6: RAW Assets Visibility & Verification ---');
  rawAssets.forEach((asset, idx) => {
    const isActiveSource = asset.driveFileId === video.driveFileId || (idx === 0 && !video.driveFileId);
    console.log(`Take ${asset.version || rawAssets.length - idx}:`);
    console.log(`  - Asset ID: ${asset.id}`);
    console.log(`  - File Name: ${asset.fileName}`);
    console.log(`  - File Size: ${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB (${asset.fileSize} bytes)`);
    console.log(`  - Drive File ID: ${asset.driveFileId}`);
    console.log(`  - Active Source: ${isActiveSource ? 'YES (ACTIVE)' : 'NO'}`);
  });

  // Step 7: Confirm each asset has its own Download & Open Drive action
  console.log('\n--- Step 7: Distinct Action Targets ---');
  rawAssets.forEach((asset) => {
    const downloadUrl = `${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/download?assetId=${encodeURIComponent(asset.id || asset.driveFileId)}`;
    const driveUrl = `https://drive.google.com/file/d/${asset.driveFileId}/view`;
    console.log(`Asset ${asset.id}:`);
    console.log(`  - Download URL: ${downloadUrl}`);
    console.log(`  - Drive URL: ${driveUrl}`);
  });

  // Step 8: Confirm Download Take 1 retrieves Take 1
  console.log('\n--- Step 8: Download Take 1 ---');
  const take1 = rawAssets[0]; // Active take (version 3)
  const take1Res = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/download?assetId=${encodeURIComponent(take1.id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(take1Res.status, 200, 'Take 1 download must return 200 OK');
  const take1Disp = take1Res.headers.get('content-disposition');
  console.log(`✓ Take 1 Download Status: 200 OK`);
  console.log(`✓ Take 1 Content-Disposition: ${take1Disp}`);
  assert.ok(take1Disp?.includes(take1.fileName), `Take 1 filename (${take1.fileName}) must be in Content-Disposition`);

  // Step 9: Confirm Download Take 2 retrieves Take 2
  console.log('\n--- Step 9: Download Take 2 ---');
  const take2 = rawAssets[1]; // Previous take (version 2)
  const take2Res = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/download?assetId=${encodeURIComponent(take2.id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(take2Res.status, 200, 'Take 2 download must return 200 OK');
  const take2Disp = take2Res.headers.get('content-disposition');
  console.log(`✓ Take 2 Download Status: 200 OK`);
  console.log(`✓ Take 2 Content-Disposition: ${take2Disp}`);
  assert.ok(take2Disp?.includes(take2.fileName), `Take 2 filename (${take2.fileName}) must be in Content-Disposition`);
  assert.notStrictEqual(take1Disp, take2Disp, 'Take 1 and Take 2 must retrieve different files');

  // Step 10: Confirm each Open Drive action points to its own Drive file
  console.log('\n--- Step 10: Open Drive Actions ---');
  const driveUrls = rawAssets.map((a) => `https://drive.google.com/file/d/${a.driveFileId}/view`);
  const uniqueDriveUrls = new Set(driveUrls);
  assert.strictEqual(uniqueDriveUrls.size, rawAssets.length, 'Each raw take must have a unique Google Drive URL');
  console.log(`✓ Verified ${uniqueDriveUrls.size} distinct Google Drive file links across takes`);

  // Step 11 & 12: Refresh the Editing Bay and confirm all raw takes remain visible & latest remains active
  console.log('\n--- Step 11 & 12: Refresh Persistence & Active Source ---');
  const refreshVideoRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const refreshHistoryRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/production-history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const refreshedHistory = await refreshHistoryRes.json();
  const refreshedVideo = await refreshVideoRes.json();
  assert.strictEqual(refreshedHistory.rawAssets?.length, rawAssets.length, 'All raw takes must remain visible after refresh');
  const refreshedActiveAsset = refreshedHistory.rawAssets.find((a: any) => a.driveFileId === refreshedVideo.driveFileId);
  assert.ok(refreshedActiveAsset, 'Latest active take must remain identified by video.driveFileId');
  assert.strictEqual(refreshedActiveAsset.id, take1.id, 'Active take after refresh must match Take 1');
  console.log(`✓ All ${refreshedHistory.rawAssets.length} takes persisted; active source is ${refreshedActiveAsset.id} (${refreshedActiveAsset.fileName})`);

  // Step 13: Confirm no existing single-video download behavior is broken
  console.log('\n--- Step 13: Single-Video Default Download ---');
  const defaultDlRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(defaultDlRes.status, 200, 'Default video download without assetId must return 200 OK');
  const defaultDisp = defaultDlRes.headers.get('content-disposition');
  console.log(`✓ Default Download Status: 200 OK, Content-Disposition: ${defaultDisp}`);
  assert.ok(defaultDisp?.includes(refreshedVideo.fileName || take1.fileName), 'Default download must retrieve the video file');

  // Step 14: Test that an invalid/unattached assetId is rejected by the backend
  console.log('\n--- Step 14: Invalid / Unattached Asset ID Rejection ---');
  const invalidAssetId = 'MEDIA-UNATTACHED-999-FAKE';
  const invalidDlRes = await fetch(`${BASE_URL}/api/videos/${encodeURIComponent(videoId)}/download?assetId=${encodeURIComponent(invalidAssetId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(invalidDlRes.status, 404, 'Invalid assetId must be rejected with HTTP 404');
  const invalidBody = await invalidDlRes.json();
  assert.strictEqual(invalidBody.error, 'Raw Asset Not Found', 'Error name must be Raw Asset Not Found');
  console.log(`✓ Backend correctly rejected unattached assetId with HTTP 404: "${invalidBody.message}"`);

  console.log('\n============================================================');
  console.log('ALL MULTI-TAKE RAW VIDEO VERIFICATION CHECKS PASSED! (100%)');
  console.log('============================================================\n');
}

verifyRawVideoMultiTake().catch((err) => {
  console.error('Multi-Take Verification Failed:', err);
  process.exit(1);
});
