const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);
let hasDefaultProvider = false;
let defaultProviderVal = '';
let hasFallbackProviders = false;
let fallbackProvidersVal = '';

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('AI_DEFAULT_PROVIDER=')) {
    hasDefaultProvider = true;
    defaultProviderVal = trimmed.slice('AI_DEFAULT_PROVIDER='.length).trim();
  }
  if (trimmed.startsWith('AI_FALLBACK_PROVIDERS=')) {
    hasFallbackProviders = true;
    fallbackProvidersVal = trimmed.slice('AI_FALLBACK_PROVIDERS='.length).trim();
  }
}

console.log(JSON.stringify({
  hasDefaultProvider,
  defaultProviderVal,
  hasFallbackProviders,
  fallbackProvidersVal
}, null, 2));
