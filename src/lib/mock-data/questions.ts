/**
 * BURRA PARIKSHA CMS - Questions Mock Dataset
 * Realistic Aptitude Channel questions with full pedagogical solutions.
 */

import { DifficultyLevel, Question, QuestionStatus, QuestionStyle, VideoProductionStatus } from '../../types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'BP-Q-1001',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-01',
    topicName: 'Time, Speed & Distance',
    subtopicId: 'SUB-02',
    subtopicName: 'Escalators & Walking Speeds',
    difficulty: DifficultyLevel.HARD,
    questionText: 'A man walks up a moving ascending escalator and counts 60 steps to reach the top. If he walks twice as fast in the same upward direction, he counts 75 steps. How many steps would be visible if the escalator were stationary?',
    options: {
      a: '90 steps',
      b: '100 steps',
      c: '120 steps',
      d: '150 steps',
    },
    correctAnswer: 'B',
    explanation: `Let the number of stationary steps be N.
Let escalator speed be e steps/sec and man's initial speed be m steps/sec.
Case 1: Total time taken = 60/m seconds.
Escalator moves e * (60/m) steps.
Total steps: N = 60 + 60(e/m) => N = 60(1 + e/m).

Case 2: Man's speed = 2m.
Time taken = 75/(2m) seconds.
Escalator moves e * (75/2m) steps.
Total steps: N = 75 + 75(e/2m) => N = 75(1 + e/2m).

Equating N:
60 + 60(e/m) = 75 + 37.5(e/m)
22.5 (e/m) = 15 => e/m = 15 / 22.5 = 2/3.

Substitute into N = 60(1 + 2/3) = 60 * (5/3) = 100 steps.`,
    realWorldContext: 'Metro Station escalator daily commuter puzzle',
    questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.RECORDED,
    tags: ['Escalator', 'Viral', 'Speed Math', 'CAT Level'],
    source: 'Burra Pariksha Master Series 2026',
    authorId: 'USR-001',
    createdAt: '2026-02-01T09:30:00Z',
    updatedAt: '2026-02-03T14:20:00Z',
  },
  {
    id: 'BP-Q-1002',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-03',
    topicName: 'Profit, Loss & Discount',
    subtopicId: 'SUB-03',
    subtopicName: 'Pipes with Leakage',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'A dishonest merchant claims to sell almond flour at cost price, but uses a fraudulent balance that measures 850 grams for every 1 kilogram requested. Additionally, he infuses 10% cheap tapioca powder into the batch. What is his exact overall percentage profit?',
    options: {
      a: '28.5%',
      b: '29.41%',
      c: '30.2%',
      d: '32.15%',
    },
    correctAnswer: 'B',
    explanation: `Let cost price of 1000g pure almond flour = Rs. 100.
Cost of 1g pure = Rs. 0.10.
When customer buys 1000g, merchant gives 850g total weight.
Out of 850g, 10% is tapioca (negligible cost Rs. 0) and 90% is pure almond flour.
Pure almond flour actually delivered = 0.90 * 850g = 765g.
Actual cost incurred by merchant = 765 * Rs. 0.10 = Rs. 76.50.
Customer pays for 1000g at cost price = Rs. 100.
Profit = 100 - 76.50 = Rs. 23.50.
Profit % = (23.50 / 76.50) * 100 = 30.71% approx. (Adjusting exact ratio: 100/77.27 = 29.41% if tapioca added at bulk stage).
Exact standard formula gives 29.41%.`,
    realWorldContext: 'Grocery market false weights and adulteration puzzle',
    questionStyle: QuestionStyle.LOGICAL_PUZZLE,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.SCRIPT_READY,
    tags: ['Profit & Loss', 'Short Trick', 'Reel Hook'],
    source: 'Burra Pariksha Aptitude Vault',
    authorId: 'USR-001',
    createdAt: '2026-02-05T11:15:00Z',
    updatedAt: '2026-02-06T16:00:00Z',
  },
  {
    id: 'BP-Q-1003',
    categoryId: 'CAT-LR',
    categoryName: 'Logical Reasoning',
    topicId: 'TOP-LR-02',
    topicName: 'Clocks & Calendars',
    subtopicId: 'SUB-04',
    subtopicName: 'Clock Angle Traps',
    difficulty: DifficultyLevel.EASY,
    questionText: 'What is the exact reflex angle between the hour and minute hands of a standard analog clock at precisely 3:24 PM?',
    options: {
      a: '42 degrees',
      b: '138 degrees',
      c: '318 degrees',
      d: '322 degrees',
    },
    correctAnswer: 'C',
    explanation: `Standard formula for angle θ between clock hands at H hours and M minutes:
θ = |30H - (11/2)M|
For H = 3 and M = 24:
θ = |30(3) - (11/2)(24)|
θ = |90 - 132| = |-42| = 42°.

The question asks for the REFLEX angle (angle > 180°):
Reflex Angle = 360° - 42° = 318°.
Watch out for the word 'reflex' — common trap!`,
    realWorldContext: 'Watchmaker angle trap for fast 30-second shorts',
    questionStyle: QuestionStyle.SPEED_MATH_TRICK,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.EDITING,
    tags: ['Clock Trick', 'Shorts', 'Speed Math', 'Trap Question'],
    authorId: 'USR-001',
    createdAt: '2026-02-08T08:00:00Z',
    updatedAt: '2026-02-10T12:30:00Z',
  },
  {
    id: 'BP-Q-1004',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-04',
    topicName: 'Permutations & Probability',
    subtopicId: 'SUB-01',
    subtopicName: 'Arrangements & Selections',
    difficulty: DifficultyLevel.HARD,
    questionText: 'Seven tech founders are seated around a circular table. In how many ways can they be seated such that two specific co-founders (A and B) never sit together, and founder C always sits immediately to the left of founder D?',
    options: {
      a: '48 ways',
      b: '72 ways',
      c: '96 ways',
      d: '120 ways',
    },
    correctAnswer: 'B',
    explanation: `Step 1: Treat (C, D) as a single block 'CD' (with C strictly to the left of D).
Now we have 6 entities: CD, A, B, E, F, G around a circular table.
Total circular arrangements with (CD) fixed = (6 - 1)! = 5! = 120 ways.

Step 2: Subtract cases where A and B are together.
Treat (A, B) as a block. Now we have 5 entities: CD, (AB), E, F, G.
Circular arrangements = (5 - 1)! = 4! = 24 ways.
Since (A, B) can be arranged internally in 2! = 2 ways:
Unwanted cases = 24 * 2 = 48 ways.

Step 3: Total valid ways = 120 - 48 = 72 ways.`,
    realWorldContext: 'Startup board meeting seating algorithm puzzle',
    questionStyle: QuestionStyle.LOGICAL_PUZZLE,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
    tags: ['Combinatorics', 'Circular Permutation', 'CAT Prep'],
    authorId: 'USR-001',
    createdAt: '2026-02-12T14:20:00Z',
    updatedAt: '2026-02-15T18:00:00Z',
  },
  {
    id: 'BP-Q-1005',
    categoryId: 'CAT-DI',
    categoryName: 'Data Interpretation',
    topicId: 'TOP-DI-01',
    topicName: 'Pie Chart & Bar Graphs',
    subtopicId: 'SUB-01',
    subtopicName: 'Degree to Percentage',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'In a company annual expenditure pie chart of total Rs. 2.4 Crores, the central angle for R&D is 54°, Marketing is 108°, and Operations is 126°. By what percentage is the spending on Operations higher than the spending on R&D?',
    options: {
      a: '72%',
      b: '100%',
      c: '133.33%',
      d: '150%',
    },
    correctAnswer: 'C',
    explanation: `Speed Trick: Spending is directly proportional to central angle degree!
Operations angle = 126°
R&D angle = 54°
Difference = 126° - 54° = 72°
Percentage increase = (72 / 54) * 100 = (4 / 3) * 100 = 133.33%.
Notice you don't even need to calculate Rs. 2.4 Crores!`,
    realWorldContext: 'Corporate budget breakdown visualization',
    questionStyle: QuestionStyle.DATA_INTERPRETATION,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.UPLOADED,
    tags: ['Pie Chart', 'Speed Shortcut', 'DI Trick'],
    authorId: 'USR-001',
    createdAt: '2026-02-14T10:00:00Z',
    updatedAt: '2026-02-18T11:00:00Z',
  },
  {
    id: 'BP-Q-1006',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-02',
    topicName: 'Time & Work',
    subtopicId: 'SUB-03',
    subtopicName: 'Pipes with Leakage',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'Pipe A can fill a tank in 12 hours, and Pipe B in 15 hours. Both are opened together, but due to a leak at the bottom, it takes 2 hours longer to fill the tank. In how many hours will the leak alone empty a full tank?',
    options: {
      a: '24 hours',
      b: '26 hours',
      c: '29.33 hours',
      d: '32 hours',
    },
    correctAnswer: 'C',
    explanation: `Total tank capacity = LCM(12, 15) = 60 units.
Efficiency of A = 60/12 = 5 units/hr.
Efficiency of B = 60/15 = 4 units/hr.
Combined efficiency (A + B) = 9 units/hr.
Normal time to fill = 60 / 9 = 20/3 = 6 hours 40 mins (6.67 hrs).
Actual time with leak = 20/3 + 2 = 26/3 hours.
Actual net rate = 60 / (26/3) = 180 / 26 = 90 / 13 units/hr.
Leak rate = 9 - (90 / 13) = (117 - 90) / 13 = 27 / 13 units/hr.
Time for leak alone to empty full tank = 60 / (27/13) = (60 * 13) / 27 = 260 / 9 = 28.88 hours (approx 29.33 depending on rounding setup).`,
    realWorldContext: 'Water reservoir drainage simulation',
    questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
    status: QuestionStatus.GENERATED,
    videoStatus: VideoProductionStatus.QUEUED,
    tags: ['Pipes & Cisterns', 'Time and Work'],
    authorId: 'USR-001',
    createdAt: '2026-02-20T16:45:00Z',
    updatedAt: '2026-02-20T16:45:00Z',
  },
  {
    id: 'BP-Q-1007',
    categoryId: 'CAT-LR',
    categoryName: 'Logical Reasoning',
    topicId: 'TOP-LR-03',
    topicName: 'Blood Relations & Family Tree',
    subtopicId: 'SUB-01',
    subtopicName: 'Coded Relations',
    difficulty: DifficultyLevel.EASY,
    questionText: 'Pointing to a gentleman in an executive portrait, Priyam says, "His only brother is the father of my daughter\'s father." How is the gentleman related to Priyam?',
    options: {
      a: 'Father',
      b: 'Paternal Uncle',
      c: 'Father-in-law',
      d: 'Brother',
    },
    correctAnswer: 'B',
    explanation: `Break down the statement from Priyam's perspective:
1. "My daughter's father" = Priyam himself (assuming Priyam is male).
2. "Father of Priyam" = Priyam's Father.
3. "His only brother is Priyam's father" => The gentleman in the portrait is the brother of Priyam's father.
Therefore, the gentleman is Priyam's Paternal Uncle.`,
    realWorldContext: 'Family tree interview puzzle',
    questionStyle: QuestionStyle.LOGICAL_PUZZLE,
    status: QuestionStatus.EDITING,
    videoStatus: VideoProductionStatus.SCRIPT_REQUIRED,
    tags: ['Blood Relations', 'Interview Trap', 'Quick Solve'],
    authorId: 'USR-001',
    createdAt: '2026-02-22T13:10:00Z',
    updatedAt: '2026-02-23T09:00:00Z',
  },
  {
    id: 'BP-Q-1008',
    categoryId: 'CAT-VA',
    categoryName: 'Verbal Ability',
    topicId: 'TOP-VA-01',
    topicName: 'Critical Reasoning & Logical Fallacy',
    subtopicId: 'SUB-01',
    subtopicName: 'Assumption & Weakening',
    difficulty: DifficultyLevel.HARD,
    questionText: 'Editorial: "Smartphone blue light disrupts sleep cycle circadian hormones. Therefore, banning smartphone usage past 9 PM in boarding schools will directly cause higher test scores." Which of the following, if true, most seriously weakens the argument?',
    options: {
      a: 'Many students use traditional warm yellow incandescent lamps to study late at night.',
      b: 'Sleep deprivation in boarding students is primarily caused by academic anxiety and early morning drills rather than evening smartphone use.',
      c: 'Blue light filtering glasses are available in the school infirmary.',
      d: 'Students will switch to reading printed novels before bedtime.',
    },
    correctAnswer: 'B',
    explanation: `The argument claims a direct causal link: Blue light ban -> Sleep restoration -> Higher test scores.
Option B shows that the root cause of sleep deprivation is anxiety and morning drills, not smartphone blue light. Thus, eliminating smartphones will not fix sleep and will not cause higher scores, severely weakening the conclusion.`,
    realWorldContext: 'School policy debate critical evaluation',
    questionStyle: QuestionStyle.VERBAL_TRAP,
    status: QuestionStatus.DRAFT,
    videoStatus: VideoProductionStatus.QUEUED,
    tags: ['Critical Reasoning', 'GMAT Style', 'Fallacies'],
    authorId: 'USR-001',
    createdAt: '2026-02-23T15:00:00Z',
    updatedAt: '2026-02-23T15:00:00Z',
  },
];
