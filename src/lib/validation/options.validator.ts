/**
 * BURRA PARIKSHA CMS - Options & Answer Validator
 * Phase 5: Question Validation Engine (Stage 3 & 10)
 * 
 * Verifies option structure across all 5 canonical Challenge Types:
 * - ABCD
 * - TRUE_FALSE
 * - YES_NO
 * - ARRANGE_ORDER
 * - INCORRECT
 * 
 * Enforces:
 * - Correct answer key valid & referencing non-empty option
 * - No duplicate options (normalized text and normalized numerical equivalence)
 * - Required options present
 */

import { ValidationCheckItem } from '../../types';

export interface OptionsValidationResult {
  isValid: boolean;
  checks: ValidationCheckItem[];
  errors: string[];
  warnings: string[];
}

function normalizeOptionText(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface ParsedNumericOption {
  value: number;
  unit: string;
}

export function parseNumericOptionWithUnit(text: string): ParsedNumericOption | null {
  if (!text) return null;
  const normalized = text.trim().toLowerCase();

  const unitMap: Record<string, string> = {
    '%': '%',
    'percent': '%',
    'percentage': '%',
    'km/h': 'km/h',
    'km/hr': 'km/h',
    'kmph': 'km/h',
    'm/s': 'm/s',
    'mps': 'm/s',
    'km': 'km',
    'kilometer': 'km',
    'kilometers': 'km',
    'm': 'm',
    'meter': 'm',
    'meters': 'm',
    'cm': 'cm',
    'centimeter': 'cm',
    'centimeters': 'cm',
    's': 's',
    'sec': 's',
    'second': 's',
    'seconds': 's',
    'min': 'min',
    'mins': 'min',
    'minute': 'min',
    'minutes': 'min',
    'h': 'h',
    'hr': 'h',
    'hrs': 'h',
    'hour': 'h',
    'hours': 'h',
    'day': 'day',
    'days': 'day',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'l': 'l',
    'liter': 'l',
    'liters': 'l',
    'rupees': 'currency',
    'rs': 'currency',
    'rs.': 'currency',
    '₹': 'currency',
    '$': 'currency',
  };

  let currencyUnit = '';
  let rest = normalized;

  if (rest.startsWith('₹')) {
    currencyUnit = 'currency';
    rest = rest.slice(1).trim();
  } else if (rest.startsWith('$')) {
    currencyUnit = 'currency';
    rest = rest.slice(1).trim();
  } else if (rest.startsWith('rs.')) {
    currencyUnit = 'currency';
    rest = rest.slice(3).trim();
  } else if (rest.startsWith('rs')) {
    currencyUnit = 'currency';
    rest = rest.slice(2).trim();
  }

  // Require the ENTIRE option to conform to numeric/unit grammar
  const match = rest.match(/^([+-]?\d+(?:\.\d+)?)(?:\s*([a-z%\/]+(?:\.[a-z]+)?))?$/);
  if (!match) {
    return null;
  }

  const numStr = match[1];
  const unitToken = match[2];

  const val = parseFloat(numStr);
  if (isNaN(val)) return null;

  if (currencyUnit) {
    if (unitToken) return null;
    return { value: val, unit: 'currency' };
  }

  if (!unitToken) {
    return { value: val, unit: 'none' };
  }

  const canonicalUnit = unitMap[unitToken];
  if (!canonicalUnit) {
    return null;
  }

  return { value: val, unit: canonicalUnit };
}

export function normalizeNumericOption(text: string): string {
  const parsed = parseNumericOptionWithUnit(text);
  if (!parsed) return '';
  return `${parsed.value}_${parsed.unit}`;
}

export class OptionsValidator {
  public static validate(
    challengeType: string = 'ABCD',
    options: { a: string; b: string; c?: string; d?: string },
    correctAnswer: string
  ): OptionsValidationResult {
    const checks: ValidationCheckItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const normType = (challengeType || 'ABCD').trim().toUpperCase().replace(/\s*\/\s*/g, '_');
    const normAnswer = (correctAnswer || '').trim().toUpperCase();

    const optA = (options.a || '').trim();
    const optB = (options.b || '').trim();
    const optC = (options.c || '').trim();
    const optD = (options.d || '').trim();

    const optionsList = [
      { key: 'A', text: optA },
      { key: 'B', text: optB },
      { key: 'C', text: optC },
      { key: 'D', text: optD },
    ];

    // 1. Structural requirements per Challenge Type
    if (normType === 'TRUE_FALSE') {
      const isAValid = Boolean(optA);
      const isBValid = Boolean(optB);

      if (!isAValid || !isBValid) {
        errors.push('For TRUE_FALSE challenge type, Option A (True) and Option B (False) must both be provided.');
        checks.push({
          id: 'CHK_OPT_TRUE_FALSE_STRUCTURE',
          name: 'True/False Options Structure',
          category: 'OPTION',
          status: 'FAIL',
          message: 'Both Option A and Option B must be populated for True/False questions.',
        });
      } else {
        checks.push({
          id: 'CHK_OPT_TRUE_FALSE_STRUCTURE',
          name: 'True/False Options Structure',
          category: 'OPTION',
          status: 'PASS',
          message: 'Option A and Option B are properly populated for True/False question.',
        });
      }

      if (normAnswer !== 'A' && normAnswer !== 'B') {
        errors.push(`For TRUE_FALSE challenge type, correctAnswer must be 'A' or 'B' (received '${correctAnswer}').`);
        checks.push({
          id: 'CHK_OPT_TRUE_FALSE_ANSWER',
          name: 'True/False Answer Key',
          category: 'ANSWER',
          status: 'FAIL',
          message: `Correct answer must be 'A' or 'B', but got '${correctAnswer}'.`,
        });
      } else {
        checks.push({
          id: 'CHK_OPT_TRUE_FALSE_ANSWER',
          name: 'True/False Answer Key',
          category: 'ANSWER',
          status: 'PASS',
          message: `Correct answer is valid key '${normAnswer}'.`,
        });
      }
    } else if (normType === 'YES_NO') {
      const isAValid = Boolean(optA);
      const isBValid = Boolean(optB);

      if (!isAValid || !isBValid) {
        errors.push('For YES_NO challenge type, Option A (Yes) and Option B (No) must both be provided.');
        checks.push({
          id: 'CHK_OPT_YES_NO_STRUCTURE',
          name: 'Yes/No Options Structure',
          category: 'OPTION',
          status: 'FAIL',
          message: 'Both Option A and Option B must be populated for Yes/No questions.',
        });
      } else {
        checks.push({
          id: 'CHK_OPT_YES_NO_STRUCTURE',
          name: 'Yes/No Options Structure',
          category: 'OPTION',
          status: 'PASS',
          message: 'Option A and Option B are properly populated for Yes/No question.',
        });
      }

      if (normAnswer !== 'A' && normAnswer !== 'B') {
        errors.push(`For YES_NO challenge type, correctAnswer must be 'A' or 'B' (received '${correctAnswer}').`);
        checks.push({
          id: 'CHK_OPT_YES_NO_ANSWER',
          name: 'Yes/No Answer Key',
          category: 'ANSWER',
          status: 'FAIL',
          message: `Correct answer must be 'A' or 'B', but got '${correctAnswer}'.`,
        });
      } else {
        checks.push({
          id: 'CHK_OPT_YES_NO_ANSWER',
          name: 'Yes/No Answer Key',
          category: 'ANSWER',
          status: 'PASS',
          message: `Correct answer is valid key '${normAnswer}'.`,
        });
      }
    } else if (normType === 'ARRANGE_ORDER') {
      // In ARRANGE_ORDER, options typically contain permutations or order sequences (e.g. 1-2-3-4, B-A-C-D)
      const populated = optionsList.filter((o) => Boolean(o.text));
      if (populated.length < 2) {
        errors.push('ARRANGE_ORDER requires at least 2 distinct candidate ordering choices.');
        checks.push({
          id: 'CHK_OPT_ARRANGE_ORDER',
          name: 'Arrange Order Choices',
          category: 'OPTION',
          status: 'FAIL',
          message: 'At least 2 order options are required.',
        });
      } else {
        checks.push({
          id: 'CHK_OPT_ARRANGE_ORDER',
          name: 'Arrange Order Choices',
          category: 'OPTION',
          status: 'PASS',
          message: `${populated.length} order arrangement options provided.`,
        });
      }

      if (!['A', 'B', 'C', 'D'].includes(normAnswer)) {
        errors.push(`correctAnswer must be A, B, C, or D for ARRANGE_ORDER (received '${correctAnswer}').`);
        checks.push({
          id: 'CHK_OPT_ARRANGE_ANSWER',
          name: 'Arrange Order Answer Key',
          category: 'ANSWER',
          status: 'FAIL',
          message: `Invalid answer key '${correctAnswer}'.`,
        });
      }
    } else if (normType === 'INCORRECT') {
      // Options are statements, correct answer is the single incorrect one
      const populated = optionsList.filter((o) => Boolean(o.text));
      if (populated.length < 3) {
        errors.push('INCORRECT challenge type requires at least 3 statements to identify the incorrect one.');
        checks.push({
          id: 'CHK_OPT_INCORRECT_COUNT',
          name: 'Incorrect Statement Option Count',
          category: 'OPTION',
          status: 'FAIL',
          message: 'INCORRECT challenge type requires at least 3 statements.',
        });
      } else {
        checks.push({
          id: 'CHK_OPT_INCORRECT_COUNT',
          name: 'Incorrect Statement Option Count',
          category: 'OPTION',
          status: 'PASS',
          message: `${populated.length} statements provided for INCORRECT challenge type.`,
        });
      }
    } else {
      // Standard ABCD Multiple Choice
      const populated = optionsList.filter((o) => Boolean(o.text));
      if (populated.length < 4) {
        // Warning if 2 or 3, Error if less than 2
        if (populated.length < 2) {
          errors.push('At least Option A and Option B must be populated.');
          checks.push({
            id: 'CHK_OPT_ABCD_COUNT',
            name: 'Multiple Choice Option Completeness',
            category: 'OPTION',
            status: 'FAIL',
            message: `Only ${populated.length} options provided; at least 2 required.`,
          });
        } else {
          warnings.push(`Standard ABCD questions ideally have 4 choices; currently ${populated.length} provided.`);
          checks.push({
            id: 'CHK_OPT_ABCD_COUNT',
            name: 'Multiple Choice Option Completeness',
            category: 'OPTION',
            status: 'WARN',
            message: `${populated.length} of 4 options populated.`,
          });
        }
      } else {
        checks.push({
          id: 'CHK_OPT_ABCD_COUNT',
          name: 'Multiple Choice Option Completeness',
          category: 'OPTION',
          status: 'PASS',
          message: 'All 4 options (A, B, C, D) are populated.',
        });
      }
    }

    // 2. Correct Answer Validation
    if (!['A', 'B', 'C', 'D'].includes(normAnswer)) {
      errors.push(`Declared correct answer '${correctAnswer}' is invalid. Must be one of A, B, C, D.`);
      checks.push({
        id: 'CHK_OPT_ANSWER_KEY',
        name: 'Correct Answer Designated Key',
        category: 'ANSWER',
        status: 'FAIL',
        message: `Declared correct answer '${correctAnswer}' is not a valid option key.`,
      });
    } else {
      const selectedOption = optionsList.find((o) => o.key === normAnswer);
      if (!selectedOption || !selectedOption.text) {
        errors.push(`Option ${normAnswer} is designated as correct answer, but its option text is empty.`);
        checks.push({
          id: 'CHK_OPT_ANSWER_KEY',
          name: 'Correct Answer Designated Key',
          category: 'ANSWER',
          status: 'FAIL',
          message: `Option ${normAnswer} is designated as correct answer but is empty.`,
        });
      } else {
        checks.push({
          id: 'CHK_OPT_ANSWER_KEY',
          name: 'Correct Answer Designated Key',
          category: 'ANSWER',
          status: 'PASS',
          message: `Option ${normAnswer} is designated as correct answer and contains text: "${selectedOption.text}".`,
        });
      }
    }

    // 3. Duplicate Option Detection (both textual and numerical)
    const activeOptions = optionsList.filter((o) => Boolean(o.text));
    let hasDuplicate = false;

    for (let i = 0; i < activeOptions.length; i++) {
      for (let j = i + 1; j < activeOptions.length; j++) {
        const opt1 = activeOptions[i];
        const opt2 = activeOptions[j];

        // Textual equivalence
        const norm1 = normalizeOptionText(opt1.text);
        const norm2 = normalizeOptionText(opt2.text);

        if (norm1 === norm2) {
          hasDuplicate = true;
          errors.push(`Duplicate Options Detected: Option ${opt1.key} and Option ${opt2.key} have identical text: "${opt1.text}".`);
        } else {
          // Numeric equivalence (safe grammar match with unit preservation)
          const parsed1 = parseNumericOptionWithUnit(opt1.text);
          const parsed2 = parseNumericOptionWithUnit(opt2.text);

          if (parsed1 && parsed2 && parsed1.value === parsed2.value && parsed1.unit === parsed2.unit) {
            hasDuplicate = true;
            const unitLabel = parsed1.unit !== 'none' ? ` ${parsed1.unit}` : '';
            errors.push(`Duplicate Numerical Value Detected: Option ${opt1.key} ("${opt1.text}") and Option ${opt2.key} ("${opt2.text}") evaluate to the same numeric value (${parsed1.value}${unitLabel}).`);
          }
        }
      }
    }

    if (hasDuplicate) {
      checks.push({
        id: 'CHK_OPT_DUPLICATES',
        name: 'Option Uniqueness & Distractor Quality',
        category: 'OPTION',
        status: 'FAIL',
        message: 'Duplicate or numerically identical options detected.',
        details: errors.filter((e) => e.includes('Duplicate')).join(' '),
      });
    } else {
      checks.push({
        id: 'CHK_OPT_DUPLICATES',
        name: 'Option Uniqueness & Distractor Quality',
        category: 'OPTION',
        status: 'PASS',
        message: 'All populated options are distinct and unique.',
      });
    }

    return {
      isValid: errors.length === 0,
      checks,
      errors,
      warnings,
    };
  }
}
