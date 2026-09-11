/**
 * BURRA PARIKSHA CMS - Phase 16.7 Behavioral Verification Suite
 * Content Master Write-Time Referential Integrity & Taxonomy Guardrails
 * 
 * Strict behavioral execution against isolated, in-memory fixtures verifying:
 *  1. nonexistent CM on Question create -> ReferenceIntegrityError
 *  2. ARCHIVED CM on Question create -> ValidationError
 *  3. COMPLETED CM on Question create -> ValidationError
 *  4. DRAFT matching CM on Question create -> success
 *  5. ACTIVE matching CM on Question create -> success
 *  6. taxonomy mismatch on Question create -> ValidationError
 *  7. changing Question CM to nonexistent -> ReferenceIntegrityError
 *  8. changing Question CM to ARCHIVED/COMPLETED -> ValidationError
 *  9. changing Question CM to valid DRAFT/ACTIVE matching CM -> success
 * 10. changing Question taxonomy to diverge from linked CM -> ValidationError
 * 11. queue video with missing CM -> ReferenceIntegrityError
 * 12. queue video with ARCHIVED CM -> ValidationError
 * 13. valid video queue with DRAFT/ACTIVE CM -> success and existing workflow preserved
 * 14. ContentMaster.primaryQuestionId nonexistent Question -> ReferenceIntegrityError
 * 15. ContentMaster.primaryQuestionId taxonomy mismatch -> ValidationError
 * 16. Question creation WITHOUT explicit contentMasterId -> existing automatic CM creation behavior preserved
 */

import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  sequencesRepository,
  questionVideosRepository,
  auditLogRepository,
} from '../lib/repositories';
import { questionService } from '../lib/services/question.service';
import { videoService } from '../lib/services/video.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { workflowService } from '../lib/services/workflow.service';
import { auditService } from '../lib/services/audit.service';
import {
  Category,
  ContentMaster,
  ContentMasterStatus,
  DifficultyLevel,
  Question,
  QuestionLanguage,
  QuestionStatus,
  Subtopic,
  Topic,
  UserRole,
  Video,
  VideoProductionStatus,
} from '../types';
import { ReferenceIntegrityError, ValidationError } from '../lib/google-sheets/errors';

// Standard Taxonomy Fixtures
const testCategory: Category = {
  id: 'BP-CAT-TEST01',
  name: 'Quantitative Aptitude',
  slug: 'quantitative-aptitude',
  createdAt: new Date().toISOString(),
};

