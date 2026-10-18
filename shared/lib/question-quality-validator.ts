/**
 * BURRA PARIKSHA CMS — Question Quality Validation Service (Pure Domain Utility)
 * Specification: S9-T04 / S9-T12 Deterministic Question Quality Verification
 *
 * Implements the 12 authoritative Quality Verification Criteria (VAL-Q-01 through VAL-Q-12):
 * - Pure, deterministic evaluation for both AI-generated and manually edited questions
 * - Hard blocking errors (BLOCKING) vs advisory observations (WARNING)
 * - Strict support for Mode 1 (Question Challenge Short), Mode 2 (Topic Introduction),
 *   and Mode 3 (Explained Questions Video)
 * - Zero side-effects, zero network calls, zero non-deterministic dependencies
 */

import {
  QuestionQualityIssue,
  QuestionQualityValidationOptions,
  QuestionQualityValidationResult,
} from '../contracts/question-generation/question-quality.contract';
import { calculateJaccardSimilarity, normalizeText } from './similarity';

const PLACEHOLDER_PATTERN = /(TODO|N\/A|\{\{|\}\})/i;

function hasPlaceholder(text: string | null | undefined): boolean {
  if (!text) return false;
  return PLACEHOLDER_PATTERN.test(text);
}

function extractOptions(target: any): { a: string; b: string; c: string; d: string } {
  if (!target) return { a: '', b: '', c: '', d: '' };
  return {
    a: String(target.optionA || target.options?.a || target.options?.A || target.option_a || '').trim(),
    b: String(target.optionB || target.options?.b || target.options?.B || target.option_b || '').trim(),
    c: String(target.optionC || target.options?.c || target.options?.C || target.option_c || '').trim(),
    d: String(target.optionD || target.options?.d || target.options?.D || target.option_d || '').trim(),
  };
}

/**
 * Validates a single question item (used for standalone questions, batch slots, and explained questions).
 */
