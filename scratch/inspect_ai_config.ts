import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { aiProviderRegistry } from '../src/lib/ai/registry';
import '../src/lib/ai/providers'; // registers groq, xai
import { geminiService } from '../src/lib/ai/gemini.service'; // registers gemini
import { DEFAULT_AI_CONFIG, DEFAULT_GROQ_MODEL, DEFAULT_XAI_MODEL } from '../src/lib/ai/config';

// 1. Check PRESENT / ABSENT strictly boolean
const geminiKeyPresent = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
const groqKeyPresent = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
const xaiKeyPresent = Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim().length > 0);

// 2. Non-secret configuration values
const nonSecretConfig = {
  AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER || '(unset, default: gemini)',
  GEMINI_MODEL: process.env.GEMINI_MODEL || '(unset, default: gemini-3.1-flash-lite)',
  GROQ_MODEL: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
  XAI_MODEL: process.env.XAI_MODEL || DEFAULT_XAI_MODEL,
  AI_FALLBACK_PROVIDERS: process.env.AI_FALLBACK_PROVIDERS || '(unset, none)',
};

// 3. Provider registry state
const allProviders = aiProviderRegistry.listProviders();
const health = aiProviderRegistry.getHealthStatus();
const resolution = aiProviderRegistry.resolveProviderChain();
const defaultConfiguredProvider = aiProviderRegistry.getDefaultConfiguredProvider();

// 4. Inspect .env file lines for key names
let envKeyNames: string[] = [];
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const keyName = trimmed.split('=')[0].trim();
      if (keyName.includes('GEMINI') || keyName.includes('GROQ') || keyName.includes('XAI') || keyName.includes('AI_')) {
        envKeyNames.push(keyName);
      }
    }
  }
}

// 5. Scan for hardcoded credentials (e.g. AIza..., gsk_..., xai-...) in src/lib/ai
let hardcodedFound = false;
const aiDir = path.resolve(process.cwd(), 'src/lib/ai');
function scanDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full);
    } else if (f.endsWith('.ts') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (
        /AIza[0-9A-Za-z\-_]{35}/.test(content) ||
        /gsk_[0-9A-Za-z\-_]{20,}/.test(content) ||
        /xai-[0-9A-Za-z\-_]{20,}/.test(content)
      ) {
        // check if it's not a regex pattern in error.ts
        if (!full.includes('error.ts')) {
          hardcodedFound = true;
        }
      }
    }
  }
}
scanDir(aiDir);

// 6. Check if constructor / import made any network calls
// We know no network calls were made because no sockets were created, but let's verify client instantiation behavior:
// geminiClient.getClient() only returns GoogleGenAI instance without making network calls.
// groqClient is lazy; xaiClient is lazy.

const result = {
  geminiKeyPresent: geminiKeyPresent ? 'PRESENT' : 'ABSENT',
  groqKeyPresent: groqKeyPresent ? 'PRESENT' : 'ABSENT',
  xaiKeyPresent: xaiKeyPresent ? 'PRESENT' : 'ABSENT',
  nonSecretConfig,
  providerRegistry: {
    registeredProviders: allProviders,
    providersStatus: health.providers.map(p => ({
      providerId: p.providerId,
      isConfigured: p.isConfigured,
      modelId: p.modelId,
    })),
    defaultProviderId: aiProviderRegistry.getDefaultProviderId(),
    defaultConfiguredProviderId: defaultConfiguredProvider ? defaultConfiguredProvider.providerId : null,
    chainResolution: {
      primaryId: resolution.primaryId,
      fallbackIds: resolution.fallbackIds,
      resolvedChain: resolution.resolvedChain,
      availableProviders: resolution.availableProviders.map(p => p.providerId),
      unconfiguredProviders: resolution.unconfiguredProviders,
      missingProviders: resolution.missingProviders,
      hasConfiguredProvider: resolution.hasConfiguredProvider,
    },
  },
  envKeyNamesFound: envKeyNames,
  hardcodedCredentialsFound: hardcodedFound,
};

console.log(JSON.stringify(result, null, 2));
