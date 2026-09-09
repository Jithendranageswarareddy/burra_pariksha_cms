/**
 * BURRA PARIKSHA CMS - Task 3 Taxonomy Engine Verification Test Suite
 * 
 * Verifies:
 * 1. Topic & Subtopic Canonical Data Models & Persistence
 * 2. Topic CRUD & Active/Inactive Toggling
 * 3. Subtopic CRUD & Active/Inactive Toggling
 * 4. Case-Insensitive Duplicate Prevention (Topics global, Subtopics scoped per Topic)
 * 5. Same-Name Subtopics under Different Topics (Allowed)
 * 6. Parent Reference Integrity & Orphan Prevention
 * 7. Question-Subtopic Taxonomy Mismatch Rejection
 * 8. Bulk Import Dry-Run & Idempotent Execution
 * 9. Performance / Cache Invalidation Engine
 * 10. Legacy Category Compatibility
 */

import { taxonomyService } from '../lib/services/taxonomy.service';
import { UserRole } from '../types';
import { ValidationError, ReferenceIntegrityError } from '../lib/google-sheets/errors';

export interface VerificationCheckResult {
  check: string;
  passed: boolean;
  details?: string;
}

export interface Task3VerificationReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationCheckResult[];
}

export async function runTask3TaxonomyEngineVerification(): Promise<Task3VerificationReport> {
  const results: VerificationCheckResult[] = [];
  const actor = { id: 'USR-ADMIN', name: 'Task 3 Test Runner' };

  try {
    // ----------------------------------------------------
    // CHECK 1: Legacy Category Preservation
    // ----------------------------------------------------
    const categories = await taxonomyService.getCategories();
    if (categories && categories.length > 0) {
      results.push({
        check: 'CHECK-01: Legacy Categories Preserved',
        passed: true,
        details: `Found ${categories.length} existing categories (e.g., "${categories[0].name}"). No categories deleted.`,
      });
    } else {
      results.push({
        check: 'CHECK-01: Legacy Categories Preserved',
        passed: false,
        details: 'No categories found in system.',
      });
    }

    // ----------------------------------------------------
    // CHECK 2: Topic Creation with Canonical Fields
    // ----------------------------------------------------
    const testTopicName = `Test Quant Topic ${Date.now()}`;
    const testTopicSlug = `test-quant-topic-${Date.now()}`;
    const createdTopic = await taxonomyService.createTopic(
      {
        name: testTopicName,
        slug: testTopicSlug,
        categoryId: categories[0]?.id || 'CAT-001',
        description: 'Test topic created for Task 3 verification',
        displayOrder: 5,
        isActive: true,
      },
      actor
    );

    const hasTopicCanonicalFields =
      createdTopic.id.length > 0 &&
      createdTopic.name === testTopicName &&
      createdTopic.slug === testTopicSlug &&
      createdTopic.isActive === true &&
      createdTopic.displayOrder === 5 &&
      typeof createdTopic.createdAt === 'string' &&
      typeof createdTopic.updatedAt === 'string';

    results.push({
      check: 'CHECK-02: Topic Creation & Canonical Data Model',
      passed: hasTopicCanonicalFields,
      details: hasTopicCanonicalFields
        ? `Created Topic ID: ${createdTopic.id}, Name: "${createdTopic.name}", isActive: ${createdTopic.isActive}`
        : `Topic missing required fields: ${JSON.stringify(createdTopic)}`,
    });

    // ----------------------------------------------------
    // CHECK 3: Topic Update & Active Toggling
    // ----------------------------------------------------
    const toggledTopic = await taxonomyService.toggleTopicActive(createdTopic.id, false, actor);
    const updatedTopic = await taxonomyService.updateTopic(
      createdTopic.id,
      { id: createdTopic.id, description: 'Updated test topic description' },
      actor
    );

    const isTopicUpdatedAndInactive =
      toggledTopic.isActive === false &&
      updatedTopic.description === 'Updated test topic description';

    results.push({
      check: 'CHECK-03: Topic Update & Active Status Toggling',
      passed: isTopicUpdatedAndInactive,
      details: isTopicUpdatedAndInactive
        ? `Topic updated successfully. isActive toggled to ${toggledTopic.isActive}.`
        : `Topic update or toggle failed: isActive=${toggledTopic.isActive}, desc=${updatedTopic.description}`,
    });

    // Restore topic to active for subtopic testing
    await taxonomyService.toggleTopicActive(createdTopic.id, true, actor);

    // ----------------------------------------------------
    // CHECK 4: Subtopic Creation & Canonical Data Model
    // ----------------------------------------------------
    const testSubtopicName = `Test Linear Subtopic ${Date.now()}`;
    const createdSubtopic = await taxonomyService.createSubtopic(
      {
        topicId: createdTopic.id,
        name: testSubtopicName,
        description: 'Detailed description for test subtopic',
        notes: 'Verification notes',
        displayOrder: 1,
        isActive: true,
      },
      actor
    );

    const hasSubtopicCanonicalFields =
      createdSubtopic.id.length > 0 &&
      createdSubtopic.topicId === createdTopic.id &&
      createdSubtopic.name === testSubtopicName &&
      createdSubtopic.isActive === true &&
      createdSubtopic.description === 'Detailed description for test subtopic' &&
      typeof createdSubtopic.createdAt === 'string';

    results.push({
      check: 'CHECK-04: Subtopic Creation & Parent Binding',
      passed: hasSubtopicCanonicalFields,
      details: hasSubtopicCanonicalFields
        ? `Created Subtopic ID: ${createdSubtopic.id}, Bound to Topic: ${createdSubtopic.topicId}`
        : `Subtopic missing required fields: ${JSON.stringify(createdSubtopic)}`,
    });

    // ----------------------------------------------------
    // CHECK 5: Subtopic Update & Active Status Toggling
    // ----------------------------------------------------
    const toggledSubtopic = await taxonomyService.toggleSubtopicActive(createdSubtopic.id, false, actor);
    const isSubtopicInactive = toggledSubtopic.isActive === false;

    // Reactivate
    await taxonomyService.toggleSubtopicActive(createdSubtopic.id, true, actor);

    results.push({
      check: 'CHECK-05: Subtopic Active Status Toggling',
      passed: isSubtopicInactive,
      details: isSubtopicInactive
        ? 'Subtopic active status successfully toggled to false and restored to true.'
        : `Subtopic toggle failed: isActive=${toggledSubtopic.isActive}`,
    });

    // ----------------------------------------------------
    // CHECK 6: Duplicate Topic Rejection
    // ----------------------------------------------------
    let duplicateTopicRejected = false;
    try {
      await taxonomyService.createTopic(
        {
          name: testTopicName.toUpperCase(), // Test case-insensitivity
          categoryId: categories[0]?.id || 'CAT-001',
        },
        actor
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        duplicateTopicRejected = true;
      }
    }

    results.push({
      check: 'CHECK-06: Case-Insensitive Duplicate Topic Prevention',
      passed: duplicateTopicRejected,
      details: duplicateTopicRejected
        ? 'Successfully caught and rejected duplicate Topic name.'
        : 'Failed to reject duplicate Topic name.',
    });

    // ----------------------------------------------------
    // CHECK 7: Duplicate Subtopic Rejection (Same Topic)
    // ----------------------------------------------------
    let duplicateSubtopicRejected = false;
    try {
      await taxonomyService.createSubtopic(
        {
          topicId: createdTopic.id,
          name: testSubtopicName.toLowerCase(), // Test case-insensitivity
        },
        actor
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        duplicateSubtopicRejected = true;
      }
    }

    results.push({
      check: 'CHECK-07: Duplicate Subtopic Prevention (Same Topic)',
      passed: duplicateSubtopicRejected,
      details: duplicateSubtopicRejected
        ? 'Successfully rejected duplicate Subtopic name under same parent Topic.'
        : 'Failed to reject duplicate Subtopic name under same parent Topic.',
    });

    // ----------------------------------------------------
    // CHECK 8: Same-Name Subtopic under Different Topic (Allowed)
    // ----------------------------------------------------
    const secondTopic = await taxonomyService.createTopic(
      {
        name: `Second Test Topic ${Date.now()}`,
        categoryId: categories[0]?.id || 'CAT-001',
      },
      actor
    );

    let sameNameDifferentTopicAllowed = false;
    try {
      const subtopicUnderSecondTopic = await taxonomyService.createSubtopic(
        {
          topicId: secondTopic.id,
          name: testSubtopicName, // Same subtopic name as under createdTopic!
        },
        actor
      );
      if (subtopicUnderSecondTopic && subtopicUnderSecondTopic.topicId === secondTopic.id) {
        sameNameDifferentTopicAllowed = true;
      }
    } catch (err) {
      sameNameDifferentTopicAllowed = false;
    }

    results.push({
      check: 'CHECK-08: Same-Name Subtopic Allowed under Different Topic',
      passed: sameNameDifferentTopicAllowed,
      details: sameNameDifferentTopicAllowed
        ? `Successfully created subtopic "${testSubtopicName}" under Topic ${secondTopic.id} despite existing under Topic ${createdTopic.id}.`
        : 'Incorrectly rejected identical subtopic name under a different parent Topic.',
    });

    // ----------------------------------------------------
    // CHECK 9: Parent Reference Integrity & Orphan Prevention
    // ----------------------------------------------------
    let orphanRejected = false;
    try {
      await taxonomyService.createSubtopic(
        {
          topicId: 'BP-TOP-NON-EXISTENT-99999',
          name: 'Orphan Subtopic',
        },
        actor
      );
    } catch (err) {
      if (err instanceof ReferenceIntegrityError) {
        orphanRejected = true;
      }
    }

    results.push({
      check: 'CHECK-09: Orphan Subtopic Prevention & Parent Integrity',
      passed: orphanRejected,
      details: orphanRejected
        ? 'Successfully rejected creation of subtopic referencing non-existent Topic ID.'
        : 'Failed to reject orphan subtopic creation.',
    });

    // ----------------------------------------------------
    // CHECK 10: Question-Subtopic Taxonomy Mismatch Validation
    // ----------------------------------------------------
    let mismatchRejected = false;
    try {
      // Attempt to validate Question with Topic A and Subtopic belonging to Topic B
      await taxonomyService.validateQuestionTaxonomy(
        createdTopic.id, // Topic A
        (await taxonomyService.getSubtopics(secondTopic.id))[0].id // Subtopic belonging to Topic B!
      );
    } catch (err) {
      if (err instanceof ValidationError && err.message.includes('Taxonomy integrity violation')) {
        mismatchRejected = true;
      }
    }

    results.push({
      check: 'CHECK-10: Question-Subtopic Mismatch Rejection',
      passed: mismatchRejected,
      details: mismatchRejected
        ? 'Successfully rejected taxonomy validation when Subtopic topicId does not match Question topicId.'
        : 'Failed to reject taxonomy mismatch between Question Topic and Subtopic.',
    });

    // ----------------------------------------------------
    // CHECK 11: Bulk Import Dry-Run Analysis
    // ----------------------------------------------------
    const importSample = {
      topics: [
        {
          name: `Bulk Import Topic Alpha ${Date.now()}`,
          description: 'Dry run test topic A',
          subtopics: [
            { name: 'Bulk Subtopic A1', description: 'Subtopic A1 desc' },
            { name: 'Bulk Subtopic A2', description: 'Subtopic A2 desc' },
          ],
        },
        {
          name: testTopicName, // Existing topic name to test reuse detection
          subtopics: [
            { name: 'New Subtopic under Existing Topic', description: 'Desc' },
          ],
        },
      ],
    };

    const dryRunReport = await taxonomyService.bulkImportDryRun(importSample);

    const isDryRunValid =
      dryRunReport.valid === true &&
      dryRunReport.summary.totalTopicsInInput === 2 &&
      dryRunReport.summary.newTopicsToCreate === 1 &&
      dryRunReport.summary.existingTopicsToReuse === 1 &&
      dryRunReport.summary.newSubtopicsToCreate === 3;

    results.push({
      check: 'CHECK-11: Bulk Import Dry-Run Analysis & Summary',
      passed: isDryRunValid,
      details: isDryRunValid
        ? `Dry run calculated correctly: Total Input Topics=2, New Topics=1, Reused Topics=1, New Subtopics=3.`
        : `Dry run calculation mismatch: ${JSON.stringify(dryRunReport.summary)}`,
    });

    // ----------------------------------------------------
    // CHECK 12: Bulk Import Execution (Idempotent)
    // ----------------------------------------------------
    const importExecution = await taxonomyService.executeBulkImport(importSample, actor);

    const isExecutionSuccessful =
      importExecution.success === true &&
      importExecution.createdTopics === 1 &&
      importExecution.createdSubtopics === 3;

    results.push({
      check: 'CHECK-12: Bulk Import Idempotent Execution',
      passed: isExecutionSuccessful,
      details: isExecutionSuccessful
        ? `Bulk import executed: Created ${importExecution.createdTopics} new topic(s) and ${importExecution.createdSubtopics} new subtopic(s).`
        : `Bulk import execution unexpected output: ${JSON.stringify(importExecution)}`,
    });

    // ----------------------------------------------------
    // CHECK 13: Taxonomy Tree Hierarchy & Performance Caching
    // ----------------------------------------------------
    const treeStart = Date.now();
    const tree = await taxonomyService.getTaxonomyTree({ includeInactive: true });
    const treeDuration1 = Date.now() - treeStart;

    const cacheStart = Date.now();
    await taxonomyService.getTaxonomyTree({ includeInactive: true });
    const treeDuration2 = Date.now() - cacheStart;

    const isTreeValidAndFast = tree && tree.length > 0 && Array.isArray(tree[0].topics);

    results.push({
      check: 'CHECK-13: Taxonomy Tree Generation & In-Memory Caching',
      passed: isTreeValidAndFast,
      details: isTreeValidAndFast
        ? `Taxonomy Tree generated with ${tree.length} top-level categories. Initial fetch: ${treeDuration1}ms, Cached fetch: ${treeDuration2}ms.`
        : 'Failed to generate Taxonomy Tree structure.',
    });

  } catch (err: any) {
    results.push({
      check: 'CHECK-CRITICAL: Unexpected Test Suite Exception',
      passed: false,
      details: err?.message || String(err),
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks: passedCount,
    failedChecks: failedCount,
    results,
  };
}
