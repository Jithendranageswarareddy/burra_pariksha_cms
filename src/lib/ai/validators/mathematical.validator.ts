/**
 * BURRA PARIKSHA CMS - Independent Mathematical Validator
 * Task 3B.1: Deterministic Aptitude Problem Solver & Verification Gate
 * 
 * Provides independent, deterministic mathematical verification of numerical aptitude
 * questions without relying on LLM explanation text.
 * 
 * Supported Problem Archetypes:
 * 1. Time, Speed & Distance / Unit Conversions (km/h <-> m/s, train crossing platform/person/cyclist)
 * 2. Relative Speed (same / opposite direction)
 * 3. Average Speed across Equal Distances (Harmonic Mean)
 * 4. Percentage Increase / Decrease / Successive Discounts & Profit-Loss Markup
 * 5. Simple Interest (P * R * T / 100) & Amount
 * 6. Combined Work Rate (Time & Work)
 * 7. Proportional Sharing & Ratios
 * 8. Basic Arithmetic & Discrete Operations
 */

import { QuestionCandidate } from '../types';

export type MathVerificationStatus = 'VERIFIED' | 'FAILED' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export interface MathVerificationResult {
  status: MathVerificationStatus;
  problemType?: string;
  expectedValue?: number | string;
  expectedUnit?: string;
  matchedOption?: 'A' | 'B' | 'C' | 'D';
  allMatchedOptions?: ('A' | 'B' | 'C' | 'D')[];
  reason?: string;
  details?: string;
  calculationSteps?: string[];
}

/**
 * Normalizes text and extracts numbers.
 */
function cleanNumber(str: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extracts all numeric values from an option text.
 */
function extractOptionNumbers(text: string): number[] {
  if (!text) return [];
  const cleaned = text.replace(/(\d),(\d)/g, '$1$2');
  const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n));
}

/**
 * Checks if option contains the expected numeric value within numerical tolerance.
 */
function optionMatchesValue(optionText: string, expectedVal: number, tolerance = 1e-2): boolean {
  const nums = extractOptionNumbers(optionText);
  for (const n of nums) {
    if (Math.abs(n - expectedVal) <= tolerance || (expectedVal !== 0 && Math.abs((n - expectedVal) / expectedVal) <= 0.005)) {
      return true;
    }
  }
  return false;
}

export class MathematicalValidator {
  /**
   * Independently evaluates the mathematical validity of a candidate question.
   */
  public static verify(candidate: Partial<QuestionCandidate>): MathVerificationResult {
    const content = candidate.content || '';
    const optionA = candidate.option_a || '';
    const optionB = candidate.option_b || '';
    const optionC = candidate.option_c || '';
    const optionD = candidate.option_d || '';
    const declaredAnswer = candidate.correct_answer;

    const optionsMap: Record<'A' | 'B' | 'C' | 'D', string> = {
      A: optionA,
      B: optionB,
      C: optionC,
      D: optionD,
    };

    // Check if question is purely non-numerical (e.g. Verbal Ability, Blood Relations, Seating)
    const hasNumbersInContent = /\d+/.test(content);
    const hasNumbersInOptions = ['A', 'B', 'C', 'D'].some((k) => /\d+/.test(optionsMap[k as 'A' | 'B' | 'C' | 'D']));

    if (!hasNumbersInContent && !hasNumbersInOptions) {
      return {
        status: 'NOT_APPLICABLE',
        reason: 'Non-numerical question (verbal reasoning or logical concept)',
      };
    }

    // Try solver engines in sequence
    const solvers = [
      MathematicalValidator.solveTrainPlatformProblem,
      MathematicalValidator.solveTrainRelativeSpeedProblem,
      MathematicalValidator.solveAverageSpeedHarmonicMean,
      MathematicalValidator.solveSpeedDistanceTimeDirect,
      MathematicalValidator.solveDirectUnitConversion,
      MathematicalValidator.solvePercentageChangeProblem,
      MathematicalValidator.solveMarkupAndDiscountProfitLoss,
      MathematicalValidator.solveSuccessiveDiscountMarkedPrice,
      MathematicalValidator.solveSimpleInterestProblem,
      MathematicalValidator.solveTimeAndWorkProblem,
      MathematicalValidator.solveRatioSharingProblem,
      MathematicalValidator.solveBasicArithmeticProblem,
    ];

    for (const solver of solvers) {
      const solution = solver(content);
      if (solution) {
        return MathematicalValidator.evaluateSolution(solution, optionsMap, declaredAnswer);
      }
    }

    // If numerical but no solver matched pattern
    return {
      status: 'UNVERIFIED',
      reason: 'Complex or unmodeled numerical problem structure requires human review',
    };
  }

