import { googleSheetsClient } from '../lib/google-sheets/client';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { scriptVersionsRepository } from '../lib/repositories/script-versions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { thumbnailVersionsRepository } from '../lib/repositories/thumbnail-versions.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { pinnedCommentVersionsRepository } from '../lib/repositories/pinned-comment-versions.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { categoriesRepository } from '../lib/repositories/categories.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { questionConfigRepository } from '../lib/repositories/question-config.repository';
import { contentPlansRepository } from '../lib/repositories/content-plans.repository';
import { contentBatchesRepository } from '../lib/repositories/content-batches.repository';
import { SequencesRepository } from '../lib/repositories/sequences.repository';

interface CleanupResult {
  sheetName: string;
  cleared: boolean;
  deletedCount?: number;
  preservedCount: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('====================================================');
  console.log('   BURRA PARIKSHA CMS - ULTRA-FAST CLEANUP ENGINE   ');
  console.log('====================================================');

  // Capture sequences BEFORE
  console.log('\n--- CAPTURING SEQUENCE STATUS (BEFORE) ---');
  const seqRepo = SequencesRepository.getInstance();
  const seqsBefore = await seqRepo.findAll();
  seqsBefore.forEach(s => {
    console.log(`  Sequence: ${s.entityType} | NextNumber: ${s.nextNumber}`);
  });

  const results: CleanupResult[] = [];

  // 1. Bulk Clear entirely synthetic sheets
  const syntheticSheets = [
    { name: 'CONTENT_MASTERS', repo: contentMastersRepository },
    { name: 'QUESTIONS', repo: questionsRepository },
    { name: 'VIDEOS', repo: videosRepository },
    { name: 'SCRIPT', repo: scriptsRepository },
    { name: 'SCRIPT_VERSIONS', repo: scriptVersionsRepository },
    { name: 'THUMBNAILS', repo: thumbnailsRepository },
    { name: 'THUMBNAIL_VERSIONS', repo: thumbnailVersionsRepository },
    { name: 'PINNED_COMMENTS', repo: pinnedCommentsRepository },
    { name: 'PINNED_COMMENT_VERSIONS', repo: pinnedCommentVersionsRepository },
    { name: 'SOCIAL_REVIEWS', repo: socialReviewsRepository },
    { name: 'PUBLISHING', repo: publishingRepository },
    { name: 'ASSIGNMENTS', repo: assignmentsRepository },
    { name: 'WORKFLOW', repo: workflowRepository },
    { name: 'MEDIA_ASSETS', repo: mediaAssetsRepository },
    { name: 'QUESTION_VALIDATIONS', repo: validationsRepository },
    { name: 'CONTENT_PLANS', repo: contentPlansRepository },
    { name: 'CONTENT_BATCHES', repo: contentBatchesRepository }
  ];

  console.log('\n--- EXECUTING INSTANT TRUNCATION ON SYNTHETIC SHEETS ---');
  for (const sheet of syntheticSheets) {
    try {
      console.log(`  Clearing data rows for ${sheet.name}...`);
      await googleSheetsClient.clearDataRows(sheet.name);
      console.log(`  ✓ ${sheet.name} cleared successfully.`);
      results.push({ sheetName: sheet.name, cleared: true, preservedCount: 0 });
      await delay(500); // 500ms delay to respect Google Sheets API quotas
    } catch (err: any) {
      console.error(`  ✕ Error clearing ${sheet.name}:`, err.message);
      results.push({ sheetName: sheet.name, cleared: false, preservedCount: 0 });
    }
  }

  // 2. USERS (Preserve USR-001 and USR-002, delete other Ramesh and test accounts)
  try {
    console.log('\n--- SANITIZING USERS TABLE ---');
    const records = await usersRepository.findAll();
    const toPreserve = records.filter(r => r.id === 'USR-001' || r.id === 'USR-002');
    console.log(`  Found ${records.length} users. Preserving ${toPreserve.length} users:`, toPreserve.map(u => `${u.id} (${u.name})`));
    
    console.log('  Clearing USERS table data...');
    await googleSheetsClient.clearDataRows('USERS');
    
    if (toPreserve.length > 0) {
      console.log('  Restoring preserved users...');
      for (const u of toPreserve) {
        // Remove spreadsheet row index or properties that might interfere with a clean write
        const cleanUser = { ...u };
        delete (cleanUser as any).rowNumber;
        await usersRepository.create(cleanUser);
        console.log(`  ✓ Restored user: ${cleanUser.id}`);
        await delay(500);
      }
    }
    results.push({
      sheetName: 'USERS',
      cleared: true,
      deletedCount: records.length - toPreserve.length,
      preservedCount: toPreserve.length
    });
  } catch (err: any) {
    console.error('  ✕ Error sanitizing USERS:', err.message);
    results.push({ sheetName: 'USERS', cleared: false, preservedCount: 0 });
  }

