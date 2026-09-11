// NO 'dotenv/config' import here!
// We strictly test Node's native --env-file=.env mechanism as used in npm run dev / npm start.

import { DEFAULT_AI_CONFIG, parseProviderList } from '../src/lib/ai/config';
import { aiProviderRegistry } from '../src/lib/ai/registry';
import { blindVerifierRegistry } from '../src/lib/ai/verifier/blind-verifier.registry';
import { geminiService } from '../src/lib/ai/gemini.service';
import '../src/lib/ai/providers'; // triggers registration
const geminiId = geminiService.providerId;

const resolution = aiProviderRegistry.resolveProviderChain();
const allProviders = aiProviderRegistry.listProviders();

const probeResult = {
  runtimeEnvLoaded: !!process.env.NODE_ENV || !!process.env.PORT,
  raw_AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER,
  raw_AI_FALLBACK_PROVIDERS: process.env.AI_FALLBACK_PROVIDERS,
  config_defaultProvider: DEFAULT_AI_CONFIG.defaultProvider,
  config_fallbackProviders: DEFAULT_AI_CONFIG.fallbackProviders,
  primaryId: resolution.primaryId,
  fallbackIds: resolution.fallbackIds,
  resolvedChain: resolution.resolvedChain,
  geminiFirst: resolution.resolvedChain[0] === 'gemini',
  groqSecond: resolution.resolvedChain[1] === 'groq',
  chainLength: resolution.resolvedChain.length,
  thirdProviderPresent: resolution.resolvedChain.length > 2,
  registeredProviders: allProviders,
  groqRegistered: aiProviderRegistry.getProvider('groq') !== undefined,
  groqConfigured: aiProviderRegistry.isProviderConfigured('groq'),
  geminiRegistered: aiProviderRegistry.getProvider('gemini') !== undefined,
  geminiConfigured: aiProviderRegistry.isProviderConfigured('gemini'),
  verifierDefaultId: blindVerifierRegistry.getDefaultProviderId(),
  blindVerifierRegistryUnchanged: blindVerifierRegistry.getDefaultProviderId() === 'gemini-blind-verifier' && aiProviderRegistry.getProvider('gemini-blind-verifier') === undefined,
};

console.log(JSON.stringify(probeResult, null, 2));
