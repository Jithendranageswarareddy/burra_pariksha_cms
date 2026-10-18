/**
 * BURRA PARIKSHA CMS — S9-T19: Question Challenge Short Dedicated Browser E2E Test
 *
 * Verifies the complete real user journey for Mode 1 (Question Challenge Short)
 * in Google Chrome via Puppeteer-Core against an isolated local test environment:
 *
 * 1. Open Question Studio interface (/studio)
 * 2. Select canonical Topic (TOP-QA-01) and dependent Subtopic (SUB-01)
 * 3. Select Mode 1 (QUESTION_CHALLENGE_SHORT) and supported batch size (5)
 * 4. Generate batch questions and verify batch completeness and ordering
 * 5. Edit question and verify reflected in validation and 9:16 Audience Preview
 * 6. Confirm 9:16 preview does not expose answer keys or internal metadata
 * 7. Save draft and verify reopening across session refresh with edits intact
 * 8. Submit for verification and verify server-side workflow transition (Stage 02)
 * 9. Verify revision handling (request changes) and GAR-02 anti-self-approval rejection
 */

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

async function createActor(role: UserRole, prefix: string): Promise<ActorContext> {
  const userId = `usr_e2e_${prefix.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  trackedUserIds.add(userId);

  await usersRepository.appendRecord({
    id: userId,
    name: `${prefix} E2E`,
    email: `${userId}@burrapariksha.test`,
    role,
    roles: [role],
    isActive: true,
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = authService.generateSessionToken({
    userId,
    name: `${prefix} E2E`,
    role,
    roles: [role],
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
  console.log('S9-T19: QUESTION CHALLENGE SHORT DEDICATED BROWSER E2E AUTOMATION');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. DATASTORE ISOLATION & FAIL-CLOSED GUARD
  // -------------------------------------------------------------------------
  console.log('--- Step 0: Datastore Isolation Verification ---');
  const activeProjectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'burra-pariksha-test';
  const activeDatabaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

  const isolation: IsolationVerification = evaluateDatastoreIsolation(
    activeProjectId,
    activeDatabaseId,
    process.env
  );
  console.log(`[Isolation Audit] Evaluated mode: ${isolation.isolationMode}`);
  console.log(`[Isolation Audit] Emulator Host: ${process.env.FIRESTORE_EMULATOR_HOST || 'NONE'}`);
  console.log(`[Isolation Audit] Approved: ${isolation.isApproved ? 'YES' : 'NO'}`);

  // FAIL-CLOSED: ANY isolation.isApproved === false result MUST abort execution immediately!
  // A non-empty emulator-host variable must NOT independently authorize test execution.
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
  const reachability = await probeFirestoreConnectivity(adminDb);
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
  const reviewerActor = await createActor(UserRole.REVIEWER, 'ReviewerPadma');

  // Stub AI Orchestrator deterministically for zero external quota / zero network failure
  const originalGenerate = (aiOrchestrator as any).generateQuestionCandidate;
  let stubCallIndex = 0;
  const deterministicStub = async (input: any) => {
    stubCallIndex++;
    return {
      candidate: {
        content: `ప్రశ్న ${stubCallIndex}: రైలు వేగం గంటకు ${stubCallIndex * 20} కి.మీ అయితే 400 మీటర్లు దాటడానికి ఎంత సమయం పడుతుంది?`,
        questionText: `ప్రశ్న ${stubCallIndex}: రైలు వేగం గంటకు ${stubCallIndex * 20} కి.మీ అయితే 400 మీటర్లు దాటడానికి ఎంత సమయం పడుతుంది?`,
        option_a: `${stubCallIndex * 6} సెకన్లు`,
        option_b: `${stubCallIndex * 8} సెకన్లు`,
        option_c: `${stubCallIndex * 10} సెకన్లు`,
        option_d: `${stubCallIndex * 12} సెకన్లు`,
        options: {
          a: `${stubCallIndex * 6} సెకన్లు`,
          b: `${stubCallIndex * 8} సెకన్లు`,
          c: `${stubCallIndex * 10} సెకన్లు`,
          d: `${stubCallIndex * 12} సెకన్లు`,
        },
        correct_answer: 'B',
        correctAnswer: 'B',
        explanation: `వివరణ ${stubCallIndex}: దూరం మరియు వేగం సూత్రం ఆధారంగా సాధన చేయబడినది.`,
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

    const browserErrors: string[] = [];
    page.on('pageerror', (err: any) => {
      const msg = err?.message || String(err);
      console.warn('  [Page Error]:', msg);
      browserErrors.push(msg);
    });

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('403')) {
        console.warn('  [Console Error]:', text);
      }
    });

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Seed session token into localStorage before any page navigation
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('bp_session_token', token);
    }, authorActor.token);

    // =========================================================================
    // STEP 1: Open Question Studio Interface
    // =========================================================================
    console.log('[Step 1] Navigating to /studio...');
    await page.goto(`${baseUrl}/studio`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#permanent-timeline-anchor', { timeout: 15000 });
    console.log('  ✓ Question Studio UI opened with 15-stage timeline anchor');

    // =========================================================================
    // STEP 2: Select Canonical Topic & Dependent Subtopic
    // =========================================================================
    console.log('[Step 2] Selecting Topic and Subtopic...');
    await page.waitForSelector('select[data-testid="topic-select"]', { timeout: 10000 });

    // Wait for topic options to load
    await page.waitForFunction(() => {
      const select = document.querySelector('select[data-testid="topic-select"]') as HTMLSelectElement | null;
      return select && Array.from(select.options).some((o) => o.value === 'TOP-QA-01');
    }, { timeout: 10000 });

    await page.select('select[data-testid="topic-select"]', 'TOP-QA-01');

    // Wait for subtopic options to load for TOP-QA-01
    await page.waitForFunction(() => {
      const select = document.querySelector('select[data-testid="subtopic-select"]') as HTMLSelectElement | null;
      return select && Array.from(select.options).some((o) => o.value === 'SUB-01');
    }, { timeout: 10000 });

    await page.select('select[data-testid="subtopic-select"]', 'SUB-01');
    console.log('  ✓ Topic (TOP-QA-01) and dependent Subtopic (SUB-01) selected');

    // =========================================================================
    // STEP 3: Verify QUESTION_CHALLENGE_SHORT Mode and Batch Size 5
    // =========================================================================
    console.log('[Step 3] Selecting QUESTION_CHALLENGE_SHORT and count 5...');
    const modeBadgeText = await page.$eval('[data-testid="mode-badge"]', (el) => el.textContent?.trim());
    assert.ok(modeBadgeText?.includes('9:16'), 'Default Mode 1 9:16 badge must be active');

    await page.select('select[data-testid="question-count-select"]', '5');
    const selectedCount = await page.$eval('select[data-testid="question-count-select"]', (el: any) => el.value);
    assert.strictEqual(selectedCount, '5');
    console.log('  ✓ Mode 1 QUESTION_CHALLENGE_SHORT with batch size 5 verified');

    // =========================================================================
    // STEP 4: Generate Questions & Verify Batch Completeness & Ordering
    // =========================================================================
    console.log('[Step 4] Generating 5-question batch...');
    await page.waitForSelector('button[data-testid="generate-candidate-btn"]:not([disabled])', { timeout: 5000 });
    await page.click('button[data-testid="generate-candidate-btn"]');

    // Wait for batch generation to complete and batch slots nav to appear
    await page.waitForSelector('[data-testid="batch-slots-nav"]', { timeout: 15000 });

    // Verify 5 slots rendered in order
    const slotCount = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[data-testid^="slot-tab-"]'));
      return tabs.length;
    });
    assert.strictEqual(slotCount, 5, 'Exactly 5 batch slots must be assembled in order');

    // Verify Slot 1 is active and candidate fields are populated
    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 5000 });
    const initialQuestionText = await page.$eval(
      'textarea[data-testid="question-text-textarea"]',
      (el: any) => el.value
    );
    assert.ok(initialQuestionText.length > 10, 'Generated question text must be populated');
    assert.match(initialQuestionText, /ప్రశ్న 1/);
    console.log(`  ✓ Batch generated: 5 complete slots assembled in order (Slot 1 active)`);

    // =========================================================================
    // STEP 5: Edit Question & Verify in 9:16 Audience Preview
    // =========================================================================
    console.log('[Step 5] Editing question and verifying in 9:16 Audience Preview...');
    const editedText = 'సవరించిన ప్రశ్న: 100 మీటర్ల పరుగు పందెం లో విజేత ప్రయాణించిన వేగం ఎంత?';

    // Focus, select all, and replace textarea content cleanly
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
    }, editedText);

    // Switch to 9:16 Audience Preview
    await page.waitForSelector('button[data-testid="toggle-canvas-preview"]', { timeout: 5000 });
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-testid="toggle-canvas-preview"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForSelector('[data-testid="audience-preview-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="audience-916-screen"]', { timeout: 5000 });

    // Verify edited question text is reflected in the 9:16 screen
    const previewQuestionText = await page.$eval(
      '[data-testid="audience-question-text"]',
      (el) => el.textContent?.trim()
    );
    assert.strictEqual(previewQuestionText, editedText, 'Audience preview must reflect live edited question text');
    console.log('  ✓ Live edit verified in 9:16 Audience Preview');

    // =========================================================================
    // STEP 6: Confirm Preview Does NOT Leak Answer Keys or Metadata
    // =========================================================================
    console.log('[Step 6] Confirming zero answer key leakage in Audience Preview...');
    const screenHtml = await page.$eval('[data-testid="audience-916-screen"]', (el) => el.innerHTML);

    // Verify options are rendered
    assert.ok(screenHtml.includes('audience-option-a') || screenHtml.includes('A'), 'Option A must be visible');
    assert.ok(screenHtml.includes('audience-option-b') || screenHtml.includes('B'), 'Option B must be visible');

    // Confirm strict absence of answer key indicators and internal metadata
    assert.strictEqual(
      /correctanswer|correct_answer|answerkey|answer key/i.test(screenHtml),
      false,
      'Audience screen must NEVER expose answer key or correct answer indicator'
    );
    assert.strictEqual(
      /revisionnumber|slotid|authorid/i.test(screenHtml),
      false,
      'Audience screen must NEVER expose internal slot or database IDs'
    );

    // Switch back to editor view
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-testid="toggle-canvas-editor"]') as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 5000 });
    console.log('  ✓ Zero answer key and zero metadata leak confirmed');

    // =========================================================================
    // STEP 7: Save Draft & Verify Reopening Across Refresh
    // =========================================================================
    console.log('[Step 7] Saving draft and reopening across refresh...');
    await page.waitForSelector('button[data-testid="save-draft-btn"]:not([disabled])', { timeout: 10000 });
    await page.click('button[data-testid="save-draft-btn"]');
    await page.waitForSelector('[data-testid="saved-draft-badge"]', { timeout: 10000 });
    const draftIdBadgeText = await page.$eval(
      '[data-testid="saved-draft-badge"]',
      (el) => el.textContent?.trim() || ''
    );
    const match = draftIdBadgeText.match(/dft_[a-f0-9-]+/);
    assert.ok(match, 'Saved draft ID must appear in UI');
    const savedDraftId = match[0];
    trackedDraftIds.add(savedDraftId);
    console.log(`  ✓ Draft saved to Firestore: ${savedDraftId}`);

    // Verify persisted state in Firestore emulator
    const persistedDraft = await questionDraftsRepository.findById(savedDraftId);
    assert.ok(persistedDraft, 'Draft must exist in Firestore emulator');
    assert.strictEqual(persistedDraft.workflowStage, 'QUESTION_STUDIO');
    assert.strictEqual(persistedDraft.status, QuestionStatus.DRAFT);
    assert.strictEqual(persistedDraft.slots.length, 5);
    assert.strictEqual(persistedDraft.slots[0].questionText, editedText);
    assert.strictEqual(persistedDraft.slots[0].isManuallyEdited, true);
    console.log('  ✓ Verified persisted draft in Firestore: Stage 01, 5 slots, edits intact');

    // Refresh browser page and verify saved draft reopening
    console.log('  Reloading browser page to test fresh-session hydration...');
    await page.goto(`${baseUrl}/studio?id=${savedDraftId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea[data-testid="question-text-textarea"]', { timeout: 15000 });

    const hydratedText = await page.$eval(
      'textarea[data-testid="question-text-textarea"]',
      (el: any) => el.value
    );
    assert.strictEqual(hydratedText, editedText, 'Reopened draft must contain saved edited text');
    console.log('  ✓ Draft reopened across refresh with saved edits 100% intact');

    // =========================================================================
    // STEP 8: Submit for Verification & Server-Side Workflow Transition
    // =========================================================================
    console.log('[Step 8] Submitting for verification...');
    await page.waitForSelector('button[data-testid="submit-verification-btn"]:not([disabled])', { timeout: 10000 });
    await page.click('button[data-testid="submit-verification-btn"]');

    // Wait for submission success banner
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('Submitted to Stage 02 Verification');
    }, { timeout: 10000 });

    // Verify server-side transition in Firestore emulator
    const submittedDraft = await questionDraftsRepository.findById(savedDraftId);
    assert.ok(submittedDraft);
    assert.strictEqual(submittedDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submittedDraft.workflowStage, 'STAGE_02_VERIFICATION');
    console.log('  ✓ Submitted for verification: transitioned to STAGE_02_VERIFICATION');

    // =========================================================================
    // STEP 9: Revision Handling & GAR-02 Anti-Self-Approval
    // =========================================================================
    console.log('[Step 9] Verifying revision handling and GAR-02 anti-self-approval...');

    // 9.1 GAR-02 Strict Anti-Self-Approval: Author cannot approve own draft
    const selfApproveRes = await fetch(`${baseUrl}/api/questions/draft/${savedDraftId}/approve`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ notes: 'Author trying to approve own draft' }),
    });
    assert.strictEqual(selfApproveRes.status, 403, 'Author self-approval must return HTTP 403');
    console.log('  ✓ GAR-02 strictly enforced: author cannot self-approve (HTTP 403)');

    // 9.2 Reviewer returns draft for revision (Stage 02 -> Stage 01)
    const reviewerFeedback = 'స్లాట్ 1 లో వివరణ మరింత వివరించండి.';
    const requestChangesRes = await fetch(`${baseUrl}/api/questions/draft/${savedDraftId}/request-changes`, {
      method: 'POST',
      headers: reviewerActor.headers,
      body: JSON.stringify({ reason: reviewerFeedback }),
    });
    assert.strictEqual(requestChangesRes.status, 200, 'Reviewer request-changes must return HTTP 200');

    // Verify reverse transition in Firestore emulator
    const returnedDraft = await questionDraftsRepository.findById(savedDraftId);
    assert.strictEqual(returnedDraft?.workflowStage, 'QUESTION_STUDIO');
    assert.strictEqual(returnedDraft?.status, QuestionStatus.DRAFT);
    console.log('  ✓ Reviewer requested changes: transitioned back to QUESTION_STUDIO');

    // 9.3 Reload in browser and verify reviewer feedback banner is displayed
    await page.goto(`${baseUrl}/studio?id=${savedDraftId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction((feedback) => {
      return document.body.textContent?.includes(feedback);
    }, { timeout: 10000 }, reviewerFeedback);
    console.log('  ✓ Browser UI displayed reviewer feedback banner with requested changes');

    // 9.4 Resubmit and independent reviewer approves
    const resubmitRes = await fetch(`${baseUrl}/api/questions/draft/${savedDraftId}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ expectedVersion: returnedDraft?.version }),
    });
    assert.strictEqual(resubmitRes.status, 200);

    const approveRes = await fetch(`${baseUrl}/api/questions/draft/${savedDraftId}/approve`, {
      method: 'POST',
      headers: reviewerActor.headers,
      body: JSON.stringify({ notes: 'Independent reviewer approval' }),
    });
    assert.strictEqual(approveRes.status, 201, 'Reviewer approval must return HTTP 201');
    const createdQuestion = await approveRes.json();
    assert.ok(createdQuestion.id);
    trackedQuestionIds.add(createdQuestion.id);
    assert.strictEqual(createdQuestion.status, QuestionStatus.APPROVED);
    console.log(`  ✓ Independent reviewer approved: canonical Question materialized ${createdQuestion.id}\n`);

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
    console.log('--- Teardown & Scoped Cleanup ---');
    console.log(`Cleaning up ${trackedDraftIds.size} test drafts...`);
    for (const draftId of trackedDraftIds) {
      try {
        await questionDraftsRepository.delete(draftId);
      } catch (e: any) {
        console.warn(`Could not delete draft ${draftId}: ${e?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedQuestionIds.size} test questions...`);
    for (const qId of trackedQuestionIds) {
      try {
        await questionsRepository.delete(qId);
      } catch (e: any) {
        console.warn(`Could not delete question ${qId}: ${e?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedUserIds.size} test users...`);
    for (const uId of trackedUserIds) {
      try {
        await usersRepository.delete(uId);
      } catch (e: any) {
        console.warn(`Could not delete user ${uId}: ${e?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedConfigIds.size} test configs...`);
    for (const cId of trackedConfigIds) {
      try {
        await questionConfigRepository.delete(cId);
      } catch (e: any) {
        console.warn(`Could not delete config ${cId}: ${e?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedSubtopicIds.size} test subtopics...`);
    for (const stId of trackedSubtopicIds) {
      try {
        await subtopicsRepository.delete(stId);
      } catch (e: any) {
        console.warn(`Could not delete subtopic ${stId}: ${e?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedTopicIds.size} test topics...`);
    for (const tId of trackedTopicIds) {
      try {
        await topicsRepository.delete(tId);
      } catch (e: any) {
        console.warn(`Could not delete topic ${tId}: ${e?.message}`);
      }
    }
    console.log('✓ Teardown complete. Zero audit logs deleted. Zero production records affected.\n');
  }

  console.log('========================================================================');
  console.log('S9-T19 BROWSER E2E QUESTION CHALLENGE SHORT TEST PASSED 100%');
  console.log('========================================================================\n');
}

runQuestionChallengeShortBrowserE2ETest().catch((err) => {
  console.error('S9-T19 BROWSER E2E TEST FAILED:', err);
  process.exit(1);
});
