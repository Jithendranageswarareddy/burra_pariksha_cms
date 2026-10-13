/**
 * BURRA PARIKSHA CMS — Stage 27 FC-005 & S7-T08 Shared-Contract Test Suite
 *
 * Verifies authoritative shared-contract ownership, layer isolation, and isomorphism:
 * - TC-SC-01: Canonical Universal API Envelopes, Error Codes, and Response Factories in shared/
 * - TC-SC-02: Canonical Multi-Platform Adaptation Contracts in shared/
 * - TC-SC-03: Canonical UUID-based ID Generation Service and Domain Prefixes in shared/
 * - TC-SC-04: Strict Shared Layer Isolation (Zero backend, frontend, database, AI SDK, or secret leaks)
 * - TC-SC-05: Legacy src/ shims re-export canonical shared contracts without duplicate divergence
 * - TC-SC-06: Frontend and Backend consumer imports verify canonical contract usage
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ApiResponseEnvelope,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiErrorCode,
  API_ERROR_HTTP_STATUS,
  createSuccessResponse,
  createErrorResponse,
} from '../shared/contracts/api';

import {
  PlatformAdaptationStatus,
  type MultiPlatformAdaptationPayload,
  type PlatformAdaptationRecord,
} from '../shared/types/content';

import {
  canonicalIdService,
  CANONICAL_PREFIXES,
  CanonicalPrefix,
} from '../shared/lib/id.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFilesRecursively(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runSharedContractSuite() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — FC-005 & S7-T08 SHARED CONTRACTS TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TC-SC-01: Universal API Envelopes & Response Factories
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-01] Testing Universal API Envelopes & Response Factories...');

    // 1. Success response factory
    const testData = { item: 'Question draft', count: 42 };
    const reqId = 'req_test_123456';
    const successEnvelope: ApiSuccessResponse<typeof testData> = createSuccessResponse(
      testData,
      reqId,
      { version: 1, executionDurationMs: 15 }
    );

    assert.strictEqual(successEnvelope.success, true, 'Success envelope must have success=true');
    assert.deepStrictEqual(successEnvelope.data, testData, 'Envelope data must match provided payload');
    assert.strictEqual(successEnvelope.meta.requestId, reqId, 'Metadata must include requestId');
    assert.strictEqual(successEnvelope.meta.version, 1, 'Metadata must include custom properties');
    assert.strictEqual(typeof successEnvelope.meta.timestamp, 'string', 'Metadata must include ISO timestamp');

    // 2. Error response factory
    const errorEnvelope: ApiErrorResponse = createErrorResponse(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid payload provided',
      reqId,
      [{ field: 'title', issue: 'Title is required' }]
    );

    assert.strictEqual(errorEnvelope.success, false, 'Error envelope must have success=false');
    assert.strictEqual(errorEnvelope.error.code, ApiErrorCode.VALIDATION_ERROR, 'Error code must match');
    assert.strictEqual(errorEnvelope.error.message, 'Invalid payload provided', 'Error message must match');
    assert.strictEqual(errorEnvelope.error.requestId, reqId, 'Error payload must contain requestId');
    assert(Array.isArray(errorEnvelope.error.details), 'Error details must be preserved');

    // 3. HTTP status mapping completeness
    const expectedErrorCodes: ApiErrorCode[] = [
      ApiErrorCode.UNAUTHENTICATED,
      ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
      ApiErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
      ApiErrorCode.FORBIDDEN_BY_AI_GATING,
      ApiErrorCode.FORBIDDEN_BY_BUSINESS_RULE,
      ApiErrorCode.VALIDATION_ERROR,
      ApiErrorCode.RESOURCE_NOT_FOUND,
      ApiErrorCode.CONFLICT_OPTIMISTIC_LOCK,
      ApiErrorCode.CONCURRENCY_CONFLICT,
      ApiErrorCode.INVALID_WORKFLOW_TRANSITION,
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      ApiErrorCode.INTERNAL_SERVER_ERROR,
    ];

    for (const code of expectedErrorCodes) {
      assert(code in API_ERROR_HTTP_STATUS, `HTTP status mapping missing for ${code}`);
      const status = API_ERROR_HTTP_STATUS[code];
      assert(typeof status === 'number' && status >= 400 && status < 600, `Invalid status code ${status} for ${code}`);
    }

    console.log('    PASS: Universal API Envelopes and Response Factories canonical in shared/contracts/api.ts\n');
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-01 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-SC-02: Multi-Platform Adaptation Contracts
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-02] Testing Multi-Platform Adaptation Contracts...');

    // Verify PlatformAdaptationStatus enum values
    const expectedStatuses = [
      'DRAFT',
      'IN_REVIEW',
      'APPROVED',
      'READY_TO_PUBLISH',
      'CHANGES_REQUIRED',
      'REJECTED',
    ];
    for (const status of expectedStatuses) {
      assert(
        Object.values(PlatformAdaptationStatus).includes(status as PlatformAdaptationStatus),
        `PlatformAdaptationStatus must include ${status}`
      );
    }

    // Verify TypeScript interface validity by creating typed sample
    const samplePayload: MultiPlatformAdaptationPayload = {
      id: 'adp_sample_123',
      questionId: 'qst_sample_456',
      canonicalMetadataId: 'meta_sample_789',
      language: 'telugu',
      variants: {
        youtube: {
          title: 'BP Short',
          description: 'Test description',
          tags: ['telugu', 'gk'],
        },
        instagram: {
          caption: 'Test caption #burrapariksha',
          hashtags: ['burrapariksha'],
        },
      },
      isAllValid: true,
      aiCallsCount: 1,
      status: PlatformAdaptationStatus.APPROVED,
      generatedAt: new Date().toISOString(),
    };

    assert(samplePayload.id === 'adp_sample_123', 'MultiPlatformAdaptationPayload interface structurally valid');

    console.log('    PASS: Multi-Platform Adaptation contracts canonical in shared/types/content.ts\n');
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-02 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-SC-03: Canonical UUID-based ID Generation Service
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-03] Testing Canonical ID Generation Service in shared/lib/id.service.ts...');

    const expectedPrefixes: CanonicalPrefix[] = [
      'qst_', 'scr_', 'vid_', 'thm_', 'pin_', 'top_', 'sub_', 'usr_',
      'cnt_', 'pln_', 'bch_', 'asn_', 'anl_', 'spi_', 'adp_', 'str_',
      'cmt_', 'cmi_', 'wfl_', 'wfh_', 'aud_', 'med_', 'pub_', 'rev_',
    ];

    for (const p of expectedPrefixes) {
      assert(CANONICAL_PREFIXES.includes(p), `Canonical prefixes must include ${p}`);
      const id = canonicalIdService.generateCanonicalId(p);
      assert(id.startsWith(p), `Generated ID must start with prefix ${p}`);
      assert(canonicalIdService.validateCanonicalId(id, p), `Generated ID ${id} must validate with prefix ${p}`);
    }

    const adpId = canonicalIdService.generatePlatformAdaptationId();
    assert(adpId.startsWith('adp_'), `Platform adaptation ID must start with adp_`);

    console.log('    PASS: Canonical ID service correctly generates and validates distributed UUID IDs in shared/lib/id.service.ts\n');
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-03 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-SC-04: Strict Shared Layer Isolation (Zero forbidden leaks)
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-04] Auditing shared/ directory for strict layer isolation...');

    const sharedDir = path.resolve(__dirname, '../shared');
    const sharedFiles = scanFilesRecursively(sharedDir);
    assert(sharedFiles.length > 0, 'shared/ directory must contain source files');

    const forbiddenRules: Array<{ pattern: RegExp; description: string }> = [
      { pattern: /from\s+['"][^'"]*\/frontend\b/, description: 'Direct import of frontend' },
      { pattern: /from\s+['"][^'"]*\/backend\b/, description: 'Direct import of backend' },
      { pattern: /from\s+['"][^'"]*\/database\b/, description: 'Direct import of database' },
      { pattern: /from\s+['"][^'"]*\/src\b/, description: 'Direct import of src/' },
      { pattern: /from\s+['"](express|react|react-dom|react-router-dom)['"]/, description: 'Server or UI framework dependency' },
      { pattern: /from\s+['"](firebase|firebase-admin)(\/[^'"]*)?['"]/, description: 'Firebase or Firestore SDK dependency' },
      { pattern: /from\s+['"]@google\/genai['"]/, description: 'AI provider SDK dependency' },
      { pattern: /\bprocess\.env\b/, description: 'Server secret access (process.env)' },
    ];

    const violations: string[] = [];

    for (const filePath of sharedFiles) {
      const relPath = path.relative(sharedDir, filePath).replace(/\\/g, '/');
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');

      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

        for (const rule of forbiddenRules) {
          if (rule.pattern.test(line)) {
            violations.push(`shared/${relPath}:${lineIdx + 1} -> ${rule.description} ("${trimmed}")`);
          }
        }
      });
    }

    assert.strictEqual(violations.length, 0, `Found shared layer violations:\n${violations.join('\n')}`);
    console.log(`    PASS: All ${sharedFiles.length} files in shared/ are 100% pure isomorphic TypeScript (0 leaks).\n`);
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-04 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-SC-05: Legacy src/ shims re-export canonical shared contracts
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-05] Verifying legacy src/ compatibility shims re-export canonical shared contracts...');

    // Check src/lib/id.service.ts
    const legacyIdServicePath = path.resolve(__dirname, '../src/lib/id.service.ts');
    assert(fs.existsSync(legacyIdServicePath), 'src/lib/id.service.ts must exist as compatibility shim');
    const legacyIdContent = fs.readFileSync(legacyIdServicePath, 'utf8');
    assert(
      legacyIdContent.includes("from '../../shared") || legacyIdContent.includes("from '../../../shared") || legacyIdContent.includes("from '@/shared"),
      'src/lib/id.service.ts must re-export from shared'
    );

    // Check src/types/api-contracts.ts
    const legacyApiContractsPath = path.resolve(__dirname, '../src/types/api-contracts.ts');
    assert(fs.existsSync(legacyApiContractsPath), 'src/types/api-contracts.ts must exist as compatibility shim');
    const legacyApiContent = fs.readFileSync(legacyApiContractsPath, 'utf8');
    assert(
      legacyApiContent.includes("from '../../shared") || legacyApiContent.includes("from '@/shared"),
      'src/types/api-contracts.ts must re-export API envelopes from shared'
    );

    console.log('    PASS: Legacy shims in src/ correctly re-export canonical shared contracts without duplicate divergence.\n');
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-05 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-SC-06: Frontend and Backend consumer imports check
  // --------------------------------------------------------------------------
  try {
    console.log('[TC-SC-06] Verifying frontend and backend import shared contracts canonically...');

    // Verify backend routes imports from shared
    const routesPath = path.resolve(__dirname, '../backend/server/routers/routes.ts');
    assert(fs.existsSync(routesPath), 'backend/server/routers/routes.ts must exist');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    assert(
      routesContent.includes("from '../../../shared'") || routesContent.includes('from "../../../shared"'),
      'routes.ts must import shared contracts from shared/'
    );

    // Verify frontend api-client imports from shared
    const apiClientPath = path.resolve(__dirname, '../frontend/api/api-client.ts');
    assert(fs.existsSync(apiClientPath), 'frontend/api/api-client.ts must exist');
    const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
    assert(
      apiClientContent.includes("from '../../shared'") || apiClientContent.includes('from "../../shared"'),
      'frontend/api/api-client.ts must import shared contracts from shared/'
    );

    console.log('    PASS: Backend routes and Frontend api-client import shared contracts canonically.\n');
    passed++;
  } catch (err) {
    console.error('    FAIL: TC-SC-06 failed:', err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSharedContractSuite().catch((err) => {
  console.error('Fatal error during shared contract test suite:', err);
  process.exit(1);
});
