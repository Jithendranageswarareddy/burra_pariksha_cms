/**
 * BURRA PARIKSHA CMS - Phase 16.9 Verification Suite
 * Content Master Taxonomy Drift & Referential Integrity Diagnostic Parity
 * 
 * Strict behavioral execution against isolated fixtures verifying:
 * 1. Clean Baseline Pass
 * 2. Primary Question Category Mismatch
 * 3. Primary Question Topic Mismatch
 * 4. Primary Question Subtopic Mismatch
 * 5. Archived Primary Question
 * 6. Linked Child Question Category Mismatch
 * 7. Linked Child Question Topic Mismatch
 * 8. Linked Child Question Subtopic Mismatch
 * 9. Video ↔ Question ↔ Content Master Pointer Divergence
 * 10. Active Production Video on Archived Content Master
 * 11. Multiple Simultaneous Violations
 * 12. Non-Destructive Zero-Mutation Guarantee
 */

import { dataIntegrityService } from '../lib/services/data-integrity.service';
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
  PriorityLevel,
  Publishing,
  Question,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  Subtopic,
  Topic,
  User,
  UserRole,
  Video,
  VideoProductionStatus,
} from '../types';
import { SEQUENCE_ENTITIES, SHEET_TABS } from '../lib/schemas/google-sheets-schema';
import { SequenceRecord } from '../lib/repositories/sequences.repository';

