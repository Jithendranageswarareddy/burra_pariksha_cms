import 'dotenv/config';
import { DEFAULT_AI_CONFIG, parseProviderList } from '../src/lib/ai/config';
import { aiProviderRegistry } from '../src/lib/ai/registry';
import { blindVerifierRegistry } from '../src/lib/ai/verifier/blind-verifier.registry';
import '../src/lib/ai/providers'; // triggers registration

// Check raw environment variables
const envDefault = process.env.AI_DEFAULT_PROVIDER;
const envFallbacks = process.env.AI_FALLBACK_PROVIDERS;

// Resolve chain
const resolution = aiProviderRegistry.resolveProviderChain();

// Verifier registry check
const registeredVerifiers = blindVerifierRegistry.listProviders?.() || [blindVerifierRegistry.getDefaultProviderId()];

const report = {
  AI_DEFAULT_PROVIDER: envDefault,
  AI_FALLBACK_PROVIDERS: envFallbacks,
  parsedDefaultProvider: DEFAULT_AI_CONFIG.defaultProvider,
  parsedFallbackProviders: parseProviderList(envFallbacks),
  primaryId: resolution.primaryId,
  fallbackIds: resolution.fallbackIds,
  resolvedChain: resolution.resolvedChain,
  geminiPrimary: resolution.resolvedChain[0] === 'gemini',
  groqSecondary: resolution.resolvedChain[1] === 'groq',
  chainLength: resolution.resolvedChain.length,
  thirdProviderPresent: resolution.resolvedChain.length > 2,
  groqIsRegistered: (aiProviderRegistry as any).isProviderRegistered?.('groq') ?? (aiProviderRegistry.getProvider('groq') !== undefined),
  groqIsConfigured: aiProviderRegistry.isProviderConfigured('groq'),
  verifierRegistryDefault: blindVerifierRegistry.getDefaultProviderId(),
  verifierRegistryUnchanged: blindVerifierRegistry.getDefaultProviderId() === 'gemini-blind-verifier' && !registeredVerifiers.includes('groq'),
};

console.log(JSON.stringify(report, null, 2));
