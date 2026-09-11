const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\jithendra\\.gemini\\antigravity-ide\\brain\\24f55ff5-e763-4b67-992b-31ce5c8b24ab\\.system_generated\\logs\\transcript_full.jsonl';
if (!fs.existsSync(transcriptPath)) {
  console.log('File not found');
  process.exit(1);
}

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 11355 && obj.step_index <= 11362) {
      console.log(`=== STEP ${obj.step_index} (${obj.type}) ===`);
      console.log(JSON.stringify(obj).slice(0, 2000));
    }
  } catch {}
});
