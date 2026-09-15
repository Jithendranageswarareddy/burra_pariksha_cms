import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { deletionSafetyService } from '../src/lib/services/deletion-safety.service';
import fs from 'fs';

async function main() {
  console.log('=== PHASE 03: SYNTHETIC USER CLEANUP & SCHEMA MIGRATION ===\n');

  // 1. Inspect current USERS sheet
  const spreadsheetId = googleSheetsClient.getSpreadsheetId();
  googleSheetsClient.invalidateRowCache(`${spreadsheetId}:USERS`);
  const initialData = await googleSheetsClient.getRows('USERS');
  console.log('Initial Headers:', initialData.headers);
  console.log('Initial Row Count:', initialData.rows.length);
  initialData.rows.forEach((r, idx) => {
    console.log(`  Row ${idx + 2}: id=${r[0]}, name=${r[1]}, email=${r[2]}, role=${r[3]}, active=${r[5]}`);
  });

  // 2. Verify dependencies across other sheets
  console.log('\n--- Step 1-4: Verifying zero dependencies for test users ---');
  const otherTabs = ['ASSIGNMENTS', 'QUESTIONS', 'AUDIT_LOGS'];
  for (const tab of otherTabs) {
    try {
      const { rows } = await googleSheetsClient.getRows(tab);
      let refCount = 0;
      for (const row of rows) {
        const rowStr = JSON.stringify(row);
        if (rowStr.includes('USR-INACTIVE-T9') || rowStr.includes('USR-INACTIVE-TEST')) {
          refCount++;
        }
      }
      console.log(`  ${tab}: ${refCount} references found.`);
      if (refCount > 0 && tab !== 'AUDIT_LOGS') {
        throw new Error(`Blocking dependency found in ${tab}!`);
      }
    } catch (err: any) {
      if (err.message?.includes('does not exist')) {
        console.log(`  ${tab}: tab does not exist (OK)`);
      } else {
        throw err;
      }
    }
  }

  // 3. Delete synthetic rows from bottom to top using DeletionSafetyService
  console.log('\n--- Step 5-6: Safe Deletion of Synthetic Users with Verified Backup ---');
  
  // Refresh fresh rows
  const fresh = await googleSheetsClient.getRows('USERS');
  const syntheticRowIndices: number[] = [];
  fresh.rows.forEach((r, idx) => {
    const id = String(r[0]);
    if (id === 'USR-INACTIVE-T9' || id === 'USR-INACTIVE-TEST') {
      syntheticRowIndices.push(idx + 2); // 1-based sheet row index
    }
  });

  console.log('Found synthetic rows at sheet indices:', syntheticRowIndices);

  // Process descending so earlier row indices do not shift
  syntheticRowIndices.sort((a, b) => b - a);

  for (const sheetRowIndex of syntheticRowIndices) {
    const currentData = await googleSheetsClient.getRows('USERS');
    const rowIdxInArray = sheetRowIndex - 2;
    const targetRow = currentData.rows[rowIdxInArray];
    const entityId = String(targetRow[0]);

    if (entityId !== 'USR-INACTIVE-T9' && entityId !== 'USR-INACTIVE-TEST') {
      throw new Error(`Safety violation: row ${sheetRowIndex} is ${entityId}, expected synthetic user!`);
    }

    console.log(`\nBacking up & deleting Row ${sheetRowIndex} (${entityId})...`);

    // 1 & 2. Create and verify backup
    const safetyToken = await deletionSafetyService.createAndVerifyBackup({
      sheetName: 'USERS',
      entityId,
      physicalRowIndex: sheetRowIndex,
      headers: currentData.headers,
      rawRow: targetRow,
      record: {
        id: targetRow[0],
        name: targetRow[1],
        email: targetRow[2],
        role: targetRow[3],
        avatarUrl: targetRow[4],
        isActive: targetRow[5],
        password_hash: targetRow[6],
        last_login_at: targetRow[7],
        createdAt: targetRow[8],
        updatedAt: targetRow[9],
      },
      actor: { id: 'USR-001', name: 'Jithendra' },
      reason: 'Phase 03 Synthetic test fixture cleanup',
    });

    console.log(`  Backup created & verified: token=${safetyToken.tokenId}`);
    console.log(`  Backup file: ${safetyToken.backupFilePath}`);
    console.log(`  SHA-256 Checksum: ${safetyToken.checksum}`);

    // Verify backup exists on disk
    if (!fs.existsSync(safetyToken.backupFilePath)) {
      throw new Error(`Backup file missing from disk: ${safetyToken.backupFilePath}`);
    }

    // 3. Delete row using safetyToken
    await googleSheetsClient.deleteRow('USERS', sheetRowIndex, undefined, safetyToken);
    console.log(`  Row ${sheetRowIndex} successfully deleted via Google Sheets API.`);

    // Invalidate cache immediately
    googleSheetsClient.invalidateRowCache(`${spreadsheetId}:USERS`);
  }

  // 4. Read back USERS sheet to confirm only legitimate production users remain
  console.log('\n--- Step 7-8: Read-back Verification of USERS sheet ---');
  googleSheetsClient.invalidateRowCache(`${spreadsheetId}:USERS`);
  const postDeletionData = await googleSheetsClient.getRows('USERS');
  console.log('Remaining User Count:', postDeletionData.rows.length);
  postDeletionData.rows.forEach((r, idx) => {
    console.log(`  Row ${idx + 2}: id=${r[0]}, name=${r[1]}, email=${r[2]}, role=${r[3]}, active=${r[5]}`);
  });

  if (postDeletionData.rows.length !== 2) {
    throw new Error(`Expected exactly 2 legitimate users, found ${postDeletionData.rows.length}!`);
  }

  const remId1 = String(postDeletionData.rows[0][0]);
  const remId2 = String(postDeletionData.rows[1][0]);
  if (remId1 !== 'USR-001' || remId2 !== 'USR-002') {
    throw new Error(`Unexpected user IDs remaining: ${remId1}, ${remId2}`);
  }
  console.log('VERIFIED: Only legitimate production users USR-001 and USR-002 remain.');

  // 5. Migrate Schema: Add session_version column to USERS header
  console.log('\n--- Step 9: Migrating USERS Sheet Header to include session_version ---');
  let currentHeaders = [...postDeletionData.headers];
  if (!currentHeaders.includes('session_version')) {
    const updatedHeaders = [...currentHeaders, 'session_version'];
    await googleSheetsClient.updateRow('USERS', 1, updatedHeaders);
    console.log('Updated Row 1 (Headers):', updatedHeaders);
    googleSheetsClient.invalidateRowCache(`${spreadsheetId}:USERS`);
  } else {
    console.log('Headers already contain session_version.');
  }

  // 6. Ensure USR-001 and USR-002 have session_version = 1
  console.log('\n--- Step 10: Ensuring session_version for USR-001 and USR-002 ---');
  const migratedData = await googleSheetsClient.getRows('USERS');
  console.log('Migrated headers:', migratedData.headers);
  const sessionVerIdx = migratedData.headers.indexOf('session_version');

  for (let i = 0; i < migratedData.rows.length; i++) {
    const row = migratedData.rows[i];
    const sheetRowIndex = i + 2;
    const currentVer = row[sessionVerIdx];
    if (currentVer === undefined || currentVer === null || currentVer === '' || isNaN(Number(currentVer))) {
      // Set session_version = 1
      const updatedRow = [...row];
      while (updatedRow.length < migratedData.headers.length) {
        updatedRow.push('');
      }
      updatedRow[sessionVerIdx] = 1;
      await googleSheetsClient.updateRow('USERS', sheetRowIndex, updatedRow);
      console.log(`  Updated Row ${sheetRowIndex} (${row[0]}): set session_version = 1`);
    } else {
      console.log(`  Row ${sheetRowIndex} (${row[0]}): session_version already set to ${currentVer}`);
    }
  }

  // Final verification
  googleSheetsClient.invalidateRowCache(`${spreadsheetId}:USERS`);
  const finalData = await googleSheetsClient.getRows('USERS');
  console.log('\n=== FINAL VERIFIED USERS SHEET STATE ===');
  console.log('Headers:', finalData.headers);
  finalData.rows.forEach((r, idx) => {
    console.log(`  Row ${idx + 2}: id=${r[0]}, name=${r[1]}, email=${r[2]}, role=${r[3]}, active=${r[5]}, session_version=${r[r.length - 1]}`);
  });

  console.log('\nMigration completed successfully!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
