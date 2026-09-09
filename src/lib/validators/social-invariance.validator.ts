/**
 * BURRA PARIKSHA CMS - Social Invariance Guardrail Validator
 * Phase 8B: Social Content Domain & Invariance Foundation
 * 
 * 100% Deterministic (Zero AI call) validator that ensures conversational social media rewrites,
 * hooks, and script enhancements DO NOT change or corrupt the mathematical, numerical, or
 * logical meaning of a validated source question.
 */

import {
  QuestionValidationStatus,
  SocialInvarianceReport,
  SocialInvarianceViolation,
  SocialInvarianceAnchor,
} from '../../types';

export interface SourceQuestionContext {
  id: string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
  explanation?: string;
  validationStatus?: QuestionValidationStatus;
}

export interface EnhancedSocialScriptContext {
  hookText?: string;
  problemStatement?: string;
  stepByStepSolution?: string;
  speedTrickOrTakeaway?: string;
  callToAction?: string;
  spokenNarrationText?: string;
  fullScriptText?: string;
}

export class SocialInvarianceValidator {
  /**
   * Deterministic Directional Antonym Pairs
   */
  private static readonly DIRECTION_PAIRS: Array<[string, string]> = [
    ['increase', 'decrease'],
    ['increases', 'decreases'],
    ['increased', 'decreased'],
    ['increasing', 'decreasing'],
    ['minimum', 'maximum'],
    ['min', 'max'],
    ['before', 'after'],
    ['at least', 'at most'],
    ['profit', 'loss'],
    ['upstream', 'downstream'],
    ['true', 'false'],
    ['correct', 'incorrect'],
    ['more', 'less'],
    ['greater', 'smaller'],
  ];

