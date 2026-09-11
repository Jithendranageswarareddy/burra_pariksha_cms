import 'dotenv/config';
import { GroqClient } from '../src/lib/ai/providers/groq.client';
import { XaiClient } from '../src/lib/ai/providers/xai.client';

const groqClient = new GroqClient();
const xaiClient = new XaiClient();

const results = {
  GROQ_API_KEY_PRESENT: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
  XAI_API_KEY_PRESENT: !!(process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim()),
  groqClient_isConfigured: groqClient.isConfigured(),
  xaiClient_isConfigured: xaiClient.isConfigured(),
  groqReadsOnlyGroqKey: groqClient.getApiKey() === process.env.GROQ_API_KEY,
  xaiReadsOnlyXaiKey: xaiClient.getApiKey() === process.env.XAI_API_KEY,
};

console.log(JSON.stringify(results, null, 2));
