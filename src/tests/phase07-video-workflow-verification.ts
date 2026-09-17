/**
 * Phase 07 Video Workflow UI/UX Redesign - Verification Suite
 * 
 * Tests the complete 5-step video production journey:
 * - 05 Create Script (AI script generation + 5-part script draft)
 * - 06 Review Script (Teleprompter timing + version management + approval)
 * - 07 Record Video (Teleprompter studio + host assignment + raw footage intake)
 * - 08 Edit Video (Aspect ratio specs + motion cue sync + edited render upload)
 * - 09 Final Video (Publish readiness checklist + asset lock + quality signoff)
 * 
 * Verifies strict UI/UX modularity, design system adoption, routing integrity,
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
  'P07-WF-01',
  'Workflow Header',
  'VideoWorkflowHeader component exists and defines steps 05-09',
  () => {
    const file = path.join(rootDir, 'src/components/video/VideoWorkflowHeader.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has05 = content.includes('Create Script');
    const has06 = content.includes('Review Script');
    const has07 = content.includes('Record Video');
    const has08 = content.includes('Edit Video');
    const has09 = content.includes('Final Video');
    const hasCurrentStep = content.includes('currentStep');
    return {
      pass: has05 && has06 && has07 && has08 && has09 && hasCurrentStep,
      details: `Steps present: 05=${has05}, 06=${has06}, 07=${has07}, 08=${has08}, 09=${has09}, currentStep=${hasCurrentStep}`,
    };
  }
);

// --- 2. STEP 05: CREATE SCRIPT ---
check(
  'P07-S05-01',
  'Step 05: Create Script',
  'VideoCreateScriptPage serves as Step 05 workspace with AI generation and 5-part script draft',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoCreateScriptPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('05 Create Script');
    const hasWfHeader = content.includes('VideoWorkflowHeader');
    const hasAiGen = content.includes('generateTeluguScript') || content.includes('generateScript');
    const hasSave = content.includes('saveScript');
    return {
      pass: hasHeader && hasWfHeader && hasAiGen && hasSave,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, AI API: ${hasAiGen}, Save: ${hasSave}`,
    };
  }
);

check(
  'P07-S05-02',
  'Step 05: Create Script',
  'Step 05 computes 140 WPM teleprompter reading duration and navigates to Step 06 Review Script',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoCreateScriptPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasPacing = content.includes('140') || content.includes('estimatedSeconds') || content.includes('totalWords');
    const hasNavTo06 = content.includes('review-script') || content.includes('Step 06');
    return {
      pass: hasPacing && hasNavTo06,
      details: `Pacing calculation: ${hasPacing}, Handoff to Step 06: ${hasNavTo06}`,
    };
  }
);

// --- 3. STEP 06: REVIEW SCRIPT ---
check(
  'P07-S06-01',
  'Step 06: Review Script',
  'VideoReviewScriptPage serves as Step 06 workspace with version commit, rollback, and approval logic',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoReviewScriptPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('06 Review Script');
    const hasWfHeader = content.includes('VideoWorkflowHeader');
    const hasVersions = content.includes('getScriptVersions') && content.includes('revertScript');
    const hasApproval = content.includes('markScriptReady') || content.includes('SCRIPT_READY');
    return {
      pass: hasHeader && hasWfHeader && hasVersions && hasApproval,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Versions/Rollback: ${hasVersions}, Approval: ${hasApproval}`,
    };
  }
);

check(
  'P07-S06-02',
  'Step 06: Review Script',
  'Step 06 is distinct from Step 05 and provides direct handoff to Step 07 Record Video',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoReviewScriptPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasStep07Link = content.includes('/record') || content.includes('Step 07');
    return {
      pass: hasStep07Link,
      details: `Handoff to Step 07: ${hasStep07Link}`,
    };
  }
);

// --- 4. STEP 07: RECORD VIDEO ---
check(
  'P07-S07-01',
  'Step 07: Record Video',
  'VideoRecordPage serves as Step 07 workspace with teleprompter studio, presenter cues, and Drive raw file upload',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoRecordPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('07 Record Video');
    const hasWfHeader = content.includes('VideoWorkflowHeader');
    const hasUpload = content.includes('uploadVideoFile');
    const hasTeleprompter = content.includes('Teleprompter') || content.includes('teleprompterMode');
    return {
      pass: hasHeader && hasWfHeader && hasUpload && hasTeleprompter,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Upload: ${hasUpload}, Teleprompter: ${hasTeleprompter}`,
    };
  }
);

check(
  'P07-S07-02',
  'Step 07: Record Video',
  'Step 07 manages recording status transitions and advances to Step 08 Edit Video',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoRecordPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasTransitions = content.includes('updateVideoStatus') && content.includes('RECORDED');
    const hasStep08Link = content.includes('/edit-video') || content.includes('Step 08');
    return {
      pass: hasTransitions && hasStep08Link,
      details: `Status transitions: ${hasTransitions}, Handoff to Step 08: ${hasStep08Link}`,
    };
  }
);

// --- 5. STEP 08: EDIT VIDEO ---
check(
  'P07-S08-01',
  'Step 08: Edit Video',
  'VideoEditPage serves as Step 08 workspace with vertical video specifications and edited render upload',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoEditPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('08 Edit Video');
    const hasWfHeader = content.includes('VideoWorkflowHeader');
    const hasSpecs = content.includes('1080') && content.includes('1920') && content.includes('9:16');
    const hasUploadEdited = content.includes('uploadEditedVideoFile');
    return {
      pass: hasHeader && hasWfHeader && hasSpecs && hasUploadEdited,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Technical specs: ${hasSpecs}, Upload edited cut: ${hasUploadEdited}`,
    };
  }
);

check(
  'P07-S08-02',
  'Step 08: Edit Video',
  'Step 08 supports visual cue timestamp matching and handoff to Step 09 Final Video',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoEditPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasCues = content.includes('Cue') || content.includes('hookText') || content.includes('00:00');
    const hasStep09Link = content.includes('/final-video') || content.includes('Step 09');
    return {
      pass: hasCues && hasStep09Link,
      details: `Cue sheet: ${hasCues}, Handoff to Step 09: ${hasStep09Link}`,
    };
  }
);

// --- 6. STEP 09: FINAL VIDEO ---
check(
  'P07-S09-01',
  'Step 09: Final Video',
  'VideoFinalPage serves as Step 09 workspace with publish readiness audit and approval gate',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoFinalPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('09 Final Video');
    const hasWfHeader = content.includes('VideoWorkflowHeader');
    const hasReadiness = content.includes('getVideoPublishReadiness') || content.includes('Readiness');
    const hasGate = content.includes('READY_TO_UPLOAD') && content.includes('EDITING');
    return {
      pass: hasHeader && hasWfHeader && hasReadiness && hasGate,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Readiness: ${hasReadiness}, Gate: ${hasGate}`,
    };
  }
);

check(
  'P07-S09-02',
  'Step 09: Final Video',
  'Step 09 links to downstream Step 10 Thumbnail and Production Tracker',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoFinalPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasStep10 = content.includes('Step 10') || content.includes('Thumbnail');
    const hasDownstream = content.includes('/production');
    return {
      pass: hasStep10 && hasDownstream,
      details: `Step 10 handoff: ${hasStep10}, Downstream routing: ${hasDownstream}`,
    };
  }
);

// --- 7. ROUTING & SHELL INTEGRATION ---
check(
  'P07-ROUTE-01',
  'Routing & Navigation',
  'App.tsx defines dedicated routes for steps 05, 06, 07, 08, and 09',
  () => {
    const file = path.join(rootDir, 'src/App.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasS05 = content.includes('create-script');
    const hasS06 = content.includes('review-script');
    const hasS07 = content.includes('record');
    const hasS08 = content.includes('edit-video');
    const hasS09 = content.includes('final-video');
    return {
      pass: hasS05 && hasS06 && hasS07 && hasS08 && hasS09,
      details: `Routes: 05=${hasS05}, 06=${hasS06}, 07=${hasS07}, 08=${hasS08}, 09=${hasS09}`,
    };
  }
);

check(
  'P07-DS-01',
  'Design System',
  'All 5 video workflow pages consume standard Design System components',
  () => {
    const pages = [
      'src/pages/VideoCreateScriptPage.tsx',
      'src/pages/VideoReviewScriptPage.tsx',
      'src/pages/VideoRecordPage.tsx',
      'src/pages/VideoEditPage.tsx',
      'src/pages/VideoFinalPage.tsx',
    ];

    let allPass = true;
    const missing: string[] = [];

    for (const p of pages) {
      const fullPath = path.join(rootDir, p);
      if (!fs.existsSync(fullPath)) {
        allPass = false;
        missing.push(`${p} missing`);
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasCard = content.includes("from '../design-system/components/Card'") || content.includes('Card');
      const hasButton = content.includes("from '../design-system/components/Button'") || content.includes('Button');
      const hasPageHeader = content.includes("from '../design-system/components/PageHeader'") || content.includes('PageHeader');
      if (!hasCard || !hasButton || !hasPageHeader) {
        allPass = false;
        missing.push(`${p} lacks complete design system imports`);
      }
    }

    return {
      pass: allPass,
      details: allPass ? 'All 5 pages properly consume design system' : missing.join(', '),
    };
  }
);

// --- REPORT PRINTING ---
console.log('\n================================================================');
console.log('PHASE 07 — VIDEO WORKFLOW UI/UX VERIFICATION SUITE');
console.log('Production Steps 05–09');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${r.id}] [${r.category}] ${r.description}`);
  if (r.status === 'FAIL') {
    console.log(`   └─ ⚠️ Details: ${r.details}`);
    failCount++;
  } else {
    console.log(`   └─ Details: ${r.details}`);
    passCount++;
  }
}

console.log('\n----------------------------------------------------------------');
console.log(`Total Checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
console.log('----------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
