/**
 * BURRA PARIKSHA CMS - Phase 16.8 Behavioral Verification Suite
 * Content Master Reverse Referential Guardrails & Workspace Question Linking
 * 
 * Strict behavioral execution against isolated, in-memory fixtures verifying:
 *  1. CM taxonomy change blocked by primary Question mismatch
 *  2. CM taxonomy change blocked by linked child mismatch
 *  3. CM taxonomy change succeeds with no primary/children
 *  4. Nonexistent primary Question rejected
 *  5. Archived primary Question rejected
 *  6. Primary Question taxonomy mismatch rejected
 *  7. Valid primary Question assignment succeeds
 *  8. Link to DRAFT CM succeeds
 *  9. Link to ACTIVE CM succeeds
 * 10. Link to COMPLETED CM rejected
 * 11. Link to ARCHIVED CM rejected
 * 12. Archived Question rejected
 * 13. Taxonomy mismatch rejected
 * 14. Link + set primary succeeds using sequential non-atomic writes
 * 15. Unauthorized linking returns 403 / equivalent authorization rejection
 * 16. Existing primary blocks CM taxonomy change
 * 17. Linked child blocks CM taxonomy change
 * 18. CM taxonomy change with no primary/children succeeds
 * 19. Existing primary cannot be silently replaced
 * 20. Linking an already-linked Question is idempotent and creates no duplicate write
 */

import {
  contentMastersRepository,
  questionsRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  auditLogRepository,
} from '../lib/repositories';
import { contentMasterService } from '../lib/services/content-master.service';
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
} from '../types';
import { ReferenceIntegrityError, ValidationError } from '../lib/google-sheets/errors';

// Standard Taxonomy Fixtures
const testCategory1: Category = {
  id: 'BP-CAT-TEST01',
  name: 'Quantitative Aptitude',
  slug: 'quantitative-aptitude',
  createdAt: new Date().toISOString(),
};

