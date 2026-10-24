/**
 * Stage 02 editorial quality checks.
 *
 * Deterministic checks reject only objective contract violations. Usefulness,
 * Telugu clarity, and factual-risk heuristics produce review findings rather
 * than pretending that lexical evidence proves educational correctness.
 */

import { Question, QuestionLanguage, ValidationCheckItem } from '../../../shared';
import { calculateJaccardSimilarity, normalizeText } from '../../../shared/lib/similarity';

export interface Stage02QualityResult {
  checks: ValidationCheckItem[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export function validateStage02Quality(
  question: Question,
  existingQuestions: readonly Question[] = []
): Stage02QualityResult {
  const checks: ValidationCheckItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const text = (question.questionText || question.question || '').trim();
  const explanation = (question.explanation || '').trim();
  const language = String(question.language || QuestionLanguage.TELUGU).toUpperCase();
  const options = Object.values(question.options || {}).map((value) => String(value || '').trim());
  const answerIndex = ['A', 'B', 'C', 'D'].indexOf(String(question.correctAnswer || '').toUpperCase());

  const practicalSignal = Boolean(
    question.realLifeContext ||
    question.realWorldContext ||
    question.introductoryConcept ||
    /\b(apply|calculate|compare|choose|decide|use|find|solve|how|when|why)\b/i.test(text) ||
    /[\u0C00-\u0C7F]/.test(text)
  );
  if (practicalSignal) {
    checks.push({ id: 'CHK_STAGE_02_USEFULNESS', name: 'Usefulness & Practical Value', category: 'CONSISTENCY', status: 'PASS', message: 'Question contains an identifiable learning or practical application signal.' });
  } else {
    warnings.push('Question usefulness could not be established deterministically from its text or context.');
    recommendations.push('Human reviewer should confirm the question teaches or tests a useful learner outcome.');
    checks.push({ id: 'CHK_STAGE_02_USEFULNESS', name: 'Usefulness & Practical Value', category: 'CONSISTENCY', status: 'NEEDS_REVIEW', message: 'Practical value requires editorial review; lexical signals are not proof of usefulness.' });
  }

  const teluguPattern = /[\u0C00-\u0C7F]/g;
  const teluguCount = (text.match(teluguPattern) || []).length;
  if (language === 'TELUGU' && teluguCount === 0) {
    warnings.push('Telugu question clarity cannot be confirmed because the question contains no Telugu script.');
    recommendations.push('Have a Telugu-speaking reviewer confirm clarity and terminology.');
    checks.push({ id: 'CHK_STAGE_02_TELUGU_CLARITY', name: 'Telugu Clarity Review', category: 'CONSISTENCY', status: 'NEEDS_REVIEW', message: 'Telugu-language clarity requires human review.' });
  } else if (/(\[[A-Z0-9_]+\]|\{\{?|\}\}?|TODO|FIXME)/i.test(text)) {
    errors.push('Question contains unresolved placeholder text.');
    checks.push({ id: 'CHK_STAGE_02_TELUGU_CLARITY', name: 'Language Clarity & Placeholder Safety', category: 'CONSISTENCY', status: 'FAIL', message: 'Unresolved placeholder text is not publishable.' });
  } else {
    checks.push({ id: 'CHK_STAGE_02_TELUGU_CLARITY', name: 'Language Clarity & Placeholder Safety', category: 'CONSISTENCY', status: 'PASS', message: 'No deterministic placeholder or missing-script violation detected.' });
  }

  const answerOption = answerIndex >= 0 ? options[answerIndex] : '';
  if (answerIndex < 0 || !answerOption) {
    errors.push('Correct answer must identify a non-empty option.');
  }
  if (!explanation) {
    errors.push('Explanation is required for Stage 02 cross-field consistency.');
  }
  if (answerOption && explanation && !normalizeText(explanation).includes(normalizeText(answerOption))) {
    warnings.push('Explanation does not repeat the exact answer option; semantic alignment requires review.');
    recommendations.push('Confirm that the explanation derives the declared answer rather than merely restating a different result.');
  }
  checks.push({
    id: 'CHK_STAGE_02_CROSS_FIELD',
    name: 'Cross-Field Answer & Explanation Consistency',
    category: 'CONSISTENCY',
    status: errors.some((error) => error.includes('Correct answer') || error.includes('Explanation is required')) ? 'FAIL' : warnings.some((warning) => warning.includes('exact answer option')) ? 'NEEDS_REVIEW' : 'PASS',
    message: errors.some((error) => error.includes('Correct answer') || error.includes('Explanation is required'))
      ? 'Question answer and explanation fields are incomplete.'
      : warnings.some((warning) => warning.includes('exact answer option'))
      ? 'Answer/explanation semantic alignment requires human review.'
      : 'Answer and explanation fields are structurally consistent.',
  });

  const normalizedText = normalizeText(text);
  const duplicate = existingQuestions
    .filter((existing) => existing.id !== question.id)
    .map((existing) => ({ existing, score: calculateJaccardSimilarity(text, existing.questionText || existing.question || '') }))
    .sort((left, right) => right.score - left.score)[0];
  if (duplicate && normalizedText && normalizedText === normalizeText(duplicate.existing.questionText || duplicate.existing.question || '')) {
    errors.push(`Exact duplicate question detected: ${duplicate.existing.id}.`);
    checks.push({ id: 'CHK_STAGE_02_DUPLICATE', name: 'Duplicate Question Detection', category: 'CONSISTENCY', status: 'FAIL', message: 'Question exactly duplicates an existing question.' });
  } else if (duplicate && duplicate.score >= 0.7) {
    warnings.push(`Near-duplicate similarity ${(duplicate.score * 100).toFixed(0)}% with question ${duplicate.existing.id}.`);
    recommendations.push('Human reviewer should determine whether the learning objective is materially distinct.');
    checks.push({ id: 'CHK_STAGE_02_DUPLICATE', name: 'Duplicate Question Detection', category: 'CONSISTENCY', status: 'NEEDS_REVIEW', message: 'Similarity is a review signal, not proof of duplication.' });
  } else {
    checks.push({ id: 'CHK_STAGE_02_DUPLICATE', name: 'Duplicate Question Detection', category: 'CONSISTENCY', status: 'PASS', message: 'No exact or review-threshold duplicate was found in the supplied question set.' });
  }

  const factRiskPattern = /\b(always|never|only|all|none|currently|latest|first|largest|smallest|according to)\b|\b(20\d{2}|19\d{2})\b/i;
  if (factRiskPattern.test(text) || factRiskPattern.test(explanation)) {
    warnings.push('Question contains an absolute, time-sensitive, or attribution-style claim that may carry fact risk.');
    recommendations.push('Verify the claim against an authoritative source before approval.');
    checks.push({ id: 'CHK_STAGE_02_FACT_RISK', name: 'Fact-Risk Escalation', category: 'CONSISTENCY', status: 'NEEDS_REVIEW', message: 'Potential fact risk requires source verification; this heuristic is not a fact checker.' });
  } else {
    checks.push({ id: 'CHK_STAGE_02_FACT_RISK', name: 'Fact-Risk Escalation', category: 'CONSISTENCY', status: 'PASS', message: 'No deterministic fact-risk trigger was detected.' });
  }

  return { checks, errors, warnings, recommendations };
}
