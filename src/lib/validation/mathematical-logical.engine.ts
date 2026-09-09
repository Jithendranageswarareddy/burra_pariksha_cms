/**
 * BURRA PARIKSHA CMS - Deterministic Mathematical & Logical Engine
 * Phase 5: Question Validation Engine (Stage 4)
 * 
 * Provides independent, deterministic solver engines for aptitude problems.
 * Distinguishes:
 * - PROVABLY_VALID: Deterministic solver calculated answer and it unambiguously matches the declared correct answer.
 * - CONTRADICTORY: Deterministic solver proves the declared answer is mathematically or logically incorrect.
 * - NOT_DETERMINISTICALLY_VERIFIED: Question contains numerical/logical problem statements but problem structure requires human review.
 * - NOT_APPLICABLE: Purely verbal, conceptual, or non-numerical question.
 */

import { MathematicalLogicalResult } from '../../types';

export interface SolverSolution {
  problemType: string;
  expectedValue: number | string;
  expectedUnit?: string;
  details: string;
  calculationSteps: string[];
}

function cleanNumber(str: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractOptionNumbers(text: string): number[] {
  if (!text) return [];
  const cleaned = text.replace(/(\d),(\d)/g, '$1$2');
  const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n));
}

function optionMatchesValue(optionText: string, expectedVal: number | string, tolerance = 1e-2): boolean {
  if (typeof expectedVal === 'string') {
    return optionText.trim().toLowerCase() === expectedVal.trim().toLowerCase();
  }

  const nums = extractOptionNumbers(optionText);
  for (const n of nums) {
    if (
      Math.abs(n - expectedVal) <= tolerance ||
      (expectedVal !== 0 && Math.abs((n - expectedVal) / expectedVal) <= 0.005)
    ) {
      return true;
    }
  }
  return false;
}

export class MathematicalLogicalEngine {
  /**
   * Evaluates question text, options, and declared answer against deterministic solvers.
   */
  public static verify(
    questionText: string,
    options: { a: string; b: string; c?: string; d?: string },
    declaredAnswer: string
  ): MathematicalLogicalResult {
    const text = questionText || '';
    const normDeclared = (declaredAnswer || '').trim().toUpperCase();

    const optionsMap: Record<string, string> = {
      A: (options.a || '').trim(),
      B: (options.b || '').trim(),
      C: (options.c || '').trim(),
      D: (options.d || '').trim(),
    };

    // Filter to available options
    const availableKeys = ['A', 'B', 'C', 'D'].filter((k) => Boolean(optionsMap[k]));

    // Check if question has numbers or mathematical keywords
    const hasNumbersInText = /\d+/.test(text);
    const hasNumbersInOptions = availableKeys.some((k) => /\d+/.test(optionsMap[k]));
    const mathKeywords = /speed|distance|train|percent|discount|profit|loss|interest|ratio|average|work|days|hours|minutes|seconds|ratio|area|perimeter|probability|series|next number|tallest|shortest/i.test(text);

    if (!hasNumbersInText && !hasNumbersInOptions && !mathKeywords) {
      return {
        status: 'NOT_APPLICABLE',
        details: 'Non-numerical question (verbal reasoning or qualitative conceptual content)',
      };
    }

    // Solvers sequence
    const solvers = [
      // Speed, Time, Distance & Trains
      MathematicalLogicalEngine.solveTrainPlatformProblem,
      MathematicalLogicalEngine.solveTrainPoleProblem,
      MathematicalLogicalEngine.solveTrainRelativeSpeedProblem,
      MathematicalLogicalEngine.solveAverageSpeedHarmonicMean,
      MathematicalLogicalEngine.solveSpeedDistanceTimeDirect,
      MathematicalLogicalEngine.solveUnitConversionKmhMs,

      // Percentages, Profit, Loss, Discount & Interest
      MathematicalLogicalEngine.solvePercentageOfValue,
      MathematicalLogicalEngine.solvePercentageChangeProblem,
      MathematicalLogicalEngine.solveProfitAndLossProblem,
      MathematicalLogicalEngine.solveSuccessiveDiscountsProblem,
      MathematicalLogicalEngine.solveMarkupDiscountProblem,
      MathematicalLogicalEngine.solveSimpleInterestProblem,
      MathematicalLogicalEngine.solveCompoundInterestProblem,

      // Work & Ratios
      MathematicalLogicalEngine.solveTimeAndWorkProblem,
      MathematicalLogicalEngine.solvePipesAndCisternsProblem,
      MathematicalLogicalEngine.solveRatioSharingProblem,

      // Averages & Numbers
      MathematicalLogicalEngine.solveAverageOfNumbersProblem,
      MathematicalLogicalEngine.solveNumberSeriesProblem,

      // Geometry & Mensuration
      MathematicalLogicalEngine.solveRectangleAreaPerimeter,
      MathematicalLogicalEngine.solveSquareAreaPerimeter,
      MathematicalLogicalEngine.solveCircleAreaCircumference,

      // Probability
      MathematicalLogicalEngine.solveBasicProbabilityProblem,

      // Discrete Arithmetic
      MathematicalLogicalEngine.solveBasicArithmeticProblem,

      // Logical Ordering / Ranking
      MathematicalLogicalEngine.solveHeightRankingComparison,
    ];

    for (const solver of solvers) {
      const solution = solver(text);
      if (solution) {
        return MathematicalLogicalEngine.evaluateSolution(solution, optionsMap, availableKeys, normDeclared);
      }
    }

    // If numerical or math keywords present but no deterministic solver matched:
    return {
      status: 'NOT_DETERMINISTICALLY_VERIFIED',
      details: 'Numerical or complex logical problem structure could not be deterministically modeled; requires human subject-matter review',
    };
  }

