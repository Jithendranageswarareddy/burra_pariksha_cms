/**
 * BURRA PARIKSHA CMS - Script & Hook Production Validator
 * Enforces strict quality and safety invariance rules on script candidates.
 */

import { Question, Script } from '../../types';

export interface ScriptValidationReport {
  isValid: boolean;
  errors: string[];
}

export class ScriptValidator {
  /**
   * Verifies that the generated script candidate complies with all safety,
   * quality, and invariance constraints relative to its source question.
   */
  public static validate(question: Question, script: Partial<Script>): ScriptValidationReport {
    const errors: string[] = [];

    // 1. Content ID unchanged
    if (script.contentId && script.contentId !== question.contentMasterId && script.contentId !== (question as any).contentId) {
      errors.push(`Invariance Violation: Content ID mismatch. Question Content ID: "${question.contentMasterId || (question as any).contentId}", Script Content ID: "${script.contentId}"`);
    }

    // 2. Question ID unchanged
    if (script.questionId && script.questionId !== question.id) {
      errors.push(`Invariance Violation: Question ID mismatch. Question ID: "${question.id}", Script Question ID: "${script.questionId}"`);
    }

    // 3. Required sections exist
    if (!script.hookText || script.hookText.trim().length === 0) {
      errors.push('Missing Section: Script is missing the required "Hook" text.');
    }
    if (!script.problemStatement || script.problemStatement.trim().length === 0) {
      errors.push('Missing Section: Script is missing the required "Spoken Question Narration" (problem statement).');
    }
    if (!script.stepByStepSolution || script.stepByStepSolution.trim().length === 0) {
      errors.push('Missing Section: Script is missing the required "Answer Reveal & Solution" section.');
    }
    if (!script.speedTrickOrTakeaway || script.speedTrickOrTakeaway.trim().length === 0) {
      errors.push('Missing Section: Script is missing the required "Retention Structure / Speed Trick" section.');
    }
    if (!script.callToAction || script.callToAction.trim().length === 0) {
      errors.push('Missing Section: Script is missing the required "CTA" section.');
    }

    // 4. Correct answer matches source question (No answer change)
    const normalizedCorrectAnswer = String(question.correctAnswer || '').trim().toUpperCase();
    if (normalizedCorrectAnswer) {
      const solutionText = String(script.stepByStepSolution || '').toUpperCase();
      const trickText = String(script.speedTrickOrTakeaway || '').toUpperCase();

      const validPatterns = [
        `OPTION ${normalizedCorrectAnswer}`,
        `ఆప్షన్ ${normalizedCorrectAnswer}`,
        `(${normalizedCorrectAnswer})`,
        ` ${normalizedCorrectAnswer})`,
        ` ${normalizedCorrectAnswer}.`,
        ` ${normalizedCorrectAnswer} `,
        `ఆప్షన్ (${normalizedCorrectAnswer})`
      ];

      const optionsMap: any = { A: question.options?.a, B: question.options?.b, C: question.options?.c, D: question.options?.d };
      const correctText = optionsMap[normalizedCorrectAnswer] ? String(optionsMap[normalizedCorrectAnswer]).trim().toUpperCase() : null;

      const checkIncludes = (text: string) => {
        if (validPatterns.some(p => text.includes(p))) return true;
        if (correctText && correctText.length > 0 && text.includes(correctText)) return true;
        return false;
      };

      const inSolution = checkIncludes(solutionText);
      const inTrick = checkIncludes(trickText);

      if (!inSolution && !inTrick) {
        errors.push(`Correct Answer Verification Failure: Script must clearly refer to correct option "${normalizedCorrectAnswer}" or its explicit value.`);
      }
    }

    // 5. No answer leakage in the hook
    if (script.hookText && normalizedCorrectAnswer) {
      const hookUpper = script.hookText.toUpperCase();
      const leakagePatterns = [
        `ANSWER IS ${normalizedCorrectAnswer}`,
        `OPTION ${normalizedCorrectAnswer}`,
        `సమాధానం ${normalizedCorrectAnswer}`,
        `ఆప్షన్ ${normalizedCorrectAnswer}`
      ];
      for (const pattern of leakagePatterns) {
        if (hookUpper.includes(pattern)) {
          errors.push(`Answer Leakage: Hook contains answer pattern "${pattern}". Answer must not be leaked in the hook.`);
        }
      }
    }

    // 6. Options remain represented correctly where needed
    const options = question.options || {};
    const problemText = (script.problemStatement || '').toLowerCase();
    
    if (options.a && !problemText.includes('ఎ') && !problemText.includes('a')) {
      errors.push('Options Representation Warning: Spoken question narration should list options for audience participation.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Backward-compatibility aliases