function validateSingleQuestionFields({
  questionText,
  options,
  correctAnswer,
  explanation,
  challengeType,
  slotNumber,
  slotId,
  questionIndex,
  requireExplanation,
  prefix = '',
}: {
  questionText: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: string;
  explanation: string;
  challengeType?: string;
  slotNumber?: number;
  slotId?: string;
  questionIndex?: number;
  requireExplanation?: boolean;
  prefix?: string;
}): QuestionQualityIssue[] {
  const issues: QuestionQualityIssue[] = [];
  const trimmedPrompt = (questionText || '').trim();
  const trimmedAns = (correctAnswer || '').trim().toUpperCase();
  const trimmedExpl = (explanation || '').trim();
  const isTrueFalse = challengeType === 'TRUE_FALSE' || challengeType === 'YES_NO';

  // 1. VAL-Q-01: Empty or Whitespace Prompt (< 5 chars)
  if (trimmedPrompt.length === 0) {
    issues.push({
      ruleId: 'VAL-Q-01',
      code: 'ERR_EMPTY_PROMPT',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.questionText` : 'questionText',
      message: slotNumber
        ? `Slot #${slotNumber}: Question problem statement must be at least 5 characters.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Statement must be at least 5 characters.`
        : 'Question problem statement must be at least 5 characters.',
      slotNumber,
      slotId,
      questionIndex,
    });
  } else if (trimmedPrompt.length < 5) {
    issues.push({
      ruleId: 'VAL-Q-01',
      code: 'ERR_EMPTY_PROMPT',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.questionText` : 'questionText',
      message: slotNumber
        ? `Slot #${slotNumber}: Statement must be at least 5 characters.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Statement must be at least 5 characters.`
        : 'Question problem statement must be at least 5 characters.',
      slotNumber,
      slotId,
      questionIndex,
    });
  } else if (trimmedPrompt.length > 180) {
    // VAL-Q-11: Prompt Length & Pacing Advisory (> 180 chars)
    issues.push({
      ruleId: 'VAL-Q-11',
      code: 'WARN_PROMPT_LENGTH',
      severity: 'WARNING',
      field: prefix ? `${prefix}.questionText` : 'questionText',
      message: slotNumber
        ? `Slot #${slotNumber}: Problem statement is long for a 58s Short (> 180 chars). Verify presenter can speak it in <= 10s.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Problem statement is long (> 180 chars). Verify presenter can speak it in <= 10s.`
        : 'Problem statement is long for a 58s Short (> 180 chars). Verify presenter can speak it in <= 10s.',
      slotNumber,
      slotId,
      questionIndex,
    });
  }

  // 2. VAL-Q-02: Canonical MCQ Options Contract (presence & distinctness)
  if (!options.a) {
    issues.push({
      ruleId: 'VAL-Q-02',
      code: 'ERR_OPTION_INCOMPLETE',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.optionA` : 'optionA',
      message: slotNumber
        ? `Slot #${slotNumber}: Option A is required.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Option A is required.`
        : 'Option A is required.',
      slotNumber,
      slotId,
      questionIndex,
    });
  }
  if (!options.b) {
    issues.push({
      ruleId: 'VAL-Q-02',
      code: 'ERR_OPTION_INCOMPLETE',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.optionB` : 'optionB',
      message: slotNumber
        ? `Slot #${slotNumber}: Option B is required.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Option B is required.`
        : 'Option B is required.',
      slotNumber,
      slotId,
      questionIndex,
    });
  }
  if (!isTrueFalse) {
    if (!options.c) {
      issues.push({
        ruleId: 'VAL-Q-02',
        code: 'ERR_OPTION_INCOMPLETE',
        severity: 'BLOCKING',
        field: prefix ? `${prefix}.optionC` : 'optionC',
        message: slotNumber
          ? `Slot #${slotNumber}: Option C is required.`
          : questionIndex !== undefined
          ? `Question #${(slotNumber || questionIndex + 1)}: Option C is required.`
          : 'Option C is required.',
        slotNumber,
        slotId,
        questionIndex,
      });
    }
    if (!options.d) {
      issues.push({
        ruleId: 'VAL-Q-02',
        code: 'ERR_OPTION_INCOMPLETE',
        severity: 'BLOCKING',
        field: prefix ? `${prefix}.optionD` : 'optionD',
        message: slotNumber
          ? `Slot #${slotNumber}: Option D is required.`
          : questionIndex !== undefined
          ? `Question #${(slotNumber || questionIndex + 1)}: Option D is required.`
          : 'Option D is required.',
        slotNumber,
        slotId,
        questionIndex,
      });
    }
  }

  // Check distinctness among present options
  const rawOptionEntries = [
    { key: 'A', text: options.a.toLowerCase() },
    { key: 'B', text: options.b.toLowerCase() },
    ...(!isTrueFalse
      ? [
          { key: 'C', text: options.c.toLowerCase() },
          { key: 'D', text: options.d.toLowerCase() },
        ]
      : []),
  ].filter((entry) => entry.text.length > 0);

  let duplicateFound = false;
  for (let i = 0; i < rawOptionEntries.length; i++) {
    for (let j = i + 1; j < rawOptionEntries.length; j++) {
      if (rawOptionEntries[i].text === rawOptionEntries[j].text) {
        duplicateFound = true;
        issues.push({
          ruleId: 'VAL-Q-02',
          code: 'ERR_OPTION_DUPLICATE',
          severity: 'BLOCKING',
          field: prefix ? `${prefix}.options` : 'options',
          message: slotNumber
            ? `Slot #${slotNumber}: Options must be distinct.`
            : questionIndex !== undefined
            ? `Question #${(slotNumber || questionIndex + 1)}: All 4 options (A, B, C, D) are required and must be distinct.`
            : `Duplicate options: Option ${rawOptionEntries[i].key} and Option ${rawOptionEntries[j].key} are identical.`,
          slotNumber,
          slotId,
          questionIndex,
        });
        break;
      }
    }
    if (duplicateFound) break;
  }

  // 3. VAL-Q-03 & VAL-Q-04: Answer Key Validation
  if (!trimmedAns) {
    issues.push({
      ruleId: 'VAL-Q-04',
      code: 'ERR_MISSING_ANSWER_KEY',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.correctAnswer` : 'correctAnswer',
      message: slotNumber
        ? `Slot #${slotNumber}: Correct answer key is required.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Correct answer must be specified (A, B, C, or D).`
        : 'Correct answer key is required.',
      slotNumber,
      slotId,
      questionIndex,
    });
  } else if (!['A', 'B', 'C', 'D'].includes(trimmedAns)) {
    issues.push({
      ruleId: 'VAL-Q-03',
      code: 'ERR_INVALID_ANSWER_KEY',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}.correctAnswer` : 'correctAnswer',
      message: slotNumber
        ? `Slot #${slotNumber}: Correct answer must be A, B, C, or D.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Correct answer must be A, B, C, or D.`
        : `Invalid correct answer choice '${trimmedAns}'. Must be A, B, C, or D.`,
      slotNumber,
      slotId,
      questionIndex,
    });
  }

  // 4. VAL-Q-07: Missing or Short Explanation / Proof
  if (requireExplanation || trimmedExpl.length > 0) {
    if (trimmedExpl.length < 5) {
      issues.push({
        ruleId: 'VAL-Q-07',
        code: 'ERR_MISSING_EXPLANATION',
        severity: 'BLOCKING',
        field: prefix ? `${prefix}.explanation` : 'explanation',
        message: slotNumber
          ? `Slot #${slotNumber}: Mathematical solution proof and speed trick are required (at least 5 characters).`
          : questionIndex !== undefined
          ? `Question #${(slotNumber || questionIndex + 1)}: Explanation must contain at least 5 characters.`
          : 'Mathematical solution proof and speed trick are required (at least 5 characters).',
        slotNumber,
        slotId,
        questionIndex,
      });
    } else if (trimmedExpl.length < 20) {
      // VAL-Q-12: Explanation Brevity Advisory
      issues.push({
        ruleId: 'VAL-Q-12',
        code: 'WARN_EXPLANATION_BREVITY',
        severity: 'WARNING',
        field: prefix ? `${prefix}.explanation` : 'explanation',
        message: slotNumber
          ? `Slot #${slotNumber}: Explanation is very brief (< 20 chars). Consider adding step-by-step Burra Speed Trick derivation.`
          : questionIndex !== undefined
          ? `Question #${(slotNumber || questionIndex + 1)}: Explanation is very brief (< 20 chars). Consider adding step-by-step Burra Speed Trick derivation.`
          : 'Explanation is very brief (< 20 chars). Consider adding step-by-step Burra Speed Trick derivation.',
        slotNumber,
        slotId,
        questionIndex,
      });
    }
  }

  // 5. VAL-Q-05: Placeholder Content Detection
  const combinedContent = `${trimmedPrompt} ${options.a} ${options.b} ${options.c} ${options.d} ${trimmedExpl}`;
  if (hasPlaceholder(combinedContent)) {
    issues.push({
      ruleId: 'VAL-Q-05',
      code: 'ERR_PLACEHOLDER_CONTENT',
      severity: 'BLOCKING',
      field: prefix ? `${prefix}` : 'questionText',
      message: slotNumber
        ? `Slot #${slotNumber}: Placeholder content is not allowed.`
        : questionIndex !== undefined
        ? `Question #${(slotNumber || questionIndex + 1)}: Placeholder content is not allowed.`
        : 'Placeholder content (e.g. TODO, N/A, {{...}}) is not allowed.',
      slotNumber,
      slotId,
      questionIndex,
    });
  }

  return issues;
}

