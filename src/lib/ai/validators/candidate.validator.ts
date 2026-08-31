/**
 * BURRA PARIKSHA CMS - Candidate Validator & Sanity Checks
 * Phase 4: Gemini AI Question Studio
 * 
 * Performs deterministic and pedagogical sanity checks on AI-generated question candidates:
 * - Mathematical/logical consistency
 * - Option uniqueness & distractor quality
 * - Correct answer & explanation alignment
 * - Answer leakage prevention
 * - Language consistency (Telugu/English)
 * - Short-form video length & clarity
 * - Real-world scenario & style compliance
 */

import { QuestionCandidateZodSchema } from '../schemas/question-candidate.schema';
import { QuestionCandidate } from '../types';
import { QuestionLanguage, QuestionStyle } from '../../../types';
import { MathematicalValidator, MathVerificationResult } from './mathematical.validator';

export interface CandidateValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics?: {
    charCount: number;
    explanationCharCount: number;
    hasBurraTrick: boolean;
    hasTeluguScript: boolean;
    isNumericProblem: boolean;
  };
  mathematicalVerification?: MathVerificationResult;
}

/**
 * Strips formatting, currency symbols, units, and trailing zeros for numeric equivalence checks.
 */
function normalizeNumericOption(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[₹$,%]/g, '')
    .replace(/\b(percent|rupees|rs|km\/h|km\/hr|kmph|m\/s|meters|seconds|sec|mins|hours|hrs|kg|liters|days)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export class CandidateValidator {
  /**
   * Validates an AI question candidate with strict schema, pedagogical, and mathematical rules.
   */
  public static validate(candidate: Partial<QuestionCandidate>): CandidateValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Zod Schema Verification
    const zodResult = QuestionCandidateZodSchema.safeParse(candidate);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        errors.push(`${issue.path.join('.') || 'Candidate'}: ${issue.message}`);
      }
    }

    const {
      content = '',
      option_a = '',
      option_b = '',
      option_c = '',
      option_d = '',
      correct_answer,
      explanation = '',
      language = QuestionLanguage.ENGLISH,
      question_style = '',
      real_world_context = '',
    } = candidate;

    // 2. Options Completeness & Uniqueness Check (Deterministic)
    const rawOptions = [
      { key: 'A', text: option_a.trim(), norm: option_a.trim().toLowerCase(), num: normalizeNumericOption(option_a) },
      { key: 'B', text: option_b.trim(), norm: option_b.trim().toLowerCase(), num: normalizeNumericOption(option_b) },
      { key: 'C', text: option_c.trim(), norm: option_c.trim().toLowerCase(), num: normalizeNumericOption(option_c) },
      { key: 'D', text: option_d.trim(), norm: option_d.trim().toLowerCase(), num: normalizeNumericOption(option_d) },
    ];

    // Check for empty options
    rawOptions.forEach((opt) => {
      if (!opt.text) {
        errors.push(`Option ${opt.key} is blank.`);
      }
    });

    // Check for duplicate or nearly duplicate options
    for (let i = 0; i < rawOptions.length; i++) {
      for (let j = i + 1; j < rawOptions.length; j++) {
        const optA = rawOptions[i];
        const optB = rawOptions[j];

        if (optA.text && optB.text) {
          // Exact text duplicate
          if (optA.norm === optB.norm) {
            errors.push(
              `Duplicate options detected: Option ${optA.key} and Option ${optB.key} have identical values ("${optA.text}").`
            );
          } else if (optA.num && optB.num && optA.num === optB.num && !isNaN(Number(optA.num))) {
            // Numeric equivalence (e.g. "20%" vs "20 percent" or "₹500" vs "500")
            errors.push(
              `Equivalent numerical options detected: Option ${optA.key} ("${optA.text}") and Option ${optB.key} ("${optB.text}") represent the same value.`
            );
          }
        }
      }
    }

    // 3. Correct Answer Integrity Check
    if (!correct_answer || !['A', 'B', 'C', 'D'].includes(correct_answer)) {
      errors.push('Correct answer must be explicitly selected as A, B, C, or D.');
    } else {
      const selectedOption = rawOptions.find((o) => o.key === correct_answer);
      if (!selectedOption || !selectedOption.text) {
        errors.push(`Declared correct answer Option ${correct_answer} cannot be blank.`);
      }
    }

    // 4. Explanation & Correct Answer Alignment Check (Catch LLM Contradictions)
    if (explanation && correct_answer) {
      // Regex checking if explanation explicitly declares another option as correct
      const optionDeclarationRegexes = [
        /(?:correct\s+(?:option|answer)\s+is|answer\s+is\s+option|hence\s+option|therefore\s+option)\s*[:\-\(=]?\s*([A-D])\b/i,
        /\b(?:option|ఆప్షన్|సమాధానం)\s*[:\-\(=]?\s*([A-D])\s+(?:is\s+correct|సరైనది|సరైన\s+సమాధానం)/i,
        /\bAnswer\s*[:\-=]\s*([A-D])\b/i,
      ];

      for (const regex of optionDeclarationRegexes) {
        const match = explanation.match(regex);
        if (match && match[1]) {
          const declaredInExp = match[1].toUpperCase();
          if (declaredInExp !== correct_answer && ['A', 'B', 'C', 'D'].includes(declaredInExp)) {
            errors.push(
              `Contradiction: Explanation concludes Option ${declaredInExp} is correct, but declared correct answer is Option ${correct_answer}.`
            );
            break;
          }
        }
      }
    }

    // 5. Answer Leakage Prevention (Question statement giving away answer)
    if (content) {
      const leakagePatterns = [
        /\bthe\s+answer\s+is\s+[A-D]\b/i,
        /\bcorrect\s+option\s+is\s+[A-D]\b/i,
        /\b(answer|solution)\s*:\s*[A-D]\b/i,
      ];
      for (const pat of leakagePatterns) {
        if (pat.test(content)) {
          errors.push('Question statement leaks the answer directly in the problem text.');
          break;
        }
      }
    }

    // 6. Unreplaced Placeholders Check
    if (content.includes('[') && content.includes(']')) {
      const bracketMatch = content.match(/\[(.*?)\]/);
      if (bracketMatch && !content.includes('[A-D]')) {
        warnings.push(`Question text contains unreplaced placeholder brackets "${bracketMatch[0]}".`);
      }
    }

    // 7. Short-Form Video Suitability & Character Length Checks
    const contentLen = content.trim().length;
    if (contentLen > 0 && contentLen < 20) {
      errors.push('Question statement is too short (< 20 chars). Ensure all necessary problem constraints are included.');
    } else if (contentLen > 650) {
      warnings.push(`Question statement is relatively long (${contentLen} chars). For 45-60s short-form videos, keep phrasing concise.`);
    }

    const expLen = explanation.trim().length;
    if (expLen > 0 && expLen < 30) {
      warnings.push('Explanation is brief. A step-by-step breakdown or speed math trick is required for high-retention video scripts.');
    } else if (expLen > 2500) {
      warnings.push(`Explanation exceeds standard length (${expLen} chars).`);
    }

    // 8. Speed Math / "Burra Trick" Presence Check
    const hasBurraTrick =
      explanation.includes('Burra Trick') ||
      explanation.includes('Speed Trick') ||
      explanation.includes('Shortcut') ||
      explanation.includes('బుర్ర ట్రిక్') ||
      explanation.includes('షార్ట్‌కట్') ||
      explanation.includes('Trick') ||
      explanation.includes('Mental Calculation');

    if (expLen >= 30 && !hasBurraTrick) {
      warnings.push('Explanation lacks a dedicated "Burra Trick" or speed math shortcut section.');
    }

    // 9. Language Consistency Checks
    const hasTeluguChars = /[\u0C00-\u0C7F]/.test(content);
    if (language === QuestionLanguage.TELUGU) {
      if (!hasTeluguChars && contentLen > 20) {
        errors.push('Target language is set to TELUGU, but the question statement contains no Telugu characters.');
      }
      const expHasTelugu = /[\u0C00-\u0C7F]/.test(explanation);
      if (!expHasTelugu && expLen > 20) {
        warnings.push('Target language is TELUGU, but explanation appears to be in English.');
      }
    }

    // 10. Mathematical & Domain Sanity Checks
    // Check for impossible negative real-world values (time, speed, distance, price)
    if (!content.toLowerCase().includes('temperature') && !content.toLowerCase().includes('negative number')) {
      const negativeValRegex = /\b-\s*\d+(\.\d+)?\s*(seconds|sec|km\/h|kmph|m\/s|meters|rupees|₹|min|hours)\b/i;
      if (negativeValRegex.test(content) || rawOptions.some((o) => negativeValRegex.test(o.text))) {
        warnings.push('Detected negative value in physical quantities (speed, time, distance, or price). Verify if physically valid.');
      }
    }

    // Check for probability > 1 or < 0
    if (content.toLowerCase().includes('probability') || content.includes('సంభావ్యత')) {
      rawOptions.forEach((opt) => {
        const numVal = parseFloat(opt.num);
        if (!isNaN(numVal) && !opt.text.includes('%') && (numVal > 1 || numVal < 0)) {
          warnings.push(`Probability option ${opt.key} ("${opt.text}") is outside the valid range [0, 1].`);
        }
      });
    }

    // 11. Independent Deterministic Mathematical Validation
    const mathVerification = MathematicalValidator.verify(candidate);
    if (mathVerification.status === 'FAILED') {
      errors.push(mathVerification.reason || 'Independent mathematical verification failed.');
    } else if (mathVerification.status === 'UNVERIFIED') {
      warnings.push(`Mathematical verification: UNVERIFIED (${mathVerification.reason}). Human review is authoritative.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        charCount: contentLen,
        explanationCharCount: expLen,
        hasBurraTrick,
        hasTeluguScript: hasTeluguChars,
        isNumericProblem: rawOptions.some((o) => !isNaN(Number(o.num))),
      },
      mathematicalVerification: mathVerification,
    };
  }
}

