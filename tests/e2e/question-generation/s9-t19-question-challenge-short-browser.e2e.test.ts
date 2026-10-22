/**
 * BURRA PARIKSHA CMS — S9-T19: Question Challenge Short Dedicated Browser E2E Test
 *
 * Verifies the complete real user journey for Mode 1 (Question Challenge Short)
 * in Google Chrome via Puppeteer-Core against an isolated local Firestore Emulator:
 *
 * 1. Open Question Studio directly (/studio) -> Clean workspace, zero residual state.
 * 2. Stage 01 Candidate generation, live edit, Audience preview, and Save Draft.
 * 3. Navigation Case 2: Open explicitly selected saved draft via draftId parameter.
 * 4. Navigation Case 3: Navigate away to Dashboard and return to /studio -> Clean isolation.
 * 5. Navigation Case 4: Explicit Resume action from Dashboard work queue.
 * 6. Submit for Verification -> State transition, OCC version, workflow instances.
 * 7. Stage 02: Verification UI, GAR-02 anti-self-approval rejection for author.
 * 8. Stage 02 Approval: Independent reviewer approves, canonical Question materialized,
 *    linked Video created in videos and question_videos join record.
 * 9. Stage 03: Navigate to Audience Script Studio (/videos/:videoId?tab=script),
 *    edit conversational Telugu teleprompter hook and narration, Save Script to Firestore.
 * 10. Persistence verification: Reload browser page, confirm script persists from Firestore.
 */

// Enforce Firestore Emulator binding before ANY Firebase or datastore module loads
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.USE_FIRESTORE_EMULATOR = 'true';
process.env.GCLOUD_PROJECT = 'burra-pariksha-test';
process.env.GCP_PROJECT = 'burra-pariksha-test';
process.env.FIRESTORE_TEST_PROJECT_ID = 'burra-pariksha-test';
process.env.FIRESTORE_DATABASE_ID = '(default)';
process.env.FIRESTORE_TEST_DATABASE_ID = '(default)';

import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import express, { Express } from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import puppeteer, { Browser, Page } from 'puppeteer-core';

