import { GROQ_QUESTION_CANDIDATE_SCHEMA } from '../src/lib/ai/providers/groq.service';
import { QuestionCandidateZodSchema } from '../src/lib/ai/schemas/question-candidate.schema';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`[FAIL] ${msg}`);
}

let testCount = 0;

console.log('Running focused strict JSON Schema verification...');

// 1. Schema type
assert(GROQ_QUESTION_CANDIDATE_SCHEMA.type === 'object', 'type must be object');
testCount++;

// 2. additionalProperties === false
assert(GROQ_QUESTION_CANDIDATE_SCHEMA.additionalProperties === false, 'additionalProperties must be false');
testCount++;

// 3. Properties check
const properties = GROQ_QUESTION_CANDIDATE_SCHEMA.properties;
const propertyKeys = Object.keys(properties);
assert(propertyKeys.length === 11, `Expected exactly 11 properties, found ${propertyKeys.length}`);
testCount++;

// 4. Required check: every key in properties must appear in required
const required = GROQ_QUESTION_CANDIDATE_SCHEMA.required;
assert(Array.isArray(required), 'required must be an array');
testCount++;

assert(required.length === propertyKeys.length, `required length (${required.length}) must match property count (${propertyKeys.length})`);
testCount++;

for (const prop of propertyKeys) {
  assert(required.includes(prop), `Property "${prop}" must be present in required array`);
  testCount++;
}

// 5. Specific check for the two previously missing fields
assert(required.includes('question_style'), 'question_style must be in required');
testCount++;
assert(required.includes('real_world_context'), 'real_world_context must be in required');
testCount++;

// 6. Verify canonical QuestionCandidateZodSchema parses the object generated under this schema
const mockGenerated = {
  content: 'If 25% of a number is 50, what is 40% of the same number?',
  option_a: '80',
  option_b: '75',
  option_c: '90',
  option_d: '85',
  correct_answer: 'A',
  explanation: 'Let the number be x. 0.25x = 50 => x = 200. 40% of 200 = 0.40 * 200 = 80. Burra Trick: 40% is (40/25) * 50 = 1.6 * 50 = 80.',
  difficulty: 'EASY',
  language: 'ENGLISH',
  real_world_context: 'Basic percentage scaling',
  question_style: 'Real-World Scenario'
};

const zodParsed = QuestionCandidateZodSchema.safeParse(mockGenerated);
assert(zodParsed.success === true, 'QuestionCandidateZodSchema must successfully validate candidate generated under strict schema');
testCount++;

console.log(`Focused schema verification passed: ${testCount}/${testCount} assertions passed.`);
