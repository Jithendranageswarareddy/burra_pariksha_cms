/**
 * BURRA PARIKSHA CMS — Phase QS-19D Server Static Serving & MIME Verification Test
 */

import fs from 'fs';
import path from 'path';
import { AuthService } from '../lib/services/auth.service';
import { questionsRepository, sequencesRepository } from '../lib/repositories';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failCount++;
  }
}

async function runStaticServingTests() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE QS-19D SERVER STATIC SERVING TESTS');
  console.log('================================================================\n');

  // Initial Safety Snapshot
  const initialQuestions = await questionsRepository.findAll();
  const initialSequences = await sequencesRepository.findAll();
  const initialQCount = initialQuestions.length;
  const initialQSeq = initialSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const assetsPath = path.join(distPath, 'assets');

  // Find actual asset files
  const assetFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
  const jsAsset = assetFiles.find((f) => f.endsWith('.js'));
  const cssAsset = assetFiles.find((f) => f.endsWith('.css'));

  const authService = AuthService.getInstance();
  const adminToken = authService.generateSessionToken({
    userId: 'USR-001',
    name: 'Admin / Content Lead',
    role: 'ADMIN',
    roles: ['ADMIN'],
  });

  console.log('--- Suite 1: Static Bundle Asset Serving & MIME Types ---');

  // Test 1: dist/index.html exists
  assert(fs.existsSync(indexHtmlPath), 'Test 1: dist/index.html bundle exists on disk');

  // Test 2: GET / returns dist/index.html with text/html
  const rootRes = await fetch('http://localhost:3000/');
  const rootContentType = rootRes.headers.get('content-type') || '';
  const rootBody = await rootRes.text();
  assert(
    rootRes.status === 200 && rootContentType.includes('text/html') && rootBody.includes('<div id="root">'),
    'Test 2: GET / returns dist/index.html with text/html',
    `Status: ${rootRes.status}, Content-Type: ${rootContentType}`
  );

  // Test 3: Compiled JS asset is served with JavaScript MIME type
  if (jsAsset) {
    const jsRes = await fetch(`http://localhost:3000/assets/${jsAsset}`);
    const jsContentType = jsRes.headers.get('content-type') || '';
    assert(
      jsRes.status === 200 &&
        (jsContentType.includes('javascript') || jsContentType.includes('application/x-javascript')),
      `Test 3: GET /assets/${jsAsset} returns JavaScript MIME type`,
      `Status: ${jsRes.status}, Content-Type: ${jsContentType}`
    );
  } else {
    assert(false, 'Test 3: Compiled JS asset exists in dist/assets');
  }

  // Test 4: Compiled CSS asset is served with CSS MIME type
  if (cssAsset) {
    const cssRes = await fetch(`http://localhost:3000/assets/${cssAsset}`);
    const cssContentType = cssRes.headers.get('content-type') || '';
    assert(
      cssRes.status === 200 && cssContentType.includes('text/css'),
      `Test 4: GET /assets/${cssAsset} returns text/css MIME type`,
      `Status: ${cssRes.status}, Content-Type: ${cssContentType}`
    );
  } else {
    assert(false, 'Test 4: Compiled CSS asset exists in dist/assets');
  }

  console.log('\n--- Suite 2: SPA Route Fallback & API Non-Collision ---');

  // Test 5: SPA route /dashboard returns dist/index.html
  const spaRes1 = await fetch('http://localhost:3000/dashboard');
  const spaRes1Type = spaRes1.headers.get('content-type') || '';
  const spaRes1Body = await spaRes1.text();
  assert(
    spaRes1.status === 200 && spaRes1Type.includes('text/html') && spaRes1Body.includes('<div id="root">'),
    'Test 5: GET /dashboard resolves to SPA HTML entry',
    `Status: ${spaRes1.status}, Content-Type: ${spaRes1Type}`
  );

  // Test 6: SPA route /studio returns dist/index.html
  const spaRes2 = await fetch('http://localhost:3000/studio');
  const spaRes2Type = spaRes2.headers.get('content-type') || '';
  const spaRes2Body = await spaRes2.text();
  assert(
    spaRes2.status === 200 && spaRes2Type.includes('text/html') && spaRes2Body.includes('<div id="root">'),
    'Test 6: GET /studio resolves to SPA HTML entry',
    `Status: ${spaRes2.status}, Content-Type: ${spaRes2Type}`
  );

  // Test 7: /api/health returns 200 JSON (not swallowed by SPA)
  const healthRes = await fetch('http://localhost:3000/api/health');
  const healthType = healthRes.headers.get('content-type') || '';
  const healthJson = await healthRes.json();
  assert(
    healthRes.status === 200 && healthType.includes('application/json') && healthJson.status === 'ok',
    'Test 7: GET /api/health reaches backend Express route',
    `Status: ${healthRes.status}, Body: ${JSON.stringify(healthJson)}`
  );

  // Test 8: /api/questions/config returns 200 JSON with config payload
  const configRes = await fetch('http://localhost:3000/api/questions/config', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const configJson = await configRes.json();
  assert(
    configRes.status === 200 &&
      Array.isArray(configJson.realLifeContexts) &&
      Array.isArray(configJson.questionStyles),
    'Test 8: GET /api/questions/config reaches backend and returns active config',
    `Status: ${configRes.status}`
  );

  // Test 9: /api/dashboard/overview returns 200 JSON with overview metrics
  const dashRes = await fetch('http://localhost:3000/api/dashboard/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashJson = await dashRes.json();
  assert(
    dashRes.status === 200 && !!dashJson.metrics && Array.isArray(dashJson.todaysWork),
    'Test 9: GET /api/dashboard/overview reaches backend and returns metrics',
    `Status: ${dashRes.status}`
  );

  console.log('\n--- Suite 3: Production Safety & Invariance ---');

  const finalQuestions = await questionsRepository.findAll();
  const finalSequences = await sequencesRepository.findAll();
  const finalQCount = finalQuestions.length;
  const finalQSeq = finalSequences.find((s) => s.entityType === 'QUESTION')?.nextNumber;

  // Test 10: Zero production writes / questions created
  assert(
    finalQCount === initialQCount,
    `Test 10: Production question count unchanged (${initialQCount} === ${finalQCount})`
  );

  // Test 11: Sequences unchanged
  assert(
    finalQSeq === initialQSeq,
    `Test 11: Question sequence counter unchanged (${initialQSeq} === ${finalQSeq})`
  );

  console.log('\n================================================================');
  console.log(`QS-19D TEST RESULTS: ${passCount} PASS, ${failCount} FAIL`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStaticServingTests().catch((err) => {
  console.error('Fatal static serving test error:', err);
  process.exit(1);
});
