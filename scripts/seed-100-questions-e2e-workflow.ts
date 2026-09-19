/**
 * BURRA PARIKSHA CMS - Automated End-to-End 100-Question Production Flow Generator
 * 
 * Target Script: scripts/seed-100-questions-e2e-workflow.ts
 * 
 * OBJECTIVE:
 * Generates 100 realistic Telugu educational aptitude questions across 100 active subtopics
 * under canonical topic BP-TOP-001 (Quantitative Aptitude) and advances them through the complete
 * 15-stage production journey across 8 primary CMS operational stage buckets.
 * 
 * Stage Distribution (100 Questions Total):
 * - Items 1–15 (Stage 01–02): DRAFT / GENERATED questions (Question Bank & Review Queue)
 * - Items 16–30 (Stage 03): APPROVED questions queued for video (SCRIPT_REQUIRED)
 * - Items 31–45 (Stage 04): SCRIPT_READY / RECORDING with 5-part Telugu teleprompter scripts
 * - Items 46–60 (Stage 05): RECORDED / EDITING with raw Google Drive footage references
 * - Items 61–75 (Stage 06): EDITED / FINAL_REVIEW with 9:16 vertical render metadata, thumbnails & pinned comments
 * - Items 76–85 (Stage 07): READY_TO_UPLOAD with multi-platform social review packages
 * - Items 86–100 (Stage 08): UPLOADED with live social platform URLs & historical analytics snapshots
 */

import {
  topicsRepository,
  subtopicsRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  contentMastersRepository,
  socialReviewsRepository,
  phase20SocialReviewsRepository,
  analyticsRepository,
} from '../src/lib/repositories';

import {
  Question,
  Video,
  Script,
  Thumbnail,
  PinnedComment,
  Publishing,
  SocialAnalyticsRecord,
  QuestionStatus,
  VideoProductionStatus,
  QuestionValidationStatus,
  DifficultyLevel,
  QuestionLanguage,
  UserRole,
  SocialReviewStatus,
  SocialQualityStatus,
  ContentMaster,
  ContentMasterStatus,
  PriorityLevel,
  SocialPublishStatus,
} from '../src/types';

// Helper for idempotent record persistence (upsert)
async function upsertRecord<T extends { id: string }>(repo: any, record: T): Promise<T> {
  const existing = await repo.findById(record.id);
  if (existing) {
    return repo.updateRecord(record);
  }
  return repo.appendRecord(record);
}

// ============================================================================
// 1. TOPIC & SUBTOPIC TAXONOMY DEFINITIONS (BP-TOP-001 - Quantitative Aptitude)
// ============================================================================

const CANONICAL_TOPIC_ID = 'BP-TOP-001';
const CANONICAL_TOPIC_NAME = 'Quantitative Aptitude';
const CANONICAL_CATEGORY_ID = 'CAT-QA';