/**
 * Validates a candidate or batch payload against authoritative Quality Verification Criteria (S9-T04 / S9-T12).
 *
 * @param candidate Candidate data, draft object, or batch structure to validate.
 * @param options Additional validation constraints (e.g. requireExplanation for submission gates).
 * @returns Deterministic validation result with categorized blocking errors and advisory warnings.
 */
export function validateQuestionQuality(
  candidate: any,
  options?: QuestionQualityValidationOptions
): QuestionQualityValidationResult {
  const issues: QuestionQualityIssue[] = [];
  if (!candidate) {
    return {
      isValid: false,
      hasErrors: true,
      hasWarnings: false,
      errors: [
        {
          ruleId: 'VAL-Q-01',
          code: 'ERR_EMPTY_PROMPT',
          severity: 'BLOCKING',
          field: 'candidate',
          message: 'Question candidate workspace is empty.',
        },
      ],
      warnings: [],
      issues: [
        {
          ruleId: 'VAL-Q-01',
          code: 'ERR_EMPTY_PROMPT',
          severity: 'BLOCKING',
          field: 'candidate',
          message: 'Question candidate workspace is empty.',
        },
      ],
      summary: { blockingCount: 1, warningCount: 0, totalIssues: 1 },
      errorMessages: ['Question candidate workspace is empty.'],
      warningMessages: [],
    };
  }

  const mode = String(candidate.productionMode || 'QUESTION_CHALLENGE_SHORT');

  // ==========================================================================
  // MODE 2: TOPIC_INTRODUCTION
  // ==========================================================================
  if (mode === 'TOPIC_INTRODUCTION') {
    const conceptText = String(
      candidate.introductoryConcept || candidate.questionText || candidate.content || candidate.question || ''
    ).trim();

    if (!conceptText) {
      issues.push({
        ruleId: 'VAL-Q-01',
        code: 'ERR_EMPTY_PROMPT',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Introductory concept statement is required.',
      });
    } else if (conceptText.length < 15) {
      issues.push({
        ruleId: 'VAL-Q-01',
        code: 'ERR_INSUFFICIENT_CONCEPT_LENGTH',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Introductory concept statement must be at least 15 characters.',
      });
    }

    if (hasPlaceholder(conceptText)) {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_PLACEHOLDER_CONTENT',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Placeholder content (e.g. TODO, N/A, {{...}}) is not allowed in introductory concept.',
      });
    }

    if (candidate.aspectRatio && candidate.aspectRatio !== '9:16' && candidate.aspectRatio !== '16:9') {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_INVALID_ASPECT_RATIO',
        severity: 'BLOCKING',
        field: 'aspectRatio',
        message: 'Topic Introduction aspect ratio must be either 9:16 or 16:9.',
      });
    }

    if (candidate.targetQuestionCount && candidate.targetQuestionCount > 0) {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_INVALID_TARGET_COUNT',
        severity: 'BLOCKING',
        field: 'targetQuestionCount',
        message: 'Topic Introduction requires 0 questions.',
      });
    }

    if (Array.isArray(candidate.questions) && candidate.questions.length > 0) {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_INVALID_TARGET_COUNT',
        severity: 'BLOCKING',
        field: 'questions',
        message: 'Topic Introduction requires 0 questions.',
      });
    }

    return finalizeValidationResult(issues);
  }

  // ==========================================================================
  // MODE 3: EXPLAINED_QUESTIONS_VIDEO
  // ==========================================================================
  if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
    const introText = String(
      candidate.introductoryConcept || candidate.questionText || candidate.content || candidate.question || ''
    ).trim();

    if (!introText) {
      issues.push({
        ruleId: 'VAL-Q-01',
        code: 'ERR_EMPTY_PROMPT',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Introductory concept overview must be at least 15 characters.',
      });
    } else if (introText.length < 15) {
      issues.push({
        ruleId: 'VAL-Q-01',
        code: 'ERR_INSUFFICIENT_CONCEPT_LENGTH',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Introductory concept overview must be at least 15 characters.',
      });
    }

    if (hasPlaceholder(introText)) {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_PLACEHOLDER_CONTENT',
        severity: 'BLOCKING',
        field: 'introductoryConcept',
        message: 'Placeholder content (e.g. TODO, N/A, {{...}}) is not allowed in introductory concept.',
      });
    }

    if (candidate.aspectRatio && candidate.aspectRatio !== '16:9') {
      issues.push({
        ruleId: 'VAL-Q-05',
        code: 'ERR_INVALID_ASPECT_RATIO',
        severity: 'BLOCKING',
        field: 'aspectRatio',
        message: 'Explained Questions Video must use 16:9 aspect ratio.',
      });
    }

    const targetCount = Number(candidate.targetQuestionCount || options?.targetQuestionCount || 5);
    const questions = Array.isArray(candidate.questions) ? candidate.questions : [];

    if (questions.length < targetCount) {
      issues.push({
        ruleId: 'VAL-Q-08',
        code: 'ERR_INCOMPLETE_BATCH',
        severity: 'BLOCKING',
        field: 'questions',
        message: `Requires ${targetCount} explained questions (currently has ${questions.length}).`,
      });
    }

    // Validate individual questions in the collection
    const seenMode3Statements = new Map<string, number>();
    for (let i = 0; i < Math.min(questions.length, targetCount); i++) {
      const q = questions[i];
      const qNum = q?.questionNumber || i + 1;
      const qText = String(q?.questionText || q?.question || '').trim();
      const qOptions = extractOptions(q);
      const qAnswer = String(q?.correctAnswer || '').trim();
      const qExpl = String(q?.explanation || '').trim();

      const itemIssues = validateSingleQuestionFields({
        questionText: qText,
        options: qOptions,
        correctAnswer: qAnswer,
        explanation: qExpl,
        slotNumber: qNum,
        questionIndex: i,
        requireExplanation: true,
        prefix: `questions[${i}]`,
      });
      issues.push(...itemIssues);

      // Duplicate checks within Explained Questions
      if (qText) {
        const norm = normalizeText(qText);
        if (norm) {
          if (seenMode3Statements.has(norm)) {
            const priorNum = seenMode3Statements.get(norm)!;
            issues.push({
              ruleId: 'VAL-Q-06A',
              code: 'ERR_DUPLICATE_QUESTION',
              severity: 'BLOCKING',
              field: `questions[${i}].questionText`,
              message: `Question #${qNum}: Duplicate question statement matching Question #${priorNum}.`,
              questionIndex: i,
              slotNumber: qNum,
            });
          } else {
            seenMode3Statements.set(norm, qNum);
          }
        }
      }
    }

    return finalizeValidationResult(issues);
  }

  // ==========================================================================
  // MODE 1: QUESTION_CHALLENGE_SHORT (Batch Slots vs Single Candidate)
  // ==========================================================================
  const rawSlots =
    candidate.slots ||
    candidate.batchAssembly?.slots ||
    options?.batchAssembly?.slots ||
    null;
  const targetCount = Number(candidate.targetQuestionCount || options?.targetQuestionCount || 1);

  // Branch 1: Batch Mode (targetQuestionCount > 1 or slots array provided)
  if (targetCount > 1 || (Array.isArray(rawSlots) && rawSlots.length > 0)) {
    const slots = Array.isArray(rawSlots) ? rawSlots : [];

    // VAL-Q-08: Batch size completeness
    if (slots.length < targetCount) {
      issues.push({
        ruleId: 'VAL-Q-08',
        code: 'ERR_INCOMPLETE_BATCH',
        severity: 'BLOCKING',
        field: 'slots',
        message: `Mode 1 batch requires ${targetCount} slots (currently has ${slots.length}).`,
      });
    }

    // VAL-Q-09: Mutation & Slot Sequence Integrity
    let integrityCompromised = false;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot || slot.slotNumber !== i + 1 || !slot.slotId) {
        integrityCompromised = true;
        break;
      }
    }
    if (integrityCompromised) {
      issues.push({
        ruleId: 'VAL-Q-09',
        code: 'ERR_SLOT_INTEGRITY',
        severity: 'BLOCKING',
        field: 'slots',
        message: 'Slot sequence integrity compromised: slot numbers must be contiguous and slot IDs must be present.',
      });
    }

    // VAL-Q-08: Empty and invalid slot count checks
    const emptyCount = slots.filter(
      (s: any) => !s || s.status === 'EMPTY' || !String(s.questionText || '').trim()
    ).length;
    if (emptyCount > 0) {
      issues.push({
        ruleId: 'VAL-Q-08',
        code: 'ERR_INCOMPLETE_BATCH',
        severity: 'BLOCKING',
        field: 'slots',
        message: `Batch has ${emptyCount} unfilled/empty slots. All ${targetCount} slots must be complete.`,
      });
    }

    const invalidCount = slots.filter((s: any) => s && s.status === 'INVALID').length;
    if (invalidCount > 0) {
      issues.push({
        ruleId: 'VAL-Q-08',
        code: 'ERR_INCOMPLETE_BATCH',
        severity: 'BLOCKING',
        field: 'slots',
        message: `Batch has ${invalidCount} invalid slots.`,
      });
    }

    // Per-slot validation
    const seenStatements = new Map<string, number>();
    const validSlotTexts: Array<{ slotNumber: number; text: string }> = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot) continue;
      const sNum = slot.slotNumber || i + 1;
      const sText = String(slot.questionText || '').trim();

      if (slot.status !== 'EMPTY' && sText.length > 0) {
        const slotOpts = extractOptions(slot);
        const slotAns = String(slot.correctAnswer || '').trim();
        const slotExpl = String(slot.explanation || '').trim();

        const slotIssues = validateSingleQuestionFields({
          questionText: sText,
          options: slotOpts,
          correctAnswer: slotAns,
          explanation: slotExpl,
          slotNumber: sNum,
          slotId: slot.slotId,
          requireExplanation: options?.requireExplanation,
          prefix: `slots[${i}]`,
        });
        issues.push(...slotIssues);

        // Track statement for duplicate & similarity checks
        const normalizedStatement = normalizeText(sText);
        if (normalizedStatement) {
          if (seenStatements.has(normalizedStatement)) {
            const earlierSlot = seenStatements.get(normalizedStatement)!;
            issues.push({
              ruleId: 'VAL-Q-06A',
              code: 'ERR_DUPLICATE_QUESTION',
              severity: 'BLOCKING',
              field: `slots[${i}].questionText`,
              message: `Slot #${sNum}: Duplicate question within batch (matches Slot #${earlierSlot}).`,
              slotNumber: sNum,
              slotId: slot.slotId,
            });
          } else {
            seenStatements.set(normalizedStatement, sNum);
            validSlotTexts.push({ slotNumber: sNum, text: sText });
          }
        }
      }
    }

    // VAL-Q-06B: Semantic Topical Overlap (> 0.85 Jaccard similarity)
    if (!options?.skipDuplicateCheck && validSlotTexts.length > 1) {
      for (let i = 0; i < validSlotTexts.length; i++) {
        for (let j = i + 1; j < validSlotTexts.length; j++) {
          const sim = calculateJaccardSimilarity(validSlotTexts[i].text, validSlotTexts[j].text);
          if (sim > 0.85) {
            issues.push({
              ruleId: 'VAL-Q-06B',
              code: 'WARN_TOPICAL_OVERLAP',
              severity: 'WARNING',
              field: `slots[${validSlotTexts[j].slotNumber - 1}].questionText`,
              message: `Slot #${validSlotTexts[j].slotNumber}: High similarity with Slot #${validSlotTexts[i].slotNumber} (${Math.round(sim * 100)}%). Consider varying the mathematical angle.`,
              slotNumber: validSlotTexts[j].slotNumber,
              metadata: { similarity: sim, pairedSlotNumber: validSlotTexts[i].slotNumber },
            });
          }
        }
      }
    }

    return finalizeValidationResult(issues);
  }

  // Branch 2: Single Question Candidate (Default Mode 1)
  const qText = String(candidate.questionText || candidate.content || candidate.question || '').trim();
  const optionsMap = extractOptions(candidate);
  const ansKey = String(candidate.correctAnswer || candidate.correct_answer || '').trim();
  const explText = String(candidate.explanation || '').trim();

  const singleIssues = validateSingleQuestionFields({
    questionText: qText,
    options: optionsMap,
    correctAnswer: ansKey,
    explanation: explText,
    challengeType: candidate.challengeType,
    requireExplanation: options?.requireExplanation,
  });
  issues.push(...singleIssues);

  return finalizeValidationResult(issues);
}

function finalizeValidationResult(issues: QuestionQualityIssue[]): QuestionQualityValidationResult {
  const errors = issues.filter((i) => i.severity === 'BLOCKING');
  const warnings = issues.filter((i) => i.severity === 'WARNING');
  const errorMessages = errors.map((e) => e.message);
  const warningMessages = warnings.map((w) => w.message);

  return {
    isValid: errors.length === 0,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    issues,
    summary: {
      blockingCount: errors.length,
      warningCount: warnings.length,
      totalIssues: issues.length,
    },
    errorMessages,
    warningMessages,
  };
}

/**
 * Convenience helper to format errors as a single combined string.
 */
export function formatValidationErrors(result: QuestionQualityValidationResult): string {
  return result.errorMessages.join(' ');
}
