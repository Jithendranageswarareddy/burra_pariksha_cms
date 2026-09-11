import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';

async function main() {
  const h = await googleSheetsClient.getHeaders('VIDEOS');
  console.log('Live VIDEOS Headers:', h);
}

main().catch(console.error);
