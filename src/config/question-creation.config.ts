/**
 * BURRA PARIKSHA CMS - Question Creation Engine Configuration
 * Single Source of Truth for creation dimensions across Manual and AI workflows.
 */

import { QuestionLanguage } from '../types';

export interface DifficultyConfig {
  id: string;
  label: string;
  levelNumber: number; // 1 to 10 scale for sorting
  description: string;
}

export interface RealLifeContextCategory {
  id: string;
  name: string;
  examples: string[];
}

export interface ChallengeTypeConfig {
  id: string;
  name: string;
  description: string;
  requiresOptions: boolean;
  minOptions: number;
  allowedAnswers: string[];
}

export interface PresentationTypeConfig {
  id: string;
  name: string;
  description: string;
  supportsVisualAsset: boolean;
}

export interface LanguageConfig {
  id: QuestionLanguage;
  name: string;
  nativeName: string;
}

/**
 * 1. DIFFICULTY LEVELS (11 intended levels including Random)
 */
export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { id: 'RANDOM', label: 'Random / Auto-Select', levelNumber: 0, description: 'Dynamically pick an appropriate difficulty' },
  { id: 'Beginner', label: 'Beginner', levelNumber: 1, description: 'Basic foundational concepts and direct applications' },
  { id: 'Easy', label: 'Easy', levelNumber: 2, description: 'Simple single-step calculations and clear scenarios' },
  { id: 'Easy-Intermediate', label: 'Easy-Intermediate', levelNumber: 3, description: 'Mild multi-step application with standard formulas' },
  { id: 'Intermediate', label: 'Intermediate', levelNumber: 4, description: 'Standard competitive exam difficulty' },
  { id: 'Intermediate-Hard', label: 'Intermediate-Hard', levelNumber: 5, description: 'Tricky scenarios requiring strong analytical reasoning' },
  { id: 'Hard', label: 'Hard', levelNumber: 6, description: 'Complex multi-layered problems with misdirection traps' },
  { id: 'Very Hard', label: 'Very Hard', levelNumber: 7, description: 'Advanced problem solving under tight time pressure' },
  { id: 'Expert', label: 'Expert', levelNumber: 8, description: 'Top 1% elite competitive exam challenges' },
  { id: 'Master', label: 'Master', levelNumber: 9, description: 'Deep conceptual probes requiring creative synthesis' },
  { id: 'Impossible', label: 'Impossible', levelNumber: 10, description: 'Mind-bending logic traps and extreme speed tests' },
];

/**
 * 2. REAL-LIFE CONTEXT CATALOG
 * Data-driven catalog of relatable contexts.
 */
export const REAL_LIFE_CONTEXTS: RealLifeContextCategory[] = [
  {
    id: 'SHOPPING',
    name: 'Shopping & E-commerce',
    examples: ['UPI festive sale discounts', 'E-commerce cart coupon stacking', 'Grocery supermarket bill calculation', 'Buy 2 Get 1 Free deal math'],
  },
  {
    id: 'MONEY_FINANCE',
    name: 'Money, Banking & Finance',
    examples: ['Fixed deposit vs mutual fund interest', 'Credit card bill EMI interest trap', 'Simple interest loan comparison', 'ATM withdrawal charges'],
  },
  {
    id: 'SALARY_INCOME',
    name: 'Salary, Taxes & Income',
    examples: ['Monthly salary in-hand vs CTC breakdown', 'Income tax slab calculation', 'Bonus distribution among team members', 'Overtime hourly rate computation'],
  },
  {
    id: 'TRAVEL_TRANSPORT',
    name: 'Travel, Metro & Transport',
    examples: ['Metro escalator commuter rush hour', 'Train overtaking on parallel tracks', 'Cab fare split with surge pricing', 'Flight time zone duration math'],
  },
  {
    id: 'WORKPLACE',
    name: 'Workplace & Career',
    examples: ['Software project deadline sprint allocation', 'Office cafeteria meal preference ratio', 'Shift rotation schedule math', 'Workplace efficiency & output rate'],
  },
  {
    id: 'COLLEGE_CAMPUS',
    name: 'College & Campus Life',
    examples: ['Semester GPA weighted average calculation', 'Campus placement aptitude cut-off percentile', 'Hostel mess fee distribution', 'Library book fine calculation'],
  },
  {
    id: 'DAILY_LIFE',
    name: 'Daily Life & Household',
    examples: ['Water tank leakage & dual pump refill', 'Electricity bill unit consumption calculation', 'Cooking recipe proportion scaling', 'Household monthly grocery budget'],
  },
  {
    id: 'AI_TECH',
    name: 'AI, Tech & Digital Devices',
    examples: ['Smartphone battery drain vs screen time', 'Cloud storage file upload speed', 'Social media algorithm engagement growth', 'EV charging station queue duration'],
  },
  {
    id: 'ONLINE_SAFETY',
    name: 'Online Safety & Cybersecurity',
    examples: ['Password strength entropy combinations', 'Phishing email link click probability', 'OTP countdown timer math', 'Data backup compression ratio'],
  },
  {
    id: 'SPORTS_FITNESS',
    name: 'Sports & Fitness',
    examples: ['Cricket run-rate chase in last 5 overs', 'Marathon runner pace & split time', 'Gym calorie burn vs protein shake intake', 'Badminton tournament knockout rounds'],
  },
  {
    id: 'FAMILY',
    name: 'Family & Relationships',
    examples: ['Family age gap puzzle', 'Inheritance asset split ratio', 'Family vacation budget planning', 'Monthly household expense sharing'],
  },
  {
    id: 'HEALTHCARE',
    name: 'Healthcare & Medicine',
    examples: ['Medicine dosage time interval schedule', 'Hospital bed occupancy rate', 'Calorie intake vs daily exercise burn', 'Pulse rate recovery period'],
  },
];

