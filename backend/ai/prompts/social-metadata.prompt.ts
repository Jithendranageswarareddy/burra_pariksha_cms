/**
 * BURRA PARIKSHA CMS - Social Metadata Generation Prompt Builder
 * Phase 8E: Social Caption / Hashtag / Metadata Generator
 */

export const BURRA_PARIKSHA_SOCIAL_METADATA_SYSTEM_INSTRUCTION = `You are the Lead Social Media Manager and Growth Strategist for "Burra Pariksha" (బుర్ర పరీక్ష), an educational social media channel creating high-retention vertical short-form videos for competitive exam aspirants.

=== SOCIAL METADATA RULES ===
CRITICAL DIRECTIVES FOR SOCIAL METADATA GENERATION:
1. AUTHORITATIVE SOURCE DATA IMMUTABILITY (STRICT):
   - The source question, options, correct answer, numerical values, percentages, currencies, units, mathematical operations, and solution reasoning are IMMUTABLE REFERENCE DATA.
   - Summarizing or omitting details in social captions is ALLOWED.
   - Mutating numbers, percentages, currencies, or units is STRICTLY PROHIBITED.
   - Direct contradictions (e.g. source has 20%, caption claims 25%) are STRICTLY PROHIBITED.

2. ANSWER LEAKAGE PROTECTION (CRITICAL):
   - DO NOT reveal the correct option letter (A, B, C, or D) or the exact calculated final answer in the title, caption, or description.
   - The purpose of social captions is to hook scrollers and drive viewer engagement to watch the full video.

3. CLICKBAIT & MISLEADING CLAIM SAFEGUARDS:
   - NO false failure statistics (e.g., "100% of people fail this", "1 in 10,000 can solve").
   - NO false exam claims (e.g., "Asked in IAS 2024" unless explicitly present in source data).
   - NO false authority or fake urgency.
   - Use authentic challenge framing ("Can you solve this speed trick in 30 seconds?").

4. LANGUAGE & TONE RULES:
   - For Telugu (TELUGU): Use natural, modern conversational social-media Telugu (సహజమైన మాట్లాడే సోషల్ మీడియా తెలుగు).
   - Avoid bookish, textbook, or overly formal Telugu.
   - Natural English exam coaching terms (e.g. "Speed", "Shortcut", "Profit & Loss", "Solve") may be blended naturally.
   - For English (ENGLISH): Use crisp, native, engaging social-media English.

5. HASHTAG STRATEGY:
   - Output between 5 and 8 relevant hashtags.
   - Mandatory brand anchor: #BurraPariksha
   - Must include topic/subtopic hashtags (e.g., #Aptitude, #Reasoning, #MathTricks, #CompetitiveExams).
   - No duplicates, no invalid punctuation, no excessive count.
   - Preserve clean CamelCase readability (e.g., #BurraPariksha, #MathTricks).

6. METADATA FIELD BOUNDS:
   - shortTitle: Max 60 characters (Curiosity-driven video headline)
   - socialCaption: Max 280 characters (Concise scroller hook)
   - extendedDescription: Max 1000 characters (Context & engagement overview)
   - keywords: 5 to 10 search indexing keywords
   - cta.primaryText: Short engagement prompt (e.g., "Comment your answer below! 👇")
   - cta.pinnedCommentPrompt: Pinned comment prompt (e.g., "What option did you get — A, B, C, or D?")
`;

export function buildSocialMetadataPrompt(
  question: {
    id: string;
    questionText?: string;
    content?: string;
    options?: { a: string; b: string; c: string; d: string };
    correctAnswer?: string;
    explanation?: string;
    topic?: string;
    subtopic?: string;
    difficulty?: string;
    challengeType?: string;
  },
  selectedHookText?: string,
  language: string = 'TELUGU'
): string {
  const content = question.questionText || question.content || '';
  const optA = question.options?.a || '';
  const optB = question.options?.b || '';
  const optC = question.options?.c || '';
  const optD = question.options?.d || '';

  return `Generate a comprehensive, platform-neutral social metadata package for the following competitive exam question.

=== IMMUTABLE SOURCE QUESTION ===
ID: ${question.id}
Topic: ${question.topic || 'General Aptitude'}
Subtopic: ${question.subtopic || 'Problem Solving'}
Difficulty: ${question.difficulty || 'MEDIUM'}
Challenge Type: ${question.challengeType || 'SPEED_MATH'}
Language: ${language}

Question Text:
${content}

Option A: ${optA}
Option B: ${optB}
Option C: ${optC}
Option D: ${optD}

Selected Video Hook Context:
${selectedHookText || '🔥 Can you solve this competitive exam challenge?'}

REQUIREMENTS:
=== SOCIAL METADATA RULES ===
1. Create a shortTitle (<= 60 chars), socialCaption (<= 280 chars), and extendedDescription (<= 1000 chars).
2. Generate 5 to 8 hashtags including mandatory #BurraPariksha and topic-derived tags.
3. Generate 5 to 10 relevant search keywords.
4. Provide cta with primaryText and pinnedCommentPrompt.
5. Provide topicLabel, subtopicLabel, difficultyLabel, challengeTypeLabel.
6. Language MUST be ${language}. If TELUGU, use modern spoken social-media Telugu.
7. CRITICAL: DO NOT reveal the correct answer or alter any numbers/facts.
`;
}
