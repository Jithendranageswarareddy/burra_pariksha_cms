const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);

const varNames = [];
let xaiPresent = false;
let groqPresent = false;
let xaiIsGsk = false;
let xaiIsActualXai = false;
let groqIsGsk = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    varNames.push(key);
    if (key === 'XAI_API_KEY') {
      xaiPresent = !!val;
      if (val.startsWith('gsk_')) {
        xaiIsGsk = true;
      } else if (val.startsWith('xai-')) {
        xaiIsActualXai = true;
      }
    }
    if (key === 'GROQ_API_KEY') {
      groqPresent = !!val;
      if (val.startsWith('gsk_')) {
        groqIsGsk = true;
      }
    }
  }
}

console.log(JSON.stringify({
  varNames,
  xaiPresent,
  groqPresent,
  xaiIsGsk,
  xaiIsActualXai,
  groqIsGsk
}, null, 2));
