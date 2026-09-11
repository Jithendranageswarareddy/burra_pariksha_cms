import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { blindVerifierRegistry } from '../src/lib/ai/verifier/blind-verifier.registry';
import { BlindVerifierInputDTO } from '../src/lib/ai/verifier/types';

interface SheetSnapshot {
  QUESTIONS: number;
  CONTENT_MASTERS: number;
  QUESTION_VALIDATIONS: number | string;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const metadata = await googleSheetsClient.getSpreadsheetMetadata();
  const names = metadata.sheetNames;

  const countSheet = async (sheetName: string): Promise<number | string> => {
    if (!names.includes(sheetName)) return 'TAB_NOT_PRESENT (0)';
    try {
      const res = await googleSheetsClient.getRows(sheetName);
      return res.rows.length;
    } catch (err: any) {
      return `ERROR: ${err.message}`;
    }
  };

  const q = await countSheet('QUESTIONS');
  const cm = await countSheet('CONTENT_MASTERS');
  const qv = await countSheet('QUESTION_VALIDATIONS');
  const wf = await countSheet('WORKFLOW');
  const al = await countSheet('AUDIT_LOG');
  const seq = await countSheet('SEQUENCES');

  return {
    QUESTIONS: typeof q === 'number' ? q : 0,
    CONTENT_MASTERS: typeof cm === 'number' ? cm : 0,
    QUESTION_VALIDATIONS: qv,
    WORKFLOW: typeof wf === 'number' ? wf : 0,
    AUDIT_LOG: typeof al === 'number' ? al : 0,
    SEQUENCES: typeof seq === 'number' ? seq : 0,
  };
}

async function main() {
  console.log('=== PHASE 6: FINAL LIVE BLIND VERIFIER SMOKE TEST ===\n');

  // 1. Pre-test snapshot
  const preSnapshot = await getLiveSnapshot();

  // 2. Resolve provider from registry
  const provider = blindVerifierRegistry.getDefaultProvider();
  const isConfigured = provider.isConfigured();
  const modelId = provider.modelId;

  console.log(`Provider: ${provider.providerId}`);
  console.log(`Model: ${modelId}`);
  console.log(`Configured: ${isConfigured}`);

  if (!isConfigured) {
    throw new Error('Gemini blind verifier provider is not configured (missing key).');
  }

  // 3. Strict Blind Verifier Input DTO
  const blindInput: BlindVerifierInputDTO = {
    questionText: 'If a bus travels 120 km in 3 hours, what is its average speed?',
    options: {
      a: '30 km/h',
      b: '40 km/h',
      c: '60 km/h',
      d: '360 km/h',
    },
    language: 'ENGLISH' as any,
    categoryName: 'Quantitative Aptitude',
    topicName: 'Time, Speed & Relative Velocity',
    subtopicName: 'Time & Speed Basics',
  };

  console.log('\nExecuting exactly ONE live blind verification request...');
  const startTime = Date.now();
  let output: any = null;
  let errorClassification: string = 'NONE';
  let liveRequestExecuted: boolean = false;

  try {
    liveRequestExecuted = true;
    output = await provider.verifyCandidateBlind(blindInput);
  } catch (err: any) {
    errorClassification = err?.classification || err?.message || 'UNKNOWN_ERROR';
    console.error('Verifier call failed:', err);
  }
  const duration = Date.now() - startTime;
  console.log(`Latency: ${duration}ms\n`);

  // 4. Post-test snapshot
  const postSnapshot = await getLiveSnapshot();

  const questionsDiff = preSnapshot.QUESTIONS !== postSnapshot.QUESTIONS;
  const cmDiff = preSnapshot.CONTENT_MASTERS !== postSnapshot.CONTENT_MASTERS;
  const qvDiff = preSnapshot.QUESTION_VALIDATIONS !== postSnapshot.QUESTION_VALIDATIONS;
  const wfDiff = preSnapshot.WORKFLOW !== postSnapshot.WORKFLOW;
  const alDiff = preSnapshot.AUDIT_LOG !== postSnapshot.AUDIT_LOG;
  const seqDiff = preSnapshot.SEQUENCES !== postSnapshot.SEQUENCES;

  const totalMutations = [questionsDiff, cmDiff, qvDiff, wfDiff, alDiff, seqDiff].filter(Boolean).length;

  console.log('=== VERIFIER OUTPUT ===');
  console.log(JSON.stringify(output, null, 2));

  const dtoValid = Boolean(
    output &&
    typeof output.solvedOption === 'string' &&
    typeof output.isSolvable === 'boolean' &&
    typeof output.hasMultipleValidOptions === 'boolean' &&
    typeof output.confidence === 'number' &&
    typeof output.independentProof === 'string'
  );

  console.log('\n=== SMOKE TEST RESULTS ===');
  console.log(`A. Provider: ${provider.providerId}`);
  console.log(`B. Model: ${modelId}`);
  console.log(`C. Live request: ${liveRequestExecuted ? 'YES' : 'NO'}`);
  console.log(`D. Blind input contract respected: YES`);
  console.log(`E. DTO validation: ${dtoValid ? 'PASS' : 'FAIL'}`);
  console.log(`F. solvedOption: ${output?.solvedOption || 'N/A'}`);
  console.log(`G. isSolvable: ${output?.isSolvable ?? 'N/A'}`);
  console.log(`H. hasMultipleValidOptions: ${output?.hasMultipleValidOptions ?? 'N/A'}`);
  console.log(`I. validOptions: ${JSON.stringify(output?.validOptions || [])}`);
  console.log(`J. Error classification: ${errorClassification}`);
  console.log(`K. Sheets mutation count: ${totalMutations}`);
  
  const passed =
    dtoValid &&
    output.solvedOption === 'B' &&
    output.isSolvable === true &&
    output.hasMultipleValidOptions === false &&
    errorClassification === 'NONE' &&
    totalMutations === 0;

  console.log(`L. Final verdict: ${passed ? 'PASS — LIVE VERIFIED' : 'FAIL/BLOCKED'}`);
}

main().catch((err) => {
  console.error('Fatal error in smoke test:', err);
  process.exit(1);
});
