import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { categoriesRepository } from '../src/lib/repositories/categories.repository';
import { topicsRepository } from '../src/lib/repositories/topics.repository';
import { subtopicsRepository } from '../src/lib/repositories/subtopics.repository';
import { usersRepository } from '../src/lib/repositories/users.repository';

async function main() {
  console.log('Testing live Google Sheets connection...');
  console.log('Sheet ID configured:', Boolean(process.env.GOOGLE_SPREADSHEET_ID));
  console.log('Client isConfigured:', googleSheetsClient.isConfigured());

  const sheetsToCount = [
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
  ];

  console.log('\n--- LIVE SHEET BASELINE COUNTS ---');
  for (const sheet of sheetsToCount) {
    try {
      const res = await googleSheetsClient.getRows(sheet);
      console.log(`${sheet.padEnd(25)}: ${res.rows.length}`);
    } catch (err: any) {
      console.error(`${sheet.padEnd(25)}: ERROR - ${err.message}`);
    }
  }

  // Probe valid taxonomy
  const cats = await categoriesRepository.findAll();
  const tops = await topicsRepository.findAll();
  const subs = await subtopicsRepository.findAll();
  const usrs = await usersRepository.findAll();

  console.log('\n--- TAXONOMY & USERS SAMPLE ---');
  console.log('First Category:', cats[0] ? `${cats[0].id} (${cats[0].name})` : 'none');
  console.log('First Topic:', tops[0] ? `${tops[0].id} (${tops[0].name})` : 'none');
  console.log('First Subtopic:', subs[0] ? `${subs[0].id} (${subs[0].name})` : 'none');

  const editors = usrs.filter(u => u.role === 'VIDEO_EDITOR' && u.isActive);
  const managers = usrs.filter(u => u.role === 'CONTENT_MANAGER' && u.isActive);
  const admins = usrs.filter(u => u.role === 'ADMIN' && u.isActive);
  console.log('Active Editors:', editors.map(e => `${e.id} (${e.name})`));
  console.log('Active Managers:', managers.map(m => `${m.id} (${m.name})`));
  console.log('Active Admins:', admins.map(a => `${a.id} (${a.name})`));
}

main().catch(console.error);
