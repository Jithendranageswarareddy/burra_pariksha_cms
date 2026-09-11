import fs from 'fs';
import path from 'path';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { SHEET_TABS, SHEET_SCHEMAS } from '../lib/schemas/google-sheets-schema';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { objectToRow } from '../lib/google-sheets/helpers';
import { sequencesRepository } from '../lib/repositories/sequences.repository';

const FINALIZED_100_SUBTOPICS = [
  "Number Identification Challenges",
  "Number Comparison Challenges",
  "Greater or Smaller Number",
  "Number Ordering Challenges",
  "Ascending Order Challenges",
  "Descending Order Challenges",
  "Missing Number Challenges",
  "Number Completion Challenges",
  "Number Recognition Speed Tests",
  "Number Reading Challenges",
  "Natural Number Challenges",
  "Whole Number Challenges",
  "Integer Challenges",
  "Positive and Negative Numbers",
  "Zero-Based Number Challenges",
  "Number Line Challenges",
  "Position of Numbers on a Number Line",
  "Distance Between Numbers",
  "Numbers Between Two Numbers",
  "Nearest Number Challenges",
  "Consecutive Number Challenges",
  "Non-Consecutive Number Challenges",
  "Successor and Predecessor",
  "Immediate Next Number Challenges",
  "Immediate Previous Number Challenges",
  "Odd and Even Numbers",
  "Odd-Even Number Traps",
  "Odd-One-Out Numbers",
  "Number Classification Challenges",
  "Number Grouping Challenges",
  "Place Value Challenges",
  "Face Value Challenges",
  "Place Value vs Face Value",
  "Digit Position Challenges",
  "Number Expansion Challenges",
  "Number Formation from Digits",
  "Largest Number Formation",
  "Smallest Number Formation",
  "Rearranging Digits Challenges",
  "Repeated Digit Challenges",
  "Unique Digit Challenges",
  "Digit Counting Challenges",
  "Counting Digits in Numbers",
  "Number of Digits Challenges",
  "First and Last Digit Challenges",
  "Middle Digit Challenges",
  "Digit Sum Challenges",
  "Digit Difference Challenges",
  "Digit Relationship Challenges",
  "Digit Pattern Challenges",
  "Number Naming Puzzles",
  "Number Word Challenges",
  "Number-to-Digit Conversion",
  "Digit-to-Number Conversion",
  "Expanded Form Challenges",
  "Standard Form Challenges",
  "Number Representation Challenges",
  "Equivalent Number Challenges",
  "Number Matching Challenges",
  "Hidden Number Challenges",
  "Number Counting Challenges",
  "Counting Numbers Within a Range",
  "Counting Odd Numbers",
  "Counting Even Numbers",
  "Counting Consecutive Numbers",
  "Counting Digits in a Range",
  "Numbers at Equal Intervals",
  "Equal-Difference Number Challenges",
  "Number Gap Challenges",
  "Number Distance Challenges",
  "Number Balance Challenges",
  "Number Partition Challenges",
  "Splitting Numbers in Different Ways",
  "Combining Numbers Challenges",
  "Number Pair Challenges",
  "Number Triplet Challenges",
  "Number Relationship Puzzles",
  "Number Family Challenges",
  "Number Property Identification",
  "Number Property Puzzles",
  "Estimate the Number Challenge",
  "Closest Number Challenge",
  "Exact or Approximate Number",
  "Number Sense Quick Tests",
  "Fast Number Judgment",
  "Number Trap Challenges",
  "Number Illusion Challenges",
  "Number Mystery Challenges",
  "Think of a Number Challenges",
  "Guess the Number Challenges",
  "Secret Number Challenges",
  "Number Clue Challenges",
  "Number Detective Challenges",
  "Number Riddle Challenges",
  "Real-Life Number Challenges",
  "Everyday Number Decisions",
  "Number Observation Challenges",
  "Number Memory Challenges",
  "Rapid-Fire Number Challenges",
  "Ultimate Number Challenge"
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function runPhase4b1Execution() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 4B-1 SUBTOPICS LOADING');
  console.log('====================================================\n');

  // STEP 1: Invalidate Caches & Pre-checks
  googleSheetsClient.invalidateRowCache();
  taxonomyService.invalidateCache();

  const targetTopicId = 'BP-TOP-001';
  const topic1 = await taxonomyService.getTopicById(targetTopicId);

  if (!topic1) {
    console.error(`CRITICAL: Topic ${targetTopicId} not found in TOPICS worksheet!`);
    process.exit(1);
  }
  console.log(`[PASS] Found target Topic: ${topic1.name} (${topic1.id})`);

  // STEP 2: Backup
  const rawTopicsBefore = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const rawSubtopicsBefore = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `phase-4b1-pre-subtopics-backup-${timestamp}.json`);
  const backupData = {
    timestamp,
    topicsBefore: rawTopicsBefore,
    subtopicsBefore: rawSubtopicsBefore,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`[PASS] Backup created successfully at: ${backupFilePath}`);

  const beforeTopicCount = rawTopicsBefore.rows.length;
  const beforeSubtopicCount = rawSubtopicsBefore.rows.length;
  console.log(`Before Rows: TOPICS = ${beforeTopicCount}, SUBTOPICS = ${beforeSubtopicCount}`);

  // STEP 3: Clear old SUBTOPICS
  await googleSheetsClient.clearDataRows(SHEET_TABS.SUBTOPICS);
  console.log('[PASS] SUBTOPICS sheet cleared.');

  // STEP 4: Format 100 Subtopics for BP-TOP-001
  const subtopicSchema = SHEET_SCHEMAS[SHEET_TABS.SUBTOPICS];
  const subtopicHeaders = subtopicSchema.columns.map((c) => c.name);

  const now = new Date().toISOString();
  const newSubtopicObjects = FINALIZED_100_SUBTOPICS.map((name, index) => {
    const num = index + 1;
    const id = `BP-SUB-${String(num).padStart(4, '0')}`;
    const slug = slugify(name);
    return {
      id,
      topicId: targetTopicId,
      name,
      slug,
      description: '',
      notes: '',
      displayOrder: num,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  });

  const subtopicRowValues = newSubtopicObjects.map((obj) => objectToRow(obj, subtopicHeaders, subtopicSchema));

  // STEP 5: Write to SUBTOPICS sheet starting at row A2
  await googleSheetsClient.updateRangeValues(SHEET_TABS.SUBTOPICS, 'A2', subtopicRowValues);
  console.log(`[PASS] Wrote ${subtopicRowValues.length} production subtopics to live SUBTOPICS sheet.`);

  // Update SUBTOPIC sequence counter in SEQUENCES repository
  try {
    await sequencesRepository.updateCurrentValue('SUBTOPIC', 100);
    console.log('[PASS] Updated SUBTOPIC sequence counter to 100.');
  } catch (err: any) {
    console.warn('Notice: Sequence update notice:', err?.message || err);
  }

  // STEP 6: Invalidate caches and read back from Google Sheets
  googleSheetsClient.invalidateRowCache();
  taxonomyService.invalidateCache();

  const rawTopicsAfter = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const rawSubtopicsAfter = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);

  const afterTopicCount = rawTopicsAfter.rows.length;
  const afterSubtopicCount = rawSubtopicsAfter.rows.length;

  console.log(`\nAfter Rows: TOPICS = ${afterTopicCount}, SUBTOPICS = ${afterSubtopicCount}`);

  // STEP 7: Validation checks
  const subtopicsFromService = await taxonomyService.getSubtopics(targetTopicId, { includeInactive: true });
  console.log(`TaxonomyService fetched ${subtopicsFromService.length} subtopics for topic ${targetTopicId}.`);

  const subtopicIds = new Set<string>();
  const subtopicNames = new Set<string>();
  const subtopicSlugs = new Set<string>();
  let blankNameCount = 0;
  let orphanSubtopicsCount = 0;
  let hasRandomAsSubtopic = false;

  const missingNames: string[] = [];
  const unexpectedNames: string[] = [];
  const finalizedNameSet = new Set(FINALIZED_100_SUBTOPICS);

  subtopicsFromService.forEach((s) => {
    if (!s.name || !s.name.trim()) blankNameCount++;
    if (s.topicId !== targetTopicId) orphanSubtopicsCount++;

    if (s.name.trim().toUpperCase() === 'RANDOM' || s.id.toUpperCase() === 'RANDOM') {
      hasRandomAsSubtopic = true;
    }

    subtopicIds.add(s.id);
    subtopicNames.add(s.name);
    if (s.slug) subtopicSlugs.add(s.slug);

    if (!finalizedNameSet.has(s.name)) {
      unexpectedNames.push(s.name);
    }
  });

  FINALIZED_100_SUBTOPICS.forEach((name) => {
    if (!subtopicNames.has(name)) {
      missingNames.push(name);
    }
  });

  // STEP 8: Test RANDOM Selection Architecture
  console.log('\n--- TESTING RANDOM SELECTION ARCHITECTURE ---');
  let randomTestPass = false;
  try {
    const randomSelections = new Set<string>();
    const selectionResults: any[] = [];

    // Perform 10 random selections
    for (let i = 0; i < 10; i++) {
      const res = await taxonomyService.resolveSubtopicSelection(targetTopicId, 'RANDOM');
      selectionResults.push(res);
      randomSelections.add(res.subtopicId);
    }

    const firstRes = selectionResults[0];
    const explicitRes = await taxonomyService.resolveSubtopicSelection(targetTopicId, 'BP-SUB-0037');

    const check1 = firstRes.generationMode === 'RANDOM';
    const check2 = firstRes.subtopicId !== 'RANDOM';
    const check3 = firstRes.topicId === targetTopicId;
    const check4 = subtopicIds.has(firstRes.subtopicId);
    const check5 = explicitRes.generationMode === 'SUBTOPIC' && explicitRes.subtopicId === 'BP-SUB-0037';

    console.log(`Selection returns generationMode='RANDOM': ${check1}`);
    console.log(`Selected subtopicId is NOT 'RANDOM': ${check2}`);
    console.log(`Selected topicId matches ${targetTopicId}: ${check3}`);
    console.log(`Selected subtopicId exists in subtopic list: ${check4}`);
    console.log(`Explicit subtopic selection yields generationMode='SUBTOPIC' & correct ID: ${check5}`);
    console.log(`Random selections generated across multiple IDs (${randomSelections.size} unique IDs in 10 draws)`);

    randomTestPass = check1 && check2 && check3 && check4 && check5;
  } catch (err: any) {
    console.error('Random selection test failed:', err);
    randomTestPass = false;
  }

  console.log('\n--- VERIFICATION CHECKS ---');
  console.log(`TOPICS Count = 100: ${afterTopicCount === 100}`);
  console.log(`SUBTOPICS Count = 100: ${afterSubtopicCount === 100}`);
  console.log(`Subtopics belonging to ${targetTopicId} = 100: ${subtopicsFromService.length === 100}`);
  console.log(`Unique Subtopic IDs = 100: ${subtopicIds.size === 100}`);
  console.log(`Unique Subtopic Names = 100: ${subtopicNames.size === 100}`);
  console.log(`Unique Slugs = 100: ${subtopicSlugs.size === 100}`);
  console.log(`Blank Subtopic Names = 0: ${blankNameCount === 0}`);
  console.log(`Orphan Subtopics = 0: ${orphanSubtopicsCount === 0}`);
  console.log(`RANDOM present in SUBTOPICS sheet = false: ${!hasRandomAsSubtopic}`);
  console.log(`Missing Expected Subtopics = 0: ${missingNames.length === 0}`);
  console.log(`Unexpected Subtopics = 0: ${unexpectedNames.length === 0}`);
  console.log(`Random Selection Engine Passed: ${randomTestPass}`);

  if (
    afterTopicCount === 100 &&
    afterSubtopicCount === 100 &&
    subtopicsFromService.length === 100 &&
    subtopicIds.size === 100 &&
    subtopicNames.size === 100 &&
    subtopicSlugs.size === 100 &&
    blankNameCount === 0 &&
    orphanSubtopicsCount === 0 &&
    !hasRandomAsSubtopic &&
    missingNames.length === 0 &&
    unexpectedNames.length === 0 &&
    randomTestPass
  ) {
    console.log('\n====================================================');
    console.log('PHASE 4B-1 GATE: PASS');
    console.log('====================================================');
  } else {
    console.log('\n====================================================');
    console.log('PHASE 4B-1 GATE: BLOCKED');
    console.log('====================================================');
    process.exit(1);
  }
}

runPhase4b1Execution().catch((err) => {
  console.error('Phase 4B-1 execution error:', err);
  process.exit(1);
});