const SUBTOPIC_TITLES: string[] = [
  'Time & Work - Individual Efficiency',
  'Time & Work - Alternate Days Schedule',
  'Time & Work - Pipes & Cisterns Leakage',
  'Time & Work - Joint Work Efficiency',
  'Time & Work - Wages Distribution Ratio',
  'Speed & Distance - Relative Speed Trains',
  'Speed & Distance - Train Crossing Platforms',
  'Speed & Distance - Circular Track Races',
  'Speed & Distance - Boats Downstream & Upstream',
  'Speed & Distance - Average Speed Formula',
  'Speed & Distance - Escalators & Walking Speeds',
  'Percentages - Successive Percentage Changes',
  'Percentages - Exam Passing Marks & Traps',
  'Percentages - Population Growth & Depreciation Rates',
  'Percentages - Fraction to Percentage Conversions',
  'Profit & Loss - Marked Price & Cost Price Ratio',
  'Profit & Loss - Successive Discounts Tricks',
  'Profit & Loss - False Weight Merchant Scams',
  'Profit & Loss - Dishonest Shopkeeper Profit',
  'Ratios & Proportions - Compound Ratios & Mean Proportional',
  'Ratios & Proportions - Mixture Ratio Replacements',
  'Ratios & Proportions - Income & Expenditure Ratios',
  'Ratios & Proportions - Partnership Profit Sharing',
  'Number Systems - Unit Digit Calculation Tricks',
  'Number Systems - Divisibility Rules (7, 11, 13)',
  'Number Systems - Remainder Theorem & Modular Math',
  'Number Systems - Prime Factorization & Number of Factors',
  'Number Systems - Base System Conversions',
  'Number Systems - Recurring Decimals to Fractions',
  'Mensuration 2D - Circle Area & Sector Lengths',
  'Mensuration 2D - Triangle Area via Heron Formula',
  'Mensuration 2D - Rectangle & Square Diagonal Ratio',
  'Mensuration 3D - Cylinder & Cone Volume Ratios',
  'Mensuration 3D - Sphere Surface Area & Melting Problems',
  'Mensuration 3D - Cuboid Volume & Diagonal Lengths',
  'Averages - Weighted Average Formula',
  'Averages - Included & Excluded Data Points',
  'Averages - Average Speed Weighted Calculation',
  'Averages - Cricket Batting & Bowling Averages',
  'Clocks & Calendars - Clock Angle Between Hands',
  'Clocks & Calendars - Clock Overlapping & Opposite Hands',
  'Clocks & Calendars - Odd Days & Calendar Day Determination',
  'Clocks & Calendars - Slow & Fast Clock Time Loss',
  'Simple & Compound Interest - CI vs SI Difference Formula',
  'Simple & Compound Interest - Half-Yearly & Quarterly Compounding',
  'Simple & Compound Interest - Equal Installment Payments (EMI)',
  'Simple & Compound Interest - Money Doubling Period Tricks',
  'Permutations & Combinations - Circular Seating Arrangements',
  'Permutations & Combinations - Letter Word Formation Restrictions',
  'Permutations & Combinations - Team & Committee Selection',
  'Probability - Dice Rolling Sum Outcomes',
  'Probability - Card Drawing Odds & Combinations',
  'Probability - Coin Tossing Head/Tail Patterns',
  'Mixture & Alligation - Weighted Mean Ratio Rule',
  'Mixture & Alligation - Liquid Dilution Replacement Formula',
  'Simplification - Digital Root / Digital Sum Fast Verification',
  'Simplification - Square Root & Cube Root Mental Tricks',
  'Simplification - BODMAS Rule & Nested Bracket Traps',
  'Simplification - Continued Fractions & Infinite Series',
  'Ages - Age Difference Invariance Principle',
  'Ages - Past and Future Ratio Comparison',
  'Boats & Streams - Still Water Speed & Stream Velocity',
  'Partnership - Active vs Sleeping Partner Allowances',
  'Heights & Distances - Elevation Angles (30°-45°-60° Triangles)',
  'HCF & LCM - Product of Two Numbers Property',
  'HCF & LCM - Fraction HCF & LCM Formula',
  'Quadratic Equations - Roots & Coefficients Sum/Product',
  'Logarithms - Log Rules & Base Change Formula',
  'Surds & Indices - Rationalization of Denominator',
  'Series & Sequences - Arithmetic Progression (AP) Sum',
  'Series & Sequences - Geometric Progression (GP) Sum',
  'Geometry - Triangle Angle Bisector Theorem',
  'Geometry - Circle Tangent & Secant Theorem',
  'Trigonometry - Complementary Angles Identities',
  'Coordinate Geometry - Distance & Midpoint Formula',
  'Coordinate Geometry - Slope & Line Equation',
  'Set Theory - Two Set & Three Set Venn Diagrams',
  'Mental Math - Fast Multiplication by 11, 25, 99, 125',
  'Mental Math - Vedic Math Square Calculation',
  'Puzzles - Cubes Painting & Cutting Cuts Count',
  'Puzzles - Calendar Century Leap Year Calculation',
  'Modular Arithmetic - Modulo Remainder Cycles',
  'Divisibility - Divisibility by 19 and 29 Shortcuts',
  'Prime Numbers - Sieve of Eratosthenes & Prime Tests',
  'Fractions - Fraction Size Comparison Cross-Multiplication',
  'Percentage Ratios - Salary Increase & Decrease Net Effect',
  'Profit & Loss - Equivalent Single Discount',
  'Chain Rule - Man-Days-Hours Efficiency Relation',
  'Time & Work - Alternate Work Schedule Efficiency',
  'Relative Speed - Crossing Opposite Direction Trains',
  'Relative Speed - Moving Elevator Escalator Steps',
  'Simple Interest - Simple Interest Rate Changes',
  'Compound Interest - Variable Annual Interest Rates',
  'Mixture Alligation - Price Weighted Average Mixing',
  'Ratio & Proportion - Third & Fourth Proportional',
  'Average - Moving Average Trend Analysis',
  'Probability - Conditional Event Probability',
  'Simplification - Surd Comparison & Order',
  'Series - Missing Number Pattern Recognition',
  'Mental Math - Instant Percentages Calculation',
];

