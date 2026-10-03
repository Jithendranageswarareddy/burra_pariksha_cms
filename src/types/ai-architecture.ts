/**
 * BURRA PARIKSHA CMS — Stage 18 AI Architecture & Human-Gated Governance
 *
 * Defines the 7-step AI lifecycle, prompt template registry, Zod schemas,
 * immutable provenance models, and AP-009 non-authoritative AI governance rules.
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-009, AP-012, AP-014, AP-015)
 * - Stage 07 Canonical 15-Step Workflow
 * - Stage 08 State Model
 * - Stage 09 RBAC & Capability Matrix (HUMAN_GATED_STAGES)
 * - Stage 13 Data Contract
 * - Stage 15 API Architecture
 * - Stage 16 Real-Time Architecture
 * - Stage 17 Background Job Architecture
 */

import { z } from 'zod';
import { HUMAN_GATED_STAGES } from './rbac-models';

// ============================================================================
// 1. AI ENUMS & TAXONOMY
// ============================================================================

export enum AiProviderId {
  GEMINI = 'GEMINI',
}

export enum AiModelId {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
}

export enum AiTaskType {
  QUESTION_GENERATION = 'QUESTION_GENERATION',
  SCRIPT_DRAFTING = 'SCRIPT_DRAFTING',
  SOCIAL_SAFEZONE_ANALYSIS = 'SOCIAL_SAFEZONE_ANALYSIS',
  INTELLIGENCE_LOOP_SYNTHESIS = 'INTELLIGENCE_LOOP_SYNTHESIS',
}

export enum AiLifecycleStage {
  REQUESTED = 'REQUESTED',
  GENERATING = 'GENERATING',
  VALIDATED = 'VALIDATED',
  PREVIEW_STAGED = 'PREVIEW_STAGED',
  HUMAN_REVIEWED = 'HUMAN_REVIEWED',
  COMMITTED_TO_CANONICAL = 'COMMITTED_TO_CANONICAL',
  REJECTED = 'REJECTED',
}

export enum HumanReviewAction {
  ACCEPT = 'ACCEPT',
  EDIT = 'EDIT',
  REJECT = 'REJECT',
}

export enum AiFailureCategory {
  RATE_LIMITED = 'RATE_LIMITED',
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  TIMEOUT = 'TIMEOUT',
  SAFETY_BLOCK = 'SAFETY_BLOCK',
  AUTH_ERROR = 'AUTH_ERROR',
  FATAL = 'FATAL',
}

// ============================================================================
// 2. PROMPT MANAGEMENT & REGISTRY
// ============================================================================

export interface PromptTemplateDefinition {
  promptId: string;
  version: string;
  taskType: AiTaskType;
  model: AiModelId;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  userPromptTemplate: string;
  requiredVariables: string[];
}

export const PROMPT_TEMPLATE_REGISTRY: Record<string, PromptTemplateDefinition> = {
  'PRMPT-QGEN-TELUGU-V1': {
    promptId: 'PRMPT-QGEN-TELUGU-V1',
    version: '1.1.0',
    taskType: AiTaskType.QUESTION_GENERATION,
    model: AiModelId.GEMINI_2_5_FLASH,
    temperature: 0.3,
    maxTokens: 1024,
    systemInstruction:
      'You are a premier educational question author for 10th Class SSC. Generate questions strictly in Standard Modern Telugu script. Never use English transliteration.',
    userPromptTemplate:
      'Generate a 4-option multiple-choice question for Class {{classLevel}}, Subject: {{subject}}, Topic: {{topic}}, Bloom Level: {{bloomLevel}}.',
    requiredVariables: ['classLevel', 'subject', 'topic', 'bloomLevel'],
  },
  'PRMPT-SCRIPT-SPOKEN-V1': {
    promptId: 'PRMPT-SCRIPT-SPOKEN-V1',
    version: '1.1.0',
    taskType: AiTaskType.SCRIPT_DRAFTING,
    model: AiModelId.GEMINI_2_5_FLASH,
    temperature: 0.5,
    maxTokens: 1024,
    systemInstruction:
      'You are a high-energy spoken Telugu presenter. Write conversational teleprompter scripts optimized for 60-second vertical videos.',
    userPromptTemplate:
      'Write a spoken Telugu script with hook, body, and call-to-action for Question: {{questionText}}.',
    requiredVariables: ['questionText'],
  },
  'PRMPT-SAFEZONE-TAGS-V1': {
    promptId: 'PRMPT-SAFEZONE-TAGS-V1',
    version: '1.0.0',
    taskType: AiTaskType.SOCIAL_SAFEZONE_ANALYSIS,
    model: AiModelId.GEMINI_2_5_FLASH,
    temperature: 0.1,
    maxTokens: 512,
    systemInstruction: 'Analyze vertical 9:16 layout dimensions and verify safe zone margins for YouTube and Instagram.',
    userPromptTemplate: 'Evaluate safe-zone overlay compliance for thumbnail layout: {{layoutMetadata}}.',
    requiredVariables: ['layoutMetadata'],
  },
  'PRMPT-LOOP-INTEL-V1': {
    promptId: 'PRMPT-LOOP-INTEL-V1',
    version: '1.2.0',
    taskType: AiTaskType.INTELLIGENCE_LOOP_SYNTHESIS,
    model: AiModelId.GEMINI_2_5_PRO,
    temperature: 0.2,
    maxTokens: 2048,
    systemInstruction:
      'You are an expert curriculum psychometrician. Analyze audience retention drops and student misconception patterns to propose targeted curriculum improvements.',
    userPromptTemplate:
      'Synthesize analytics telemetry and review feedback for Question {{questionId}}: Retention: {{retentionCurve}}.',
    requiredVariables: ['questionId', 'retentionCurve'],
  },
};

