/**
 * BURRA PARIKSHA CMS - Explanation Validator
 * Phase 5: Question Validation Engine (Stage 5)
 * 
 * Verifies:
 * - Explanation presence and substantive length
 * - Consistency between explanation and declared correct answer
 * - Absence of explicit contradictions (e.g. explanation naming a different option as correct)
 * - Alignment with calculated results where available
 */

import { ExplanationVerificationResult, ValidationCheckItem } from '../../types';

export class ExplanationValidator {
  public static validate(
    explanation: string,
    declaredAnswer: string,
    calculatedValue?: number | string
  ): {
    result: ExplanationVerificationResult;
    check: ValidationCheckItem;
    errors: string[];
    warnings: string[];
  } {
    const text = (explanation || '').trim();
    const normDeclared = (declaredAnswer || '').trim().toUpperCase();
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Length & Substantive check
    const substantiveLength = text.length >= 15;
    const isPlaceholder = /^(todo|explanation|n\/a|na|none|answer|solution|\.)$/i.test(text);

    if (!substantiveLength || isPlaceholder) {
      errors.push('Explanation must be at least 15 characters long and contain substantive reasoning.');
    }

    // 2. Contradiction Detection
    // Check if explanation explicitly concludes with a different option than declared.
    // Distinguishes elimination statements (e.g. "We eliminate Option B because...")
    // from final conclusion statements (e.g. "Therefore Option C is correct.")
    let contradictsAnswer = false;
    let contradictionDetail = '';

    const conclusionPatterns = [
      /(?:hence|therefore|thus|so|consequently)\s*,?\s*(?:the\s*)?(?:correct\s*)?(?:answer|option)\s*(?:is|:)?\s*\(?([A-D])\)?/gi,
      /(?:correct\s*answer|correct\s*option)\s*(?:is|:)?\s*\(?([A-D])\)?/gi,
      /(?:answer|option)\s*\(?([A-D])\)?\s*is\s*(?:the\s*)?(?:correct|right|valid)\b/gi,
      /(?:hence|therefore|thus|so)\s*,?\s*(?:option\s*)?\(?([A-D])\)?\s*is\s*(?:correct|the\s*right|the\s*correct)\b/gi,
      /\(?([A-D])\)?\s*is\s*(?:the\s*)?correct\s*(?:answer|option|choice)\b/gi,
    ];

    for (const pattern of conclusionPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const fullMatch = match[0];
        const citedOption = match[1].toUpperCase();

        // Skip elimination statements or negative phrases (e.g. "incorrect", "eliminated", "wrong", "is false", "not correct")
        const isEliminationContext = /\b(incorrect|false|wrong|eliminated|eliminating|invalid|not|cannot|rule out|discard|reject)\b/i.test(fullMatch);
        if (isEliminationContext) {
          continue;
        }

        if (citedOption !== normDeclared) {
          contradictsAnswer = true;
          contradictionDetail = `Explanation explicitly concludes Option ${citedOption} ("${fullMatch}"), which contradicts declared answer Option ${normDeclared}.`;
          errors.push(`Explanation Contradiction: ${contradictionDetail}`);
          break;
        }
      }
      if (contradictsAnswer) break;
    }

    // 3. Reaches declared result check
    let reachesDeclaredResult = true;
    if (calculatedValue !== undefined && calculatedValue !== null) {
      const calcStr = String(calculatedValue);
      // Check if the calculated value is mentioned in the explanation text
      const mentionsCalc = text.includes(calcStr);
      if (!mentionsCalc) {
        reachesDeclaredResult = false;
        warnings.push(`Explanation does not explicitly mention the verified calculated result (${calcStr}).`);
      }
    }

    const isValid = substantiveLength && !isPlaceholder && !contradictsAnswer;

    const result: ExplanationVerificationResult = {
      isValid,
      contradictsAnswer,
      reachesDeclaredResult,
      substantiveLength,
      details: contradictsAnswer
        ? contradictionDetail
        : isValid
        ? 'Explanation is substantive, clear, and consistent with the declared answer.'
        : 'Explanation is too short or contains placeholder content.',
    };

    const check: ValidationCheckItem = {
      id: 'CHK_EXPLANATION_QUALITY',
      name: 'Explanation Alignment & Pedagogical Quality',
      category: 'EXPLANATION',
      status: contradictsAnswer ? 'FAIL' : !substantiveLength ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS',
      message: contradictsAnswer
        ? contradictionDetail
        : !substantiveLength
        ? 'Explanation lacks sufficient length or substance.'
        : 'Explanation is aligned with declared answer.',
      details: result.details,
    };

    return { result, check, errors, warnings };
  }
}