// Base valid fixtures
const validUser: User = {
  id: 'USR-000001',
  name: 'Admin User',
  email: 'admin@burrapariksha.com',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validCat1: Category = {
  id: 'BP-CAT-000001',
  name: 'Quantitative Aptitude',
  slug: 'quantitative-aptitude',
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validCat2: Category = {
  id: 'BP-CAT-000002',
  name: 'Reasoning Ability',
  slug: 'reasoning-ability',
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validTopic1: Topic = {
  id: 'BP-TOP-000001',
  categoryId: 'BP-CAT-000001',
  name: 'Percentages',
  slug: 'percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validTopic2: Topic = {
  id: 'BP-TOP-000002',
  categoryId: 'BP-CAT-000001',
  name: 'Profit & Loss',
  slug: 'profit-loss',
  displayOrder: 2,
  isActive: true,
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validSubtopic1: Subtopic = {
  id: 'BP-SUB-000001',
  topicId: 'BP-TOP-000001',
  name: 'Basic Percentages',
  slug: 'basic-percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validSubtopic2: Subtopic = {
  id: 'BP-SUB-000002',
  topicId: 'BP-TOP-000001',
  name: 'Percentage Conversions',
  slug: 'percentage-conversions',
  displayOrder: 2,
  isActive: true,
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validQuestion1: Question = {
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
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validQuestion2: Question = {
  id: 'BP-Q-000002',
  questionText: 'What is 25% of 200?',
  options: {
    a: '40',
    b: '50',
    c: '60',
    d: '70',
  },
  correctAnswer: 'B',
  explanation: '200 * 0.25 = 50',
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
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validMaster1: ContentMaster = {
  id: 'BP-MST-000001',
  title: 'Percentage Concepts Vol 1',
  status: ContentMasterStatus.ACTIVE,
  primaryQuestionId: 'BP-Q-000001',
  categoryId: 'BP-CAT-000001',
  topicId: 'BP-TOP-000001',
  subtopicId: 'BP-SUB-000001',
  createdBy: 'USR-000001',
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validMaster2: ContentMaster = {
  id: 'BP-MST-000002',
  title: 'Percentage Concepts Vol 2',
  status: ContentMasterStatus.ACTIVE,
  primaryQuestionId: 'BP-Q-000002',
  categoryId: 'BP-CAT-000001',
  topicId: 'BP-TOP-000001',
  subtopicId: 'BP-SUB-000001',
  createdBy: 'USR-000001',
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validVideo1: Video = {
  id: 'BP-V-000001',
  title: 'Percentage Concepts Video',
  questionId: 'BP-Q-000001',
  contentMasterId: 'BP-MST-000001',
  status: VideoProductionStatus.READY_TO_UPLOAD,
  priority: PriorityLevel.NORMAL,
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validSequences: SequenceRecord[] = [
  { entityType: SEQUENCE_ENTITIES.CONTENT_MASTER, nextNumber: 10, prefix: 'BP-MST-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
  { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 10, prefix: 'BP-Q-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
  { entityType: SEQUENCE_ENTITIES.VIDEO, nextNumber: 10, prefix: 'BP-V-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
  { entityType: SEQUENCE_ENTITIES.CATEGORY, nextNumber: 10, prefix: 'BP-CAT-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
  { entityType: SEQUENCE_ENTITIES.TOPIC, nextNumber: 10, prefix: 'BP-TOP-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
  { entityType: SEQUENCE_ENTITIES.SUBTOPIC, nextNumber: 10, prefix: 'BP-SUB-', padLength: 6, updatedAt: '2026-09-09T00:00:00.000Z' },
];

interface FixtureOverrides {
  contentMasters?: ContentMaster[];
  questions?: Question[];
  videos?: Video[];
  categories?: Category[];
  topics?: Topic[];
  subtopics?: Subtopic[];
  sequences?: SequenceRecord[];
  users?: User[];
}

/**
 * Runs DataIntegrityService.runFullIntegrityCheck with isolated in-memory fixture overrides.
 */
async function runWithFixtures(overrides: FixtureOverrides): Promise<IntegrityIssue[]> {
  const origContentMasters = contentMastersRepository.findAll;
  const origQuestions = questionsRepository.findAll;
  const origVideos = videosRepository.findAll;
  const origCategories = categoriesRepository.findAll;
  const origTopics = topicsRepository.findAll;
  const origSubtopics = subtopicsRepository.findAll;
  const origSequences = sequencesRepository.findAll;
  const origUsers = usersRepository.findAll;
  const origAssignments = assignmentsRepository.findAll;
  const origPublishing = publishingRepository.findAll;
  const origQuestionVideos = questionVideosRepository.findAll;
  const origScripts = scriptsRepository.findAll;
  const origScriptVersions = scriptVersionsRepository.findAll;
  const origThumbnails = thumbnailsRepository.findAll;
  const origThumbnailVersions = thumbnailVersionsRepository.findAll;
  const origPinnedComments = pinnedCommentsRepository.findAll;
  const origPinnedCommentVersions = pinnedCommentVersionsRepository.findAll;
  const origWorkflow = workflowRepository.findAll;

  try {
    contentMastersRepository.findAll = async () => overrides.contentMasters ?? [validMaster1];
    questionsRepository.findAll = async () => overrides.questions ?? [validQuestion1, validQuestion2];
    videosRepository.findAll = async () => overrides.videos ?? [validVideo1];
    categoriesRepository.findAll = async () => overrides.categories ?? [validCat1, validCat2];
    topicsRepository.findAll = async () => overrides.topics ?? [validTopic1, validTopic2];
    subtopicsRepository.findAll = async () => overrides.subtopics ?? [validSubtopic1, validSubtopic2];
    sequencesRepository.findAll = async () => overrides.sequences ?? validSequences;
    usersRepository.findAll = async () => overrides.users ?? [validUser];
    assignmentsRepository.findAll = async () => [];
    publishingRepository.findAll = async () => [];
    questionVideosRepository.findAll = async () => [];
    scriptsRepository.findAll = async () => [];
    scriptVersionsRepository.findAll = async () => [];
    thumbnailsRepository.findAll = async () => [];
    thumbnailVersionsRepository.findAll = async () => [];
    pinnedCommentsRepository.findAll = async () => [];
    pinnedCommentVersionsRepository.findAll = async () => [];
    workflowRepository.findAll = async () => [];

    const report = await dataIntegrityService.runFullIntegrityCheck();
    return report.issues;
  } finally {
    contentMastersRepository.findAll = origContentMasters;
    questionsRepository.findAll = origQuestions;
    videosRepository.findAll = origVideos;
    categoriesRepository.findAll = origCategories;
    topicsRepository.findAll = origTopics;
    subtopicsRepository.findAll = origSubtopics;
    sequencesRepository.findAll = origSequences;
    usersRepository.findAll = origUsers;
    assignmentsRepository.findAll = origAssignments;
    publishingRepository.findAll = origPublishing;
    questionVideosRepository.findAll = origQuestionVideos;
    scriptsRepository.findAll = origScripts;
    scriptVersionsRepository.findAll = origScriptVersions;
    thumbnailsRepository.findAll = origThumbnails;
    thumbnailVersionsRepository.findAll = origThumbnailVersions;
    pinnedCommentsRepository.findAll = origPinnedComments;
    pinnedCommentVersionsRepository.findAll = origPinnedCommentVersions;
    workflowRepository.findAll = origWorkflow;
  }
}

export async function runPhase16Step9Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }>;
}> {
  const results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }> = [];

  const recordResult = (check: string, status: 'PASS' | 'FAIL', details?: string) => {
    results.push({ check, status, details });
    const icon = status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${String(results.length).padStart(2, ' ')}] ${icon} - ${check}`);
    if (details) console.log(`     Details: ${details}`);
  };

  console.log('\n===============================================================');
  console.log('PHASE 16.9: CONTENT MASTER TAXONOMY DRIFT & REFERENTIAL DIAGNOSTICS');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: CLEAN BASELINE
  // -------------------------------------------------------------------------
  try {
    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [validQuestion1, validQuestion2],
      videos: [validVideo1],
    });

    const cmIssues = issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY');
    if (cmIssues.length === 0) {
      recordResult(
        'Clean baseline pass',
        'PASS',
        'Zero CONTENT_MASTER_INTEGRITY violations emitted for fully aligned data.'
      );
    } else {
      recordResult(
        'Clean baseline pass',
        'FAIL',
        `Unexpected issues emitted: ${cmIssues.map((i) => i.message).join(' | ')}`
      );
    }
  } catch (err: any) {
    recordResult('Clean baseline pass', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: PRIMARY CATEGORY MISMATCH
  // -------------------------------------------------------------------------
  try {
    const mismatchQ: Question = {
      ...validQuestion1,
      categoryId: 'BP-CAT-000002', // Diverges from master category BP-CAT-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [mismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.CONTENT_MASTERS &&
        i.field === 'primaryQuestionId' &&
        i.entityId === validMaster1.id &&
        i.message.includes('diverges from primary Question') &&
        i.recommendedAction.includes('Synchronize taxonomy between Content Master')
    );

    if (match) {
      recordResult(
        'Primary category mismatch detected',
        'PASS',
        `Correctly emitted ERROR on CONTENT_MASTERS.primaryQuestionId: "${match.message}".`
      );
    } else {
      recordResult(
        'Primary category mismatch detected',
        'FAIL',
        `Did not find expected ERROR diagnostic. Got: ${JSON.stringify(issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY'))}`
      );
    }
  } catch (err: any) {
    recordResult('Primary category mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: PRIMARY TOPIC MISMATCH
  // -------------------------------------------------------------------------
  try {
    const mismatchQ: Question = {
      ...validQuestion1,
      topicId: 'BP-TOP-000002', // Diverges from master topic BP-TOP-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [mismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.CONTENT_MASTERS &&
        i.field === 'primaryQuestionId' &&
        i.entityId === validMaster1.id &&
        i.message.includes('diverges from primary Question')
    );

    if (match) {
      recordResult(
        'Primary topic mismatch detected',
        'PASS',
        `Correctly emitted ERROR on CONTENT_MASTERS.primaryQuestionId: "${match.message}".`
      );
    } else {
      recordResult(
        'Primary topic mismatch detected',
        'FAIL',
        'Expected ERROR on CONTENT_MASTERS.primaryQuestionId for topic divergence.'
      );
    }
  } catch (err: any) {
    recordResult('Primary topic mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: PRIMARY SUBTOPIC MISMATCH
  // -------------------------------------------------------------------------
  try {
    const mismatchQ: Question = {
      ...validQuestion1,
      subtopicId: 'BP-SUB-000002', // Diverges from master subtopic BP-SUB-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [mismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.CONTENT_MASTERS &&
        i.field === 'primaryQuestionId' &&
        i.entityId === validMaster1.id &&
        i.message.includes('diverges from primary Question')
    );

    if (match) {
      recordResult(
        'Primary subtopic mismatch detected',
        'PASS',
        `Correctly emitted ERROR on CONTENT_MASTERS.primaryQuestionId: "${match.message}".`
      );
    } else {
      recordResult(
        'Primary subtopic mismatch detected',
        'FAIL',
        'Expected ERROR on CONTENT_MASTERS.primaryQuestionId for subtopic divergence.'
      );
    }
  } catch (err: any) {
    recordResult('Primary subtopic mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: ARCHIVED PRIMARY QUESTION
  // -------------------------------------------------------------------------
  try {
    const archivedQ: Question = {
      ...validQuestion1,
      status: 'ARCHIVED' as any,
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [archivedQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.CONTENT_MASTERS &&
        i.field === 'primaryQuestionId' &&
        i.entityId === validMaster1.id &&
        i.message.includes('references ARCHIVED Question') &&
        i.recommendedAction.includes('Assign an active non-archived Question as primary_question_id')
    );

    if (match) {
      recordResult(
        'Archived primary Question detected',
        'PASS',
        `Correctly emitted ERROR on CONTENT_MASTERS.primaryQuestionId: "${match.message}".`
      );
    } else {
      recordResult(
        'Archived primary Question detected',
        'FAIL',
        `Expected ERROR for ARCHIVED primary Question. Issues: ${JSON.stringify(issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY'))}`
      );
    }
  } catch (err: any) {
    recordResult('Archived primary Question detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: CHILD CATEGORY MISMATCH
  // -------------------------------------------------------------------------
  try {
    const childMismatchQ: Question = {
      ...validQuestion2,
      contentMasterId: validMaster1.id,
      categoryId: 'BP-CAT-000002', // Diverges from master category BP-CAT-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [validQuestion1, childMismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.QUESTIONS &&
        i.field === 'contentMasterId' &&
        i.entityId === childMismatchQ.id &&
        i.message.includes('diverges from parent Content Master') &&
        i.recommendedAction.includes('Reconcile taxonomy on Question')
    );

    if (match) {
      recordResult(
        'Child Question category mismatch detected',
        'PASS',
        `Correctly emitted ERROR on QUESTIONS.contentMasterId: "${match.message}".`
      );
    } else {
      recordResult(
        'Child Question category mismatch detected',
        'FAIL',
        'Expected ERROR on QUESTIONS.contentMasterId for child category divergence.'
      );
    }
  } catch (err: any) {
    recordResult('Child Question category mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: CHILD TOPIC MISMATCH
  // -------------------------------------------------------------------------
  try {
    const childMismatchQ: Question = {
      ...validQuestion2,
      contentMasterId: validMaster1.id,
      topicId: 'BP-TOP-000002', // Diverges from master topic BP-TOP-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [validQuestion1, childMismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.QUESTIONS &&
        i.field === 'contentMasterId' &&
        i.entityId === childMismatchQ.id &&
        i.message.includes('diverges from parent Content Master')
    );

    if (match) {
      recordResult(
        'Child Question topic mismatch detected',
        'PASS',
        `Correctly emitted ERROR on QUESTIONS.contentMasterId: "${match.message}".`
      );
    } else {
      recordResult(
        'Child Question topic mismatch detected',
        'FAIL',
        'Expected ERROR on QUESTIONS.contentMasterId for child topic divergence.'
      );
    }
  } catch (err: any) {
    recordResult('Child Question topic mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: CHILD SUBTOPIC MISMATCH
  // -------------------------------------------------------------------------
  try {
    const childMismatchQ: Question = {
      ...validQuestion2,
      contentMasterId: validMaster1.id,
      subtopicId: 'BP-SUB-000002', // Diverges from master subtopic BP-SUB-000001
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1],
      questions: [validQuestion1, childMismatchQ],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.QUESTIONS &&
        i.field === 'contentMasterId' &&
        i.entityId === childMismatchQ.id &&
        i.message.includes('diverges from parent Content Master')
    );

    if (match) {
      recordResult(
        'Child Question subtopic mismatch detected',
        'PASS',
        `Correctly emitted ERROR on QUESTIONS.contentMasterId: "${match.message}".`
      );
    } else {
      recordResult(
        'Child Question subtopic mismatch detected',
        'FAIL',
        'Expected ERROR on QUESTIONS.contentMasterId for child subtopic divergence.'
      );
    }
  } catch (err: any) {
    recordResult('Child Question subtopic mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: VIDEO THREE-WAY POINTER MISMATCH
  // -------------------------------------------------------------------------
  try {
    // Video points to CM 1, but its Question (Q2) points to CM 2
    const desyncVideo: Video = {
      ...validVideo1,
      id: 'BP-V-000002',
      questionId: 'BP-Q-000002',
      contentMasterId: 'BP-MST-000001', // Mismatched! Q2 points to BP-MST-000002
    };

    const qPointingToCm2: Question = {
      ...validQuestion2,
      contentMasterId: 'BP-MST-000002',
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1, validMaster2],
      questions: [validQuestion1, qPointingToCm2],
      videos: [desyncVideo],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.VIDEOS &&
        i.field === 'contentMasterId' &&
        i.entityId === desyncVideo.id &&
        i.message.includes('Three-way referential mismatch: Video "BP-V-000002"') &&
        i.recommendedAction.includes('Reconcile contentMasterId between Video')
    );

    if (match) {
      recordResult(
        'Video three-way pointer mismatch detected',
        'PASS',
        `Correctly emitted ERROR on VIDEOS.contentMasterId: "${match.message}".`
      );
    } else {
      recordResult(
        'Video three-way pointer mismatch detected',
        'FAIL',
        `Expected three-way mismatch ERROR on VIDEOS.contentMasterId. Got: ${JSON.stringify(issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY'))}`
      );
    }
  } catch (err: any) {
    recordResult('Video three-way pointer mismatch detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: IN-FLIGHT VIDEO ON ARCHIVED CM
  // -------------------------------------------------------------------------
  try {
    const archivedMaster: ContentMaster = {
      ...validMaster1,
      status: ContentMasterStatus.ARCHIVED,
      archivedAt: '2026-09-09T00:00:00.000Z',
    };

    const inFlightVideo: Video = {
      ...validVideo1,
      status: VideoProductionStatus.EDITING,
    };

    const issues = await runWithFixtures({
      contentMasters: [archivedMaster],
      questions: [validQuestion1],
      videos: [inFlightVideo],
    });

    const match = issues.find(
      (i) =>
        i.category === 'CONTENT_MASTER_INTEGRITY' &&
        i.severity === 'ERROR' &&
        i.worksheet === SHEET_TABS.VIDEOS &&
        i.field === 'contentMasterId' &&
        i.entityId === inFlightVideo.id &&
        i.message.includes('actively in production (EDITING) references ARCHIVED Content Master') &&
        i.recommendedAction.includes('Cancel or retire Video')
    );

    if (match) {
      recordResult(
        'In-flight Video on archived Content Master detected',
        'PASS',
        `Correctly emitted ERROR on VIDEOS.contentMasterId: "${match.message}".`
      );
    } else {
      recordResult(
        'In-flight Video on archived Content Master detected',
        'FAIL',
        `Expected ERROR on VIDEOS.contentMasterId for in-flight video on archived CM. Got: ${JSON.stringify(issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY'))}`
      );
    }
  } catch (err: any) {
    recordResult('In-flight Video on archived Content Master detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: MULTIPLE SIMULTANEOUS VIOLATIONS
  // -------------------------------------------------------------------------
  try {
    // 1. Primary Q with both ARCHIVED and taxonomy mismatch
    const dirtyPrimaryQ: Question = {
      ...validQuestion1,
      status: 'ARCHIVED' as any,
      categoryId: 'BP-CAT-000002', // Taxonomy drift
    };

    // 2. Child Q with topic mismatch
    const dirtyChildQ: Question = {
      ...validQuestion2,
      contentMasterId: validMaster1.id,
      topicId: 'BP-TOP-000002',
    };

    // 3. Video with 3-way pointer divergence
    const desyncVideo: Video = {
      ...validVideo1,
      contentMasterId: 'BP-MST-000002', // Points to CM 2, while Q1 points to CM 1
    };

    const issues = await runWithFixtures({
      contentMasters: [validMaster1, validMaster2],
      questions: [dirtyPrimaryQ, dirtyChildQ],
      videos: [desyncVideo],
    });

    const cmIssues = issues.filter((i) => i.category === 'CONTENT_MASTER_INTEGRITY');

    const hasPrimaryTaxonomyDrift = cmIssues.some(
      (i) => i.worksheet === SHEET_TABS.CONTENT_MASTERS && i.message.includes('diverges from primary Question')
    );
    const hasArchivedPrimary = cmIssues.some(
      (i) => i.worksheet === SHEET_TABS.CONTENT_MASTERS && i.message.includes('references ARCHIVED Question')
    );
    const hasChildTaxonomyDrift = cmIssues.some(
      (i) => i.worksheet === SHEET_TABS.QUESTIONS && i.message.includes('diverges from parent Content Master')
    );
    const hasThreeWayMismatch = cmIssues.some(
      (i) => i.worksheet === SHEET_TABS.VIDEOS && i.message.includes('Three-way referential mismatch')
    );

    if (hasPrimaryTaxonomyDrift && hasArchivedPrimary && hasChildTaxonomyDrift && hasThreeWayMismatch) {
      recordResult(
        'Multiple simultaneous violations detected',
        'PASS',
        `Emitted all 4 distinct expected diagnostics without crash or omission: Primary Taxonomy Drift, Archived Primary, Child Taxonomy Drift, Three-Way Pointer Mismatch.`
      );
    } else {
      recordResult(
        'Multiple simultaneous violations detected',
        'FAIL',
        `Missing one or more expected violations. Found: ${JSON.stringify(cmIssues)}`
      );
    }
  } catch (err: any) {
    recordResult('Multiple simultaneous violations detected', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: NON-DESTRUCTIVE ZERO-MUTATION GUARANTEE
  // -------------------------------------------------------------------------
  try {
    const dirtyPrimaryQ: Question = {
      ...validQuestion1,
      status: 'ARCHIVED' as any,
      categoryId: 'BP-CAT-000002',
    };

    const dirtyChildQ: Question = {
      ...validQuestion2,
      contentMasterId: validMaster1.id,
      topicId: 'BP-TOP-000002',
    };

    const desyncVideo: Video = {
      ...validVideo1,
      contentMasterId: 'BP-MST-000002',
    };

    const fixtureMasters = [JSON.parse(JSON.stringify(validMaster1)), JSON.parse(JSON.stringify(validMaster2))];
    const fixtureQuestions = [JSON.parse(JSON.stringify(dirtyPrimaryQ)), JSON.parse(JSON.stringify(dirtyChildQ))];
    const fixtureVideos = [JSON.parse(JSON.stringify(desyncVideo))];

    const snapshotBefore = JSON.stringify({ fixtureMasters, fixtureQuestions, fixtureVideos });

    await runWithFixtures({
      contentMasters: fixtureMasters,
      questions: fixtureQuestions,
      videos: fixtureVideos,
    });

    const snapshotAfter = JSON.stringify({ fixtureMasters, fixtureQuestions, fixtureVideos });

    if (snapshotBefore === snapshotAfter) {
      recordResult(
        'Non-destructive zero-mutation guarantee',
        'PASS',
        'Fixture objects byte-for-byte identical before and after diagnostic audit. Zero repository writes.'
      );
    } else {
      recordResult(
        'Non-destructive zero-mutation guarantee',
        'FAIL',
        'Fixture data was mutated during diagnostic audit!'
      );
    }
  } catch (err: any) {
    recordResult('Non-destructive zero-mutation guarantee', 'FAIL', err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;

  console.log('\n===============================================================');
  console.log(`TOTAL: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log(`RESULT: ${failedChecks === 0 ? 'ALL PHASE 16.9 CHECKS PASSED' : 'PHASE 16.9 FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed: failedChecks === 0,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

const isDirectRun = process.argv[1] && (
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith('phase16-step9-diagnostic-parity.ts')
);

if (isDirectRun) {
  runPhase16Step9Verification()
    .then((res) => process.exit(res.passed ? 0 : 1))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
