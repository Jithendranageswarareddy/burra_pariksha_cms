/**
 * BP-CMS AUDIT AND CLEANUP SCRIPT FOR BP-CNT-000001
 * 
 * Safe, dependency-aware audit and removal of target content BP-CNT-000001
 */

import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  pinnedCommentPackagesRepository,
  workflowRepository,
  assignmentsRepository,
  publishingRepository,
  socialReviewsRepository,
  validationsRepository,
  refinementCandidatesRepository,
  mediaAssetsRepository,
  thumbnailCandidatesRepository,
  platformAdaptationsRepository,
  intelligenceRepository,
  strategyRecommendationRepository,
  socialCommentsRepository,
  commentIntelligenceRepository,
  auditLogRepository,
} from '../src/lib/repositories';
import { googleDriveService } from '../src/lib/services/google-drive.service';

export interface AuditInventory {
  targetContentId: string;
  sheets: {
    worksheet: string;
    recordId: string;
    relationship: string;
    willDelete: boolean;
    details?: any;
  }[];
  drive: {
    driveId: string;
    name: string;
    type: 'folder' | 'file';
    mimeType?: string;
    path: string;
    relationship: string;
    willDelete: boolean;
  }[];
  immutableAuditLogs: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    timestamp: string;
  }[];
  summary: {
    totalSheetRecordsToDelete: number;
    totalDriveItemsToDelete: number;
    totalAuditRecordsPreserved: number;
  };
}

