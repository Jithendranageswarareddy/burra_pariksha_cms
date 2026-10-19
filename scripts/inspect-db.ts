/**
 * BURRA PARIKSHA CMS — Firestore Database Inspection Utility
 * Inspects all active collections and document counts in the configured database.
 */
import '../src/config/env';
import { getAdminFirestore, getAdminApp } from '../database/firestore/adapter/admin';

async function inspect(): Promise<void> {
  const db = getAdminFirestore();
  const app = getAdminApp();
  const projectId = app.options.projectId || process.env.GCP_PROJECT || 'burra-pariksha-cms';

  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — FIRESTORE DATABASE INSPECTION');
  console.log('============================================================\n');
  console.log(`ProjectId: ${projectId}`);
  console.log(`DatabaseId: ${db.databaseId || '(default)'}`);
  console.log(`FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST || 'NOT_SET (CLOUD)'}\n`);

  const collections = await db.listCollections();
  console.log(`Discovered ${collections.length} active collection(s):`);

  for (const col of collections) {
    const snap = await col.count().get();
    const count = snap.data().count;
    console.log(`- ${col.id}: ${count} document(s)`);

    if (count > 0 && (col.id === 'topics' || col.id === 'subtopics' || col.id === 'users')) {
      const sampleDocs = await col.limit(5).get();
      for (const d of sampleDocs.docs) {
        console.log(`  [${col.id}] ${d.id}:`, JSON.stringify(d.data()).substring(0, 100));
      }
    }
  }

  console.log('\n============================================================');
  console.log('Inspection complete.');
  console.log('============================================================\n');
}

if (process.argv[1]?.endsWith('inspect-db.ts')) {
  inspect().catch((err) => {
    console.error('Fatal inspection error:', err);
    process.exit(1);
  });
}

export { inspect };
