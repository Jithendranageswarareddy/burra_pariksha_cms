/**
 * BURRA PARIKSHA CMS — Safe Administrative Firestore Reset Utility
 *
 * Local operator CLI tool for administrative database reset.
 *
 * SAFETY GUARDS:
 * 1. CLI ONLY — NOT exposed as an HTTP endpoint or callable by browser clients.
 * 2. Requires explicit command-line confirmation flag:
 *    --confirm-wipe-all-data
 * 3. Never prints document data, credentials, private keys, or secret tokens.
 *    Only outputs collection names, document counts, and deletion status.
 * 4. Recursively deletes documents and subcollections in batches.
 * 5. Uses authoritative server-side Firebase Admin SDK.
 *
 * USAGE:
 *   npx tsx scripts/admin-reset-firestore.ts --confirm-wipe-all-data
 */

import { getAdminFirestore } from '../src/lib/firebase/admin';
import { firestoreProductionInitializer } from '../src/lib/services/firestore-production-initializer.service';
import { authService } from '../src/lib/services/auth.service';

const KNOWN_COLLECTIONS = [
  'users',
  'categories',
  'topics',
  'subtopics',
  'question_config',
  'questions',
  'question_drafts',
  'question_validations',
  'workflow',
  'content_masters',
  'scripts',
  'script_versions',
  'videos',
  'thumbnails',
  'pinned_comments',
  'publishing_packages',
  'social_posts',
  'social_comments',
  'social_reviews',
  'social_analytics',
  'workflow_instances',
  'workflow_history',
  'assignments',
  'sequences',
  'audit_logs',
  'audit_log',
  'audit_events',
  'validations',
  'test_questions',
];

async function deleteCollectionRecursively(
  db: FirebaseFirestore.Firestore,
  collectionRef: FirebaseFirestore.CollectionReference,
  batchSize = 100
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      // Recursively delete any subcollections
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

export async function runAdminReset(reseedBaseline = true): Promise<void> {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm-wipe-all-data');

  if (!confirmed) {
    console.error('============================================================');
    console.error('SAFETY INTERLOCK: FIRESTORE RESET ABORTED');
    console.error('============================================================');
    console.error('This is a destructive administrative utility.');
    console.error('To proceed, you must supply the explicit confirmation flag:');
    console.error('  npx tsx scripts/admin-reset-firestore.ts --confirm-wipe-all-data');
    console.error('============================================================');
    process.exit(1);
  }

  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — ADMINISTRATIVE FIRESTORE RESET');
  console.log('============================================================\n');

  const db = getAdminFirestore();

  try {
    // Discover all active collections in the database
    const discoveredCollections = await db.listCollections();
    const discoveredNames = new Set(discoveredCollections.map((c) => c.id));

    // Combine discovered with known collections
    const targetCollectionNames = Array.from(new Set([...discoveredNames, ...KNOWN_COLLECTIONS]));

    console.log(`Target database: ${db.databaseId || '(default)'}`);
    console.log(`Discovered ${discoveredCollections.length} active collections.`);
    console.log(`Initiating recursive wipe across ${targetCollectionNames.length} collection targets...\n`);

    let totalPurgedDocuments = 0;

    for (const colName of targetCollectionNames) {
      const colRef = db.collection(colName);
      const countSnapshot = await colRef.count().get();
      const count = countSnapshot.data().count;

      if (count > 0) {
        process.stdout.write(`Purging '${colName}' (${count} documents)... `);
        const deleted = await deleteCollectionRecursively(db, colRef);
        totalPurgedDocuments += deleted;
        console.log(`✓ Deleted ${deleted} documents.`);
      } else {
        console.log(`Collection '${colName}' is empty (0 documents).`);
      }
    }

    console.log('\n------------------------------------------------------------');
    console.log(`Wipe completed. Total documents removed: ${totalPurgedDocuments}`);
    console.log('------------------------------------------------------------\n');

    if (reseedBaseline) {
      const withTaxonomy = args.includes('--with-taxonomy');
      console.log(`Reseeding foundational production admin USR-001 (taxonomy seeding: ${withTaxonomy ? 'ENABLED' : 'DISABLED'})...`);
      const initReport = await firestoreProductionInitializer.initializeProductionData({
        seedTaxonomy: withTaxonomy,
        seedQuestionConfigs: withTaxonomy,
      });

      console.log('✓ Seeding complete:');
      console.log(`  Users seeded: ${initReport.usersSeeded}`);
      console.log(`  Categories seeded: ${initReport.categoriesSeeded}`);
      console.log(`  Topics seeded: ${initReport.topicsSeeded}`);
      console.log(`  Subtopics seeded: ${initReport.subtopicsSeeded}`);
      console.log(`  Question configs seeded: ${initReport.questionConfigsSeeded}`);

      // Seed standard scrypt password hashes for admin account if missing
      const bootstrapPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
      if (bootstrapPassword) {
        const usersSnap = await db.collection('users').get();
        const defaultPasswordHash = await authService.hashPassword(bootstrapPassword);
        for (const uDoc of usersSnap.docs) {
          if (!uDoc.data().password_hash) {
            await uDoc.ref.update({ password_hash: defaultPasswordHash });
          }
        }
        console.log('  Password hashes verified for admin account.');
      }
    }

    console.log('\n============================================================');
    console.log('ADMINISTRATIVE RESET PROCESS COMPLETE');
    console.log('============================================================');
  } catch (err: any) {
    console.error('Fatal reset error:', err.message);
    process.exit(1);
  } finally {
    await db.terminate();
  }
}

// Only execute directly when run as CLI script
if (process.argv[1]?.endsWith('admin-reset-firestore.ts')) {
  runAdminReset().catch((err) => {
    console.error('Unhandled reset error:', err);
    process.exit(1);
  });
}
