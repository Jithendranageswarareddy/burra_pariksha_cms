/**
 * BURRA PARIKSHA CMS — Safe, Idempotent Launch Taxonomy Seeding Utility
 * Target: Exactly 2 Top-Level Topics (Aptitude, Reasoning) & 36 Subtopics (18 each)
 *
 * SAFETY INVARIANTS:
 * 1. Read/Write directly via authoritative Firestore repositories.
 * 2. 100% Idempotent: Rerunning does not duplicate Topics or Subtopics.
 * 3. Never deletes existing users, questions, audit logs, or unrelated content.
 * 4. Preserves referential integrity: Subtopics link directly to parent Topic ID.
 * 5. Uses canonical IDs conforming to canonicalIdService (top_ / sub_).
 * 6. Audit logged with System Admin actor.
 */

import { getAdminFirestore } from '../database/firestore/adapter/admin';
import { topicsRepository, subtopicsRepository } from '../database/firestore/repositories';
import { taxonomyService } from '../backend/domain/taxonomy/services/taxonomy.service';
import { auditService } from '../backend/infrastructure/audit/services/audit.service';
import { PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } from '../src/lib/data/production-taxonomy';
import { Topic, Subtopic } from '../src/types';

export interface SeedReport {
  timestamp: string;
  projectId: string;
  databaseId: string;
  topicsCreated: number;
  topicsReused: number;
  subtopicsCreated: number;
  subtopicsReused: number;
  totalActiveTopics: number;
  totalActiveSubtopics: number;
  topics: Array<{ id: string; name: string; slug: string; subtopicsCount: number }>;
}

