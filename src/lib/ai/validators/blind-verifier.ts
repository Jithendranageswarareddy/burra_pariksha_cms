/**
 * BURRA PARIKSHA CMS - Independent Blind Mathematical Verifier
 * Phase QS-18B: Independent Mathematical Verification Gate
 * 
 * Principle:
 * 1. AI generates a candidate.
 * 2. Deterministic validation checks deterministic constraints.
 * 3. Blind verifier independently derives the mathematical solution from ONLY the problem statement.
 * 4. The verifier NEVER sees or trusts candidate.options, candidate.correct_answer, or candidate.explanation.
 * 5. Orchestration compares the derived result against candidate options, declared answer, and explanation.
 * 6. Human review remains authoritative. AI cannot auto-approve or publish.
 */

import { QuestionLanguage } from '../../../types';
import { QuestionCandidate } from '../types';
import { geminiClient } from '../gemini.client';
import { DEFAULT_AI_CONFIG } from '../config';
import { classifyAIError } from '../error';
import { MathVerificationResult } from './mathematical.validator';

export interface BlindVerificationRequest {
  problemText: string;
  language?: QuestionLanguage | string;
  topicName?: string;
  subtopicName?: string;
}

export interface BlindVerificationDerivedResult {
  solvable: boolean;
  isNumerical: boolean;
  expectedValue?: number | string;
  expectedUnit?: string;
  confidence: number;
  briefDerivation?: string;
  unverifiedReason?: string;
}

export interface BlindVerifierProvider {
  readonly providerId: string;
  verifyBlindly(request: BlindVerificationRequest): Promise<BlindVerificationDerivedResult>;
}

export const BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION = `You are an expert independent mathematician and competitive aptitude problem solver for Burra Pariksha CMS.
Your task is to independently solve the given aptitude problem statement from first principles.

CRITICAL MANDATES:
1. You are given ONLY the problem statement text. You do NOT have access to options, declared answers, or candidate explanations.
2. Read all constraints, numbers, and units carefully (supports Telugu script, Arabic numerals, and English).
3. If the problem is purely qualitative or verbal (e.g., verbal reasoning, blood relations, non-quantitative), return isNumerical=false, solvable=true, confidence=1.0.
4. If the problem is quantitative/numerical:
   - Compute the exact mathematical solution step-by-step.
   - Pay strict attention to multi-segment journeys, combined rates, percentages, simple/compound interest, ratios, and unit conversions (km/h <-> m/s, minutes <-> hours).
   - Format expectedValue as the exact decimal or integer string (e.g. "52.5" or "30" or "120").
   - Format expectedUnit as standard unit if applicable (e.g. "km/h", "seconds", "%", "₹", "days", "meters").
   - Set isNumerical=true, solvable=true, and provide an honest confidence score (0.0 to 1.0).
5. If the problem lacks critical numbers, contains contradictory premises, or is physically impossible, set solvable=false, confidence=0.0, and specify unverifiedReason.
6. Return ONLY valid JSON matching the requested schema.`;

export const GenAiBlindSolverResponseSchema = {
  type: 'OBJECT',
  properties: {
    solvable: {
      type: 'BOOLEAN',
      description: 'Whether the problem statement contains sufficient information to derive a unique answer.',
    },
    isNumerical: {
      type: 'BOOLEAN',
      description: 'Whether the problem requires quantitative or arithmetical calculation.',
    },
    expectedValue: {
      type: 'STRING',
      description: 'The exact calculated final numeric or symbolic value (e.g. "52.5" or "40").',
    },
    expectedUnit: {
      type: 'STRING',
      description: 'Unit of the calculated value (e.g. km/h, seconds, %, rupees, days).',
    },
    confidence: {
      type: 'NUMBER',
      description: 'Confidence score between 0.0 and 1.0.',
    },
    briefDerivation: {
      type: 'STRING',
      description: 'Brief 1-2 sentence step-by-step arithmetic derivation.',
    },
    unverifiedReason: {
      type: 'STRING',
      description: 'Reason why problem could not be solved if solvable is false or confidence is low.',
    },
  },
  required: ['solvable', 'isNumerical', 'confidence'],
};

function parseTimeStringToMinutes(str: string): number | null {
  if (!str) return null;
  const m = str.match(/\b(\d{1,2}):(\d{2})(?:\s*(AM|PM|ఏఎం|పీఎం))?\b/i);
  if (!m) return null;
  let hrs = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const ampm = m[3] ? m[3].toUpperCase() : null;
  if (ampm === 'PM' || ampm === 'పీఎం') {
    if (hrs < 12) hrs += 12;
  } else if (ampm === 'AM' || ampm === 'ఏఎం') {
    if (hrs === 12) hrs = 0;
  }
  return hrs * 60 + mins;
}

/**
 * Extracts numeric numbers from an option string.
 */
