import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';

async function main() {
  const currentHeaders = await googleSheetsClient.getHeaders('VIDEOS');
  console.log('Current VIDEOS headers count:', currentHeaders.length);

  const missingColumns = [
    'content_master_id',
    'final_render_width',
    'final_render_height',
    'final_render_format',
    'final_render_aspect_ratio',
    'final_render_validation_status',
  ];

  const toAdd = missingColumns.filter((c) => !currentHeaders.map((h) => h.toLowerCase()).includes(c.toLowerCase()));
  if (toAdd.length === 0) {
    console.log('All missing columns already present in VIDEOS headers!');
    return;
  }

  const newHeaders = [...currentHeaders, ...toAdd];
  console.log('Updating VIDEOS headers from', currentHeaders.length, 'to', newHeaders.length);

  // Invalidate rowCache so client fetches fresh headers
  googleSheetsClient.invalidateRowCache('VIDEOS');

  // Update row 1
  await googleSheetsClient.updateRow('VIDEOS', 1, newHeaders);
  googleSheetsClient.invalidateRowCache('VIDEOS');

  const verifiedHeaders = await googleSheetsClient.getHeaders('VIDEOS');
  console.log('Verified VIDEOS headers count:', verifiedHeaders.length);
  console.log('Verified headers:', verifiedHeaders);
}

main().catch(console.error);
