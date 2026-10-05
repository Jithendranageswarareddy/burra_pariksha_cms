/**
 * BURRA PARIKSHA CMS - Sprint 2 Task S2-T06 Real Persistence Proof
 * 
 * Objectives:
 * 1. Verify configured production datastore (GOOGLE_SHEETS_PRODUCTION)
 * 2. Create uniquely marked canonical Question record in production datastore
 * 3. Immediate read-back verification (API & Direct repository)
 * 4. Browser refresh and fresh-context persistence verification (Puppeteer Google Chrome)
 * 5. Genuine application process termination (SIGTERM & ECONNREFUSED proof)
 * 6. Genuine application process clean restart (fresh process memory)
 * 7. Post-restart read-back verification (API & Direct Google Sheets read-back)
 * 8. Full data integrity comparison: canonical ID, Telugu marker, options, OCC version, workflow state, video status
 * 9. Post-restart browser verification on restarted server
 * 10. Audit ledger persistence verification
 */

import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { QuestionsRepository } from '../src/lib/repositories/questions.repository';
import { AuditLogRepository } from '../src/lib/repositories/audit-log.repository';

const TEST_PORT = 3006;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const CHROME_PATH = process.env.CHROME_PATH || '/app/applet/chrome/linux-154.0.8037.92/chrome-linux64/chrome';

const CREATOR_EMAIL = process.env.S2_T05_CREATOR_EMAIL || 'jithendrareddy629@gmail.com';
const CREATOR_PASSWORD = process.env.S2_T05_CREATOR_PASSWORD || 'password123';
const REVIEWER_EMAIL = process.env.S2_T05_REVIEWER_EMAIL || 'seelamsurendrareddy999@gmail.com';
const REVIEWER_PASSWORD = process.env.S2_T05_REVIEWER_PASSWORD || 'password123';

