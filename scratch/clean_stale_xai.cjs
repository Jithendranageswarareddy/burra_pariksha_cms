const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);
let foundXai = false;
let xaiWasGsk = false;
const newLines = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('XAI_API_KEY=')) {
    foundXai = true;
    const val = trimmed.slice('XAI_API_KEY='.length).trim();
    if (val.startsWith('gsk_')) {
      xaiWasGsk = true;
      // Skip this line (remove it)
      continue;
    }
  }
  newLines.push(line);
}

console.log(JSON.stringify({
  foundXai,
  xaiWasGsk,
  originalLineCount: lines.length,
  newLineCount: newLines.length
}, null, 2));

if (foundXai && xaiWasGsk) {
  // Write back cleanly with same line endings
  fs.writeFileSync(envPath, newLines.join('\r\n'), 'utf8');
  console.log("Successfully removed stale XAI_API_KEY from .env");
} else {
  console.log("Did not remove: conditions not met");
}
