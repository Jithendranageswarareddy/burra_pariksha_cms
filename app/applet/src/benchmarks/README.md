# Burra Pariksha CMS - Semantic AI Benchmark Suite

## Overview

This benchmark framework measures the empirical evaluation capability of Google Gemini models (`SemanticReasoningProvider`) against a human-annotated ground-truth dataset across Telugu and English competitive exam aptitude questions.

The goal is to quantify performance without synthetic claims or assumptions.

---

## 1. Benchmark Categories

The benchmark evaluates 10 target categories (10 questions per category in the 100-item suite):

1. `ARITHMETIC_MATH`: Multi-step arithmetic, BODMAS, fractions, rounding boundaries.
2. `PERCENTAGE_PROFIT_LOSS`: Cost/selling price markups, successive discounts, compound percentages.
3. `RATIO_AVERAGE_AGES`: Weighted averages, algebraic age relationships, proportional sharing.
4. `TIME_WORK_DISTANCE`: Relative speed (trains/platforms), pipes & cisterns, work rates.
5. `NUMBER_SYSTEM_LCM_HCF`: Remainder theorem, prime factorizations, divisibility rules.
6. `LOGICAL_REASONING`: Syllogisms, blood relations, sequence patterns, directional deduction.
7. `VERBAL_REASONING`: Analogies, sentence reasoning, nuanced vocabulary, cause-and-effect.
8. `TELUGU_APTITUDE`: Authentic Telugu script and terminology (లాభనష్టాలు, నిష్పత్తి, కాలం-పని).
9. `AMBIGUOUS_ADVERSARIAL`: Intentionally under-specified premises, multiple defensible answers, distractors.
10. `WRONG_ANSWER_AND_EXPLANATION`: Key mismatches and mathematically hallucinated derivation steps.

---

## 2. Core Contracts & Types

Defined in `src/benchmarks/types/benchmark.types.ts`:

- **`BenchmarkCategory`**: Enum of the 10 quantitative, verbal, and linguistic categories.
- **`BenchmarkGroundTruth`**: Human-established benchmark annotations:
  - `expectedVerdict`: `'VALID' | 'INVALID' | 'NEEDS_REVIEW'`
  - `isDeclaredAnswerCorrect`: Boolean verification of the answer key.
  - `isExplanationLogicallySound`: Verification that explanation derivation is mathematically/logically free of hallucination.
  - `isAmbiguous`: Flags ambiguous phrasing or multiple viable answers.
  - `isTeluguLinguisticallyAccurate`: Linguistic and orthographic correctness for Telugu questions.
  - `expectedIssues`: Array of detected issue tags.
  - `humanRationale`: Explanatory human review notes.
- **`BenchmarkQuestionItem`**: The question definition containing prompt, options, declared key, explanation, and ground-truth metadata.
- **`BenchmarkPrediction`**: Records real AI evaluation responses (verdict, confidence score, issues, summary, provider/model, latency, timestamp, raw response reference).
- **`BenchmarkResult`**: Per-item comparison between ground truth and model prediction.
- **`BenchmarkMetrics`**: Aggregate scorecard tracking:
  - Total items, correct and incorrect predictions, overall accuracy.
  - **False VALID** (Type I error / safety risk: approving a flawed question).
  - **False INVALID** (Type II error / friction risk: rejecting a sound question).
  - 3x3 Confusion Matrix (`expected` vs `predicted`).
  - Per-category breakdown (accuracy, false rates, mean confidence).
  - Ambiguity detection precision and recall.
  - Explanation hallucination detection precision and recall.
  - Telugu accuracy.
  - Confidence calibration statistics across confidence bands.

---

## 3. Architecture & Safety Rules

- **Zero Production Intrusion**: Benchmark contracts, datasets, and runners reside strictly under `src/benchmarks/`.
- **Zero Modification to Validation Pipelines**: Production validation engines (`QuestionValidationEngine`, `ConsensusEngine`, Phase 25) are not modified.
- **Quota Safety**: The runner executes sequentially with configurable pacing to avoid rate-limit exhaustion.
- **Offline Replay**: Raw responses are logged so metrics and confusion matrices can be recomputed without incurring API token costs.