const testTopic1: Topic = {
  id: 'BP-TOP-TEST01',
  categoryId: 'BP-CAT-TEST01',
  name: 'Percentages',
  slug: 'percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const testTopic2: Topic = {
  id: 'BP-TOP-TEST02',
  categoryId: 'BP-CAT-TEST01',
  name: 'Time and Work',
  slug: 'time-and-work',
  displayOrder: 2,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const testSubtopic1: Subtopic = {
  id: 'BP-SUB-TEST01',
  topicId: 'BP-TOP-TEST01',
  name: 'Basic Percentages',
  slug: 'basic-percentages',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const testSubtopic2: Subtopic = {
  id: 'BP-SUB-TEST02',
  topicId: 'BP-TOP-TEST02',
  name: 'Work Done',
  slug: 'work-done',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const testActor = {
  id: 'USR-ADMIN-01',
  name: 'Test Administrator',
  role: UserRole.ADMIN,
};

export async function runPhase16Step7Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Array<{ testId: number; name: string; status: 'PASS' | 'FAIL'; details: string }>;
}> {
  const results: Array<{ testId: number; name: string; status: 'PASS' | 'FAIL'; details: string }> = [];

  // In-memory backing stores
  const contentMastersMap = new Map<string, ContentMaster>();
  const questionsMap = new Map<string, Question>();
  const videosMap = new Map<string, Video>();
  const sequenceCounters: Record<string, number> = {
    QUESTION: 100,
    VIDEO: 100,
    CONTENT_MASTER: 100,
  };

  // Preserve original repository methods
  const origCMFindById = contentMastersRepository.findById;
  const origCMFindAll = contentMastersRepository.findAll;
  const origCMCreate = contentMastersRepository.create;
  const origCMUpdate = contentMastersRepository.update;
  const origCMUpdateRecord = contentMastersRepository.updateRecord;
  const origCMAppendRecord = contentMastersRepository.appendRecord;

  const origQFindById = questionsRepository.findById;
  const origQFindAll = questionsRepository.findAll;
  const origQFindByCM = questionsRepository.findByContentMasterId;
  const origQCreate = questionsRepository.create;
  const origQUpdate = questionsRepository.update;
  const origQUpdateRecord = questionsRepository.updateRecord;
  const origQAppendRecord = questionsRepository.appendRecord;

  const origVFindById = videosRepository.findById;
  const origVFindAll = videosRepository.findAll;
  const origVFindByQId = videosRepository.findByQuestionId;
  const origVCreate = videosRepository.create;
  const origVUpdate = videosRepository.update;
  const origVUpdateRecord = videosRepository.updateRecord;
  const origVAppendRecord = videosRepository.appendRecord;

  const origCatFindAll = categoriesRepository.findAll;
  const origCatFindById = categoriesRepository.findById;
  const origTopFindAll = topicsRepository.findAll;
  const origTopFindById = topicsRepository.findById;
  const origSubFindAll = subtopicsRepository.findAll;
  const origSubFindById = subtopicsRepository.findById;

  const origSeqAllocate = sequencesRepository.allocateNextNumber;
  const origQVAppend = questionVideosRepository.appendRecord;
  const origWServiceRecord = workflowService.recordTransition;
  const origAuditLog = auditLogRepository.create;
  const origAuditServiceLog = auditService.log;

  try {
    // Override ContentMastersRepository
    contentMastersRepository.findById = async (id: string) => contentMastersMap.get(id) || null;
    contentMastersRepository.findAll = async () => Array.from(contentMastersMap.values());
    contentMastersRepository.create = async (record: ContentMaster) => {
      contentMastersMap.set(record.id, { ...record });
      return { ...record };
    };
    contentMastersRepository.update = async (record: ContentMaster) => {
      contentMastersMap.set(record.id, { ...record });
      return { ...record };
    };
    contentMastersRepository.updateRecord = async (id: string, updates: Partial<ContentMaster>) => {
      const existing = contentMastersMap.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      contentMastersMap.set(id, updated);
      return updated;
    };
    contentMastersRepository.appendRecord = async (record: ContentMaster) => {
      contentMastersMap.set(record.id, { ...record });
      return { ...record };
    };

    // Override QuestionsRepository
    questionsRepository.findById = async (id: string) => questionsMap.get(id) || null;
    questionsRepository.findAll = async () => Array.from(questionsMap.values());
    questionsRepository.findByContentMasterId = async (cmId: string) =>
      Array.from(questionsMap.values()).filter((q) => q.contentMasterId === cmId);
    questionsRepository.create = async (record: Question) => {
      questionsMap.set(record.id, { ...record });
      return { ...record };
    };
    questionsRepository.update = async (record: Question) => {
      questionsMap.set(record.id, { ...record });
      return { ...record };
    };
    questionsRepository.updateRecord = async (id: string, updates: Partial<Question>) => {
      const existing = questionsMap.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      questionsMap.set(id, updated);
      return updated;
    };
    questionsRepository.appendRecord = async (record: Question) => {
      questionsMap.set(record.id, { ...record });
      return { ...record };
    };

    // Override VideosRepository
    videosRepository.findById = async (id: string) => videosMap.get(id) || null;
    videosRepository.findAll = async () => Array.from(videosMap.values());
    videosRepository.findByQuestionId = async (qId: string) =>
      Array.from(videosMap.values()).filter((v) => v.questionId === qId);
    videosRepository.create = async (record: Video) => {
      videosMap.set(record.id, { ...record });
      return { ...record };
    };
    videosRepository.update = async (record: Video) => {
      videosMap.set(record.id, { ...record });
      return { ...record };
    };
    videosRepository.updateRecord = async (id: string, updates: Partial<Video>) => {
      const existing = videosMap.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      videosMap.set(id, updated);
      return updated;
    };
    videosRepository.appendRecord = async (record: Video) => {
      videosMap.set(record.id, { ...record });
      return { ...record };
    };

    // Override Taxonomy Repositories
    categoriesRepository.findAll = async () => [testCategory];
    categoriesRepository.findById = async (id: string) => (id === testCategory.id ? testCategory : null);
    topicsRepository.findAll = async () => [testTopic1, testTopic2];
    topicsRepository.findById = async (id: string) => {
      if (id === testTopic1.id) return testTopic1;
      if (id === testTopic2.id) return testTopic2;
      return null;
    };
    subtopicsRepository.findAll = async () => [testSubtopic1, testSubtopic2];
    subtopicsRepository.findById = async (id: string) => {
      if (id === testSubtopic1.id) return testSubtopic1;
      if (id === testSubtopic2.id) return testSubtopic2;
      return null;
    };

    // Invalidate taxonomy service cache so it loads mock taxonomy
    taxonomyService.invalidateCache();

    // Override Sequences
    sequencesRepository.allocateNextNumber = async (entityType: any) => {
      const curr = (sequenceCounters[entityType] || 100) + 1;
      sequenceCounters[entityType] = curr;
      const prefixMap: Record<string, string> = {
        QUESTION: 'BP-Q-',
        VIDEO: 'BP-V-',
        CONTENT_MASTER: 'BP-MST-',
      };
      return {
        allocatedNumber: curr,
        prefix: prefixMap[entityType] || 'BP-X-',
        padLength: 6,
      };
    };

    // Audit and Workflow no-ops
    questionVideosRepository.appendRecord = async (rec: any) => rec;
    workflowService.recordTransition = async () => ({} as any);
    auditLogRepository.create = async (rec: any) => rec;
    auditService.log = async () => ({} as any);

    // =========================================================================
    // TEST 1: Nonexistent CM on Question create -> ReferenceIntegrityError
    // =========================================================================
    try {
      await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question referencing non-existent Content Master',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: 'BP-MST-NONEXISTENT',
        },
        testActor
      );
      results.push({
        testId: 1,
        name: 'nonexistent CM on Question create -> ReferenceIntegrityError',
        status: 'FAIL',
        details: 'Expected ReferenceIntegrityError but call succeeded',
      });
    } catch (err: any) {
      const isRefErr = err instanceof ReferenceIntegrityError || err?.name === 'ReferenceIntegrityError';
      results.push({
        testId: 1,
        name: 'nonexistent CM on Question create -> ReferenceIntegrityError',
        status: isRefErr ? 'PASS' : 'FAIL',
        details: isRefErr
          ? 'Correctly threw ReferenceIntegrityError for missing Content Master'
          : `Unexpected error type: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 2: ARCHIVED CM on Question create -> ValidationError
    // =========================================================================
    const archivedMaster: ContentMaster = {
      id: 'BP-MST-000002',
      title: 'Archived Content Master',
      status: ContentMasterStatus.ARCHIVED,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(archivedMaster.id, archivedMaster);

    try {
      await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question referencing archived Content Master',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: archivedMaster.id,
        },
        testActor
      );
      results.push({
        testId: 2,
        name: 'ARCHIVED CM on Question create -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError but call succeeded',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 2,
        name: 'ARCHIVED CM on Question create -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError for ARCHIVED Content Master'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 3: COMPLETED CM on Question create -> ValidationError
    // =========================================================================
    const completedMaster: ContentMaster = {
      id: 'BP-MST-000003',
      title: 'Completed Content Master',
      status: ContentMasterStatus.COMPLETED,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(completedMaster.id, completedMaster);

    try {
      await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question referencing completed Content Master',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: completedMaster.id,
        },
        testActor
      );
      results.push({
        testId: 3,
        name: 'COMPLETED CM on Question create -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError but call succeeded',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 3,
        name: 'COMPLETED CM on Question create -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError for COMPLETED Content Master'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 4: DRAFT matching CM -> success
    // =========================================================================
    const draftMaster: ContentMaster = {
      id: 'BP-MST-000004',
      title: 'Draft Content Master',
      status: ContentMasterStatus.DRAFT,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(draftMaster.id, draftMaster);

    try {
      const createdDraftLinked = await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question referencing draft Content Master',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: draftMaster.id,
        },
        testActor
      );
      const isSuccess = Boolean(
        createdDraftLinked &&
        createdDraftLinked.contentMasterId === draftMaster.id &&
        draftMaster.primaryQuestionId === '' // Invariant: do not modify primaryQuestionId of existing CM
      );
      results.push({
        testId: 4,
        name: 'DRAFT matching CM -> success',
        status: isSuccess ? 'PASS' : 'FAIL',
        details: isSuccess
          ? 'Question successfully linked to DRAFT CM without mutating primaryQuestionId'
          : 'Question creation did not link properly to DRAFT CM',
      });
    } catch (err: any) {
      results.push({
        testId: 4,
        name: 'DRAFT matching CM -> success',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // =========================================================================
    // TEST 5: ACTIVE matching CM -> success
    // =========================================================================
    const activeMaster: ContentMaster = {
      id: 'BP-MST-000005',
      title: 'Active Content Master',
      status: ContentMasterStatus.ACTIVE,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(activeMaster.id, activeMaster);

    let test5QuestionId = '';
    try {
      const createdActiveLinked = await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question referencing active Content Master',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: activeMaster.id,
        },
        testActor
      );
      test5QuestionId = createdActiveLinked.id;
      const isSuccess = Boolean(
        createdActiveLinked &&
        createdActiveLinked.contentMasterId === activeMaster.id &&
        activeMaster.primaryQuestionId === ''
      );
      results.push({
        testId: 5,
        name: 'ACTIVE matching CM -> success',
        status: isSuccess ? 'PASS' : 'FAIL',
        details: isSuccess
          ? 'Question successfully linked to ACTIVE CM without mutating primaryQuestionId'
          : 'Question creation did not link properly to ACTIVE CM',
      });
    } catch (err: any) {
      results.push({
        testId: 5,
        name: 'ACTIVE matching CM -> success',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // =========================================================================
    // TEST 6: taxonomy mismatch -> ValidationError
    // =========================================================================
    const mismatchMaster: ContentMaster = {
      id: 'BP-MST-000006',
      title: 'Mismatch Content Master',
      status: ContentMasterStatus.ACTIVE,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic2.id, // topic 2
      subtopicId: testSubtopic2.id, // subtopic 2
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(mismatchMaster.id, mismatchMaster);

    try {
      // Question has topic 1 / subtopic 1, while CM has topic 2 / subtopic 2
      await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.MEDIUM,
          questionText: 'Test question with taxonomy mismatch against CM',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Explanation text here',
          contentMasterId: mismatchMaster.id,
        },
        testActor
      );
      results.push({
        testId: 6,
        name: 'taxonomy mismatch -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError for taxonomy mismatch but call succeeded',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 6,
        name: 'taxonomy mismatch -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError for taxonomy mismatch between Question and Content Master'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 7: changing Question CM to nonexistent -> ReferenceIntegrityError
    // =========================================================================
    try {
      await questionService.updateQuestion(
        test5QuestionId,
        { contentMasterId: 'BP-MST-NONEXISTENT' },
        testActor
      );
      results.push({
        testId: 7,
        name: 'changing Question CM to nonexistent -> ReferenceIntegrityError',
        status: 'FAIL',
        details: 'Expected ReferenceIntegrityError but update succeeded',
      });
    } catch (err: any) {
      const isRefErr = err instanceof ReferenceIntegrityError || err?.name === 'ReferenceIntegrityError';
      results.push({
        testId: 7,
        name: 'changing Question CM to nonexistent -> ReferenceIntegrityError',
        status: isRefErr ? 'PASS' : 'FAIL',
        details: isRefErr
          ? 'Correctly threw ReferenceIntegrityError when reassigning to non-existent CM'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 8: changing Question CM to ARCHIVED/COMPLETED -> ValidationError
    // =========================================================================
    try {
      await questionService.updateQuestion(
        test5QuestionId,
        { contentMasterId: archivedMaster.id },
        testActor
      );
      results.push({
        testId: 8,
        name: 'changing Question CM to ARCHIVED/COMPLETED -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError for ARCHIVED CM reassignment but update succeeded',
      });
    } catch (err: any) {
      const isValErrArchived = err instanceof ValidationError || err?.name === 'ValidationError';
      try {
        await questionService.updateQuestion(
          test5QuestionId,
          { contentMasterId: completedMaster.id },
          testActor
        );
        results.push({
          testId: 8,
          name: 'changing Question CM to ARCHIVED/COMPLETED -> ValidationError',
          status: 'FAIL',
          details: 'Expected ValidationError for COMPLETED CM reassignment but update succeeded',
        });
      } catch (err2: any) {
        const isValErrCompleted = err2 instanceof ValidationError || err2?.name === 'ValidationError';
        const isBothPass = isValErrArchived && isValErrCompleted;
        results.push({
          testId: 8,
          name: 'changing Question CM to ARCHIVED/COMPLETED -> ValidationError',
          status: isBothPass ? 'PASS' : 'FAIL',
          details: isBothPass
            ? 'Correctly rejected reassignment to both ARCHIVED and COMPLETED Content Masters'
            : 'Failed one of the ARCHIVED or COMPLETED checks',
        });
      }
    }

    // =========================================================================
    // TEST 9: changing Question CM to valid DRAFT/ACTIVE matching CM -> success
    // =========================================================================
    const secondActiveMaster: ContentMaster = {
      id: 'BP-MST-000009',
      title: 'Second Active Content Master',
      status: ContentMasterStatus.ACTIVE,
      primaryQuestionId: '',
      categoryId: testCategory.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      createdBy: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersMap.set(secondActiveMaster.id, secondActiveMaster);

    try {
      const updatedQ = await questionService.updateQuestion(
        test5QuestionId,
        { contentMasterId: secondActiveMaster.id },
        testActor
      );
      const isPass = updatedQ.contentMasterId === secondActiveMaster.id;
      results.push({
        testId: 9,
        name: 'changing Question CM to valid DRAFT/ACTIVE matching CM -> success',
        status: isPass ? 'PASS' : 'FAIL',
        details: isPass
          ? 'Successfully updated question to valid matching ACTIVE Content Master'
          : 'Question contentMasterId was not updated',
      });
    } catch (err: any) {
      results.push({
        testId: 9,
        name: 'changing Question CM to valid DRAFT/ACTIVE matching CM -> success',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // =========================================================================
    // TEST 10: changing Question taxonomy to diverge from linked CM -> ValidationError
    // =========================================================================
    try {
      // Attempt to change topic/subtopic to topic2/subtopic2 while still linked to secondActiveMaster (which has topic1/subtopic1)
      await questionService.updateQuestion(
        test5QuestionId,
        { topicId: testTopic2.id, subtopicId: testSubtopic2.id },
        testActor
      );
      results.push({
        testId: 10,
        name: 'changing Question taxonomy to diverge from linked CM -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError when changing taxonomy to diverge from parent CM',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 10,
        name: 'changing Question taxonomy to diverge from linked CM -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError preventing taxonomy divergence from linked CM'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 11: queue video with missing CM -> ReferenceIntegrityError
    // =========================================================================
    const questionWithMissingCM: Question = {
      id: 'BP-Q-000011',
      contentMasterId: 'BP-MST-NONEXISTENT',
      categoryId: testCategory.id,
      categoryName: testCategory.name,
      topicId: testTopic1.id,
      topicName: testTopic1.name,
      subtopicId: testSubtopic1.id,
      subtopicName: testSubtopic1.name,
      difficulty: DifficultyLevel.EASY,
      questionText: 'Question with missing CM link',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Explanation',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      language: QuestionLanguage.TELUGU,
      authorId: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsMap.set(questionWithMissingCM.id, questionWithMissingCM);

    try {
      await videoService.queueVideoForProduction(
        { questionId: questionWithMissingCM.id, title: 'Queue Video with missing CM' },
        testActor
      );
      results.push({
        testId: 11,
        name: 'queue video with missing CM -> ReferenceIntegrityError',
        status: 'FAIL',
        details: 'Expected ReferenceIntegrityError but queue succeeded',
      });
    } catch (err: any) {
      const isRefErr = err instanceof ReferenceIntegrityError || err?.name === 'ReferenceIntegrityError';
      results.push({
        testId: 11,
        name: 'queue video with missing CM -> ReferenceIntegrityError',
        status: isRefErr ? 'PASS' : 'FAIL',
        details: isRefErr
          ? 'Correctly threw ReferenceIntegrityError when queuing video with missing CM'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 12: queue video with ARCHIVED CM -> ValidationError
    // =========================================================================
    const questionWithArchivedCM: Question = {
      id: 'BP-Q-000012',
      contentMasterId: archivedMaster.id,
      categoryId: testCategory.id,
      categoryName: testCategory.name,
      topicId: testTopic1.id,
      topicName: testTopic1.name,
      subtopicId: testSubtopic1.id,
      subtopicName: testSubtopic1.name,
      difficulty: DifficultyLevel.EASY,
      questionText: 'Question with archived CM link',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Explanation',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      language: QuestionLanguage.TELUGU,
      authorId: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsMap.set(questionWithArchivedCM.id, questionWithArchivedCM);

    try {
      await videoService.queueVideoForProduction(
        { questionId: questionWithArchivedCM.id, title: 'Queue Video with archived CM' },
        testActor
      );
      results.push({
        testId: 12,
        name: 'queue video with ARCHIVED CM -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError but queue succeeded',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 12,
        name: 'queue video with ARCHIVED CM -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError when queuing video for an ARCHIVED CM'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 13: valid video queue with DRAFT/ACTIVE CM -> success and existing workflow preserved
    // =========================================================================
    const questionWithDraftCM: Question = {
      id: 'BP-Q-000013A',
      contentMasterId: draftMaster.id,
      categoryId: testCategory.id,
      categoryName: testCategory.name,
      topicId: testTopic1.id,
      topicName: testTopic1.name,
      subtopicId: testSubtopic1.id,
      subtopicName: testSubtopic1.name,
      difficulty: DifficultyLevel.EASY,
      questionText: 'Question with draft CM link',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Explanation',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      language: QuestionLanguage.TELUGU,
      authorId: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsMap.set(questionWithDraftCM.id, questionWithDraftCM);

    const questionWithActiveCM: Question = {
      id: 'BP-Q-000013B',
      contentMasterId: activeMaster.id,
      categoryId: testCategory.id,
      categoryName: testCategory.name,
      topicId: testTopic1.id,
      topicName: testTopic1.name,
      subtopicId: testSubtopic1.id,
      subtopicName: testSubtopic1.name,
      difficulty: DifficultyLevel.EASY,
      questionText: 'Question with active CM link',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Explanation',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      language: QuestionLanguage.TELUGU,
      authorId: testActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsMap.set(questionWithActiveCM.id, questionWithActiveCM);

    try {
      // 1. Queue video for question linked to DRAFT Content Master
      const queuedDraftVideo = await videoService.queueVideoForProduction(
        { questionId: questionWithDraftCM.id, title: 'Valid Draft CM Queue' },
        testActor
      );
      const updatedDraftQ = questionsMap.get(questionWithDraftCM.id);
      const isDraftSuccess = Boolean(
        queuedDraftVideo &&
        queuedDraftVideo.id.startsWith('BP-V-') &&
        queuedDraftVideo.contentMasterId === draftMaster.id &&
        queuedDraftVideo.status === VideoProductionStatus.QUEUED &&
        updatedDraftQ?.videoStatus === VideoProductionStatus.QUEUED
      );

      // 2. Queue video for question linked to ACTIVE Content Master
      const queuedActiveVideo = await videoService.queueVideoForProduction(
        { questionId: questionWithActiveCM.id, title: 'Valid Active CM Queue' },
        testActor
      );
      const updatedActiveQ = questionsMap.get(questionWithActiveCM.id);
      const isActiveSuccess = Boolean(
        queuedActiveVideo &&
        queuedActiveVideo.id.startsWith('BP-V-') &&
        queuedActiveVideo.contentMasterId === activeMaster.id &&
        queuedActiveVideo.status === VideoProductionStatus.QUEUED &&
        updatedActiveQ?.videoStatus === VideoProductionStatus.QUEUED
      );

      const isBothSuccess = isDraftSuccess && isActiveSuccess;
      results.push({
        testId: 13,
        name: 'valid video queue with DRAFT/ACTIVE CM -> success and existing workflow preserved',
        status: isBothSuccess ? 'PASS' : 'FAIL',
        details: isBothSuccess
          ? `Successfully queued videos for both DRAFT Content Master (${draftMaster.id}) and ACTIVE Content Master (${activeMaster.id}), preserving all video workflow semantics`
          : `Queue validation failed: Draft success=${isDraftSuccess}, Active success=${isActiveSuccess}`,
      });
    } catch (err: any) {
      results.push({
        testId: 13,
        name: 'valid video queue with DRAFT/ACTIVE CM -> success and existing workflow preserved',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // =========================================================================
    // TEST 14: ContentMaster.primaryQuestionId nonexistent Question -> ReferenceIntegrityError
    // =========================================================================
    try {
      await contentMasterService.createContentMaster(
        {
          title: 'Master with nonexistent primary Question',
          primaryQuestionId: 'BP-Q-NONEXISTENT',
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
        },
        testActor.id,
        testActor.name
      );
      results.push({
        testId: 14,
        name: 'ContentMaster.primaryQuestionId nonexistent Question -> ReferenceIntegrityError',
        status: 'FAIL',
        details: 'Expected ReferenceIntegrityError but createContentMaster succeeded',
      });
    } catch (err: any) {
      const isRefErr = err instanceof ReferenceIntegrityError || err?.name === 'ReferenceIntegrityError';
      results.push({
        testId: 14,
        name: 'ContentMaster.primaryQuestionId nonexistent Question -> ReferenceIntegrityError',
        status: isRefErr ? 'PASS' : 'FAIL',
        details: isRefErr
          ? 'Correctly threw ReferenceIntegrityError for non-existent primaryQuestionId'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 15: ContentMaster.primaryQuestionId taxonomy mismatch -> ValidationError
    // =========================================================================
    // questionWithActiveCM has topic1/subtopic1. Try to create a CM with topic2/subtopic2 referencing it.
    try {
      await contentMasterService.createContentMaster(
        {
          title: 'Master with mismatched primary Question taxonomy',
          primaryQuestionId: questionWithActiveCM.id,
          categoryId: testCategory.id,
          topicId: testTopic2.id, // Divergent topic
          subtopicId: testSubtopic2.id, // Divergent subtopic
        },
        testActor.id,
        testActor.name
      );
      results.push({
        testId: 15,
        name: 'ContentMaster.primaryQuestionId taxonomy mismatch -> ValidationError',
        status: 'FAIL',
        details: 'Expected ValidationError for primaryQuestionId taxonomy mismatch but succeeded',
      });
    } catch (err: any) {
      const isValErr = err instanceof ValidationError || err?.name === 'ValidationError';
      results.push({
        testId: 15,
        name: 'ContentMaster.primaryQuestionId taxonomy mismatch -> ValidationError',
        status: isValErr ? 'PASS' : 'FAIL',
        details: isValErr
          ? 'Correctly threw ValidationError when primaryQuestionId taxonomy diverges from CM'
          : `Unexpected error: ${err?.name} (${err?.message})`,
      });
    }

    // =========================================================================
    // TEST 16: Question creation WITHOUT explicit contentMasterId -> existing automatic CM creation behavior preserved
    // =========================================================================
    try {
      const autoCreated = await questionService.createQuestion(
        {
          categoryId: testCategory.id,
          topicId: testTopic1.id,
          subtopicId: testSubtopic1.id,
          difficulty: DifficultyLevel.EASY,
          questionText: 'Question without explicit contentMasterId (auto-create)',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'A',
          explanation: 'Auto-create test explanation',
        },
        testActor
      );
      const linkedCM = contentMastersMap.get(autoCreated.contentMasterId || '');
      const isAutoSuccess = Boolean(
        autoCreated &&
        autoCreated.id.startsWith('BP-Q-') &&
        autoCreated.contentMasterId &&
        autoCreated.contentMasterId.startsWith('BP-MST-') &&
        linkedCM &&
        linkedCM.primaryQuestionId === autoCreated.id &&
        linkedCM.status === ContentMasterStatus.ACTIVE &&
        linkedCM.categoryId === autoCreated.categoryId &&
        linkedCM.topicId === autoCreated.topicId &&
        linkedCM.subtopicId === autoCreated.subtopicId
      );
      results.push({
        testId: 16,
        name: 'Question creation WITHOUT explicit contentMasterId -> existing automatic CM creation behavior preserved',
        status: isAutoSuccess ? 'PASS' : 'FAIL',
        details: isAutoSuccess
          ? `Auto-created dedicated Content Master "${autoCreated.contentMasterId}" with primaryQuestionId="${autoCreated.id}" and matching taxonomy`
          : 'Auto-create did not produce valid matching Content Master or primary link',
      });
    } catch (err: any) {
      results.push({
        testId: 16,
        name: 'Question creation WITHOUT explicit contentMasterId -> existing automatic CM creation behavior preserved',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

  } finally {
    // Restore original repository methods
    contentMastersRepository.findById = origCMFindById;
    contentMastersRepository.findAll = origCMFindAll;
    contentMastersRepository.create = origCMCreate;
    contentMastersRepository.update = origCMUpdate;
    contentMastersRepository.updateRecord = origCMUpdateRecord;
    contentMastersRepository.appendRecord = origCMAppendRecord;

    questionsRepository.findById = origQFindById;
    questionsRepository.findAll = origQFindAll;
    questionsRepository.findByContentMasterId = origQFindByCM;
    questionsRepository.create = origQCreate;
    questionsRepository.update = origQUpdate;
    questionsRepository.updateRecord = origQUpdateRecord;
    questionsRepository.appendRecord = origQAppendRecord;

    videosRepository.findById = origVFindById;
    videosRepository.findAll = origVFindAll;
    videosRepository.findByQuestionId = origVFindByQId;
    videosRepository.create = origVCreate;
    videosRepository.update = origVUpdate;
    videosRepository.updateRecord = origVUpdateRecord;
    videosRepository.appendRecord = origVAppendRecord;

    categoriesRepository.findAll = origCatFindAll;
    categoriesRepository.findById = origCatFindById;
    topicsRepository.findAll = origTopFindAll;
    topicsRepository.findById = origTopFindById;
    subtopicsRepository.findAll = origSubFindAll;
    subtopicsRepository.findById = origSubFindById;

    sequencesRepository.allocateNextNumber = origSeqAllocate;
    questionVideosRepository.appendRecord = origQVAppend;
    workflowService.recordTransition = origWServiceRecord;
    auditLogRepository.create = origAuditLog;
    auditService.log = origAuditServiceLog;
    taxonomyService.invalidateCache();
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;

  return {
    passed: failedChecks === 0 && passedChecks === 16,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}

// CLI Execution
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('phase16-step7-referential-guardrails')) {
  runPhase16Step7Verification()
    .then((summary) => {
      console.log('\n==================================================');
      console.log('PHASE 16.7 REFERENTIAL INTEGRITY GUARDRAILS REPORT');
      console.log('==================================================');
      for (const r of summary.results) {
        console.log(`[${r.status}] Test ${r.testId}: ${r.name}`);
        console.log(`       Details: ${r.details}`);
      }
      console.log('==================================================');
      console.log(`Total: ${summary.totalChecks} | Passed: ${summary.passedChecks} | Failed: ${summary.failedChecks}`);
      console.log(`Verdict: ${summary.passed ? 'ALL CHECKS PASSED' : 'VERIFICATION FAILED'}`);
      console.log('==================================================\n');
      if (!summary.passed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error running Phase 16.7 verification:', err);
      process.exit(1);
    });
}
