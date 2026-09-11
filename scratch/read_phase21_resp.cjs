const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\jithendra\\.gemini\\antigravity-ide\\brain\\24f55ff5-e763-4b67-992b-31ce5c8b24ab\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let userIdx = 0;
let capture = false;

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      userIdx++;
      if (userIdx === 65) capture = true;
      else if (userIdx === 66) capture = false;
    } else if (capture && obj.type === 'PLANNER_RESPONSE') {
      const content = obj.content || '';
      if (content.includes('RECOMMENDED NEXT PHASE ORDER') || content.includes('TRUE REMAINING WORK')) {
        console.log(content.slice(content.indexOf('TRUE REMAINING WORK'), content.indexOf('TRUE REMAINING WORK') + 3000));
      }
    }
  } catch {}
});