/**
 * 3. CHALLENGE TYPES
 */
export const CHALLENGE_TYPES: ChallengeTypeConfig[] = [
  {
    id: 'ABCD',
    name: 'ABCD / Multiple Choice',
    description: 'Standard 4-option multiple choice question with 1 single correct answer',
    requiresOptions: true,
    minOptions: 2,
    allowedAnswers: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'TRUE_FALSE',
    name: 'True / False',
    description: 'Statement evaluation where the user identifies whether a claim is True or False',
    requiresOptions: true,
    minOptions: 2,
    allowedAnswers: ['A', 'B'],
  },
  {
    id: 'YES_NO',
    name: 'Yes / No',
    description: 'Decision challenge determining if a given condition or scenario is possible',
    requiresOptions: true,
    minOptions: 2,
    allowedAnswers: ['A', 'B'],
  },
  {
    id: 'ARRANGE_ORDER',
    name: 'Arrange in Order',
    description: 'Sequence ordering challenge requiring options to be arranged in logical sequence',
    requiresOptions: true,
    minOptions: 2,
    allowedAnswers: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'INCORRECT',
    name: 'Find the Incorrect Statement',
    description: 'Reverse identification challenge where 3 statements are true and 1 is false/incorrect',
    requiresOptions: true,
    minOptions: 2,
    allowedAnswers: ['A', 'B', 'C', 'D'],
  },
];

/**
 * 4. PRESENTATION TYPES
 */
export const PRESENTATION_TYPES: PresentationTypeConfig[] = [
  { id: 'Text', name: 'Text Only', description: 'Pure text question without visual elements', supportsVisualAsset: false },
  { id: 'Image', name: 'Image', description: 'Question accompanied by an illustrative image', supportsVisualAsset: true },
  { id: 'Diagram', name: 'Diagram', description: 'Technical, geometric, or schematic diagram', supportsVisualAsset: true },
  { id: 'Chart', name: 'Chart', description: 'Pie chart, bar chart, or trend chart', supportsVisualAsset: true },
  { id: 'Graph', name: 'Graph', description: 'X-Y coordinate graph or function plot', supportsVisualAsset: true },
  { id: 'Table', name: 'Table', description: 'Structured tabular data matrix', supportsVisualAsset: false },
  { id: 'Map', name: 'Map', description: 'Geographical or spatial route map', supportsVisualAsset: true },
  { id: 'Sequence', name: 'Sequence', description: 'Step-by-step visual sequence', supportsVisualAsset: false },
  { id: 'Infographic', name: 'Infographic', description: 'Data-rich visual breakdown', supportsVisualAsset: true },
  { id: 'Real-world Photograph', name: 'Real-world Photograph', description: 'Authentic photo of a real scenario', supportsVisualAsset: true },
  { id: 'Illustration', name: 'Illustration', description: 'Custom vector illustration', supportsVisualAsset: true },
];

/**
 * 5. LANGUAGES
 */
export const LANGUAGES: LanguageConfig[] = [
  { id: QuestionLanguage.ENGLISH, name: 'English', nativeName: 'English' },
  { id: QuestionLanguage.TELUGU, name: 'Telugu', nativeName: 'తెలుగు' },
];

/**
 * Complete Question Creation Configuration Export
 */
export const QUESTION_CREATION_CONFIG = {
  difficulties: DIFFICULTY_LEVELS,
  realLifeContexts: REAL_LIFE_CONTEXTS,
  challengeTypes: CHALLENGE_TYPES,
  presentationTypes: PRESENTATION_TYPES,
  languages: LANGUAGES,
};
