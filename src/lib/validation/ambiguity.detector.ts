/**
 * BURRA PARIKSHA CMS - Ambiguity & Clarity Detector
 * Phase 5: Question Validation Engine (Stage 6)
 * 
 * Detects:
 * - Unclear wording, missing variables or placeholders
 * - Contradictory premise conditions
 * - Multiple equally defensible or identical options
 * - Insufficient information preventing deterministic resolution
 */

import { AmbiguityResult, ValidationCheckItem } from '../../types';

export class AmbiguityDetector {
  public static detect(
    questionText: string,
    options: { a: string; b: string; c?: string; d?: string },
    declaredAnswer: string
  ): {
    result: AmbiguityResult;
    check: ValidationCheckItem;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const text = questionText || '';

    // 1. Placeholder or template token detection
    const placeholderTokens = text.match(/(\[[A-Z0-9_]+\]|\{[a-zA-Z0-9_]+\}|<[a-zA-Z0-9_]+>|TODO|FIXME|XXX)/g);
    if (placeholderTokens) {
      reasons.push(`Unresolved template or placeholder tokens detected in question text: ${placeholderTokens.join(', ')}.`);
    }

    // 2. Missing numbers before units (e.g. "runs at km/h", "cost of rupees", "in days")
    const missingValuePatterns = [
      /(?:at|speed\s+of)\s+(?:km\/h|km\/hr|kmph|m\/s)\b/i,
      /(?:distance\s+of)\s+(?:km|meters|m)\b/i,
      /(?:in|takes)\s+(?:days|hours|minutes|seconds)\b/i,
      /(?:price\s+of)\s+[₹Rs\.]+\s*(?:and|for|in|\.|\?)/i,
    ];

    for (const pat of missingValuePatterns) {
      if (pat.test(text)) {
        reasons.push('Question statement appears to omit a required numerical value before a unit measurement.');
        break;
      }
    }

    // 3. Contradictory constraints
    // e.g. "A is greater than B and B is greater than A"
    const directContradiction = /([A-Z])\s+(?:is\s+greater\s+than|>)\s+([A-Z]).*?\2\s+(?:is\s+greater\s+than|>)\s+\1/i.test(text);
    if (directContradiction) {
      reasons.push('Direct logical contradiction detected in premises (e.g. X > Y and Y > X).');
    }

    // 4. Multiple identical options
    const rawOpts = [
      options.a?.trim().toLowerCase(),
      options.b?.trim().toLowerCase(),
      options.c?.trim().toLowerCase(),
      options.d?.trim().toLowerCase(),
    ].filter(Boolean);

    const uniqueOpts = new Set(rawOpts);
    if (rawOpts.length > uniqueOpts.size) {
      reasons.push('Multiple options share identical text representation.');
    }

    // 5. Check if question asks for an undefined variable
    if (/\bfind\s+(?:the\s+value\s+of\s+)?([xyz])\b/i.test(text) && !/\b[xyz]\b/i.test(text.replace(/find\s+[xyz]/i, ''))) {
      reasons.push('Question asks to find a variable that is not defined in the premise.');
    }

    const isAmbiguous = reasons.length > 0;
    const confidence = isAmbiguous ? 0.4 : 1.0;

    const result: AmbiguityResult = {
      isAmbiguous,
      ambiguityReasons: reasons,
      confidence,
      details: isAmbiguous
        ? `Ambiguity detected: ${reasons.join(' ')}`
        : 'Question premises and options are unambiguous and well-specified.',
    };

    const check: ValidationCheckItem = {
      id: 'CHK_AMBIGUITY_DETECTION',
      name: 'Premise Clarity & Unambiguous Specification',
      category: 'AMBIGUITY',
      status: isAmbiguous ? 'WARN' : 'PASS',
      message: isAmbiguous
        ? `Potential ambiguity: ${reasons[0]}`
        : 'Premises, constraints, and units are clearly defined.',
      details: result.details,
      confidence,
    };

    return { result, check, reasons };
  }
}