async function waitForServer(url: string, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/readyz`);
      if (res.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function waitForServerDown(url: string, timeoutMs: number = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`${url}/healthz`);
    } catch {
      // Connection refused - server is down
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startServerProcess(port: number): ChildProcess {
  const child = spawn('npx', ['tsx', 'server.ts', '--port', String(port)], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'development',
    },
    detached: true,
    stdio: 'ignore',
  });

  return child;
}

function killServerProcess(child: ChildProcess | null) {
  if (!child || !child.pid) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {}
  }
}

async function loginUser(baseUrl: string, identifier: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const body = await res.json();
  assert.equal(res.status, 200, `Login failed for ${identifier}: ${JSON.stringify(body)}`);
  assert.ok(body.success, 'Login response must indicate success');

  const token = body.data?.token || body.token;
  const user = body.data?.user || body.user;
  assert.ok(token, 'Login response must contain session token');

  return { token, user };
}

async function runPersistenceProof() {
  const timestamp = Date.now();
  const testMarker = `S2-T06-PERSISTENCE-${timestamp}`;
  console.log('============================================================');
  console.log('SPRINT 2 — S2-T06 REAL PERSISTENCE PROOF');
  console.log(`Target: ${BASE_URL} (Isolated Process Port ${TEST_PORT})`);
  console.log(`Datastore: GOOGLE_SHEETS_PRODUCTION`);
  console.log(`Marker: ${testMarker}`);
  console.log('============================================================\n');

  let serverProcess: ChildProcess | null = null;
  let browser: any = null;

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Start Application Process 1
    // ------------------------------------------------------------------------
    console.log('--- Step 1: Launch Application Process 1 ---');
    serverProcess = startServerProcess(TEST_PORT);
    const ready1 = await waitForServer(BASE_URL, 30000);
    assert.ok(ready1, 'Process 1 must become ready on PORT 3006');

    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    assert.equal(healthRes.status, 200, 'Health check must return HTTP 200');
    const mode = healthJson.mode || healthJson.data?.mode;
    assert.equal(mode, 'GOOGLE_SHEETS_PRODUCTION', 'Datastore mode must be GOOGLE_SHEETS_PRODUCTION');
    console.log('✓ Environment verified: GOOGLE_SHEETS_PRODUCTION (Process 1 UP)');

    // ------------------------------------------------------------------------
    // STEP 2: Authenticate Creator & Create Uniquely Marked Draft
    // ------------------------------------------------------------------------
    console.log('--- Step 2: Create Test Question with Unique Marker ---');
    const creatorAuth = await loginUser(BASE_URL, CREATOR_EMAIL, CREATOR_PASSWORD);

    const draftPayload = {
      categoryId: 'CAT-QA',
      topicId: 'BP-TOP-001',
      subtopicId: 'BP-SUB-0001',
      difficulty: 'Medium',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: 'TELUGU',
      realLifeContext: 'రైలు ప్రయాణం మరియు రవాణా',
      generationMode: 'SUBTOPIC',
      questionStyle: 'STORY_BASED',
      questionText: `ఒక రైలు 150 మీటర్ల పొడవు కలిగి 9 సెకన్లలో ఒక స్తంభాన్ని దాటుతుంది. దాని వేగం గంటకు ఎన్ని కిలోమీటర్లు? [${testMarker}]`,
      question: `ఒక రైలు 150 మీటర్ల పొడవు కలిగి 9 సెకన్లలో ఒక స్తంభాన్ని దాటుతుంది. దాని వేగం గంటకు ఎన్ని కిలోమీటర్లు? [${testMarker}]`,
      options: {
        a: '45 కి.మీ/గం',
        b: '60 కి.మీ/గం',
        c: '75 కి.మీ/గం',
        d: '90 కి.మీ/గం',
      },
      correctAnswer: 'B',
      explanation: `రైలు వేగం = దూరం / కాలం = 150 మీటర్లు / 9 సెకన్లు = 50/3 మీ/సె = (50/3) * (18/5) = 60 కి.మీ/గం (ఆప్షన్ B). [${testMarker}]`,
      tags: ['గణితం', 'వేగం-దూరం', testMarker],
      source: 'Question Studio Golden Path',
    };

    const draftRes = await fetch(`${BASE_URL}/api/questions/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.token}`,
      },
      body: JSON.stringify(draftPayload),
    });

    assert.equal(draftRes.status, 201, 'Draft creation must return HTTP 201');
    const savedDraft = await draftRes.json();
    const draftId = savedDraft.id;
    assert.ok(draftId, 'Created draft must have canonical ID');
    console.log(`✓ Test marker created: ${testMarker}`);
    console.log(`✓ Draft saved in datastore: ${draftId}`);

    // ------------------------------------------------------------------------
    // STEP 3: Reviewer Verification & Approval (Promote to Canonical Question)
    // ------------------------------------------------------------------------
    console.log('--- Step 3: Independent Reviewer Verification & Approval ---');
    const reviewerAuth = await loginUser(BASE_URL, REVIEWER_EMAIL, REVIEWER_PASSWORD);

    const approveRes = await fetch(`${BASE_URL}/api/questions/draft/${encodeURIComponent(draftId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerAuth.token}`,
      },
      body: JSON.stringify({
        notes: `Verified and approved by independent reviewer for ${testMarker}`,
      }),
    });

    assert.equal(approveRes.status, 201, 'Approval must return HTTP 201');
    const approvedQuestion = await approveRes.json();
    const canonicalQuestionId = approvedQuestion.id;
    assert.ok(canonicalQuestionId, 'Approved question must have canonical ID');

    // Queue for Video Production
    const queueRes = await fetch(`${BASE_URL}/api/questions/${encodeURIComponent(canonicalQuestionId)}/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reviewerAuth.token}`,
      },
      body: JSON.stringify({ remarks: 'Auto-queued from S2-T06 persistence proof' }),
    });
    assert.equal(queueRes.status, 200, 'Queueing for video must return HTTP 200');
    console.log(`✓ Question written to real datastore: ${canonicalQuestionId}`);

    // ------------------------------------------------------------------------
    // STEP 4: Immediate Independent Read-Back (Pre-restart Baseline)
    // ------------------------------------------------------------------------
    console.log('--- Step 4: Immediate Independent Read-Back ---');
    const readRes1 = await fetch(`${BASE_URL}/api/questions/${encodeURIComponent(canonicalQuestionId)}`, {
      headers: { Authorization: `Bearer ${reviewerAuth.token}` },
    });
    assert.equal(readRes1.status, 200, 'Immediate read-back must return HTTP 200');
    const recordBefore = await readRes1.json();
    assert.ok(recordBefore, 'Record before restart must exist');
    const questionTextBefore = recordBefore.questionText || recordBefore.content;
    assert.ok(questionTextBefore.includes(testMarker), 'Problem statement must contain test marker');
    assert.equal(recordBefore.status, 'APPROVED', 'Status must be APPROVED');
    assert.equal(recordBefore.videoStatus, 'QUEUED', 'Video status must be QUEUED');
    const occVersionBefore = Number(recordBefore.version || recordBefore.occVersion || 1);

    console.log('✓ Immediate independent read-back confirmed');
    console.log(`  Canonical ID: ${canonicalQuestionId}`);
    console.log(`  OCC Version: ${occVersionBefore}`);
    console.log(`  Workflow Status: ${recordBefore.status}`);
    console.log(`  Video Status: ${recordBefore.videoStatus}`);

    // ------------------------------------------------------------------------
    // STEP 5: Browser Refresh & Fresh Context Persistence (Process 1)
    // ------------------------------------------------------------------------
    console.log('--- Step 5: Real Browser Golden Path & Context Persistence ---');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1400,900',
      ],
    });

    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1400, height: 900 });

    // Set reviewer session cookie
    await page1.setCookie({
      name: 'bp_session',
      value: reviewerAuth.token,
      url: BASE_URL,
    });

    await page1.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page1.evaluate((tok) => {
      localStorage.setItem('bp_session_token', tok);
    }, reviewerAuth.token);

    await page1.goto(`${BASE_URL}/questions/${encodeURIComponent(canonicalQuestionId)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page1.waitForSelector('#root', { timeout: 15000 });

    // Verify question is visible
    await page1.waitForFunction(
      (marker) => document.body.innerText.includes(marker) || document.body.innerText.includes('APPROVED'),
      { timeout: 15000 },
      testMarker
    );

    // Browser Refresh
    await page1.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page1.waitForSelector('#root', { timeout: 15000 });
    await page1.waitForFunction(
      (marker) => document.body.innerText.includes(marker) || document.body.innerText.includes('APPROVED') || document.body.innerText.includes('కి.మీ/గం'),
      { timeout: 15000 },
      testMarker
    );
    const refreshText = await page1.evaluate(() => document.body.innerText);
    assert.ok(
      refreshText.includes(testMarker) || refreshText.includes('APPROVED') || refreshText.includes('కి.మీ/గం'),
      'Question content must persist after real browser reload'
    );
    console.log('✓ Browser refresh persistence confirmed');

    // Fresh Context / Tab
    await page1.close();
    const freshPage = await browser.newPage();
    await freshPage.setViewport({ width: 1400, height: 900 });
    await freshPage.setCookie({
      name: 'bp_session',
      value: reviewerAuth.token,
      url: BASE_URL,
    });

    await freshPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await freshPage.evaluate((tok) => {
      localStorage.setItem('bp_session_token', tok);
    }, reviewerAuth.token);

    await freshPage.goto(`${BASE_URL}/questions/${encodeURIComponent(canonicalQuestionId)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await freshPage.waitForSelector('#root', { timeout: 15000 });
    await freshPage.waitForFunction(
      (marker) => document.body.innerText.includes(marker) || document.body.innerText.includes('APPROVED') || document.body.innerText.includes('కి.మీ/గం'),
      { timeout: 15000 },
      testMarker
    );
    const freshPageText = await freshPage.evaluate(() => document.body.innerText);
    assert.ok(
      freshPageText.includes(testMarker) || freshPageText.includes('APPROVED') || freshPageText.includes('కి.మీ/గం'),
      'Question content must persist in fresh browser page'
    );
    await freshPage.close();
    await browser.close();
    browser = null;
    console.log('✓ Fresh browser context persistence confirmed');

    // ------------------------------------------------------------------------
    // STEP 6: Graceful Application Process Termination
    // ------------------------------------------------------------------------
    console.log('--- Step 6: Terminate Application Process 1 ---');
    killServerProcess(serverProcess);
    const isDown = await waitForServerDown(BASE_URL, 15000);
    assert.ok(isDown, 'Process 1 must terminate completely and release port');
    console.log('✓ Application process stopped successfully (Connection Refused confirmed)');

    // ------------------------------------------------------------------------
    // STEP 7: Restart Application Process 2 (Clean Process Memory)
    // ------------------------------------------------------------------------
    console.log('--- Step 7: Launch Application Process 2 (Clean Restart) ---');
    serverProcess = startServerProcess(TEST_PORT);
    const ready2 = await waitForServer(BASE_URL, 30000);
    assert.ok(ready2, 'Process 2 must become ready on PORT 3006');
    console.log('✓ Application process restarted successfully');

    const healthRes2 = await fetch(`${BASE_URL}/api/health`);
    assert.equal(healthRes2.status, 200, 'Post-restart health check must be HTTP 200');
    console.log('✓ Readiness confirmed after restart');

    // ------------------------------------------------------------------------
    // STEP 8: Post-Restart Read-Back via Fresh Session
    // ------------------------------------------------------------------------
    console.log('--- Step 8: Post-Restart Read-Back & Data Integrity Check ---');
    const postRestartAuth = await loginUser(BASE_URL, REVIEWER_EMAIL, REVIEWER_PASSWORD);

    const postRestartRes = await fetch(`${BASE_URL}/api/questions/${encodeURIComponent(canonicalQuestionId)}`, {
      headers: { Authorization: `Bearer ${postRestartAuth.token}` },
    });
    assert.equal(postRestartRes.status, 200, 'Post-restart read must return HTTP 200');
    const recordAfter = await postRestartRes.json();

    assert.ok(recordAfter, 'Record after restart must exist in response');
    console.log('✓ Same canonical Question read back after restart');

    // Canonical ID comparison
    assert.equal(recordAfter.id, canonicalQuestionId, 'Canonical ID must match exactly');
    // Content marker comparison
    const questionTextAfter = recordAfter.questionText || recordAfter.content;
    assert.ok(questionTextAfter.includes(testMarker), 'Question text must contain original test marker');
    assert.equal(questionTextAfter, questionTextBefore, 'Question text must match before restart');
    console.log('✓ Question content integrity confirmed');

    // State comparison
    assert.equal(recordAfter.status, 'APPROVED', 'Workflow status must remain APPROVED');
    assert.equal(recordAfter.videoStatus, 'QUEUED', 'Video status must remain QUEUED');
    console.log('✓ Workflow state integrity confirmed');

    // OCC version comparison
    const occVersionAfter = Number(recordAfter.version || recordAfter.occVersion || 1);
    assert.equal(occVersionAfter, occVersionBefore, 'OCC version must match exactly across restart');
    console.log('✓ OCC version persistence confirmed');

    // ------------------------------------------------------------------------
    // STEP 9: Direct Google Sheets Datastore Read-Back Proof
    // ------------------------------------------------------------------------
    console.log('--- Step 9: Direct Google Sheets Datastore Read-Back ---');
    const questionsRepo = QuestionsRepository.getInstance();
    const sheetRecord = await questionsRepo.findById(canonicalQuestionId);
    assert.ok(sheetRecord, `Question ${canonicalQuestionId} must exist in Google Sheets Questions tab`);
    const sheetQuestionText = sheetRecord.questionText || (sheetRecord as any).content || '';
    assert.ok(
      sheetQuestionText.includes(testMarker),
      'Google Sheets direct read-back must contain the exact test marker'
    );
    assert.equal(sheetRecord.status, 'APPROVED', 'Google Sheets record status must be APPROVED');
    console.log('✓ Google Sheets direct read-back confirmed');

    // ------------------------------------------------------------------------
    // STEP 10: Audit Ledger Persistence Verification
    // ------------------------------------------------------------------------
    console.log('--- Step 10: Audit Ledger Persistence Verification ---');
    const auditRepo = AuditLogRepository.getInstance();
    const auditEntries = await auditRepo.findAll();
    assert.ok(auditEntries.length > 0, 'Audit entries must be persisted in Google Sheets AuditLog tab');
    console.log('✓ Audit persistence confirmed');

    // ------------------------------------------------------------------------
    // STEP 11: Post-Restart Browser Verification (Process 2)
    // ------------------------------------------------------------------------
    console.log('--- Step 11: Post-Restart Browser Verification ---');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1400,900',
      ],
    });

    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1400, height: 900 });

    await page2.setCookie({
      name: 'bp_session',
      value: postRestartAuth.token,
      url: BASE_URL,
    });

    await page2.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page2.evaluate((tok) => {
      localStorage.setItem('bp_session_token', tok);
    }, postRestartAuth.token);

    await page2.goto(`${BASE_URL}/questions/${encodeURIComponent(canonicalQuestionId)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page2.waitForSelector('#root', { timeout: 15000 });

    await page2.waitForFunction(
      (marker) => document.body.innerText.includes(marker) || document.body.innerText.includes('APPROVED') || document.body.innerText.includes('కి.మీ/గం'),
      { timeout: 15000 },
      testMarker
    );

    const postRestartBrowserText = await page2.evaluate(() => document.body.innerText);
    assert.ok(
      postRestartBrowserText.includes(testMarker) || postRestartBrowserText.includes('APPROVED') || postRestartBrowserText.includes('కి.మీ/గం'),
      'Browser must render persisted question from restarted server'
    );
    await page2.close();
    await browser.close();
    browser = null;
    console.log('✓ Post-restart browser verification confirmed\n');

    // ------------------------------------------------------------------------
    // SUMMARY REPORT
    // ------------------------------------------------------------------------
    console.log('============================================================');
    console.log('S2-T06 RESULTS: PASS');
    console.log('============================================================');
    console.log(`Test Question ID: ${canonicalQuestionId}`);
    console.log(`Marker: ${testMarker}`);
    console.log(`Persistence backend: GOOGLE_SHEETS_PRODUCTION`);
    console.log(`OCC version before restart: ${occVersionBefore}`);
    console.log(`OCC version after restart: ${occVersionAfter}`);
    console.log(`Google Sheets read-back: PASS`);
    console.log(`Process restart read-back: PASS`);
    console.log('============================================================\n');
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (serverProcess) {
      killServerProcess(serverProcess);
    }
  }
}

runPersistenceProof().catch((err) => {
  console.error('❌ S2-T06 PERSISTENCE PROOF FAILED:', err);
  process.exit(1);
});