  /**
   * Compares calculated solution against options and declared answer.
   */
  private static evaluateSolution(
    solution: {
      problemType: string;
      expectedValue: number;
      expectedUnit?: string;
      details: string;
      steps: string[];
    },
    optionsMap: Record<'A' | 'B' | 'C' | 'D', string>,
    declaredAnswer?: 'A' | 'B' | 'C' | 'D'
  ): MathVerificationResult {
    const { expectedValue, expectedUnit, problemType, details, steps } = solution;

    const matchedOptions: ('A' | 'B' | 'C' | 'D')[] = [];
    (['A', 'B', 'C', 'D'] as const).forEach((optKey) => {
      if (optionMatchesValue(optionsMap[optKey], expectedValue)) {
        matchedOptions.push(optKey);
      }
    });

    // Case 1: No option matches
    if (matchedOptions.length === 0) {
      return {
        status: 'FAILED',
        problemType,
        expectedValue,
        expectedUnit,
        details,
        calculationSteps: steps,
        reason: `Deterministic Mathematical Error: Independent calculation yielded ${expectedValue}${expectedUnit ? ' ' + expectedUnit : ''}, but none of the 4 options match this calculated value.`,
      };
    }

    // Case 2: Multiple options match the same expected value
    if (matchedOptions.length > 1) {
      return {
        status: 'FAILED',
        problemType,
        expectedValue,
        expectedUnit,
        allMatchedOptions: matchedOptions,
        details,
        calculationSteps: steps,
        reason: `Ambiguous options: Calculated answer (${expectedValue}) matches multiple options (${matchedOptions.join(', ')}). Options must be distinct.`,
      };
    }

    // Case 3: Exactly 1 option matches
    const singleMatched = matchedOptions[0];

    // Check against declared correct_answer
    if (declaredAnswer && declaredAnswer !== singleMatched) {
      return {
        status: 'FAILED',
        problemType,
        expectedValue,
        expectedUnit,
        matchedOption: singleMatched,
        details,
        calculationSteps: steps,
        reason: `Deterministic Mathematical Contradiction: Independent calculation proves the correct answer is ${expectedValue}${expectedUnit ? ' ' + expectedUnit : ''} (Option ${singleMatched}), but candidate declared Option ${declaredAnswer} as correct.`,
      };
    }

    return {
      status: 'VERIFIED',
      problemType,
      expectedValue,
      expectedUnit,
      matchedOption: singleMatched,
      allMatchedOptions: [singleMatched],
      details,
      calculationSteps: steps,
    };
  }

