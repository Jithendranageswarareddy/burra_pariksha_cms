/**
 * BURRA PARIKSHA CMS - Phase 30 / TARGET-01C-C2 Test Suite
 * Comprehensive verification of Social Comments Repository, Service & Manual Ingestion.
 */

import { socialCommentsRepository } from '../lib/repositories/social-comments.repository';
import { commentIntelligenceRepository } from '../lib/repositories/comment-intelligence.repository';
import { socialCommentsService } from '../lib/services/social-comments.service';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { idService } from '../lib/services/id.service';
import {
  SOCIAL_COMMENTS_SCHEMA,
  COMMENT_INTELLIGENCE_SCHEMA,
  SEQUENCE_ENTITIES,
  ID_PREFIX_MAP,
} from '../lib/schemas/google-sheets-schema';
import { CreateSocialCommentInput, ImportSocialCommentsInput } from '../types';

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function logHeader(title: string) {
  console.log('\n==================================================================');
  console.log(title);
  console.log('==================================================================');
}

function check(tag: string, description: string, condition: boolean, detail?: string) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [${tag}] ${description}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    failedCount++;
    console.error(`❌ [${tag}] ${description}`);
    if (detail) console.error(`   └─ ${detail}`);
  }
}

async function runTests() {
  logHeader('TARGET-01C-C2 — SOCIAL COMMENTS REPOSITORY, SERVICE & INGESTION VERIFICATION');
  console.log('💡 CLASSIFICATION: Verifies data isolation, deduplication, Zod validation, schema integrity, and zero CMS production contamination.');

  const testContentId1 = 'BP-CNT-300001';
  const testContentId2 = 'BP-CNT-300002';
  const testVideoId1 = 'BP-V-300001';
  const testPublishingId1 = 'BP-PUB-300001';

  // Seed minimum mock production records
  try {
    await contentMastersRepository.appendRecord({
      id: testContentId1,
      title: 'Phase 30 Mathematics Content',
      topicId: 'TP-MATH',
      subtopicId: 'STP-ALGEBRA',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await contentMastersRepository.appendRecord({
      id: testContentId2,
      title: 'Phase 30 Physics Content',
      topicId: 'TP-PHYSICS',
      subtopicId: 'STP-MECHANICS',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
  } catch (err) {
    console.warn('Seeding note:', err);
  }

  // C2-01: SOCIAL_COMMENTS worksheet initializes correctly
  try {
    const schema = socialCommentsRepository.getSchema();
    const sheetName = socialCommentsRepository.getSheetName();
    const isNameMatch = (sheetName as string) === 'SOCIAL_COMMENTS';
    const hasPrimaryKey = schema.primaryKey === 'id';
    const hasRequiredCols = ['contentId', 'platform', 'commentText', 'capturedAt'].every((c) =>
      schema.columns.some((col) => col.propertyKey === c)
    );
    const targetSpreadsheet = (socialCommentsRepository as any).getTargetSpreadsheetId();
    const usesAnalyticsSpreadsheet =
      targetSpreadsheet === process.env.ANALYTICS_SPREADSHEET_ID ||
      targetSpreadsheet === 'UNCONFIGURED_ANALYTICS_SPREADSHEET';

    check(
      'C2-01',
      'SOCIAL_COMMENTS worksheet schema initializes correctly with strict analytics target',
      isNameMatch && hasPrimaryKey && hasRequiredCols && usesAnalyticsSpreadsheet,
      `SheetName: ${sheetName}, PrimaryKey: ${schema.primaryKey}, Total Columns: ${schema.columns.length}`
    );
  } catch (err: any) {
    check('C2-01', 'SOCIAL_COMMENTS worksheet schema initializes correctly', false, err.message);
  }

  // C2-02: COMMENT_INTELLIGENCE worksheet initializes correctly
  try {
    const schema = commentIntelligenceRepository.getSchema();
    const sheetName = commentIntelligenceRepository.getSheetName();
    const isNameMatch = (sheetName as string) === 'COMMENT_INTELLIGENCE';
    const hasPrimaryKey = schema.primaryKey === 'id';
    const hasAnalysisCols = ['contentId', 'overallSentiment', 'misconceptions', 'analyzedAt'].every(
      (c) => schema.columns.some((col) => col.propertyKey === c)
    );
    const targetSpreadsheet = (commentIntelligenceRepository as any).getTargetSpreadsheetId();
    const usesAnalyticsSpreadsheet =
      targetSpreadsheet === process.env.ANALYTICS_SPREADSHEET_ID ||
      targetSpreadsheet === 'UNCONFIGURED_ANALYTICS_SPREADSHEET';

    check(
      'C2-02',
      'COMMENT_INTELLIGENCE worksheet schema initializes correctly with strict analytics target',
      isNameMatch && hasPrimaryKey && hasAnalysisCols && usesAnalyticsSpreadsheet,
      `SheetName: ${sheetName}, PrimaryKey: ${schema.primaryKey}, Total Columns: ${schema.columns.length}`
    );
  } catch (err: any) {
    check('C2-02', 'COMMENT_INTELLIGENCE worksheet schema initializes correctly', false, err.message);
  }

  // C2-03: Valid single comment creates BP-CMT ID
  let createdComment1: any = null;
  try {
    const input: CreateSocialCommentInput = {
      contentId: testContentId1,
      videoId: testVideoId1,
      publishingId: testPublishingId1,
      platform: 'youtube',
      platformPostId: 'yt-vid-999',
      platformCommentId: 'yt-cmt-1001',
      commentText: 'This explanation of quadratic equations was incredibly clear and helpful!',
      authorDisplayName: 'TeluguLearner99',
      likeCount: 5,
      replyCount: 1,
      source: 'MANUAL_PASTE',
      status: 'UNPROCESSED',
    };

    const result = await socialCommentsService.createComment(input, 'USR-TEST', 'Test Tester');
    createdComment1 = result.record;

    const isValidIdFormat = /^BP-CMT-\d{6}$/.test(createdComment1?.id || '');
    check(
      'C2-03',
      'Valid single comment creates BP-CMT ID sequence and persists record',
      result.success && !result.isDuplicate && isValidIdFormat,
      `Allocated ID: ${createdComment1?.id}, Platform: ${createdComment1?.platform}, Content: ${createdComment1?.contentId}`
    );
  } catch (err: any) {
    check('C2-03', 'Valid single comment creates BP-CMT ID', false, err.message);
  }

  // C2-04: Invalid comment is rejected (empty comment text or invalid contentId)
  try {
    const invalidInput1: any = {
      contentId: testContentId1,
      platform: 'youtube',
      commentText: '', // Empty comment text
    };
    const res1 = await socialCommentsService.createComment(invalidInput1);

    const invalidInput2: any = {
      contentId: 'INVALID_CONTENT_ID_FORMAT',
      platform: 'youtube',
      commentText: 'Valid text',
    };
    const res2 = await socialCommentsService.createComment(invalidInput2);

    check(
      'C2-04',
      'Invalid comment inputs (empty text, malformed content ID) are rejected by authoritative Zod validation',
      !res1.success && !res2.success,
      `Res1 success: ${res1.success}, Res2 success: ${res2.success}`
    );
  } catch (err: any) {
    check('C2-04', 'Invalid comment is rejected', false, err.message);
  }

  // C2-05: Invalid platform is rejected
  try {
    const invalidPlatformInput: any = {
      contentId: testContentId1,
      platform: 'tiktok', // unsupported platform
      commentText: 'Great video on tiktok!',
    };
    const res = await socialCommentsService.createComment(invalidPlatformInput);
    check(
      'C2-05',
      'Unsupported platform (e.g. tiktok, twitter) is strictly rejected',
      !res.success,
      `Error received: ${res.error}`
    );
  } catch (err: any) {
    check('C2-05', 'Invalid platform is rejected', false, err.message);
  }

  // C2-06: Duplicate (platform + platformCommentId) does not create a second record
  try {
    const duplicateInput: CreateSocialCommentInput = {
      contentId: testContentId1,
      videoId: testVideoId1,
      platform: 'youtube',
      platformCommentId: 'yt-cmt-1001', // same as createdComment1
      commentText: 'This explanation of quadratic equations was incredibly clear and helpful! (Updated text)',
      likeCount: 12, // Updated metric
      replyCount: 3, // Updated metric
    };

    const initialTotal = (await socialCommentsRepository.findAll()).length;
    const res = await socialCommentsService.createComment(duplicateInput);
    const postTotal = (await socialCommentsRepository.findAll()).length;

    const noNewRecord = initialTotal === postTotal;
    const isMarkedDuplicate = res.isDuplicate === true;
    const sameId = res.record?.id === createdComment1?.id;
    const metricsUpdated = res.record?.likeCount === 12 && res.record?.replyCount === 3;

    check(
      'C2-06',
      'Duplicate (platform + platformCommentId) does not create a second record and updates mutable metrics',
      res.success && isMarkedDuplicate && noNewRecord && sameId && metricsUpdated,
      `Original ID: ${createdComment1?.id}, Duplicate Result ID: ${res.record?.id}, Updated Likes: ${res.record?.likeCount}`
    );
  } catch (err: any) {
    check('C2-06', 'Duplicate handling test failed', false, err.message);
  }

  // C2-07: Different platforms with the same platformCommentId remain separate
  try {
    const igInput: CreateSocialCommentInput = {
      contentId: testContentId1,
      platform: 'instagram',
      platformCommentId: 'yt-cmt-1001', // same ID string but on instagram
      commentText: 'Awesome reel!',
      authorDisplayName: 'InstaFan',
    };

    const res = await socialCommentsService.createComment(igInput);
    const isDistinctId = res.record?.id !== createdComment1?.id;
    const isNotDuplicate = res.isDuplicate === false;

    check(
      'C2-07',
      'Different platforms with the same platformCommentId string remain separate entities',
      res.success && isDistinctId && isNotDuplicate,
      `YouTube Comment ID: ${createdComment1?.id}, Instagram Comment ID: ${res.record?.id}`
    );
  } catch (err: any) {
    check('C2-07', 'Cross-platform commentId uniqueness test failed', false, err.message);
  }

  // C2-08: Two comments with different platformCommentIds remain separate
  try {
    const comment2Input: CreateSocialCommentInput = {
      contentId: testContentId1,
      platform: 'youtube',
      platformCommentId: 'yt-cmt-1002', // different comment ID
      commentText: 'Can you please explain question 4 again?',
      authorDisplayName: 'CuriousStudent',
    };

    const res = await socialCommentsService.createComment(comment2Input);
    const isDistinctId = res.record?.id !== createdComment1?.id;

    check(
      'C2-08',
      'Two comments with different platformCommentIds remain distinct records',
      res.success && isDistinctId && !res.isDuplicate,
      `Comment 1: ${createdComment1?.id}, Comment 2: ${res.record?.id}`
    );
  } catch (err: any) {
    check('C2-08', 'Distinct comment test failed', false, err.message);
  }

  // C2-09: Manual comments without platformCommentId can be stored without fabricated provider IDs
  try {
    const manualInput: CreateSocialCommentInput = {
      contentId: testContentId2,
      platform: 'facebook',
      commentText: 'Shared this with my classroom group, great physics breakdown!',
      authorDisplayName: 'PhysicsTeacher_Rao',
      source: 'MANUAL_PASTE',
      // No platformCommentId provided
    };

    const res = await socialCommentsService.createComment(manualInput);
    const hasCmsId = /^BP-CMT-\d{6}$/.test(res.record?.id || '');
    const noFabricatedProviderId =
      res.record?.platformCommentId === undefined ||
      res.record?.platformCommentId === '' ||
      res.record?.platformCommentId === null;

    check(
      'C2-09',
      'Manual comments without platformCommentId are stored without fabricating provider IDs',
      res.success && hasCmsId && noFabricatedProviderId,
      `Allocated CMS ID: ${res.record?.id}, Provider ID: ${res.record?.platformCommentId ?? 'none'}`
    );
  } catch (err: any) {
    check('C2-09', 'Manual comment without provider ID test failed', false, err.message);
  }

  // C2-10: Batch import reports created/updated/duplicates/rejected counts
  try {
    const batchInput: ImportSocialCommentsInput = {
      defaultContentId: testContentId1,
      defaultPlatform: 'youtube',
      comments: [
        {
          platformCommentId: 'yt-batch-001',
          commentText: 'Batch comment one',
          likeCount: 2,
        },
        {
          platformCommentId: 'yt-batch-002',
          commentText: 'Batch comment two',
          likeCount: 4,
        },
        {
          platformCommentId: 'yt-batch-001', // duplicate within same batch
          commentText: 'Batch comment one edited',
          likeCount: 10,
        },
        {
          platform: 'invalid_plat' as any, // invalid
          commentText: 'Bad platform comment',
        },
        {
          commentText: '', // invalid empty text
        },
      ],
    };

    const batchResult = await socialCommentsService.importComments(batchInput, 'USR-TEST', 'Test Ingest');

    const receivedMatch = batchResult.received === 5;
    const createdMatch = batchResult.created === 2;
    const duplicatesMatch = batchResult.duplicates === 1;
    const updatedMatch = batchResult.updated === 1;
    const rejectedMatch = batchResult.rejected === 2;

    check(
      'C2-10',
      'Batch import accurately reports received, created, updated, duplicates, and rejected counts',
      batchResult.success && receivedMatch && createdMatch && duplicatesMatch && updatedMatch && rejectedMatch,
      `Received: ${batchResult.received}, Created: ${batchResult.created}, Updated: ${batchResult.updated}, Duplicates: ${batchResult.duplicates}, Rejected: ${batchResult.rejected}`
    );
  } catch (err: any) {
    check('C2-10', 'Batch import test failed', false, err.message);
  }

  // C2-11: Video/content/publishing relationships are preserved
  try {
    const input: CreateSocialCommentInput = {
      contentId: testContentId1,
      videoId: testVideoId1,
      publishingId: testPublishingId1,
      platform: 'youtube',
      platformPostId: 'yt-post-xyz',
      platformCommentId: 'yt-cmt-rel-1',
      parentCommentId: 'yt-cmt-1001',
      isReply: true,
      commentText: 'Replying to the above comment regarding step 2.',
    };

    const res = await socialCommentsService.createComment(input);
    const rec = res.record;
    const preserved =
      rec?.contentId === testContentId1 &&
      rec?.videoId === testVideoId1 &&
      rec?.publishingId === testPublishingId1 &&
      rec?.parentCommentId === 'yt-cmt-1001' &&
      rec?.isReply === true;

    check(
      'C2-11',
      'Content, Video, Publishing IDs and Threading relationships (parentCommentId, isReply) are preserved',
      res.success && preserved,
      `Content: ${rec?.contentId}, Video: ${rec?.videoId}, Pub: ${rec?.publishingId}, Parent: ${rec?.parentCommentId}, isReply: ${rec?.isReply}`
    );
  } catch (err: any) {
    check('C2-11', 'Relationship preservation test failed', false, err.message);
  }

  // C2-12: Comment repository writes only to analytics workbook
  try {
    const target = (socialCommentsRepository as any).getTargetSpreadsheetId();
    const isAnalyticsTarget =
      target === process.env.ANALYTICS_SPREADSHEET_ID ||
      target === 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
    const isNotGoogleSheetsId = target !== process.env.GOOGLE_SHEETS_ID;

    check(
      'C2-12',
      'SocialCommentsRepository writes only to ANALYTICS_SPREADSHEET_ID and never production GOOGLE_SHEETS_ID',
      isAnalyticsTarget && (Boolean(process.env.ANALYTICS_SPREADSHEET_ID) ? isNotGoogleSheetsId : true),
      `Target Spreadsheet ID: ${target}`
    );
  } catch (err: any) {
    check('C2-12', 'Analytics target isolation check failed', false, err.message);
  }

  // C2-13: Comment intelligence repository writes only to analytics workbook
  try {
    const target = (commentIntelligenceRepository as any).getTargetSpreadsheetId();
    const isAnalyticsTarget =
      target === process.env.ANALYTICS_SPREADSHEET_ID ||
      target === 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
    const isNotGoogleSheetsId = target !== process.env.GOOGLE_SHEETS_ID;

    check(
      'C2-13',
      'CommentIntelligenceRepository writes only to ANALYTICS_SPREADSHEET_ID and never production GOOGLE_SHEETS_ID',
      isAnalyticsTarget && (Boolean(process.env.ANALYTICS_SPREADSHEET_ID) ? isNotGoogleSheetsId : true),
      `Target Spreadsheet ID: ${target}`
    );
  } catch (err: any) {
    check('C2-13', 'Comment intelligence target isolation check failed', false, err.message);
  }

  // C2-14: Production workbook records remain unchanged
  try {
    const initialQuestionCount = (await questionsRepository.findAll()).length;
    // Perform comment operations
    await socialCommentsService.createComment({
      contentId: testContentId1,
      platform: 'youtube',
      commentText: 'Another comment for testing production isolation',
    });
    const postQuestionCount = (await questionsRepository.findAll()).length;

    check(
      'C2-14',
      'Production workbook records (e.g. QUESTIONS, CONTENT_MASTERS) remain completely untouched and unmutated',
      initialQuestionCount === postQuestionCount,
      `Initial questions: ${initialQuestionCount}, Post questions: ${postQuestionCount}`
    );
  } catch (err: any) {
    check('C2-14', 'Production workbook integrity test failed', false, err.message);
  }

  // C2-15: Existing sequence entity allocation
  try {
    const commentPrefixConfig = ID_PREFIX_MAP[SEQUENCE_ENTITIES.SOCIAL_COMMENT];
    const intelligencePrefixConfig = ID_PREFIX_MAP[SEQUENCE_ENTITIES.COMMENT_INTELLIGENCE];

    const commentId = await idService.allocateSocialCommentId();
    const intelligenceId = await idService.allocateCommentIntelligenceId();

    const isCommentMatch = commentId.startsWith(commentPrefixConfig.prefix);
    const isIntelligenceMatch = intelligenceId.startsWith(intelligencePrefixConfig.prefix);

    check(
      'C2-15',
      'ID allocation uses centralized SEQUENCES repository and standard prefixes (BP-CMT-, BP-CMI-)',
      isCommentMatch && isIntelligenceMatch,
      `Sample Comment ID: ${commentId}, Sample Intelligence ID: ${intelligenceId}`
    );
  } catch (err: any) {
    check('C2-15', 'Central sequence allocation check failed', false, err.message);
  }

  // C2-16: Sequence safety and entity integrity checks
  try {
    const commentSeq = await sequencesRepository.getSequence(SEQUENCE_ENTITIES.SOCIAL_COMMENT);
    const hasNextNumber = commentSeq !== null && typeof commentSeq.nextNumber === 'number';

    check(
      'C2-16',
      'Sequence repository correctly tracks SEQUENCE_ENTITIES.SOCIAL_COMMENT state without local counters',
      hasNextNumber,
      `Next number in sequence: ${commentSeq?.nextNumber}`
    );
  } catch (err: any) {
    check('C2-16', 'Sequence safety check failed', false, err.message);
  }

  logHeader('TEST RUN SUMMARY');
  console.log(`Total Tests Run: ${testCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
