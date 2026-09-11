import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { SHEET_SCHEMAS, SheetTabName } from '../src/lib/schemas/google-sheets-schema';

async function main() {
  const tabs: SheetTabName[] = [
    'VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'PUBLISHING',
    'ASSIGNMENTS',
    'WORKFLOW',
    'AUDIT_LOG',
  ];

  for (const tab of tabs) {
    const schema = SHEET_SCHEMAS[tab];
    const schemaCols = schema.columns.map((c) => c.name);
    try {
      const liveHeaders = await googleSheetsClient.getHeaders(tab);
      const missing = schemaCols.filter((c) => !liveHeaders.map((h) => h.toLowerCase()).includes(c.toLowerCase()));
      if (missing.length > 0) {
        console.log(`[TAB ${tab}] Missing headers in sheet:`, missing);
      } else {
        console.log(`[TAB ${tab}] All ${schemaCols.length} headers match live sheet!`);
      }
    } catch (e: any) {
      console.log(`[TAB ${tab}] Error reading headers: ${e.message}`);
    }
  }
}

main().catch(console.error);
