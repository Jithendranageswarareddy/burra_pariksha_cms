/**
 * SPRINT 5 ARCHITECTURE REGRESSION TEST
 * Complete Category Removal / 2-Tier Taxonomy Migration Verification
 *
 * Proves:
 * 1. No production Category repository exists in repository registry
 * 2. No active category endpoints exist in Express router
 * 3. Topic interface and records have NO categoryId property
 * 4. No production category ID allocator exists on idService
 * 5. No category seed data in production-taxonomy.ts
 * 6. Production initializer seeds only Topics and Subtopics
 * 7. Topic functions as the top-level taxonomy entity
 * 8. Subtopic belongs directly to exactly one Topic
 * 9. Question validation and creation work directly with Topic -> Subtopic
 * 10. categories Firestore collection is not part of authoritative domain collections
 */

import assert from 'node:assert';
import { DOMAIN_COLLECTIONS } from '../src/lib/schemas/domain-schemas';
import { idService } from '../src/lib/services/id.service';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } from '../src/lib/data/production-taxonomy';
import { firestoreProductionInitializer } from '../src/lib/services/firestore-production-initializer.service';
import { apiRouter } from '../src/server/routes';
import * as repos from '../src/lib/repositories';

async function runSprint5RegressionTests() {
  console.log('================================================================');
  console.log('SPRINT 5 — 2-TIER TAXONOMY ARCHITECTURE REGRESSION SUITE');
  console.log('Target Architecture: TOPIC -> SUBTOPIC (Category Completely Removed)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // Assertion 1: No production Category Repository
  // --------------------------------------------------------------------------
  try {
    console.log('Assertion 1: Verifying no CategoriesRepository exists in repository exports...');
    assert.strictEqual((repos as any).categoriesRepository, undefined, 'categoriesRepository must not be exported');
    assert.strictEqual((repos as any).CategoriesRepository, undefined, 'CategoriesRepository class must not be exported');
    console.log('✓ PASSED: CategoriesRepository is completely absent from active repository layer.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 2: No active Category endpoints in Express router
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 2: Verifying no active /categories routes exist in router...');
    const categoryRoutes = apiRouter.stack
      .filter((layer: any) => layer.route && layer.route.path)
      .map((layer: any) => layer.route.path)
      .filter((path: string) => path === '/categories' || path === '/categories/:id');
    
    assert.strictEqual(categoryRoutes.length, 0, `Active category routes found: ${categoryRoutes.join(', ')}`);
    console.log('✓ PASSED: Zero /categories routes exist in the Express router.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 3: Topic entity has NO categoryId
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 3: Verifying Topic entity has NO categoryId in seed data or runtime...');
    for (const topic of PRODUCTION_TOPICS) {
      assert.strictEqual((topic as any).categoryId, undefined, `Topic ${topic.id} has categoryId: ${(topic as any).categoryId}`);
      assert.strictEqual((topic as any).categoryName, undefined, `Topic ${topic.id} has categoryName`);
    }
    console.log(`✓ PASSED: All ${PRODUCTION_TOPICS.length} production topics are top-level with zero category references.`);
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 4: No production Category ID Allocator
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 4: Verifying idService has NO allocateCategoryId method...');
    assert.strictEqual((idService as any).allocateCategoryId, undefined, 'allocateCategoryId must not exist on idService');
    const domainSchemasModule = await import('../src/lib/schemas/domain-schemas');
    assert.strictEqual((domainSchemasModule as any).SEQUENCE_ENTITIES, undefined, 'SEQUENCE_ENTITIES is decommissioned in Sprint 6');
    console.log('✓ PASSED: No category ID allocator or sequence entity exists.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 5: categories Firestore collection removed from DOMAIN_COLLECTIONS
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 5: Verifying categories is absent from DOMAIN_COLLECTIONS registry...');
    assert.strictEqual((DOMAIN_COLLECTIONS as any).CATEGORIES, undefined, 'DOMAIN_COLLECTIONS.CATEGORIES must not exist');
    assert.strictEqual((DOMAIN_COLLECTIONS as any).category, undefined, 'DOMAIN_COLLECTIONS.category must not exist');
    console.log('✓ PASSED: categories collection is not in authoritative DOMAIN_COLLECTIONS.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 6: Production taxonomy contains ONLY Topics and Subtopics
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 6: Verifying production taxonomy contains ONLY Topics and Subtopics...');
    assert((PRODUCTION_TOPICS && PRODUCTION_TOPICS.length > 0), 'PRODUCTION_TOPICS must be populated');
    assert((PRODUCTION_SUBTOPICS && PRODUCTION_SUBTOPICS.length > 0), 'PRODUCTION_SUBTOPICS must be populated');
    
    // Check production-taxonomy module exports
    const prodTaxonomyModule = await import('../src/lib/data/production-taxonomy');
    assert.strictEqual((prodTaxonomyModule as any).PRODUCTION_CATEGORIES, undefined, 'PRODUCTION_CATEGORIES must not be exported');
    console.log(`✓ PASSED: Production taxonomy exports ${PRODUCTION_TOPICS.length} topics and ${PRODUCTION_SUBTOPICS.length} subtopics without categories.`);
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 7: Topic is top-level and Subtopic belongs directly to Topic
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 7: Verifying Topic -> Subtopic direct parent-child relationship...');
    const topicIds = new Set(PRODUCTION_TOPICS.map((t) => t.id));
    for (const sub of PRODUCTION_SUBTOPICS) {
      assert(sub.topicId, `Subtopic ${sub.id} must have a topicId`);
      assert(topicIds.has(sub.topicId), `Subtopic ${sub.id} points to non-existent topicId: ${sub.topicId}`);
      assert.strictEqual((sub as any).categoryId, undefined, `Subtopic ${sub.id} must not have categoryId`);
    }
    console.log(`✓ PASSED: All ${PRODUCTION_SUBTOPICS.length} subtopics belong directly to a valid Topic.`);
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 8: Taxonomy Service validates pure Topic -> Subtopic hierarchy
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 8: Testing pure 2-tier TaxonomyService validation...');
    (taxonomyService as any).topicsCache = [...PRODUCTION_TOPICS];
    (taxonomyService as any).subtopicsCache = [...PRODUCTION_SUBTOPICS];
    (taxonomyService as any).cacheTimestamp = Date.now();

    const validTopic = PRODUCTION_TOPICS[0];
    const validSubtopic = PRODUCTION_SUBTOPICS.find((s) => s.topicId === validTopic.id);
    assert(validSubtopic, 'Must find valid subtopic for first topic');

    // validateQuestionTaxonomy(topicId, subtopicId)
    const result = await taxonomyService.validateQuestionTaxonomy(validTopic.id, validSubtopic.id);
    assert.strictEqual(result.topic.id, validTopic.id, 'Validated topic ID must match');
    assert.strictEqual(result.subtopic.id, validSubtopic.id, 'Validated subtopic ID must match');
    assert.strictEqual((result as any).category, undefined, 'Result must not contain category');

    // validateTaxonomy(topicId, subtopicId)
    const boolResult = await taxonomyService.validateTaxonomy(validTopic.id, validSubtopic.id);
    assert.strictEqual(boolResult.topic.id, validTopic.id, 'validateTaxonomy topic ID must match');
    assert.strictEqual(boolResult.subtopic.id, validSubtopic.id, 'validateTaxonomy subtopic ID must match');
    console.log('✓ PASSED: TaxonomyService correctly validates Topic -> Subtopic without Category.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 9: Rejection of invalid Topic/Subtopic associations
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 9: Testing validation rejects mismatched Topic -> Subtopic...');
    const firstTopic = PRODUCTION_TOPICS[0];
    const otherSubtopic = PRODUCTION_SUBTOPICS.find((s) => s.topicId !== firstTopic.id);
    assert(otherSubtopic, 'Must find subtopic belonging to another topic');

    let threw = false;
    try {
      await taxonomyService.validateQuestionTaxonomy(firstTopic.id, otherSubtopic.id);
    } catch {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Must reject mismatched Topic/Subtopic pair');
    console.log('✓ PASSED: TaxonomyService strictly enforces Subtopic belongs directly to selected Topic.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 10: Production Initializer does not seed categories
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 10: Testing Production Initializer collections report...');
    const report = await firestoreProductionInitializer.initializeProductionData();
    assert.strictEqual(report.success, true, 'Production initialization must succeed');
    assert(report.collectionsInitialized.includes('topics'), 'Must initialize topics');
    assert(report.collectionsInitialized.includes('subtopics'), 'Must initialize subtopics');
    assert(!report.collectionsInitialized.includes('categories'), 'Must NOT initialize categories');
    console.log('✓ PASSED: Production Initializer seeds strictly Topics and Subtopics (no categories).');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Assertion 11: Google Sheets schema & Restore Validator have zero legacy Category
  // --------------------------------------------------------------------------
  try {
    console.log('\nAssertion 11: Verifying google-sheets-schema and restore-validator.service...');
    const sheetsSchemaModule = await import('../src/lib/schemas/google-sheets-schema');
    assert.strictEqual((sheetsSchemaModule as any).SEQUENCE_ENTITIES, undefined, 'google-sheets-schema SEQUENCE_ENTITIES must not exist in Sprint 6');
    assert.strictEqual((sheetsSchemaModule as any).ID_PREFIX_MAP, undefined, 'google-sheets-schema ID_PREFIX_MAP must not exist in Sprint 6');

    const fs = await import('node:fs');
    const path = await import('node:path');
    const validatorSrc = fs.readFileSync(path.join(process.cwd(), 'src/lib/services/restore-validator.service.ts'), 'utf-8');
    assert.strictEqual(validatorSrc.includes('categoryid'), false, 'restore-validator.service.ts must not contain categoryid');

    console.log('✓ PASSED: Google Sheets sequence schemas and Restore Validator are 100% free of Category references.');
    passed++;
  } catch (err: any) {
    console.error('✗ FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`SPRINT 5 REGRESSION SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprint5RegressionTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
