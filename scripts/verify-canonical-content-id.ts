import { google } from 'googleapis';

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !spreadsheetId) {
    console.error('BLOCKED: Missing credentials');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const targetSheets = [
    'CONTENT_MASTERS',
    'QUESTIONS',
    'VIDEOS',
    'SCRIPT',
    'THUMBNAILS',
    'PINNED_COMMENTS',
    'PUBLISHING',
    'SOCIAL_REVIEWS',
    'SEQUENCES'
  ];

  const ranges = targetSheets.map(s => `'${s}'!A1:ZZ1000`);
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const data: Record<string, { headers: string[]; rows: any[][] }> = {};
  targetSheets.forEach((s, idx) => {
    const vr = res.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    data[s] = { headers, rows };
  });

  console.log('--- 1. CONTENT_MASTERS AUDIT ---');
  const cm = data['CONTENT_MASTERS'];
  const cmHeaders = cm.headers;
  const idIdx = cmHeaders.indexOf('id');
  const cidIdx = cmHeaders.indexOf('content_id');
  console.log('CONTENT_MASTERS headers:', cmHeaders);
  console.log('id col index:', idIdx, '| content_id col index:', cidIdx);
  console.log('Total preserved Content Master rows:', cm.rows.length);

  let cmBpCntIdCount = 0;
  let cmBpMstIdCount = 0;
  let cmBlankIdCount = 0;
  let cmOtherIdCount = 0;
  const cmIdSet = new Set<string>();
  const cmDuplicateIds: string[] = [];

  let cmValidContentIdCount = 0;
  let cmMissingContentIdCount = 0;
  let cmInvalidContentIdCount = 0;
  let cmMismatchCount = 0;
  const cmContentIdSet = new Set<string>();
  const cmDuplicateContentIds: string[] = [];

  let maxBpCntSuffix = 0;
  let maxBpMstSuffix = 0;

  for (const r of cm.rows) {
    const id = String(r[idIdx] || '').trim();
    const cid = cidIdx !== -1 ? String(r[cidIdx] || '').trim() : '';

    if (!id) {
      cmBlankIdCount++;
    } else {
      if (cmIdSet.has(id)) cmDuplicateIds.push(id);
      cmIdSet.add(id);

      if (id.startsWith('BP-CNT-')) {
        cmBpCntIdCount++;
        const num = parseInt(id.replace('BP-CNT-', ''), 10);
        if (!isNaN(num) && num > maxBpCntSuffix) maxBpCntSuffix = num;
      } else if (id.startsWith('BP-MST-')) {
        cmBpMstIdCount++;
        const num = parseInt(id.replace('BP-MST-', ''), 10);
        if (!isNaN(num) && num > maxBpMstSuffix) maxBpMstSuffix = num;
      } else {
        cmOtherIdCount++;
      }
    }

    if (!cid) {
      cmMissingContentIdCount++;
    } else {
      if (cmContentIdSet.has(cid)) cmDuplicateContentIds.push(cid);
      cmContentIdSet.add(cid);

      if (cid.startsWith('BP-CNT-')) {
        cmValidContentIdCount++;
      } else {
        cmInvalidContentIdCount++;
      }
    }

    if (id && cid && id !== cid) {
      cmMismatchCount++;
    }
  }

  console.log('CM id BP-CNT- count:', cmBpCntIdCount);
  console.log('CM id BP-MST- count:', cmBpMstIdCount);
  console.log('CM id blank count:', cmBlankIdCount);
  console.log('CM id other count:', cmOtherIdCount);
  console.log('CM duplicate ids count:', cmDuplicateIds.length);
  console.log('CM valid content_id count:', cmValidContentIdCount);
  console.log('CM missing content_id count:', cmMissingContentIdCount);
  console.log('CM invalid content_id count:', cmInvalidContentIdCount);
  console.log('CM duplicate content_ids count:', cmDuplicateContentIds.length);
  console.log('CM id vs content_id mismatch count:', cmMismatchCount);
  console.log('Sample CM rows (first 5):', cm.rows.slice(0, 5).map(r => ({ id: r[idIdx], content_id: r[cidIdx], title: r[cmHeaders.indexOf('title')] })));

  // 2. Downstream check
  console.log('\n--- 2. DOWNSTREAM ENTITIES AUDIT ---');
  const downstreamSheets = ['QUESTIONS', 'VIDEOS', 'SCRIPT', 'THUMBNAILS', 'PINNED_COMMENTS', 'PUBLISHING', 'SOCIAL_REVIEWS'];

  // Valid masters set contains all IDs and content_ids
  const allMasterIds = new Set<string>();
  cm.rows.forEach(r => {
    const id = String(r[idIdx] || '').trim();
    const cid = cidIdx !== -1 ? String(r[cidIdx] || '').trim() : '';
    if (id) allMasterIds.add(id);
    if (cid) allMasterIds.add(cid);
  });

  const downstreamSummary: Record<string, any> = {};

  for (const sName of downstreamSheets) {
    const sData = data[sName];
    const sHeaders = sData.headers;
    const sIdIdx = sHeaders.indexOf('id');
    const sCidIdx = sHeaders.indexOf('content_id');
    const sMstIdx = sHeaders.indexOf('content_master_id');

    let totalRows = sData.rows.length;
    let validBpCntCount = 0;
    let legacyBpMstCount = 0;
    let missingCidCount = 0;
    let invalidCidCount = 0;
    let orphanCidCount = 0;
    const cidList: string[] = [];
    const duplicateCids: string[] = [];
    const seenCids = new Set<string>();

    for (const r of sData.rows) {
      const cid = sCidIdx !== -1 ? String(r[sCidIdx] || '').trim() : '';
      const mstId = sMstIdx !== -1 ? String(r[sMstIdx] || '').trim() : '';
      const effectiveId = cid || mstId;

      if (!effectiveId) {
        missingCidCount++;
      } else {
        if (effectiveId.startsWith('BP-CNT-')) {
          validBpCntCount++;
        } else if (effectiveId.startsWith('BP-MST-')) {
          legacyBpMstCount++;
        } else {
          invalidCidCount++;
        }

        if (seenCids.has(effectiveId)) {
          duplicateCids.push(effectiveId);
        }
        seenCids.add(effectiveId);

        // Check master correlation
        if (!allMasterIds.has(effectiveId)) {
          orphanCidCount++;
        }
      }
    }

    downstreamSummary[sName] = {
      totalRows,
      hasContentIdHeader: sCidIdx !== -1,
      validBpCntCount,
      legacyBpMstCount,
      missingCidCount,
      invalidCidCount,
      orphanCidCount,
      duplicateCidsCount: duplicateCids.length,
      sampleFirst5: sData.rows.slice(0, 5).map(r => ({
        id: r[sIdIdx],
        content_id: sCidIdx !== -1 ? r[sCidIdx] : undefined,
        content_master_id: sMstIdx !== -1 ? r[sMstIdx] : undefined
      }))
    };
  }

  console.log('Downstream Summary:', JSON.stringify(downstreamSummary, null, 2));

  // 3. Sequences
  console.log('\n--- 3. SEQUENCES AUDIT ---');
  const seq = data['SEQUENCES'];
  console.log('Sequences rows:', seq.rows);
  const cmSeqRow = seq.rows.find(r => r[0] === 'CONTENT_MASTER');
  console.log('CONTENT_MASTER sequence row:', cmSeqRow);
  console.log('Max BP-CNT suffix in CM:', maxBpCntSuffix);
  console.log('Max BP-MST suffix in CM:', maxBpMstSuffix);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
