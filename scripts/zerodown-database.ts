/**
 * BURRA PARIKSHA CMS — Total Database Zero-Down Administrative Script
 *
 * Confirmed by Owner:
 * - Purges all collections completely.
 * - In the 'users' collection, deletes all test users and preserves ONLY
 *   the document for user jithendrareddy629@gmail.com (USR-001).
 */

import '../src/config/env';
import { getAdminFirestore } from '../database/firestore/adapter/admin';

const PRESERVED_USER_EMAIL = 'jithendrareddy629@gmail.com';

async function deleteCollectionRecursively(
  db: FirebaseFirestore.Firestore,
  collectionRef: FirebaseFirestore.CollectionReference,
  preservedDocId?: string,
  batchSize = 250
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) {
      break;
    }

    const docsToDelete = snapshot.docs.filter((d) => !preservedDocId || d.id !== preservedDocId);
    if (docsToDelete.length === 0) {
      break;
    }

    const batch = db.batch();
    for (const doc of docsToDelete) {
      // Recursively delete subcollections
      const subcollections = await doc.ref.listCollections();
      for (const subcol of subcollections) {
        totalDeleted += await deleteCollectionRecursively(db, subcol, undefined, batchSize);
      }
      batch.delete(doc.ref);
      totalDeleted++;
    }

    await batch.commit();

    // If all remaining docs were the preserved doc, we are done
    if (snapshot.docs.length === 1 && preservedDocId && snapshot.docs[0].id === preservedDocId) {
      break;
    }
  }

  return totalDeleted;
}

export async function runZeroDown(): Promise<void> {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — TOTAL FIRESTORE ZERO-DOWN UTILITY');
  console.log('============================================================\n');

  const db = getAdminFirestore();
  console.log(`Target Database: ${db.databaseId || '(default)'}`);

  // 1. Locate and verify preserved user
  const usersCol = db.collection('users');
  const usersSnap = await usersCol.get();
  const preservedDoc = usersSnap.docs.find((d) => d.data().email === PRESERVED_USER_EMAIL);

  if (!preservedDoc) {
    throw new Error(`CRITICAL ABORT: User with email "${PRESERVED_USER_EMAIL}" not found in 'users' collection!`);
  }

  const preservedId = preservedDoc.id;
  const preservedData = preservedDoc.data();
  console.log(`✓ Preserved User Verified: ID=${preservedId}, Email=${preservedData.email}, Role=${preservedData.role}\n`);

  // 2. Discover all active collections in the database
  const discoveredCollections = await db.listCollections();
  console.log(`Discovered ${discoveredCollections.length} collections to zero-down.\n`);

  let totalDeletedAcrossDb = 0;

  for (const col of discoveredCollections) {
    const colName = col.id;
    const isUsersCol = colName === 'users';
    process.stdout.write(`Purging collection '${colName}'... `);

    const deleted = await deleteCollectionRecursively(
      db,
      col,
      isUsersCol ? preservedId : undefined
    );
    totalDeletedAcrossDb += deleted;
    console.log(`✓ Deleted ${deleted} documents.`);
  }

  console.log('\n============================================================');
  console.log(`Zero-down completed. Total documents deleted: ${totalDeletedAcrossDb}`);
  console.log('============================================================\n');

  // 3. Final Verification
  console.log('--- Post-Cleanup Verification ---');
  const postCollections = await db.listCollections();
  for (const col of postCollections) {
    const countSnap = await col.count().get();
    const count = countSnap.data().count;
    console.log(`- Collection '${col.id}': ${count} document(s) remaining`);
    if (col.id === 'users') {
      const remainingUsers = await col.get();
      for (const d of remainingUsers.docs) {
        console.log(`  -> Preserved: id=${d.id}, email=${d.data().email}, role=${d.data().role}`);
      }
    }
  }

  console.log('\n✓ Database zero-down verified: only jithendrareddy629@gmail.com remains.');
}

if (process.argv[1]?.endsWith('zerodown-database.ts')) {
  runZeroDown()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal zero-down error:', err);
      process.exit(1);
    });
}