  private static evaluateSolution(
    solution: SolverSolution,
    optionsMap: Record<string, string>,
    availableKeys: string[],
    declaredAnswer: string
  ): MathematicalLogicalResult {
    const { problemType, expectedValue, expectedUnit, details, calculationSteps } = solution;

    const matchedKeys = availableKeys.filter((k) =>
      optionMatchesValue(optionsMap[k], expectedValue)
    );

    // Case 1: No option matches calculated value
    if (matchedKeys.length === 0) {
      return {
        status: 'CONTRADICTORY',
        problemType,
        calculatedValue: expectedValue,
        expectedUnit,
        details: `Mathematical Contradiction: Calculated solution is ${expectedValue}${expectedUnit ? ' ' + expectedUnit : ''}, but none of the options [${availableKeys.map((k) => `${k}: "${optionsMap[k]}"`).join(', ')}] match this value.`,
        reason: 'Calculated mathematical answer is missing from the options list.',
        calculationSteps,
      };
    }

    // Case 2: Multiple options match calculated value (Ambiguity / Duplicate)
    if (matchedKeys.length > 1) {
      return {
        status: 'CONTRADICTORY',
        problemType,
        calculatedValue: expectedValue,
        expectedUnit,
        matchedOption: matchedKeys.join(', '),
        details: `Mathematical Ambiguity: Calculated solution (${expectedValue}) matches multiple options: ${matchedKeys.join(', ')}. Multiple identical or equivalent answers violate single-choice question design.`,
        reason: 'Multiple options match the calculated result.',
        calculationSteps,
      };
    }

    // Case 3: Exactly 1 option matches
    const singleMatched = matchedKeys[0];

    // Check if matches declared correct answer
    if (declaredAnswer && declaredAnswer !== singleMatched) {
      return {
        status: 'CONTRADICTORY',
        problemType,
        calculatedValue: expectedValue,
        expectedUnit,
        matchedOption: singleMatched,
        details: `Mathematical Contradiction: Independent calculation proves the correct answer is ${expectedValue}${expectedUnit ? ' ' + expectedUnit : ''} (Option ${singleMatched}: "${optionsMap[singleMatched]}"), but declared answer is Option ${declaredAnswer} ("${optionsMap[declaredAnswer]}").`,
        reason: `Declared answer Option ${declaredAnswer} contradicts calculated Option ${singleMatched}.`,
        calculationSteps,
      };
    }

    return {
      status: 'PROVABLY_VALID',
      problemType,
      calculatedValue: expectedValue,
      expectedUnit,
      matchedOption: singleMatched,
      details: `Provably Valid: Independent calculation verified that ${expectedValue}${expectedUnit ? ' ' + expectedUnit : ''} corresponds to Option ${singleMatched}, perfectly matching declared correct answer.`,
      calculationSteps,
    };
  }

  // =========================================================================
  // 1. Train Crossing Platform / Bridge
  // =========================================================================
  private static solveTrainPlatformProblem(content: string): SolverSolution | null {
    const isTrain = /train|రైలు/i.test(content);
    const isPlatform = /platform|bridge|tunnel|ప్లాట్‌ఫాం|వంతెన/i.test(content);

    if (isTrain && isPlatform) {
      const trainLenMatch = content.match(/(\d+)\s*(?:m|meters|మీటర్ల?)\s*(?:long\s*)?train/i) ||
        content.match(/train\s*(?:is\s*)?(\d+)\s*(?:m|meters|మీటర్ల?)/i) ||
        content.match(/(\d+)\s*(?:మీటర్ల?)\s*పొడవున్న\s*రైలు/i);
      const platLenMatch = content.match(/(\d+)\s*(?:m|meters|మీటర్ల?)\s*(?:long\s*)?(?:platform|bridge|tunnel)/i) ||
        content.match(/(?:platform|bridge|tunnel)\s*(?:is\s*)?(\d+)\s*(?:m|meters|మీటర్ల?)/i) ||
        content.match(/(\d+)\s*(?:మీటర్ల?)\s*పొడవున్న\s*(?:ప్లాట్‌ఫాం|వంతెన)/i);
      const speedMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:km\/h|km\/hr|kmph|కిమీ\/గం)/i);

