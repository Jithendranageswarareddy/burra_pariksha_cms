const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\jithendra\\.gemini\\antigravity-ide\\brain\\24f55ff5-e763-4b67-992b-31ce5c8b24ab\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let idx = 0;
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      idx++;
      if (idx === 65) {
        console.log(obj.content);
      }
    }
  } catch {}
});
