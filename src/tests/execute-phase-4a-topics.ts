import fs from 'fs';
import path from 'path';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { SHEET_TABS, SHEET_SCHEMAS } from '../lib/schemas/google-sheets-schema';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { objectToRow } from '../lib/google-sheets/helpers';

const FINALIZED_100_TOPICS = [
  "Number Fundamentals",
  "Number Operations",
  "Number Properties",
  "Factors and Multiples",
  "Divisibility and Remainders",
  "Fractions and Decimals",
  "Percentages",
  "Ratio and Proportion",
  "Averages",
  "Profit, Loss and Discounts",
  "Simple and Compound Interest",
  "Time, Work and Efficiency",
  "Pipes, Tanks and Work Rates",
  "Time, Speed and Distance",
  "Problems on Trains",
  "Boats, Streams and Relative Speed",
  "Mixtures and Alligation",
  "Ages and Relationships",
  "Unitary Method and Variation",
  "Quantitative Estimation",
  "Algebraic Thinking",
  "Equations and Inequalities",
  "Sequences and Series",
  "Mathematical Patterns",
  "Mathematical Puzzles",
  "Counting and Combinations",
  "Probability",
  "Data Interpretation",
  "Data Sufficiency",
  "Sets and Venn Reasoning",
  "Geometry",
  "Mensuration",
  "Coordinate and Graph Thinking",
  "Mathematical Logic",
  "Mental Calculation",
  "Logical Reasoning",
  "Analytical Reasoning",
  "Deductive Reasoning",
  "Inductive Reasoning",
  "Critical Reasoning",
  "Cause and Effect",
  "Assumptions and Inference",
  "Statement and Conclusion",
  "Statement and Argument",
  "Decision-Based Reasoning",
  "Constraint and Condition Puzzles",
  "Ordering and Ranking",
  "Grouping and Arrangement",
  "Scheduling and Sequencing",
  "Logic Grid Puzzles",
  "Vocabulary Challenges",
  "Word Relationships",
  "Word Formation",
  "Word Patterns",
  "Letter and Alphabet Reasoning",
  "Anagrams and Word Rearrangement",
  "Odd Word and Classification",
  "Analogies",
  "Coding and Decoding",
  "Reading Comprehension",
  "Verbal Inference",
  "Sentence Logic",
  "Grammar Intelligence",
  "Language Puzzles",
  "Word-Based Mathematical Challenges",
  "Visual Pattern Recognition",
  "Shape and Figure Reasoning",
  "Spatial Reasoning",
  "Direction and Navigation",
  "Mental Rotation",
  "Mirror and Water Images",
  "Paper Folding and Cutting",
  "Cube and Dice Reasoning",
  "Visual Counting",
  "Figure Completion",
  "Figure Classification",
  "Embedded Figures",
  "Hidden Objects",
  "Find the Difference",
  "Visual Sequence Puzzles",
  "Observation Challenges",
  "Attention and Distraction",
  "Memory Challenges",
  "Working Memory",
  "Recall and Recognition",
  "Processing Speed",
  "Reaction and Response",
  "Mental Agility",
  "Pattern Prediction",
  "Cognitive Flexibility",
  "Everyday Decision Making",
  "Money and Financial Decisions",
  "Shopping and Price Intelligence",
  "Risk and Probability in Life",
  "Common Sense Reasoning",
  "Practical Problem Solving",
  "Safety and Situational Awareness",
  "Scam and Fraud Detection",
  "Digital and Technology Intelligence",
  "Strategy and Game Thinking"
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function runPhase4aExecution() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 4A TOPICS LOADING');
  console.log('====================================================\n');

  // STEP 1: Backup
  googleSheetsClient.invalidateRowCache();
  taxonomyService.invalidateCache();

  const rawTopicsBefore = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const rawSubtopicsBefore = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `phase-4a-pre-topics-backup-${timestamp}.json`);
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

  // STEP 2: Clear old prototype SUBTOPICS (target is 0)
  await googleSheetsClient.clearDataRows(SHEET_TABS.SUBTOPICS);
  console.log('[PASS] SUBTOPICS sheet cleared to 0 rows.');

  // STEP 3: Clear old prototype TOPICS
  await googleSheetsClient.clearDataRows(SHEET_TABS.TOPICS);
  console.log('[PASS] TOPICS sheet cleared.');

  // STEP 4: Format the 100 Topics rows
  const topicSchema = SHEET_SCHEMAS[SHEET_TABS.TOPICS];
  const topicHeaders = topicSchema.columns.map((c) => c.name);

  const now = new Date().toISOString();
  const newTopicObjects = FINALIZED_100_TOPICS.map((name, index) => {
    const num = index + 1;
    const id = `BP-TOP-${String(num).padStart(3, '0')}`;
    const slug = slugify(name);
    return {
      id,
      categoryId: '',
      name,
      slug,
      description: '',
      displayOrder: num,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  });

  const topicRowValues = newTopicObjects.map((obj) => objectToRow(obj, topicHeaders, topicSchema));

  // STEP 5: Write to TOPICS sheet starting at row A2
  await googleSheetsClient.updateRangeValues(SHEET_TABS.TOPICS, 'A2', topicRowValues);
  console.log(`[PASS] Wrote ${topicRowValues.length} production topics to live TOPICS sheet.`);

  // STEP 6: Invalidate caches and read back from Google Sheets
  googleSheetsClient.invalidateRowCache();
  taxonomyService.invalidateCache();

  const rawTopicsAfter = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const rawSubtopicsAfter = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);

  const afterTopicCount = rawTopicsAfter.rows.length;
  const afterSubtopicCount = rawSubtopicsAfter.rows.length;

  console.log(`\nAfter Rows: TOPICS = ${afterTopicCount}, SUBTOPICS = ${afterSubtopicCount}`);

  // STEP 7: Validation checks
  const topicsFromService = await taxonomyService.getTopics(undefined, { includeInactive: true });
  console.log(`TaxonomyService fetched ${topicsFromService.length} topics.`);

  const topicIds = new Set<string>();
  const topicNames = new Set<string>();
  const topicSlugs = new Set<string>();
  let populatedCategoryIdCount = 0;
  let blankNameCount = 0;
  const missingNames: string[] = [];
  const unexpectedNames: string[] = [];

  const finalizedNameSet = new Set(FINALIZED_100_TOPICS);

  topicsFromService.forEach((t) => {
    if (!t.name || !t.name.trim()) blankNameCount++;
    if (t.categoryId && t.categoryId.trim() !== '') populatedCategoryIdCount++;

    topicIds.add(t.id);
    topicNames.add(t.name);
    if (t.slug) topicSlugs.add(t.slug);

    if (!finalizedNameSet.has(t.name)) {
      unexpectedNames.push(t.name);
    }
  });

  FINALIZED_100_TOPICS.forEach((name) => {
    if (!topicNames.has(name)) {
      missingNames.push(name);
    }
  });

  // Display orders check: 1 to 100
  const displayOrders = topicsFromService.map((t) => t.displayOrder).sort((a, b) => (a || 0) - (b || 0));
  const isDisplayOrderValid = displayOrders.length === 100 && displayOrders.every((val, idx) => val === idx + 1);

  console.log('\n--- VERIFICATION CHECKS ---');
  console.log(`Total Topics = 100: ${afterTopicCount === 100}`);
  console.log(`Unique Topic IDs = 100: ${topicIds.size === 100}`);
  console.log(`Unique Topic Names = 100: ${topicNames.size === 100}`);
  console.log(`Unique Slugs = 100: ${topicSlugs.size === 100}`);
  console.log(`Blank Topic Names = 0: ${blankNameCount === 0}`);
  console.log(`Populated category_id = 0: ${populatedCategoryIdCount === 0}`);
  console.log(`Missing Expected Topic Names = 0: ${missingNames.length === 0}`);
  console.log(`Unexpected Topic Names = 0: ${unexpectedNames.length === 0}`);
  console.log(`Display Orders 1..100 Sequential: ${isDisplayOrderValid}`);
  console.log(`SUBTOPICS Row Count = 0: ${afterSubtopicCount === 0}`);

  if (
    afterTopicCount === 100 &&
    topicIds.size === 100 &&
    topicNames.size === 100 &&
    topicSlugs.size === 100 &&
    blankNameCount === 0 &&
    populatedCategoryIdCount === 0 &&
    missingNames.length === 0 &&
    unexpectedNames.length === 0 &&
    isDisplayOrderValid &&
    afterSubtopicCount === 0
  ) {
    console.log('\n====================================================');
    console.log('PHASE 4A GATE: PASS');
    console.log('====================================================');
  } else {
    console.log('\n====================================================');
    console.log('PHASE 4A GATE: BLOCKED');
    console.log('====================================================');
    process.exit(1);
  }
}

runPhase4aExecution().catch((err) => {
  console.error('Phase 4A execution error:', err);
  process.exit(1);
});
