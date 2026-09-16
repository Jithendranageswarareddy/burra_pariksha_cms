import { SemanticReasoningProvider } from '../lib/ai/validators/semantic-reasoning.provider';
import { geminiClient } from '../lib/ai/gemini.client';

const cases = [
  {
    id: "A", type: "Correct answer + correct explanation",
    questionText: "What is the capital of France?", language: "ENGLISH",
    options: { a: "London", b: "Paris", c: "Berlin", d: "Madrid" },
    correctAnswer: "B",
    explanation: "Paris is the capital of France."
  },
  {
    id: "B", type: "Wrong answer",
    questionText: "What is 10 + 10?", language: "ENGLISH",
    options: { a: "20", b: "30", c: "40", d: "50" },
    correctAnswer: "B",
    explanation: "10 + 10 = 30."
  },
  {
    id: "C", type: "Correct answer + wrong explanation",
    questionText: "What is 5 * 5?", language: "ENGLISH",
    options: { a: "25", b: "30", c: "35", d: "40" },
    correctAnswer: "A",
    explanation: "Because 5 + 5 = 25."
  },
  {
    id: "D", type: "Ambiguous question",
    questionText: "Who is the best player?", language: "ENGLISH",
    options: { a: "Player A", b: "Player B", c: "Player C", d: "Player D" },
    correctAnswer: "A",
    explanation: "Player A is generally considered the best."
  },
  {
    id: "E", type: "Valid Telugu aptitude question",
    questionText: "ఒక వస్తువును 200 రూపాయలకు కొని 250 రూపాయలకు అమ్మితే లాభ శాతం ఎంత?", language: "TELUGU",
    options: { a: "20%", b: "25%", c: "30%", d: "35%" },
    correctAnswer: "B",
    explanation: "లాభం = 50. శాతం = (50/200)*100 = 25%"
  },
  {
    id: "F", type: "Invalid Telugu/question meaning (gibberish/broken)",
    questionText: "కొనుగోలు బంతి బంతి శాతం అమ్మితే రెండు?", language: "TELUGU",
    options: { a: "20", b: "30", c: "40", d: "50" },
    correctAnswer: "A",
    explanation: "సమాధానం A."
  },
  {
    id: "H", type: "Plausible but incorrect distractors",
    questionText: "What is the square root of 144?", language: "ENGLISH",
    options: { a: "12", b: "14", c: "72", d: "144" },
    correctAnswer: "A",
    explanation: "The square root of 144 is 12. 72 is half of 144, not the square root."
  }
];

async function run() {
  const provider = new SemanticReasoningProvider();

  console.log("=== Semantic Reasoning Tests ===");
  for (const c of cases) {
    const q: any = {
      questionText: c.questionText,
      language: c.language,
      options: { ...c.options, correctAnswer: c.correctAnswer },
      explanation: c.explanation
    };

    const evidence = await provider.validate(q);
    console.log(`\n--- Case ${c.id}: ${c.type} ---`);
    console.log(`Verdict: ${evidence.verdict}`);
    console.log(`Confidence: ${evidence.confidence}`);
    console.log(`Summary: ${evidence.reasoningSummary}`);
    console.log(`Issues: ${evidence.detectedIssues.join(', ')}`);
  }

  // Test G: AI unavailable
  console.log(`\n--- Case G: AI unavailable ---`);
  // Mock geminiClient
  const oldIsConfigured = geminiClient.isConfigured;
  geminiClient.isConfigured = () => false;
  const qG: any = cases[0];
  const evidenceG = await provider.validate(qG);
  console.log(`Verdict: ${evidenceG.verdict}`);
  console.log(`Summary: ${evidenceG.reasoningSummary}`);
  console.log(`Issues: ${evidenceG.detectedIssues.join(', ')}`);
  
  geminiClient.isConfigured = oldIsConfigured;

  console.log("\n=== Done ===");
}

run().catch(console.error);
