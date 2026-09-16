import { QuestionValidatorProvider, Question, ValidationEvidence } from '../../../types';
import { geminiClient } from '../gemini.client';
import { DEFAULT_AI_CONFIG } from '../config';

const SYSTEM_INSTRUCTION = `You are an expert academic auditor and semantic reasoning evaluator for Burra Pariksha CMS.
Your job is to ruthlessly evaluate competitive aptitude questions, prioritizing logical soundness, clarity, and linguistic quality.

You will be given:
- Question Text
- Options (A, B, C, D)
- Declared Correct Answer
- Explanation
- Language (e.g. ENGLISH, TELUGU)

Your evaluation MUST distinguish between a "plausible distractor" (a good incorrect option that tests a common misconception) and an "ambiguous distractor" (an incorrect option that could arguably be correct under a valid interpretation of the question).

You MUST output a strict JSON structure matching the schema.

Evaluation Criteria:
1. declaredAnswer correctness: Is the declared option actually the single, objectively correct answer?
2. explanation correctness: Does the explanation derive the correct answer using 100% sound logic without hallucinations? (e.g. "5*5=25 because 5+5=25" is WRONG logic).
3. question ambiguity: Is the question phrased ambiguously? Are multiple options arguably correct?
4. linguistic quality: For Telugu or English, is the grammar natural and academically appropriate?
5. verbal/semantic correctness: For non-math questions (synonyms, logic), is the factual basis true?

Verdict Rules:
- VALID: The question has one objective truth, distractors are clearly wrong but plausible, phrasing is natural, and the explanation derives the correct answer using 100% sound logic.
- INVALID: Flawed logic in explanation, contradicts the correct answer, multiple correct options exist, or translation completely breaks meaning.
- UNCERTAIN: Borderline ambiguous, highly subjective, or you cannot confidently parse the logic.
`;

const Schema = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["VALID", "INVALID", "UNCERTAIN"] },
    confidenceScore: { type: "NUMBER" },
    reasoning: {
      type: "OBJECT",
      properties: {
        explanationLogic: { type: "STRING" },
        ambiguityAnalysis: { type: "STRING" },
        linguisticQuality: { type: "STRING" }
      },
      required: ["explanationLogic", "ambiguityAnalysis", "linguisticQuality"]
    },
    detectedIssues: {
      type: "ARRAY",
      items: { type: "STRING", enum: ["HALLUCINATED_EXPLANATION", "ILLOGICAL_CONCLUSION", "AMBIGUOUS_PHRASING", "PLAUSIBLE_DISTRACTOR", "POOR_TRANSLATION", "NONE"] }
    }
  },
  required: ["verdict", "confidenceScore", "reasoning", "detectedIssues"]
};

export class SemanticReasoningProvider implements QuestionValidatorProvider {
  public readonly providerId: string = 'semantic-reasoning-verifier';
  public readonly modelId: string;

  constructor(modelId?: string) {
    this.modelId = modelId || DEFAULT_AI_CONFIG.defaultModel;
  }

  public async validate(question: Question): Promise<ValidationEvidence> {
    const defaultRes: ValidationEvidence = {
      providerId: this.providerId,
      modelId: this.modelId,
      verdict: 'NEEDS_REVIEW',
      confidence: 0,
      reasoningSummary: '',
      detectedIssues: [],
      timestamp: new Date().toISOString()
    };

    if (!geminiClient.isConfigured()) {
      return {
        ...defaultRes,
        reasoningSummary: 'Semantic verifier unavailable: API key not configured.',
        detectedIssues: ['PROVIDER_UNAVAILABLE']
      };
    }

    const client = geminiClient.getClient();
    if (!client) {
      return {
        ...defaultRes,
        reasoningSummary: 'Semantic verifier unavailable: Client instance unavailable.',
        detectedIssues: ['PROVIDER_UNAVAILABLE']
      };
    }

    const prompt = `Please audit this question.
Question Text: """${question.questionText}"""
Language: ${question.language || 'ENGLISH'}
Options:
A: ${question.options?.a || ''}
B: ${question.options?.b || ''}
C: ${question.options?.c || ''}
D: ${question.options?.d || ''}
Declared Answer: ${question.options?.correctAnswer || (question as any).correctAnswer || ''}
Explanation: """${question.explanation || ''}"""
`;

    try {
      const response = await client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: Schema as any,
          temperature: 0.1,
        },
      });

      const text = response.text || '';
      if (!text) {
        throw new Error('Empty response from semantic solver.');
      }
      
      const parsed = JSON.parse(text);
      
      // Enforce confidence rules
      let finalVerdict = parsed.verdict;
      if (finalVerdict === 'VALID' && (parsed.confidenceScore < 0.85)) {
        finalVerdict = 'UNCERTAIN';
      }

      // Map to ValidationEvidence
      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict: finalVerdict === 'UNCERTAIN' ? 'NEEDS_REVIEW' : finalVerdict,
        confidence: parsed.confidenceScore,
        reasoningSummary: `Explanation Logic: ${parsed.reasoning.explanationLogic} | Ambiguity: ${parsed.reasoning.ambiguityAnalysis} | Linguistic: ${parsed.reasoning.linguisticQuality}`,
        detectedIssues: parsed.detectedIssues,
        explanationAssessment: {
          isClearAndAccurate: !parsed.detectedIssues.includes('HALLUCINATED_EXPLANATION') && !parsed.detectedIssues.includes('ILLOGICAL_CONCLUSION'),
          notes: parsed.reasoning.explanationLogic
        },
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        ...defaultRes,
        reasoningSummary: `Semantic verifier error: ${err.message}`,
        detectedIssues: ['PROVIDER_ERROR']
      };
    }
  }
}
