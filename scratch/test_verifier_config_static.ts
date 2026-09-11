import assert from 'assert';
import { DEFAULT_AI_CONFIG } from '../src/lib/ai/config';
import { geminiBlindVerifier, GeminiBlindVerifierProvider } from '../src/lib/ai/verifier/gemini-blind-verifier';
import { blindVerifierRegistry } from '../src/lib/ai/verifier/blind-verifier.registry';

console.log('=== VERIFIER MODEL CONFIGURATION STATIC TEST ===\n');

// Test 1: Canonical DEFAULT_AI_CONFIG defaultModel resolves to gemini-3.1-flash-lite
console.log('Test 1: DEFAULT_AI_CONFIG.defaultModel resolution');
console.log(`  Expected: 'gemini-3.1-flash-lite'`);
console.log(`  Actual:   '${DEFAULT_AI_CONFIG.defaultModel}'`);
assert.strictEqual(
  DEFAULT_AI_CONFIG.defaultModel,
  'gemini-3.1-flash-lite',
  'DEFAULT_AI_CONFIG.defaultModel must resolve to gemini-3.1-flash-lite'
);
console.log('  -> PASS\n');

// Test 2: Singleton geminiBlindVerifier resolves modelId from DEFAULT_AI_CONFIG.defaultModel
console.log('Test 2: geminiBlindVerifier singleton modelId');
console.log(`  Expected: '${DEFAULT_AI_CONFIG.defaultModel}'`);
console.log(`  Actual:   '${geminiBlindVerifier.modelId}'`);
assert.strictEqual(
  geminiBlindVerifier.modelId,
  DEFAULT_AI_CONFIG.defaultModel,
  'geminiBlindVerifier.modelId must match DEFAULT_AI_CONFIG.defaultModel'
);
console.log('  -> PASS\n');

// Test 3: blindVerifierRegistry default provider modelId matches canonical configuration
console.log('Test 3: blindVerifierRegistry.getDefaultProvider().modelId');
const regProvider = blindVerifierRegistry.getDefaultProvider();
console.log(`  Expected: '${DEFAULT_AI_CONFIG.defaultModel}'`);
console.log(`  Actual:   '${regProvider.modelId}'`);
assert.strictEqual(
  regProvider.modelId,
  DEFAULT_AI_CONFIG.defaultModel,
  'blindVerifierRegistry default provider modelId must match DEFAULT_AI_CONFIG.defaultModel'
);
console.log('  -> PASS\n');

// Test 4: Default constructor without args resolves to DEFAULT_AI_CONFIG.defaultModel
console.log('Test 4: GeminiBlindVerifierProvider default constructor');
const newInstance = new GeminiBlindVerifierProvider();
assert.strictEqual(
  newInstance.modelId,
  DEFAULT_AI_CONFIG.defaultModel,
  'New instance without args must default to DEFAULT_AI_CONFIG.defaultModel'
);
console.log(`  Instance modelId: '${newInstance.modelId}' -> PASS\n`);

// Test 5: Constructor with custom modelId override honors custom parameter
console.log('Test 5: GeminiBlindVerifierProvider explicit modelId override');
const customInstance = new GeminiBlindVerifierProvider('gemini-test-custom');
assert.strictEqual(
  customInstance.modelId,
  'gemini-test-custom',
  'Custom instance must preserve explicit modelId override'
);
console.log(`  Custom modelId: '${customInstance.modelId}' -> PASS\n`);

// Test 6: Stale hardcoded model 'gemini-3.8-flash' is completely absent
console.log('Test 6: Verify gemini-3.8-flash is NOT present in allowedGeminiModels');
assert.strictEqual(
  DEFAULT_AI_CONFIG.allowedGeminiModels.includes('gemini-3.8-flash'),
  false,
  'allowedGeminiModels must not contain stale gemini-3.8-flash'
);
console.log('  -> PASS\n');

console.log('=== ALL 6 CONFIGURATION TESTS PASSED ===');
