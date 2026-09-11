/**
 * BURRA PARIKSHA CMS - Phase 16.4 Hardened Verification Suite
 * Content Master Data Integrity, Relational Health & Operational Observability
 * 
 * Strict behavioral execution against isolated malformed fixtures and live read-only verification.
 */

import { dataIntegrityService } from '../lib/services/data-integrity.service';
import { dashboardService } from '../lib/services/dashboard.service';
import { contentMasterService } from '../lib/services/content-master.service';
import {
  assignmentsRepository,
  categoriesRepository,
  contentMastersRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  publishingRepository,
  questionsRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  sequencesRepository,
  subtopicsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  topicsRepository,
  usersRepository,
  videosRepository,
  workflowRepository,
} from '../lib/repositories';
import {
  Category,
  ContentMaster,
  ContentMasterStatus,
  DifficultyLevel,
  IntegrityIssue,
  PinnedComment,
  PinnedCommentVersion,
  PriorityLevel,
  Publishing,
  Question,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  QuestionVideo,
  Script,
  ScriptVersion,
  SocialPublishStatus,
  Subtopic,
  Thumbnail,
  ThumbnailVersion,
  Topic,
  User,
  UserRole,
  Video,
  VideoProductionStatus,
  Workflow,
} from '../types';
import { SEQUENCE_ENTITIES, SHEET_TABS } from '../lib/schemas/google-sheets-schema';
import { SequenceRecord } from '../lib/repositories/sequences.repository';