  /**
   * Validates that an enhanced social script preserves the exact numerical,
   * mathematical, unit, option, and answer identity of a source question.
   */
  public static validateInvariance(
    source: SourceQuestionContext,
    enhanced: EnhancedSocialScriptContext
  ): SocialInvarianceReport {
    const anchors: SocialInvarianceAnchor[] = [];
    const violations: SocialInvarianceViolation[] = [];
    const warnings: string[] = [];
    const checkedAt = new Date().toISOString();

    const sourceStatus = source.validationStatus || QuestionValidationStatus.NOT_VALIDATED;

    // 1. SOURCE QUESTION VALIDITY GATE
    if (sourceStatus === QuestionValidationStatus.INVALID) {
      violations.push({
        anchorType: 'SOURCE_VALIDATION',
        severity: 'CRITICAL',
        message: 'Source question has INVALID validation status. Social enhancement cannot claim validity for an invalid question.',
        originalFragment: `Status: ${sourceStatus}`,
        mutatedFragment: 'Social Enhancement Attempted',
      });

      return {
        status: 'INVALID',
        isValid: false,
        sourceQuestionValidationStatus: sourceStatus,
        preservedAnchorsCount: 0,
        mutatedAnchorsCount: 1,
        violations,
        warnings: ['Source question must be fixed and re-validated before social enhancement.'],
        anchors,
        checkedAt,
      };
    }

    if (sourceStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      warnings.push('Source question has NEEDS_REVIEW validation status. Social enhancement inherits review requirement.');
    }

    // Combine all enhanced text surfaces for holistic anchor scanning
    const combinedEnhancedText = [
      enhanced.hookText || '',
      enhanced.problemStatement || '',
      enhanced.stepByStepSolution || '',
      enhanced.speedTrickOrTakeaway || '',
      enhanced.callToAction || '',
      enhanced.spokenNarrationText || '',
      enhanced.fullScriptText || '',
    ].join(' ');

    const problemAndSolutionText = [
      enhanced.problemStatement || '',
      enhanced.stepByStepSolution || '',
      enhanced.fullScriptText || '',
      enhanced.spokenNarrationText || '',
    ].join(' ');

    // 2. NUMERIC ANCHORS CHECK
    const sourceNumbers = this.extractNumbers(source.questionText);
    for (const numStr of sourceNumbers) {
      const numPattern = new RegExp(`\\b${numStr.replace('.', '\\.')}\\b`);
      const isPreserved = numPattern.test(combinedEnhancedText);

      anchors.push({
        type: 'NUMERIC',
        originalValue: numStr,
        enhancedValue: isPreserved ? numStr : undefined,
        status: isPreserved ? 'PRESERVED' : 'MUTATED',
        details: isPreserved ? 'Numeric parameter present in script' : 'Numeric parameter missing or altered in enhanced script',
      });

      if (!isPreserved) {
        violations.push({
          anchorType: 'NUMERIC',
          severity: 'CRITICAL',
          message: `Numeric parameter "${numStr}" from source question is missing or altered in social script.`,
          originalFragment: source.questionText,
          mutatedFragment: combinedEnhancedText.substring(0, 150),
        });
      }
    }

    // 3. PERCENTAGE ANCHORS CHECK
    const sourcePercentages = this.extractPercentages(source.questionText);
    for (const pctStr of sourcePercentages) {
      const isPreserved = combinedEnhancedText.includes(pctStr);
      anchors.push({
        type: 'PERCENTAGE',
        originalValue: pctStr,
        enhancedValue: isPreserved ? pctStr : undefined,
        status: isPreserved ? 'PRESERVED' : 'MUTATED',
        details: isPreserved ? 'Percentage anchor preserved' : 'Percentage anchor missing or mutated',
      });

      if (!isPreserved) {
        violations.push({
          anchorType: 'PERCENTAGE',
          severity: 'CRITICAL',
          message: `Percentage anchor "${pctStr}" from source question is missing or mutated in social script.`,
          originalFragment: pctStr,
          mutatedFragment: 'Missing or altered',
        });
      }
    }

    // 4. CURRENCY ANCHORS CHECK
    const sourceCurrencies = this.extractCurrencies(source.questionText);
    for (const currStr of sourceCurrencies) {
      const isPreserved = combinedEnhancedText.toLowerCase().includes(currStr.toLowerCase());
      anchors.push({
        type: 'CURRENCY',
        originalValue: currStr,
        enhancedValue: isPreserved ? currStr : undefined,
        status: isPreserved ? 'PRESERVED' : 'MUTATED',
        details: isPreserved ? 'Currency anchor preserved' : 'Currency value missing or altered',
      });

      if (!isPreserved) {
        violations.push({
          anchorType: 'CURRENCY',
          severity: 'CRITICAL',
          message: `Currency anchor "${currStr}" from source question is missing or altered in social script.`,
          originalFragment: currStr,
          mutatedFragment: 'Missing or altered',
        });
      }
    }

    // 5. UNIT ANCHORS CHECK
    const sourceUnits = this.extractUnits(source.questionText);
    for (const unitStr of sourceUnits) {
      const isPreserved = combinedEnhancedText.toLowerCase().includes(unitStr.toLowerCase());
      anchors.push({
        type: 'UNIT',
        originalValue: unitStr,
        enhancedValue: isPreserved ? unitStr : undefined,
        status: isPreserved ? 'PRESERVED' : 'MUTATED',
        details: isPreserved ? 'Unit anchor preserved' : 'Unit anchor missing or mutated',
      });

      if (!isPreserved) {
        violations.push({
          anchorType: 'UNIT',
          severity: 'CRITICAL',
          message: `Unit anchor "${unitStr}" from source question is missing or altered in social script.`,
          originalFragment: unitStr,
          mutatedFragment: 'Missing or altered',
        });
      }
    }

    // 6. CORRECT ANSWER PRESERVATION CHECK
    const correctKey = (source.correctAnswer || '').trim().toUpperCase();
    const correctOptionText = source.options ? (source.options as any)[correctKey.toLowerCase()] : '';

    if (correctKey && correctOptionText) {
      // Check if script explicitly states a wrong answer key (e.g., "The correct option is B" when source is C)
      const declaredAnswerMatch = problemAndSolutionText.match(/(?:correct\s+(?:answer|option|choice)|answer\s+is)\s+(?:option\s+)?([A-D])\b/i);
      if (declaredAnswerMatch) {
        const declaredKey = declaredAnswerMatch[1].toUpperCase();
        if (declaredKey !== correctKey) {
          violations.push({
            anchorType: 'CORRECT_ANSWER',
            severity: 'CRITICAL',
            message: `Correct answer letter mutated: Source designated option "${correctKey}" but social script declares option "${declaredKey}".`,
            originalFragment: `Correct Answer: ${correctKey} (${correctOptionText})`,
            mutatedFragment: declaredAnswerMatch[0],
          });
        }
      }

      // Check if correct option value appears in script or solution
      const optionNumMatch = correctOptionText.match(/\d+(?:\.\d+)?/);
      const isCorrectValuePreserved = optionNumMatch
        ? combinedEnhancedText.includes(optionNumMatch[0])
        : combinedEnhancedText.toLowerCase().includes(correctOptionText.toLowerCase());

      anchors.push({
        type: 'CORRECT_ANSWER',
        originalValue: `${correctKey}: ${correctOptionText}`,
        enhancedValue: isCorrectValuePreserved ? correctOptionText : 'Potentially missing',
        status: isCorrectValuePreserved ? 'PRESERVED' : 'MUTATED',
        details: isCorrectValuePreserved ? 'Correct answer value preserved' : 'Correct answer value missing from solution/explanation',
      });

      if (!isCorrectValuePreserved) {
        warnings.push(`Correct option value "${correctOptionText}" was not explicitly found in enhanced text.`);
      }
    }

    // 7. SEMANTIC DIRECTIONAL KEYWORDS INVERSION CHECK
    const lowerSource = source.questionText.toLowerCase();
    const lowerEnhanced = problemAndSolutionText.toLowerCase();

    for (const [pos, neg] of SocialInvarianceValidator.DIRECTION_PAIRS) {
      if (lowerSource.includes(pos) && !lowerSource.includes(neg)) {
        if (lowerEnhanced.includes(neg) && !lowerEnhanced.includes(pos)) {
          violations.push({
            anchorType: 'DIRECTION_KEYWORD',
            severity: 'CRITICAL',
            message: `Semantic directional inversion detected: Source uses "${pos}" but enhanced script uses "${neg}".`,
            originalFragment: pos,
            mutatedFragment: neg,
          });

          anchors.push({
            type: 'DIRECTION_KEYWORD',
            originalValue: pos,
            enhancedValue: neg,
            status: 'MUTATED',
            details: `Directional keyword inverted from ${pos} to ${neg}`,
          });
        }
      } else if (lowerSource.includes(neg) && !lowerSource.includes(pos)) {
        if (lowerEnhanced.includes(pos) && !lowerEnhanced.includes(neg)) {
          violations.push({
            anchorType: 'DIRECTION_KEYWORD',
            severity: 'CRITICAL',
            message: `Semantic directional inversion detected: Source uses "${neg}" but enhanced script uses "${pos}".`,
            originalFragment: neg,
            mutatedFragment: pos,
          });

          anchors.push({
            type: 'DIRECTION_KEYWORD',
            originalValue: neg,
            enhancedValue: pos,
            status: 'MUTATED',
            details: `Directional keyword inverted from ${neg} to ${pos}`,
          });
        }
      }
    }

    // 8. FINAL STATUS COMPILATION
    const preservedAnchorsCount = anchors.filter((a) => a.status === 'PRESERVED').length;
    const mutatedAnchorsCount = anchors.filter((a) => a.status === 'MUTATED').length;
    const hasCriticalViolation = violations.some((v) => v.severity === 'CRITICAL');

    let status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW' = 'VALID';
    if (hasCriticalViolation) {
      status = 'INVALID';
    } else if (warnings.length > 0 || sourceStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      status = 'NEEDS_REVIEW';
    }

    return {
      status,
      isValid: status === 'VALID',
      sourceQuestionValidationStatus: sourceStatus,
      preservedAnchorsCount,
      mutatedAnchorsCount,
      violations,
      warnings,
      anchors,
      checkedAt,
    };
  }

