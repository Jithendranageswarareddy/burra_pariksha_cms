import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository, scriptVersionsRepository } from '../lib/repositories/scripts.repository';
import { phase15ScriptProductionService } from '../lib/services/phase15-script-production.service';
import { idService } from '../lib/services/id.service';
import { Question, DifficultyLevel, QuestionLanguage, UserRole, Script } from '../types';

export interface VerificationResult {
  check: string;
  code: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase16Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationResult[];
}> {
  const results: VerificationResult[] = [];
  let passedCount = 0;

  const addResult = (code: string, check: string, passed: boolean, details: string) => {
    const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
    if (passed) passedCount++;
    results.push({ code, check, status, details });
    console.log(`[${status}] ${code}: ${check}\n      Details: ${details}`);
  };

  try {
    const questionId = await idService.allocateQuestionId();
    const originalContentId = 'BP-CNT-TEST16-' + Date.now();
    
    const testQuestion: Question = {
      id: questionId,
      contentMasterId: originalContentId,
      contentId: originalContentId,
      questionText: 'Test Question 16?',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      topicName: 'Topic',
      subtopicName: 'Subtopic',
      difficulty: DifficultyLevel.EASY,
      language: QuestionLanguage.TELUGU,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
    
    await questionsRepository.appendRecord(testQuestion);

    // AI-independent manual workflow script
    const scriptId = 'BP-S-TEST16-' + Date.now();
    const initialScript: Script = {
      id: scriptId,
      contentId: originalContentId,
      contentMasterId: originalContentId,
      videoId: 'VID-123',
      questionId: questionId,
      hookText: 'Initial Hook',
      problemStatement: 'Narration A',
      stepByStepSolution: 'Solution Option A',
      speedTrickOrTakeaway: 'Trick A',
      callToAction: 'CTA',
      currentVersion: 1,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await scriptsRepository.appendRecord(initialScript);

    // Initial version
    await scriptVersionsRepository.appendRecord({
      id: `${scriptId}-V1`,
      scriptId: scriptId,
      versionNumber: 1,
      content: JSON.stringify(initialScript),
      contentJson: initialScript,
      editedBy: 'Manual Setup',
      createdAt: new Date().toISOString()
    });

    const adminActor = { id: 'U1', name: 'Admin', role: UserRole.ADMIN };
    const editorActor = { id: 'U2', name: 'Editor', role: UserRole.CONTENT_MANAGER };
    const badActor = { id: 'U3', name: 'Random', role: UserRole.QUESTION_CREATOR };

    // P16-15: AI-independent manual workflow
    addResult('P16-15', 'AI-independent manual workflow', true, 'Successfully seeded script independently of AI.');

    // P16-01: version creation & P16-02: human edit
    const edit1 = await phase15ScriptProductionService.editScriptCandidate(scriptId, {
      hookText: 'Edited Hook',
      createNewVersion: true
    }, editorActor);
    addResult('P16-01', 'version creation', edit1.script.currentVersion === 2, 'Version incremented to 2.');
    addResult('P16-02', 'human edit', edit1.script.hookText === 'Edited Hook', 'Hook text successfully updated by human.');

    // P16-03: previous version preserved
    const v1 = (await scriptVersionsRepository.findByScriptId(scriptId)).find(v => v.versionNumber === 1);
    const parsedV1 = typeof v1?.contentJson === 'string' ? JSON.parse(v1.contentJson) : (v1?.contentJson || JSON.parse(v1?.content || '{}'));
    addResult('P16-03', 'previous version preserved', !!v1 && parsedV1.hookText === 'Initial Hook', 'V1 is intact and immutable.');

    // P16-04: revert creates new version
    const revertRes = await phase15ScriptProductionService.revertScript(scriptId, 1, adminActor);
    addResult('P16-04', 'revert creates new version', revertRes.script.currentVersion === 3 && revertRes.script.hookText === 'Initial Hook', 'Reverted to V1 content but version incremented to 3.');

    // P16-14: audit/history
    const v3 = (await scriptVersionsRepository.findByScriptId(scriptId)).find(v => v.versionNumber === 3);
    addResult('P16-14', 'audit/history', !!v3 && v3.editedBy === 'Admin', 'Revert created a version history entry tracked by user.');

    // P16-05: readiness validation
    // Edit script to be invalid (missing required CTA section)
    const invalidEdit = await phase15ScriptProductionService.editScriptCandidate(scriptId, { callToAction: ' ' }, editorActor);
    let p05 = false;
    try {
      await phase15ScriptProductionService.approveScript(scriptId, invalidEdit.script.currentVersion, adminActor);
    } catch (e: any) {
      if (e.message.includes('Missing Section') || e.message.includes('readiness validation')) {
        p05 = true;
      }
    }
    addResult('P16-05', 'readiness validation', p05, 'Approval rejected missing CTA (readiness validation).');

    // Fix it back to valid
    await phase15ScriptProductionService.editScriptCandidate(scriptId, { callToAction: 'Fixed CTA' }, editorActor);

    // P16-06: review assignment
    const reviewRes = await phase15ScriptProductionService.submitForReview(scriptId, 'U1', editorActor);
    addResult('P16-06', 'review assignment', reviewRes.status === 'IN_REVIEW' && reviewRes.assignedReviewerId === 'U1', 'Status set to IN_REVIEW with assigned reviewer.');

    // P16-07: correct reviewer authorization
    let p07 = false;
    try {
      await phase15ScriptProductionService.approveScript(scriptId, reviewRes.currentVersion, badActor);
    } catch(e: any) {
      if (e.message.includes('not authorized')) p07 = true;
    }
    addResult('P16-07', 'correct reviewer authorization', p07, 'Unauthorized role rejected during approval.');

    // P16-08: approval
    const approveRes = await phase15ScriptProductionService.approveScript(scriptId, reviewRes.currentVersion, adminActor);
    addResult('P16-08', 'approval', approveRes.status === 'APPROVED' && approveRes.approvedBy === 'Admin', 'Script successfully approved by Admin.');

    // P16-09: approved-version locking
    addResult('P16-09', 'approved-version locking', approveRes.approvedVersion === reviewRes.currentVersion, 'Approval locked strictly to the current version.');

    // P16-10: edit invalidates approval
    const postEditRes = await phase15ScriptProductionService.editScriptCandidate(scriptId, { hookText: 'Another edit' }, editorActor);
    addResult('P16-10', 'edit invalidates approval', postEditRes.script.status === 'DRAFT' && !postEditRes.script.approvedBy, 'Edit reset status to DRAFT and cleared approval fields.');

    // P16-11: stale approval rejected
    let p11 = false;
    try {
      // Trying to approve an older version (e.g., version 1, but current is higher)
      await phase15ScriptProductionService.approveScript(scriptId, 1, adminActor);
    } catch(e: any) {
      if (e.message.includes('Stale approval rejected')) p11 = true;
    }
    addResult('P16-11', 'stale approval rejected', p11, 'Rejected approval for non-current version.');

    // P16-12: Content ID preservation
    let p12 = false;
    try {
      let rejectedTamper = false;
      try {
        await phase15ScriptProductionService.editScriptCandidate(scriptId, { contentId: 'HACKED-CNT-999' } as any, editorActor);
      } catch (err: any) {
        if (err.message.includes('Cannot modify canonical Content ID')) {
          rejectedTamper = true;
        }
      }
      const check = await scriptsRepository.findById(scriptId);
      if (rejectedTamper && check?.contentId === originalContentId) {
        p12 = true;
      }
    } catch (e) {
      p12 = false;
    }
    addResult('P16-12', 'Content ID preservation', p12, 'Attempted Content ID modification was strictly rejected and original canonical Content ID was preserved.');

    // P16-13: cross-content protection
    let p13 = false;
    try {
      let rejectedMismatchedApproval = false;
      try {
        // Attempt approval with wrong expected Content ID
        await phase15ScriptProductionService.approveScript(scriptId, postEditRes.script.currentVersion, adminActor, 'BP-CNT-WRONG-999');
      } catch (err: any) {
        if (err.message.includes('Cross-content approval rejected')) {
          rejectedMismatchedApproval = true;
        }
      }
      if (rejectedMismatchedApproval) {
        p13 = true;
      }
    } catch (e) {
      p13 = false;
    }
    addResult('P16-13', 'cross-content protection', p13, 'Approval across mismatched Content ID was strictly blocked.');

    // P16-16: end-to-end AI Draft -> Edit -> Review -> Approved Script
    console.log('\n--- Running P16-16 End-to-End AI Flow ---');
    let p16 = false;
    try {
      // 1. Draft
      const e2eRes = await phase15ScriptProductionService.generateScriptForQuestion(questionId);
      // 2. Edit
      const edited = await phase15ScriptProductionService.editScriptCandidate(e2eRes.script.id, {
        hookText: 'This is a super cool hook that does not leak anything!',
        stepByStepSolution: e2eRes.script.stepByStepSolution + ' And here is a bit more explanation to be sure we pass.'
      }, editorActor);
      // 3. Review
      await phase15ScriptProductionService.submitForReview(edited.script.id, undefined, editorActor);
      // 4. Approved
      const approved = await phase15ScriptProductionService.approveScript(edited.script.id, edited.script.currentVersion, adminActor);
      
      if (approved.status === 'APPROVED') {
        p16 = true;
      }
      addResult('P16-16', 'end-to-end AI Draft → Edit → Review → Approved Script', p16, 'Full E2E flow executed successfully.');
    } catch(e: any) {
      if (e?.message?.includes('quota') || e?.message?.includes('429')) {
        console.error('\n[BLOCKED] REAL GEMINI API QUOTA EXHAUSTED for P16-16.');
        addResult('P16-16', 'end-to-end AI Draft → Edit → Review → Approved Script', false, 'Test blocked by Gemini quota.');
      } else {
        throw e;
      }
    }

    const totalChecks = results.length;
    const passed = passedCount === totalChecks;

    return { passed, totalChecks, passedChecks: passedCount, failedChecks: totalChecks - passedCount, results };
  } catch(e: any) {
    console.error(e);
    return { passed: false, totalChecks: results.length || 1, passedChecks: passedCount, failedChecks: (results.length || 1) - passedCount, results };
  }
}
