import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { taxonomyService } from '../src/lib/services/taxonomy.service';

async function main() {
  console.log('Google Sheets isConfigured:', googleSheetsClient.isConfigured());
  const meta = await googleSheetsClient.getSpreadsheetMetadata();
  console.log('Spreadsheet Title:', meta.title);
  console.log('Spreadsheet Sheets:', meta.sheetNames);

  const categories = await taxonomyService.getCategories();
  console.log('Categories count:', categories.length);
  const topics = await taxonomyService.getTopics();
  console.log('Topics count:', topics.length);
  const subtopics = await taxonomyService.getSubtopics();
  console.log('Subtopics count:', subtopics.length);

  const tax = await taxonomyService.validateTaxonomy('CAT-QA', 'TOP-QA-01', 'SUB-QA-01-01');
  console.log('Validated Taxonomy:', {
    category: tax.category.id,
    topic: tax.topic.id,
    subtopic: tax.subtopic.id,
  });
}

main().catch(err => {
  console.error('Probe error:', err);
  process.exit(1);
});
