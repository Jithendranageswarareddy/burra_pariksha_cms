/**
 * BURRA PARIKSHA CMS - Script Validator & Sanity Checks
 * Phase 6: Script Generation & Teleprompter Workspace
 * 
 * Performs deterministic and pedagogical checks on generated Telugu scripts:
 * - Natural spoken Telugu script detection (Telugu Unicode block)
 * - Clear question presentation
 * - Options formatted with Telugu labels (ఎ, బి, సి, డి)
 * - Answer interaction and call to action
 * - Output format integrity
 */

import { TeluguScriptZodSchema } from '../schemas/script-generation.schema';
import { ScriptContentPayload } from '../../services/script.service';

export interface ScriptValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    totalWords: number;
    estimatedSeconds: number;
    hasTeluguUnicode: boolean;
    hasTeluguOptionLabels: boolean;
    hasInteractionCta: boolean;
  };
}

export class ScriptValidator {
  /**
   * Validates a Telugu script payload for teleprompter readiness.
   */
  public static validate(payload: Partial<ScriptContentPayload>): ScriptValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Zod Schema Verification
    const zodResult = TeluguScriptZodSchema.safeParse(payload);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        errors.push(`${issue.path.join('.') || 'Script'}: ${issue.message}`);
      }
    }

    const {
      hookText = '',
      problemStatement = '',
      stepByStepSolution = '',
      speedTrickOrTakeaway = '',
      callToAction = '',
    } = payload;

    const fullScriptText = `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;
    const words = fullScriptText.trim().split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    const estimatedSeconds = Math.round((totalWords / 140) * 60);

    // 2. Natural spoken Telugu presence (Unicode range U+0C00 - U+0C7F)
    const teluguRegex = /[\u0C00-\u0C7F]/;
    const hasTeluguUnicode = teluguRegex.test(fullScriptText);
    if (!hasTeluguUnicode) {
      warnings.push('Script does not contain Telugu Unicode characters. Ensure Telugu spoken narration is provided.');
    }

    // 3. Telugu Option Labels Verification (ఎ, బి, సి, డి)
    const hasTeluguOptionA = problemStatement.includes('ఎ') || hookText.includes('ఎ');
    const hasTeluguOptionB = problemStatement.includes('బి') || hookText.includes('బి');
    const hasTeluguOptionC = problemStatement.includes('సి') || hookText.includes('సి');
    const hasTeluguOptionD = problemStatement.includes('డి') || hookText.includes('డి');

    const hasTeluguOptionLabels = hasTeluguOptionA && hasTeluguOptionB && hasTeluguOptionC && hasTeluguOptionD;
    if (!hasTeluguOptionLabels) {
      warnings.push('Options should ideally be presented with Telugu labels: ఎ, బి, సి, డి.');
    }

    // 4. Answer interaction / CTA presence
    const ctaLower = (callToAction + ' ' + hookText).toLowerCase();
    const hasInteractionCta =
      ctaLower.includes('comment') ||
      ctaLower.includes('కామెంట్') ||
      ctaLower.includes('share') ||
      ctaLower.includes('షేర్') ||
      ctaLower.includes('follow') ||
      ctaLower.includes('ఫాలో') ||
      ctaLower.includes('ఆన్సర్') ||
      ctaLower.includes('సమాధానం') ||
      ctaLower.includes('burra') ||
      ctaLower.includes('బుర్ర');

    if (!hasInteractionCta) {
      warnings.push('Script is missing an explicit answer interaction prompt or call-to-action.');
    }

    // 5. Teleprompter pacing & length checks
    if (estimatedSeconds > 75) {
      warnings.push(`Script estimated duration is ${estimatedSeconds}s (over 60s target for short-form Reels/Shorts). Consider trimming.`);
    } else if (estimatedSeconds < 15 && totalWords > 0) {
      warnings.push(`Script is very brief (~${estimatedSeconds}s). Ensure problem and solution details are adequately explained.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        totalWords,
        estimatedSeconds,
        hasTeluguUnicode,
        hasTeluguOptionLabels,
        hasInteractionCta,
      },
    };
  }
}
