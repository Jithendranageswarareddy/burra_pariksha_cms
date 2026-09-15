/**
 * BURRA PARIKSHA CMS - Phase 2 Targeted Remediation Execution
 * Executes Defect 1 and Defect 3 remediation through the mandatory Deletion Safety Pipeline.
 */

import {
  topicsRepository,
  subtopicsRepository,
  questionsRepository,
  contentMastersRepository,
  contentPlansRepository,
  sequencesRepository,
} from '../lib/repositories';
import { idService } from '../lib/services/id.service';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { SHEET_TABS } from '../lib/schemas/google-sheets-schema';

async function runSafeRemediation() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 2 TARGETED SAFE REMEDIATION');
  console.log('================================================================\n');

  googleSheetsClient.invalidateRowCache();

  // -------------------------------------------------------------
  // STEP 1: PRE-CHECK INTEGRITY & ZERO-REFERENCE VERIFICATION
  // -------------------------------------------------------------
  console.log('STEP 1: Checking synthetic records and ensuring zero foreign key references...');

  const syntheticTopics = ['BP-TOP-101', 'BP-TOP-102', 'BP-TOP-103'];
  const syntheticSubtopics = ['BP-SUB-0101', 'BP-SUB-0102', 'BP-SUB-0103'];

  const questions = await questionsRepository.findAll();
  const contentMasters = await contentMastersRepository.findAll();
  const contentPlans = await contentPlansRepository.findAll();

  for (const q of questions) {
    if (syntheticTopics.includes(q.topicId)) {
      throw new Error(`ABORT: Question ${q.id} references synthetic topic ${q.topicId}`);
    }
    if (syntheticSubtopics.includes(q.subtopicId)) {
      throw new Error(`ABORT: Question ${q.id} references synthetic subtopic ${q.subtopicId}`);
    }
  }

  for (const cm of contentMasters) {
    if (syntheticTopics.includes(cm.topicId)) {
      throw new Error(`ABORT: ContentMaster ${cm.id} references synthetic topic ${cm.topicId}`);
    }
    if (syntheticSubtopics.includes(cm.subtopicId)) {
      throw new Error(`ABORT: ContentMaster ${cm.id} references synthetic subtopic ${cm.subtopicId}`);
    }
  }

  for (const cp of contentPlans) {
    if (syntheticTopics.includes(cp.topicId)) {
      throw new Error(`ABORT: ContentPlan ${cp.id} references synthetic topic ${cp.topicId}`);
    }
    if (syntheticSubtopics.includes(cp.subtopicId)) {
      throw new Error(`ABORT: ContentPlan ${cp.id} references synthetic subtopic ${cp.subtopicId}`);
    }
  }

  console.log('✓ Verified: 0 questions, 0 content masters, and 0 content plans reference the synthetic records.\n');

  // Verify preservation targets are present
  const top100 = await topicsRepository.findById('BP-TOP-100');
  const sub0009 = await subtopicsRepository.findById('BP-SUB-0009');
  const sub0084 = await subtopicsRepository.findById('BP-SUB-0084');
  const sub0100 = await subtopicsRepository.findById('BP-SUB-0100');

  if (!top100) throw new Error('ABORT: Legitimate production record BP-TOP-100 is missing!');
  if (!sub0009) throw new Error('ABORT: Legitimate production record BP-SUB-0009 is missing!');
  if (!sub0084) throw new Error('ABORT: Legitimate production record BP-SUB-0084 is missing!');
  if (!sub0100) throw new Error('ABORT: Legitimate production record BP-SUB-0100 is missing!');

  console.log('✓ Verified: Legitimate production records (BP-TOP-100, BP-SUB-0009, BP-SUB-0084, BP-SUB-0100) are confirmed present.\n');

  // -------------------------------------------------------------
  // STEP 2: DELETE SYNTHETIC SUBTOPICS SAFELY
  // -------------------------------------------------------------
  console.log('STEP 2: Deleting 3 synthetic Subtopics via Deletion Safety Pipeline...');
  for (const subtopicId of syntheticSubtopics) {
    const existing = await subtopicsRepository.findById(subtopicId);
    if (existing) {
      console.log(`Executing verified deletion for Subtopic '${subtopicId}'...`);
      const deleted = await subtopicsRepository.deleteRecord(subtopicId, {
        actor: { id: 'PHASE2_REMEDIATION', name: 'Safe Remediation Pipeline' },
        reason: 'Phase 2 remediation of synthetic test subtopic',
      });
      console.log(`✓ Deleted Subtopic '${subtopicId}': result = ${deleted}`);
    } else {
      console.log(`Subtopic '${subtopicId}' already absent.`);
    }
  }

  // -------------------------------------------------------------
  // STEP 3: DELETE SYNTHETIC TOPICS SAFELY
  // -------------------------------------------------------------
  console.log('\nSTEP 3: Deleting 3 synthetic Topics via Deletion Safety Pipeline...');
  for (const topicId of syntheticTopics) {
    const existing = await topicsRepository.findById(topicId);
    if (existing) {
      console.log(`Executing verified deletion for Topic '${topicId}'...`);
      const deleted = await topicsRepository.deleteRecord(topicId, {
        actor: { id: 'PHASE2_REMEDIATION', name: 'Safe Remediation Pipeline' },
        reason: 'Phase 2 remediation of synthetic test topic',
      });
      console.log(`✓ Deleted Topic '${topicId}': result = ${deleted}`);
    } else {
      console.log(`Topic '${topicId}' already absent.`);
    }
  }

  // -------------------------------------------------------------
  // STEP 4: DELETE OBSOLETE CONTENT_ID SEQUENCE ROW
  // -------------------------------------------------------------
  console.log('\nSTEP 4: Deleting obsolete CONTENT_ID row from SEQUENCES worksheet via Deletion Safety Pipeline...');
  const seqs = await sequencesRepository.findAll();
  const contentIdSeq = seqs.find((s) => s.entityType === 'CONTENT_ID');
  if (contentIdSeq) {
    console.log(`Executing verified deletion for obsolete sequence row 'CONTENT_ID'...`);
    const deleted = await sequencesRepository.deleteRecord('CONTENT_ID', {
      actor: { id: 'PHASE2_REMEDIATION', name: 'Safe Remediation Pipeline' },
      reason: 'Phase 2 remediation: retired obsolete CONTENT_ID sequence entity',
    });
    console.log(`✓ Deleted 'CONTENT_ID' from SEQUENCES: result = ${deleted}`);
  } else {
    console.log(`'CONTENT_ID' already absent from SEQUENCES.`);
  }

  // -------------------------------------------------------------
  // STEP 5: POST-MUTATION READ-BACK VERIFICATION
  // -------------------------------------------------------------
  console.log('\nSTEP 5: Executing Post-Mutation Read-Back Verification...');
  googleSheetsClient.invalidateRowCache();

  const finalTopics = await topicsRepository.findAll();
  const finalSubtopics = await subtopicsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();

  console.log(`Final TOPICS count: ${finalTopics.length} (expected: 100)`);
  console.log(`Final SUBTOPICS count: ${finalSubtopics.length} (expected: 100)`);
  console.log(`Final SEQUENCES count: ${finalSequences.length} (expected: 16)`);

  if (finalTopics.length !== 100) {
    throw new Error(`POST-VERIFICATION FAILURE: TOPICS count is ${finalTopics.length}, expected 100!`);
  }
  if (finalSubtopics.length !== 100) {
    throw new Error(`POST-VERIFICATION FAILURE: SUBTOPICS count is ${finalSubtopics.length}, expected 100!`);
  }

  for (const tId of syntheticTopics) {
    if (finalTopics.some((t) => t.id === tId)) {
      throw new Error(`POST-VERIFICATION FAILURE: Synthetic Topic ${tId} is still present!`);
    }
  }

  for (const sId of syntheticSubtopics) {
    if (finalSubtopics.some((s) => s.id === sId)) {
      throw new Error(`POST-VERIFICATION FAILURE: Synthetic Subtopic ${sId} is still present!`);
    }
  }

  if (finalSequences.some((s) => s.entityType === 'CONTENT_ID')) {
    throw new Error(`POST-VERIFICATION FAILURE: CONTENT_ID sequence row is still present in SEQUENCES!`);
  }

  const contentMasterSeq = finalSequences.find((s) => s.entityType === 'CONTENT_MASTER');
  if (!contentMasterSeq) {
    throw new Error(`POST-VERIFICATION FAILURE: CONTENT_MASTER sequence row missing!`);
  }
  console.log(`✓ CONTENT_MASTER sequence: nextNumber = ${contentMasterSeq.nextNumber} (prefix = ${contentMasterSeq.prefix})`);

  // Verify CONTENT_MASTER invariant (next_number > max allocated)
  const maxContentMasterNum = contentMasters.reduce((max, cm) => {
    const match = cm.id.match(/\d+$/);
    const num = match ? parseInt(match[0], 10) : 0;
    return num > max ? num : max;
  }, 0);
  console.log(`Max allocated CONTENT_MASTER number in database: ${maxContentMasterNum}`);
  if (Number(contentMasterSeq.nextNumber) <= maxContentMasterNum) {
    throw new Error(`POST-VERIFICATION FAILURE: CONTENT_MASTER sequence invariant violated: ${contentMasterSeq.nextNumber} <= ${maxContentMasterNum}`);
  }
  console.log(`✓ Sequence invariant satisfied: ${contentMasterSeq.nextNumber} > ${maxContentMasterNum}`);

  // Verify CONTENT_ID allocation throws retired error
  try {
    await idService.allocateId('CONTENT_ID');
    throw new Error('POST-VERIFICATION FAILURE: allocateId("CONTENT_ID") did not throw!');
  } catch (err: any) {
    if (err.message.includes('RETIRED_SEQUENCE_ENTITY')) {
      console.log(`✓ allocateId("CONTENT_ID") correctly rejected with: ${err.message}`);
    } else {
      throw err;
    }
  }

  // Verify preservation targets are still intact
  const finalTop100 = await topicsRepository.findById('BP-TOP-100');
  const finalSub0009 = await subtopicsRepository.findById('BP-SUB-0009');
  const finalSub0084 = await subtopicsRepository.findById('BP-SUB-0084');
  const finalSub0100 = await subtopicsRepository.findById('BP-SUB-0100');

  if (!finalTop100 || !finalSub0009 || !finalSub0084 || !finalSub0100) {
    throw new Error('POST-VERIFICATION FAILURE: Legitimate production records were compromised!');
  }
  console.log('✓ All legitimate production records (BP-TOP-100, BP-SUB-0009, BP-SUB-0084, BP-SUB-0100) verified intact.');

  console.log('\n================================================================');
  console.log('ALL PHASE 2 TARGETED REMEDIATIONS COMPLETED AND VERIFIED 100%');
  console.log('================================================================');
}

runSafeRemediation().catch((err) => {
  console.error('\n❌ REMEDIATION SCRIPT FAILED:', err);
  process.exit(1);
});
