/**
 * BURRA PARIKSHA CMS - Taxonomy Mock Data
 */

import { Category, Subtopic, Topic } from '../../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'CAT-QA',
    name: 'Quantitative Aptitude',
    slug: 'quantitative-aptitude',
    description: 'Arithmetic, Algebra, Geometry, Numbers & Calculation Puzzles',
    colorCode: '#2563eb',
    topicsCount: 14,
    questionsCount: 42,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'CAT-LR',
    name: 'Logical Reasoning',
    slug: 'logical-reasoning',
    description: 'Puzzles, Coding-Decoding, Syllogisms, Direction & Blood Relations',
    colorCode: '#7c3aed',
    topicsCount: 12,
    questionsCount: 35,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'CAT-DI',
    name: 'Data Interpretation',
    slug: 'data-interpretation',
    description: 'Charts, Tables, Pie Diagrams, Caselets & Trend Analytics',
    colorCode: '#0891b2',
    topicsCount: 8,
    questionsCount: 19,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'CAT-VA',
    name: 'Verbal Ability',
    slug: 'verbal-ability',
    description: 'Vocabulary, Critical Reasoning, Sentence Correction & Reading Comprehension',
    colorCode: '#d97706',
    topicsCount: 10,
    questionsCount: 24,
    createdAt: '2026-01-20T10:00:00Z',
  },
];

export const MOCK_TOPICS: Topic[] = [
  // QA Topics
  {
    id: 'TOP-QA-01',
    categoryId: 'CAT-QA',
    name: 'Time, Speed & Distance',
    slug: 'time-speed-distance',
    description: 'Relative speed, trains, races, and average speed problems',
    subtopicsCount: 4,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'TOP-QA-02',
    categoryId: 'CAT-QA',
    name: 'Time & Work',
    slug: 'time-and-work',
    description: 'Efficiency ratios, pipes & cisterns, alternate work schedules',
    subtopicsCount: 3,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'TOP-QA-03',
    categoryId: 'CAT-QA',
    name: 'Profit, Loss & Discount',
    slug: 'profit-loss-discount',
    description: 'Marked price tricks, successive discounts, false weight scams',
    subtopicsCount: 4,
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'TOP-QA-04',
    categoryId: 'CAT-QA',
    name: 'Permutations & Probability',
    slug: 'permutations-probability',
    description: 'Arrangements, selections, conditional probability & dice problems',
    subtopicsCount: 4,
    createdAt: '2026-01-14T10:00:00Z',
  },
  // LR Topics
  {
    id: 'TOP-LR-01',
    categoryId: 'CAT-LR',
    name: 'Seating Arrangement',
    slug: 'seating-arrangement',
    description: 'Circular, linear & rectangular placement conditions',
    subtopicsCount: 3,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'TOP-LR-02',
    categoryId: 'CAT-LR',
    name: 'Clocks & Calendars',
    slug: 'clocks-and-calendars',
    description: 'Odd days, leap years, angle between clock hands, slow/fast clocks',
    subtopicsCount: 3,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'TOP-LR-03',
    categoryId: 'CAT-LR',
    name: 'Blood Relations & Family Tree',
    slug: 'blood-relations',
    description: 'Coded relations, pointing to photographs, multi-generation trees',
    subtopicsCount: 2,
    createdAt: '2026-01-18T10:00:00Z',
  },
  // DI Topics
  {
    id: 'TOP-DI-01',
    categoryId: 'CAT-DI',
    name: 'Pie Chart & Bar Graphs',
    slug: 'pie-charts-bar-graphs',
    description: 'Degree-to-percentage conversion and multi-company revenue analysis',
    subtopicsCount: 2,
    createdAt: '2026-01-15T10:00:00Z',
  },
];

export const MOCK_SUBTOPICS: Subtopic[] = [
  {
    id: 'SUB-01',
    topicId: 'TOP-QA-01',
    name: 'Trains & Moving Platforms',
    slug: 'trains-moving-platforms',
    notes: 'Classic aptitude question style for reel speed tricks',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'SUB-02',
    topicId: 'TOP-QA-01',
    name: 'Escalators & Walking Speeds',
    slug: 'escalators-walking-speeds',
    notes: 'High-engagement viral puzzle style',
    createdAt: '2026-01-11T10:00:00Z',
  },
  {
    id: 'SUB-03',
    topicId: 'TOP-QA-02',
    name: 'Pipes with Leakage',
    slug: 'pipes-leakage',
    notes: 'Common competitive exam trap',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'SUB-04',
    topicId: 'TOP-LR-02',
    name: 'Clock Angle Traps',
    slug: 'clock-angle-traps',
    notes: 'Short formula tricks: |30H - 11/2 M|',
    createdAt: '2026-01-15T10:00:00Z',
  },
];