  // 3. CATEGORIES (Preserve CAT-QA, CAT-LR, CAT-DI, CAT-VA, delete synthetic ones)
  try {
    console.log('\n--- SANITIZING CATEGORIES TABLE ---');
    const records = await categoriesRepository.findAll();
    const legitCategories = ['CAT-QA', 'CAT-LR', 'CAT-DI', 'CAT-VA'];
    const toPreserve = records.filter(r => r.id && legitCategories.includes(r.id));
    console.log(`  Found ${records.length} categories. Preserving ${toPreserve.length}:`, toPreserve.map(c => c.id));
    
    console.log('  Clearing CATEGORIES table data...');
    await googleSheetsClient.clearDataRows('CATEGORIES');
    
    if (toPreserve.length > 0) {
      console.log('  Restoring legitimate categories...');
      for (const c of toPreserve) {
        const cleanCat = { ...c };
        delete (cleanCat as any).rowNumber;
        await categoriesRepository.create(cleanCat);
        console.log(`  ✓ Restored category: ${cleanCat.id}`);
        await delay(500);
      }
    }
    results.push({
      sheetName: 'CATEGORIES',
      cleared: true,
      deletedCount: records.length - toPreserve.length,
      preservedCount: toPreserve.length
    });
  } catch (err: any) {
    console.error('  ✕ Error sanitizing CATEGORIES:', err.message);
    results.push({ sheetName: 'CATEGORIES', cleared: false, preservedCount: 0 });
  }

  // 4. Verify legitimate math topics, subtopics, and layout configs are preserved
  console.log('\n--- VERIFYING KNOWLEDGE BASE PRESERVATION ---');
  try {
    const topics = await topicsRepository.findAll();
    console.log(`  ✓ TOPICS preserved intact. Count: ${topics.length}`);
    results.push({ sheetName: 'TOPICS', cleared: false, preservedCount: topics.length });
  } catch (err: any) {
    console.error('  ✕ Error verifying TOPICS:', err.message);
  }

  try {
    const subtopics = await subtopicsRepository.findAll();
    console.log(`  ✓ SUBTOPICS preserved intact. Count: ${subtopics.length}`);
    results.push({ sheetName: 'SUBTOPICS', cleared: false, preservedCount: subtopics.length });
  } catch (err: any) {
    console.error('  ✕ Error verifying SUBTOPICS:', err.message);
  }

  try {
    const configs = await questionConfigRepository.findAll();
    console.log(`  ✓ QUESTION_CONFIG preserved intact. Count: ${configs.length}`);
    results.push({ sheetName: 'QUESTION_CONFIG', cleared: false, preservedCount: configs.length });
  } catch (err: any) {
    console.error('  ✕ Error verifying QUESTION_CONFIG:', err.message);
  }

  // Capture sequences AFTER
  console.log('\n--- CAPTURING SEQUENCE STATUS (AFTER) ---');
  const seqsAfter = await seqRepo.findAll();
  seqsAfter.forEach(s => {
    const prev = seqsBefore.find(b => b.entityType === s.entityType);
    console.log(`  Sequence: ${s.entityType} | NextNumber: ${s.nextNumber} (Before: ${prev?.nextNumber})`);
  });

  console.log('\n====================================================');
  console.log('            CLEANUP EXECUTION REPORT                ');
  console.log('====================================================');
  results.forEach(res => {
    console.log(`Tab: ${res.sheetName.padEnd(25)} | Cleared/Sanitized: ${res.cleared ? 'YES' : 'NO '} | Preserved: ${res.preservedCount}`);
  });
  console.log('====================================================');
}

main().catch(console.error);
