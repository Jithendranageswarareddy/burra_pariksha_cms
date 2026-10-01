/**
 * Regression Test Suite Runner for Burra Pariksha CMS
 * Runs Phase 5, 6, 7C, 8B, 8C, 8D, 8E, 8F, 8G, and 8H verification suites.
 */

import { runTask5QuestionValidationEngineVerification } from './task5-question-validation-engine-verification';
import { runTask6Verification } from './task6-telugu-script-verification';
import { runTask7CVerificationSuite } from './task7c-question-studio-quality-verification';
import { runTask8BVerificationSuite } from './task8b-social-content-foundation-verification';
import { runTask8CVerificationSuite } from './task8c-hook-presentation-engine-verification';
import { runTask8dTeleprompterSpokenEnhancerVerification } from './task8d-teleprompter-spoken-enhancer-verification';
import { runTask8EVerificationSuite } from './task8e-social-metadata-generator-verification';
import { runTask8FVerificationSuite } from './task8f-multi-platform-adaptation-verification';
import { runTask8GVerificationSuite } from './task8g-social-quality-engagement-verification';
import { runTask8hVerification } from './task8h-social-review-workflow-verification';
import { runPhase8iSecurityVerification } from './security-qa.integration.test';

async function runAll() {
  console.log('=== STARTING BURRA PARIKSHA CMS COMPREHENSIVE REGRESSION SUITE ===\n');

  let allPassed = true;

  try {
    console.log('[1/11] Running Phase 5 Verification...');
    const p5 = await runTask5QuestionValidationEngineVerification();
    const p5Passed = p5.failedChecks === 0;
    console.log(`Phase 5: ${p5Passed ? 'PASS' : 'FAIL'} (${p5.passedChecks}/${p5.totalChecks})\n`);
    if (!p5Passed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 5 Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[2/11] Running Phase 6 Verification...');
    const p6 = await runTask6Verification();
    const p6Passed = p6.success;
    console.log(`Phase 6: ${p6Passed ? 'PASS' : 'FAIL'} (${p6.passedTests}/${p6.totalTests})\n`);
    if (!p6Passed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 6 Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[3/11] Running Phase 7C Verification...');
    const p7c = await runTask7CVerificationSuite();
    const p7cPassed = p7c.status === 'PASS';
    console.log(`Phase 7C: ${p7cPassed ? 'PASS' : 'FAIL'} (${p7c.passedCount}/${p7c.totalChecks})\n`);
    if (!p7cPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 7C Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[4/11] Running Phase 8B Verification...');
    const p8b = await runTask8BVerificationSuite();
    const p8bPassed = p8b.status === 'PASS';
    console.log(`Phase 8B: ${p8bPassed ? 'PASS' : 'FAIL'} (${p8b.passedCount}/${p8b.totalChecks})\n`);
    if (!p8bPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8B Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[5/11] Running Phase 8C Verification...');
    const p8c = await runTask8CVerificationSuite();
    const p8cPassed = p8c.status === 'PASS';
    console.log(`Phase 8C: ${p8cPassed ? 'PASS' : 'FAIL'} (${p8c.passedChecks}/${p8c.totalChecks})\n`);
    if (!p8cPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8C Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[6/11] Running Phase 8D Verification...');
    const p8d = await runTask8dTeleprompterSpokenEnhancerVerification();
    const p8dPassed = p8d.status === 'PASS';
    console.log(`Phase 8D: ${p8dPassed ? 'PASS' : 'FAIL'} (${p8d.passedChecks}/${p8d.totalChecks})\n`);
    if (!p8dPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8D Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[7/11] Running Phase 8E Verification...');
    const p8e = await runTask8EVerificationSuite();
    const p8ePassed = p8e.status === 'PASS';
    console.log(`Phase 8E: ${p8ePassed ? 'PASS' : 'FAIL'} (${p8e.passedChecks}/${p8e.totalChecks})\n`);
    if (!p8ePassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8E Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[8/11] Running Phase 8F Verification...');
    const p8f = await runTask8FVerificationSuite();
    const p8fPassed = p8f.status === 'PASS';
    console.log(`Phase 8F: ${p8fPassed ? 'PASS' : 'FAIL'} (${p8f.passedChecks}/${p8f.totalChecks})\n`);
    if (!p8fPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8F Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[9/11] Running Phase 8G Verification...');
    const p8g = await runTask8GVerificationSuite();
    const p8gPassed = p8g.status === 'PASS';
    console.log(`Phase 8G: ${p8gPassed ? 'PASS' : 'FAIL'} (${p8g.passedChecks}/${p8g.totalChecks})\n`);
    if (!p8gPassed) allPassed = false;
  } catch (err: any) {
    console.error('Phase 8G Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[10/11] Running Phase 8H Verification...');
    const p8h = await runTask8hVerification();
    const p8hPassed = p8h.success;
    console.log(`Phase 8H: ${p8hPassed ? 'PASS' : 'FAIL'} (${p8h.passedTests}/${p8h.totalTests})\n`);
    if (!p8hPassed) {
      console.error('Failed 8H checks:', p8h.results.filter(r => !r.passed));
      allPassed = false;
    }
  } catch (err: any) {
    console.error('Phase 8H Error:', err.message);
    allPassed = false;
  }

  try {
    console.log('[11/11] Running Phase 8I Security & QA Verification...');
    const p8i = await runPhase8iSecurityVerification();
    const p8iPassed = p8i.failed === 0;
    console.log(`Phase 8I: ${p8iPassed ? 'PASS' : 'FAIL'} (${p8i.passed}/${p8i.total})\n`);
    if (!p8iPassed) {
      console.error('Failed 8I checks:', p8i.results.filter(r => !r.passed));
      allPassed = false;
    }
  } catch (err: any) {
    console.error('Phase 8I Error:', err.message);
    allPassed = false;
  }

  console.log('=== REGRESSION SUITE FINAL RESULT ===');
  console.log(allPassed ? 'ALL PHASES PASSED SUCCESSFULLY' : 'REGRESSION SUITE FAILED');
  if (!allPassed) process.exit(1);
}

runAll();