  /**
   * Validates social metadata (titles, captions, descriptions) against the source question.
   * Key Rule: Fact OMISSION is allowed (e.g. short caption doesn't list all numbers),
   * but Fact CONTRADICTION is strictly prohibited.
   */
  public static validateMetadataInvariance(
    source: SourceQuestionContext,
    metadata: {
      shortTitle: string;
      socialCaption: string;
      extendedDescription?: string;
      ctaPrimaryText?: string;
      ctaCommentPrompt?: string;
    }
  ): SocialInvarianceReport {
    const anchors: SocialInvarianceAnchor[] = [];
    const violations: SocialInvarianceViolation[] = [];
    const warnings: string[] = [];
    const checkedAt = new Date().toISOString();

    const sourceStatus = source.validationStatus || QuestionValidationStatus.NOT_VALIDATED;

    if (sourceStatus === QuestionValidationStatus.INVALID) {
      violations.push({
        anchorType: 'SOURCE_VALIDATION',
        severity: 'CRITICAL',
        message: 'Source question has INVALID validation status. Social metadata cannot be generated for an invalid question.',
        originalFragment: `Status: ${sourceStatus}`,
        mutatedFragment: 'Social Metadata Generation Attempted',
      });

      return {
        status: 'INVALID',
        isValid: false,
        sourceQuestionValidationStatus: sourceStatus,
        preservedAnchorsCount: 0,
        mutatedAnchorsCount: 1,
        violations,
        warnings: ['Source question must be valid before generating social metadata.'],
        anchors,
        checkedAt,
      };
    }

    if (sourceStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      warnings.push('Source question has NEEDS_REVIEW status. Metadata inherits review status.');
    }

    const combinedMetaText = [
      metadata.shortTitle || '',
      metadata.socialCaption || '',
      metadata.extendedDescription || '',
      metadata.ctaPrimaryText || '',
      metadata.ctaCommentPrompt || '',
    ].join(' ');

    const lowerCombined = combinedMetaText.toLowerCase();

    // 1. ANSWER LEAKAGE IN METADATA CHECK
    const correctKey = (source.correctAnswer || '').trim().toUpperCase();
    const correctOptionText = source.options ? (source.options as any)[correctKey.toLowerCase()] : '';

    if (correctKey) {
      const leakageRegexes = [
        new RegExp(`(?:correct\\s+(?:answer|option)|answer\\s+is|సమాధానం|ఆప్షన్)\\s*[:=]?\\s*(${correctKey})\\b`, 'i'),
        new RegExp(`(?:correct\\s+option|correct\\s+answer)\\s*[:=]?\\s*([A-D])\\b`, 'i'),
      ];

      for (const regex of leakageRegexes) {
        const match = combinedMetaText.match(regex);
        if (match) {
          violations.push({
            anchorType: 'ANSWER_LEAKAGE',
            severity: 'CRITICAL',
            message: `Answer leakage detected in metadata: "${match[0]}" reveals the answer prematurely.`,
            originalFragment: `Correct Answer: ${correctKey}`,
            mutatedFragment: match[0],
          });
        }
      }

      if (correctOptionText && correctOptionText.trim().length > 0) {
        // Check if full answer string is explicitly declared as answer
        const lowerOptionText = correctOptionText.toLowerCase().trim();
        if (lowerOptionText.length > 2 && lowerCombined.includes(`answer is ${lowerOptionText}`)) {
          violations.push({
            anchorType: 'ANSWER_LEAKAGE',
            severity: 'CRITICAL',
            message: `Explicit answer value "${correctOptionText}" revealed in social metadata.`,
            originalFragment: correctOptionText,
            mutatedFragment: `answer is ${lowerOptionText}`,
          });
        }
      }
    }

    // 2. CONTRADICTION CHECK: Percentages
    const sourcePct = this.extractPercentages(source.questionText);
    const metaPct = this.extractPercentages(combinedMetaText);

    for (const mPct of metaPct) {
      if (!sourcePct.includes(mPct)) {
        violations.push({
          anchorType: 'PERCENTAGE',
          severity: 'CRITICAL',
          message: `Factual contradiction: Metadata claims percentage "${mPct}" which does not exist in source question.`,
          originalFragment: sourcePct.join(', ') || 'No percentage in source',
          mutatedFragment: mPct,
        });

        anchors.push({
          type: 'PERCENTAGE',
          originalValue: sourcePct.join(', '),
          enhancedValue: mPct,
          status: 'MUTATED',
          details: `Contradictory percentage ${mPct}`,
        });
      }
    }

    // 3. CONTRADICTION CHECK: Currencies
    const sourceCurr = this.extractCurrencies(source.questionText);
    const metaCurr = this.extractCurrencies(combinedMetaText);

    for (const mCurr of metaCurr) {
      const isMatch = sourceCurr.some((s) => s.toLowerCase() === mCurr.toLowerCase());
      if (!isMatch) {
        violations.push({
          anchorType: 'CURRENCY',
          severity: 'CRITICAL',
          message: `Factual contradiction: Metadata mentions currency "${mCurr}" which does not match source question.`,
          originalFragment: sourceCurr.join(', ') || 'No currency in source',
          mutatedFragment: mCurr,
        });

        anchors.push({
          type: 'CURRENCY',
          originalValue: sourceCurr.join(', '),
          enhancedValue: mCurr,
          status: 'MUTATED',
          details: `Contradictory currency ${mCurr}`,
        });
      }
    }

    // 4. CONTRADICTION CHECK: Units
    const sourceUnits = this.extractUnits(source.questionText);
    const metaUnits = this.extractUnits(combinedMetaText);

    for (const mUnit of metaUnits) {
      const isMatch = sourceUnits.some((s) => s.toLowerCase() === mUnit.toLowerCase());
      // Ignore common video duration units like '30s', '60s', '30 sec'
      const isStandardVideoTiming = /\b(?:30|60|15|5)\s*(?:s|sec|seconds)\b/i.test(mUnit);

      if (!isMatch && !isStandardVideoTiming) {
        violations.push({
          anchorType: 'UNIT',
          severity: 'CRITICAL',
          message: `Factual contradiction: Metadata uses unit "${mUnit}" which does not exist in source question.`,
          originalFragment: sourceUnits.join(', ') || 'No unit in source',
          mutatedFragment: mUnit,
        });

        anchors.push({
          type: 'UNIT',
          originalValue: sourceUnits.join(', '),
          enhancedValue: mUnit,
          status: 'MUTATED',
          details: `Contradictory unit ${mUnit}`,
        });
      }
    }

    // 5. DIRECTIONAL KEYWORD INVERSION CHECK
    const lowerSource = source.questionText.toLowerCase();

    for (const [pos, neg] of SocialInvarianceValidator.DIRECTION_PAIRS) {
      if (lowerSource.includes(pos) && !lowerSource.includes(neg)) {
        if (lowerCombined.includes(neg) && !lowerCombined.includes(pos)) {
          violations.push({
            anchorType: 'DIRECTION_KEYWORD',
            severity: 'CRITICAL',
            message: `Directional contradiction: Source question uses "${pos}" but social metadata uses "${neg}".`,
            originalFragment: pos,
            mutatedFragment: neg,
          });
        }
      } else if (lowerSource.includes(neg) && !lowerSource.includes(pos)) {
        if (lowerCombined.includes(pos) && !lowerCombined.includes(neg)) {
          violations.push({
            anchorType: 'DIRECTION_KEYWORD',
            severity: 'CRITICAL',
            message: `Directional contradiction: Source question uses "${neg}" but social metadata uses "${pos}".`,
            originalFragment: neg,
            mutatedFragment: pos,
          });
        }
      }
    }

    // 6. FINAL COMPILATION
    const hasCriticalViolation = violations.some((v) => v.severity === 'CRITICAL');
    let status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW' = 'VALID';

    if (hasCriticalViolation) {
      status = 'INVALID';
    } else if (warnings.length > 0 || sourceStatus === QuestionValidationStatus.NEEDS_REVIEW) {
      status = 'NEEDS_REVIEW';
    }

    return {
      status,
      isValid: status === 'VALID',
      sourceQuestionValidationStatus: sourceStatus,
      preservedAnchorsCount: anchors.filter((a) => a.status === 'PRESERVED').length,
      mutatedAnchorsCount: violations.length,
      violations,
      warnings,
      anchors,
      checkedAt,
    };
  }

  // Helper Methods for Deterministic Anchor Extraction

  private static extractNumbers(text: string): string[] {
    const matches = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
    // Deduplicate and filter single-digit index numbers if isolated
    return Array.from(new Set(matches)).filter((n) => n.length > 0);
  }

  private static extractPercentages(text: string): string[] {
    const matches = text.match(/\b\d+(?:\.\d+)?\s*%/g) || [];
    return Array.from(new Set(matches));
  }

  private static extractCurrencies(text: string): string[] {
    const matches = text.match(/(?:₹|Rs\.?|\$)\s*\d+(?:,\d+)*(?:\.\d+)?|\b\d+\s*(?:rupees|dollars)\b/gi) || [];
    return Array.from(new Set(matches));
  }

  private static extractUnits(text: string): string[] {
    const matches = text.match(/\b\d+(?:\.\d+)?\s*(?:km\/h|m\/s|km|meters|meter|m|kg|grams|gram|g|liters|litres|hours|hour|hr|hrs|minutes|minute|min|mins|seconds|second|sec|secs)\b/gi) || [];
    return Array.from(new Set(matches));
  }
}
