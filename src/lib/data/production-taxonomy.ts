/**
 * BURRA PARIKSHA CMS — Production Taxonomy Seed Data
 *
 * Authoritative taxonomy definitions for aptitude categories, topics, and subtopics.
 * Seeded into Google Sheets during production database initialization.
 */

import { Category, Subtopic, Topic } from '../../types';

export const PRODUCTION_CATEGORIES: Category[] = [
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

export const PRODUCTION_TOPICS: Topic[] = [
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
    description: 'Work efficiency, pipes & cisterns, wages, and work equivalence',
    subtopicsCount: 3,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'TOP-QA-03',
    categoryId: 'CAT-QA',
    name: 'Profit, Loss & Discount',
    slug: 'profit-loss-discount',
    description: 'Marked price, successive discounts, false weights, and cheating dealer tricks',
    subtopicsCount: 4,
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'TOP-QA-04',
    categoryId: 'CAT-QA',
    name: 'Percentages & Ratios',
    slug: 'percentages-ratios',
    description: 'Percentage change, mixtures, proportions, and partnership shares',
    subtopicsCount: 3,
    createdAt: '2026-01-12T10:00:00Z',
  },
  // LR Topics
  {
    id: 'TOP-LR-01',
    categoryId: 'CAT-LR',
    name: 'Clocks & Calendars',
    slug: 'clocks-calendars',
    description: 'Angle between hands, faulty clocks, leap years, and odd days',
    subtopicsCount: 3,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'TOP-LR-02',
    categoryId: 'CAT-LR',
    name: 'Coding & Decoding',
    slug: 'coding-decoding',
    description: 'Letter shifting, number substitution, matrix codes, and conditional rules',
    subtopicsCount: 3,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'TOP-LR-03',
    categoryId: 'CAT-LR',
    name: 'Direction & Blood Relations',
    slug: 'direction-blood-relations',
    description: 'Shadow problems, complex family trees, and compass shifts',
    subtopicsCount: 3,
    createdAt: '2026-01-18T10:00:00Z',
  },
];

export const PRODUCTION_SUBTOPICS: Subtopic[] = [
  // Time, Speed & Distance
  {
    id: 'SUB-01',
    topicId: 'TOP-QA-01',
    name: 'Trains & Platform Crossing',
    slug: 'trains-platform-crossing',
    description: 'Length additions, relative speeds in opposite and same directions',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'SUB-02',
    topicId: 'TOP-QA-01',
    name: 'Escalators & Walking Speeds',
    slug: 'escalators-walking-speeds',
    description: 'Moving walkway problems, step counting, and reverse speed puzzles',
    createdAt: '2026-01-10T10:00:00Z',
  },
  // Profit, Loss
  {
    id: 'SUB-03',
    topicId: 'TOP-QA-03',
    name: 'Pipes with Leakage',
    slug: 'pipes-with-leakage',
    description: 'Inlet and outlet flow rates with bottom emptying leaks',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'SUB-04',
    topicId: 'TOP-QA-03',
    name: 'False Weights & Cheating Trader',
    slug: 'false-weights-cheating-trader',
    description: 'Discounts with altered gram balances and effective profit margins',
    createdAt: '2026-01-12T10:00:00Z',
  },
  // Clocks
  {
    id: 'SUB-05',
    topicId: 'TOP-LR-01',
    name: 'Reflex Angle Between Hands',
    slug: 'reflex-angle-between-hands',
    description: 'Exact degree formulas at arbitrary minutes and coincident hands',
    createdAt: '2026-01-15T10:00:00Z',
  },
];

// Aliases for compatibility with existing service initializers
export const MOCK_CATEGORIES = PRODUCTION_CATEGORIES;
export const MOCK_TOPICS = PRODUCTION_TOPICS;
export const MOCK_SUBTOPICS = PRODUCTION_SUBTOPICS;
