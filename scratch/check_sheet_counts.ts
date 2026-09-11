import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';

async function main() {
  const sheets = [
    'QUESTIONS',
    'CONTENT_MASTERS',
    'VIDEOS',
    'QUESTION_VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'PUBLISHING',
    'ASSIGNMENTS',
    'WORKFLOW',
    'AUDIT_LOG',
    'SEQUENCES',
    'USERS',
    'SOCIAL_REVIEWS',
  ];

  console.log('--- Current Live Sheet Baseline Counts ---');
  for (const s of sheets) {
    try {
      const res = await googleSheetsClient.getRows(s);
      console.log(`${s}: ${res.rows.length}`);
    } catch (e: any) {
      console.log(`${s}: ERROR ${e.message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
