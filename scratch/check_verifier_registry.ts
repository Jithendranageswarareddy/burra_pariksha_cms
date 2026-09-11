import '../src/lib/ai/providers';
import { blindVerifierRegistry } from '../src/lib/ai/verifier/blind-verifier.registry';
import { DEFAULT_AI_CONFIG } from '../src/lib/ai/config';
import { geminiBlindVerifier } from '../src/lib/ai/verifier/gemini-blind-verifier';

console.log('Default Verifier Provider ID:', blindVerifierRegistry.getDefaultProviderId());
console.log('Registered Verifiers:', blindVerifierRegistry.listProviders());
console.log('Health Status:', JSON.stringify(blindVerifierRegistry.getHealthStatus(), null, 2));
console.log('DEFAULT_AI_CONFIG:', {
  defaultVerifierProvider: DEFAULT_AI_CONFIG.defaultVerifierProvider,
  fallbackVerifierProviders: DEFAULT_AI_CONFIG.fallbackVerifierProviders,
});

const defaultProvider = blindVerifierRegistry.getProvider();
console.log('Default provider instance providerId:', defaultProvider?.providerId);
console.log('Default provider instance modelId:', defaultProvider?.modelId);
console.log('Default provider instance isConfigured:', defaultProvider?.isConfigured());