function extractOptionNumbers(text: string): number[] {
  if (!text) return [];
  const timeMins = parseTimeStringToMinutes(text);
  const cleaned = text.replace(/(\d),(\d)/g, '$1$2').replace(/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM|ఏఎం|పీఎం))?\b/gi, '');
  const nums: number[] = [];
  if (timeMins !== null) nums.push(timeMins);

  // Check for fractions like 1/15, 3/4
  const fractionRegex = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
  let fracMatch: RegExpExecArray | null;
  while ((fracMatch = fractionRegex.exec(cleaned)) !== null) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      nums.push(num / den);
    }
  }

  // Remove fractions before extracting standalone numbers so numerator/denominator aren't treated as isolated numbers
  const textWithoutFractions = cleaned.replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g, ' ');
  const matches = textWithoutFractions.match(/-?\d+(?:\.\d+)?/g);
  if (matches) {
    matches.forEach((m) => {
      const parsed = parseFloat(m);
      if (!isNaN(parsed)) nums.push(parsed);
    });
  }
  return nums;
}

/**
 * Checks if option contains the expected numeric value within tolerance.
 */
function optionMatchesValue(optionText: string, expectedVal: number, expectedUnit?: string, tolerance = 1e-2): boolean {
  const optionTimeMins = parseTimeStringToMinutes(optionText);
  if (optionTimeMins !== null && Math.abs(optionTimeMins - expectedVal) <= tolerance) {
    return true;
  }

  const nums = extractOptionNumbers(optionText);
  for (const n of nums) {
    if (
      Math.abs(n - expectedVal) <= tolerance ||
      (expectedVal !== 0 && Math.abs((n - expectedVal) / expectedVal) <= 0.005)
    ) {
      return true;
    }

    // Unit conversions support (seconds <-> minutes, minutes <-> hours, meters <-> km, m/s <-> km/h)
    if (expectedUnit) {
      const u = expectedUnit.toLowerCase();
      const optLower = optionText.toLowerCase();

      // Seconds <-> Minutes (e.g. 360 seconds <-> 6 minutes)
      if (u.includes('second') || u === 's' || u === 'sec' || u === 'secs') {
        if (optLower.includes('min') || optLower.includes('minute')) {
          if (Math.abs(n * 60 - expectedVal) <= tolerance || Math.abs(n - expectedVal / 60) <= tolerance) return true;
        }
      }
      // Minutes <-> Hours (e.g. 90 minutes <-> 1.5 hours)
      if (u.includes('minute') || u === 'min' || u === 'mins') {
        if (optLower.includes('hour') || optLower.includes('hr') || optLower.includes('hrs')) {
          if (Math.abs(n * 60 - expectedVal) <= tolerance || Math.abs(n - expectedVal / 60) <= tolerance) return true;
        }
      }
      // Meters <-> Kilometers
      if (u === 'm' || u.includes('meter') || u.includes('metres')) {
        if (optLower.includes('km') || optLower.includes('kilometer')) {
          if (Math.abs(n * 1000 - expectedVal) <= tolerance || Math.abs(n - expectedVal / 1000) <= tolerance) return true;
        }
      }
      // m/s <-> km/h
      if (u.includes('m/s')) {
        if (optLower.includes('km/h') || optLower.includes('kmph')) {
          if (Math.abs(n / 3.6 - expectedVal) <= tolerance || Math.abs(n - expectedVal * 3.6) <= tolerance) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Clean numeric string into a float.
 */
function cleanNumber(str: string): number | null {
  if (!str) return null;
  const timeMins = parseTimeStringToMinutes(str);
  if (timeMins !== null) return timeMins;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Compares an independently derived blind result against candidate options, declared answer, and explanation.
 */
export function evaluateBlindDerivedResult(
  derived: BlindVerificationDerivedResult,
  candidate: Partial<QuestionCandidate>
): MathVerificationResult {
  if (!derived.isNumerical) {
    return {
      status: 'NOT_APPLICABLE',
      problemType: 'Qualitative / Non-Numerical',
      reason: 'Non-numerical question (verbal reasoning or qualitative concept)',
    };
  }

  if (
    !derived.solvable ||
    derived.confidence < 0.6 ||
    derived.expectedValue === undefined ||
    derived.expectedValue === null ||
    String(derived.expectedValue).trim() === ''
  ) {
    return {
      status: 'UNVERIFIED',
      problemType: 'Complex Numerical Problem',
      reason: derived.unverifiedReason || 'Blind solver could not derive a confident unique solution. Human review is required.',
    };
  }

  const expectedVal = cleanNumber(String(derived.expectedValue));
  const expectedUnit = derived.expectedUnit || '';
  const details = derived.briefDerivation || `Independently derived: ${derived.expectedValue} ${expectedUnit}`.trim();

  // If numerical value could not be parsed as float, fallback to string matching
  if (expectedVal === null) {
    const expectedStr = String(derived.expectedValue).trim().toLowerCase();
    const rawOpts: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: (candidate.option_a || '').trim().toLowerCase(),
      B: (candidate.option_b || '').trim().toLowerCase(),
      C: (candidate.option_c || '').trim().toLowerCase(),
      D: (candidate.option_d || '').trim().toLowerCase(),
    };

    const matchedKeys: ('A' | 'B' | 'C' | 'D')[] = [];
    (['A', 'B', 'C', 'D'] as const).forEach((k) => {
      if (rawOpts[k] && rawOpts[k] === expectedStr) {
        matchedKeys.push(k);
      }
    });

    if (matchedKeys.length === 0) {
      return {
        status: 'FAILED',
        problemType: 'Blind AI Mathematical Solver',
        expectedValue: derived.expectedValue,
        expectedUnit,
        details,
        reason: `Independent Mathematical Error: Blind verification derived "${derived.expectedValue}", but none of the candidate options match this value.`,
      };
    }

    if (matchedKeys.length > 1) {
      return {
        status: 'FAILED',
        problemType: 'Blind AI Mathematical Solver',
        expectedValue: derived.expectedValue,
        expectedUnit,
        allMatchedOptions: matchedKeys,
        details,
        reason: `Ambiguous options: Blind verification result matches multiple candidate options (${matchedKeys.join(', ')}).`,
      };
    }

    const singleMatch = matchedKeys[0];
    if (candidate.correct_answer && candidate.correct_answer !== singleMatch) {
      return {
        status: 'FAILED',
        problemType: 'Blind AI Mathematical Solver',
        expectedValue: derived.expectedValue,
        expectedUnit,
        matchedOption: singleMatch,
        details,
        reason: `Independent Mathematical Contradiction: Blind verification proves Option ${singleMatch} is correct, but candidate declared Option ${candidate.correct_answer} as correct.`,
      };
    }

    return {
      status: 'VERIFIED',
      problemType: 'Blind AI Mathematical Solver',
      expectedValue: derived.expectedValue,
      expectedUnit,
      matchedOption: singleMatch,
      allMatchedOptions: [singleMatch],
      details,
    };
  }

  // Numerical comparison
  const optionsMap: Record<'A' | 'B' | 'C' | 'D', string> = {
    A: candidate.option_a || '',
    B: candidate.option_b || '',
    C: candidate.option_c || '',
    D: candidate.option_d || '',
  };

  const matchedOptions: ('A' | 'B' | 'C' | 'D')[] = [];
  (['A', 'B', 'C', 'D'] as const).forEach((optKey) => {
    if (optionMatchesValue(optionsMap[optKey], expectedVal, expectedUnit)) {
      matchedOptions.push(optKey);
    }
  });

  // Case 1: No option matches
  if (matchedOptions.length === 0) {
    return {
      status: 'FAILED',
      problemType: 'Blind AI Mathematical Solver',
      expectedValue: expectedVal,
      expectedUnit,
      details,
      reason: `Independent Mathematical Error: Blind verification independently derived ${expectedVal}${expectedUnit ? ' ' + expectedUnit : ''}, but none of the 4 candidate options match this calculated value.`,
    };
  }

  // Case 2: Multiple options match
  if (matchedOptions.length > 1) {
    return {
      status: 'FAILED',
      problemType: 'Blind AI Mathematical Solver',
      expectedValue: expectedVal,
      expectedUnit,
      allMatchedOptions: matchedOptions,
      details,
      reason: `Ambiguous options: Calculated answer (${expectedVal}) matches multiple candidate options (${matchedOptions.join(', ')}). Options must be distinct.`,
    };
  }

  // Case 3: Exactly 1 option matches
  const singleMatched = matchedOptions[0];
  const declaredAnswer = candidate.correct_answer;

  if (declaredAnswer && declaredAnswer !== singleMatched) {
    return {
      status: 'FAILED',
      problemType: 'Blind AI Mathematical Solver',
      expectedValue: expectedVal,
      expectedUnit,
      matchedOption: singleMatched,
      details,
      reason: `Independent Mathematical Contradiction: Blind verification proves the correct answer is ${expectedVal}${expectedUnit ? ' ' + expectedUnit : ''} (Option ${singleMatched}), but candidate declared Option ${declaredAnswer} as correct.`,
    };
  }

  // Check if explanation explicitly contradicts the derived answer
  if (candidate.explanation) {
    const exp = candidate.explanation;
    const contradictionMatches = [
      /(?:option|ఆప్షన్|సమాధానం)\s*[:\-\(=]?\s*([A-D])\s+(?:is\s+correct|సరైనది|సరైన\s+సమాధానం|అవుతుంది)/i,
      /(?:therefore|hence|correct\s+answer\s+is|సరియైన\s+జవాబు|జవాబు)\s+(?:option\s*|ఆప్షన్\s*)?[:\-\(=]?\s*([A-D])\b/i,
      /\bAnswer\s*[:\-=]\s*([A-D])\b/i,
    ];
    for (const r of contradictionMatches) {
      const m = exp.match(r);
      if (m && m[1]) {
        const declaredInExp = m[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (declaredInExp !== singleMatched && ['A', 'B', 'C', 'D'].includes(declaredInExp)) {
          return {
            status: 'FAILED',
            problemType: 'Blind AI Mathematical Solver',
            expectedValue: expectedVal,
            expectedUnit,
            matchedOption: singleMatched,
            details,
            reason: `Explanation Contradiction: Independent verification proves Option ${singleMatched} (${expectedVal}${expectedUnit ? ' ' + expectedUnit : ''}) is correct, but explanation concludes Option ${declaredInExp} is correct.`,
          };
        }
      }
    }
  }

  return {
    status: 'VERIFIED',
    problemType: 'Blind AI Mathematical Solver',
    expectedValue: expectedVal,
    expectedUnit,
    matchedOption: singleMatched,
    allMatchedOptions: [singleMatched],
    details,
  };
}

/**
 * Production Gemini Blind Verifier Provider.
 * Sends ONLY the problem text to Gemini to derive the solution blindly.
 */
export class GeminiBlindVerifierProvider implements BlindVerifierProvider {
  public readonly providerId: string = 'gemini-blind-verifier';
  private readonly modelId: string;

  constructor(modelId?: string) {
    this.modelId = modelId || DEFAULT_AI_CONFIG.defaultModel;
  }

  public async verifyBlindly(request: BlindVerificationRequest): Promise<BlindVerificationDerivedResult> {
    const { problemText, language, topicName, subtopicName } = request;

    if (!problemText || problemText.trim().length === 0) {
      return {
        solvable: false,
        isNumerical: false,
        confidence: 0,
        unverifiedReason: 'Empty problem statement provided.',
      };
    }

    if (!geminiClient.isConfigured()) {
      return {
        solvable: false,
        isNumerical: true,
        confidence: 0,
        unverifiedReason: 'Gemini API is not configured for blind verification.',
      };
    }

    const client = geminiClient.getClient();
    if (!client) {
      return {
        solvable: false,
        isNumerical: true,
        confidence: 0,
        unverifiedReason: 'Gemini client instance unavailable.',
      };
    }

    const prompt = `Please independently solve the following competitive aptitude problem statement from first principles.
Do NOT assume any options. Read all quantities and conditions carefully.

Problem Statement:
"""
${problemText}
"""

Context:
- Language: ${language || 'TELUGU / ENGLISH'}
- Topic: ${topicName || 'Aptitude'}
- Subtopic: ${subtopicName || 'Numerical'}

Return your structured blind derivation JSON.`;

    try {
      const response = await client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GenAiBlindSolverResponseSchema as any,
          temperature: 0.0, // Zero temperature for maximum deterministic accuracy
        },
      });

      const text = response.text || '';
      if (!text) {
        throw new Error('Empty response from blind solver.');
      }

      const parsed = JSON.parse(text);
      return {
        solvable: parsed.solvable !== false,
        isNumerical: parsed.isNumerical !== false,
        expectedValue: parsed.expectedValue,
        expectedUnit: parsed.expectedUnit,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        briefDerivation: parsed.briefDerivation,
        unverifiedReason: parsed.unverifiedReason,
      };
    } catch (err: any) {
      const classified = classifyAIError(err);
      return {
        solvable: false,
        isNumerical: true,
        confidence: 0,
        unverifiedReason: `Blind solver exception: ${classified.sanitizedMessage}`,
      };
    }
  }
}

/**
 * Mock / Testing Blind Verifier Provider.
 */
export class MockBlindVerifierProvider implements BlindVerifierProvider {
  public readonly providerId: string = 'mock-blind-verifier';
  private readonly handler?: (req: BlindVerificationRequest) => BlindVerificationDerivedResult | Promise<BlindVerificationDerivedResult>;

  constructor(
    handler?: (req: BlindVerificationRequest) => BlindVerificationDerivedResult | Promise<BlindVerificationDerivedResult>
  ) {
    this.handler = handler;
  }

  public async verifyBlindly(request: BlindVerificationRequest): Promise<BlindVerificationDerivedResult> {
    if (this.handler) {
      return this.handler(request);
    }
    return {
      solvable: true,
      isNumerical: true,
      expectedValue: 52.5,
      expectedUnit: 'km/h',
      confidence: 0.95,
      briefDerivation: '60km - (45km/h * 0.75h) = 26.25km in 0.5h = 52.5 km/h',
    };
  }
}
