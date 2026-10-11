/**
 * SPRINT 6 ARCHITECTURAL REGRESSION TEST
 * Complete Removal of Entity ID Sequence Infrastructure Verification
 *
 * Proves:
 * 1. No SequencesRepository exists in repositories or on disk
 * 2. No SequenceSafetyService exists in services or on disk
 * 3. No sequence collection dependency (absent from DOMAIN_COLLECTIONS, 0 docs in Firestore)
 * 4. No sequence API endpoints exist in router or api-client
 * 5. No sequence allocator or SequenceAllocationError exists
 * 6. No sequence ID counter or nextNumber logic
 * 7. New Questions receive collision-resistant UUID-based canonical IDs (qst_<uuid>)
 * 8. New Topics receive collision-resistant UUID-based canonical IDs (top_<uuid>)
 * 9. New Subtopics receive collision-resistant UUID-based canonical IDs (sub_<uuid>)
 * 10. No active business service or production module imports sequence infrastructure
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAIN_COLLECTIONS } from '../src/lib/schemas/domain-schemas';
import { canonicalIdService } from '../src/lib/id.service';
import { apiRouter } from '../src/server/routes';
import * as repos from '../src/lib/repositories';
import * as services from '../src/lib/services';
import * as apiClient from '../frontend/api/api-client';
import * as errors from '../src/lib/errors';
import { getAdminFirestore } from '../src/lib/firebase/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootSrc = path.resolve(__dirname, '../src');

function scanSourceFiles(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSourceFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runSprint6RegressionSuite() {
  console.log('================================================================');
  console.log('SPRINT 6 — NO-SEQUENCE ARCHITECTURE REGRESSION SUITE');
  console.log('Target Architecture: Entity Service -> CanonicalIdService -> UUID -> Firestore');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // Check 1: No SequencesRepository
  // --------------------------------------------------------------------------
  try {
    console.log('[Check 1] Verifying SequencesRepository is completely eliminated...');
    assert.strictEqual((repos as any).sequencesRepository, undefined, 'sequencesRepository must not be exported');
    assert.strictEqual((repos as any).SequencesRepository, undefined, 'SequencesRepository class must not be exported');
    
    const repoFilePath = path.join(rootSrc, 'lib/repositories/sequences.repository.ts');
    assert.strictEqual(fs.existsSync(repoFilePath), false, 'sequences.repository.ts must not exist on disk');
    console.log('  -> PASS: SequencesRepository is absent from exports and disk.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 1:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 2: No SequenceSafetyService
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 2] Verifying SequenceSafetyService is completely eliminated...');
    assert.strictEqual((services as any).sequenceSafetyService, undefined, 'sequenceSafetyService must not be exported');
    assert.strictEqual((services as any).SequenceSafetyService, undefined, 'SequenceSafetyService class must not be exported');

    const serviceFilePath = path.join(rootSrc, 'lib/services/sequence-safety.service.ts');
    assert.strictEqual(fs.existsSync(serviceFilePath), false, 'sequence-safety.service.ts must not exist on disk');
    console.log('  -> PASS: SequenceSafetyService is absent from exports and disk.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 2:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 3: No sequence collection dependency
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 3] Verifying sequences collection is absent from DOMAIN_COLLECTIONS and Firestore...');
    assert.strictEqual((DOMAIN_COLLECTIONS as any).SEQUENCES, undefined, 'DOMAIN_COLLECTIONS.SEQUENCES must not exist');
    assert.strictEqual((DOMAIN_COLLECTIONS as any).sequences, undefined, 'DOMAIN_COLLECTIONS.sequences must not exist');

    const firestore = getAdminFirestore();
    const seqSnapshot = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnapshot.size, 0, `Firestore sequences collection must have 0 documents, found ${seqSnapshot.size}`);
    console.log('  -> PASS: sequences collection is not in DOMAIN_COLLECTIONS and has 0 documents in Firestore.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 3:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 4: No sequence API endpoints or client methods
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 4] Verifying sequence API routes and client methods are removed...');
    const registeredRoutes = apiRouter.stack
      .filter((layer: any) => layer.route && layer.route.path)
      .map((layer: any) => layer.route.path);

    const hasSeqSafetyRoute = registeredRoutes.some((p: string) => p.includes('sequence-safety'));
    const hasSyncSeqRoute = registeredRoutes.some((p: string) => p.includes('sync-sequence'));
    assert.strictEqual(hasSeqSafetyRoute, false, 'No sequence-safety route should exist in Express router');
    assert.strictEqual(hasSyncSeqRoute, false, 'No sync-sequence route should exist in Express router');

    assert.strictEqual((apiClient as any).getSequenceSafety, undefined, 'apiClient.getSequenceSafety must not exist');
    assert.strictEqual((apiClient as any).syncSequence, undefined, 'apiClient.syncSequence must not exist');
    console.log('  -> PASS: Zero sequence routes or API client methods exist.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 4:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 5: No sequence allocator or SequenceAllocationError
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 5] Verifying SequenceAllocationError and sequence allocation mechanics are deleted...');
    assert.strictEqual((errors as any).SequenceAllocationError, undefined, 'SequenceAllocationError must not exist');
    assert.strictEqual((canonicalIdService as any).allocateNextNumber, undefined, 'allocateNextNumber must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateQuestionId, undefined, 'allocateQuestionId must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateVideoId, undefined, 'allocateVideoId must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateScriptId, undefined, 'allocateScriptId must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateThumbnailId, undefined, 'allocateThumbnailId must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateTopicId, undefined, 'allocateTopicId must not exist on canonicalIdService');
    assert.strictEqual((canonicalIdService as any).allocateSubtopicId, undefined, 'allocateSubtopicId must not exist on canonicalIdService');
    console.log('  -> PASS: SequenceAllocationError, allocateNextNumber, and all allocate*Id aliases are eliminated.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 5:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 6: No sequence ID counter
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 6] Verifying no sequence counter state exists...');
    const schemasModule = await import('../src/lib/schemas/domain-schemas');
    assert.strictEqual((schemasModule as any).SEQUENCE_ENTITIES, undefined, 'SEQUENCE_ENTITIES must not exist');
    assert.strictEqual((schemasModule as any).ID_PREFIX_MAP, undefined, 'ID_PREFIX_MAP must not exist');
    console.log('  -> PASS: No sequence entity map or sequence counter exists.');
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 6:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 7: New Questions receive UUID-based canonical IDs
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 7] Verifying Question canonical UUID ID generation...');
    const questionId = canonicalIdService.generateQuestionId();
    assert.ok(questionId.startsWith('qst_'), `Question ID must start with qst_, got: ${questionId}`);
    const uuidPart = questionId.slice(4);
    assert.ok(UUID_V4_REGEX.test(uuidPart), `Question ID must have valid UUID v4 suffix, got: ${uuidPart}`);
    assert.ok(!questionId.includes('BP-Q-'), 'Question ID must not use old BP-Q- format');
    console.log(`  -> PASS: Question ID generated: ${questionId}`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 7:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 8: New Topics receive UUID-based canonical IDs
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 8] Verifying Topic canonical UUID ID generation...');
    const topicId = canonicalIdService.generateTopicId();
    assert.ok(topicId.startsWith('top_'), `Topic ID must start with top_, got: ${topicId}`);
    const uuidPart = topicId.slice(4);
    assert.ok(UUID_V4_REGEX.test(uuidPart), `Topic ID must have valid UUID v4 suffix, got: ${uuidPart}`);
    assert.ok(!topicId.includes('BP-TOP-'), 'Topic ID must not use old BP-TOP- format');
    console.log(`  -> PASS: Topic ID generated: ${topicId}`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 8:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 9: New Subtopics receive UUID-based canonical IDs
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 9] Verifying Subtopic canonical UUID ID generation...');
    const subtopicId = canonicalIdService.generateSubtopicId();
    assert.ok(subtopicId.startsWith('sub_'), `Subtopic ID must start with sub_, got: ${subtopicId}`);
    const uuidPart = subtopicId.slice(4);
    assert.ok(UUID_V4_REGEX.test(uuidPart), `Subtopic ID must have valid UUID v4 suffix, got: ${uuidPart}`);
    assert.ok(!subtopicId.includes('BP-SUB-'), 'Subtopic ID must not use old BP-SUB- format');
    console.log(`  -> PASS: Subtopic ID generated: ${subtopicId}`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 9:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Check 10: No business service imports sequence infrastructure
  // --------------------------------------------------------------------------
  try {
    console.log('\n[Check 10] Scanning all production source files for forbidden sequence imports...');
    const allFiles = scanSourceFiles(rootSrc);
    const forbiddenPatterns = [
      /from\s+['"][^'"]*sequences\.repository['"]/,
      /from\s+['"][^'"]*sequence-safety\.service['"]/,
      /SequenceAllocationError/,
      /sequencesRepository/,
      /SequenceSafetyService/,
      /sequenceSafetyService/,
    ];

    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(rootSrc, file),
              line: i + 1,
              text: line.trim(),
            });
          }
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found ${violations.length} forbidden sequence references in production source:\n` +
        violations.map((v) => `  ${v.file}:${v.line} -> ${v.text}`).join('\n')
    );
    console.log(`  -> PASS: 0 of ${allFiles.length} production source files import sequence infrastructure.`);
    passed++;
  } catch (err: any) {
    console.error('  -> FAIL Check 10:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`SPRINT 6 REGRESSION SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  try {
    await getAdminFirestore().terminate();
  } catch {}

  if (failed > 0) {
    process.exit(1);
  }
}

runSprint6RegressionSuite().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
