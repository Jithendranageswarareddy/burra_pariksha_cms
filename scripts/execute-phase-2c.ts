import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface SheetData {
  headers: string[];
  rows: any[][];
}

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !spreadsheetId) {
    console.error('BLOCKED: Missing Google Service Account environment variables.');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('=== STEP 1: PRE-MIGRATION READ & BACKUP ===');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const title = metaRes.data.properties?.title || '';
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  const sheetNames = sheetList.map(s => s.title);
  const ranges = sheetNames.map(s => `'${s}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const liveDataBefore: Record<string, SheetData> = {};
  const valueRanges = batchRes.data.valueRanges || [];

  for (let i = 0; i < sheetNames.length; i++) {
    const sName = sheetNames[i];
    const vr = valueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    liveDataBefore[sName] = { headers, rows };
  }

  // Backup creation
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `phase-2c-pre-migration-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    timestamp,
    spreadsheetId,
    title,
    worksheets: sheetList,
    data: liveDataBefore,
  }, null, 2));

  console.log(`Backup File: ${backupFile}`);
  console.log(`Backup File Size: ${fs.statSync(backupFile).size} bytes`);
  const verifyBackup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  if (Object.keys(verifyBackup.data).length !== sheetNames.length) {
    console.error('BLOCKED: Backup verification failed.');
    process.exit(1);
  }
  console.log('Backup Verification: PASSED (All worksheets verified).');

  // STEP 2: DEPENDENCY & DUPLICATE ANALYSIS
  console.log('\n=== STEP 2: CONTENT_MASTERS & DOWNSTREAM DEPENDENCY ANALYSIS ===');

  const cmData = liveDataBefore['CONTENT_MASTERS'];
  const cmHeaders = cmData.headers;
  const cmIdIdx = cmHeaders.indexOf('id');
  const cmCidIdx = cmHeaders.indexOf('content_id');
  const cmTitleIdx = cmHeaders.indexOf('title');
  const cmPqIdx = cmHeaders.indexOf('primary_question_id');
  const cmTopicIdx = cmHeaders.indexOf('topic_id');
  const cmSubtopicIdx = cmHeaders.indexOf('subtopic_id');
  const cmCreatedByIdx = cmHeaders.indexOf('created_by');
  const cmCreatedAtIdx = cmHeaders.indexOf('created_at');
  const cmUpdatedAtIdx = cmHeaders.indexOf('updated_at');

  console.log(`Total CONTENT_MASTERS rows in backup: ${cmData.rows.length}`);

  // Downstream data indices
  const qData = liveDataBefore['QUESTIONS'];
  const qHeaders = qData.headers;
  const qIdIdx = qHeaders.indexOf('id');
  const qCidIdx = qHeaders.indexOf('content_id');
  const qMstIdx = qHeaders.indexOf('content_master_id');

  const vData = liveDataBefore['VIDEOS'];
  const vHeaders = vData.headers;
  const vIdIdx = vHeaders.indexOf('id');
  const vCidIdx = vHeaders.indexOf('content_id');
  const vQIdx = vHeaders.indexOf('question_id');
  const vMstIdx = vHeaders.indexOf('content_master_id');

  const sData = liveDataBefore['SCRIPT'];
  const sHeaders = sData.headers;
  const sIdIdx = sHeaders.indexOf('id');
  const sCidIdx = sHeaders.indexOf('content_id');
  const sVidIdx = sHeaders.indexOf('video_id');
  const sQIdx = sHeaders.indexOf('question_id');

  const tData = liveDataBefore['THUMBNAILS'];
  const tHeaders = tData.headers;
  const tIdIdx = tHeaders.indexOf('id');
  const tCidIdx = tHeaders.indexOf('content_id');
  const tVidIdx = tHeaders.indexOf('video_id');

  const pData = liveDataBefore['PINNED_COMMENTS'];
  const pHeaders = pData.headers;
  const pIdIdx = pHeaders.indexOf('id');
  const pCidIdx = pHeaders.indexOf('content_id');
  const pVidIdx = pHeaders.indexOf('video_id');

  const pubData = liveDataBefore['PUBLISHING'];
  const pubHeaders = pubData.headers;
  const pubIdIdx = pubHeaders.indexOf('id');
  const pubCidIdx = pubHeaders.indexOf('content_id');
  const pubVidIdx = pubHeaders.indexOf('video_id');
  const pubQIdx = pubHeaders.indexOf('question_id');

  const revData = liveDataBefore['SOCIAL_REVIEWS'];
  const revHeaders = revData.headers;
  const revIdIdx = revHeaders.indexOf('id');
  const revCidIdx = revHeaders.indexOf('content_id');
  const revQIdx = revHeaders.indexOf('question_id');
  const revMstIdx = revHeaders.indexOf('content_master_id');

  // Let's analyze duplicate IDs in CONTENT_MASTERS
  const cmIdOccurrences: Record<string, any[][]> = {};
  cmData.rows.forEach(r => {
    const id = String(r[cmIdIdx] || '').trim();
    if (!cmIdOccurrences[id]) cmIdOccurrences[id] = [];
    cmIdOccurrences[id].push(r);
  });

  const duplicateIdGroups: Record<string, any[][]> = {};
  for (const [id, rows] of Object.entries(cmIdOccurrences)) {
    if (rows.length > 1) {
      duplicateIdGroups[id] = rows;
    }
  }

  console.log(`Duplicate ID groups count: ${Object.keys(duplicateIdGroups).length}`);
  const duplicateResolutionDetails: any[] = [];
  for (const [dupId, rows] of Object.entries(duplicateIdGroups)) {
    console.log(`Duplicate ID "${dupId}" has ${rows.length} rows:`);
    const titles = rows.map(r => r[cmTitleIdx]);
    const pqs = rows.map(r => r[cmPqIdx]);
    console.log(`  Titles: ${JSON.stringify(titles)}`);
    console.log(`  Primary Question IDs: ${JSON.stringify(pqs)}`);
    
    // Check if rows are identical in content or different
    const isExactDuplicate = rows.every((r, idx, arr) => 
      r[cmTitleIdx] === arr[0][cmTitleIdx] && 
      r[cmPqIdx] === arr[0][cmPqIdx] && 
      r[cmTopicIdx] === arr[0][cmTopicIdx] && 
      r[cmSubtopicIdx] === arr[0][cmSubtopicIdx]
    );

    duplicateResolutionDetails.push({
      id: dupId,
      rowCount: rows.length,
      isExactDuplicate,
      titles,
      primaryQuestionIds: pqs,
      resolution: isExactDuplicate 
        ? 'Identical logical content: Preserved rows with distinct canonical BP-CNT IDs to maintain 1-to-1 row addressability while reporting ambiguity'
        : 'Different logical content: Assigned separate canonical BP-CNT IDs',
    });
  }

  // Check 9 other legacy IDs
  const otherLegacyRows: any[] = [];
  cmData.rows.forEach(r => {
    const id = String(r[cmIdIdx] || '').trim();
    if (!id.startsWith('BP-MST-') && !id.startsWith('BP-CNT-')) {
      otherLegacyRows.push({
        id,
        title: r[cmTitleIdx],
        primaryQuestionId: r[cmPqIdx],
        createdAt: r[cmCreatedAtIdx],
      });
    }
  });

  console.log(`Other legacy ID rows count: ${otherLegacyRows.length}`);
  console.log('Other legacy IDs sample:', otherLegacyRows);

  // STEP 3: ALLOCATE CANONICAL BP-CNT IDs
  console.log('\n=== STEP 3: CANONICAL BP-CNT ALLOCATION & MIGRATION ===');
  let currentCntNumber = 1;

  // We assign a deterministic unique BP-CNT-###### to each Content Master row (1..N)
  // Map from Content Master row index / primaryQuestionId / legacyId to new BP-CNT ID
  const cmMigrationMap: Array<{
    rowIndex: number;
    legacyId: string;
    canonicalContentId: string;
    primaryQuestionId: string;
    title: string;
  }> = [];

  const cmRowToCntId = new Map<number, string>();
  const pqToCntId = new Map<string, string>(); // primaryQuestionId -> canonicalContentId (if 1-to-1)
  const legacyCmIdToCntIds = new Map<string, string[]>(); // legacyId -> list of canonicalContentIds

  // For question ID mapping
  const qIdToCmRow = new Map<string, number>();

  cmData.rows.forEach((r, idx) => {
    const legacyId = String(r[cmIdIdx] || '').trim();
    const pqId = String(r[cmPqIdx] || '').trim();
    const title = String(r[cmTitleIdx] || '').trim();

    const canonicalId = `BP-CNT-${String(currentCntNumber).padStart(6, '0')}`;
    currentCntNumber++;

    cmMigrationMap.push({
      rowIndex: idx,
      legacyId,
      canonicalContentId: canonicalId,
      primaryQuestionId: pqId,
      title,
    });

    cmRowToCntId.set(idx, canonicalId);

    if (pqId) {
      if (!pqToCntId.has(pqId)) {
        pqToCntId.set(pqId, canonicalId);
        qIdToCmRow.set(pqId, idx);
      }
    }

    if (!legacyCmIdToCntIds.has(legacyId)) {
      legacyCmIdToCntIds.set(legacyId, []);
    }
    legacyCmIdToCntIds.get(legacyId)!.push(canonicalId);
  });

  console.log(`Allocated ${cmMigrationMap.length} unique BP-CNT IDs. Range: BP-CNT-000001 to BP-CNT-${String(currentCntNumber - 1).padStart(6, '0')}`);

  // Construct migrated CONTENT_MASTERS rows
  const newCmRows = cmData.rows.map((r, idx) => {
    const row = [...r];
    const canonicalId = cmRowToCntId.get(idx)!;
    row[cmCidIdx] = canonicalId;
    return row;
  });

  // STEP 4: DOWNSTREAM MIGRATION (Deterministic Only)
  console.log('\n=== STEP 4: DOWNSTREAM DETERMINISTIC MIGRATION ===');

  // 1. QUESTIONS
  let qMigratedCount = 0;
  let qUnresolvedCount = 0;
  const newQRows = qData.rows.map(r => {
    const row = [...r];
    const qId = String(r[qIdIdx] || '').trim();
    const mstId = qMstIdx !== -1 ? String(r[qMstIdx] || '').trim() : '';

    let matchedCntId = '';

    // Direct match via primary_question_id in Content Master
    if (qId && pqToCntId.has(qId)) {
      matchedCntId = pqToCntId.get(qId)!;
    } else if (mstId && legacyCmIdToCntIds.has(mstId)) {
      const candidates = legacyCmIdToCntIds.get(mstId)!;
      if (candidates.length === 1) {
        matchedCntId = candidates[0];
      }
    }

    if (matchedCntId) {
      row[qCidIdx] = matchedCntId;
      qMigratedCount++;
    } else {
      row[qCidIdx] = '';
      qUnresolvedCount++;
    }
    return row;
  });
  console.log(`QUESTIONS -> Migrated: ${qMigratedCount}, Unresolved: ${qUnresolvedCount}`);

  // Create Question ID to canonicalContentId lookup from migrated questions
  const qIdToResolvedCntId = new Map<string, string>();
  newQRows.forEach(r => {
    const qId = String(r[qIdIdx] || '').trim();
    const cid = String(r[qCidIdx] || '').trim();
    if (qId && cid) {
      qIdToResolvedCntId.set(qId, cid);
    }
  });

  // 2. VIDEOS
  let vMigratedCount = 0;
  let vUnresolvedCount = 0;
  const vIdToResolvedCntId = new Map<string, string>();

  const newVRows = vData.rows.map(r => {
    const row = [...r];
    const vId = String(r[vIdIdx] || '').trim();
    const qId = vQIdx !== -1 ? String(r[vQIdx] || '').trim() : '';
    const mstId = vMstIdx !== -1 ? String(r[vMstIdx] || '').trim() : '';

    let matchedCntId = '';
    if (qId && qIdToResolvedCntId.has(qId)) {
      matchedCntId = qIdToResolvedCntId.get(qId)!;
    } else if (mstId && legacyCmIdToCntIds.has(mstId)) {
      const candidates = legacyCmIdToCntIds.get(mstId)!;
      if (candidates.length === 1) {
        matchedCntId = candidates[0];
      }
    }

    if (matchedCntId) {
      row[vCidIdx] = matchedCntId;
      if (vId) vIdToResolvedCntId.set(vId, matchedCntId);
      vMigratedCount++;
    } else {
      row[vCidIdx] = '';
      vUnresolvedCount++;
    }
    return row;
  });
  console.log(`VIDEOS -> Migrated: ${vMigratedCount}, Unresolved: ${vUnresolvedCount}`);

  // 3. SCRIPT
  let sMigratedCount = 0;
  let sUnresolvedCount = 0;
  const newSRows = sData.rows.map(r => {
    const row = [...r];
    const vId = sVidIdx !== -1 ? String(r[sVidIdx] || '').trim() : '';
    const qId = sQIdx !== -1 ? String(r[sQIdx] || '').trim() : '';

    let matchedCntId = '';
    if (vId && vIdToResolvedCntId.has(vId)) {
      matchedCntId = vIdToResolvedCntId.get(vId)!;
    } else if (qId && qIdToResolvedCntId.has(qId)) {
      matchedCntId = qIdToResolvedCntId.get(qId)!;
    }

    if (matchedCntId) {
      row[sCidIdx] = matchedCntId;
      sMigratedCount++;
    } else {
      row[sCidIdx] = '';
      sUnresolvedCount++;
    }
    return row;
  });
  console.log(`SCRIPT -> Migrated: ${sMigratedCount}, Unresolved: ${sUnresolvedCount}`);

  // 4. THUMBNAILS
  let tMigratedCount = 0;
  let tUnresolvedCount = 0;
  const newTRows = tData.rows.map(r => {
    const row = [...r];
    const vId = tVidIdx !== -1 ? String(r[tVidIdx] || '').trim() : '';

    let matchedCntId = '';
    if (vId && vIdToResolvedCntId.has(vId)) {
      matchedCntId = vIdToResolvedCntId.get(vId)!;
    }

    if (matchedCntId) {
      row[tCidIdx] = matchedCntId;
      tMigratedCount++;
    } else {
      row[tCidIdx] = '';
      tUnresolvedCount++;
    }
    return row;
  });
  console.log(`THUMBNAILS -> Migrated: ${tMigratedCount}, Unresolved: ${tUnresolvedCount}`);

  // 5. PINNED_COMMENTS
  let pMigratedCount = 0;
  let pUnresolvedCount = 0;
  const newPRows = pData.rows.map(r => {
    const row = [...r];
    const vId = pVidIdx !== -1 ? String(r[pVidIdx] || '').trim() : '';

    let matchedCntId = '';
    if (vId && vIdToResolvedCntId.has(vId)) {
      matchedCntId = vIdToResolvedCntId.get(vId)!;
    }

    if (matchedCntId) {
      row[pCidIdx] = matchedCntId;
      pMigratedCount++;
    } else {
      row[pCidIdx] = '';
      pUnresolvedCount++;
    }
    return row;
  });
  console.log(`PINNED_COMMENTS -> Migrated: ${pMigratedCount}, Unresolved: ${pUnresolvedCount}`);

  // 6. PUBLISHING
  let pubMigratedCount = 0;
  let pubUnresolvedCount = 0;
  const newPubRows = pubData.rows.map(r => {
    const row = [...r];
    const vId = pubVidIdx !== -1 ? String(r[pubVidIdx] || '').trim() : '';
    const qId = pubQIdx !== -1 ? String(r[pubQIdx] || '').trim() : '';

    let matchedCntId = '';
    if (vId && vIdToResolvedCntId.has(vId)) {
      matchedCntId = vIdToResolvedCntId.get(vId)!;
    } else if (qId && qIdToResolvedCntId.has(qId)) {
      matchedCntId = qIdToResolvedCntId.get(qId)!;
    }

    if (matchedCntId) {
      row[pubCidIdx] = matchedCntId;
      pubMigratedCount++;
    } else {
      row[pubCidIdx] = '';
      pubUnresolvedCount++;
    }
    return row;
  });
  console.log(`PUBLISHING -> Migrated: ${pubMigratedCount}, Unresolved: ${pubUnresolvedCount}`);

  // 7. SOCIAL_REVIEWS
  let revMigratedCount = 0;
  let revUnresolvedCount = 0;
  const newRevRows = revData.rows.map(r => {
    const row = [...r];
    const qId = revQIdx !== -1 ? String(r[revQIdx] || '').trim() : '';
    const mstId = revMstIdx !== -1 ? String(r[revMstIdx] || '').trim() : '';

    let matchedCntId = '';
    if (qId && qIdToResolvedCntId.has(qId)) {
      matchedCntId = qIdToResolvedCntId.get(qId)!;
    } else if (mstId && legacyCmIdToCntIds.has(mstId)) {
      const candidates = legacyCmIdToCntIds.get(mstId)!;
      if (candidates.length === 1) {
        matchedCntId = candidates[0];
      }
    }

    if (matchedCntId) {
      row[revCidIdx] = matchedCntId;
      revMigratedCount++;
    } else {
      row[revCidIdx] = '';
      revUnresolvedCount++;
    }
    return row;
  });
  console.log(`SOCIAL_REVIEWS -> Migrated: ${revMigratedCount}, Unresolved: ${revUnresolvedCount}`);

  // STEP 5: SEQUENCES UPDATE
  console.log('\n=== STEP 5: SEQUENCES COLLISION-SAFE UPDATE ===');
  const seqData = liveDataBefore['SEQUENCES'];
  const newSeqRows = seqData.rows.map(r => {
    const row = [...r];
    if (row[0] === 'CONTENT_MASTER') {
      row[1] = currentCntNumber; // smallest safe next number above all allocated BP-CNT-*
      row[2] = 'BP-CNT-';
      row[3] = 6;
      row[4] = new Date().toISOString();
    }
    return row;
  });

  // STEP 6: EXECUTE LIVE WRITES
  console.log('\n=== STEP 6: EXECUTING LIVE SHEET UPDATES ===');
  const updatePayloads: Record<string, { headers: string[]; rows: any[][] }> = {
    CONTENT_MASTERS: { headers: cmHeaders, rows: newCmRows },
    QUESTIONS: { headers: qHeaders, rows: newQRows },
    VIDEOS: { headers: vHeaders, rows: newVRows },
    SCRIPT: { headers: sHeaders, rows: newSRows },
    THUMBNAILS: { headers: tHeaders, rows: newTRows },
    PINNED_COMMENTS: { headers: pHeaders, rows: newPRows },
    PUBLISHING: { headers: pubHeaders, rows: newPubRows },
    SOCIAL_REVIEWS: { headers: revHeaders, rows: newRevRows },
    SEQUENCES: { headers: seqData.headers, rows: newSeqRows },
  };

  let actualWrites = 0;
  let actualUpdates = 0;

  for (const [sName, payload] of Object.entries(updatePayloads)) {
    console.log(`Updating sheet "${sName}" (${payload.rows.length} rows)...`);
    const fullGrid = [payload.headers, ...payload.rows];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: fullGrid,
      },
    });
    actualWrites++;
    actualUpdates++;
  }

  // STEP 7: POST-MIGRATION VERIFICATION
  console.log('\n=== STEP 7: POST-MIGRATION READ-ONLY VERIFICATION ===');
  const postBatchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: Object.keys(updatePayloads).map(s => `'${s}'!A1:ZZ1000`),
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const postData: Record<string, SheetData> = {};
  Object.keys(updatePayloads).forEach((s, idx) => {
    const vr = postBatchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    postData[s] = { headers, rows };
  });

  // Verify CONTENT_MASTERS
  const postCm = postData['CONTENT_MASTERS'];
  const postCmCidIdx = postCm.headers.indexOf('content_id');
  const postCmIdIdx = postCm.headers.indexOf('id');
  let postCmBpCntCount = 0;
  let postCmBlankCount = 0;
  const postCmCidSet = new Set<string>();
  const postCmDupCids: string[] = [];

  postCm.rows.forEach(r => {
    const cid = String(r[postCmCidIdx] || '').trim();
    if (!cid) {
      postCmBlankCount++;
    } else {
      if (cid.startsWith('BP-CNT-')) postCmBpCntCount++;
      if (postCmCidSet.has(cid)) postCmDupCids.push(cid);
      postCmCidSet.add(cid);
    }
  });

  console.log(`Post-verification CONTENT_MASTERS: Total ${postCm.rows.length}, Valid BP-CNT: ${postCmBpCntCount}, Blank: ${postCmBlankCount}, Duplicates: ${postCmDupCids.length}`);

  // Downstream post-verification summary
  const downstreamReport: Record<string, any> = {};
  ['QUESTIONS', 'VIDEOS', 'SCRIPT', 'THUMBNAILS', 'PINNED_COMMENTS', 'PUBLISHING', 'SOCIAL_REVIEWS'].forEach(sName => {
    const pSheet = postData[sName];
    const pCidIdx = pSheet.headers.indexOf('content_id');
    let validCnt = 0;
    let blankCnt = 0;
    let orphanCnt = 0;
    let invalidCnt = 0;

    pSheet.rows.forEach(r => {
      const cid = String(r[pCidIdx] || '').trim();
      if (!cid) {
        blankCnt++;
      } else if (cid.startsWith('BP-CNT-')) {
        validCnt++;
        if (!postCmCidSet.has(cid)) {
          orphanCnt++;
        }
      } else {
        invalidCnt++;
      }
    });

    downstreamReport[sName] = {
      totalRows: pSheet.rows.length,
      validBpCntContentId: validCnt,
      blankContentId: blankCnt,
      invalidContentId: invalidCnt,
      orphanContentId: orphanCnt,
    };
  });

  console.log('Downstream Post-Verification Summary:', JSON.stringify(downstreamReport, null, 2));

  // Save report
  const finalReport = {
    backupFile,
    backupVerified: true,
    cmMigrationCount: cmMigrationMap.length,
    cmDuplicateResolutions: duplicateResolutionDetails,
    otherLegacyRows,
    downstreamReport,
    seqBefore: seqData.rows.find(r => r[0] === 'CONTENT_MASTER'),
    seqAfter: newSeqRows.find(r => r[0] === 'CONTENT_MASTER'),
    actualWrites,
    actualUpdates,
  };

  const reportPath = path.join(backupDir, `phase-2c-migration-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\nPhase 2C Execution Completed. Report written to ${reportPath}`);
}

main().catch(err => {
  console.error('Phase 2C Execution Failed:', err);
  process.exit(1);
});
