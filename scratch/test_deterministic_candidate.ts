import { CandidateDeterministicAdapter } from '../src/lib/ai/verifier/deterministic-adapter';
import { VerifierArbitrationEngine } from '../src/lib/ai/verifier/arbitration';

const candidate = {
  content: 'Ravi is late for his office in Hyderabad. He takes his bike and covers the first 10 km at a speed of 40 km/h, and the remaining 10 km at a speed of 25 km/h. What is his average speed for the whole journey?',
  option_a: '30 km/h',
  option_b: '32 km/h',
  option_c: '25 km/h',
  option_d: '35 km/h',
  correct_answer: 'B',
  explanation: 'Step 1: Calculate time for the first part: Time = Distance / Speed = 10 km / 40 ...'
};

const deterministicResult = CandidateDeterministicAdapter.verifyCandidate(candidate as any);
console.log('Deterministic Result:');
console.log(JSON.stringify(deterministicResult, null, 2));

const arbitrationResultWithoutVerifier = VerifierArbitrationEngine.arbitrate({
  candidate: candidate as any,
  candidateValidation: { isValid: true, errors: [], warnings: [] } as any,
  deterministicResult,
  verifierOutput: null,
  verifierError: 'No configured verifier providers available',
});

console.log('\nArbitration Result (with verifierOutput: null):');
console.log(JSON.stringify(arbitrationResultWithoutVerifier, null, 2));