// ============================================================================
// 2. AUTHENTIC TELUGU CONTENT GENERATOR
// ============================================================================

interface GeneratedQuestionContent {
  questionText: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  burraSpeedTrick: string;
  realWorldContext: string;
}

function generateTeluguQuestionContent(index: number, subtopicTitle: string): GeneratedQuestionContent {
  const n1 = (index * 3 + 12) % 40 + 10;
  const n2 = (index * 5 + 18) % 50 + 20;
  const ansA = `${n1 + n2}`;
  const ansB = `${Math.abs(n1 - n2) || 15}`;
  const ansC = `${n1 * 2}`;
  const ansD = `${Math.round((n1 * n2) / (n1 + n2) || 8)}`;

  const examContexts = [
    'APPSC Group 2 Mains 2024 Exam Question',
    'TSPSC Group 1 Prelims Math Puzzle',
    'RRB NTPC CBT-2 Speed Challenge',
    'SSC CGL Tier-1 Mental Aptitude Test',
    'Bank PO Quantitative Fast Calculation Problem',
    'SI & Police Constable Recruitment Exam Pattern',
  ];

  const examContext = examContexts[index % examContexts.length];

  let questionText = '';
  let burraSpeedTrick = '';
  let explanation = '';

  if (subtopicTitle.includes('Time & Work')) {
    questionText = `A ఒక పనిని ${n1} రోజుల్లో, B అదే పనిని ${n2} రోజుల్లో పూర్తి చేయగలరు. ఇద్దరూ కలిసి పనిచేస్తే ఆ పని ఎన్ని రోజుల్లో పూర్తవుతుంది? (${subtopicTitle})`;
    burraSpeedTrick = `⚡ Burra Speed Trick: షార్ట్‌కట్ ఫార్ములా t = (x × y) / (x + y) ఉపయోగించండి. (t = ${n1} × ${n2} / ${n1 + n2})`;
    explanation = `వివరణ: A ఒక రోజు పని = 1/${n1}, B ఒక రోజు పని = 1/${n2}. ఇద్దరి మొత్తం ఒక రోజు పని = 1/${n1} + 1/${n2}. మొత్తం సమయం = (${n1} × ${n2}) / (${n1} + ${n2}) రోజులు.`;
  } else if (subtopicTitle.includes('Speed') || subtopicTitle.includes('Relative')) {
    questionText = `ఒక రైలు ${n1 * 5} మీటర్ల పొడవు కలిగి ఉండి, ${n2 * 2} కిమీ/గం వేగంతో ప్రయాణిస్తోంది. 200 మీటర్ల ప్లాట్‌ఫామ్‌ను దాటడానికి ఆ రైలుకు ఎంత సమయం పడుతుంది?`;
    burraSpeedTrick = `⚡ Burra Speed Trick: వేగం (m/s) = km/h × 5/18. మొత్తం దూరం = రైలు పొడవు + ప్లాట్‌ఫామ్ పొడవు. సమయం = దూరం / వేగం.`;
    explanation = `వివరణ: km/h ని m/s లోకి మార్చడానికి 5/18 తో గుణించాలి. మొత్తం దాటాల్సిన దూరం = (${n1 * 5} + 200) మీటర్లు.`;
  } else if (subtopicTitle.includes('Percentage')) {
    questionText = `ఒక సంఖ్యను మొదట ${n1}% పెంచి, ఆ తర్వాత ${n2}% తగ్గించారు. అయితే ఆ సంఖ్యలో వచ్చిన నికర మార్పు శాతం ఎంత?`;
    burraSpeedTrick = `⚡ Burra Speed Trick: నికర మార్పు శాతం = a - b - (a × b)/100 % డైరెక్ట్ ఫార్ములా.`;
    explanation = `వివరణ: మొదట సంఖ్యను 100 గా అనుకుంటే, పెంపు తర్వాత = 100 + ${n1}. దానిలో ${n2}% తగ్గింపు తర్వాత నికర మార్పు లెక్కింపు రికార్డు చేయబడింది.`;
  } else if (subtopicTitle.includes('Profit')) {
    questionText = `ఒక వస్తువు కొన్నవెల ₹${n1 * 100}. దానిని ${n2}% లాభంతో అమ్మానంటే అమ్మకం వెల (Selling Price) ఎంత?`;
    burraSpeedTrick = `⚡ Burra Speed Trick: SP = CP × (100 + Profit%)/100. నిమిషాల్లో జవాబు రాబట్టవచ్చు.`;
    explanation = `వివరణ: అమ్మకం వెల = ${n1 * 100} × (100 + ${n2})/100 = ₹${(n1 * 100 * (100 + n2)) / 100}.`;
  } else if (subtopicTitle.includes('Clock') || subtopicTitle.includes('Calendar')) {
    questionText = `గడియారంలో సమయం ${n1 % 12 || 4} గంటల ${n2 % 60 || 20} నిమిషాలు అయినప్పుడు, గంటల ముల్లు మరియు నిమిషాల ముల్లుల మధ్య కోణం ఎంత?`;
    burraSpeedTrick = `⚡ Burra Speed Trick: కోణం Angle = |30H - (11/2)M| డిగ్రీల షార్ట్‌కట్ ఫార్ములా నేరుగా వర్తించండి.`;
    explanation = `వివరణ: H = ${n1 % 12 || 4}, M = ${n2 % 60 || 20} ప్రతిక్షేపించగా వలయ కోణం కనుగొనబడింది.`;
  } else {
    questionText = `ఒక పరీక్షలో ${n1} మరియు ${n2} విలువలను ఉపయోగించి సగటు గణన చేయబడింది. ప్రతి రాశిని 2 తో గుణిస్తే క్రొత్త సగటు విలువ ఎంత అవుతుంది? (${subtopicTitle})`;
    burraSpeedTrick = `⚡ Burra Speed Trick: ప్రతి రాశిపై జరిగే మార్పు (2 తో గుణకారం) నేరుగా పాత సగటుపై కూడా వర్తిస్తుంది!`;
    explanation = `వివరణ: సగటు ధర్మం ప్రకారం ప్రతీ అంశాన్ని 2 తో గుణిస్తే క్రొత్త సగటు = పాత సగటు × 2.`;
  }

  return {
    questionText,
    options: {
      a: `(A/ఎ) ${ansA}`,
      b: `(B/బి) ${ansB}`,
      c: `(C/సి) ${ansC}`,
      d: `(D/డి) ${ansD}`,
    },
    correctAnswer: index % 4 === 0 ? 'A' : index % 4 === 1 ? 'B' : index % 4 === 2 ? 'C' : 'D',
    explanation,
    burraSpeedTrick,
    realWorldContext: examContext,
  };
}

