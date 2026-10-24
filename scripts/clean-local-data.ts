/**
 * BURRA PARIKSHA CMS — Safe Local Emulator Data Purge Utility
 *
 * Clears all working / testing data (questions, drafts, workflows, audit logs, media records)
 * from the local Firestore Emulator while strictly preserving:
 * - User credentials & authentication (users)
 * - Two-tier taxonomy topics (topics)
 * - Two-tier taxonomy subtopics (subtopics)
 * - Canonical question configuration presets (question_config)
 *
 * Safety Guards:
 * - Strictly guarded against production: Fails closed immediately if targeting Cloud Firestore.
 * - Confirms emulator reachability on 127.0.0.1:8080 before proceeding.
 */

import '../src/config/env';
import { assertDestructiveScriptSafe, assertEmulatorAlive } from '../src/config/datastore-guard';
import { getAdminFirestore } from '../database/firestore/adapter/admin';
import { PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } from '../src/lib/data/production-taxonomy';
import { topicsRepository, subtopicsRepository } from '../database/firestore/repositories';

export const PRESERVED_COLLECTIONS = new Set([
  'users',
  'topics',
  'subtopics',
  'question_config',
]);

export const KNOWN_PURGEABLE_COLLECTIONS = [
  'questions',
  'question_drafts',
  'learning_units',
  'workflow_instances',
  'audit_logs',
  'scripts',
  'script_versions',
  'thumbnails',
  'thumbnail_versions',
  'videos',
  'question_videos',
  'social_reviews',
  'publishing_packages',
  'pinned_comments',
  'pinned_comment_versions',
  'validations',
  'assignments',
  'content_masters',
  'media_assets',
  'content_plans',
  'content_batches',
  'test_questions',
  'sequences',
];

export const PURGE_ALLOWLIST_COLLECTIONS = new Set(KNOWN_PURGEABLE_COLLECTIONS);

export interface CollectionClassification {
  toPurge: string[];
  preservedBaseline: string[];
  preservedUnknown: string[];
}

export function classifyCollectionsForCleanup(
  discoveredCollectionIds: string[],
  allowlist: Set<string> = PURGE_ALLOWLIST_COLLECTIONS,
  preservedBaseline: Set<string> = PRESERVED_COLLECTIONS
): CollectionClassification {
  const toPurge: string[] = [];
  const preservedBaselineFound: string[] = [];
  const preservedUnknown: string[] = [];

  for (const id of discoveredCollectionIds) {
    if (preservedBaseline.has(id)) {
      preservedBaselineFound.push(id);
    } else if (allowlist.has(id)) {
      toPurge.push(id);
    } else {
      preservedUnknown.push(id);
    }
  }

  return {
    toPurge,
    preservedBaseline: preservedBaselineFound,
    preservedUnknown,
  };
}

async function deleteCollectionRecursively(
  db: FirebaseFirestore.Firestore,
  colRef: FirebaseFirestore.CollectionReference,
  batchSize = 250
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const snapshot = await colRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      for (const subcol of subcollections) {
        totalDeleted += await deleteCollectionRecursively(db, subcol, batchSize);
      }
      batch.delete(doc.ref);
      totalDeleted++;
    }

    await batch.commit();
  }

  return totalDeleted;
}

export async function cleanLocalData(): Promise<void> {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm-clean-local');

  if (!confirmed) {
    console.error('============================================================');
    console.error('SAFETY INTERLOCK: LOCAL EMULATOR DATA CLEANUP ABORTED');
    console.error('============================================================');
    console.error('This is a destructive administrative utility for the local emulator.');
    console.error('To proceed, you must supply the explicit confirmation flag:');
    console.error('  npx tsx scripts/clean-local-data.ts --confirm-clean-local');
    console.error('============================================================');
    process.exit(1);
  }

  // 1. Strict datastore safety guard (loopback emulator only)
  const target = assertDestructiveScriptSafe('clean-local-data.ts');

  // 2. Verify Emulator Reachability before any client acquisition
  await assertEmulatorAlive(target.emulatorHost || undefined);

  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — LOCAL EMULATOR DATA CLEANUP');
  console.log('============================================================\n');
  console.log(`[Safety Guard] Target verified: ${target.mode} at ${target.emulatorHost}`);
  console.log(`- Project: ${target.projectId}`);
  console.log(`- Database: ${target.databaseId}\n`);

  const db = getAdminFirestore();

  // 3. Discover all root collections currently in the database
  const discoveredCollections = await db.listCollections();
  const discoveredIds = discoveredCollections.map((c) => c.id);

  const { toPurge, preservedUnknown } = classifyCollectionsForCleanup(discoveredIds);

  if (preservedUnknown.length > 0) {
    console.log('--- Unknown Collections (Preserved by Default) ---');
    for (const colName of preservedUnknown) {
      console.log(`  ! Preserved unknown collection '${colName}' (not in purge allowlist)`);
    }
    console.log();
  }

  console.log('--- Purging Allowlisted Ephemeral / Test Collections ---');
  let totalPurgedDocs = 0;
  const purgeReport: Record<string, number> = {};

  for (const colName of toPurge) {
    const colRef = db.collection(colName);
    const countDeleted = await deleteCollectionRecursively(db, colRef);
    if (countDeleted > 0) {
      console.log(`  ✓ Purged ${countDeleted} documents from '${colName}'`);
      purgeReport[colName] = countDeleted;
      totalPurgedDocs += countDeleted;
    }
  }

  console.log(`\nTotal Documents Purged: ${totalPurgedDocs}\n`);

  // 4. Verify & Ensure Preserved Collections Baseline
  console.log('--- Preserved Collections Verification ---');
  const userDocs = await db.collection('users').get();
  console.log(`  ✓ Preserved 'users': ${userDocs.size} user accounts active`);

  // Ensure taxonomy is intact
  const topicDocs = await db.collection('topics').get();
  if (topicDocs.empty) {
    console.log(`  ! Topics collection was empty, re-seeding canonical topics...`);
    for (const t of PRODUCTION_TOPICS) {
      await topicsRepository.create(t);
    }
  }
  const verifiedTopics = await db.collection('topics').get();
  console.log(`  ✓ Preserved 'topics': ${verifiedTopics.size} topics active (Aptitude, Reasoning)`);

  const subtopicDocs = await db.collection('subtopics').get();
  if (subtopicDocs.empty) {
    console.log(`  ! Subtopics collection was empty, re-seeding canonical subtopics...`);
    for (const st of PRODUCTION_SUBTOPICS) {
      await subtopicsRepository.create(st);
    }
  }
  const verifiedSubtopics = await db.collection('subtopics').get();
  console.log(`  ✓ Preserved 'subtopics': ${verifiedSubtopics.size} subtopics active`);

  // Verify question_config
  const configDocs = await db.collection('question_config').get();
  console.log(`  ✓ Preserved 'question_config': ${configDocs.size} configurations active`);

  console.log('\n============================================================');
  console.log('LOCAL EMULATOR CLEANUP COMPLETE');
  console.log('============================================================');
  console.log('All test questions, drafts, workflows, and audit logs removed.');
  console.log('Users, credentials, topics, and subtopics remain 100% preserved.');
  console.log('Your local dashboard is now completely pristine and free of test errors.');
  console.log('============================================================\n');
}

if (process.argv[1]?.endsWith('clean-local-data.ts')) {
  cleanLocalData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal cleanup error:', err);
      process.exit(1);
    });
}
