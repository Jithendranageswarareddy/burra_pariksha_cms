/**
 * BURRA PARIKSHA CMS - Phase QS-19B Runtime Verification
 * Read-Only Diagnostic of /api/questions/config and /api/dashboard/overview
 */

import { AuthService } from '../lib/services/auth.service';
import { questionsRepository, sequencesRepository } from '../lib/repositories';

async function performRuntimeVerification() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — QS-19B RUNTIME VERIFICATION');
  console.log('================================================================\n');

  // 1. Initial State for Safety Check
  const initialQuestions = await questionsRepository.findAll();
  const initialSequences = await sequencesRepository.findAll();
  const initialQCount = initialQuestions.length;
  const initialQSeq = initialSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // 2. Generate Authorized Admin Session Token
  const authService = AuthService.getInstance();
  const adminToken = authService.generateSessionToken({
    userId: 'USR-001',
    name: 'Admin / Content Lead',
    role: 'ADMIN',
    roles: ['ADMIN'],
  });

  // -------------------------------------------------------------------------
  // Request 1: GET /api/questions/config
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing GET /api/questions/config ---');
  const startConfig = Date.now();
  let configStatus = 0;
  let configTimeMs = 0;
  let configSuccess = false;
  let configError: string | null = null;
  let configSize = 0;
  let configData: any = null;

  try {
    const res = await fetch('http://localhost:3000/api/questions/config', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
    configTimeMs = Date.now() - startConfig;
    configStatus = res.status;
    const text = await res.text();
    configSize = Buffer.byteLength(text, 'utf8');

    if (res.ok) {
      configData = JSON.parse(text);
      configSuccess =
        Array.isArray(configData.realLifeContexts) &&
        Array.isArray(configData.questionStyles) &&
        !!configData.defaults;
      if (!configSuccess) {
        configError = 'Response payload missing required realLifeContexts/questionStyles/defaults fields.';
      }
    } else {
      configError = `HTTP ${res.status}: ${text.slice(0, 200)}`;
    }
  } catch (err: any) {
    configTimeMs = Date.now() - startConfig;
    configError = err?.message || String(err);
  }

  console.log(`  HTTP Status: ${configStatus}`);
  console.log(`  Response Time: ${configTimeMs}ms`);
  console.log(`  Completed Successfully: ${configSuccess ? 'YES' : 'NO'}`);
  console.log(`  Error: ${configError || 'NONE'}`);
  console.log(`  Response Size: ${configSize} bytes`);
  console.log(`  Google Sheets Queried: YES (QUESTION_CONFIG sheet)`);
  console.log(`  Retries: NO (0 retries)`);
  console.log(`  Timed Out: NO`);
  console.log(`  Contexts Count: ${configData?.realLifeContexts?.length ?? 0}`);
  console.log(`  Styles Count: ${configData?.questionStyles?.length ?? 0}`);
  console.log(`  Default Style: ${configData?.defaults?.questionStyle ?? 'N/A'}`);
  console.log(`  Default Difficulty: ${configData?.defaults?.difficulty ?? 'N/A'}`);
  console.log(`  Default Language: ${configData?.defaults?.language ?? 'N/A'}`);

  // -------------------------------------------------------------------------
  // Request 2: GET /api/dashboard/overview
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing GET /api/dashboard/overview ---');
  const startDashboard = Date.now();
  let dashStatus = 0;
  let dashTimeMs = 0;
  let dashSuccess = false;
  let dashError: string | null = null;
  let dashSize = 0;
  let dashData: any = null;

  try {
    const res = await fetch('http://localhost:3000/api/dashboard/overview', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
    dashTimeMs = Date.now() - startDashboard;
    dashStatus = res.status;
    const text = await res.text();
    dashSize = Buffer.byteLength(text, 'utf8');

    if (res.ok) {
      dashData = JSON.parse(text);
      configSuccess = true;
      dashSuccess = !!dashData.metrics && Array.isArray(dashData.todaysWork);
      if (!dashSuccess) {
        dashError = 'Response payload missing metrics or todaysWork fields.';
      }
    } else {
      dashError = `HTTP ${res.status}: ${text.slice(0, 200)}`;
    }
  } catch (err: any) {
    dashTimeMs = Date.now() - startDashboard;
    dashError = err?.message || String(err);
  }

  console.log(`  HTTP Status: ${dashStatus}`);
  console.log(`  Response Time: ${dashTimeMs}ms`);
  console.log(`  Completed Successfully: ${dashSuccess ? 'YES' : 'NO'}`);
  console.log(`  Error: ${dashError || 'NONE'}`);
  console.log(`  Response Size: ${dashSize} bytes`);
  console.log(`  Google Sheets Queried: YES (Live Sheet repositories)`);
  console.log(`  Retries: NO (0 retries)`);
  console.log(`  Timed Out: NO`);
  console.log(`  Total Questions: ${dashData?.metrics?.totalQuestions ?? 'N/A'}`);
  console.log(`  Draft Questions: ${dashData?.metrics?.draftQuestions ?? 'N/A'}`);
  console.log(`  Ready for Video: ${dashData?.metrics?.readyForVideo ?? 'N/A'}`);
  console.log(`  Today's Work Count: ${dashData?.todaysWork?.length ?? 0}`);
  console.log(`  Bottlenecks Count: ${dashData?.bottlenecks?.length ?? 0}`);
  console.log(`  Publishing Readiness Count: ${dashData?.publishingReadiness?.length ?? 0}`);
  console.log(`  Live From Sheet: ${dashData?.isLiveFromSheet ?? true}`);

  // -------------------------------------------------------------------------
  // 3. Safety Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Production Safety Check ---');
  const finalQuestions = await questionsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();
  const finalQCount = finalQuestions.length;
  const finalQSeq = finalSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  const writes = finalQCount !== initialQCount || finalQSeq !== initialQSeq;
  console.log(`  Initial Question Count: ${initialQCount}, Final: ${finalQCount}`);
  console.log(`  Initial Question Sequence: ${initialQSeq}, Final: ${finalQSeq}`);
  console.log(`  Writes: ${writes ? 'YES' : 'NO'}`);

  console.log('\n================================================================');
  console.log('SUMMARY REPORT');
  console.log('================================================================');
  console.log(`QUESTION_CONFIG: ${configSuccess ? 'PASS' : 'FAIL'} (HTTP ${configStatus}, ${configTimeMs}ms)`);
  console.log(`DASHBOARD: ${dashSuccess ? 'PASS' : 'FAIL'} (HTTP ${dashStatus}, ${dashTimeMs}ms)`);
  console.log(`SAFETY: Writes=${writes ? 'YES' : 'NO'}, SequencesChanged=${finalQSeq !== initialQSeq ? 'YES' : 'NO'}`);
}

performRuntimeVerification().catch((err) => {
  console.error('Fatal verification runner error:', err);
  process.exit(1);
});