  // =========================================================================
  // SOLVER 1: Train Crossing Platform & Person (Speed in km/h)
  // =========================================================================
  private static solveTrainPlatformProblem(content: string) {
    // English: "train ... [platformLength] m ... platform in [t1] s ... person/pole in [t2] s ... speed"
    // Telugu: "రైలు [P] మీటర్ల ... ప్లాట్‌ఫారమ్‌ను [T1] సెకన్లలో ... వ్యక్తిని [T2] సెకన్లలో ... వేగం (కి.మీ/గం)"
    const platformMatch =
      content.match(/(\d+)\s*(?:meters?|మీటర్ల).*(?:platform|ప్లాట్‌ఫారమ్).*?(\d+)\s*(?:seconds?|సెకన్ల).*?(?:person|man|pole|వ్యక్తి).*?(\d+)\s*(?:seconds?|సెకన్ల)/i) ||
      content.match(/(?:platform|ప్లాట్‌ఫారమ్).*?(\d+)\s*(?:meters?|మీటర్ల).*?(\d+)\s*(?:seconds?|సెకన్ల).*?(?:person|man|pole|వ్యక్తి).*?(\d+)\s*(?:seconds?|సెకన్ల)/i);

    if (platformMatch) {
      const pLen = parseFloat(platformMatch[1]);
      const t1 = parseFloat(platformMatch[2]);
      const t2 = parseFloat(platformMatch[3]);

      if (t1 > t2 && t1 - t2 > 0) {
        const speedMs = pLen / (t1 - t2);
        const speedKmh = speedMs * 3.6; // * (18 / 5)

        return {
          problemType: 'Train Platform & Person Crossing Speed',
          expectedValue: Math.round(speedKmh * 100) / 100,
          expectedUnit: 'km/h',
          details: `Speed = Platform Length / (T_platform - T_person) = ${pLen} / (${t1} - ${t2}) = ${speedMs} m/s = ${speedKmh} km/h`,
          steps: [
            `Platform Length P = ${pLen} meters`,
            `Time to cross platform T1 = ${t1} s, Time to cross person T2 = ${t2} s`,
            `Time difference = ${t1 - t2} s`,
            `Speed in m/s = ${pLen} / ${t1 - t2} = ${speedMs} m/s`,
            `Speed in km/h = ${speedMs} * (18 / 5) = ${speedKmh} km/h`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 2: Train & Relative Speed Passing Cyclist/Person/Train
  // =========================================================================
  private static solveTrainRelativeSpeedProblem(content: string) {
    // English: "train ... length [L] m ... speed of [S1] km/h ... cyclist/person/train ... [S2] km/h ... (same direction | opposite direction)"
    // Telugu: "రైలు ... పొడవు [L] మీటర్ల ... [S1] కి.మీ/గం ... [S2] కి.మీ/గం ... (అదే దిశలో | వ్యతిరేక దిశలో)"
    const match =
      content.match(/(\d+)\s*(?:meters?|మీటర్ల).*?(\d+)\s*(?:km\/h|kmph|కి\.మీ\/గం).*?(\d+)\s*(?:km\/h|kmph|కి\.మీ\/గం)/i);

    if (match) {
      const length = parseFloat(match[1]);
      const s1 = parseFloat(match[2]);
      const s2 = parseFloat(match[3]);

      const isOpposite = /opposite\s+direction|వ్యతిరేక\s*దిశ/i.test(content);
      const isSame = /same\s+direction|అదే\s*దిశ/i.test(content) || !isOpposite;

      const relSpeedKmh = isOpposite ? s1 + s2 : Math.abs(s1 - s2);
      if (relSpeedKmh > 0) {
        const relSpeedMs = relSpeedKmh * (5 / 18);
        const timeSeconds = length / relSpeedMs;

        return {
          problemType: 'Train Relative Speed Passing Time',
          expectedValue: Math.round(timeSeconds * 100) / 100,
          expectedUnit: 'seconds',
          details: `Time = Length / Relative Speed = ${length} / (${relSpeedKmh} * 5/18) = ${timeSeconds} seconds`,
          steps: [
            `Train length L = ${length} meters`,
            `Speeds: S1 = ${s1} km/h, S2 = ${s2} km/h`,
            `Direction: ${isOpposite ? 'Opposite (S1 + S2)' : 'Same (S1 - S2)'} => Relative Speed = ${relSpeedKmh} km/h`,
            `Relative Speed in m/s = ${relSpeedKmh} * (5/18) = ${relSpeedMs} m/s`,
            `Time to pass = ${length} / ${relSpeedMs} = ${timeSeconds} seconds`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 3: Average Speed Harmonic Mean across Equal Distances
  // =========================================================================
  private static solveAverageSpeedHarmonicMean(content: string) {
    // English: "from [A] to [B] at [S1] km/h and returns ... at [S2] km/h ... average speed"
    // Telugu: "[S1] కి.మీ/గం వేగంతో వెళ్లి ... [S2] కి.మీ/గం వేగంతో ... సగటు వేగం"
    const hasAvgKeywords = /average\s+speed|సగటు\s+వేగం/i.test(content);
    const match = content.match(/(\d+)\s*(?:km\/h|kmph|కి\.మీ\/గం).*?(\d+)\s*(?:km\/h|kmph|కి\.మీ\/గం)/i);

    if (hasAvgKeywords && match) {
      const s1 = parseFloat(match[1]);
      const s2 = parseFloat(match[2]);

      if (s1 > 0 && s2 > 0) {
        const avgSpeed = (2 * s1 * s2) / (s1 + s2);
        return {
          problemType: 'Average Speed over Equal Distances (Harmonic Mean)',
          expectedValue: Math.round(avgSpeed * 100) / 100,
          expectedUnit: 'km/h',
          details: `Average Speed = 2 * ${s1} * ${s2} / (${s1} + ${s2}) = ${avgSpeed} km/h`,
          steps: [
            `Speed 1 = ${s1} km/h, Speed 2 = ${s2} km/h`,
            `Formula for equal distances: 2 * S1 * S2 / (S1 + S2)`,
            `Calculation: (2 * ${s1} * ${s2}) / (${s1 + s2}) = ${2 * s1 * s2} / ${s1 + s2} = ${avgSpeed} km/h`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 4: Speed * Time = Distance (Direct)
  // =========================================================================
  private static solveSpeedDistanceTimeDirect(content: string) {
    // English: "speed of [S] km/h ... [T] seconds ... how many meters"
    // Telugu: "[S] కి.మీ/గం వేగంతో ... [T] సెకన్లలో ... ఎన్ని మీటర్లు"
    const match = content.match(/(\d+)\s*(?:km\/h|kmph|కి\.మీ\/గం).*?(\d+)\s*(?:seconds?|సెకన్ల)/i);
    const asksMeters = /meters?|మీటర్లు|how\s+many\s+meters/i.test(content);

    if (match && asksMeters) {
      const speedKmh = parseFloat(match[1]);
      const timeSec = parseFloat(match[2]);

      const speedMs = speedKmh * (5 / 18);
      const distanceM = speedMs * timeSec;

      return {
        problemType: 'Distance Covered (Speed in km/h, Time in seconds)',
        expectedValue: Math.round(distanceM * 100) / 100,
        expectedUnit: 'meters',
        details: `Distance = (${speedKmh} * 5/18) * ${timeSec} = ${speedMs} * ${timeSec} = ${distanceM} meters`,
        steps: [
          `Speed = ${speedKmh} km/h = ${speedKmh} * (5/18) = ${speedMs} m/s`,
          `Time = ${timeSec} seconds`,
          `Distance = ${speedMs} * ${timeSec} = ${distanceM} meters`,
        ],
      };
    }
    return null;
  }

  // =========================================================================
  // SOLVER 5: Direct Unit Conversions (e.g. 54 km/h to m/s)
  // =========================================================================
  private static solveDirectUnitConversion(content: string) {
    // e.g. "convert 54 km/h to m/s" or "54 km/h = ? m/s" or "54 km/h in meters per second"
    const kmhToMs = content.match(/(\d+(?:\.\d+)?)\s*(?:km\/h|kmph|కి\.మీ\/గం).*?(?:m\/s|meters\s+per\s+second|మీ\/సె)/i);
    if (kmhToMs) {
      const kmh = parseFloat(kmhToMs[1]);
      const ms = kmh * (5 / 18);
      return {
        problemType: 'Unit Conversion (km/h to m/s)',
        expectedValue: Math.round(ms * 1000) / 1000,
        expectedUnit: 'm/s',
        details: `${kmh} km/h * (5/18) = ${ms} m/s`,
        steps: [`${kmh} km/h * (5 / 18) = ${ms} m/s`],
      };
    }

    const msToKmh = content.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|మీ\/సె).*?(?:km\/h|kmph|కి\.మీ\/గం)/i);
    if (msToKmh) {
      const ms = parseFloat(msToKmh[1]);
      const kmh = ms * (18 / 5);
      return {
        problemType: 'Unit Conversion (m/s to km/h)',
        expectedValue: Math.round(kmh * 1000) / 1000,
        expectedUnit: 'km/h',
        details: `${ms} m/s * (18/5) = ${kmh} km/h`,
        steps: [`${ms} m/s * (18 / 5) = ${kmh} km/h`],
      };
    }
    return null;
  }

  // =========================================================================
  // SOLVER 6: Percentage Increase / Decrease (e.g. 40 Lakhs to 65 Lakhs)
  // =========================================================================
  private static solvePercentageChangeProblem(content: string) {
    // English: "January (₹40 Lakhs) ... March (₹65 Lakhs) ... percentage increase"
    // Telugu: "జనవరి (₹40 లక్షలు) ... మార్చి (₹65 లక్షలు) ... పెరిగిన శాతం"
    const hasPctKeywords = /percentage\s+increase|percentage\s+growth|పెరిగిన\s+శాతం|శాతం\s+పెరుగుదల|increase\s+percentage/i.test(content);
    const match = content.match(/[₹Rs\.]*\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|crores?|లక్షలు|కోట్లు)?.*?(\d+(?:\.\d+)?)\s*(?:lakhs?|crores?|లక్షలు|కోట్లు)?/i);

    if (hasPctKeywords && match) {
      const v1 = parseFloat(match[1]);
      const v2 = parseFloat(match[2]);

      if (v1 > 0 && v2 > v1) {
        const pctChange = ((v2 - v1) / v1) * 100;
        return {
          problemType: 'Percentage Increase / Growth',
          expectedValue: Math.round(pctChange * 100) / 100,
          expectedUnit: '%',
          details: `(( ${v2} - ${v1} ) / ${v1} ) * 100 = (${v2 - v1} / ${v1}) * 100 = ${pctChange}%`,
          steps: [
            `Initial Value V1 = ${v1}, Final Value V2 = ${v2}`,
            `Absolute Increase = ${v2} - ${v1} = ${v2 - v1}`,
            `Percentage Increase = (${v2 - v1} / ${v1}) * 100 = ${pctChange}%`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 7: Markup and Discount Profit/Loss (Markup M%, Discount D%)
  // =========================================================================
  private static solveMarkupAndDiscountProfitLoss(content: string) {
    // English: "marks up ... [M]% ... discount of [D]% ... profit percentage"
    // Telugu: "[M]% ప్రకటన ధర పెంచి ... [D]% తగ్గింపు ... నికర లాభ శాతం"
    const hasProfitMarkup = /profit|లాభం|లాభ\s+శాతం/i.test(content) && /discount|డిస్కౌంట్|తగ్గింపు/i.test(content);
    const match = content.match(/(\d+(?:\.\d+)?)\s*%.*?(\d+(?:\.\d+)?)\s*%/i);

    if (hasProfitMarkup && match) {
      const markup = parseFloat(match[1]);
      const discount = parseFloat(match[2]);

      // Net profit % = M - D - (M*D/100)
      const netProfitPct = markup - discount - (markup * discount) / 100;
      return {
        problemType: 'Markup and Discount Net Profit Percentage',
        expectedValue: Math.round(netProfitPct * 100) / 100,
        expectedUnit: '%',
        details: `Net Profit % = Markup - Discount - (Markup * Discount / 100) = ${markup} - ${discount} - (${markup}*${discount}/100) = ${netProfitPct}%`,
        steps: [
          `Markup = ${markup}%, Discount = ${discount}%`,
          `Let Cost Price CP = 100 => Marked Price MP = ${100 + markup}`,
          `Selling Price SP = ${100 + markup} * (1 - ${discount}/100) = ${(100 + markup) * (1 - discount / 100)}`,
          `Profit % = SP - CP = ${netProfitPct}%`,
        ],
      };
    }
    return null;
  }

  // =========================================================================
  // SOLVER 8: Successive Discounts Marked Price Calculation
  // =========================================================================
  private static solveSuccessiveDiscountMarkedPrice(content: string) {
    // English: "successive discount ... 20% and 15% ... 5% instant cashback ... pays ₹32,300 ... marked price"
    const matchDiscounts = content.match(/(\d+)\s*%.*?(\d+)\s*%.*?(\d+)\s*%/i);
    const matchPaid = content.match(/[₹Rs\.]*\s*(\d{1,3}(?:,\d{3})+|\d{4,9})/i);

    if (matchDiscounts && matchPaid && /marked\s+price|original\s+price/i.test(content)) {
      const d1 = parseFloat(matchDiscounts[1]) / 100;
      const d2 = parseFloat(matchDiscounts[2]) / 100;
      const d3 = parseFloat(matchDiscounts[3]) / 100;
      const paid = cleanNumber(matchPaid[1]);

      if (paid && paid > 0) {
        const mult = (1 - d1) * (1 - d2) * (1 - d3);
        const markedPrice = paid / mult;

        return {
          problemType: 'Successive Discounts & Marked Price',
          expectedValue: Math.round(markedPrice),
          expectedUnit: '₹',
          details: `Marked Price = Paid / ((1 - ${d1}) * (1 - ${d2}) * (1 - ${d3})) = ${paid} / ${mult} = ₹${markedPrice}`,
          steps: [
            `Discounts: ${d1 * 100}%, ${d2 * 100}%, ${d3 * 100}%`,
            `Effective Multiplier = ${(1 - d1).toFixed(2)} * ${(1 - d2).toFixed(2)} * ${(1 - d3).toFixed(2)} = ${mult.toFixed(4)}`,
            `Paid Amount = ₹${paid}`,
            `Original Marked Price = ${paid} / ${mult.toFixed(4)} = ₹${Math.round(markedPrice)}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 9: Simple Interest (SI = P * R * T / 100)
  // =========================================================================
  private static solveSimpleInterestProblem(content: string) {
    const hasSI = /simple\s+interest|సాధారణ\s+వడ్డీ/i.test(content);
    const match = content.match(/[₹Rs\.]*\s*(\d+(?:,\d+)?).*?(\d+(?:\.\d+)?)\s*%.*?(\d+)\s*(?:years?|సంవత్సరాల)/i);

    if (hasSI && match) {
      const p = cleanNumber(match[1]);
      const r = parseFloat(match[2]);
      const t = parseFloat(match[3]);

      if (p && p > 0 && r > 0 && t > 0) {
        const si = (p * r * t) / 100;
        const totalAmount = p + si;
        const asksAmount = /amount|మొత్తం/i.test(content) && !/interest\s+alone|వడ్డీ\s+మాత్రమే/i.test(content);
        const expected = asksAmount ? totalAmount : si;

        return {
          problemType: asksAmount ? 'Simple Interest (Total Amount)' : 'Simple Interest Calculation',
          expectedValue: Math.round(expected * 100) / 100,
          expectedUnit: '₹',
          details: `SI = (${p} * ${r} * ${t}) / 100 = ${si}`,
          steps: [
            `Principal P = ₹${p}, Rate R = ${r}%, Time T = ${t} years`,
            `Simple Interest SI = (P * R * T) / 100 = (${p} * ${r} * ${t}) / 100 = ₹${si}`,
            asksAmount ? `Total Amount = P + SI = ${p} + ${si} = ₹${totalAmount}` : `Interest = ₹${si}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 10: Time and Work (Combined Rate)
  // =========================================================================
  private static solveTimeAndWorkProblem(content: string) {
    // English: "A can do a work in [X] days, B in [Y] days ... together"
    // Telugu: "A ఒక పనిని [X] రోజుల్లో, B [Y] రోజుల్లో ... కలిసి"
    const hasWork = /work|days|పని|రోజుల్లో/i.test(content) && /together|కలిసి/i.test(content);
    const match = content.match(/(\d+)\s*(?:days?|రోజుల్లో).*?(\d+)\s*(?:days?|రోజుల్లో)/i);

    if (hasWork && match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);

      if (x > 0 && y > 0) {
        const combined = (x * y) / (x + y);
        return {
          problemType: 'Combined Work Rate (Time & Work)',
          expectedValue: Math.round(combined * 100) / 100,
          expectedUnit: 'days',
          details: `Time Together = (X * Y) / (X + Y) = (${x} * ${y}) / (${x} + ${y}) = ${combined} days`,
          steps: [
            `Person 1 = ${x} days, Person 2 = ${y} days`,
            `Formula: (X * Y) / (X + Y)`,
            `Combined Time = (${x} * ${y}) / (${x + y}) = ${x * y} / ${x + y} = ${combined} days`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 11: Ratio and Proportional Sharing
  // =========================================================================
  private static solveRatioSharingProblem(content: string) {
    // e.g. "divide ₹1200 in the ratio 3:2" or "ratio of 3:2"
    const match = content.match(/[₹Rs\.]*\s*(\d+(?:,\d+)?).*?ratio.*?(\d+)\s*:\s*(\d+)/i);
    if (match) {
      const sum = cleanNumber(match[1]);
      const r1 = parseFloat(match[2]);
      const r2 = parseFloat(match[3]);

      if (sum && sum > 0 && r1 > 0 && r2 > 0) {
        const part1 = (sum * r1) / (r1 + r2);
        const part2 = (sum * r2) / (r1 + r2);

        return {
          problemType: 'Ratio Sharing Problem',
          expectedValue: Math.round(part1 * 100) / 100,
          expectedUnit: '₹',
          details: `Part 1 = ${sum} * (${r1} / ${r1 + r2}) = ${part1}`,
          steps: [
            `Total Sum = ₹${sum}, Ratio = ${r1}:${r2}`,
            `Sum of ratio terms = ${r1 + r2}`,
            `Share 1 = ${sum} * (${r1} / ${r1 + r2}) = ₹${part1}`,
            `Share 2 = ${sum} * (${r2} / ${r1 + r2}) = ₹${part2}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // SOLVER 12: Basic Discrete Arithmetic (A * B, A / B, etc.)
  // =========================================================================
  private static solveBasicArithmeticProblem(content: string) {
    // e.g. "What is 15 * 12?" or "Calculate 450 / 15"
    const multMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:\*|x|times|గుణించగా)\s*(\d+(?:\.\d+)?)/i);
    if (multMatch && content.length < 60) {
      const a = parseFloat(multMatch[1]);
      const b = parseFloat(multMatch[2]);
      const result = a * b;
      return {
        problemType: 'Basic Multiplication',
        expectedValue: Math.round(result * 1000) / 1000,
        details: `${a} * ${b} = ${result}`,
        steps: [`${a} * ${b} = ${result}`],
      };
    }

    const divMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:\/|divided\s+by|భాగించగా)\s*(\d+(?:\.\d+)?)/i);
    if (divMatch && content.length < 60) {
      const a = parseFloat(divMatch[1]);
      const b = parseFloat(divMatch[2]);
      if (b !== 0) {
        const result = a / b;
        return {
          problemType: 'Basic Division',
          expectedValue: Math.round(result * 1000) / 1000,
          details: `${a} / ${b} = ${result}`,
          steps: [`${a} / ${b} = ${result}`],
        };
      }
    }

    return null;
  }
}