      if (trainLenMatch && platLenMatch && speedMatch) {
        const trainLen = parseFloat(trainLenMatch[1]);
        const platLen = parseFloat(platLenMatch[1]);
        const speedKmh = parseFloat(speedMatch[1]);

        if (speedKmh > 0) {
          const totalDistance = trainLen + platLen;
          const speedMs = (speedKmh * 5) / 18;
          const timeSec = totalDistance / speedMs;
          const rounded = Math.round(timeSec * 100) / 100;

          return {
            problemType: 'Train Crossing Platform (Speed, Distance, Time)',
            expectedValue: rounded,
            expectedUnit: 'seconds',
            details: `Time = (Train Length + Platform Length) / Speed in m/s = (${trainLen} + ${platLen}) / (${speedKmh} * 5/18) = ${rounded} seconds`,
            calculationSteps: [
              `Train Length = ${trainLen} m, Platform Length = ${platLen} m`,
              `Total Distance = ${trainLen} + ${platLen} = ${totalDistance} m`,
              `Speed = ${speedKmh} km/h = ${speedKmh} * 5/18 = ${speedMs.toFixed(3)} m/s`,
              `Time = ${totalDistance} / ${speedMs.toFixed(3)} = ${rounded} seconds`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 2. Train Crossing Pole / Person
  // =========================================================================
  private static solveTrainPoleProblem(content: string): SolverSolution | null {
    const isTrain = /train|రైలు/i.test(content);
    const isPoleOrPerson = /pole|signal|man|person|post|స్తంభం|వ్యక్తి/i.test(content) && !/platform|bridge|tunnel/i.test(content);

    if (isTrain && isPoleOrPerson) {
      const trainLenMatch = content.match(/(\d+)\s*(?:m|meters|మీటర్ల?)\s*(?:long\s*)?train/i) ||
        content.match(/train\s*(?:is\s*)?(\d+)\s*(?:m|meters|మీటర్ల?)/i) ||
        content.match(/(\d+)\s*(?:మీటర్ల?)\s*పొడవున్న\s*రైలు/i);
      const speedMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:km\/h|km\/hr|kmph|కిమీ\/గం)/i);

      if (trainLenMatch && speedMatch) {
        const trainLen = parseFloat(trainLenMatch[1]);
        const speedKmh = parseFloat(speedMatch[1]);

        if (speedKmh > 0) {
          const speedMs = (speedKmh * 5) / 18;
          const timeSec = trainLen / speedMs;
          const rounded = Math.round(timeSec * 100) / 100;

          return {
            problemType: 'Train Crossing Pole/Person',
            expectedValue: rounded,
            expectedUnit: 'seconds',
            details: `Time = Train Length / Speed in m/s = ${trainLen} / (${speedKmh} * 5/18) = ${rounded} seconds`,
            calculationSteps: [
              `Train Length = ${trainLen} m`,
              `Speed = ${speedKmh} km/h = ${speedMs.toFixed(3)} m/s`,
              `Time = ${trainLen} / ${speedMs.toFixed(3)} = ${rounded} seconds`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 3. Train Relative Speed (Opposite or Same Direction)
  // =========================================================================
  private static solveTrainRelativeSpeedProblem(content: string): SolverSolution | null {
    const isOpposite = /opposite\s*direction|వ్యతిరేక\s*దిశ/i.test(content);
    const isSame = /same\s*direction|ఒకే\s*దిశ/i.test(content);

    if (isOpposite || isSame) {
      const speeds = [...content.matchAll(/(\d+(?:\.\d+)?)\s*(?:km\/h|km\/hr|kmph|కిమీ\/గం)/gi)].map((m) =>
        parseFloat(m[1])
      );
      const lengths = [...content.matchAll(/(\d+)\s*(?:m|meters|మీటర్ల?)/gi)].map((m) => parseFloat(m[1]));

      if (speeds.length >= 2 && lengths.length >= 2) {
        const relSpeedKmh = isOpposite ? speeds[0] + speeds[1] : Math.abs(speeds[0] - speeds[1]);
        const totalDist = lengths[0] + lengths[1];

        if (relSpeedKmh > 0) {
          const relSpeedMs = (relSpeedKmh * 5) / 18;
          const timeSec = totalDist / relSpeedMs;
          const rounded = Math.round(timeSec * 100) / 100;

          return {
            problemType: `Relative Speed Trains (${isOpposite ? 'Opposite' : 'Same'} Direction)`,
            expectedValue: rounded,
            expectedUnit: 'seconds',
            details: `Time = Total Length / Relative Speed = ${totalDist} / (${relSpeedKmh} * 5/18) = ${rounded} s`,
            calculationSteps: [
              `Lengths: ${lengths[0]}m, ${lengths[1]}m -> Total Distance = ${totalDist}m`,
              `Speeds: ${speeds[0]} km/h, ${speeds[1]} km/h -> Relative Speed = ${relSpeedKmh} km/h`,
              `Relative Speed in m/s = ${relSpeedMs.toFixed(3)} m/s`,
              `Time = ${totalDist} / ${relSpeedMs.toFixed(3)} = ${rounded} seconds`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 4. Average Speed Harmonic Mean (Equal Distances)
  // =========================================================================
  private static solveAverageSpeedHarmonicMean(content: string): SolverSolution | null {
    const isAvgSpeed = /average\s*speed|సగటు\s*వేగం/i.test(content);
    const isEqualDist = /equal\s*distance|same\s*distance|returns|round\s*trip|వెళ్లి\s*తిరిగి/i.test(content);

    if (isAvgSpeed && isEqualDist) {
      const speeds = [...content.matchAll(/(\d+(?:\.\d+)?)\s*(?:km\/h|km\/hr|kmph|కిమీ\/గం)/gi)].map((m) =>
        parseFloat(m[1])
      );

      if (speeds.length >= 2) {
        const s1 = speeds[0];
        const s2 = speeds[1];
        if (s1 > 0 && s2 > 0) {
          const avgSpeed = (2 * s1 * s2) / (s1 + s2);
          const rounded = Math.round(avgSpeed * 100) / 100;

          return {
            problemType: 'Average Speed (Harmonic Mean across Equal Distances)',
            expectedValue: rounded,
            expectedUnit: 'km/h',
            details: `Average Speed = 2 * S1 * S2 / (S1 + S2) = 2 * ${s1} * ${s2} / (${s1} + ${s2}) = ${rounded} km/h`,
            calculationSteps: [
              `Speed 1 = ${s1} km/h, Speed 2 = ${s2} km/h`,
              `Formula: 2 * S1 * S2 / (S1 + S2)`,
              `2 * ${s1} * ${s2} / (${s1} + ${s2}) = ${2 * s1 * s2} / ${s1 + s2} = ${rounded} km/h`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 5. Direct Speed = Distance / Time or Distance = Speed * Time
  // =========================================================================
  private static solveSpeedDistanceTimeDirect(content: string): SolverSolution | null {
    // Check if asking speed
    const asksSpeed = /(?:what\s+is\s+the\s+speed|find\s+the\s+speed|వేగం\s+ఎంత)/i.test(content);
    const distMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers|కి\.మీ|కిలోమీటర్ల?)/i);
    const timeHoursMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|గంటల?)/i);

    if (asksSpeed && distMatch && timeHoursMatch) {
      const d = parseFloat(distMatch[1]);
      const t = parseFloat(timeHoursMatch[1]);
      if (t > 0) {
        const speed = d / t;
        const rounded = Math.round(speed * 100) / 100;
        return {
          problemType: 'Direct Speed Calculation (Distance / Time)',
          expectedValue: rounded,
          expectedUnit: 'km/h',
          details: `Speed = Distance / Time = ${d} km / ${t} h = ${rounded} km/h`,
          calculationSteps: [`Distance = ${d} km, Time = ${t} hours`, `Speed = ${d} / ${t} = ${rounded} km/h`],
        };
      }
    }

    // Check if asking distance
    const asksDistance = /(?:what\s+is\s+the\s+distance|find\s+the\s+distance|దూరం\s+ఎంత)/i.test(content);
    const speedMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:km\/h|km\/hr|kmph|కిమీ\/గం)/i);
    if (asksDistance && speedMatch && timeHoursMatch) {
      const s = parseFloat(speedMatch[1]);
      const t = parseFloat(timeHoursMatch[1]);
      const dist = s * t;
      const rounded = Math.round(dist * 100) / 100;
      return {
        problemType: 'Direct Distance Calculation (Speed * Time)',
        expectedValue: rounded,
        expectedUnit: 'km',
        details: `Distance = Speed * Time = ${s} km/h * ${t} h = ${rounded} km`,
        calculationSteps: [`Speed = ${s} km/h, Time = ${t} hours`, `Distance = ${s} * ${t} = ${rounded} km`],
      };
    }

    return null;
  }

  // =========================================================================
  // 6. Direct Unit Conversion km/h <-> m/s
  // =========================================================================
  private static solveUnitConversionKmhMs(content: string): SolverSolution | null {
    // "Convert 72 km/h into m/s"
    const kmhToMs = content.match(/convert\s+(\d+(?:\.\d+)?)\s*km\/h\s*(?:in|to|into)\s*m\/s/i);
    if (kmhToMs) {
      const kmh = parseFloat(kmhToMs[1]);
      const ms = (kmh * 5) / 18;
      const rounded = Math.round(ms * 100) / 100;
      return {
        problemType: 'Unit Conversion (km/h -> m/s)',
        expectedValue: rounded,
        expectedUnit: 'm/s',
        details: `${kmh} km/h * 5/18 = ${rounded} m/s`,
        calculationSteps: [`${kmh} * 5 / 18 = ${rounded} m/s`],
      };
    }

    const msToKmh = content.match(/convert\s+(\d+(?:\.\d+)?)\s*m\/s\s*(?:in|to|into)\s*km\/h/i);
    if (msToKmh) {
      const ms = parseFloat(msToKmh[1]);
      const kmh = (ms * 18) / 5;
      const rounded = Math.round(kmh * 100) / 100;
      return {
        problemType: 'Unit Conversion (m/s -> km/h)',
        expectedValue: rounded,
        expectedUnit: 'km/h',
        details: `${ms} m/s * 18/5 = ${rounded} km/h`,
        calculationSteps: [`${ms} * 18 / 5 = ${rounded} km/h`],
      };
    }

    return null;
  }

  // =========================================================================
  // 7. Percentage of a Value (e.g. "What is 25% of 600?")
  // =========================================================================
  private static solvePercentageOfValue(content: string): SolverSolution | null {
    const match = content.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:of|లో)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?(?:\.\d+)?)/i);
    if (match && !/increase|decrease|discount|profit|loss|interest/i.test(content)) {
      const pct = parseFloat(match[1]);
      const base = cleanNumber(match[2]);
      if (base !== null) {
        const val = (pct * base) / 100;
        const rounded = Math.round(val * 100) / 100;
        return {
          problemType: 'Percentage of a Value',
          expectedValue: rounded,
          details: `${pct}% of ${base} = (${pct} / 100) * ${base} = ${rounded}`,
          calculationSteps: [`${pct}% of ${base} = (${pct} * ${base}) / 100 = ${rounded}`],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 8. Percentage Increase / Decrease
  // =========================================================================
  private static solvePercentageChangeProblem(content: string): SolverSolution | null {
    const isChange = /percentage\s*(?:increase|decrease|change)|శాతం\s*(?:పెరుగుదల|తగ్గుదల)/i.test(content);
    const match = content.match(/(?:from|నుండి)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?).*?(?:to|కు)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i);

    if (isChange && match) {
      const initial = cleanNumber(match[1]);
      const finalVal = cleanNumber(match[2]);

      if (initial && finalVal && initial > 0) {
        const diff = Math.abs(finalVal - initial);
        const pct = (diff / initial) * 100;
        const rounded = Math.round(pct * 100) / 100;
        const isIncrease = finalVal >= initial;

        return {
          problemType: `Percentage ${isIncrease ? 'Increase' : 'Decrease'}`,
          expectedValue: rounded,
          expectedUnit: '%',
          details: `Percentage Change = |${finalVal} - ${initial}| / ${initial} * 100 = ${rounded}%`,
          calculationSteps: [
            `Initial = ${initial}, Final = ${finalVal}`,
            `Difference = |${finalVal} - ${initial}| = ${diff}`,
            `Percentage = (${diff} / ${initial}) * 100 = ${rounded}%`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 9. Profit & Loss (CP, SP -> Profit/Loss %)
  // =========================================================================
  private static solveProfitAndLossProblem(content: string): SolverSolution | null {
    const isPandL = /profit|loss|gain|లాభ|నష్ట/i.test(content);
    const cpMatch = content.match(/(?:cost\s*price|bought\s*(?:for|at)|purchased\s*(?:for|at)|కొన్న\s*వెల)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i);
    const spMatch = content.match(/(?:selling\s*price|sold\s*(?:for|at)|అమ్మిన\s*వెల)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i);

    if (isPandL && cpMatch && spMatch) {
      const cp = cleanNumber(cpMatch[1]);
      const sp = cleanNumber(spMatch[1]);

      if (cp && sp && cp > 0) {
        const asksPercentage = /percentage|percent|%|శాతం/i.test(content);
        if (asksPercentage) {
          const diff = Math.abs(sp - cp);
          const pct = (diff / cp) * 100;
          const rounded = Math.round(pct * 100) / 100;
          const isProfit = sp >= cp;

          return {
            problemType: `${isProfit ? 'Profit' : 'Loss'} Percentage`,
            expectedValue: rounded,
            expectedUnit: '%',
            details: `${isProfit ? 'Profit' : 'Loss'}% = |${sp} - ${cp}| / ${cp} * 100 = ${rounded}%`,
            calculationSteps: [
              `Cost Price CP = ₹${cp}, Selling Price SP = ₹${sp}`,
              `${isProfit ? 'Profit' : 'Loss'} = |${sp} - ${cp}| = ₹${diff}`,
              `${isProfit ? 'Profit' : 'Loss'}% = (${diff} / ${cp}) * 100 = ${rounded}%`,
            ],
          };
        } else {
          // Asks absolute profit or loss
          const diff = Math.abs(sp - cp);
          return {
            problemType: sp >= cp ? 'Profit Amount' : 'Loss Amount',
            expectedValue: diff,
            expectedUnit: '₹',
            details: `|${sp} - ${cp}| = ₹${diff}`,
            calculationSteps: [`Cost Price = ₹${cp}, Selling Price = ₹${sp}`, `Difference = ₹${diff}`],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 10. Successive Discounts
  // =========================================================================
  private static solveSuccessiveDiscountsProblem(content: string): SolverSolution | null {
    const isSuccessive = /successive\s*discounts?|వరస\s*రాయితీలు/i.test(content);
    if (isSuccessive) {
      const pcts = [...content.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => parseFloat(m[1]));
      if (pcts.length >= 2) {
        const d1 = pcts[0];
        const d2 = pcts[1];
        // Formula: d1 + d2 - (d1 * d2 / 100)
        const netDiscount = d1 + d2 - (d1 * d2) / 100;
        const rounded = Math.round(netDiscount * 100) / 100;

        return {
          problemType: 'Successive Discounts (Equivalent Single Discount)',
          expectedValue: rounded,
          expectedUnit: '%',
          details: `Single Equivalent Discount = D1 + D2 - (D1 * D2 / 100) = ${d1} + ${d2} - (${d1} * ${d2} / 100) = ${rounded}%`,
          calculationSteps: [
            `Discount 1 = ${d1}%, Discount 2 = ${d2}%`,
            `Formula: D1 + D2 - (D1 * D2) / 100`,
            `${d1} + ${d2} - (${d1 * d2} / 100) = ${d1 + d2} - ${(d1 * d2) / 100} = ${rounded}%`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 11. Marked Price and Discount -> Selling Price
  // =========================================================================
  private static solveMarkupDiscountProblem(content: string): SolverSolution | null {
    const isDiscount = /discount|రాయితీ/i.test(content);
    const mpMatch = content.match(/(?:marked\s*price|list\s*price|mrp|ప్రకటన\s*వెల)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i);
    const discMatch = content.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|రాయితీ)/i);

    if (isDiscount && mpMatch && discMatch) {
      const mp = cleanNumber(mpMatch[1]);
      const d = parseFloat(discMatch[1]);

      if (mp && d > 0) {
        const sp = mp * (1 - d / 100);
        const rounded = Math.round(sp * 100) / 100;

        return {
          problemType: 'Discount on Marked Price -> Selling Price',
          expectedValue: rounded,
          expectedUnit: '₹',
          details: `Selling Price = Marked Price * (1 - Discount/100) = ${mp} * (1 - ${d}/100) = ₹${rounded}`,
          calculationSteps: [
            `Marked Price = ₹${mp}, Discount = ${d}%`,
            `Discount Amount = ${mp} * (${d} / 100) = ₹${(mp * d) / 100}`,
            `Selling Price = ${mp} - ${(mp * d) / 100} = ₹${rounded}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 12. Simple Interest (P, R, T)
  // =========================================================================
  private static solveSimpleInterestProblem(content: string): SolverSolution | null {
    const isSI = /simple\s*interest|బారు\s*వడ్డీ/i.test(content);
    const isCI = /compound|చక్ర\s*వడ్డీ/i.test(content);

    if (isSI && !isCI) {
      const pMatch = content.match(/(?:sum|principal|invested|borrowed|రూ\.|₹|Rs\.)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i) ||
        content.match(/(\d+(?:,\d+)?)\s*(?:రూపాయలు|rupees)/i);
      const rMatch = content.match(/(\d+(?:\.\d+)?)\s*%\s*(?:per\s*annum|p\.a\.|rate|వడ్డీ\s*రేటు)?/i);
      const tMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:years?|సంవత్సరాలు|సంవత్సరాల)/i);

      if (pMatch && rMatch && tMatch) {
        const p = cleanNumber(pMatch[1]);
        const r = parseFloat(rMatch[1]);
        const t = parseFloat(tMatch[1]);

        if (p && p > 0 && r > 0 && t > 0) {
          const si = (p * r * t) / 100;
          const asksAmount = /amount|మొత్తం/i.test(content) && !/interest\s*amount/i.test(content);
          const expected = asksAmount ? p + si : si;
          const rounded = Math.round(expected * 100) / 100;

          return {
            problemType: asksAmount ? 'Simple Interest Total Amount' : 'Simple Interest',
            expectedValue: rounded,
            expectedUnit: '₹',
            details: asksAmount
              ? `Total Amount = Principal + SI = ${p} + (${p} * ${r} * ${t} / 100) = ₹${rounded}`
              : `Simple Interest = (P * R * T) / 100 = (${p} * ${r} * ${t}) / 100 = ₹${rounded}`,
            calculationSteps: [
              `Principal P = ₹${p}, Rate R = ${r}%, Time T = ${t} years`,
              `SI = (P * R * T) / 100 = (${p} * ${r} * ${t}) / 100 = ₹${si}`,
              asksAmount ? `Amount = P + SI = ₹${p} + ₹${si} = ₹${rounded}` : `Simple Interest = ₹${rounded}`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 13. Compound Interest (Annually)
  // =========================================================================
  private static solveCompoundInterestProblem(content: string): SolverSolution | null {
    const isCI = /compound\s*interest|చక్ర\s*వడ్డీ/i.test(content);

    if (isCI) {
      const pMatch = content.match(/(?:sum|principal|invested|borrowed|రూ\.|₹|Rs\.)\s*[₹Rs\.]*\s*(\d+(?:,\d+)?)/i);
      const rMatch = content.match(/(\d+(?:\.\d+)?)\s*%\s*(?:per\s*annum|p\.a\.|rate)?/i);
      const tMatch = content.match(/(\d+)\s*(?:years?|సంవత్సరాలు)/i);

      if (pMatch && rMatch && tMatch) {
        const p = cleanNumber(pMatch[1]);
        const r = parseFloat(rMatch[1]);
        const t = parseInt(tMatch[1], 10);

        if (p && p > 0 && r > 0 && t > 0 && t <= 5) {
          const amount = p * Math.pow(1 + r / 100, t);
          const ci = amount - p;
          const asksAmount = /amount|మొత్తం/i.test(content) && !/interest/i.test(content);
          const expected = asksAmount ? amount : ci;
          const rounded = Math.round(expected * 100) / 100;

          return {
            problemType: asksAmount ? 'Compound Interest Total Amount' : 'Compound Interest',
            expectedValue: rounded,
            expectedUnit: '₹',
            details: asksAmount
              ? `Amount = P * (1 + R/100)^T = ${p} * (1 + ${r}/100)^${t} = ₹${rounded}`
              : `CI = Amount - Principal = ₹${rounded}`,
            calculationSteps: [
              `Principal = ₹${p}, Rate = ${r}%, Time = ${t} years`,
              `Amount = ${p} * (1 + ${r/100})^${t} = ₹${amount.toFixed(2)}`,
              asksAmount ? `Total Amount = ₹${rounded}` : `Compound Interest = ₹${rounded}`,
            ],
          };
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 14. Time and Work (Combined Rate)
  // =========================================================================
  private static solveTimeAndWorkProblem(content: string): SolverSolution | null {
    const hasWork = /work|days|పని|రోజుల్లో/i.test(content) && /together|both|కలిసి/i.test(content);
    const match = content.match(/(\d+)\s*(?:days?|రోజుల్లో).*?(\d+)\s*(?:days?|రోజుల్లో)/i);

    if (hasWork && match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);

      if (x > 0 && y > 0) {
        const combined = (x * y) / (x + y);
        const rounded = Math.round(combined * 100) / 100;

        return {
          problemType: 'Combined Work Rate (Time & Work)',
          expectedValue: rounded,
          expectedUnit: 'days',
          details: `Time Together = (X * Y) / (X + Y) = (${x} * ${y}) / (${x} + ${y}) = ${rounded} days`,
          calculationSteps: [
            `Person 1 = ${x} days, Person 2 = ${y} days`,
            `Formula: (X * Y) / (X + Y)`,
            `Combined Time = (${x} * ${y}) / (${x} + ${y}) = ${x * y} / ${x + y} = ${rounded} days`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 15. Pipes & Cisterns
  // =========================================================================
  private static solvePipesAndCisternsProblem(content: string): SolverSolution | null {
    const hasPipe = /pipe|tank|cistern|పైపు|ట్యాంక్/i.test(content) && /together|both|కలిసి/i.test(content);
    const match = content.match(/(\d+)\s*(?:hours?|hrs?|mins?|minutes?|గంటల్లో).*?(\d+)\s*(?:hours?|hrs?|mins?|minutes?|గంటల్లో)/i);

    if (hasPipe && match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);

      if (x > 0 && y > 0) {
        const combined = (x * y) / (x + y);
        const rounded = Math.round(combined * 100) / 100;

        return {
          problemType: 'Pipes & Cisterns Combined Filling Time',
          expectedValue: rounded,
          details: `Filling Time = (X * Y) / (X + Y) = (${x} * ${y}) / (${x} + ${y}) = ${rounded}`,
          calculationSteps: [
            `Pipe 1 = ${x}, Pipe 2 = ${y}`,
            `Combined = (${x} * ${y}) / (${x} + ${y}) = ${rounded}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 16. Ratio Sharing (Divide Sum in Ratio A:B)
  // =========================================================================
  private static solveRatioSharingProblem(content: string): SolverSolution | null {
    const match = content.match(/[₹Rs\.]*\s*(\d+(?:,\d+)?).*?ratio.*?(\d+)\s*:\s*(\d+)/i);
    if (match) {
      const sum = cleanNumber(match[1]);
      const r1 = parseFloat(match[2]);
      const r2 = parseFloat(match[3]);

      if (sum && sum > 0 && r1 > 0 && r2 > 0) {
        const part1 = (sum * r1) / (r1 + r2);
        const rounded = Math.round(part1 * 100) / 100;

        return {
          problemType: 'Ratio Sharing Problem (First Share)',
          expectedValue: rounded,
          expectedUnit: '₹',
          details: `First Share = Total * (R1 / (R1 + R2)) = ${sum} * (${r1} / ${r1 + r2}) = ₹${rounded}`,
          calculationSteps: [
            `Total = ₹${sum}, Ratio = ${r1}:${r2}`,
            `Sum of terms = ${r1 + r2}`,
            `Share 1 = ${sum} * (${r1} / ${r1 + r2}) = ₹${rounded}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 17. Average of Numbers
  // =========================================================================
  private static solveAverageOfNumbersProblem(content: string): SolverSolution | null {
    const isAvg = /(?:average\s+of|సగటు)\s*[:\s]*((?:\d+(?:\.\d+)?(?:,\s*|\s+and\s+|\s+మరియు\s+))+\d+(?:\.\d+)?)/i.test(content);
    if (isAvg) {
      const nums = [...content.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => parseFloat(m[1]));
      if (nums.length >= 3 && nums.length <= 10) {
        const sum = nums.reduce((acc, n) => acc + n, 0);
        const avg = sum / nums.length;
        const rounded = Math.round(avg * 100) / 100;

        return {
          problemType: 'Arithmetic Mean (Average)',
          expectedValue: rounded,
          details: `Average = Sum / Count = ${sum} / ${nums.length} = ${rounded}`,
          calculationSteps: [
            `Numbers: ${nums.join(', ')}`,
            `Sum = ${sum}, Count = ${nums.length}`,
            `Average = ${sum} / ${nums.length} = ${rounded}`,
          ],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 18. Number Series (AP, GP, Squares, Cubes)
  // =========================================================================
  private static solveNumberSeriesProblem(content: string): SolverSolution | null {
    const isSeries = /series|sequence|next\s*number|తర్వాత\s*సంఖ్య/i.test(content);
    const seriesMatch = content.match(/((?:\d+,\s*){3,}\?|\b(?:\d+,\s*){3,}\d+\b)/);

    if (isSeries && seriesMatch) {
      const nums = seriesMatch[1].replace('?', '').split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));

      if (nums.length >= 3) {
        // Test AP
        const diff1 = nums[1] - nums[0];
        const isAP = nums.every((n, i) => i === 0 || Math.abs(n - nums[i - 1] - diff1) < 1e-4);
        if (isAP) {
          const next = nums[nums.length - 1] + diff1;
          return {
            problemType: 'Arithmetic Progression Series',
            expectedValue: next,
            details: `AP with common difference ${diff1}. Next term = ${nums[nums.length - 1]} + ${diff1} = ${next}`,
            calculationSteps: [`Sequence: ${nums.join(', ')}`, `Common difference = ${diff1}`, `Next term = ${next}`],
          };
        }

        // Test GP
        if (nums[0] !== 0) {
          const ratio = nums[1] / nums[0];
          const isGP = nums.every((n, i) => i === 0 || Math.abs(n / nums[i - 1] - ratio) < 1e-4);
          if (isGP && ratio > 1) {
            const next = nums[nums.length - 1] * ratio;
            return {
              problemType: 'Geometric Progression Series',
              expectedValue: Math.round(next * 100) / 100,
              details: `GP with common ratio ${ratio}. Next term = ${nums[nums.length - 1]} * ${ratio} = ${next}`,
              calculationSteps: [`Sequence: ${nums.join(', ')}`, `Common ratio = ${ratio}`, `Next term = ${next}`],
            };
          }
        }
      }
    }
    return null;
  }

  // =========================================================================
  // 19. Mensuration: Rectangle (Area & Perimeter)
  // =========================================================================
  private static solveRectangleAreaPerimeter(content: string): SolverSolution | null {
    const isRect = /rectangle|దీర్ఘచతురస్ర/i.test(content);
    const lMatch = content.match(/(?:length|పొడవు)\s*(?:is\s*)?(\d+(?:\.\d+)?)/i);
    const wMatch = content.match(/(?:breadth|width|వెడల్పు)\s*(?:is\s*)?(\d+(?:\.\d+)?)/i);

    if (isRect && lMatch && wMatch) {
      const l = parseFloat(lMatch[1]);
      const w = parseFloat(wMatch[1]);
      const asksArea = /area|వైశాల్యం/i.test(content);
      const asksPerimeter = /perimeter|చుట్టుకొలత/i.test(content);

      if (asksArea) {
        const area = l * w;
        return {
          problemType: 'Area of Rectangle',
          expectedValue: Math.round(area * 100) / 100,
          expectedUnit: 'sq units',
          details: `Area = Length * Breadth = ${l} * ${w} = ${area}`,
          calculationSteps: [`Length = ${l}, Breadth = ${w}`, `Area = ${l} * ${w} = ${area}`],
        };
      }

      if (asksPerimeter) {
        const peri = 2 * (l + w);
        return {
          problemType: 'Perimeter of Rectangle',
          expectedValue: Math.round(peri * 100) / 100,
          expectedUnit: 'units',
          details: `Perimeter = 2 * (L + W) = 2 * (${l} + ${w}) = ${peri}`,
          calculationSteps: [`Length = ${l}, Breadth = ${w}`, `Perimeter = 2 * (${l} + ${w}) = ${peri}`],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 20. Mensuration: Square (Area & Perimeter)
  // =========================================================================
  private static solveSquareAreaPerimeter(content: string): SolverSolution | null {
    const isSquare = /square|చతురస్ర/i.test(content) && !/rectangle/i.test(content);
    const sMatch = content.match(/(?:side|భుజం)\s*(?:is\s*)?(\d+(?:\.\d+)?)/i);

    if (isSquare && sMatch) {
      const s = parseFloat(sMatch[1]);
      const asksArea = /area|వైశాల్యం/i.test(content);
      const asksPerimeter = /perimeter|చుట్టుకొలత/i.test(content);

      if (asksArea) {
        const area = s * s;
        return {
          problemType: 'Area of Square',
          expectedValue: Math.round(area * 100) / 100,
          expectedUnit: 'sq units',
          details: `Area = Side^2 = ${s}^2 = ${area}`,
          calculationSteps: [`Side = ${s}`, `Area = ${s} * ${s} = ${area}`],
        };
      }

      if (asksPerimeter) {
        const peri = 4 * s;
        return {
          problemType: 'Perimeter of Square',
          expectedValue: Math.round(peri * 100) / 100,
          details: `Perimeter = 4 * Side = 4 * ${s} = ${peri}`,
          calculationSteps: [`Side = ${s}`, `Perimeter = 4 * ${s} = ${peri}`],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 21. Mensuration: Circle (Area & Circumference)
  // =========================================================================
  private static solveCircleAreaCircumference(content: string): SolverSolution | null {
    const isCircle = /circle|వృత్త/i.test(content);
    const rMatch = content.match(/(?:radius|వ్యాసార్థం)\s*(?:is\s*)?(\d+(?:\.\d+)?)/i);

    if (isCircle && rMatch) {
      const r = parseFloat(rMatch[1]);
      const asksArea = /area|వైశాల్యం/i.test(content);
      const asksCircum = /circumference|పరిధి/i.test(content);

      // Using pi = 22/7 or 3.14
      if (asksArea) {
        const area = (22 / 7) * r * r;
        const rounded = Math.round(area * 100) / 100;
        return {
          problemType: 'Area of Circle',
          expectedValue: rounded,
          details: `Area = pi * r^2 = (22/7) * ${r}^2 = ${rounded}`,
          calculationSteps: [`Radius = ${r}`, `Area = (22/7) * ${r}^2 = ${rounded}`],
        };
      }

      if (asksCircum) {
        const circ = 2 * (22 / 7) * r;
        const rounded = Math.round(circ * 100) / 100;
        return {
          problemType: 'Circumference of Circle',
          expectedValue: rounded,
          details: `Circumference = 2 * pi * r = 2 * (22/7) * ${r} = ${rounded}`,
          calculationSteps: [`Radius = ${r}`, `Circumference = 2 * (22/7) * ${r} = ${rounded}`],
        };
      }
    }
    return null;
  }

  // =========================================================================
  // 22. Basic Probability (Coins & Dice)
  // =========================================================================
  private static solveBasicProbabilityProblem(content: string): SolverSolution | null {
    const isProb = /probability|సంభావ్యత/i.test(content);
    if (!isProb) return null;

    // Single coin getting head/tail
    if (/fair\s*coin|నాణెం/i.test(content) && /head|tail|బొమ్మ|బొరుసు/i.test(content) && !/two|three|2|3/i.test(content)) {
      return {
        problemType: 'Single Coin Probability',
        expectedValue: 0.5,
        details: 'P(Head) or P(Tail) = 1/2 = 0.5',
        calculationSteps: ['Total outcomes = 2 (Head, Tail)', 'Favorable = 1', 'P = 1/2 = 0.5'],
      };
    }

    return null;
  }

  // =========================================================================
  // 23. Basic Discrete Arithmetic (Multiplication, Division, Addition, Subtraction)
  // =========================================================================
  private static solveBasicArithmeticProblem(content: string): SolverSolution | null {
    // e.g. "What is 15 * 12?" or "15 multiplied by 12"
    const multMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:\*|x|times|multiplied\s+by|గుణించగా)\s*(\d+(?:\.\d+)?)/i);
    if (multMatch && content.length < 80) {
      const a = parseFloat(multMatch[1]);
      const b = parseFloat(multMatch[2]);
      const res = a * b;
      return {
        problemType: 'Basic Multiplication',
        expectedValue: Math.round(res * 100) / 100,
        details: `${a} * ${b} = ${res}`,
        calculationSteps: [`${a} * ${b} = ${res}`],
      };
    }

    // e.g. "450 divided by 15" or "450 / 15"
    const divMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:\/|divided\s+by|భాగించగా)\s*(\d+(?:\.\d+)?)/i);
    if (divMatch && content.length < 80) {
      const a = parseFloat(divMatch[1]);
      const b = parseFloat(divMatch[2]);
      if (b !== 0) {
        const res = a / b;
        return {
          problemType: 'Basic Division',
          expectedValue: Math.round(res * 100) / 100,
          details: `${a} / ${b} = ${res}`,
          calculationSteps: [`${a} / ${b} = ${res}`],
        };
      }
    }

    return null;
  }

  // =========================================================================
  // 24. Logical Height / Ranking Comparison (e.g. A is taller than B, B is taller than C)
  // =========================================================================
  private static solveHeightRankingComparison(content: string): SolverSolution | null {
    // "A is taller than B, and B is taller than C. Who is the tallest?"
    const match = content.match(/([A-Z])\s+is\s+taller\s+than\s+([A-Z]).*?([A-Z])\s+is\s+taller\s+than\s+([A-Z])/i);
    if (match) {
      const a = match[1].toUpperCase();
      const b = match[2].toUpperCase();
      const c = match[3].toUpperCase();
      const d = match[4].toUpperCase();

      if (b === c) {
        // Order: a > b > d
        const asksTallest = /who\s+is\s+(?:the\s+)?tallest/i.test(content);
        const asksShortest = /who\s+is\s+(?:the\s+)?shortest/i.test(content);

        if (asksTallest) {
          return {
            problemType: 'Transitive Order Ranking (Tallest)',
            expectedValue: a,
            details: `Since ${a} > ${b} and ${b} > ${d}, ${a} is the tallest.`,
            calculationSteps: [`${a} > ${b}`, `${b} > ${d}`, `Transitive Order: ${a} > ${b} > ${d}`, `Tallest = ${a}`],
          };
        }

        if (asksShortest) {
          return {
            problemType: 'Transitive Order Ranking (Shortest)',
            expectedValue: d,
            details: `Since ${a} > ${b} and ${b} > ${d}, ${d} is the shortest.`,
            calculationSteps: [`${a} > ${b}`, `${b} > ${d}`, `Transitive Order: ${a} > ${b} > ${d}`, `Shortest = ${d}`],
          };
        }
      }
    }
    return null;
  }
}
