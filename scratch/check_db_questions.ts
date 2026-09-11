import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { QuestionValidationStatus } from '../src/types';

async function main() {
  const isConfigured = googleSheetsClient.isConfigured();
  console.log('Google Sheets configured:', isConfigured);

  const questions = await questionsRepository.findAll();
  console.log('Total questions in database:', questions.length);

  const validQuestions = questions.filter(q => q.validationStatus === QuestionValidationStatus.VALID || String(q.validationStatus) === 'VALID');
  console.log('Total VALID questions:', validQuestions.length);

  validQuestions.slice(0, 5).forEach(q => {
    console.log({
      id: q.id,
      contentMasterId: q.contentMasterId,
      status: q.status,
      validationStatus: q.validationStatus,
      questionText: q.questionText?.substring(0, 60),
    });
  });

  const seqRes = await googleSheetsClient.getRows('SEQUENCES');
  console.log('SEQUENCES count:', seqRes.rows.length);
  seqRes.rows.forEach(r => console.log('SEQ:', r[0], r[1]));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
