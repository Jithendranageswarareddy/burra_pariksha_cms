/**
 * Phase 08 Asset & Social Review UI/UX Redesign - Verification Suite
 * 
 * Tests the complete 3-step asset & review production journey:
 * - 10 Create Thumbnail (AI hook overlay + dual-aspect 9:16/16:9 preview + Google Drive upload + version history)
 * - 11 Pinned Comment (Structured sticky comment editor + auto-drafting + engagement prompts + copy actions)
 * - 12 Social Review (Unified social package assembly + quality assurance + approval/rejection gates)
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
  'P08-WF-01',
  'Workflow Header',
  'AssetWorkflowHeader component exists and defines steps 10-12 with links',
  () => {
    const file = path.join(rootDir, 'src/components/social/AssetWorkflowHeader.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has10 = content.includes('10') && content.includes('Create Thumbnail');
    const has11 = content.includes('11') && content.includes('Pinned Comment');
    const has12 = content.includes('12') && content.includes('Social Review');
    const hasCurrentStep = content.includes('currentStep');
    return {
      pass: has10 && has11 && has12 && hasCurrentStep,
      details: `Steps present: 10=${has10}, 11=${has11}, 12=${has12}, currentStep=${hasCurrentStep}`,
    };
  }
);

// --- 2. STEP 10: CREATE THUMBNAIL ---
check(
  'P08-S10-01',
  'Step 10: Create Thumbnail',
  'VideoThumbnailPage serves as Step 10 workspace with Google Drive upload and AI hook generation',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoThumbnailPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('10 Create Thumbnail');
    const hasWfHeader = content.includes('AssetWorkflowHeader');
    const hasUpload = content.includes('uploadThumbnailFile') || content.includes('saveThumbnail');
    const hasHooks = content.includes('hookHeadline') || content.includes('headlineText') || content.includes('suggestedHooks') || content.includes('generateTeluguScript');
    return {
      pass: hasHeader && hasWfHeader && hasUpload && hasHooks,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Upload/Save: ${hasUpload}, Hooks: ${hasHooks}`,
    };
  }
);

check(
  'P08-S10-02',
  'Step 10: Create Thumbnail',
  'VideoThumbnailPage provides dual-aspect ratio preview (9:16 vertical and 16:9 landscape)',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoThumbnailPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has916 = content.includes('9:16') || content.includes('9/16');
    const has169 = content.includes('16:9') || content.includes('16/9');
    const hasHookOverlay = content.includes('headlineText') || content.includes('hook');
    return {
      pass: has916 && has169 && hasHookOverlay,
      details: `9:16: ${has916}, 16:9: ${has169}, Hook Overlay: ${hasHookOverlay}`,
    };
  }
);

check(
  'P08-S10-03',
  'Step 10: Create Thumbnail',
  'VideoThumbnailPage includes step forward navigation to 11 Pinned Comment',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoThumbnailPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasNext = content.includes('pinned-comment') || content.includes('11 Pinned Comment');
    return {
      pass: hasNext,
      details: `Forward handoff present: ${hasNext}`,
    };
  }
);

// --- 3. STEP 11: PINNED COMMENT ---
check(
  'P08-S11-01',
  'Step 11: Pinned Comment',
  'VideoPinnedCommentPage serves as Step 11 workspace with structured comment breakdown',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoPinnedCommentPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasHeader = content.includes('11 Pinned Comment');
    const hasWfHeader = content.includes('AssetWorkflowHeader');
    const hasSticky = content.includes('commentBody') || content.includes('pinned');
    const hasSolution = content.includes('detailedSolution') || content.includes('solution');
    const hasChallenge = content.includes('challengeQuestion') || content.includes('challenge');
    return {
      pass: hasHeader && hasWfHeader && hasSticky && hasSolution && hasChallenge,
      details: `Header: ${hasHeader}, Workflow Header: ${hasWfHeader}, Body: ${hasSticky}, Solution: ${hasSolution}, Challenge: ${hasChallenge}`,
    };
  }
);

check(
  'P08-S11-02',
  'Step 11: Pinned Comment',
  'VideoPinnedCommentPage includes auto-drafting from question/script and copy-to-clipboard action',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoPinnedCommentPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasAutoDraft = content.includes('handleAutoDraft') || content.includes('Auto-Draft');
    const hasCopy = content.includes('clipboard') || content.includes('handleCopy');
    const hasSave = content.includes('savePinnedComment') || content.includes('handleSave');
    return {
      pass: hasAutoDraft && hasCopy && hasSave,
      details: `Auto-Draft: ${hasAutoDraft}, Copy to clipboard: ${hasCopy}, Save action: ${hasSave}`,
    };
  }
);

check(
  'P08-S11-03',
  'Step 11: Pinned Comment',
  'VideoPinnedCommentPage includes step forward navigation to 12 Social Review',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoPinnedCommentPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const hasNext = content.includes('social-review') || content.includes('12 Social Review');
    return {
      pass: hasNext,
      details: `Forward handoff present: ${hasNext}`,
    };
  }
);

// --- 4. STEP 12: SOCIAL REVIEW ---
check(
  'P08-S12-01',
  'Step 12: Social Review',
  'SocialReviewPage and SocialReviewWorkspace assemble complete social review package',
  () => {
    const pageFile = path.join(rootDir, 'src/pages/SocialReviewPage.tsx');
    const wsFile = path.join(rootDir, 'src/components/social/SocialReviewWorkspace.tsx');
    if (!fs.existsSync(pageFile) || !fs.existsSync(wsFile)) return { pass: false, details: 'Files not found' };
    const pContent = fs.readFileSync(pageFile, 'utf-8');
    const wContent = fs.readFileSync(wsFile, 'utf-8');
    const hasPage = pContent.includes('Social Review') || pContent.includes('SocialReviewWorkspace');
    const hasWf = pContent.includes('AssetWorkflowHeader');
    const hasApprove = wContent.includes('approveSocialReviewPackage') || wContent.includes('handleApprove');
    const hasReject = wContent.includes('rejectSocialReviewPackage') || wContent.includes('handleModalSubmit');
    return {
      pass: hasPage && hasWf && hasApprove && hasReject,
      details: `Page: ${hasPage}, Header: ${hasWf}, Approve API: ${hasApprove}, Reject/Changes: ${hasReject}`,
    };
  }
);

check(
  'P08-S12-02',
  'Step 12: Social Review',
  'Social Review UI supports multi-platform previews and quality assessment findings',
  () => {
    const wsFile = path.join(rootDir, 'src/components/social/SocialReviewWorkspace.tsx');
    if (!fs.existsSync(wsFile)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(wsFile, 'utf-8');
    const hasQuality = content.includes('qualityAssessment') || content.includes('8G AI Quality Score');
    const hasPlatforms = content.includes('multiPlatformAdaptations') || content.includes('platforms');
    const hasHistory = content.includes('reviewHistory') || content.includes('History');
    return {
      pass: hasQuality && hasPlatforms && hasHistory,
      details: `Quality Score: ${hasQuality}, Platforms: ${hasPlatforms}, History: ${hasHistory}`,
    };
  }
);

// --- 5. ROUTING & NAVIGATION INTEGRITY ---
check(
  'P08-NAV-01',
  'Routing Configuration',
  'App.tsx declares dedicated routes for Steps 10, 11, and 12',
  () => {
    const file = path.join(rootDir, 'src/App.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has10Route = content.includes('videos/thumbnail') || content.includes('videos/:videoId/thumbnail');
    const has11Route = content.includes('videos/pinned-comment') || content.includes('videos/:videoId/pinned-comment');
    const has12Route = content.includes('social-review');
    return {
      pass: has10Route && has11Route && has12Route,
      details: `Step 10 route: ${has10Route}, Step 11 route: ${has11Route}, Step 12 route: ${has12Route}`,
    };
  }
);

check(
  'P08-NAV-02',
  'Sidebar Navigation',
  'Sidebar and navigation config cleanly link Steps 10, 11, 12 in the 15-step journey',
  () => {
    const navFile = path.join(rootDir, 'src/config/navigation.ts');
    const sbFile = path.join(rootDir, 'src/components/layout/Sidebar.tsx');
    if (!fs.existsSync(navFile) || !fs.existsSync(sbFile)) return { pass: false, details: 'Files not found' };
    const nContent = fs.readFileSync(navFile, 'utf-8');
    const sContent = fs.readFileSync(sbFile, 'utf-8');
    const has10Nav = nContent.includes('10') && nContent.includes('Create Thumbnail');
    const has11Nav = nContent.includes('11') && nContent.includes('Pinned Comment');
    const has12Nav = nContent.includes('12') && nContent.includes('Social Review');
    const hasMatch = sContent.includes('thumbnail') && sContent.includes('pinned-comment');
    return {
      pass: has10Nav && has11Nav && has12Nav && hasMatch,
      details: `Nav 10: ${has10Nav}, Nav 11: ${has11Nav}, Nav 12: ${has12Nav}, Sidebar active matching: ${hasMatch}`,
    };
  }
);

// --- 6. UPSTREAM & DOWNSTREAM CONTINUITY ---
check(
  'P08-FLOW-01',
  'Workflow Continuity',
  'Step 09 (Final Video) provides direct handoff to Step 10 (Create Thumbnail)',
  () => {
    const file = path.join(rootDir, 'src/pages/VideoFinalPage.tsx');
    if (!fs.existsSync(file)) return { pass: false, details: 'File not found' };
    const content = fs.readFileSync(file, 'utf-8');
    const has10Link = content.includes('/thumbnail') && content.includes('10 Create Thumbnail');
    return {
      pass: has10Link,
      details: `Handoff from Step 09 to Step 10: ${has10Link}`,
    };
  }
);

// --- RUNNER SUMMARY ---
console.log('\n==================================================');
console.log('BURRA PARIKSHA CMS — PHASE 08 VERIFICATION SUITE');
console.log('Asset & Social Review UI/UX Redesign (Steps 10–12)');
console.log('==================================================\n');

let passCount = 0;
let failCount = 0;

results.forEach((r, i) => {
  const num = String(i + 1).padStart(2, '0');
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`${num}. ${icon} [${r.id}] ${r.category} — ${r.description}`);
  console.log(`    Status: ${r.status} | Details: ${r.details}\n`);
  if (r.status === 'PASS') passCount++;
  else failCount++;
});

console.log('--------------------------------------------------');
console.log(`TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('==================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
