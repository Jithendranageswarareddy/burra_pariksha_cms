/**
 * Burra Pariksha CMS — Firestore Test Document Purge & Audit Utility
 *
 * Safely locates and permanently purges all test documents created during
 * testing runs, including:
 * - Documents with test identifiers (e.g. 'aud_rule_test_*', 'test_aud_*', 'wfh_rule_test_*')
 * - Documents in 'test_questions' collection
 * - Documents with test questions / test content masters
 * - Documents in 'scripts', 'videos', 'thumbnails', 'publishing_packages', 'workflow_instances', 'social_analytics' created by tests
 * - Test sequence tracking records in 'sequences' tab created by test runs
 *
 * Uses Firebase Admin SDK.
 */

import { getAdminFirestore } from '../src/lib/firebase/admin';

async function purgeTestRecords() {
  const db = getAdminFirestore();
  console.log('============================================================');
  console.log('PURGING TEST DOCUMENTS FROM CLOUD FIRESTORE (ADMIN SDK)');
  console.log('============================================================\n');

  let purgedCount = 0;
  const purgedDetails: { collection: string; id: string; reason: string }[] = [];

  // 1. Purge test_questions collection completely
  try {
    const testQSnap = await db.collection('test_questions').get();
    for (const d of testQSnap.docs) {
      await d.ref.delete();
      purgedDetails.push({ collection: 'test_questions', id: d.id, reason: 'test collection record' });
      purgedCount++;
    }
  } catch (err: any) {
    console.warn('Note on test_questions:', err.message);
  }

  // 2. Purge test records in questions
  try {
    const qSnap = await db.collection('questions').get();
    for (const d of qSnap.docs) {
      const data = d.data();
      const qText = String(data.question || data.questionText || '');
      const isTestDoc =
        d.id.startsWith('BP-Q-00000') ||
        d.id.startsWith('BP-Q-backend-test-') ||
        d.id.startsWith('BP-Q-server-test-') ||
        d.id.startsWith('BP-Q-domain-test-') ||
        d.id.startsWith('BP-TEST-Q-') ||
        d.id === 'BP-Q-ad65912f-03ae-460f-b7d9-c144264885b0' ||
        d.id === 'BP-Q-562998fb-08b3-4ddd-b7e1-2319f66fa07e' ||
        d.id === 'BP-Q-94069d9e-7cce-4785-9e04-a04f10fb254f' ||
        d.id === 'BP-Q-aebcda3e-a282-478c-8df0-e116f5b7cf6c' ||
        qText.includes('thermodynamics') ||
        qText.includes('photoelectric') ||
        qText.includes('Compton scattering') ||
        qText.includes('Carnot') ||
        qText.includes('Stefan-Boltzmann') ||
        qText.includes('Heisenberg') ||
        qText.includes('mitochondria') ||
        qText.includes('planets in our solar system') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'questions', id: d.id, reason: `test question: ${qText.slice(0, 40)}` });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on questions purge:', err.message);
  }

  // 3. Purge test records in content_masters
  try {
    const cmSnap = await db.collection('content_masters').get();
    for (const d of cmSnap.docs) {
      const data = d.data();
      const title = String(data.title || '');
      const isTestDoc =
        d.id.startsWith('BP-CNT-00000') ||
        d.id.startsWith('BP-TEST-') ||
        d.id === 'BP-CNT-888888' ||
        d.id === 'BP-CNT-777777' ||
        title.includes('thermodynamics') ||
        title.includes('photoelectric') ||
        title.includes('Compton') ||
        title.includes('Carnot') ||
        title.includes('Stefan-Boltzmann') ||
        title.includes('Heisenberg') ||
        title.includes('Thermodynamics & Heat Transfer') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'content_masters', id: d.id, reason: `test content master: ${title.slice(0, 40)}` });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on content_masters purge:', err.message);
  }

  // 4. Purge test records in question_drafts
  try {
    const dSnap = await db.collection('question_drafts').get();
    for (const d of dSnap.docs) {
      const data = d.data();
      const title = String(data.title || '');
      const isTestDoc =
        title.includes('Solar System') ||
        title.includes('Thermodynamics') ||
        data.testOnly === true ||
        d.id.startsWith('BP-DFT-') ||
        d.id.startsWith('BP-TEST-');

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'question_drafts', id: d.id, reason: `test draft: ${title}` });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on question_drafts purge:', err.message);
  }

  // 5. Purge test records in scripts
  try {
    const sSnap = await db.collection('scripts').get();
    for (const d of sSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.contentMasterId === 'BP-CNT-888888' ||
        d.id.startsWith('BP-S-') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'scripts', id: d.id, reason: 'test script record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on scripts purge:', err.message);
  }

  // 6. Purge test records in videos
  try {
    const vSnap = await db.collection('videos').get();
    for (const d of vSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.contentMasterId === 'BP-CNT-888888' ||
        d.id.startsWith('BP-V-') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'videos', id: d.id, reason: 'test video record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on videos purge:', err.message);
  }

  // 7. Purge test records in thumbnails
  try {
    const tSnap = await db.collection('thumbnails').get();
    for (const d of tSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.contentMasterId === 'BP-CNT-888888' ||
        d.id.startsWith('BP-T-') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'thumbnails', id: d.id, reason: 'test thumbnail record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on thumbnails purge:', err.message);
  }

  // 8. Purge test records in publishing_packages
  try {
    const pSnap = await db.collection('publishing_packages').get();
    for (const d of pSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.contentMasterId === 'BP-CNT-888888' ||
        d.id.startsWith('BP-PUB-') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'publishing_packages', id: d.id, reason: 'test publishing package record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on publishing_packages purge:', err.message);
  }

  // 9. Purge test records in workflow_instances
  try {
    const wSnap = await db.collection('workflow_instances').get();
    for (const d of wSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.entityId === 'BP-CNT-888888' ||
        d.id.startsWith('wfl_') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'workflow_instances', id: d.id, reason: 'test workflow instance' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on workflow_instances purge:', err.message);
  }

  // 10. Purge test records in social_analytics
  try {
    const aSnap = await db.collection('social_analytics').get();
    for (const d of aSnap.docs) {
      const data = d.data();
      const isTestDoc =
        data.contentId === 'BP-CNT-888888' ||
        d.id.startsWith('BP-ANL-') ||
        d.id.startsWith('BP-TEST-') ||
        data.testOnly === true;

      if (isTestDoc) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'social_analytics', id: d.id, reason: 'test analytics record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on social_analytics purge:', err.message);
  }

  // 11. Purge test records in sequences
  try {
    const sSnap = await db.collection('sequences').get();
    for (const d of sSnap.docs) {
      if (d.id.startsWith('ent_')) {
        await d.ref.delete();
        purgedDetails.push({ collection: 'sequences', id: d.id, reason: 'test sequence record' });
        purgedCount++;
      }
    }
  } catch (err: any) {
    console.warn('Note on sequences purge:', err.message);
  }

  console.log(`Successfully purged ${purgedCount} test documents from Cloud Firestore.`);
  console.log('Sample purged records:', purgedDetails.slice(0, 10));

  await db.terminate();
}

purgeTestRecords().catch((err) => {
  console.error('Purge error:', err);
  process.exit(1);
});