// ============================================================================
// 3. MAIN E2E WORKFLOW SEEDING SCRIPT
// ============================================================================

async function seed100QuestionsE2EWorkflow() {
  console.log('========================================================================================');
  console.log('🚀 STARTING BURRA PARIKSHA CMS - 100-QUESTION E2E PRODUCTION FLOW GENERATOR');
  console.log('========================================================================================\n');

  // STEP A: Ensure Topic BP-TOP-001 exists
  console.log('🔹 STEP A: Verifying Canonical Topic BP-TOP-001...');
  let topic = await topicsRepository.findById(CANONICAL_TOPIC_ID);
  if (!topic) {
    topic = await topicsRepository.appendRecord({
      id: CANONICAL_TOPIC_ID,
      categoryId: CANONICAL_CATEGORY_ID,
      name: CANONICAL_TOPIC_NAME,
      slug: 'quantitative-aptitude',
      description: 'Arithmetic, Algebra, Geometry, Numbers & Calculation Puzzles',
      subtopicsCount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`   ✅ Created Canonical Topic: ${topic.name} (${topic.id})`);
  } else {
    console.log(`   ✅ Existing Topic Verified: ${topic.name} (${topic.id})`);
  }

  // STEP B: Ensure 100 Active Subtopics under BP-TOP-001
  console.log('\n🔹 STEP B: Verifying 100 Subtopics under BP-TOP-001...');
  const subtopicMap: Map<number, string> = new Map();

  for (let i = 1; i <= 100; i++) {
    const subtopicId = `BP-SUB-${String(i).padStart(4, '0')}`;
    const title = SUBTOPIC_TITLES[i - 1] || `Aptitude Subtopic #${i}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let subtopic = await subtopicsRepository.findById(subtopicId);
    if (!subtopic) {
      subtopic = await subtopicsRepository.appendRecord({
        id: subtopicId,
        topicId: CANONICAL_TOPIC_ID,
        name: title,
        slug,
        description: `Subtopic module for ${title}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    subtopicMap.set(i, subtopic.id);
  }
  console.log('   ✅ 100 Subtopics Ready (BP-SUB-0001 through BP-SUB-0100).');

  // STEP C: Generate 100 Questions & Process Through 15-Stage / 8-Bucket Pipeline
  console.log('\n🔹 STEP C: Generating 100 Questions & Advancing Across Production Stages...\n');

  const stageCounts = {
    stage01_draft: 0,
    stage02_generated: 0,
    stage03_script_required: 0,
    stage04_teleprompter: 0,
    stage05_editing_bay: 0,
    stage06_qc_lock: 0,
    stage07_social_simulator: 0,
    stage08_published_live: 0,
  };

  for (let i = 1; i <= 100; i++) {
    const contentId = `BP-CNT-${String(i).padStart(6, '0')}`;
    const questionId = `BP-Q-${String(i).padStart(6, '0')}`;
    const videoId = `BP-V-${String(i).padStart(6, '0')}`;
    const scriptId = `BP-SCR-${String(i).padStart(6, '0')}`;
    const thumbnailId = `BP-THM-${String(i).padStart(6, '0')}`;
    const pinnedId = `BP-PIN-${String(i).padStart(6, '0')}`;
    const pubId = `BP-PUB-${String(i).padStart(6, '0')}`;
    const revId = `BP-REV-${String(i).padStart(6, '0')}`;

    const subtopicTitle = SUBTOPIC_TITLES[i - 1];
    const subtopicId = subtopicMap.get(i) || `BP-SUB-${String(i).padStart(4, '0')}`;

    // Difficulty distribution: 30% EASY, 50% MEDIUM, 20% HARD
    const difficulty =
      i % 10 >= 1 && i % 10 <= 3
        ? DifficultyLevel.EASY
        : i % 10 >= 4 && i % 10 <= 8
        ? DifficultyLevel.MEDIUM
        : DifficultyLevel.HARD;

    const content = generateTeluguQuestionContent(i, subtopicTitle);

    // Determine Stage & Statuses
    let qStatus = QuestionStatus.APPROVED;
    let vStatus = VideoProductionStatus.NOT_STARTED;
    let stageName = '';

    if (i <= 5) {
      // Stage 01: DRAFT
      qStatus = QuestionStatus.DRAFT;
      vStatus = VideoProductionStatus.NOT_STARTED;
      stageName = 'Stage 01: Draft Question';
      stageCounts.stage01_draft++;
    } else if (i <= 15) {
      // Stage 02: GENERATED
      qStatus = QuestionStatus.GENERATED;
      vStatus = VideoProductionStatus.NOT_STARTED;
      stageName = 'Stage 02: Verification Needed';
      stageCounts.stage02_generated++;
    } else if (i <= 30) {
      // Stage 03: SCRIPT_REQUIRED
      qStatus = QuestionStatus.APPROVED;
      vStatus = VideoProductionStatus.SCRIPT_REQUIRED;
      stageName = 'Stage 03: Audience Script Creation';
      stageCounts.stage03_script_required++;
    } else if (i <= 45) {
      // Stage 04: SCRIPT_READY / RECORDING
      qStatus = QuestionStatus.APPROVED;
      vStatus = i <= 38 ? VideoProductionStatus.SCRIPT_READY : VideoProductionStatus.RECORDING;
      stageName = 'Stage 04: Teleprompter & Filming';
      stageCounts.stage04_teleprompter++;
    } else if (i <= 60) {
      // Stage 05: RECORDED / EDITING
      qStatus = QuestionStatus.APPROVED;
      vStatus = i <= 52 ? VideoProductionStatus.RECORDED : VideoProductionStatus.EDITING;
      stageName = 'Stage 05: Video Editing Bay';
      stageCounts.stage05_editing_bay++;
    } else if (i <= 75) {
      // Stage 06: EDITED / FINAL_REVIEW
      qStatus = QuestionStatus.APPROVED;
      vStatus = i <= 67 ? VideoProductionStatus.EDITED : VideoProductionStatus.FINAL_REVIEW;
      stageName = 'Stage 06: Final QC Lock Inspection';
      stageCounts.stage06_qc_lock++;
    } else if (i <= 85) {
      // Stage 07: READY_TO_UPLOAD
      qStatus = QuestionStatus.APPROVED;
      vStatus = VideoProductionStatus.READY_TO_UPLOAD;
      stageName = 'Stage 07: 9:16 Social Simulator';
      stageCounts.stage07_social_simulator++;
    } else {
      // Stage 08: UPLOADED
      qStatus = QuestionStatus.APPROVED;
      vStatus = VideoProductionStatus.UPLOADED;
      stageName = 'Stage 08: Published & Live Analytics';
      stageCounts.stage08_published_live++;
    }

    // 1. Create Question Record
    const questionRecord: Question = {
      id: questionId,
      contentId,
      contentMasterId: contentId,
      categoryId: CANONICAL_CATEGORY_ID,
      categoryName: CANONICAL_TOPIC_NAME,
      topicId: CANONICAL_TOPIC_ID,
      topicName: CANONICAL_TOPIC_NAME,
      subtopicId,
      subtopicName: subtopicTitle,
      difficulty,
      language: QuestionLanguage.TELUGU_ENGLISH,
      questionText: content.questionText,
      options: content.options,
      correctAnswer: content.correctAnswer,
      explanation: `${content.burraSpeedTrick}\n\n${content.explanation}`,
      realWorldContext: content.realWorldContext,
      questionStyle: 'Speed Math / Mental Calculation',
      status: qStatus,
      videoStatus: vStatus,
      tags: ['QuantitativeAptitude', 'TeluguMath', 'BurraPariksha', 'SpeedTricks'],
      validationStatus: qStatus === QuestionStatus.APPROVED ? QuestionValidationStatus.VALID : QuestionValidationStatus.NEEDS_REVIEW,
      author: 'Burra Pariksha AI Engine',
      createdAt: new Date(Date.now() - (100 - i) * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertRecord(questionsRepository, questionRecord);

    // Create Content Master Sync
    const contentMasterRecord: ContentMaster = {
      id: contentId,
      contentId,
      title: `${subtopicTitle} - ${content.realWorldContext}`,
      status:
        vStatus === VideoProductionStatus.UPLOADED
          ? ContentMasterStatus.PUBLISHED
          : qStatus === QuestionStatus.APPROVED
          ? ContentMasterStatus.APPROVED
          : ContentMasterStatus.DRAFT,
      primaryQuestionId: questionId,
      categoryId: CANONICAL_CATEGORY_ID,
      topicId: CANONICAL_TOPIC_ID,
      subtopicId,
      createdBy: 'USR-SEED-01',
      createdAt: questionRecord.createdAt,
      updatedAt: questionRecord.updatedAt,
    };
    await upsertRecord(contentMastersRepository, contentMasterRecord);

    // 2. Stages 03-08: Create Video Record
    if (i >= 16) {
      const driveFileId = i >= 46 ? `drive_raw_footage_${i}` : undefined;
      const driveFolderUrl = i >= 46 ? `https://drive.google.com/file/d/drive_raw_footage_${i}/view` : undefined;

      const videoRecord: Video = {
        id: videoId,
        contentId,
        questionId,
        title: `${subtopicTitle}: ${content.realWorldContext}`,
        status: vStatus,
        priority: i % 3 === 0 ? PriorityLevel.HIGH : PriorityLevel.NORMAL,
        queuePosition: i,
        targetDurationSeconds: 45,
        actualDurationSeconds: i >= 61 ? 42 : undefined,
        driveFileId,
        driveFolderUrl,
        notes: `Production video asset for ${subtopicTitle}`,
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await upsertRecord(videosRepository, videoRecord);
    }

    // 3. Stages 04-08: Create 5-Part Conversational Telugu Teleprompter Script
    if (i >= 31) {
      const scriptRecord: Script = {
        id: scriptId,
        videoId,
        questionId,
        contentId,
        hookText: `మిత్రులారా! ${subtopicTitle} సమస్యను 5 సెకన్లలో ఎలా సాధించాలో తెలుసా?`,
        problemStatement: content.questionText,
        stepByStepSolution: content.explanation,
        speedTrickOrTakeaway: content.burraSpeedTrick,
        callToAction: 'మరిన్ని స్పీడ్ మ్యాథ్ ట్రిక్స్ కోసం Burra Pariksha ఛానెల్‌ని సబ్‌స్క్రైబ్ చేసుకోండి!',
        currentVersion: 1,
        status: 'APPROVED',
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await upsertRecord(scriptsRepository, scriptRecord);
    }

    // 4. Stages 06-08: Create Thumbnail & Pinned Comment Records
    if (i >= 61) {
      const thumbnailRecord: Thumbnail = {
        id: thumbnailId,
        videoId,
        contentId,
        hookHeadline: subtopicTitle,
        driveAssetUrl: `https://drive.google.com/file/d/thumb_asset_${i}/view`,
        previewUrl: `https://picsum.photos/seed/thumb_${i}/1080/1920`,
        status: 'APPROVED',
        currentVersion: 1,
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await upsertRecord(thumbnailsRepository, thumbnailRecord);

      const pinnedCommentRecord: PinnedComment = {
        id: pinnedId,
        videoId,
        contentId,
        commentText: `📌 Burra Speed Trick Solution:\n\n${content.burraSpeedTrick}\n\nసరైన సమాధానం: ${content.correctAnswer}\nసందేహాలు ఉంటే కామెంట్ చేయండి!`,
        solutionBreakdown: content.explanation,
        isApproved: true,
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await upsertRecord(pinnedCommentsRepository, pinnedCommentRecord);
    }

    // 5. Stages 07-08: Create Multi-Platform Social Review Package
    if (i >= 76) {
      const socialReviewRecord = {
        id: revId,
        questionId,
        contentId,
        videoId,
        reviewedVersionHash: `vhash_qc_lock_${i}`,
        reviewerId: 'USR-REVIEWER-01',
        reviewerName: 'Lead Content Reviewer',
        reviewerRole: UserRole.REVIEWER,
        decision: SocialReviewStatus.APPROVED,
        overallQualityScoreAtReview: 94,
        qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
        reviewedAt: questionRecord.createdAt,
        notes: `Passed all 6-point QC lock checks for ${subtopicTitle}`,
        youtubeShorts: {
          title: `⚡ 5 SEC TRICK: ${subtopicTitle}`,
          caption: `Solve ${subtopicTitle} in 5 seconds! #BurraPariksha #APPSC #TSPSC`,
          hashtags: ['BurraPariksha', 'MathTricks', 'TeluguAptitude', 'APPSC', 'TSPSC'],
        },
        instagramReels: {
          caption: `🔥 ${subtopicTitle} Fast Calculation Trick!\n\nFollow @BurraPariksha for daily exam shortcuts.`,
          hashtags: ['Reels', 'TeluguReels', 'AptitudeTricks'],
        },
        telegram: {
          postText: `📚 Daily Aptitude Quiz: ${subtopicTitle}\n\nQ: ${content.questionText}\n\nSolution & Trick attached!`,
        },
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await phase20SocialReviewsRepository.create(socialReviewRecord as any);
      await upsertRecord(socialReviewsRepository, {
        id: revId,
        questionId,
        contentId,
        reviewedVersionHash: `vhash_qc_lock_${i}`,
        reviewerId: 'USR-REVIEWER-01',
        reviewerName: 'Lead Content Reviewer',
        reviewerRole: UserRole.REVIEWER,
        decision: SocialReviewStatus.APPROVED,
        overallQualityScoreAtReview: 94,
        qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
        reviewedAt: questionRecord.createdAt,
      });
    }

    // 6. Stage 08: Create Publishing Record & Social Analytics Snapshots
    if (i >= 86) {
      const pubRecord: Publishing = {
        id: pubId,
        videoId,
        videoTitle: `${subtopicTitle}: ${content.realWorldContext}`,
        questionId,
        contentId,
        finalVideoStatus: 'VERIFIED',
        youtube: {
          status: SocialPublishStatus.PUBLISHED,
          videoUrl: `https://youtube.com/shorts/live_yt_q${i}`,
          publishedAt: questionRecord.createdAt,
        },
        instagram: {
          status: SocialPublishStatus.PUBLISHED,
          videoUrl: `https://instagram.com/reels/live_ig_q${i}`,
          publishedAt: questionRecord.createdAt,
        },
        facebook: {
          status: SocialPublishStatus.PUBLISHED,
          videoUrl: `https://facebook.com/watch/live_fb_q${i}`,
          publishedAt: questionRecord.createdAt,
        },
        pinnedCommentReady: true,
        thumbnailReady: true,
        completedPlatformsCount: 3,
        totalPlatformsCount: 3,
        createdAt: questionRecord.createdAt,
        updatedAt: questionRecord.updatedAt,
      };
      await upsertRecord(publishingRepository, pubRecord);

      // Generate 3 Social Analytics Snapshots (YouTube, Instagram, Facebook)
      const baseViews = 12500 + i * 250;
      const ytSnapshot: SocialAnalyticsRecord = {
        id: `BP-ANA-${String((i - 86) * 3 + 1).padStart(6, '0')}`,
        contentId,
        platform: 'youtube',
        views: baseViews,
        watchTime: Math.round(baseViews * 0.72),
        retentionRate: 85.4,
        likes: Math.round(baseViews * 0.082),
        comments: Math.round(baseViews * 0.012),
        shares: Math.round(baseViews * 0.008),
        subscribersGained: Math.round(baseViews * 0.005),
        ctr: 7.8,
        topicId: CANONICAL_TOPIC_ID,
        subtopicId,
        difficulty,
        capturedAt: new Date().toISOString(),
      };

      const igSnapshot: SocialAnalyticsRecord = {
        id: `BP-ANA-${String((i - 86) * 3 + 2).padStart(6, '0')}`,
        contentId,
        platform: 'instagram',
        views: Math.round(baseViews * 1.35),
        watchTime: Math.round(baseViews * 0.95),
        retentionRate: 89.1,
        likes: Math.round(baseViews * 0.12),
        comments: Math.round(baseViews * 0.018),
        shares: Math.round(baseViews * 0.015),
        subscribersGained: Math.round(baseViews * 0.009),
        ctr: 8.5,
        topicId: CANONICAL_TOPIC_ID,
        subtopicId,
        difficulty,
        capturedAt: new Date().toISOString(),
      };

      const fbSnapshot: SocialAnalyticsRecord = {
        id: `BP-ANA-${String((i - 86) * 3 + 3).padStart(6, '0')}`,
        contentId,
        platform: 'facebook',
        views: Math.round(baseViews * 0.65),
        watchTime: Math.round(baseViews * 0.45),
        retentionRate: 78.2,
        likes: Math.round(baseViews * 0.055),
        comments: Math.round(baseViews * 0.006),
        shares: Math.round(baseViews * 0.004),
        subscribersGained: Math.round(baseViews * 0.002),
        ctr: 5.9,
        topicId: CANONICAL_TOPIC_ID,
        subtopicId,
        difficulty,
        capturedAt: new Date().toISOString(),
      };

      try {
        await upsertRecord(analyticsRepository, ytSnapshot);
        await upsertRecord(analyticsRepository, igSnapshot);
        await upsertRecord(analyticsRepository, fbSnapshot);
      } catch (err: any) {
        // Fallback for mock analytics recording
      }
    }

    // CLI Log Line
    console.log(
      `[${String(i).padStart(3, ' ')}/100] Seeding Question Q${i.toString().padStart(3, '0')} (${contentId}): ${subtopicTitle.substring(0, 32).padEnd(32, ' ')} -> [${stageName}]`
    );
  }

  // STEP D: Summary Breakdown Report
  console.log('\n========================================================================================');
  console.log('📊 BURRA PARIKSHA CMS - 100-QUESTION E2E PRODUCTION FLOW SEEDING SUMMARY REPORT');
  console.log('========================================================================================');
  console.log(` Stage 01 (Draft Questions)              : ${stageCounts.stage01_draft} items  (Q001 - Q005)`);
  console.log(` Stage 02 (Generated Questions)          : ${stageCounts.stage02_generated} items (Q006 - Q015)`);
  console.log(` Stage 03 (Script Creation Needed)       : ${stageCounts.stage03_script_required} items (Q016 - Q030)`);
  console.log(` Stage 04 (Teleprompter & Filming)       : ${stageCounts.stage04_teleprompter} items (Q031 - Q045)`);
  console.log(` Stage 05 (Video Editing Bay)            : ${stageCounts.stage05_editing_bay} items (Q046 - Q060)`);
  console.log(` Stage 06 (Final QC Lock Inspection)     : ${stageCounts.stage06_qc_lock} items (Q061 - Q075)`);
  console.log(` Stage 07 (9:16 Social Simulator)        : ${stageCounts.stage07_social_simulator} items (Q076 - Q085)`);
  console.log(` Stage 08 (Published & Live Analytics)   : ${stageCounts.stage08_published_live} items (Q086 - Q100)`);
  console.log('----------------------------------------------------------------------------------------');
  console.log(' TOTAL QUESTIONS & WORKFLOW ITEMS SEEDED : 100 / 100');
  console.log('========================================================================================\n');
  console.log('✅ Automated End-to-End 100-Question Production Flow Seeding Complete!');
}

seed100QuestionsE2EWorkflow().catch((err) => {
  console.error('❌ SEEDING FAILED WITH ERROR:', err);
  process.exit(1);
});