// ============================================================================
// 3. ZOD SCHEMAS FOR STRUCTURED AI PAYLOADS
// ============================================================================

export const TeluguQuestionPayloadSchema = z.object({
  questionTextTelugu: z
    .string()
    .min(10)
    .regex(/[\u0C00-\u0C7F]/, 'Question must contain valid Telugu Unicode characters'),
  optionsTelugu: z
    .array(
      z.object({
        optionIndex: z.number().int().min(0).max(3),
        textTelugu: z.string().min(1).regex(/[\u0C00-\u0C7F]/, 'Option must contain Telugu script'),
      })
    )
    .length(4, 'Must contain exactly 4 options')
    .refine(
      (options) => {
        const texts = new Set(options.map((o) => o.textTelugu));
        return texts.size === 4;
      },
      { message: 'All 4 options must be unique' }
    ),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanationTelugu: z
    .string()
    .min(10)
    .regex(/[\u0C00-\u0C7F]/, 'Explanation must contain Telugu script'),
  bloomTaxonomyLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  estimatedDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

export type TeluguQuestionPayload = z.infer<typeof TeluguQuestionPayloadSchema>;

// ============================================================================
// 4. REQUEST, RESPONSE & PROVENANCE SCHEMAS
// ============================================================================

export const AiGenerationRequestSchema = z.object({
  requestId: z.string().regex(/^REQ-AI-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  promptId: z.string().min(5),
  promptVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  actorId: z.string().min(1),
  inputVariables: z.record(z.string(), z.string()),
  idempotencyKey: z.string().min(8),
});

export type AiGenerationRequest = z.infer<typeof AiGenerationRequestSchema>;

export const AiProvenanceRecordSchema = z.object({
  provenanceId: z.string().regex(/^PROV-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  provider: z.nativeEnum(AiProviderId),
  model: z.nativeEnum(AiModelId),
  promptId: z.string(),
  promptVersion: z.string(),
  promptHash: z.string().length(64), // SHA-256 hash
  tokenUsage: z.object({
    promptTokens: z.number().int().nonnegative(),
    candidateTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  }),
  latencyMs: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
  humanReviewerId: z.string().min(1),
  reviewedAt: z.string().datetime(),
  decision: z.nativeEnum(HumanReviewAction),
  wasEdited: z.boolean(),
  editedFields: z.array(z.string()),
});

export type AiProvenanceRecord = z.infer<typeof AiProvenanceRecordSchema>;

export const HumanReviewDecisionSchema = z.object({
  decision: z.nativeEnum(HumanReviewAction),
  humanReviewerId: z.string().min(1),
  editedPayload: z.record(z.string(), z.unknown()).nullable(),
  reviewNotes: z.string().optional(),
});

export type HumanReviewDecision = z.infer<typeof HumanReviewDecisionSchema>;

// ============================================================================
// 5. HELPER FUNCTIONS & GOVERNANCE GUARDS
// ============================================================================

export function createAiGenerationRequest(params: {
  requestId: string;
  promptId: string;
  actorId: string;
  inputVariables: Record<string, string>;
  idempotencyKey: string;
}): AiGenerationRequest {
  const promptDef = PROMPT_TEMPLATE_REGISTRY[params.promptId];
  if (!promptDef) {
    throw new Error(`Unknown prompt ID: ${params.promptId}`);
  }

  // Verify all required variables are supplied
  for (const requiredVar of promptDef.requiredVariables) {
    if (!params.inputVariables[requiredVar]) {
      throw new Error(`Missing required prompt variable: ${requiredVar}`);
    }
  }

  const req: AiGenerationRequest = {
    requestId: params.requestId,
    promptId: promptDef.promptId,
    promptVersion: promptDef.version,
    actorId: params.actorId,
    inputVariables: params.inputVariables,
    idempotencyKey: params.idempotencyKey,
  };

  AiGenerationRequestSchema.parse(req);
  return req;
}

export function validateAiQuestionPayload(rawPayload: unknown): {
  success: boolean;
  data?: TeluguQuestionPayload;
  errors?: string[];
} {
  const result = TeluguQuestionPayloadSchema.safeParse(rawPayload);
  if (!result.success) {
    return {
      success: false,
      errors: (result.error.issues ?? (result.error as any).errors ?? []).map(
        (issue: any) => `${issue.path.join('.')}: ${issue.message}`
      ),
    };
  }
  return { success: true, data: result.data };
}

export function validateAiLifecycleTransition(
  currentStage: AiLifecycleStage,
  targetStage: AiLifecycleStage
): { allowed: boolean; reason?: string } {
  const allowedTransitions: Record<AiLifecycleStage, AiLifecycleStage[]> = {
    [AiLifecycleStage.REQUESTED]: [AiLifecycleStage.GENERATING],
    [AiLifecycleStage.GENERATING]: [AiLifecycleStage.VALIDATED, AiLifecycleStage.REJECTED],
    [AiLifecycleStage.VALIDATED]: [AiLifecycleStage.PREVIEW_STAGED],
    [AiLifecycleStage.PREVIEW_STAGED]: [AiLifecycleStage.HUMAN_REVIEWED],
    [AiLifecycleStage.HUMAN_REVIEWED]: [AiLifecycleStage.COMMITTED_TO_CANONICAL, AiLifecycleStage.REJECTED],
    [AiLifecycleStage.COMMITTED_TO_CANONICAL]: [], // Terminal
    [AiLifecycleStage.REJECTED]: [], // Terminal
  };

  const allowed = allowedTransitions[currentStage]?.includes(targetStage) ?? false;
  return {
    allowed,
    reason: allowed ? undefined : `Illegal AI lifecycle transition from ${currentStage} to ${targetStage}`,
  };
}

export function applyHumanReviewDecision<T extends Record<string, unknown>>(
  stagedDraft: T,
  review: HumanReviewDecision
): { finalPayload: T | null; wasEdited: boolean; editedFields: string[] } {
  if (review.decision === HumanReviewAction.REJECT) {
    return { finalPayload: null, wasEdited: false, editedFields: [] };
  }

  if (review.decision === HumanReviewAction.ACCEPT) {
    return { finalPayload: stagedDraft, wasEdited: false, editedFields: [] };
  }

  if (review.decision === HumanReviewAction.EDIT) {
    if (!review.editedPayload) {
      throw new Error('Edited payload must be provided when decision is EDIT');
    }

    const editedFields: string[] = [];
    const merged = { ...stagedDraft, ...review.editedPayload };

    for (const key of Object.keys(review.editedPayload)) {
      if (JSON.stringify(stagedDraft[key]) !== JSON.stringify(review.editedPayload[key])) {
        editedFields.push(key);
      }
    }

    return { finalPayload: merged as T, wasEdited: true, editedFields };
  }

  throw new Error(`Unhandled review decision: ${review.decision}`);
}

/**
 * AP-009 Non-Authoritative AI Governance Guard
 * Confirms that AI agents cannot execute human-gated workflow transitions.
 */
export function enforceAiHumanGatingRule(
  isAiAgent: boolean,
  targetWorkflowStep: number
): { allowed: boolean; errorCode?: string } {
  if (isAiAgent && (HUMAN_GATED_STAGES as readonly number[]).includes(targetWorkflowStep)) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_BY_AI_GATING',
    };
  }
  return { allowed: true };
}

/**
 * Proves ₹0.00 operational cost under Gemini API Free Tier limits
 */
export function calculateAiCostINR(dailyRequests: number): {
  monthlyCostINR: number;
  isWithinFreeTier: boolean;
} {
  const GEMINI_FREE_DAILY_LIMIT = 1500;
  const isWithinFreeTier = dailyRequests <= GEMINI_FREE_DAILY_LIMIT;
  return {
    monthlyCostINR: isWithinFreeTier ? 0 : dailyRequests * 0.05 * 30 * 85,
    isWithinFreeTier,
  };
}