// Base valid fixtures for isolated behavioral tests
const validUser: User = {
  id: 'USR-000001',
  name: 'Admin User',
  email: 'admin@burrapariksha.com',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validCategory: Category = {
  id: 'BP-CAT-000001',
  name: 'Quantitative Aptitude',
  slug: 'quantitative-aptitude',
  createdAt: new Date().toISOString(),
};

const validTopic: Topic = {
  id: 'BP-TOP-000001',
  categoryId: 'BP-CAT-000001',
  name: 'Percentages',
  slug: 'percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const validSubtopic: Subtopic = {
  id: 'BP-SUB-000001',
  topicId: 'BP-TOP-000001',
  name: 'Basic Percentages',
  slug: 'basic-percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const validQuestion: Question = {
  id: 'BP-Q-000001',
  questionText: 'What is 20% of 150?',
  options: {
    a: '20',
    b: '30',
    c: '40',
    d: '50',
  },
  correctAnswer: 'B',
  explanation: '150 * 0.20 = 30',
  categoryId: 'BP-CAT-000001',
  categoryName: 'Quantitative Aptitude',
  topicId: 'BP-TOP-000001',
  topicName: 'Percentages',
  subtopicId: 'BP-SUB-000001',
  subtopicName: 'Basic Percentages',
  difficulty: DifficultyLevel.EASY,
  status: QuestionStatus.APPROVED,
  videoStatus: VideoProductionStatus.NOT_STARTED,
  language: QuestionLanguage.TELUGU,
  questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
  contentMasterId: 'BP-MST-000001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validMaster: ContentMaster = {
  id: 'BP-MST-000001',
  title: 'Percentage Concepts Vol 1',
  status: ContentMasterStatus.ACTIVE,
  primaryQuestionId: 'BP-Q-000001',
  categoryId: 'BP-CAT-000001',
  topicId: 'BP-TOP-000001',
  subtopicId: 'BP-SUB-000001',
  createdBy: 'USR-000001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validVideo: Video = {
  id: 'BP-V-000001',
  title: 'Percentage Concepts Video',
  questionId: 'BP-Q-000001',
  contentMasterId: 'BP-MST-000001',
  status: VideoProductionStatus.READY_TO_UPLOAD,
  priority: PriorityLevel.NORMAL,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validSequence: SequenceRecord = {
  entityType: SEQUENCE_ENTITIES.CONTENT_MASTER,
  nextNumber: 2,
  prefix: 'BP-MST-',
  padLength: 6,
  updatedAt: new Date().toISOString(),
};

const validQuestionSequence: SequenceRecord = {
  entityType: SEQUENCE_ENTITIES.QUESTION,
  nextNumber: 2,
  prefix: 'BP-Q-',
  padLength: 6,
  updatedAt: new Date().toISOString(),
};

const validVideoSequence: SequenceRecord = {
  entityType: SEQUENCE_ENTITIES.VIDEO,
  nextNumber: 2,
  prefix: 'BP-V-',
  padLength: 6,
  updatedAt: new Date().toISOString(),
};

interface FixtureOverrides {
  contentMasters?: ContentMaster[];
  questions?: Question[];
  videos?: Video[];
  sequences?: SequenceRecord[];
  assignments?: any[];
  publishing?: Publishing[];
  categories?: Category[];
  topics?: Topic[];
  subtopics?: Subtopic[];
  users?: User[];
}

/**
 * Executes DataIntegrityService.runFullIntegrityCheck() with isolated in-memory fixture overrides.
 * Guarantees zero mutation to live Google Sheets and restores repositories cleanly.
 */
async function runWithFixtures(overrides: FixtureOverrides): Promise<IntegrityIssue[]> {
  const origContentMasters = contentMastersRepository.findAll;
  const origQuestions = questionsRepository.findAll;
  const origVideos = videosRepository.findAll;
  const origSequences = sequencesRepository.findAll;
  const origAssignments = assignmentsRepository.findAll;
  const origPublishing = publishingRepository.findAll;
  const origCategories = categoriesRepository.findAll;
  const origTopics = topicsRepository.findAll;
  const origSubtopics = subtopicsRepository.findAll;
  const origUsers = usersRepository.findAll;

  try {
    contentMastersRepository.findAll = async () => overrides.contentMasters ?? [validMaster];
    questionsRepository.findAll = async () => overrides.questions ?? [validQuestion];
    videosRepository.findAll = async () => overrides.videos ?? [validVideo];
    sequencesRepository.findAll = async () => overrides.sequences ?? [validSequence, validQuestionSequence, validVideoSequence];
    assignmentsRepository.findAll = async () => overrides.assignments ?? [];
    publishingRepository.findAll = async () => overrides.publishing ?? [];
    categoriesRepository.findAll = async () => overrides.categories ?? [validCategory];
    topicsRepository.findAll = async () => overrides.topics ?? [validTopic];
    subtopicsRepository.findAll = async () => overrides.subtopics ?? [validSubtopic];
    usersRepository.findAll = async () => overrides.users ?? [validUser];

    const report = await dataIntegrityService.runFullIntegrityCheck();
    return report.issues;
  } finally {
    contentMastersRepository.findAll = origContentMasters;
    questionsRepository.findAll = origQuestions;
    videosRepository.findAll = origVideos;
    sequencesRepository.findAll = origSequences;
    assignmentsRepository.findAll = origAssignments;
    publishingRepository.findAll = origPublishing;
    categoriesRepository.findAll = origCategories;
    topicsRepository.findAll = origTopics;
    subtopicsRepository.findAll = origSubtopics;
    usersRepository.findAll = origUsers;
  }
}

export async function runPhase16Step4Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }>;
}> {
  const results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }> = [];

  const addResult = (check: string, passed: boolean, details?: string) => {
    results.push({
      check,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
  };

  // =========================================================================
  // BEHAVIORAL FIXTURE TESTS (1-17)
  // =========================================================================

  // 1. Invalid Content Master ID prefix
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, id: 'INVALID-PREFIX-001' }],
    });
    const issue = issues.find(
      (i) => i.category === 'ID_INTEGRITY' && i.worksheet === SHEET_TABS.CONTENT_MASTERS && i.message.includes('BP-MST-')
    );
    addResult(
      '1. Invalid Content Master ID prefix triggers ID_INTEGRITY warning',
      !!issue && issue.severity === 'WARNING',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('1. Invalid Content Master ID prefix triggers ID_INTEGRITY warning', false, err?.message);
  }

  // 2. Duplicate Content Master ID
  try {
    const issues = await runWithFixtures({
      contentMasters: [validMaster, { ...validMaster, title: 'Duplicate Master Record' }],
    });
    const issue = issues.find(
      (i) => i.category === 'ID_INTEGRITY' && i.worksheet === SHEET_TABS.CONTENT_MASTERS && i.message.includes('Duplicate primary ID')
    );
    addResult(
      '2. Duplicate Content Master ID triggers ID_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('2. Duplicate Content Master ID triggers ID_INTEGRITY error', false, err?.message);
  }

  // 3. Invalid Content Master status
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, status: 'INVALID_LIFECYCLE_STATUS' as any }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'status' && i.severity === 'CRITICAL'
    );
    addResult(
      '3. Invalid Content Master status triggers CRITICAL canonical enum violation',
      !!issue,
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('3. Invalid Content Master status triggers CRITICAL canonical enum violation', false, err?.message);
  }

  // 4. Broken primary_question_id when populated
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, primaryQuestionId: 'BP-Q-999999' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'primaryQuestionId' && i.message.includes('BP-Q-999999')
    );
    addResult(
      '4. Broken primary_question_id triggers CONTENT_MASTER_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('4. Broken primary_question_id triggers CONTENT_MASTER_INTEGRITY error', false, err?.message);
  }

  // 5. Broken category_id when populated
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, categoryId: 'BP-CAT-999999', topicId: undefined, subtopicId: undefined }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'categoryId' && i.message.includes('BP-CAT-999999')
    );
    addResult(
      '5. Broken category_id triggers CONTENT_MASTER_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('5. Broken category_id triggers CONTENT_MASTER_INTEGRITY error', false, err?.message);
  }

  // 6. Broken topic_id when populated
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, topicId: 'BP-TOP-999999', subtopicId: undefined }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'topicId' && i.message.includes('BP-TOP-999999')
    );
    addResult(
      '6. Broken topic_id triggers CONTENT_MASTER_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('6. Broken topic_id triggers CONTENT_MASTER_INTEGRITY error', false, err?.message);
  }

  // 7. Broken subtopic_id when populated
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, subtopicId: 'BP-SUB-999999' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'subtopicId' && i.message.includes('BP-SUB-999999')
    );
    addResult(
      '7. Broken subtopic_id triggers CONTENT_MASTER_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('7. Broken subtopic_id triggers CONTENT_MASTER_INTEGRITY error', false, err?.message);
  }

  // 8. Broken created_by when applicable
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, createdBy: 'USR-999999' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'createdBy' && i.message.includes('USR-999999')
    );
    addResult(
      '8. Broken created_by triggers CONTENT_MASTER_INTEGRITY warning',
      !!issue && issue.severity === 'WARNING',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('8. Broken created_by triggers CONTENT_MASTER_INTEGRITY warning', false, err?.message);
  }

  // 9. Orphaned Question.contentMasterId
  try {
    const issues = await runWithFixtures({
      contentMasters: [],
      questions: [{ ...validQuestion, contentMasterId: 'BP-MST-999999' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.worksheet === SHEET_TABS.QUESTIONS && i.message.includes('BP-MST-999999')
    );
    addResult(
      '9. Orphaned Question.contentMasterId triggers error on QUESTIONS sheet',
      !!issue && issue.severity === 'ERROR',
      issue ? `Worksheet: ${issue.worksheet}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('9. Orphaned Question.contentMasterId triggers error on QUESTIONS sheet', false, err?.message);
  }

  // 10. Orphaned Video.contentMasterId
  try {
    const issues = await runWithFixtures({
      contentMasters: [],
      videos: [{ ...validVideo, contentMasterId: 'BP-MST-999999' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.worksheet === SHEET_TABS.VIDEOS && i.message.includes('BP-MST-999999')
    );
    addResult(
      '10. Orphaned Video.contentMasterId triggers error on VIDEOS sheet',
      !!issue && issue.severity === 'ERROR',
      issue ? `Worksheet: ${issue.worksheet}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('10. Orphaned Video.contentMasterId triggers error on VIDEOS sheet', false, err?.message);
  }

  // 11. Conditional two-way Question <-> Content Master mismatch
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, id: 'BP-MST-000001', primaryQuestionId: 'BP-Q-000001' }],
      questions: [{ ...validQuestion, id: 'BP-Q-000001', contentMasterId: 'BP-MST-000002' }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.message.includes('Two-way referential mismatch')
    );
    addResult(
      '11. Conditional two-way Question <-> Content Master mismatch triggers error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('11. Conditional two-way Question <-> Content Master mismatch triggers error', false, err?.message);
  }

  // 12. ARCHIVED master with active-production video
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, status: ContentMasterStatus.ARCHIVED, archivedAt: new Date().toISOString() }],
      videos: [{ ...validVideo, contentMasterId: 'BP-MST-000001', status: VideoProductionStatus.RECORDING }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.message.includes('actively in production')
    );
    addResult(
      '12. ARCHIVED master with active production video triggers ERROR',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('12. ARCHIVED master with active production video triggers ERROR', false, err?.message);
  }

  // 13. ARCHIVED master with active assignment
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, status: ContentMasterStatus.ARCHIVED, archivedAt: new Date().toISOString() }],
      assignments: [
        {
          id: 'ASG-000001',
          entityType: 'CONTENT_MASTER',
          entityId: 'BP-MST-000001',
          status: 'IN_PROGRESS',
          taskType: 'REVIEW',
          assigneeId: 'USR-000001',
        },
      ],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.message.includes('active assignment(s) in progress')
    );
    addResult(
      '13. ARCHIVED master with active assignment triggers ERROR',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('13. ARCHIVED master with active assignment triggers ERROR', false, err?.message);
  }

  // 14. ARCHIVED master with scheduled publishing
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, status: ContentMasterStatus.ARCHIVED, archivedAt: new Date().toISOString() }],
      videos: [{ ...validVideo, id: 'BP-V-000001', contentMasterId: 'BP-MST-000001', status: VideoProductionStatus.UPLOADED }],
      publishing: [
        {
          id: 'PUB-000001',
          videoId: 'BP-V-000001',
          youtube: { status: SocialPublishStatus.SCHEDULED },
        } as any,
      ],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.message.includes('scheduled publishing distribution')
    );
    addResult(
      '14. ARCHIVED master with scheduled publishing distribution triggers ERROR',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('14. ARCHIVED master with scheduled publishing triggers ERROR', false, err?.message);
  }

  // 15. ARCHIVED master missing archivedAt
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, status: ContentMasterStatus.ARCHIVED, archivedAt: undefined }],
    });
    const issue = issues.find(
      (i) => i.category === 'CONTENT_MASTER_INTEGRITY' && i.field === 'archivedAt' && i.message.includes('missing archived_at')
    );
    addResult(
      '15. ARCHIVED master missing archivedAt timestamp triggers WARNING',
      !!issue && issue.severity === 'WARNING',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('15. ARCHIVED master missing archivedAt timestamp triggers WARNING', false, err?.message);
  }

  // 16. Content Master sequence invariant where nextNumber <= maxExisting
  try {
    const issues = await runWithFixtures({
      contentMasters: [{ ...validMaster, id: 'BP-MST-000010' }],
      sequences: [
        { entityType: SEQUENCE_ENTITIES.CONTENT_MASTER, nextNumber: 10, prefix: 'BP-MST-', padLength: 6, updatedAt: new Date().toISOString() },
        validQuestionSequence,
        validVideoSequence,
      ],
    });
    const issue = issues.find(
      (i) => i.category === 'SEQUENCE_INTEGRITY' && i.entityId === SEQUENCE_ENTITIES.CONTENT_MASTER && i.message.includes('not ahead of highest existing')
    );
    addResult(
      '16. Content Master sequence nextNumber <= maxExisting triggers SEQUENCE_INTEGRITY error',
      !!issue && issue.severity === 'ERROR',
      issue ? `Severity: ${issue.severity}, Message: "${issue.message}"` : 'Issue not found'
    );
  } catch (err: any) {
    addResult('16. Content Master sequence nextNumber <= maxExisting triggers SEQUENCE_INTEGRITY error', false, err?.message);
  }

  // 17. Valid Content Master produces no false-positive for tested rules
  try {
    const issues = await runWithFixtures({
      contentMasters: [validMaster],
    });
    const cmIssues = issues.filter(
      (i) => i.worksheet === SHEET_TABS.CONTENT_MASTERS || i.category === 'CONTENT_MASTER_INTEGRITY'
    );
    addResult(
      '17. Valid Content Master fixture produces zero false-positive issues',
      cmIssues.length === 0,
      `Detected false-positives: ${cmIssues.length}`
    );
  } catch (err: any) {
    addResult('17. Valid Content Master fixture produces zero false-positive issues', false, err?.message);
  }

  // =========================================================================
  // LIVE SYSTEM & RUNTIME VERIFICATION (18-21)
  // =========================================================================

  // 18. Diagnostic execution is strictly read-only
  try {
    const mastersBefore = await contentMastersRepository.findAll();
    const questionsBefore = await questionsRepository.findAll();
    const videosBefore = await videosRepository.findAll();

    await dataIntegrityService.runFullIntegrityCheck();

    const mastersAfter = await contentMastersRepository.findAll();
    const questionsAfter = await questionsRepository.findAll();
    const videosAfter = await videosRepository.findAll();

    const isReadOnly =
      mastersBefore.length === mastersAfter.length &&
      questionsBefore.length === questionsAfter.length &&
      videosBefore.length === videosAfter.length;

    addResult(
      '18. Diagnostic execution is strictly read-only with zero mutation to database',
      isReadOnly,
      `Masters: ${mastersBefore.length} -> ${mastersAfter.length}, Questions: ${questionsBefore.length} -> ${questionsAfter.length}, Videos: ${videosBefore.length} -> ${videosAfter.length}`
    );
  } catch (err: any) {
    addResult('18. Diagnostic execution is strictly read-only', false, err?.message);
  }

  // 19. Dashboard Content Master lifecycle metrics
  try {
    const metrics = await dashboardService.getMetrics();
    const hasCmMetrics = !!metrics.contentMasters;
    const counts = metrics.contentMasters || { draft: 0, active: 0, completed: 0, archived: 0, total: 0 };
    const sumMatchesTotal = counts.total === counts.draft + counts.active + counts.completed + counts.archived;
    const allMasters = await contentMastersRepository.findAll();

    addResult(
      '19. Dashboard Content Master lifecycle counts are accurate and sum to total',
      hasCmMetrics && sumMatchesTotal && counts.total === allMasters.length,
      `total: ${counts.total}, draft: ${counts.draft}, active: ${counts.active}, completed: ${counts.completed}, archived: ${counts.archived}, actualMasters: ${allMasters.length}`
    );
  } catch (err: any) {
    addResult('19. Dashboard Content Master lifecycle counts are accurate', false, err?.message);
  }

  // 20. Worksheet health summary includes CONTENT_MASTERS
  try {
    const liveReport = await dataIntegrityService.runFullIntegrityCheck();
    const cmHealth = liveReport.worksheetHealth.find((w) => w.worksheet === SHEET_TABS.CONTENT_MASTERS);
    const allMasters = await contentMastersRepository.findAll();

    addResult(
      '20. Worksheet health summary includes CONTENT_MASTERS with real count',
      !!cmHealth && cmHealth.totalRecords === allMasters.length && cmHealth.totalRecords > 0,
      `Found: ${!!cmHealth}, totalRecords: ${cmHealth?.totalRecords}, actualMasters: ${allMasters.length}`
    );
  } catch (err: any) {
    addResult('20. Worksheet health summary includes CONTENT_MASTERS', false, err?.message);
  }

  // 21. Canonical lifecycle service remain fully operational
  try {
    const canonicalState = await contentMasterService.getCanonicalState('BP-MST-000001');
    const validStatus = [
      ContentMasterStatus.DRAFT,
      ContentMasterStatus.ACTIVE,
      ContentMasterStatus.COMPLETED,
      ContentMasterStatus.ARCHIVED,
    ].includes(canonicalState.status);

    addResult(
      '21. Phase 16.2 lifecycle service and canonical state remain fully operational',
      !!canonicalState && validStatus,
      `masterId: ${canonicalState.contentMasterId}, status: ${canonicalState.status}`
    );
  } catch (err: any) {
    addResult('21. Canonical lifecycle service remain fully operational', false, err?.message);
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;

  return {
    passed: failedChecks === 0,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}

// Direct CLI execution
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('phase16-step4')) {
  runPhase16Step4Verification()
    .then((res) => {
      console.log('\n==================================================');
      console.log('PHASE 16.4 BEHAVIORAL INTEGRITY VERIFICATION');
      console.log('==================================================');
      res.results.forEach((r) => {
        console.log(`[${r.status}] ${r.check}`);
        if (r.details) {
          console.log(`       Details: ${r.details}`);
        }
      });
      console.log('--------------------------------------------------');
      console.log(`TOTAL: ${res.totalChecks} | PASSED: ${res.passedChecks} | FAILED: ${res.failedChecks}`);
      console.log('==================================================\n');

      if (!res.passed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error during Phase 16.4 verification:', err);
      process.exit(1);
    });
}
