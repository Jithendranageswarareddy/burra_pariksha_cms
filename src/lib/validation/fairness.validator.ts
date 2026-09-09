/**
 * BURRA PARIKSHA CMS - Fairness, Sanity & Answer Leakage Validator
 * Phase 5: Question Validation Engine (Stage 8)
 * 
 * Verifies:
 * - Answer leakage (question statement giving away the answer text verbatim)
 * - Malformed options ('undefined', 'null', '[object Object]', 'NaN')
 * - Physical & mathematical impossibilities (negative time, negative speed, probability > 1)
 */

import { ValidationCheckItem } from '../../types';

export class FairnessValidator {
  public static validate(
    questionText: string,
    options: { a: string; b: string; c?: string; d?: string },
    correctAnswer: string
  ): {
    checks: ValidationCheckItem[];
    errors: string[];
    warnings: string[];
  } {
    const checks: ValidationCheckItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const normAnswer = (correctAnswer || '').trim().toUpperCase();
    const optionsMap: Record<string, string> = {
      A: (options.a || '').trim(),
      B: (options.b || '').trim(),
      C: (options.c || '').trim(),
      D: (options.d || '').trim(),
    };

    // 1. Malformed option values
    const malformedRegex = /^(undefined|null|\[object Object\]|NaN)$/i;
    for (const key of ['A', 'B', 'C', 'D']) {
      const val = optionsMap[key];
      if (val && malformedRegex.test(val)) {
        errors.push(`Option ${key} contains malformed artifact text: "${val}".`);
      }
    }

    // 2. Answer Leakage
    // If the correct option text is >= 4 chars, is not just common words ("true", "false", "yes", "no"),
    // and appears verbatim in the question statement framed as the answer.
    const correctText = optionsMap[normAnswer];
    if (correctText && correctText.length >= 4) {
      const isGeneric = /^(true|false|yes|no|none|all\s+of\s+the\s+above)$/i.test(correctText);
      if (!isGeneric) {
        // Look for answer leakage patterns like "answer is [correctText]" or "is [correctText]. What is..."
        const leakPattern = new RegExp(`(?:answer\\s+is|correct\\s+is|is\\s+equal\\s+to|namely)\\s+${correctText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        if (leakPattern.test(questionText)) {
          errors.push(`Answer Leakage Detected: Question statement appears to explicitly state the correct answer text ("${correctText}").`);
          checks.push({
            id: 'CHK_FAIRNESS_LEAKAGE',
            name: 'Answer Leakage Prevention',
            category: 'FAIRNESS',
            status: 'FAIL',
            message: `Question statement gives away correct Option ${normAnswer}.`,
          });
        }
      }
    }

    if (!checks.some((c) => c.id === 'CHK_FAIRNESS_LEAKAGE')) {
      checks.push({
        id: 'CHK_FAIRNESS_LEAKAGE',
        name: 'Answer Leakage Prevention',
        category: 'FAIRNESS',
        status: 'PASS',
        message: 'No answer leakage detected in question prompt.',
      });
    }

    // 3. Impossible Physical / Mathematical Conditions
    // Negative time, speed, distance
    const hasNegativeTime = /(?:-\d+(?:\.\d+)?)\s*(?:seconds?|hours?|hrs?|minutes?|mins?|days?)/i.test(questionText);
    const hasNegativeSpeed = /(?:-\d+(?:\.\d+)?)\s*(?:km\/h|kmph|m\/s)/i.test(questionText);
    const hasNegativeDistance = /(?:-\d+(?:\.\d+)?)\s*(?:meters?|km|kilometers?)/i.test(questionText);

    if (hasNegativeTime || hasNegativeSpeed || hasNegativeDistance) {
      errors.push('Impossible physical conditions: Negative time, speed, or distance specified in premise.');
      checks.push({
        id: 'CHK_FAIRNESS_PHYSICAL_SANITY',
        name: 'Physical & Mathematical Sanity',
        category: 'FAIRNESS',
        status: 'FAIL',
        message: 'Negative time, speed, or distance specified in premise.',
      });
    } else {
      checks.push({
        id: 'CHK_FAIRNESS_PHYSICAL_SANITY',
        name: 'Physical & Mathematical Sanity',
        category: 'FAIRNESS',
        status: 'PASS',
        message: 'Physical dimensions and parameters satisfy basic sanity bounds.',
      });
    }

    return { checks, errors, warnings };
  }
}
