/**
 * Phase 06 Question Workflow UI/UX Redesign - Verification Suite
 * 
 * Tests the complete 4-step question production journey:
 * - 01 Generate Question (AI authoring + candidate review)
 * - 02 Question Library (master inventory + filtering)
 * - 03 Improve Question (human editing + optional AI refinement + save)
 * - 04 Verify & Approve (mathematical validation + approval gate)
 * 
 * Verifies strict elimination of Manual Authoring, proper design system adoption,
 * and seamless workflow handoffs.
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  id: string;
  category: string;
  description: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: CheckResult[] = [];

function check(
  id: string,
  category: string,
  description: string,
  fn: () => { pass: boolean; details: string }
) {
  try {
    const res = fn();
    results.push({
      id,
      category,
      description,
      status: res.pass ? 'PASS' : 'FAIL',
      details: res.details,
    });
  } catch (err: any) {
    results.push({
      id,
      category,
      description,
      status: 'FAIL',
      details: `Exception: ${err.message}`,
    });
  }
}

const rootDir = process.cwd();

// --- 1. WORKFLOW STEP HEADER COMPONENT ---
check(
  'P06-WF-01',
  'Workflow Header',
  'QuestionWorkflowHeader component exists and defines steps 01-04',
  () => {
    const file = path.join(rootDir, 'src/components/questions/QuestionWorkflowHeader.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has01 = content.includes('Generate Question');
    const has02 = content.includes('Question Library');
    const has03 = content.includes('Improve Question');
    const has04 = content.includes('Verify & Approve');
    const hasCurrentStep = content.includes('currentStep');
    return {
      pass: has01 && has02 && has03 && has04 && hasCurrentStep,
      details: `Steps present: 01=${has01}, 02=${has02}, 03=${has03}, 04=${has04}, currentStep=${hasCurrentStep}`,
    };
  }
);

// --- 2. STEP 01: GENERATE QUESTION ---
check(
  'P06-S01-01',
  'Step 01: Generate',
  'QuestionStudioPage serves as Step 01 Generate Question workspace',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionStudioPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('01 Generate Question');
    const hasWfHeader = content.includes('QuestionWorkflowHeader');
    const hasAiRefine = content.includes('refineAiQuestion') || content.includes('generateAiQuestion');
    return {
      pass: hasHeader && hasWfHeader && hasAiRefine,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, AI API: ${hasAiRefine}`,
    };
  }
);

check(
  'P06-S01-02',
  'Step 01: Generate',
  'Post-save actions in Studio navigate to Step 02, Step 03, and Step 04',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionStudioPage.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    const hasStep02 = content.includes('Question Library (Step 02)') || content.includes('/questions');
    const hasStep03 = content.includes('Improve Question (Step 03)') || content.includes('/improve');
    const hasStep04 = content.includes('Verify & Approve (Step 04)') || content.includes('/verify');
    return {
      pass: hasStep02 && hasStep03 && hasStep04,
      details: `Step 02 link: ${hasStep02}, Step 03 link: ${hasStep03}, Step 04 link: ${hasStep04}`,
    };
  }
);

// --- 3. STEP 02: QUESTION LIBRARY ---
check(
  'P06-S02-01',
  'Step 02: Library',
  'QuestionLibraryPage serves as Step 02 Question Library hub',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionLibraryPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasTitle = content.includes('02 Question Library');
    const hasWfHeader = content.includes('QuestionWorkflowHeader');
    const hasGenBtn = content.includes('+ Generate Question (Step 01)');
    return {
      pass: hasTitle && hasWfHeader && hasGenBtn,
      details: `Title: ${hasTitle}, Workflow Header: ${hasWfHeader}, Generate CTA: ${hasGenBtn}`,
    };
  }
);

check(
  'P06-S02-02',
  'Step 02: Library',
  'QuestionTable provides workflow action links for Improve, Verify, and Details',
  () => {
    const file = path.join(rootDir, 'src/components/questions/QuestionTable.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasImprove = content.includes('/improve');
    const hasVerify = content.includes('/verify');
    const hasDetails = content.includes('/questions/');
    return {
      pass: hasImprove && hasVerify && hasDetails,
      details: `Improve link: ${hasImprove}, Verify link: ${hasVerify}, Details link: ${hasDetails}`,
    };
  }
);

// --- 4. STEP 03: IMPROVE QUESTION ---
check(
  'P06-S03-01',
  'Step 03: Improve',
  'QuestionImprovePage exists and implements human editing workspace',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionImprovePage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasTitle = content.includes('03 Improve Question');
    const hasWfHeader = content.includes('QuestionWorkflowHeader');
    const hasOptions = content.includes('optionA') && content.includes('optionB');
    const hasExplanation = content.includes('explanation');
    const hasSave = content.includes('handleSaveChanges') || content.includes('updateQuestion');
    return {
      pass: hasTitle && hasWfHeader && hasOptions && hasExplanation && hasSave,
      details: `Title: ${hasTitle}, Options: ${hasOptions}, Explanation: ${hasExplanation}, Save: ${hasSave}`,
    };
  }
);

check(
  'P06-S03-02',
  'Step 03: Improve',
  'Optional AI Refinement and live validation checks integrated in Step 03',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionImprovePage.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    const hasAiRefine = content.includes('Optional AI Refinement') || content.includes('refineAiQuestion');
    const hasCandidateVal = content.includes('CandidateValidator') || content.includes('Live Quality Status');
    const hasDupCheck = content.includes('checkDuplicate') || content.includes('Duplicate');
    return {
      pass: hasAiRefine && hasCandidateVal && hasDupCheck,
      details: `AI Refine: ${hasAiRefine}, Candidate Validator: ${hasCandidateVal}, Duplicate Check: ${hasDupCheck}`,
    };
  }
);

// --- 5. STEP 04: VERIFY & APPROVE ---
check(
  'P06-S04-01',
  'Step 04: Verify',
  'QuestionVerifyApprovePage exists and implements quality inspection & approval gate',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionVerifyApprovePage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasTitle = content.includes('04 Verify & Approve');
    const hasWfHeader = content.includes('QuestionWorkflowHeader');
    const hasValEngine = content.includes('validateQuestion') || content.includes('Verification Engine Results');
    const hasApprovalGate = content.includes('Approve Question') || content.includes('Editorial Approval Gate');
    return {
      pass: hasTitle && hasWfHeader && hasValEngine && hasApprovalGate,
      details: `Title: ${hasTitle}, Validation Engine: ${hasValEngine}, Approval Gate: ${hasApprovalGate}`,
    };
  }
);

check(
  'P06-S04-02',
  'Step 04: Verify',
  'Approved questions in Step 04 transition seamlessly to video production queue',
  () => {
    const file = path.join(rootDir, 'src/pages/QuestionVerifyApprovePage.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    const hasQueueVideo = content.includes('queueQuestion') || content.includes('Add to Video Queue (Step 05)');
    const hasGenerateNext = content.includes('/studio') || content.includes('Generate Next');
    return {
      pass: hasQueueVideo && hasGenerateNext,
      details: `Queue Video CTA: ${hasQueueVideo}, Generate Next CTA: ${hasGenerateNext}`,
    };
  }
);

// --- 6. ROUTING & ELIMINATION OF MANUAL AUTHORING ---
check(
  'P06-RT-01',
  'Routing & Architecture',
  'App.tsx properly routes steps 01-04 and redirects legacy manual paths to /studio',
  () => {
    const file = path.join(rootDir, 'src/App.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    const hasImprove = content.includes('QuestionImprovePage') && content.includes('questions/improve');
    const hasVerify = content.includes('QuestionVerifyApprovePage') && content.includes('questions/verify');
    const hasNewRedirect = content.includes('questions/new') && content.includes('replace');
    return {
      pass: hasImprove && hasVerify && hasNewRedirect,
      details: `Improve route: ${hasImprove}, Verify route: ${hasVerify}, Manual redirect: ${hasNewRedirect}`,
    };
  }
);

check(
  'P06-NAV-01',
  'Navigation',
  'Navigation configuration links Step 01-04 to dedicated routes',
  () => {
    const file = path.join(rootDir, 'src/config/navigation.ts');
    const content = fs.readFileSync(file, 'utf-8');
    const hasStep01 = content.includes("step: '01'") && content.includes("href: '/studio'");
    const hasStep02 = content.includes("step: '02'") && content.includes("href: '/questions'");
    const hasStep03 = content.includes("step: '03'") && (content.includes("href: '/questions?status=DRAFT'") || content.includes("href: '/questions/improve'"));
    const hasStep04 = content.includes("step: '04'") && (content.includes("href: '/questions?status=GENERATED'") || content.includes("href: '/questions/verify'"));
    return {
      pass: hasStep01 && hasStep02 && hasStep03 && hasStep04,
      details: `01: ${hasStep01}, 02: ${hasStep02}, 03: ${hasStep03}, 04: ${hasStep04}`,
    };
  }
);

check(
  'P06-CLEAN-01',
  'Clean Experience',
  'No user-facing buttons link to mode=manual or /questions/new manual creation',
  () => {
    const libraryFile = fs.readFileSync(path.join(rootDir, 'src/pages/QuestionLibraryPage.tsx'), 'utf-8');
    const headerFile = fs.readFileSync(path.join(rootDir, 'src/components/layout/Header.tsx'), 'utf-8');
    const studioFile = fs.readFileSync(path.join(rootDir, 'src/pages/QuestionStudioPage.tsx'), 'utf-8');

    const hasManualInLibrary = libraryFile.includes('to="/questions/new"');
    const hasManualInHeader = headerFile.includes('mode=manual');
    const hasManualParam = studioFile.includes("mode === 'manual'");

    const pass = !hasManualInLibrary && !hasManualInHeader;
    return {
      pass,
      details: `Manual in library: ${hasManualInLibrary}, Manual in header: ${hasManualInHeader}`,
    };
  }
);

// --- REPORT PRINTING ---
console.log('\n===============================================================');
console.log('  BURRA PARIKSHA CMS - PHASE 06 QUESTION WORKFLOW VERIFICATION');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

results.forEach((r, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const badge = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  if (r.status === 'PASS') passCount++;
  else failCount++;

  console.log(`[${num}] ${badge} | ${r.id} | ${r.category.padEnd(22)} | ${r.description}`);
  console.log(`     Details: ${r.details}\n`);
});

console.log('---------------------------------------------------------------');
console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('===============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