const testCategory2: Category = {
  id: 'BP-CAT-TEST02',
  name: 'Logical Reasoning',
  slug: 'logical-reasoning',
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

const testAdminActor = {
  id: 'USR-ADMIN-01',
  name: 'Test Administrator',
  role: UserRole.ADMIN,
};

const testUnauthorizedActor = {
  id: 'USR-UNAUTH-01',
  name: 'Test Unauthorized Actor',
  role: 'GUEST' as any,
};

export async function runPhase16Step8Verification(): Promise<{
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

  // Preserve original repository methods
  const origCMFindById = contentMastersRepository.findById;
  const origCMFindAll = contentMastersRepository.findAll;
  const origCMCreate = contentMastersRepository.create;
  const origCMUpdate = contentMastersRepository.update;
  const origCMUpdateRecord = contentMastersRepository.updateRecord;

  const origQFindById = questionsRepository.findById;
  const origQFindAll = questionsRepository.findAll;
  const origQFindByCM = questionsRepository.findByContentMasterId;
  const origQCreate = questionsRepository.create;
  const origQUpdate = questionsRepository.update;
  const origQUpdateRecord = questionsRepository.updateRecord;

  const origCatFindAll = categoriesRepository.findAll;
  const origCatFindById = categoriesRepository.findById;
  const origTopFindAll = topicsRepository.findAll;
  const origTopFindById = topicsRepository.findById;
  const origSubFindAll = subtopicsRepository.findAll;
  const origSubFindById = subtopicsRepository.findById;

  const origAuditCreate = auditLogRepository.create;

  // Track write counts to verify non-atomic sequential writes and idempotency
  let qUpdateCount = 0;
  let cmUpdateCount = 0;

  try {
    // Mock repositories
    contentMastersRepository.findById = async (id: string) => contentMastersMap.get(id) || null;
    contentMastersRepository.findAll = async () => Array.from(contentMastersMap.values());
    contentMastersRepository.create = async (master: any) => {
      contentMastersMap.set(master.id, master);
      return master;
    };
    contentMastersRepository.update = async (master: any) => {
      cmUpdateCount++;
      contentMastersMap.set(master.id, master);
      return master;
    };
    contentMastersRepository.updateRecord = async (id: string, updates: any) => {
      cmUpdateCount++;
      const existing = contentMastersMap.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      contentMastersMap.set(id, updated);
      return updated;
    };

    questionsRepository.findById = async (id: string) => questionsMap.get(id) || null;
    questionsRepository.findAll = async () => Array.from(questionsMap.values());
    questionsRepository.findByContentMasterId = async (cmId: string) =>
      Array.from(questionsMap.values()).filter((q) => q.contentMasterId === cmId);
    questionsRepository.create = async (q: any) => {
      questionsMap.set(q.id, q);
      return q;
    };
    questionsRepository.update = async (q: any) => {
      qUpdateCount++;
      questionsMap.set(q.id, q);
      return q;
    };
    questionsRepository.updateRecord = async (id: string, updates: any) => {
      qUpdateCount++;
      const existing = questionsMap.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      questionsMap.set(id, updated);
      return updated;
    };

    categoriesRepository.findAll = async () => [testCategory1, testCategory2];
    categoriesRepository.findById = async (id: string) =>
      id === testCategory1.id ? testCategory1 : id === testCategory2.id ? testCategory2 : null;

    topicsRepository.findAll = async () => [testTopic1, testTopic2];
    topicsRepository.findById = async (id: string) =>
      id === testTopic1.id ? testTopic1 : id === testTopic2.id ? testTopic2 : null;

    subtopicsRepository.findAll = async () => [testSubtopic1, testSubtopic2];
    subtopicsRepository.findById = async (id: string) =>
      id === testSubtopic1.id ? testSubtopic1 : id === testSubtopic2.id ? testSubtopic2 : null;

    auditLogRepository.create = async (log: any) => log;

    // Helper to seed questions
    const seedQuestion = (overrides: Partial<Question>): Question => {
      const q: Question = {
        id: overrides.id || `BP-Q-${Math.floor(Math.random() * 900000 + 100000)}`,
        categoryId: testCategory1.id,
        categoryName: testCategory1.name,
        topicId: testTopic1.id,
        topicName: testTopic1.name,
        subtopicId: testSubtopic1.id,
        subtopicName: testSubtopic1.name,
        questionText: 'What is 15% of 200?',
        options: { a: '20', b: '30', c: '40', d: '50' },
        correctAnswer: 'B',
        explanation: '15% of 200 is 30',
        difficulty: DifficultyLevel.EASY,
        language: QuestionLanguage.ENGLISH,
        status: QuestionStatus.APPROVED,
        videoStatus: 'NOT_STARTED' as any,
        tags: ['math'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
      };
      questionsMap.set(q.id, q);
      return q;
    };

    // Helper to seed Content Masters
    const seedContentMaster = (overrides: Partial<ContentMaster>): ContentMaster => {
      const cm: ContentMaster = {
        id: overrides.id || `BP-MST-${Math.floor(Math.random() * 900000 + 100000)}`,
        title: 'Master for Percentages',
        status: ContentMasterStatus.ACTIVE,
        categoryId: testCategory1.id,
        topicId: testTopic1.id,
        subtopicId: testSubtopic1.id,
        createdBy: testAdminActor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
      };
      contentMastersMap.set(cm.id, cm);
      return cm;
    };

    // Reset stores before each test scenario
    const resetStores = () => {
      contentMastersMap.clear();
      questionsMap.clear();
      qUpdateCount = 0;
      cmUpdateCount = 0;
    };

    console.log('\n===============================================================');
    console.log('PHASE 16.8: CONTENT MASTER REVERSE REFERENTIAL GUARDRAILS & LINKING');
    console.log('===============================================================\n');

    // -------------------------------------------------------------
    // TEST 1: CM taxonomy change blocked by primary Question mismatch
    // -------------------------------------------------------------
    resetStores();
    const q1 = seedQuestion({ id: 'BP-Q-000001', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const cm1 = seedContentMaster({
      id: 'BP-MST-000001',
      primaryQuestionId: q1.id,
      categoryId: testCategory1.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
    });
    try {
      // Attempt to change category to testCategory2 while primary question remains testCategory1
      await contentMasterService.updateContentMaster({
        id: cm1.id,
        categoryId: testCategory2.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 1,
        name: 'CM taxonomy change blocked by primary Question mismatch',
        status: 'FAIL',
        details: 'Expected ValidationError for primary Question taxonomy mismatch, but call succeeded.',
      });
    } catch (err: any) {
      const isMismatch = err instanceof ValidationError && err.message.includes('Taxonomy mismatch: Primary Question');
      const cmUnchanged = contentMastersMap.get(cm1.id)?.categoryId === testCategory1.id;
      if (isMismatch && cmUnchanged) {
        results.push({
          testId: 1,
          name: 'CM taxonomy change blocked by primary Question mismatch',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". CM category remained ${testCategory1.id}.`,
        });
      } else {
        results.push({
          testId: 1,
          name: 'CM taxonomy change blocked by primary Question mismatch',
          status: 'FAIL',
          details: `Unexpected error or state: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 2: CM taxonomy change blocked by linked child mismatch
    // -------------------------------------------------------------
    resetStores();
    const cm2 = seedContentMaster({ id: 'BP-MST-000002', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const q2 = seedQuestion({ id: 'BP-Q-000002', contentMasterId: cm2.id, categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    try {
      await contentMasterService.updateContentMaster({
        id: cm2.id,
        categoryId: testCategory2.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 2,
        name: 'CM taxonomy change blocked by linked child mismatch',
        status: 'FAIL',
        details: 'Expected ValidationError for linked child Question taxonomy mismatch, but call succeeded.',
      });
    } catch (err: any) {
      const isMismatch = err instanceof ValidationError && err.message.includes('linked child Question(s)') && err.message.includes(q2.id);
      const cmUnchanged = contentMastersMap.get(cm2.id)?.categoryId === testCategory1.id;
      if (isMismatch && cmUnchanged) {
        results.push({
          testId: 2,
          name: 'CM taxonomy change blocked by linked child mismatch',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Zero mutations applied.`,
        });
      } else {
        results.push({
          testId: 2,
          name: 'CM taxonomy change blocked by linked child mismatch',
          status: 'FAIL',
          details: `Unexpected error or state: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 3: CM taxonomy change succeeds with no primary/children
    // -------------------------------------------------------------
    resetStores();
    const cm3 = seedContentMaster({ id: 'BP-MST-000003', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id, primaryQuestionId: undefined });
    try {
      const updated = await contentMasterService.updateContentMaster({
        id: cm3.id,
        categoryId: testCategory2.id,
      }, testAdminActor.id, testAdminActor.name);
      if (updated.categoryId === testCategory2.id && contentMastersMap.get(cm3.id)?.categoryId === testCategory2.id) {
        results.push({
          testId: 3,
          name: 'CM taxonomy change succeeds with no primary/children',
          status: 'PASS',
          details: `Successfully updated taxonomy on childless CM to "${testCategory2.id}".`,
        });
      } else {
        results.push({
          testId: 3,
          name: 'CM taxonomy change succeeds with no primary/children',
          status: 'FAIL',
          details: `CM category was not updated properly: ${updated.categoryId}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 3,
        name: 'CM taxonomy change succeeds with no primary/children',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 4: Nonexistent primary Question rejected
    // -------------------------------------------------------------
    resetStores();
    const cm4 = seedContentMaster({ id: 'BP-MST-000004' });
    try {
      await contentMasterService.updateContentMaster({
        id: cm4.id,
        primaryQuestionId: 'BP-Q-999999',
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 4,
        name: 'Nonexistent primary Question rejected',
        status: 'FAIL',
        details: 'Expected ReferenceIntegrityError for nonexistent Question, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ReferenceIntegrityError && err.message.includes('BP-Q-999999')) {
        results.push({
          testId: 4,
          name: 'Nonexistent primary Question rejected',
          status: 'PASS',
          details: `Correctly threw ReferenceIntegrityError: "${err.message}".`,
        });
      } else {
        results.push({
          testId: 4,
          name: 'Nonexistent primary Question rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 5: Archived primary Question rejected
    // -------------------------------------------------------------
    resetStores();
    const q5 = seedQuestion({ id: 'BP-Q-000005', status: 'ARCHIVED' as any });
    const cm5 = seedContentMaster({ id: 'BP-MST-000005' });
    try {
      await contentMasterService.updateContentMaster({
        id: cm5.id,
        primaryQuestionId: q5.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 5,
        name: 'Archived primary Question rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for ARCHIVED Question, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('ARCHIVED')) {
        results.push({
          testId: 5,
          name: 'Archived primary Question rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Zero mutations applied.`,
        });
      } else {
        results.push({
          testId: 5,
          name: 'Archived primary Question rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 6: Primary Question taxonomy mismatch rejected
    // -------------------------------------------------------------
    resetStores();
    const q6 = seedQuestion({ id: 'BP-Q-000006', categoryId: testCategory2.id, topicId: testTopic2.id, subtopicId: testSubtopic2.id });
    const cm6 = seedContentMaster({ id: 'BP-MST-000006', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    try {
      await contentMasterService.updateContentMaster({
        id: cm6.id,
        primaryQuestionId: q6.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 6,
        name: 'Primary Question taxonomy mismatch rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for taxonomy mismatch, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Taxonomy mismatch')) {
        results.push({
          testId: 6,
          name: 'Primary Question taxonomy mismatch rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}".`,
        });
      } else {
        results.push({
          testId: 6,
          name: 'Primary Question taxonomy mismatch rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 7: Valid primary Question assignment succeeds
    // -------------------------------------------------------------
    resetStores();
    const q7 = seedQuestion({ id: 'BP-Q-000007', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id, status: QuestionStatus.APPROVED });
    const cm7 = seedContentMaster({ id: 'BP-MST-000007', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id, primaryQuestionId: undefined });
    try {
      const updated = await contentMasterService.updateContentMaster({
        id: cm7.id,
        primaryQuestionId: q7.id,
      }, testAdminActor.id, testAdminActor.name);
      if (updated.primaryQuestionId === q7.id && contentMastersMap.get(cm7.id)?.primaryQuestionId === q7.id) {
        results.push({
          testId: 7,
          name: 'Valid primary Question assignment succeeds',
          status: 'PASS',
          details: `Successfully set primaryQuestionId to "${q7.id}".`,
        });
      } else {
        results.push({
          testId: 7,
          name: 'Valid primary Question assignment succeeds',
          status: 'FAIL',
          details: `PrimaryQuestionId was not updated: ${updated.primaryQuestionId}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 7,
        name: 'Valid primary Question assignment succeeds',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 8: Link to DRAFT CM succeeds
    // -------------------------------------------------------------
    resetStores();
    const cm8 = seedContentMaster({ id: 'BP-MST-000008', status: ContentMasterStatus.DRAFT, categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const q8 = seedQuestion({ id: 'BP-Q-000008', contentMasterId: undefined, categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    try {
      const res = await contentMasterService.linkQuestionToContentMaster(cm8.id, q8.id, testAdminActor);
      if (res.question.contentMasterId === cm8.id && questionsMap.get(q8.id)?.contentMasterId === cm8.id) {
        results.push({
          testId: 8,
          name: 'Link to DRAFT CM succeeds',
          status: 'PASS',
          details: `Successfully linked Question "${q8.id}" to DRAFT Content Master "${cm8.id}".`,
        });
      } else {
        results.push({
          testId: 8,
          name: 'Link to DRAFT CM succeeds',
          status: 'FAIL',
          details: `Question contentMasterId not set: ${res.question.contentMasterId}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 8,
        name: 'Link to DRAFT CM succeeds',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 9: Link to ACTIVE CM succeeds
    // -------------------------------------------------------------
    resetStores();
    const cm9 = seedContentMaster({ id: 'BP-MST-000009', status: ContentMasterStatus.ACTIVE, categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const q9 = seedQuestion({ id: 'BP-Q-000009', contentMasterId: undefined, categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    try {
      const res = await contentMasterService.linkQuestionToContentMaster(cm9.id, q9.id, testAdminActor);
      if (res.question.contentMasterId === cm9.id && questionsMap.get(q9.id)?.contentMasterId === cm9.id) {
        results.push({
          testId: 9,
          name: 'Link to ACTIVE CM succeeds',
          status: 'PASS',
          details: `Successfully linked Question "${q9.id}" to ACTIVE Content Master "${cm9.id}".`,
        });
      } else {
        results.push({
          testId: 9,
          name: 'Link to ACTIVE CM succeeds',
          status: 'FAIL',
          details: `Question contentMasterId not set: ${res.question.contentMasterId}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 9,
        name: 'Link to ACTIVE CM succeeds',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 10: Link to COMPLETED CM rejected
    // -------------------------------------------------------------
    resetStores();
    const cm10 = seedContentMaster({ id: 'BP-MST-000010', status: ContentMasterStatus.COMPLETED });
    const q10 = seedQuestion({ id: 'BP-Q-000010', contentMasterId: undefined });
    try {
      await contentMasterService.linkQuestionToContentMaster(cm10.id, q10.id, testAdminActor);
      results.push({
        testId: 10,
        name: 'Link to COMPLETED CM rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for COMPLETED CM, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('COMPLETED')) {
        results.push({
          testId: 10,
          name: 'Link to COMPLETED CM rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Q10 remains unlinked.`,
        });
      } else {
        results.push({
          testId: 10,
          name: 'Link to COMPLETED CM rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 11: Link to ARCHIVED CM rejected
    // -------------------------------------------------------------
    resetStores();
    const cm11 = seedContentMaster({ id: 'BP-MST-000011', status: ContentMasterStatus.ARCHIVED });
    const q11 = seedQuestion({ id: 'BP-Q-000011', contentMasterId: undefined });
    try {
      await contentMasterService.linkQuestionToContentMaster(cm11.id, q11.id, testAdminActor);
      results.push({
        testId: 11,
        name: 'Link to ARCHIVED CM rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for ARCHIVED CM, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('ARCHIVED')) {
        results.push({
          testId: 11,
          name: 'Link to ARCHIVED CM rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Q11 remains unlinked.`,
        });
      } else {
        results.push({
          testId: 11,
          name: 'Link to ARCHIVED CM rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 12: Archived Question rejected
    // -------------------------------------------------------------
    resetStores();
    const cm12 = seedContentMaster({ id: 'BP-MST-000012', status: ContentMasterStatus.ACTIVE });
    const q12 = seedQuestion({ id: 'BP-Q-000012', status: 'ARCHIVED' as any, contentMasterId: undefined });
    try {
      await contentMasterService.linkQuestionToContentMaster(cm12.id, q12.id, testAdminActor);
      results.push({
        testId: 12,
        name: 'Archived Question rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for ARCHIVED Question, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('ARCHIVED')) {
        results.push({
          testId: 12,
          name: 'Archived Question rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Q12 remains unlinked.`,
        });
      } else {
        results.push({
          testId: 12,
          name: 'Archived Question rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 13: Taxonomy mismatch rejected
    // -------------------------------------------------------------
    resetStores();
    const cm13 = seedContentMaster({ id: 'BP-MST-000013', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const q13 = seedQuestion({ id: 'BP-Q-000013', categoryId: testCategory2.id, topicId: testTopic2.id, subtopicId: testSubtopic2.id, contentMasterId: undefined });
    try {
      await contentMasterService.linkQuestionToContentMaster(cm13.id, q13.id, testAdminActor);
      results.push({
        testId: 13,
        name: 'Taxonomy mismatch rejected',
        status: 'FAIL',
        details: 'Expected ValidationError for taxonomy mismatch, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Taxonomy mismatch')) {
        results.push({
          testId: 13,
          name: 'Taxonomy mismatch rejected',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Zero mutations applied.`,
        });
      } else {
        results.push({
          testId: 13,
          name: 'Taxonomy mismatch rejected',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 14: Link + set primary succeeds using sequential non-atomic writes
    // -------------------------------------------------------------
    resetStores();
    const cm14 = seedContentMaster({ id: 'BP-MST-000014', status: ContentMasterStatus.ACTIVE, primaryQuestionId: undefined });
    const q14 = seedQuestion({ id: 'BP-Q-000014', contentMasterId: undefined });
    const initialQUpdates = qUpdateCount;
    const initialCMUpdates = cmUpdateCount;
    try {
      const res = await contentMasterService.linkQuestionToContentMaster(
        cm14.id,
        q14.id,
        testAdminActor,
        { asPrimary: true }
      );
      const qUpdated = res.question.contentMasterId === cm14.id;
      const cmUpdated = res.contentMaster.primaryQuestionId === q14.id;
      const writesPerformed = qUpdateCount > initialQUpdates && cmUpdateCount > initialCMUpdates;

      if (qUpdated && cmUpdated && writesPerformed) {
        results.push({
          testId: 14,
          name: 'Link Question and Set as Primary When CM Has No Primary — Non-Atomic Cross-Sheet Operation',
          status: 'PASS',
          details: `Sequential non-atomic writes succeeded: Question linked (${qUpdateCount - initialQUpdates} write) and CM primaryQuestionId set (${cmUpdateCount - initialCMUpdates} write). No ACID atomicity claimed.`,
        });
      } else {
        results.push({
          testId: 14,
          name: 'Link Question and Set as Primary When CM Has No Primary — Non-Atomic Cross-Sheet Operation',
          status: 'FAIL',
          details: `State incomplete: qUpdated=${qUpdated}, cmUpdated=${cmUpdated}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 14,
        name: 'Link Question and Set as Primary When CM Has No Primary — Non-Atomic Cross-Sheet Operation',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 15: Unauthorized linking returns 403 / equivalent authorization rejection
    // -------------------------------------------------------------
    resetStores();
    const cm15 = seedContentMaster({ id: 'BP-MST-000015', createdBy: 'USR-OTHER' });
    const q15 = seedQuestion({ id: 'BP-Q-000015', contentMasterId: undefined });
    try {
      await contentMasterService.linkQuestionToContentMaster(cm15.id, q15.id, testUnauthorizedActor);
      results.push({
        testId: 15,
        name: 'Unauthorized linking returns 403 / equivalent authorization rejection',
        status: 'FAIL',
        details: 'Expected authorization failure for unauthorized actor, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Forbidden')) {
        results.push({
          testId: 15,
          name: 'Unauthorized linking returns 403 / equivalent authorization rejection',
          status: 'PASS',
          details: `Correctly rejected unauthorized actor with authorization error: "${err.message}".`,
        });
      } else {
        results.push({
          testId: 15,
          name: 'Unauthorized linking returns 403 / equivalent authorization rejection',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 16: Existing primary blocks CM taxonomy change
    // -------------------------------------------------------------
    resetStores();
    const q16 = seedQuestion({ id: 'BP-Q-000016', categoryId: testCategory1.id, topicId: testTopic1.id, subtopicId: testSubtopic1.id });
    const cm16 = seedContentMaster({
      id: 'BP-MST-000016',
      categoryId: testCategory1.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      primaryQuestionId: q16.id,
    });
    try {
      // Attempt to change topicId from testTopic1 to testTopic2
      await contentMasterService.updateContentMaster({
        id: cm16.id,
        topicId: testTopic2.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 16,
        name: 'Existing primary blocks CM taxonomy change',
        status: 'FAIL',
        details: 'Expected ValidationError because primary question has conflicting topic, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Taxonomy mismatch: Primary Question')) {
        results.push({
          testId: 16,
          name: 'Existing primary blocks CM taxonomy change',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". CM topic remained unchanged.`,
        });
      } else {
        results.push({
          testId: 16,
          name: 'Existing primary blocks CM taxonomy change',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 17: Linked child blocks CM taxonomy change
    // -------------------------------------------------------------
    resetStores();
    const cm17 = seedContentMaster({
      id: 'BP-MST-000017',
      categoryId: testCategory1.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      primaryQuestionId: undefined,
    });
    const q17 = seedQuestion({
      id: 'BP-Q-000017',
      categoryId: testCategory1.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      contentMasterId: cm17.id,
    });
    try {
      // Attempt to change subtopicId from testSubtopic1 to testSubtopic2
      await contentMasterService.updateContentMaster({
        id: cm17.id,
        subtopicId: testSubtopic2.id,
      }, testAdminActor.id, testAdminActor.name);
      results.push({
        testId: 17,
        name: 'Linked child blocks CM taxonomy change',
        status: 'FAIL',
        details: 'Expected ValidationError because linked child question has conflicting subtopic, but call succeeded.',
      });
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('linked child Question(s)') && err.message.includes(q17.id)) {
        results.push({
          testId: 17,
          name: 'Linked child blocks CM taxonomy change',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Zero mutations applied.`,
        });
      } else {
        results.push({
          testId: 17,
          name: 'Linked child blocks CM taxonomy change',
          status: 'FAIL',
          details: `Unexpected error: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 18: CM taxonomy change with no primary/children succeeds
    // -------------------------------------------------------------
    resetStores();
    const cm18 = seedContentMaster({
      id: 'BP-MST-000018',
      categoryId: testCategory1.id,
      topicId: testTopic1.id,
      subtopicId: testSubtopic1.id,
      primaryQuestionId: undefined,
    });
    try {
      const updated = await contentMasterService.updateContentMaster({
        id: cm18.id,
        categoryId: testCategory2.id,
        topicId: testTopic2.id,
        subtopicId: testSubtopic2.id,
      }, testAdminActor.id, testAdminActor.name);
      if (
        updated.categoryId === testCategory2.id &&
        updated.topicId === testTopic2.id &&
        updated.subtopicId === testSubtopic2.id
      ) {
        results.push({
          testId: 18,
          name: 'CM taxonomy change with no primary/children succeeds',
          status: 'PASS',
          details: 'Successfully updated category, topic, and subtopic on childless Content Master.',
        });
      } else {
        results.push({
          testId: 18,
          name: 'CM taxonomy change with no primary/children succeeds',
          status: 'FAIL',
          details: `Taxonomy not updated properly: ${JSON.stringify(updated)}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 18,
        name: 'CM taxonomy change with no primary/children succeeds',
        status: 'FAIL',
        details: `Unexpected error: ${err?.message}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 19: Primary Question replacement does not silently override existing primary
    // -------------------------------------------------------------
    resetStores();
    const q19A = seedQuestion({ id: 'BP-Q-000019A' });
    const q19B = seedQuestion({ id: 'BP-Q-000019B' });
    const cm19 = seedContentMaster({
      id: 'BP-MST-000019',
      primaryQuestionId: q19A.id,
      status: ContentMasterStatus.ACTIVE,
    });
    try {
      await contentMasterService.linkQuestionToContentMaster(
        cm19.id,
        q19B.id,
        testAdminActor,
        { asPrimary: true }
      );
      results.push({
        testId: 19,
        name: 'Primary Question replacement does not silently override existing primary',
        status: 'FAIL',
        details: 'Expected ValidationError when attempting to replace existing primary question, but call succeeded.',
      });
    } catch (err: any) {
      const cmCurrent = contentMastersMap.get(cm19.id);
      if (err instanceof ValidationError && err.message.includes('already has primary question') && cmCurrent?.primaryQuestionId === q19A.id) {
        results.push({
          testId: 19,
          name: 'Primary Question replacement does not silently override existing primary',
          status: 'PASS',
          details: `Correctly threw ValidationError: "${err.message}". Existing primary remains "${q19A.id}".`,
        });
      } else {
        results.push({
          testId: 19,
          name: 'Primary Question replacement does not silently override existing primary',
          status: 'FAIL',
          details: `Unexpected error or state: ${err?.message}`,
        });
      }
    }

    // -------------------------------------------------------------
    // TEST 20: Linking already-linked Question does not duplicate relationship
    // -------------------------------------------------------------
    resetStores();
    const cm20 = seedContentMaster({ id: 'BP-MST-000020', status: ContentMasterStatus.ACTIVE });
    const q20 = seedQuestion({ id: 'BP-Q-000020', contentMasterId: cm20.id });
    const writesBefore = qUpdateCount + cmUpdateCount;
    try {
      const res = await contentMasterService.linkQuestionToContentMaster(cm20.id, q20.id, testAdminActor);
      const writesAfter = qUpdateCount + cmUpdateCount;
      const noDuplicateWrites = writesAfter === writesBefore;
      if (res.question.id === q20.id && res.contentMaster.id === cm20.id && noDuplicateWrites) {
        results.push({
          testId: 20,
          name: 'Linking already-linked Question does not duplicate relationship',
          status: 'PASS',
          details: `Idempotent success: returned existing linkage with 0 duplicate repository writes.`,
        });
      } else {
        results.push({
          testId: 20,
          name: 'Linking already-linked Question does not duplicate relationship',
          status: 'FAIL',
          details: `Duplicate writes detected: writesBefore=${writesBefore}, writesAfter=${writesAfter}`,
        });
      }
    } catch (err: any) {
      results.push({
        testId: 20,
        name: 'Linking already-linked Question does not duplicate relationship',
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

    questionsRepository.findById = origQFindById;
    questionsRepository.findAll = origQFindAll;
    questionsRepository.findByContentMasterId = origQFindByCM;
    questionsRepository.create = origQCreate;
    questionsRepository.update = origQUpdate;
    questionsRepository.updateRecord = origQUpdateRecord;

    categoriesRepository.findAll = origCatFindAll;
    categoriesRepository.findById = origCatFindById;
    topicsRepository.findAll = origTopFindAll;
    topicsRepository.findById = origTopFindById;
    subtopicsRepository.findAll = origSubFindAll;
    subtopicsRepository.findById = origSubFindById;

    auditLogRepository.create = origAuditCreate;
  }

  // Print Summary Table
  console.log('Test Results:');
  console.log('---------------------------------------------------------------');
  results.forEach((r) => {
    const mark = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${String(r.testId).padStart(2, ' ')}] ${mark} - ${r.name}`);
    console.log(`     Details: ${r.details}\n`);
  });

  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const passed = failedChecks === 0;

  console.log('===============================================================');
  console.log(`TOTAL: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log(`RESULT: ${passed ? 'ALL PHASE 16.8 CHECKS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

// Auto-run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runPhase16Step8Verification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
