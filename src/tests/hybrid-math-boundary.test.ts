import { questionValidationService } from '../lib/services/question-validation.service';
import { GeminiBlindVerifierProvider } from '../lib/ai/validators/blind-verifier';
import { MathematicalLogicalEngine } from '../lib/validation/mathematical-logical.engine';
import { ConsensusEngine } from '../lib/validation/consensus.engine';

async function runTests() {
  const qBase = {
    categoryId: "CAT-QA", topicId: "TOPIC-1", subtopicId: "SUBTOPIC-1",
    difficulty: "MEDIUM", challengeType: "ABCD", presentationType: "Text", language: "ENGLISH",
    explanation: "Simple explanation."
  };

  const oldVerify = MathematicalLogicalEngine.verify;
  const oldBlindVerify = GeminiBlindVerifierProvider.prototype.verifyBlindly;
  const oldConsensus = ConsensusEngine.evaluateProviders;

  // Mock consensus to bypass the actual LLM calls since we're just testing the math/AI layer boundary
  ConsensusEngine.evaluateProviders = async () => ({ hasConflict: false, evidence: [], checks: [] });

  let allPassed = true;
  function assert(actual: string, expected: string, name: string) {
    if (actual === expected) {
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} | Expected: ${expected}, Actual: ${actual}`);
      allPassed = false;
    }
  }

  console.log("=== Hybrid Boundary Tests ===");

  // Test 1: Deterministic Success -> VALID (Bypasses AI)
  MathematicalLogicalEngine.verify = () => ({ status: 'VERIFIED', problemType: 'Math', details: 'mock', calculatedValue: '10', matchedOption: 'A' } as any);
  let aiCalled = false;
  GeminiBlindVerifierProvider.prototype.verifyBlindly = async () => { aiCalled = true; return { solvable: true, isNumerical: true, expectedValue: "10", confidence: 0.9 }; };
  let res = await questionValidationService.validateCandidate({...qBase, questionText: "2+2=4", options: {a:"4",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "VALID", "1. Deterministic success -> FINAL VALID");
  assert(aiCalled ? "CALLED" : "NOT_CALLED", "NOT_CALLED", "   -> AI Bypassed for Deterministic Success (₹0 cost)");

  // Test 2: Deterministic Failure (Contradiction) -> INVALID
  MathematicalLogicalEngine.verify = () => ({ status: 'CONTRADICTORY', problemType: 'Math', details: 'mock', reason: 'mock', calculatedValue: '10' } as any);
  aiCalled = false;
  res = await questionValidationService.validateCandidate({...qBase, questionText: "2+2=5", options: {a:"5",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "INVALID", "2. Deterministic contradiction -> FINAL INVALID");

  // Test 3: Layer 3 NOT_DETERMINISTICALLY_VERIFIED + Layer 4 VERIFIED -> VALID
  MathematicalLogicalEngine.verify = () => ({ status: 'NOT_DETERMINISTICALLY_VERIFIED', details: 'complex' });
  GeminiBlindVerifierProvider.prototype.verifyBlindly = async () => ({ solvable: true, isNumerical: true, expectedValue: "4", confidence: 0.9 });
  res = await questionValidationService.validateCandidate({...qBase, questionText: "Complex math", options: {a:"4",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "VALID", "3. Layer 3 unverified + Layer 4 verified -> FINAL VALID");

  // Test 4: Layer 3 NOT_DETERMINISTICALLY_VERIFIED + Layer 4 UNVERIFIED -> NEEDS_REVIEW
  GeminiBlindVerifierProvider.prototype.verifyBlindly = async () => ({ solvable: false, isNumerical: true, expectedValue: undefined, confidence: 0.3, unverifiedReason: "Too complex" });
  res = await questionValidationService.validateCandidate({...qBase, questionText: "Complex math", options: {a:"4",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "NEEDS_REVIEW", "4. Layer 3 unverified + Layer 4 unverified -> FINAL NEEDS_REVIEW");

  // Test 5: Layer 3 NOT_DETERMINISTICALLY_VERIFIED + Layer 4 FAILED -> INVALID
  GeminiBlindVerifierProvider.prototype.verifyBlindly = async () => ({ solvable: true, isNumerical: true, expectedValue: "99", confidence: 0.9 });
  res = await questionValidationService.validateCandidate({...qBase, questionText: "Complex math", options: {a:"4",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "INVALID", "5. Layer 3 unverified + Layer 4 failed -> FINAL INVALID");

  // Test 6: Verifier unavailable/error -> NEEDS_REVIEW
  GeminiBlindVerifierProvider.prototype.verifyBlindly = async () => { throw new Error("Offline"); };
  res = await questionValidationService.validateCandidate({...qBase, questionText: "Complex math", options: {a:"4",b:"3",c:"2",d:"1"}, correctAnswer: "A"} as any, { skipTaxonomyLookup: true, providers: [{ id: 'gemini', priority: 1, maxRetries: 1 } as any] });
  assert(res.status, "NEEDS_REVIEW", "6. Verifier unavailable/error -> FINAL NEEDS_REVIEW");

  // Restore
  MathematicalLogicalEngine.verify = oldVerify;
  GeminiBlindVerifierProvider.prototype.verifyBlindly = oldBlindVerify;
  ConsensusEngine.evaluateProviders = oldConsensus;

  console.log("=== End of Tests ===");
  if (!allPassed) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