export async function auditContent(targetContentId: string = 'BP-CNT-000001'): Promise<AuditInventory> {
  const inventory: AuditInventory = {
    targetContentId,
    sheets: [],
    drive: [],
    immutableAuditLogs: [],
    summary: {
      totalSheetRecordsToDelete: 0,
      totalDriveItemsToDelete: 0,
      totalAuditRecordsPreserved: 0,
    },
  };

  // 1. Content Master
  const contentMasters = await contentMastersRepository.findAll();
  const targetMaster = contentMasters.find(
    (cm) => cm.id === targetContentId || (cm as any).contentId === targetContentId
  );
  if (targetMaster) {
    inventory.sheets.push({
      worksheet: 'CONTENT_MASTERS',
      recordId: targetMaster.id,
      relationship: 'Root Content Master',
      willDelete: true,
      details: targetMaster,
    });
  }

  // 2. Questions
  const allQuestions = await questionsRepository.findAll();
  const targetQuestions = allQuestions.filter(
    (q) => q.contentId === targetContentId || q.contentMasterId === targetContentId
  );
  const questionIds = new Set(targetQuestions.map((q) => q.id));
  for (const q of targetQuestions) {
    inventory.sheets.push({
      worksheet: 'QUESTIONS',
      recordId: q.id,
      relationship: `Linked to ${targetContentId}`,
      willDelete: true,
      details: { text: q.questionText?.slice(0, 50), status: q.status },
    });
  }

  // 3. Videos
  const allVideos = await videosRepository.findAll();
  const targetVideos = allVideos.filter(
    (v) =>
      v.contentId === targetContentId ||
      v.contentMasterId === targetContentId ||
      (v.questionId && questionIds.has(v.questionId))
  );
  const videoIds = new Set(targetVideos.map((v) => v.id));
  for (const v of targetVideos) {
    inventory.sheets.push({
      worksheet: 'VIDEOS',
      recordId: v.id,
      relationship: `Video for ${targetContentId} (Question: ${v.questionId})`,
      willDelete: true,
      details: { title: v.title, status: v.status, driveFileId: v.driveFileId },
    });
  }

  // 4. Question Videos join
  const allQVs = await questionVideosRepository.findAll();
  const targetQVs = allQVs.filter(
    (qv) => questionIds.has(qv.questionId) || videoIds.has(qv.videoId)
  );
  for (const qv of targetQVs) {
    inventory.sheets.push({
      worksheet: 'QUESTION_VIDEOS',
      recordId: qv.id,
      relationship: `Join link Q: ${qv.questionId} <-> V: ${qv.videoId}`,
      willDelete: true,
    });
  }

  // 5. Media Assets
  const allMediaAssets = await mediaAssetsRepository.findAll();
  const targetMediaAssets = allMediaAssets.filter(
    (ma) =>
      ma.contentId === targetContentId ||
      ma.contentId?.replace(/^BP-CNT-0*/, '') === targetContentId.replace(/^BP-CNT-0*/, '')
  );
  for (const ma of targetMediaAssets) {
    inventory.sheets.push({
      worksheet: 'MEDIA_ASSETS',
      recordId: ma.id,
      relationship: `Media Asset (${ma.mediaStage} V${ma.version}) for ${targetContentId}`,
      willDelete: true,
      details: { fileName: ma.fileName, driveFileId: ma.driveFileId, stage: ma.mediaStage },
    });
  }

  // 6. Scripts & Script Versions
  const allScripts = await scriptsRepository.findAll();
  const targetScripts = allScripts.filter(
    (s) =>
      s.contentId === targetContentId ||
      (s.questionId && questionIds.has(s.questionId)) ||
      (s.videoId && videoIds.has(s.videoId))
  );
  const scriptIds = new Set(targetScripts.map((s) => s.id));
  for (const s of targetScripts) {
    inventory.sheets.push({
      worksheet: 'SCRIPT',
      recordId: s.id,
      relationship: `Script for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allScriptVersions = await scriptVersionsRepository.findAll();
  const targetScriptVersions = allScriptVersions.filter((sv) => scriptIds.has(sv.scriptId));
  for (const sv of targetScriptVersions) {
    inventory.sheets.push({
      worksheet: 'SCRIPT_VERSIONS',
      recordId: sv.id,
      relationship: `Script Version V${sv.versionNumber} for Script ${sv.scriptId}`,
      willDelete: true,
    });
  }

  // 7. Thumbnails & Thumbnail Versions
  const allThumbnails = await thumbnailsRepository.findAll();
  const targetThumbnails = allThumbnails.filter(
    (t) =>
      t.contentId === targetContentId ||
      ((t as any).questionId && questionIds.has((t as any).questionId)) ||
      (t.videoId && videoIds.has(t.videoId))
  );
  const thumbnailIds = new Set(targetThumbnails.map((t) => t.id));
  for (const t of targetThumbnails) {
    inventory.sheets.push({
      worksheet: 'THUMBNAILS',
      recordId: t.id,
      relationship: `Thumbnail for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allThumbnailVersions = await thumbnailVersionsRepository.findAll();
  const targetThumbnailVersions = allThumbnailVersions.filter((tv) => thumbnailIds.has(tv.thumbnailId));
  for (const tv of targetThumbnailVersions) {
    inventory.sheets.push({
      worksheet: 'THUMBNAIL_VERSIONS',
      recordId: tv.id,
      relationship: `Thumbnail Version V${tv.versionNumber} for ${tv.thumbnailId}`,
      willDelete: true,
    });
  }

  // 8. Pinned Comments & Versions & Packages
  const allPinnedComments = await pinnedCommentsRepository.findAll();
  const targetPinned = allPinnedComments.filter(
    (pc) =>
      pc.contentId === targetContentId ||
      ((pc as any).questionId && questionIds.has((pc as any).questionId)) ||
      (pc.videoId && videoIds.has(pc.videoId))
  );
  const pinnedIds = new Set(targetPinned.map((p) => p.id));
  for (const p of targetPinned) {
    inventory.sheets.push({
      worksheet: 'PINNED_COMMENTS',
      recordId: p.id,
      relationship: `Pinned Comment for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allPinnedVersions = await pinnedCommentVersionsRepository.findAll();
  const targetPinnedVersions = allPinnedVersions.filter((pv) => pinnedIds.has(pv.pinnedCommentId));
  for (const pv of targetPinnedVersions) {
    inventory.sheets.push({
      worksheet: 'PINNED_COMMENT_VERSIONS',
      recordId: pv.id,
      relationship: `Pinned Comment Version V${pv.versionNumber} for ${pv.pinnedCommentId}`,
      willDelete: true,
    });
  }

  const allPinnedPackages = await pinnedCommentPackagesRepository.findAll();
  const targetPinnedPackages = allPinnedPackages.filter((pkg) => (pkg as any).contentId === targetContentId);
  for (const pkg of targetPinnedPackages) {
    inventory.sheets.push({
      worksheet: 'PINNED_COMMENT_PACKAGES',
      recordId: pkg.id,
      relationship: `Pinned Comment Package for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 9. Workflow Transitions
  const allWorkflows = await workflowRepository.findAll();
  const targetWorkflows = allWorkflows.filter(
    (w) =>
      videoIds.has(w.entityId) ||
      questionIds.has(w.entityId) ||
      scriptIds.has(w.entityId) ||
      w.entityId === targetContentId
  );
  for (const w of targetWorkflows) {
    inventory.sheets.push({
      worksheet: 'WORKFLOW',
      recordId: w.id,
      relationship: `Workflow history for entity ${w.entityType}:${w.entityId}`,
      willDelete: true,
    });
  }

  // 10. Assignments
  const allAssignments = await assignmentsRepository.findAll();
  const targetAssignments = allAssignments.filter(
    (a) =>
      a.contentId === targetContentId ||
      ((a as any).questionId && questionIds.has((a as any).questionId)) ||
      (a.videoId && videoIds.has(a.videoId))
  );
  for (const a of targetAssignments) {
    inventory.sheets.push({
      worksheet: 'ASSIGNMENTS',
      recordId: a.id,
      relationship: `Assignment for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 11. Publishing
  const allPublishing = await publishingRepository.findAll();
  const targetPublishing = allPublishing.filter(
    (pub) =>
      pub.contentId === targetContentId ||
      (pub.questionId && questionIds.has(pub.questionId)) ||
      (pub.videoId && videoIds.has(pub.videoId))
  );
  for (const pub of targetPublishing) {
    inventory.sheets.push({
      worksheet: 'PUBLISHING',
      recordId: pub.id,
      relationship: `Publishing package for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 12. Social Reviews
  const allSocialReviews = await socialReviewsRepository.findAll();
  const targetSocialReviews = allSocialReviews.filter(
    (sr) => (sr as any).contentId === targetContentId || (sr.questionId && questionIds.has(sr.questionId))
  );
  for (const sr of targetSocialReviews) {
    inventory.sheets.push({
      worksheet: 'SOCIAL_REVIEWS',
      recordId: sr.id,
      relationship: `Social Review for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 13. Question Validations
  const allValidations = await validationsRepository.findAll();
  const targetValidations = allValidations.filter((val) => questionIds.has(val.questionId));
  for (const val of targetValidations) {
    inventory.sheets.push({
      worksheet: 'QUESTION_VALIDATIONS',
      recordId: val.id,
      relationship: `Question Validation for ${val.questionId}`,
      willDelete: true,
    });
  }

  // 14. Refinements
  const allRefinements = await refinementCandidatesRepository.findAll();
  const targetRefinements = allRefinements.filter((ref) => questionIds.has(ref.questionId));
  for (const ref of targetRefinements) {
    inventory.sheets.push({
      worksheet: 'REFINEMENT_CANDIDATES',
      recordId: ref.id,
      relationship: `Refinement Candidate for ${ref.questionId}`,
      willDelete: true,
    });
  }

  // 15. Thumbnail Candidates
  const allThumbCandidates = await thumbnailCandidatesRepository.findAll();
  const targetThumbCandidates = allThumbCandidates.filter((tc) => tc.contentId === targetContentId);
  for (const tc of targetThumbCandidates) {
    inventory.sheets.push({
      worksheet: 'THUMBNAIL_CANDIDATES',
      recordId: tc.id,
      relationship: `Thumbnail Candidate for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 16. Platform Adaptations
  const allAdaptations = await platformAdaptationsRepository.findAll();
  const targetAdaptations = allAdaptations.filter(
    (pa) => (pa as any).contentId === targetContentId || ((pa as any).questionId && questionIds.has((pa as any).questionId))
  );
  for (const pa of targetAdaptations) {
    inventory.sheets.push({
      worksheet: 'PLATFORM_ADAPTATIONS',
      recordId: pa.id,
      relationship: `Platform Adaptation for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 17. Intelligence / Strategy / Comments
  const allIntel = await intelligenceRepository.findAll();
  for (const intel of allIntel.filter((i: any) => i.contentId === targetContentId)) {
    inventory.sheets.push({
      worksheet: 'INTELLIGENCE',
      recordId: intel.id,
      relationship: `Intelligence record for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allStrat = await strategyRecommendationRepository.findAll();
  for (const st of allStrat.filter((s: any) => s.contentId === targetContentId)) {
    inventory.sheets.push({
      worksheet: 'STRATEGY_RECOMMENDATION',
      recordId: st.id,
      relationship: `Strategy Recommendation for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allSocialComments = await socialCommentsRepository.findAll();
  for (const sc of allSocialComments.filter((c) => c.contentId === targetContentId || (c.videoId && videoIds.has(c.videoId)))) {
    inventory.sheets.push({
      worksheet: 'SOCIAL_COMMENTS',
      recordId: sc.id,
      relationship: `Social Comment for ${targetContentId}`,
      willDelete: true,
    });
  }

  const allCommentIntel = await commentIntelligenceRepository.findAll();
  for (const ci of allCommentIntel.filter((c) => c.contentId === targetContentId || (c.videoId && videoIds.has(c.videoId)))) {
    inventory.sheets.push({
      worksheet: 'COMMENT_INTELLIGENCE',
      recordId: ci.id,
      relationship: `Comment Intelligence for ${targetContentId}`,
      willDelete: true,
    });
  }

  // 18. Audit Logs (Immutable audit trail preserved)
  const allAuditLogs = await auditLogRepository.findAll();
  const targetAuditLogs = allAuditLogs.filter(
    (al) =>
      al.entityId === targetContentId ||
      questionIds.has(al.entityId) ||
      videoIds.has(al.entityId) ||
      (al.details && JSON.stringify(al.details).includes(targetContentId))
  );
  for (const al of targetAuditLogs) {
    inventory.immutableAuditLogs.push({
      id: al.id,
      action: al.action,
      entityType: al.entityType,
      entityId: al.entityId,
      timestamp: al.timestamp,
    });
  }

  // 19. Google Drive Assets
  const driveItems = await googleDriveService.listContentFoldersAndFiles(targetContentId);
  for (const d of driveItems) {
    inventory.drive.push({
      driveId: d.id,
      name: d.name,
      type: d.isFolder ? 'folder' : 'file',
      mimeType: d.mimeType,
      path: d.path,
      relationship: `Drive hierarchy under ${targetContentId}`,
      willDelete: true,
    });
  }

  // Also include any driveFileIds found in Media Assets if not already in list
  for (const ma of targetMediaAssets) {
    if (ma.driveFileId && !inventory.drive.some((d) => d.driveId === ma.driveFileId)) {
      inventory.drive.push({
        driveId: ma.driveFileId,
        name: ma.fileName || `asset-${ma.id}`,
        type: 'file',
        mimeType: ma.mimeType,
        path: `(Referenced by MediaAsset ${ma.id})`,
        relationship: `Direct MediaAsset Drive pointer (${ma.mediaStage})`,
        willDelete: true,
      });
    }
  }

  inventory.summary.totalSheetRecordsToDelete = inventory.sheets.length;
  inventory.summary.totalDriveItemsToDelete = inventory.drive.length;
  inventory.summary.totalAuditRecordsPreserved = inventory.immutableAuditLogs.length;

  return inventory;
}

export async function executePurgeContent(targetContentId: string = 'BP-CNT-000001'): Promise<{
  purgedSheets: { worksheet: string; recordId: string; success: boolean }[];
  purgedDrive: { driveId: string; name: string; success: boolean }[];
}> {
  const inventory = await auditContent(targetContentId);
  const purgedSheets: { worksheet: string; recordId: string; success: boolean }[] = [];
  const purgedDrive: { driveId: string; name: string; success: boolean }[] = [];

  const actor = { id: 'SYSTEM-CLEANUP-AGENT', name: 'Safe Content Reset Pipeline' };
  const reason = `Targeted single-content reset for ${targetContentId}`;

  const repoMap: Record<string, any> = {
    SCRIPT_VERSIONS: scriptVersionsRepository,
    THUMBNAIL_VERSIONS: thumbnailVersionsRepository,
    PINNED_COMMENT_VERSIONS: pinnedCommentVersionsRepository,
    PINNED_COMMENT_PACKAGES: pinnedCommentPackagesRepository,
    QUESTION_VALIDATIONS: validationsRepository,
    REFINEMENT_CANDIDATES: refinementCandidatesRepository,
    THUMBNAIL_CANDIDATES: thumbnailCandidatesRepository,
    PLATFORM_ADAPTATIONS: platformAdaptationsRepository,
    INTELLIGENCE: intelligenceRepository,
    STRATEGY_RECOMMENDATION: strategyRecommendationRepository,
    SOCIAL_COMMENTS: socialCommentsRepository,
    COMMENT_INTELLIGENCE: commentIntelligenceRepository,
    SOCIAL_REVIEWS: socialReviewsRepository,
    PUBLISHING: publishingRepository,
    ASSIGNMENTS: assignmentsRepository,
    WORKFLOW: workflowRepository,
    SCRIPT: scriptsRepository,
    THUMBNAILS: thumbnailsRepository,
    PINNED_COMMENTS: pinnedCommentsRepository,
    MEDIA_ASSETS: mediaAssetsRepository,
    QUESTION_VIDEOS: questionVideosRepository,
    VIDEOS: videosRepository,
    QUESTIONS: questionsRepository,
    CONTENT_MASTERS: contentMastersRepository,
  };

  const deletionOrder = [
    'SCRIPT_VERSIONS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENT_VERSIONS',
    'PINNED_COMMENT_PACKAGES',
    'QUESTION_VALIDATIONS',
    'REFINEMENT_CANDIDATES',
    'THUMBNAIL_CANDIDATES',
    'PLATFORM_ADAPTATIONS',
    'INTELLIGENCE',
    'STRATEGY_RECOMMENDATION',
    'SOCIAL_COMMENTS',
    'COMMENT_INTELLIGENCE',
    'SOCIAL_REVIEWS',
    'PUBLISHING',
    'ASSIGNMENTS',
    'WORKFLOW',
    'SCRIPT',
    'THUMBNAILS',
    'PINNED_COMMENTS',
    'MEDIA_ASSETS',
    'QUESTION_VIDEOS',
    'VIDEOS',
    'QUESTIONS',
    'CONTENT_MASTERS',
  ];

  for (const sheetName of deletionOrder) {
    const records = inventory.sheets.filter((s) => s.worksheet === sheetName);
    const repo = repoMap[sheetName];
    if (!repo) continue;

    for (const rec of records) {
      try {
        await repo.deleteRecord(rec.recordId, { actor, reason });
        purgedSheets.push({ worksheet: sheetName, recordId: rec.recordId, success: true });
      } catch (err: any) {
        console.error(`Failed to delete record ${rec.recordId} from ${sheetName}:`, err?.message || err);
        purgedSheets.push({ worksheet: sheetName, recordId: rec.recordId, success: false });
      }
    }
  }

  // Google Drive Deletion: delete files first, then subfolders, then content root folder
  const sortedDrive = [...inventory.drive].sort((a, b) => {
    if (a.type === 'file' && b.type === 'folder') return -1;
    if (a.type === 'folder' && b.type === 'file') return 1;
    return b.path.split('/').length - a.path.split('/').length;
  });

  for (const item of sortedDrive) {
    try {
      await googleDriveService.deleteFile(item.driveId);
      purgedDrive.push({ driveId: item.driveId, name: item.name, success: true });
    } catch (err: any) {
      console.warn(`Drive item ${item.name} (${item.driveId}) deletion result:`, err?.message || err);
      purgedDrive.push({ driveId: item.driveId, name: item.name, success: false });
    }
  }

  return { purgedSheets, purgedDrive };
}

async function main() {
  const isPurge = process.argv.includes('--execute');
  const targetId = 'BP-CNT-000001';

  console.log(`========================================================================`);
  console.log(`BP-CMS — ${isPurge ? 'EXECUTE PURGE' : 'DRY-RUN AUDIT'} FOR ${targetId}`);
  console.log(`========================================================================\n`);

  const inventory = await auditContent(targetId);

  console.log('--- GOOGLE SHEETS INVENTORY ---');
  if (inventory.sheets.length === 0) {
    console.log(`No records found for ${targetId}.`);
  } else {
    for (const item of inventory.sheets) {
      console.log(`[${item.worksheet}] ID: ${item.recordId.padEnd(20)} | ${item.relationship}`);
    }
  }

  console.log('\n--- GOOGLE DRIVE INVENTORY ---');
  if (inventory.drive.length === 0) {
    console.log(`No Drive items found for ${targetId}.`);
  } else {
    for (const item of inventory.drive) {
      console.log(`[${item.type.toUpperCase()}] ${item.path.padEnd(40)} | ID: ${item.driveId}`);
    }
  }

  console.log('\n--- IMMUTABLE AUDIT LOG TRAIL (PRESERVED) ---');
  console.log(`Preserving ${inventory.immutableAuditLogs.length} audit records.`);
  for (const al of inventory.immutableAuditLogs.slice(0, 10)) {
    console.log(`[AUDIT] ${al.timestamp} | ${al.action} on ${al.entityType}:${al.entityId}`);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`Total Sheet records to delete : ${inventory.summary.totalSheetRecordsToDelete}`);
  console.log(`Total Drive items to delete   : ${inventory.summary.totalDriveItemsToDelete}`);
  console.log(`Total Audit logs preserved    : ${inventory.summary.totalAuditRecordsPreserved}`);

  if (isPurge) {
    console.log(`\n>>> EXECUTING SAFE CLEANUP FOR ${targetId} <<<`);
    const result = await executePurgeContent(targetId);
    console.log(`Successfully purged ${result.purgedSheets.filter((s) => s.success).length} / ${result.purgedSheets.length} sheet records.`);
    console.log(`Successfully purged ${result.purgedDrive.filter((d) => d.success).length} / ${result.purgedDrive.length} drive items.`);

    // Post-cleanup verification
    const postAudit = await auditContent(targetId);
    console.log('\n--- POST-CLEANUP VERIFICATION ---');
    console.log(`Remaining Sheet records for ${targetId}: ${postAudit.sheets.length}`);
    console.log(`Remaining Drive items for ${targetId}: ${postAudit.drive.length}`);
    if (postAudit.sheets.length === 0 && postAudit.drive.length === 0) {
      console.log(`\nVERIFICATION PASSED: ${targetId} completely purged! Ready for clean Stage 1 restart.`);
    } else {
      console.error(`\nVERIFICATION WARNING: Some items still remain.`);
    }
  }
}

if (process.argv[1]?.includes('audit-and-clean-bp-cnt-000001')) {
  main().catch((err) => {
    console.error('Audit/Cleanup failed:', err);
    process.exit(1);
  });
}
