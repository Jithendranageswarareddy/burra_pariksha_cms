const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);
let hasDefaultProvider = false;
let hasFallbackProviders = false;

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith('AI_DEFAULT_PROVIDER=')) {
    hasDefaultProvider = true;
    lines[i] = 'AI_DEFAULT_PROVIDER=gemini';
  }
  if (trimmed.startsWith('AI_FALLBACK_PROVIDERS=')) {
    hasFallbackProviders = true;
    lines[i] = 'AI_FALLBACK_PROVIDERS=groq';
  }
}

if (!hasDefaultProvider) {
  lines.push('AI_DEFAULT_PROVIDER=gemini');
}
if (!hasFallbackProviders) {
  lines.push('AI_FALLBACK_PROVIDERS=groq');
}

fs.writeFileSync(envPath, lines.join('\r\n'), 'utf8');
console.log(JSON.stringify({
  updatedDefaultProvider: true,
  updatedFallbackProviders: true,
  totalLines: lines.length
}, null, 2));
