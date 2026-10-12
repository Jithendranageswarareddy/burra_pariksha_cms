/**
 * BURRA PARIKSHA CMS - Question Creation Engine Configuration
 * Single Source of Truth for creation dimensions across AI Question Studio workflows.
 */

export interface DifficultyConfig {
  id: string;
  label: string;
  level: number;
}

export interface LanguageConfig {
  id: string;
  name: string;
  nativeName: string;
}

export interface ChallengeTypeConfig {
  id: string;
  name: string;
  description: string;
}

export interface PresentationTypeConfig {
  id: string;
  name: string;
  description: string;
}

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { id: 'EASY', label: 'Easy', level: 1 },
  { id: 'MEDIUM', label: 'Intermediate', level: 2 },
  { id: 'HARD', label: 'Hard', level: 3 },
  { id: 'BEGINNER', label: 'Beginner', level: 1 },
  { id: 'EASY-INTERMEDIATE', label: 'Easy-Intermediate', level: 1 },
  { id: 'INTERMEDIATE', label: 'Intermediate', level: 2 },
  { id: 'INTERMEDIATE-HARD', label: 'Intermediate-Hard', level: 2 },
  { id: 'VERY_HARD', label: 'Very Hard', level: 3 },
  { id: 'EXPERT', label: 'Expert', level: 3 },
  { id: 'MASTER', label: 'Master', level: 3 },
  { id: 'IMPOSSIBLE', label: 'Impossible', level: 3 },
];

export const LANGUAGES: LanguageConfig[] = [
  { id: 'TELUGU', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'ENGLISH', name: 'English', nativeName: 'English' },
  { id: 'BILINGUAL', name: 'Bilingual', nativeName: 'తెలుగు / English' },
];

export const CHALLENGE_TYPES: ChallengeTypeConfig[] = [
  { id: 'ABCD', name: 'Standard Multiple Choice (ABCD)', description: 'Classic four-option multiple choice' },
  { id: 'TRUE_FALSE', name: 'True / False', description: 'Binary evaluation' },
  { id: 'YES_NO', name: 'Yes / No', description: 'Binary confirmation' },
  { id: 'ODD_ONE_OUT', name: 'Odd One Out', description: 'Identification of non-matching element' },
  { id: 'ARRANGE', name: 'Sequential Arrangement', description: 'Ordering of events or elements' },
  { id: 'INCORRECT', name: 'Spot the Incorrect Statement', description: 'Identify factual discrepancy' },
];

export const PRESENTATION_TYPES: PresentationTypeConfig[] = [
  { id: 'TEXT_ONLY', name: 'Text Only', description: 'Plain text question' },
  { id: 'IMAGE_BASED', name: 'Image Based', description: 'Visual stimulus required' },
  { id: 'DIAGRAM_CHALLENGE', name: 'Diagram Challenge', description: 'Technical illustration' },
  { id: 'RIDDLE_SCENARIO', name: 'Riddle Scenario', description: 'Narrative enigma' },
];

export const REAL_LIFE_CONTEXTS = [
  'General',
  'Telangana Culture & Heritage',
  'Andhra Pradesh History & Landmarks',
  'Indian Daily Life & Household Science',
  'Puzzles & Folk Riddles',
  'Competitive Exam Edge Cases',
];

export const QUESTION_CREATION_CONFIG = {
  difficulties: DIFFICULTY_LEVELS,
  languages: LANGUAGES,
  challengeTypes: CHALLENGE_TYPES,
  presentationTypes: PRESENTATION_TYPES,
  realLifeContexts: REAL_LIFE_CONTEXTS,
};
