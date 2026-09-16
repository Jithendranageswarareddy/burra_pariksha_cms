
import * as assert from 'assert';
import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { Question, QuestionValidationStatus } from '../types';
import { geminiClient } from '../lib/ai/gemini.client';
import { SemanticReasoningProvider } from '../lib/ai/validators/semantic-reasoning.provider';
import { GeminiBlindVerifierProvider } from '../lib/ai/validators/blind-verifier';

const baseQuestion: any = {
  id: 'TEST-Q-01',
  topicId: 'T1',
  topicName: 'Math',
  subtopicId: 'S1',
  subtopicName: 'Arithmetic',
  difficulty: 'EASY',
  language: 'ENGLISH'
};

const cases = [
  {
    id: "A",
    desc: "Deterministic PROVABLY_VALID → Blind AI NO, Semantic AI NO, VALID",
    question: {
      ...baseQuestion,
      questionText: "What is 5 * 5?",
      options: { a: "25", b: "30", c: "35", d: "40" },
      correctAnswer: "A",
      explanation: "Five times five is twenty-five, making it A."
    }
  },
  {
    id: "B",
    desc: "Deterministic CONTRADICTORY → Blind AI NO, Semantic AI NO, INVALID",
    question: {
      ...baseQuestion,
      questionText: "What is 5 * 5?",
      options: { a: "25", b: "30", c: "35", d: "40" },
      correctAnswer: "B", 
      explanation: "Wait actually five times five is twenty-five so it is A, but I will say B is correct."
    }
  },
  {
    id: "C",
    desc: "Deterministic UNVERIFIED + Blind AI VERIFIED → Blind AI YES",
    question: {
      ...baseQuestion,
      questionText: "A train running at 60 km/h crosses a pole in 9 seconds. What is the length of the train?",
      options: { a: "120 meters", b: "150 meters", c: "180 meters", d: "200 meters" },
      correctAnswer: "B",
      explanation: "Speed is 60 * (5/18) = 50/3 m/s. Therefore the length is (50/3) * 9 = 150 meters."
    },
    mockBlindStatus: 'VERIFIED'
  },
  {
    id: "D",
    desc: "Semantic INVALID → NEEDS_REVIEW",
    question: {
      ...baseQuestion,
      questionText: "Who is the best player?",
      options: { a: "Player A", b: "Player B", c: "Player C", d: "Player D" },
      correctAnswer: "B",
      explanation: "It is B because I like B."
    },
    mockSemanticInvalid: true
  },
  {
    id: "E",
    desc: "AI unavailable → NEEDS_REVIEW",
    question: {
      ...baseQuestion,
      questionText: "What is the capital of France?",
      options: { a: "Paris", b: "London", c: "Berlin", d: "Madrid" },
      correctAnswer: "A",
      explanation: "Paris is the capital of France."
    },
    mockUnavailable: true
  },
  {
    id: "F",
    desc: "Ambiguity → NEEDS_REVIEW",
    question: {
      ...baseQuestion,
      questionText: "What color is a ball?",
      options: { a: "Red", b: "Blue", c: "Green", d: "Yellow" },
      correctAnswer: "A",
      explanation: "Some balls are red."
    },
    mockSemanticAmbiguous: true
  },
  {
    id: "G",
    desc: "Valid Telugu aptitude question → correct cascade behavior",
    question: {
      ...baseQuestion,
      questionText: "ఒక వస్తువును 200 రూపాయలకు కొని 250 రూపాయలకు అమ్మితే లాభ శాతం ఎంత?",
      language: "TELUGU",
      options: { a: "20%", b: "25%", c: "30%", d: "35%" },
      correctAnswer: "B",
      explanation: "లాభం = 50. శాతం = (50/200)*100 = 25%. కావున B సరైనది."
    },
    mockBlindStatus: 'VERIFIED'
  },
  {
    id: "H",
    desc: "Wrong explanation → NEEDS_REVIEW",
    question: {
      ...baseQuestion,
      questionText: "What is the capital of India?",
      options: { a: "New Delhi", b: "Mumbai", c: "Kolkata", d: "Chennai" },
      correctAnswer: "A",
      explanation: "Because New Delhi starts with N, which is my favorite letter, making it the capital."
    },
    mockSemanticInvalid: true
  }
];