export async function seedLaunchTaxonomy(): Promise<SeedReport> {
  const db = getAdminFirestore();
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '(configured default)';
  const databaseId = process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || '(default)';

  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — LAUNCH TAXONOMY SETUP (APTITUDE + REASONING)');
  console.log('============================================================');
  console.log(`Firestore Project: ${projectId}`);
  console.log(`Firestore Database: ${databaseId}`);
  console.log('Target Architecture: Exactly 2 Topics, 36 Subtopics (18 per Topic)');
  console.log('------------------------------------------------------------\n');

  let topicsCreated = 0;
  let topicsReused = 0;
  let subtopicsCreated = 0;
  let subtopicsReused = 0;

  // 1. Fetch current database state
  const existingTopics = await topicsRepository.findAll();
  const existingSubtopics = await subtopicsRepository.findAll();

  console.log(`Current Database State:`);
  console.log(`- Existing Topics in Firestore: ${existingTopics.length}`);
  console.log(`- Existing Subtopics in Firestore: ${existingSubtopics.length}\n`);

  // Map of target topic slug -> resolved Firestore Topic
  const resolvedTopicMap = new Map<string, Topic>();

  // 2. Idempotent Topic Upsert / Resolution
  for (const targetTopic of PRODUCTION_TOPICS) {
    const existing = existingTopics.find(
      (t) =>
        t.slug?.toLowerCase() === targetTopic.slug.toLowerCase() ||
        t.name?.toLowerCase() === targetTopic.name.toLowerCase()
    );

    if (existing) {
      console.log(`[TOPIC REUSED] "${existing.name}" (ID: ${existing.id})`);
      // Update metadata to ensure active and correct subtopics count
      await topicsRepository.updateRecord(existing.id, {
        name: targetTopic.name,
        slug: targetTopic.slug,
        description: targetTopic.description,
        displayOrder: targetTopic.displayOrder,
        subtopicsCount: 18,
        isActive: true,
        updatedAt: new Date().toISOString(),
      });
      resolvedTopicMap.set(targetTopic.slug, { ...existing, id: existing.id, isActive: true });
      topicsReused++;
    } else {
      console.log(`[TOPIC CREATING] "${targetTopic.name}" (ID: ${targetTopic.id})`);
      const newTopic: Topic = {
        ...targetTopic,
        subtopicsCount: 18,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await topicsRepository.appendRecord(newTopic);
      resolvedTopicMap.set(targetTopic.slug, newTopic);
      topicsCreated++;
    }
  }

  // 3. Idempotent Subtopic Upsert / Resolution
  for (const targetSub of PRODUCTION_SUBTOPICS) {
    // Find parent topic
    const parentDefinition = PRODUCTION_TOPICS.find((t) => t.id === targetSub.topicId);
    if (!parentDefinition) {
      throw new Error(`Target subtopic ${targetSub.name} has no valid parent definition.`);
    }

    const resolvedParent = resolvedTopicMap.get(parentDefinition.slug);
    if (!resolvedParent) {
      throw new Error(`Resolved parent topic not found for slug "${parentDefinition.slug}".`);
    }

    // Check if subtopic already exists under this resolved parent
    const existingSub = existingSubtopics.find(
      (s) =>
        s.topicId === resolvedParent.id &&
        (s.slug?.toLowerCase() === targetSub.slug.toLowerCase() ||
          s.name?.toLowerCase() === targetSub.name.toLowerCase())
    );

    if (existingSub) {
      console.log(`  [SUBTOPIC REUSED] "${existingSub.name}" under Topic "${resolvedParent.name}" (ID: ${existingSub.id})`);
      await subtopicsRepository.updateRecord(existingSub.id, {
        topicId: resolvedParent.id,
        name: targetSub.name,
        slug: targetSub.slug,
        description: targetSub.description,
        displayOrder: targetSub.displayOrder,
        isActive: true,
        updatedAt: new Date().toISOString(),
      });
      subtopicsReused++;
    } else {
      console.log(`  [SUBTOPIC CREATING] "${targetSub.name}" under Topic "${resolvedParent.name}" (ID: ${targetSub.id})`);
      const newSubtopic: Subtopic = {
        ...targetSub,
        topicId: resolvedParent.id,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await subtopicsRepository.appendRecord(newSubtopic);
      subtopicsCreated++;
    }
  }

  // 4. Invalidate taxonomy caches
  taxonomyService.invalidateCache();

  // 5. Audit Logging
  try {
    await auditService.log(
      'USR-001',
      'System Admin',
      'TAXONOMY_LAUNCH_SETUP',
      'TOPIC',
      'ALL',
      {
        topicsCreated,
        topicsReused,
        subtopicsCreated,
        subtopicsReused,
        environment: 'DEVELOPMENT',
      }
    );
  } catch (err: any) {
    console.warn('Audit logging notice (non-fatal):', err.message);
  }

  // 6. Verification
  const finalTopics = await topicsRepository.findAll();
  const finalSubtopics = await subtopicsRepository.findAll();
  const activeTopics = finalTopics.filter((t) => t.isActive !== false);
  const activeSubtopics = finalSubtopics.filter((s) => s.isActive !== false);

  const report: SeedReport = {
    timestamp: new Date().toISOString(),
    projectId,
    databaseId,
    topicsCreated,
    topicsReused,
    subtopicsCreated,
    subtopicsReused,
    totalActiveTopics: activeTopics.length,
    totalActiveSubtopics: activeSubtopics.length,
    topics: activeTopics.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      subtopicsCount: activeSubtopics.filter((s) => s.topicId === t.id).length,
    })),
  };

  console.log('\n------------------------------------------------------------');
  console.log('LAUNCH TAXONOMY SETUP SUMMARY');
  console.log('------------------------------------------------------------');
  console.log(`Topics Created: ${topicsCreated}, Reused: ${topicsReused}`);
  console.log(`Subtopics Created: ${subtopicsCreated}, Reused: ${subtopicsReused}`);
  console.log(`Total Active Topics in DB: ${report.totalActiveTopics}`);
  console.log(`Total Active Subtopics in DB: ${report.totalActiveSubtopics}`);
  for (const t of report.topics) {
    console.log(`  - ${t.name} (${t.id}): ${t.subtopicsCount} subtopics`);
  }
  console.log('============================================================\n');

  return report;
}

if (process.argv[1]?.endsWith('seed-launch-taxonomy.ts')) {
  seedLaunchTaxonomy()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal taxonomy seeding error:', err);
      process.exit(1);
    });
}