import { apiRouter } from '../../../backend/server/routers/routes';
import { authService } from '../../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../../database/firestore/repositories/users.repository';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { questionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { topicsRepository } from '../../../database/firestore/repositories/topics.repository';
import { subtopicsRepository } from '../../../database/firestore/repositories/subtopics.repository';
import { questionConfigRepository, DEFAULT_QUESTION_CONFIG } from '../../../database/firestore/repositories/question-config.repository';
import { videosRepository } from '../../../database/firestore/repositories/videos.repository';
import { questionVideosRepository } from '../../../database/firestore/repositories/question-videos.repository';
import { scriptsRepository, scriptVersionsRepository } from '../../../database/firestore/repositories/scripts.repository';
import { workflowRepository } from '../../../database/firestore/repositories/workflow.repository';
import { questionConfigService } from '../../../backend/infrastructure/services/question-config.service';
import { taxonomyService } from '../../../backend/domain/taxonomy/services/taxonomy.service';
import { aiOrchestrator } from '../../../backend/ai/orchestrator/ai-orchestrator.service';
import { UserRole, QuestionStatus } from '../../../shared';
import {
  evaluateDatastoreIsolation,
  KNOWN_PRODUCTION_TARGETS,
  IsolationVerification,
  verifyFirebaseAdminBinding,
  probeFirestoreConnectivity,
} from '../../integration/s8-t18-firestore-persistence-recovery.integration.test';
import { getAdminFirestore } from '../../../database/firestore/adapter/admin';

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Tracking sets for deterministic scoped cleanup
const trackedDraftIds = new Set<string>();
const trackedQuestionIds = new Set<string>();
const trackedVideoIds = new Set<string>();
const trackedScriptIds = new Set<string>();
const trackedUserIds = new Set<string>();
const trackedTopicIds = new Set<string>();
const trackedSubtopicIds = new Set<string>();
const trackedConfigIds = new Set<string>();

interface ActorContext {
  userId: string;
  name: string;
  role: UserRole;
  token: string;
  headers: Record<string, string>;
}

async function createActor(role: UserRole, prefix: string, extraRoles: UserRole[] = []): Promise<ActorContext> {
  const userId = `usr_e2e_${prefix.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  trackedUserIds.add(userId);

  const roles = [role, ...extraRoles];
  await usersRepository.appendRecord({
    id: userId,
    name: `${prefix} E2E`,
    email: `${userId}@burrapariksha.test`,
    role,
    roles,
    isActive: true,
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = authService.generateSessionToken({
    userId,
    name: `${prefix} E2E`,
    role,
    roles,
    sessionVersion: 1,
  });

  return {
    userId,
    name: `${prefix} E2E`,
    role,
    token,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function runQuestionChallengeShortBrowserE2ETest(): Promise<void> {
  console.log('========================================================================');
  console.log('BP-CMS: QUESTION CHALLENGE SHORT REAL BROWSER WORKFLOW THROUGH STAGE 03');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. DATASTORE ISOLATION & FAIL-CLOSED GUARD
  // -------------------------------------------------------------------------
  console.log('--- Step 0: Datastore Isolation Verification ---');
  const activeProjectId = 'burra-pariksha-test';
  const activeDatabaseId = '(default)';

  const isolation: IsolationVerification = evaluateDatastoreIsolation(
    activeProjectId,
    activeDatabaseId,
    process.env
  );
  console.log(`[Isolation Audit] Evaluated mode: ${isolation.isolationMode}`);
  console.log(`[Isolation Audit] Emulator Host: ${process.env.FIRESTORE_EMULATOR_HOST || 'NONE'}`);
  console.log(`[Isolation Audit] Approved: ${isolation.isApproved ? 'YES' : 'NO'}`);

  if (!isolation.isApproved) {
    throw new Error(
      `FAIL-CLOSED: Datastore isolation could not be established: ${isolation.rejectionReasons.join('; ')}`
    );
  }

  // Verify that Firebase Admin SDK instance is bound to the exact same emulator configuration
  const adminDb = getAdminFirestore();
  verifyFirebaseAdminBinding(adminDb, {
    projectId: activeProjectId,
    databaseId: activeDatabaseId,
    emulatorHost: isolation.emulatorHost!,
  });

  // Verify live emulator reachability before any fixture creation
  const reachability = await probeFirestoreConnectivity(adminDb, 15000);
  if (!reachability.reachable) {
    throw new Error(
      `FAIL-CLOSED: Local Firestore emulator at ${isolation.emulatorHost} is unreachable: ${reachability.error}`
    );
  }

  console.log('✓ Datastore isolation verified. Zero production exposure.\n');

  assert.ok(fs.existsSync(CHROME_PATH), `Google Chrome binary not found at ${CHROME_PATH}`);
  console.log(`✓ Google Chrome binary verified at: ${CHROME_PATH}\n`);

  // -------------------------------------------------------------------------
  // 2. SEED SYNTHETIC TEST FIXTURES & ACTORS
  // -------------------------------------------------------------------------
  console.log('--- Setting Up Test Fixtures & Deterministic AI Provider Stub ---');

  const existingTopic = await topicsRepository.findById('TOP-QA-01');
  if (!existingTopic) {
    await topicsRepository.appendRecord({
      id: 'TOP-QA-01',
      name: 'Quantitative Aptitude',
      slug: 'quantitative-aptitude',
      isActive: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
    });
    trackedTopicIds.add('TOP-QA-01');
  }

  const existingSubtopic = await subtopicsRepository.findById('SUB-01');
  if (!existingSubtopic) {
    await subtopicsRepository.appendRecord({
      id: 'SUB-01',
      topicId: 'TOP-QA-01',
      name: 'Time and Distance',
      slug: 'time-and-distance',
      isActive: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
    });
    trackedSubtopicIds.add('SUB-01');
  }
  taxonomyService.invalidateCache();

  for (const cfg of DEFAULT_QUESTION_CONFIG) {
    const existing = await questionConfigRepository.findById(cfg.id);
    if (!existing) {
      await questionConfigRepository.appendRecord(cfg);
      trackedConfigIds.add(cfg.id);
    }
  }
  questionConfigService.invalidateCache();

  const authorActor = await createActor(UserRole.QUESTION_CREATOR, 'AuthorLakshmi');
  const reviewerActor = await createActor(UserRole.REVIEWER, 'ReviewerPadma', [UserRole.SCRIPT_WRITER]);
  const leadActor = await createActor(UserRole.CONTENT_MANAGER, 'LeadRao', [UserRole.SCRIPT_WRITER]);

  // Stub AI Orchestrator deterministically for zero external quota / zero network failure
  const originalGenerate = (aiOrchestrator as any).generateQuestionCandidate;
  let stubCallIndex = 0;
  const deterministicStub = async (input: any) => {
    stubCallIndex++;
    return {
      candidate: {
        content: `ప్రశ్న ${stubCallIndex}: రైలు వేగం గంటకు 72 కి.మీ అయితే 400 మీటర్లు దాటడానికి ఎంత సమయం పడుతుంది?`,
        questionText: `ప్రశ్న ${stubCallIndex}: రైలు వేగం గంటకు 72 కి.మీ అయితే 400 మీటర్లు దాటడానికి ఎంత సమయం పడుతుంది?`,
        option_a: '15 సెకన్లు',
        option_b: '20 సెకన్లు',
        option_c: '25 సెకన్లు',
        option_d: '30 సెకన్లు',
        options: {
          a: '15 సెకన్లు',
          b: '20 సెకన్లు',
          c: '25 సెకన్లు',
          d: '30 సెకన్లు',
        },
        correct_answer: 'B',
        correctAnswer: 'B',
        explanation: 'వేగం = 72 * (5/18) = 20 మీ/సె. సమయం = దూరం / వేగం = 400 / 20 = 20 సెకన్లు.',
      },
      validation: {
        isValid: true,
        errors: [],
      },
      metadata: {
        providerId: 'deterministic-e2e-stub',
        modelUsed: 'mock-gemini-pro',
        promptTokensUsed: 120,
        completionTokensUsed: 60,
        durationMs: 15,
        generationDurationMs: 15,
      },
    } as any;
  };
  (aiOrchestrator as any).generateQuestionCandidate = deterministicStub;
  (aiOrchestrator as any).generateTeluguScript = async (question: any) => {
    return {
      scriptPayload: {
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        scriptFormat: 'VIRAL_CHALLENGE',
        hookText: 'ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!',
        problemStatement: question?.questionText || '400 మీటర్ల రైలు 72 కి.మీ/గం వేగంతో స్తంభాన్ని దాటడానికి ఎన్ని సెకన్లు పడుతుంది?',
        stepByStepSolution: question?.explanation || 'సరైన సమాధానం 20 సెకన్లు',
        speedTrickOrTakeaway: '💡 బుర్ర ట్రిక్: 72 * 5/18 = 20 మీ/సె. 400 / 20 = 20 సెకన్లు.',
        callToAction: 'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.',
        notes: 'Deterministic test script proposal',
      },
      validation: {
        isValid: true,
        errors: [],
      },
    };
  };

  // -------------------------------------------------------------------------
  // 3. START EXPRESS + VITE FULL-STACK SERVER
  // -------------------------------------------------------------------------
  console.log('--- Starting Express + Vite Test Server ---');
  const app: Express = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const vite: ViteDevServer = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`✓ Test Server listening at: ${baseUrl}\n`);

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // -------------------------------------------------------------------------
    // 4. LAUNCH GOOGLE CHROME VIA PUPPETEER-CORE
    // -------------------------------------------------------------------------
    console.log('--- Launching Chrome via Puppeteer-Core ---');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1400,900',
      ],
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Instrument network response logging for API tracing
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        const method = response.request().method();
        const shortUrl = url.replace(baseUrl, '');
        console.log(`    [API Trace] ${method} ${shortUrl} -> HTTP ${status}`);
      }
    });

    // Dynamic session token provider for browser documents
    let currentActorToken = authorActor.token;
    await page.exposeFunction('__getTestSessionToken', () => currentActorToken);
    await page.evaluateOnNewDocument(async () => {
      try {
        const token = await (window as any).__getTestSessionToken();
        if (token) {
          localStorage.setItem('bp_session_token', token);
        }
      } catch {
        // ignore
      }
    });

    // =========================================================================
    // STEP 1: Navigation Case 1 — Direct Navigation to /studio
    // =========================================================================
    console.log('\n[Step 1: Navigation Case 1] Opening /studio directly (Clean Workspace Check)...');
    await page.goto(`${baseUrl}/studio`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#permanent-timeline-anchor', { timeout: 15000 });

    // Verify fresh Mode 1 workspace badge
    const modeBadgeText = await page.$eval('[data-testid="mode-badge"]', (el) => el.textContent?.trim());
    assert.ok(modeBadgeText?.includes('9:16'), 'Default Mode 1 9:16 badge must be active');

    // Confirm candidate workspace is clean (no residual question text loaded)
    const hasTextareaInitial = await page.$('textarea[data-testid="question-text-textarea"]');
    assert.strictEqual(hasTextareaInitial, null, 'Fresh /studio workspace must not have an active candidate prior to generation');
    console.log('  ✓ Navigation Case 1 PASS: /studio opened fresh Mode 1 workspace without residual state.');

    // =========================================================================
    // STEP 2: Stage 01 Candidate Generation & Save Draft
    // =========================================================================
    console.log('\n[Step 2] Selecting Topic/Subtopic and Generating Candidate...');
    await page.waitForSelector('select[data-testid="topic-select"]', { timeout: 10000 });

    await page.waitForFunction(() => {
      const select = document.querySelector('select[data-testid="topic-select"]') as HTMLSelectElement | null;
      return select && Array.from(select.options).some((o) => o.value === 'TOP-QA-01');
    }, { timeout: 10000 });
    await page.select('select[data-testid="topic-select"]', 'TOP-QA-01');

    await page.waitForFunction(() => {
      const select = document.querySelector('select[data-testid="subtopic-select"]') as HTMLSelectElement | null;
      return select && Array.from(select.options).some((o) => o.value === 'SUB-01');
    }, { timeout: 10000 });
    await page.select('select[data-testid="subtopic-select"]', 'SUB-01');

    await page.select('select[data-testid="question-count-select"]', '1');

    await page.waitForSelector('button[data-testid="generate-candidate-btn"]:not([disabled])', { timeout: 5000 });
    await page.click('button[data-testid="generate-candidate-btn"]');

    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 15000 });
    console.log('  ✓ Candidate generated via deterministic stub.');

    // Edit the question text in the candidate editor
    const editedQuestionText = 'రియల్ యూజర్ ప్రశ్న: 400 మీటర్ల రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తే టెలిగ్రాఫ్ స్తంభాన్ని దాటడానికి ఎంత సమయం పడుతుంది?';
    await page.evaluate((text) => {
      const textarea = document.querySelector('textarea[data-testid="question-text-textarea"]') as HTMLTextAreaElement | null;
      if (!textarea) throw new Error('Textarea question-text-textarea not found');
      const prototype = Object.getPrototypeOf(textarea);
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, text);
      } else {
        textarea.value = text;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }, editedQuestionText);

    // Verify in 9:16 Audience Preview
    await page.click('button[data-testid="toggle-canvas-preview"]');
    await page.waitForSelector('[data-testid="audience-916-screen"]', { timeout: 5000 });
    const previewText = await page.$eval('[data-testid="audience-question-text"]', (el) => el.textContent?.trim());
    assert.strictEqual(previewText, editedQuestionText, 'Audience preview must display live edited question text');

    // Confirm zero answer key leakage in audience preview
    const previewHtml = await page.$eval('[data-testid="audience-916-screen"]', (el) => el.innerHTML);
    assert.strictEqual(/correctanswer|correct_answer|answerkey/i.test(previewHtml), false, 'Zero answer key leakage');

    // Switch back to editor
    await page.click('button[data-testid="toggle-canvas-editor"]');
    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 5000 });

    // Click "Save Draft"
    console.log('  Clicking "Save Draft"...');
    await page.waitForSelector('button[data-testid="save-draft-btn"]:not([disabled])', { timeout: 5000 });
    await page.click('button[data-testid="save-draft-btn"]');
    await page.waitForSelector('[data-testid="saved-draft-badge"]', { timeout: 10000 });

    const badgeText = await page.$eval('[data-testid="saved-draft-badge"]', (el) => el.textContent?.trim() || '');
    const draftMatch = badgeText.match(/dft_[a-f0-9-]+/);
    assert.ok(draftMatch, 'Saved draft ID badge must be visible with prefix dft_');
    const savedDraftId = draftMatch[0];
    trackedDraftIds.add(savedDraftId);
    console.log(`  ✓ Stage 01 Draft persisted in Firestore: ${savedDraftId}`);

    // Verify persisted state in Firestore emulator question_drafts collection
    const persistedDraft = await questionDraftsRepository.findById(savedDraftId);
    assert.ok(persistedDraft, 'Draft must exist in Firestore emulator question_drafts');
    assert.strictEqual(persistedDraft.workflowStage, 'QUESTION_STUDIO');
    assert.strictEqual(persistedDraft.status, QuestionStatus.DRAFT);
    assert.strictEqual(persistedDraft.questionText, editedQuestionText);

    // Confirm Save Draft did NOT create an approved question prematurely
    const prematureQuestion = await questionsRepository.findById(savedDraftId);
    assert.strictEqual(prematureQuestion, null, 'Save Draft must NEVER create an approved question prematurely');
    console.log('  ✓ Firestore verified: Draft persisted in question_drafts, zero premature question record.');

    // =========================================================================
    // STEP 3: Navigation Case 2 — Explicit Resume via Query Parameter
    // =========================================================================
    console.log(`\n[Step 3: Navigation Case 2] Explicitly opening saved draft /studio?draftId=${savedDraftId}...`);
    await page.goto(`${baseUrl}/studio?draftId=${savedDraftId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 15000 });

    const restoredTextCase2 = await page.$eval('textarea[data-testid="question-text-textarea"]', (el: any) => el.value);
    assert.strictEqual(restoredTextCase2, editedQuestionText, 'Explicit draftId param must restore exact edited text');
    console.log('  ✓ Navigation Case 2 PASS: Explicit draft ID navigation restored exact draft from Firestore.');

    // =========================================================================
    // STEP 4: Navigation Case 3 — Navigate Away and Return to /studio
    // =========================================================================
    console.log('\n[Step 4: Navigation Case 3] Navigating away to /dashboard then returning to /studio...');
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#executive-dashboard-container', { timeout: 15000 });

    // Return to /studio directly (clean workspace test)
    await page.goto(`${baseUrl}/studio`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#permanent-timeline-anchor', { timeout: 15000 });

    const hasTextareaAfterReturn = await page.$('textarea[data-testid="question-text-textarea"]');
    assert.strictEqual(hasTextareaAfterReturn, null, 'Direct /studio route must NOT accidentally resume previous workflow');
    console.log('  ✓ Navigation Case 3 PASS: Direct navigation away and back preserves clean workspace isolation.');

    // =========================================================================
    // STEP 5: Navigation Case 4 — Explicit Resume Action from Dashboard
    // =========================================================================
    console.log('\n[Step 5: Navigation Case 4] Using explicit Resume link from Dashboard...');
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#executive-dashboard-container', { timeout: 15000 });

    // Wait for the action link containing the draftId
    await page.waitForSelector(`a[href*="/studio?draftId=${savedDraftId}"]`, { timeout: 10000 });
    await page.click(`a[href*="/studio?draftId=${savedDraftId}"]`);

    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 15000 });
    const restoredTextCase4 = await page.$eval('textarea[data-testid="question-text-textarea"]', (el: any) => el.value);
    assert.strictEqual(restoredTextCase4, editedQuestionText, 'Resume from Dashboard must restore targeted draft');
    console.log('  ✓ Navigation Case 4 PASS: Resume action from work queue restored exact targeted draft.');

    // =========================================================================
    // STEP 6: Submit for Verification & Workflow Transition
    // =========================================================================
    console.log('\n[Step 6] Submitting Draft for Verification...');
    await page.waitForSelector('button[data-testid="submit-verification-btn"]:not([disabled])', { timeout: 10000 });
    await page.click('button[data-testid="submit-verification-btn"]');

    // Wait for submission success banner
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('Submitted to Stage 02 Verification');
    }, { timeout: 10000 });

    // Verify Firestore transition in emulator
    const submittedDraft = await questionDraftsRepository.findById(savedDraftId);
    assert.ok(submittedDraft);
    assert.strictEqual(submittedDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submittedDraft.workflowStage, 'STAGE_02_VERIFICATION');

    const workflow = submittedDraft.workflowInstanceId
      ? await workflowRepository.findById(submittedDraft.workflowInstanceId)
      : (await workflowRepository.findByEntity('QUESTION', savedDraftId))[0];
    assert.ok(workflow, 'Workflow instance must exist in workflow_instances');
    assert.ok(workflow.id.startsWith('wfl_'), 'Workflow ID must use canonical prefix wfl_');
    assert.strictEqual((workflow as any).currentStep, 2, 'Workflow must be at Step 02 (Question Verification)');
    console.log(`  ✓ Submit for Verification verified: draft moved to STAGE_02_VERIFICATION, Workflow ${workflow.id} at Step 2.`);

    // =========================================================================
    // STEP 7: Stage 02 Verification UI & GAR-02 Anti-Self-Approval
    // =========================================================================
    console.log('\n[Step 7] Navigating to Stage 02 Verification as Author (GAR-02 Verification)...');
    await page.goto(`${baseUrl}/questions/${savedDraftId}/verify`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#permanent-timeline-anchor', { timeout: 15000 });

    // Confirm GAR-02 Anti-Self-Approval rejection in UI
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('Anti-Self-Approval Active (GAR-02)') ||
             document.body.textContent?.includes('Self-Approval Prohibited');
    }, { timeout: 10000 });
    console.log('  ✓ GAR-02 Anti-Self-Approval banner displayed in browser UI for author.');

    // Direct API call by author must also return HTTP 403
    const selfApproveRes = await fetch(`${baseUrl}/api/questions/draft/${savedDraftId}/approve`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ notes: 'Author attempting self-approval' }),
    });
    assert.strictEqual(selfApproveRes.status, 403, 'Author self-approval must return HTTP 403');
    console.log('  ✓ GAR-02 backend enforcement verified: Author self-approval returned HTTP 403.');

    // =========================================================================
    // STEP 8: Independent Reviewer Approval & Canonical Question Materialization
    // =========================================================================
    console.log('\n[Step 8] Switching to Independent Reviewer and Approving Question...');
    // Update session token to Reviewer
    currentActorToken = reviewerActor.token;
    await page.evaluate((token) => {
      localStorage.setItem('bp_session_token', token);
    }, reviewerActor.token);

    await page.goto(`${baseUrl}/questions/${savedDraftId}/verify`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#permanent-timeline-anchor', { timeout: 15000 });

    // Wait for asynchronous validation engine check to complete before approving
    await page.waitForFunction(() => !document.body.textContent?.includes('Validating...'), { timeout: 15000 });

    // Reviewer should see enabled "Approve & Mark Ready" button
    await page.waitForSelector('button[data-testid="approve-question-btn"]:not([disabled])', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    await page.click('button[data-testid="approve-question-btn"]');

    // Wait for "Proceed to Step 03: Audience Script Studio →" button to appear
    await page.waitForSelector('button[data-testid="proceed-to-stage03-btn"]', { timeout: 20000 });
    console.log('  ✓ Question approved and connected to Video Production in UI.');

    // Trace canonical question in Firestore emulator
    const allQuestions = await questionsRepository.findAll();
    const approvedQuestion = allQuestions.find((q) => q.status === QuestionStatus.APPROVED);
    assert.ok(approvedQuestion, 'Approved canonical question must exist in questions collection');
    trackedQuestionIds.add(approvedQuestion.id);
    assert.ok(
      approvedQuestion.id.startsWith('qst_') || approvedQuestion.id.startsWith('BP-Q-'),
      `Canonical question ID must have valid prefix: ${approvedQuestion.id}`
    );
    console.log(`  ✓ Canonical question materialized in Firestore: ${approvedQuestion.id}`);

    // Verify video record in Firestore emulator
    const videos = await videosRepository.findByQuestionId(approvedQuestion.id);
    assert.strictEqual(videos.length, 1, 'Exactly one video record must be queued for approved question');
    const queuedVideo = videos[0];
    trackedVideoIds.add(queuedVideo.id);
    assert.ok(
      queuedVideo.id.startsWith('vid_') || queuedVideo.id.startsWith('BP-V-'),
      `Video ID must have valid prefix: ${queuedVideo.id}`
    );
    assert.ok(
      queuedVideo.status === 'QUEUED' || queuedVideo.status === 'SCRIPT_REQUIRED',
      `Video status must be QUEUED or SCRIPT_REQUIRED: ${queuedVideo.status}`
    );
    console.log(`  ✓ Video production record created in Firestore: ${queuedVideo.id} (Status: ${queuedVideo.status})`);

    // Verify question_videos join record
    const qvList = await questionVideosRepository.findByQuestionId(approvedQuestion.id);
    assert.ok(qvList.length >= 1, 'question_videos join record must connect question to video');
    console.log(`  ✓ question_videos join record verified connecting ${approvedQuestion.id} -> ${queuedVideo.id}`);

    // =========================================================================
    // STEP 9: Stage 03 — Audience Script Studio
    // =========================================================================
    console.log('\n[Step 9: Stage 03] Navigating to Audience Script Studio...');
    // Switch to lead actor session (SCRIPT_WRITER / CONTENT_MANAGER) for Stage 03 script editing
    currentActorToken = leadActor.token;
    await page.evaluate((token) => {
      localStorage.setItem('bp_session_token', token);
    }, leadActor.token);

    // Click primary button to transition to Stage 03 in browser
    await page.click('button[data-testid="proceed-to-stage03-btn"]');

    // Wait for Script Workspace to mount
    await page.waitForSelector('textarea[data-testid="script-viral-hook"]', { timeout: 15000 });
    console.log(`  ✓ Audience Script Studio mounted for Video ${queuedVideo.id}`);

    // Edit script hook, narration, and CTA
    const authoredHook = 'ఈ ప్రశ్నను 5 సెకన్లలో సమాధానం చెబితే మీరు సూపర్ జీనియస్!';
    const authoredNarration = '400 మీటర్ల రైలు 72 కి.మీ/గం వేగంతో స్తంభాన్ని దాటడానికి ఎన్ని సెకన్లు పడుతుంది?';
    const authoredCta = 'మీ జవాబును వెంటనే కామెంట్ చేయండి! సరైన వివరణ పిన్డ్ కామెంట్ లో ఉంది.';

    await page.evaluate((hook) => {
      const el = document.querySelector('textarea[data-testid="script-viral-hook"]') as HTMLTextAreaElement | null;
      if (el) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, hook);
        } else {
          el.value = hook;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, authoredHook);

    await page.evaluate((narration) => {
      const el = document.querySelector('textarea[data-testid="script-viral-question"]') as HTMLTextAreaElement | null;
      if (el) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, narration);
        } else {
          el.value = narration;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, authoredNarration);

    await page.evaluate((cta) => {
      const el = document.querySelector('textarea[data-testid="script-viral-cta"]') as HTMLTextAreaElement | null;
      if (el) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, cta);
        } else {
          el.value = cta;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, authoredCta);

    // Click "Save" button in Script Workspace
    console.log('  Saving script draft to Firestore...');
    await page.waitForSelector('button[data-testid="save-script-btn"]:not([disabled])', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 200));
    await page.click('button[data-testid="save-script-btn"]');

    // Wait for success alert notification
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('Script draft saved successfully!');
    }, { timeout: 15000 });
    console.log('  ✓ Script draft saved successfully banner displayed in browser.');

    // Trace script persistence in Firestore emulator
    const savedScript = await scriptsRepository.findByVideoId(queuedVideo.id);
    assert.ok(savedScript, 'Script record must exist in scripts collection');
    trackedScriptIds.add(savedScript.id);
    assert.ok(
      savedScript.id.startsWith('scr_') || savedScript.id.startsWith('BP-S-'),
      `Script ID must use canonical prefix scr_: ${savedScript.id}`
    );
    assert.strictEqual(savedScript.videoId, queuedVideo.id);
    assert.strictEqual(savedScript.questionId, approvedQuestion.id);
    assert.strictEqual(savedScript.hookText, authoredHook);
    assert.strictEqual(savedScript.currentVersion, 1);
    console.log(`  ✓ Script persisted in Firestore: ${savedScript.id} (Version 1, linked to Video ${queuedVideo.id})`);

    // Verify script_versions immutable record in Firestore emulator
    const scriptVersions = await scriptVersionsRepository.findByScriptId(savedScript.id);
    assert.ok(scriptVersions.length >= 1, 'Version 1 must exist in script_versions collection');
    assert.strictEqual(scriptVersions[0].versionNumber, 1);
    console.log(`  ✓ Immutable script version record verified in script_versions: Version 1`);

    // =========================================================================
    // STEP 10: Persistence Across Page Reload in Stage 03
    // =========================================================================
    console.log('\n[Step 10] Testing Stage 03 Persistence Across Browser Reload...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea[data-testid="script-viral-hook"]', { timeout: 15000 });

    const reloadedHook = await page.$eval('textarea[data-testid="script-viral-hook"]', (el: any) => el.value);
    assert.strictEqual(reloadedHook, authoredHook, 'Authored script hook must persist across page reload from Firestore');

    const reloadedNarration = await page.$eval('textarea[data-testid="script-viral-question"]', (el: any) => el.value);
    assert.strictEqual(reloadedNarration, authoredNarration, 'Authored script question narration must persist across reload');

    const reloadedCta = await page.$eval('textarea[data-testid="script-viral-cta"]', (el: any) => el.value);
    assert.strictEqual(reloadedCta, authoredCta, 'Authored script CTA must persist across reload');
    console.log('  ✓ Stage 03 script 100% verified: survived browser reload directly from Firestore.');

  } finally {
    // Teardown browser
    if (browser) {
      await browser.close().catch(() => {});
    }

    // Restore stub
    aiOrchestrator.generateQuestionCandidate = originalGenerate;

    // Teardown HTTP server
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await vite.close();

    // =========================================================================
    // Explicit Scoped Cleanup in Firestore Emulator
    // =========================================================================
    console.log('\n--- Teardown & Scoped Cleanup in Firestore Emulator ---');
    for (const sId of trackedScriptIds) {
      await scriptsRepository.delete(sId).catch(() => {});
    }
    for (const vId of trackedVideoIds) {
      await videosRepository.delete(vId).catch(() => {});
    }
    for (const qId of trackedQuestionIds) {
      await questionsRepository.delete(qId).catch(() => {});
    }
    for (const draftId of trackedDraftIds) {
      await questionDraftsRepository.delete(draftId).catch(() => {});
    }
    for (const uId of trackedUserIds) {
      await usersRepository.delete(uId).catch(() => {});
    }
    for (const cId of trackedConfigIds) {
      await questionConfigRepository.delete(cId).catch(() => {});
    }
    for (const stId of trackedSubtopicIds) {
      await subtopicsRepository.delete(stId).catch(() => {});
    }
    for (const tId of trackedTopicIds) {
      await topicsRepository.delete(tId).catch(() => {});
    }
    console.log('✓ Teardown complete. Zero production records affected.\n');
  }

  console.log('========================================================================');
  console.log('BP-CMS: QUESTION CHALLENGE SHORT BROWSER E2E TEST PASSED 100%');
  console.log('========================================================================\n');
}

runQuestionChallengeShortBrowserE2ETest().catch((err) => {
  console.error('BROWSER E2E TEST FAILED:', err);
  process.exit(1);
});