async function runTests() {
  console.log("=== Integration Tests: Short-Circuit Logic ===\n");
  
  const originalSemanticValidate = SemanticReasoningProvider.prototype.validate;
  const originalBlindVerify = GeminiBlindVerifierProvider.prototype.verifyBlindly;
  
  let failures = 0;

  for (const c of cases) {
    console.log(`\n--- Case ${c.id}: ${c.desc} ---`);
    
    let semanticCount = 0;
    let blindCount = 0;
    
    let oldIsConfigured = geminiClient.isConfigured;
    if (c.mockUnavailable) {
      geminiClient.isConfigured = () => false;
    }
    
    SemanticReasoningProvider.prototype.validate = async (q): Promise<any> => {
      semanticCount++;
      if (c.mockUnavailable) {
         return {
            providerId: 'semantic-reasoning-verifier',
            modelId: 'test-model',
            verdict: 'NEEDS_REVIEW',
            confidence: 0,
            reasoningSummary: 'Semantic verifier unavailable.',
            detectedIssues: ['PROVIDER_UNAVAILABLE'],
            timestamp: new Date().toISOString()
         };
      }
      if (c.mockSemanticInvalid) {
        return {
          providerId: 'semantic-reasoning-verifier',
          modelId: 'test-model',
          verdict: 'INVALID',
          confidence: 0.9,
          reasoningSummary: 'Semantic reasoning marked this INVALID for test.',
          detectedIssues: ['ILLOGICAL_CONCLUSION'],
          timestamp: new Date().toISOString()
        };
      } else if (c.mockSemanticAmbiguous) {
        return {
          providerId: 'semantic-reasoning-verifier',
          modelId: 'test-model',
          verdict: 'NEEDS_REVIEW',
          confidence: 0.5,
          reasoningSummary: 'Question is ambiguous.',
          detectedIssues: ['AMBIGUOUS_PHRASING'],
          timestamp: new Date().toISOString()
        };
      }
      return {
        providerId: 'semantic-reasoning-verifier',
        modelId: 'test-model',
        verdict: 'VALID',
        confidence: 0.99,
        reasoningSummary: 'Mocked as VALID.',
        detectedIssues: [],
        timestamp: new Date().toISOString()
      };
    };

    GeminiBlindVerifierProvider.prototype.verifyBlindly = async (input): Promise<any> => {
      blindCount++;
      if (c.mockUnavailable) {
         throw new Error("API Offline");
      }
      
      let expectedValue = undefined;
      if (c.mockBlindStatus === 'VERIFIED') {
         expectedValue = c.question.options[c.question.correctAnswer.toLowerCase() as keyof typeof c.question.options];
         const numStr = expectedValue.match(/-?\d+(?:\.\d+)?/);
         expectedValue = numStr ? numStr[0] : expectedValue;
      }

      return {
        solvable: true,
        isNumerical: true,
        expectedValue: expectedValue || "999999",
        confidence: 0.9,
        solutionDerivation: ['mock derivation']
      };
    };

    try {
      const result = await QuestionValidationEngine.validate(c.question, { skipTaxonomyLookup: true, providers: [new SemanticReasoningProvider()] });
      
      console.log(`- Blind AI invocations: ${blindCount}`);
      console.log(`- Semantic AI invocations: ${semanticCount}`);
      console.log(`- Final status: ${result.status}`);
      
      if (c.id === 'A') {
        assert.strictEqual(blindCount, 0, 'Blind count should be 0');
        assert.strictEqual(semanticCount, 0, 'Semantic count should be 0');
        assert.strictEqual(result.status, QuestionValidationStatus.VALID, 'Final status should be VALID');
      } else if (c.id === 'B') {
        assert.strictEqual(blindCount, 0, 'Blind count should be 0');
        assert.strictEqual(semanticCount, 0, 'Semantic count should be 0');
        assert.strictEqual(result.status, QuestionValidationStatus.INVALID, 'Final status should be INVALID');
      } else if (c.id === 'C') {
        assert.strictEqual(blindCount, 1, 'Blind count should be 1');
        assert.strictEqual(result.status, QuestionValidationStatus.VALID, 'Final status should be VALID');
      } else if (c.id === 'D') {
        assert.strictEqual(semanticCount, 1, 'Semantic count should be 1');
        assert.strictEqual(result.status, QuestionValidationStatus.NEEDS_REVIEW, 'Final status should be NEEDS_REVIEW');
      } else if (c.id === 'E') {
        assert.strictEqual(result.status, QuestionValidationStatus.NEEDS_REVIEW, 'Final status should be NEEDS_REVIEW');
      } else if (c.id === 'F') {
        assert.strictEqual(semanticCount, 1, 'Semantic count should be 1');
        assert.strictEqual(result.status, QuestionValidationStatus.NEEDS_REVIEW, 'Final status should be NEEDS_REVIEW');
      } else if (c.id === 'G') {
        assert.strictEqual(blindCount, 1, 'Blind count should be 1');
        assert.strictEqual(result.status, QuestionValidationStatus.VALID, 'Final status should be VALID');
      } else if (c.id === 'H') {
        assert.strictEqual(semanticCount, 1, 'Semantic count should be 1');
        assert.strictEqual(result.status, QuestionValidationStatus.NEEDS_REVIEW, 'Final status should be NEEDS_REVIEW');
      }
      console.log("-> Assertions PASSED.");
    } catch(e) {
      console.error(`-> Error in case ${c.id}:`, e);
      failures++;
    } finally {
      geminiClient.isConfigured = oldIsConfigured;
      SemanticReasoningProvider.prototype.validate = originalSemanticValidate;
      GeminiBlindVerifierProvider.prototype.verifyBlindly = originalBlindVerify;
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} test cases failed.`);
    process.exit(1);
  } else {
    console.log("\nAll test cases passed successfully.");
  }
}

runTests().catch(console.error);
