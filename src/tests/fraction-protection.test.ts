import { GoogleSheetsClient } from '../lib/google-sheets/client';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — GOOGLE SHEETS FRACTIONAL VALUE PROTECTION REGRESSION');
console.log('========================================================================');

const client = GoogleSheetsClient.getInstance();

// Access the private helper method using index accessor
const protectFractionalValues = (client as any).protectFractionalValues.bind(client);

// 1. Define test cases
const testCases = [
  { input: '6/8', expected: "'6/8", desc: 'Fraction 6/8' },
  { input: '3/4', expected: "'3/4", desc: 'Fraction 3/4' },
  { input: '1/2', expected: "'1/2", desc: 'Fraction 1/2' },
  { input: '10/20', expected: "'10/20", desc: 'Fraction 10/20' },
  { input: '12/15', expected: "'12/15", desc: 'Fraction 12/15' },
  { input: 'ordinary_text', expected: 'ordinary_text', desc: 'Legitimate text string' },
  { input: '42', expected: '42', desc: 'Numeric string' },
  { input: 123.45, expected: 123.45, desc: 'Legitimate number' },
  { input: true, expected: true, desc: 'Boolean value' },
];

let failedCount = 0;

for (const tc of testCases) {
  const result = protectFractionalValues([tc.input])[0];
  if (result === tc.expected) {
    console.log(`[PASS] ${tc.desc}: Input [${tc.input}] -> Output [${result}]`);
  } else {
    console.error(`[FAIL] ${tc.desc}: Input [${tc.input}] -> Expected [${tc.expected}], got [${result}]`);
    failedCount++;
  }
}

console.log('========================================================================');
if (failedCount === 0) {
  console.log('REGRESSION TEST SUCCESSFUL: ALL FRACTIONAL PATTERNS CORRECTLY PROTECTED');
  process.exit(0);
} else {
  console.error(`REGRESSION TEST FAILED: ${failedCount} FAILURES ENCOUNTERED`);
  process.exit(1);
}
