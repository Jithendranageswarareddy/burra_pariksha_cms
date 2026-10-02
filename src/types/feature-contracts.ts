/**
 * BURRA PARIKSHA CMS — Stage 26 Feature Contracts Architecture
 *
 * Formally codifies the 15-Dimension Feature Contract Standard across
 * all 8 canonical manufacturing features (FEAT-01 to FEAT-08).
 * Enforces Anti-Self-Approval (GAR-02), Non-Authoritative AI (AP-009),
 * OCC, and Instant Rollback mechanisms.
 */

import { z } from 'zod';

// ============================================================================
// 1. FEATURE CONTRACT IDENTIFIERS & ENUMS
// ============================================================================

export enum FeatureContractId {
  FEAT_01 = 'FEAT-01',
  FEAT_02 = 'FEAT-02',
  FEAT_03 = 'FEAT-03',
  FEAT_04 = 'FEAT-04',
  FEAT_05 = 'FEAT-05',
  FEAT_06 = 'FEAT-06',
  FEAT_07 = 'FEAT-07',
  FEAT_08 = 'FEAT-08',
}

export enum FeatureStatus {
  ACCEPTED = 'ACCEPTED',
  DRAFT = 'DRAFT',
  DEPRECATED = 'DEPRECATED',
}

// ============================================================================
// 2. THE 15 CONTRACT DIMENSION SCHEMAS
// ============================================================================

export const RequirementDimensionSchema = z.object({
  problemStatement: z.string().min(10),
  businessObjective: z.string().min(10),
  userOutcome: z.string().min(10),
});

export const BusinessAcceptanceDimensionSchema = z.object({
  acceptanceCriteria: z.array(z.string().min(5)).min(2),
  successMetrics: z.array(z.string().min(3)).min(1),
  signOffRole: z.string().min(3),
});

export const DomainEntitiesDimensionSchema = z.object({
  primaryEntities: z.array(z.string().min(2)).min(1),
  valueObjects: z.array(z.string().min(2)).min(1),
  relationships: z.array(z.string().min(5)).min(1),
});

export const DatabaseDimensionSchema = z.object({
  collections: z.array(z.string().min(2)).min(1),
  primaryKeys: z.array(z.string().min(2)).min(1),
  indexes: z.array(z.string().min(3)).min(1),
  concurrencyMode: z.literal('OPTIMISTIC_CONCURRENCY_CONTROL'),
});

export const ApiDimensionSchema = z.object({
  endpoints: z.array(
    z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      path: z.string().startsWith('/api/'),
      description: z.string().min(5),
    })
  ).min(1),
  responseEnvelope: z.literal('ApiResponseEnvelope'),
});

export const FrontendDimensionSchema = z.object({
  workspaceHub: z.string().min(3),
  routePath: z.string().startsWith('/'),
  layoutMode: z.string().min(3),
  interactiveComponents: z.array(z.string().min(3)).min(1),
});

export const RbacDimensionSchema = z.object({
  requiredCapabilities: z.array(z.string().min(3)).min(1),
  allowedRoles: z.array(z.string().min(3)).min(1),
  antiSelfApprovalEnforced: z.boolean(),
  segregationOfDuties: z.string().min(5),
});

export const WorkflowDimensionSchema = z.object({
  workflowSteps: z.array(z.number().int().min(1).max(15)).min(1),
  initialStatus: z.string().min(3),
  targetStatus: z.string().min(3),
  isHumanGated: z.boolean(),
  nonAuthoritativeAiEnforced: z.boolean(),
});

export const ValidationDimensionSchema = z.object({
  zodSchemas: z.array(z.string().min(3)).min(1),
  bilingualValidation: z.boolean(),
  invariants: z.array(z.string().min(5)).min(1),
});

export const ErrorsDimensionSchema = z.object({
  errorCodes: z.array(z.string().startsWith('ERR_')).min(2),
  httpStatusMappings: z.record(z.string(), z.number().int().min(400).max(599)),
  userRecoveryAction: z.string().min(10),
});

export const AuditDimensionSchema = z.object({
  auditEvents: z.array(z.string().startsWith('AUDIT_')).min(1),
  forensicDimensions: z.array(z.string()).min(5), // Who, Did What, To What, When, Where, Why, With What Result
  severity: z.enum(['INFO', 'WARN', 'ERROR', 'CRITICAL']),
});

export const RealtimeDimensionSchema = z.object({
  sseTopics: z.array(z.string().min(3)).min(1),
  broadcastPayloadSummary: z.string().min(10),
});

export const TestsDimensionSchema = z.object({
  testSuitePath: z.string().min(5),
  coveredScenariosCount: z.number().int().min(9), // 9 canonical failure/recovery scenarios
  testLevelsCovered: z.array(z.string()).min(3),
});

export const DeploymentDimensionSchema = z.object({
  runtime: z.string().min(3),
  environmentVars: z.array(z.string().min(2)).min(1),
  resourceLimits: z.string().min(5),
});

export const RollbackDimensionSchema = z.object({
  rollbackTrigger: z.string().min(10),
  rollbackMechanism: z.string().min(10),
  dataCompensationPlan: z.string().min(10),
  maxRtoSeconds: z.number().int().positive(),
});

// ============================================================================
// 3. MASTER FEATURE CONTRACT SCHEMA
// ============================================================================

export const FeatureContractSchema = z.object({
  id: z.nativeEnum(FeatureContractId),
  name: z.string().min(5),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.nativeEnum(FeatureStatus),
  contractDocPath: z.string().min(5),
  dimensions: z.object({
    requirement: RequirementDimensionSchema,
    businessAcceptance: BusinessAcceptanceDimensionSchema,
    domainEntities: DomainEntitiesDimensionSchema,
    database: DatabaseDimensionSchema,
    api: ApiDimensionSchema,
    frontend: FrontendDimensionSchema,
    rbac: RbacDimensionSchema,
    workflow: WorkflowDimensionSchema,
    validation: ValidationDimensionSchema,
    errors: ErrorsDimensionSchema,
    audit: AuditDimensionSchema,
    realtime: RealtimeDimensionSchema,
    tests: TestsDimensionSchema,
    deployment: DeploymentDimensionSchema,
    rollback: RollbackDimensionSchema,
  }),
});

export type FeatureContract = z.infer<typeof FeatureContractSchema>;
export type RequirementDimension = z.infer<typeof RequirementDimensionSchema>;
export type BusinessAcceptanceDimension = z.infer<typeof BusinessAcceptanceDimensionSchema>;
export type DomainEntitiesDimension = z.infer<typeof DomainEntitiesDimensionSchema>;
export type DatabaseDimension = z.infer<typeof DatabaseDimensionSchema>;
export type ApiDimension = z.infer<typeof ApiDimensionSchema>;
export type FrontendDimension = z.infer<typeof FrontendDimensionSchema>;
export type RbacDimension = z.infer<typeof RbacDimensionSchema>;
export type WorkflowDimension = z.infer<typeof WorkflowDimensionSchema>;
export type ValidationDimension = z.infer<typeof ValidationDimensionSchema>;
export type ErrorsDimension = z.infer<typeof ErrorsDimensionSchema>;
export type AuditDimension = z.infer<typeof AuditDimensionSchema>;
export type RealtimeDimension = z.infer<typeof RealtimeDimensionSchema>;
export type TestsDimension = z.infer<typeof TestsDimensionSchema>;
export type DeploymentDimension = z.infer<typeof DeploymentDimensionSchema>;
export type RollbackDimension = z.infer<typeof RollbackDimensionSchema>;

// ============================================================================
// 4. CANONICAL FEATURE CONTRACT REGISTRY (8 FEATURES x 15 DIMENSIONS)
// ============================================================================

export const CANONICAL_FEATURE_CONTRACTS: Record<FeatureContractId, FeatureContract> = {
  [FeatureContractId.FEAT_01]: {
    id: FeatureContractId.FEAT_01,
    name: 'Question Ingestion & Authoring',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/01-FEAT-QUESTION-INGESTION.md',
    dimensions: {
      requirement: {
        problemStatement: 'Ingest and author bilingual Telugu/English questions across 5 exam categories with math precision.',
        businessObjective: 'Ensure zero-schema deviation, LaTeX validation, and duplicate detection prior to SME verification.',
        userOutcome: 'Author drafts rich bilingual questions with live math previews and instant duplicate detection.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Full bilingual prompt, 4 distinct options, explanation, and difficulty tier.',
          'LaTeX / Unicode math expressions balance check.',
          'Duplicate detection blocks exact hash matches.',
        ],
        successMetrics: ['< 1% syntax error rate', '100% duplicate prevention'],
        signOffRole: 'CONTENT_LEAD',
      },
      domainEntities: {
        primaryEntities: ['QuestionEntity', 'TaxonomyMetadata'],
        valueObjects: ['QuestionOption', 'BilingualText', 'MathematicalExpression'],
        relationships: ['QuestionEntity 1:N QuestionOption', 'QuestionEntity N:1 TaxonomyMetadata'],
      },
      database: {
        collections: ['questions'],
        primaryKeys: ['questionId'],
        indexes: ['category_difficulty_idx', 'content_hash_unique_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/questions', description: 'Create and author new question' },
          { method: 'GET', path: '/api/v1/questions', description: 'List questions with filtering' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Question Studio',
        routePath: '/studio/questions',
        layoutMode: 'Unified Studio',
        interactiveComponents: ['QuestionAuthoringForm', 'MathExpressionPreview', 'DuplicateDetectorBadge'],
      },
      rbac: {
        requiredCapabilities: ['question:create'],
        allowedRoles: ['AUTHOR', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: true,
        segregationOfDuties: 'Author of question cannot approve in Step 02 review gate (GAR-02).',
      },
      workflow: {
        workflowSteps: [1],
        initialStatus: 'DRAFT',
        targetStatus: 'PENDING_REVIEW',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['CreateQuestionInputSchema', 'QuestionOptionSchema'],
        bilingualValidation: true,
        invariants: ['Must contain 4 distinct options', 'Correct option index in range 0..3'],
      },
      errors: {
        errorCodes: ['ERR_QUESTION_DUPLICATE', 'ERR_MATH_SYNTAX_INVALID', 'ERR_BILINGUAL_PARSING_FAILED'],
        httpStatusMappings: { ERR_QUESTION_DUPLICATE: 409, ERR_MATH_SYNTAX_INVALID: 422, ERR_BILINGUAL_PARSING_FAILED: 400 },
        userRecoveryAction: 'Review duplicated question reference or correct LaTeX equation syntax.',
      },
      audit: {
        auditEvents: ['AUDIT_QUESTION_CREATED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['question.created'],
        broadcastPayloadSummary: 'Emits question ID, category, author ID, and timestamp upon creation.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'Component', 'API', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js',
        environmentVars: ['PORT', 'NODE_ENV', 'FIRESTORE_PROJECT_ID'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Ingestion error rate > 5% or corrupt math parsing detected.',
        rollbackMechanism: 'State soft delete / mark status as DRAFT_CORRUPTED in transaction.',
        dataCompensationPlan: 'Emit compensation audit event and release OCC lock.',
        maxRtoSeconds: 30,
      },
    },
  },

  [FeatureContractId.FEAT_02]: {
    id: FeatureContractId.FEAT_02,
    name: 'Question Verification & SME Approval',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/02-FEAT-QUESTION-VERIFICATION.md',
    dimensions: {
      requirement: {
        problemStatement: 'SME quality control and anti-self-approval review on authored questions.',
        businessObjective: 'Enforce academic correctness and strict Segregation of Duties (GAR-02, AP-009).',
        userOutcome: 'SME verifies questions, logs structured feedback, and advances or rejects question.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'SME can approve, request revision, or reject with feedback.',
          'Reviewer cannot be the author of the question (GAR-02 anti-self-approval).',
          'Automated AI checks must pass before human approval.',
        ],
        successMetrics: ['Zero author self-approvals', '100% feedback on revision/rejection'],
        signOffRole: 'HEAD_OF_ACADEMICS',
      },
      domainEntities: {
        primaryEntities: ['QuestionReviewRecord', 'QuestionEntity'],
        valueObjects: ['SmeFeedback', 'ApprovalDecision'],
        relationships: ['QuestionEntity 1:N QuestionReviewRecord'],
      },
      database: {
        collections: ['question_reviews', 'questions'],
        primaryKeys: ['reviewId'],
        indexes: ['question_reviews_question_id_idx', 'question_reviews_reviewer_id_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/questions/review', description: 'Submit SME review decision' },
          { method: 'GET', path: '/api/v1/questions/review-queue', description: 'Fetch review queue' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Question Studio',
        routePath: '/studio/questions/review',
        layoutMode: 'Unified Studio Split-Pane',
        interactiveComponents: ['SmeReviewWorkbench', 'SelfApprovalWarningBanner', 'QualityChecklist'],
      },
      rbac: {
        requiredCapabilities: ['question:review'],
        allowedRoles: ['REVIEWER', 'SME', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: true,
        segregationOfDuties: 'Mandatory reviewerId !== authorId check enforced server-side (GAR-02).',
      },
      workflow: {
        workflowSteps: [2],
        initialStatus: 'PENDING_REVIEW',
        targetStatus: 'APPROVED',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['SubmitQuestionReviewInputSchema'],
        bilingualValidation: false,
        invariants: ['reviewerId must not match authorId', 'Feedback required for non-approvals'],
      },
      errors: {
        errorCodes: ['ERR_SELF_APPROVAL_PROHIBITED', 'ERR_QUESTION_NOT_IN_REVIEW_STATE', 'ERR_CONCURRENCY_CONFLICT'],
        httpStatusMappings: { ERR_SELF_APPROVAL_PROHIBITED: 403, ERR_QUESTION_NOT_IN_REVIEW_STATE: 409, ERR_CONCURRENCY_CONFLICT: 412 },
        userRecoveryAction: 'Assign review to a different SME or refresh workbench for latest version.',
      },
      audit: {
        auditEvents: ['AUDIT_QUESTION_REVIEWED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['question.reviewed'],
        broadcastPayloadSummary: 'Emits question ID, decision, reviewer ID, and next stage transition.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'Component', 'API', 'Security', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js',
        environmentVars: ['PORT', 'NODE_ENV', 'FIRESTORE_PROJECT_ID'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Detected illegitimate approval or concurrency anomaly.',
        rollbackMechanism: 'Invalidate review record, revert question state to PENDING_REVIEW.',
        dataCompensationPlan: 'Restore prior OCC version and log security alert.',
        maxRtoSeconds: 15,
      },
    },
  },

  [FeatureContractId.FEAT_03]: {
    id: FeatureContractId.FEAT_03,
    name: 'Explanatory Content & Scripting',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/03-FEAT-CONTENT-SCRIPTING.md',
    dimensions: {
      requirement: {
        problemStatement: 'Generate 60-second Telugu explanation scripts with AI and human polishing.',
        businessObjective: 'Assist writers with Gemini drafts while mandating human polish and timing checks.',
        userOutcome: 'Scriptwriter refines beats, timings, and visual cues for optimal YouTube Short retention.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'AI generates multi-beat script (Hook, Question, Solution, CTA).',
          'Non-Authoritative AI: AI draft cannot auto-advance without human polish (AP-009).',
          'Script duration estimated between 30 and 65 seconds.',
        ],
        successMetrics: ['100% human polish completion on scripts', 'Pacing within 30-65s'],
        signOffRole: 'LEAD_SCRIPTWRITER',
      },
      domainEntities: {
        primaryEntities: ['ScriptEntity', 'ScriptVersion'],
        valueObjects: ['ScriptBeat', 'VisualCue', 'SsmlAnnotation'],
        relationships: ['ScriptEntity 1:N ScriptVersion', 'ScriptEntity 1:N ScriptBeat'],
      },
      database: {
        collections: ['scripts', 'script_versions'],
        primaryKeys: ['scriptId'],
        indexes: ['scripts_question_id_idx', 'scripts_status_updated_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/scripts/generate', description: 'AI script generation draft' },
          { method: 'PUT', path: '/api/v1/scripts/polish', description: 'Human script polish submission' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Content Hub',
        routePath: '/content/scripts',
        layoutMode: 'Teleprompter Beat-Editor',
        interactiveComponents: ['ScriptBeatEditor', 'TeleprompterPacingMeter', 'TeluguKeyboardToolbar'],
      },
      rbac: {
        requiredCapabilities: ['content:script'],
        allowedRoles: ['SCRIPTWRITER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Human editor must sign off on AI-generated script.',
      },
      workflow: {
        workflowSteps: [3, 4],
        initialStatus: 'SCRIPT_PENDING',
        targetStatus: 'SCRIPT_POLISHED',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['ScriptContentSchema', 'ScriptBeatSchema'],
        bilingualValidation: true,
        invariants: ['Duration must be between 30 and 65 seconds', 'Telugu Unicode presence >= 60%'],
      },
      errors: {
        errorCodes: ['ERR_SCRIPT_TOO_LONG', 'ERR_GEMINI_QUOTA_EXCEEDED', 'ERR_UNAUTHORIZED_AUTO_PROCEED'],
        httpStatusMappings: { ERR_SCRIPT_TOO_LONG: 422, ERR_GEMINI_QUOTA_EXCEEDED: 429, ERR_UNAUTHORIZED_AUTO_PROCEED: 403 },
        userRecoveryAction: 'Trim dialogue beats or retry AI generation after cooldown.',
      },
      audit: {
        auditEvents: ['AUDIT_SCRIPT_GENERATED', 'AUDIT_SCRIPT_POLISHED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['script.updated'],
        broadcastPayloadSummary: 'Emits script ID, status, version, and editor ID.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'Component', 'Integration', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js',
        environmentVars: ['PORT', 'NODE_ENV', 'GEMINI_API_KEY'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Script corrupted or editor requests full undo.',
        rollbackMechanism: 'Revert to prior version in script_versions collection.',
        dataCompensationPlan: 'Restore previous OCC snapshot and reset status to SCRIPT_PENDING.',
        maxRtoSeconds: 20,
      },
    },
  },

  [FeatureContractId.FEAT_04]: {
    id: FeatureContractId.FEAT_04,
    name: 'Audio Narration & Voiceover Processing',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/04-FEAT-AUDIO-NARRATION.md',
    dimensions: {
      requirement: {
        problemStatement: 'Record or generate Telugu audio voiceovers with quality inspection.',
        businessObjective: 'Store audio binaries in Drive with SHA-256 validation and require QC sign-off.',
        userOutcome: 'Audio engineer validates audio take waveform, sync markers, and loudness levels.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Multi-take audio ingestion with SHA-256 checksum verification.',
          'Audio duration strictly matches script boundaries (+/- 2.0s).',
          'Step 06 Human QC sign-off required prior to video rendering.',
        ],
        successMetrics: ['100% SHA-256 match rate', 'Loudness in -14 LUFS to -16 LUFS range'],
        signOffRole: 'CHIEF_AUDIO_ENGINEER',
      },
      domainEntities: {
        primaryEntities: ['AudioTrackEntity', 'AudioQcInspection'],
        valueObjects: ['AudioTake', 'Sha256Checksum'],
        relationships: ['AudioTrackEntity 1:N AudioTake', 'AudioTrackEntity 1:1 AudioQcInspection'],
      },
      database: {
        collections: ['audio_assets', 'media_assets'],
        primaryKeys: ['audioId'],
        indexes: ['audio_assets_script_id_idx', 'audio_assets_sha256_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/audio/upload', description: 'Upload audio take binary' },
          { method: 'POST', path: '/api/v1/audio/qc', description: 'Submit audio QC inspection' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Media Lab',
        routePath: '/media/audio',
        layoutMode: 'Audio Waveform Workbench',
        interactiveComponents: ['AudioWaveformPlayer', 'MultiTakeSelector', 'AudioQcScorecard'],
      },
      rbac: {
        requiredCapabilities: ['media:audio'],
        allowedRoles: ['VOICE_ARTIST', 'AUDIO_ENGINEER', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Audio engineer inspects and approves voiceover recordings.',
      },
      workflow: {
        workflowSteps: [5, 6],
        initialStatus: 'AUDIO_PENDING',
        targetStatus: 'AUDIO_APPROVED',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['AudioUploadSchema', 'AudioQcSchema'],
        bilingualValidation: false,
        invariants: ['MIME type in audio/mpeg, audio/wav, audio/aac', 'File size <= 25MB'],
      },
      errors: {
        errorCodes: ['ERR_AUDIO_CORRUPTED', 'ERR_DRIVE_STORAGE_FAILED', 'ERR_SHA256_MISMATCH'],
        httpStatusMappings: { ERR_AUDIO_CORRUPTED: 422, ERR_DRIVE_STORAGE_FAILED: 502, ERR_SHA256_MISMATCH: 409 },
        userRecoveryAction: 'Re-upload audio file or retry Google Drive upload session.',
      },
      audit: {
        auditEvents: ['AUDIT_AUDIO_UPLOADED', 'AUDIT_AUDIO_QC_APPROVED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['audio.processed'],
        broadcastPayloadSummary: 'Emits audio ID, script ID, duration, and QC approval status.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'API', 'Integration', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js',
        environmentVars: ['PORT', 'NODE_ENV', 'GOOGLE_DRIVE_ROOT_FOLDER_ID'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Corrupt audio playback or incorrect take approved.',
        rollbackMechanism: 'Soft delete Drive reference and revert audio status to AUDIO_PENDING.',
        dataCompensationPlan: 'Reset audio pointer and emit compensation audit event.',
        maxRtoSeconds: 30,
      },
    },
  },

  [FeatureContractId.FEAT_05]: {
    id: FeatureContractId.FEAT_05,
    name: 'Visual Asset Generation & Drive Ingestion',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/05-FEAT-VISUAL-ASSETS.md',
    dimensions: {
      requirement: {
        problemStatement: 'Assemble 9:16 vertical visual layouts, graphics, and YouTube thumbnails.',
        businessObjective: 'Ensure aspect ratio compliance, SHA-256 tracking, and human thumbnail approval.',
        userOutcome: 'Designer creates high-contrast visual cards, option overlays, and thumbnail assets.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Visual assets adhere to 1080x1920 (video) and 1280x720 (thumbnail) resolutions.',
          'High-contrast Telugu/English typography overlay.',
          'Human approval gate at Step 08 before video rendering.',
        ],
        successMetrics: ['100% resolution compliance', 'Zero orphaned asset records'],
        signOffRole: 'LEAD_DESIGNER',
      },
      domainEntities: {
        primaryEntities: ['VisualAssetEntity', 'ThumbnailEntity'],
        valueObjects: ['MediaLayer', 'DriveAssetReference'],
        relationships: ['QuestionEntity 1:N VisualAssetEntity', 'QuestionEntity 1:1 ThumbnailEntity'],
      },
      database: {
        collections: ['visual_assets', 'thumbnails'],
        primaryKeys: ['assetId'],
        indexes: ['visual_assets_question_type_idx', 'visual_assets_sha256_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/media/visuals', description: 'Upload / register visual asset' },
          { method: 'POST', path: '/api/v1/media/thumbnails', description: 'Approve thumbnail asset' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Media Lab',
        routePath: '/media/visuals',
        layoutMode: 'Visual Stage Canvas',
        interactiveComponents: ['VisualCanvasStage', 'ThumbnailAbComparator', 'LayerHierarchyTree'],
      },
      rbac: {
        requiredCapabilities: ['media:upload'],
        allowedRoles: ['DESIGNER', 'MEDIA_PRODUCER', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Visual designer produces graphics; producer approves thumbnail.',
      },
      workflow: {
        workflowSteps: [7, 8],
        initialStatus: 'VISUALS_PENDING',
        targetStatus: 'VISUALS_APPROVED',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['VisualAssetSchema', 'ThumbnailSchema'],
        bilingualValidation: false,
        invariants: ['Aspect ratio must match 9:16 or 16:9', 'Image format PNG or WebP'],
      },
      errors: {
        errorCodes: ['ERR_INVALID_ASPECT_RATIO', 'ERR_DRIVE_QUOTA_EXCEEDED', 'ERR_CHECKSUM_VERIFICATION_FAILED'],
        httpStatusMappings: { ERR_INVALID_ASPECT_RATIO: 422, ERR_DRIVE_QUOTA_EXCEEDED: 507, ERR_CHECKSUM_VERIFICATION_FAILED: 400 },
        userRecoveryAction: 'Resize graphic canvas to 1080x1920 or clear Drive cache.',
      },
      audit: {
        auditEvents: ['AUDIT_VISUAL_ASSET_CREATED', 'AUDIT_THUMBNAIL_APPROVED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['visuals.updated'],
        broadcastPayloadSummary: 'Emits visual asset ID, type, dimensions, and approval state.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'Component', 'API', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js',
        environmentVars: ['PORT', 'NODE_ENV', 'GOOGLE_DRIVE_ROOT_FOLDER_ID'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Corrupted image layers or incorrect aspect ratio uploaded.',
        rollbackMechanism: 'Delete preview from Drive, restore prior thumbnail version.',
        dataCompensationPlan: 'Reset visual state to VISUALS_PENDING and notify designer.',
        maxRtoSeconds: 30,
      },
    },
  },

  [FeatureContractId.FEAT_06]: {
    id: FeatureContractId.FEAT_06,
    name: 'Video Rendering & Quality Inspection',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/06-FEAT-VIDEO-RENDERING-QC.md',
    dimensions: {
      requirement: {
        problemStatement: 'Composite video, audio, visual overlays, and countdown timers into 1080x1920 MP4.',
        businessObjective: 'Execute asynchronous render jobs with SSE progress tracking and mandatory human QC sign-off.',
        userOutcome: 'Video producer performs frame-by-frame QC inspection before marking video ready for publishing.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Video render output conforms to 1080x1920 60fps MP4 format.',
          'Audio-video sync drift <= 50ms.',
          'Step 10 Human QC gate required before publishing release package.',
        ],
        successMetrics: ['< 50ms sync drift', '100% human QC sign-off on published videos'],
        signOffRole: 'EXECUTIVE_PRODUCER',
      },
      domainEntities: {
        primaryEntities: ['VideoJobEntity', 'VideoEntity'],
        valueObjects: ['VideoRenderOutput', 'VideoQcInspection'],
        relationships: ['VideoEntity 1:N VideoJobEntity', 'VideoEntity 1:1 VideoQcInspection'],
      },
      database: {
        collections: ['video_jobs', 'videos'],
        primaryKeys: ['videoId'],
        indexes: ['videos_status_created_idx', 'videos_question_final_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/videos/render', description: 'Trigger video composition job' },
          { method: 'POST', path: '/api/v1/videos/qc', description: 'Submit human video QC decision' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Production Studio',
        routePath: '/production/board',
        layoutMode: 'Video QC Player Board',
        interactiveComponents: ['VideoFrameScrubber', 'AudioSyncVisualizer', 'QcScorecardPanel'],
      },
      rbac: {
        requiredCapabilities: ['video:render'],
        allowedRoles: ['VIDEO_EDITOR', 'PRODUCER', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Producer verifies video quality before dispatch to distribution.',
      },
      workflow: {
        workflowSteps: [9, 10],
        initialStatus: 'RENDER_PENDING',
        targetStatus: 'READY_FOR_PUBLISHING',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['RenderJobRequestSchema', 'VideoQcSchema'],
        bilingualValidation: false,
        invariants: ['Video duration between 30 and 60 seconds', 'Bitrate >= 8000 kbps'],
      },
      errors: {
        errorCodes: ['ERR_RENDER_PIPELINE_FAILED', 'ERR_AUDIO_VIDEO_SYNC_DRIFT', 'ERR_INVALID_VIDEO_DIMENSIONS'],
        httpStatusMappings: { ERR_RENDER_PIPELINE_FAILED: 500, ERR_AUDIO_VIDEO_SYNC_DRIFT: 422, ERR_INVALID_VIDEO_DIMENSIONS: 400 },
        userRecoveryAction: 'Re-trigger video render pipeline with adjusted audio offset.',
      },
      audit: {
        auditEvents: ['AUDIT_VIDEO_RENDERED', 'AUDIT_VIDEO_QC_APPROVED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['video.render.progress', 'video.qc.completed'],
        broadcastPayloadSummary: 'Emits video ID, render progress percentage, and final QC approval status.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'API', 'Integration', 'Workflow', 'E2E'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js / Cloud Tasks',
        environmentVars: ['PORT', 'NODE_ENV', 'RENDER_WORKER_CONCURRENCY'],
        resourceLimits: '1024MiB RAM / 2 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Render artifact fails playback or fails QC inspection.',
        rollbackMechanism: 'Mark video job as RENDER_FAILED, purge output file, reset to RENDER_PENDING.',
        dataCompensationPlan: 'Release worker lock and log rollback trace.',
        maxRtoSeconds: 45,
      },
    },
  },

  [FeatureContractId.FEAT_07]: {
    id: FeatureContractId.FEAT_07,
    name: 'YouTube Multi-Platform Publishing',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/07-FEAT-PUBLISHING-DISTRIBUTION.md',
    dimensions: {
      requirement: {
        problemStatement: 'Assemble atomic publishing package and publish to YouTube Shorts with idempotency.',
        businessObjective: 'Ensure safe scheduled release, automated pinned comments, and instant unpublish support.',
        userOutcome: 'Publisher schedules release package and tracks live publication status in Distribution Hub.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Atomic release package: Video, Thumbnail, Title, Description, Tags, Pinned Comment.',
          'Idempotent upload via YouTube API with quota monitoring.',
          'Instant unpublish / privacy rollback capability.',
        ],
        successMetrics: ['100% pinned comment posting rate', 'Zero duplicate video uploads'],
        signOffRole: 'DISTRIBUTION_LEAD',
      },
      domainEntities: {
        primaryEntities: ['PublishingPackageEntity', 'PublicationRecord'],
        valueObjects: ['PinnedCommentEntity', 'DistributionChannel'],
        relationships: ['PublishingPackageEntity 1:1 VideoEntity', 'PublishingPackageEntity 1:N PublicationRecord'],
      },
      database: {
        collections: ['publishing_packages', 'publications'],
        primaryKeys: ['packageId'],
        indexes: ['packages_status_scheduled_idx', 'publications_youtube_id_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/publishing/package', description: 'Assemble release package' },
          { method: 'POST', path: '/api/v1/publishing/publish', description: 'Execute live / scheduled publish' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Distribution Hub',
        routePath: '/distribution/publishing',
        layoutMode: 'Release Package Inspector',
        interactiveComponents: ['ReleasePackageInspector', 'LiveYouTubeMetadataPreview', 'PublishingScheduler'],
      },
      rbac: {
        requiredCapabilities: ['publish:execute'],
        allowedRoles: ['PUBLISHER', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Publisher executes dispatch after video QC has been signed off.',
      },
      workflow: {
        workflowSteps: [11, 12],
        initialStatus: 'READY_FOR_PUBLISHING',
        targetStatus: 'PUBLISHED',
        isHumanGated: true,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['PublishPackageRequestSchema', 'SchedulePublishSchema'],
        bilingualValidation: false,
        invariants: ['Title length 10-100 characters', 'Tags count 1-30 items'],
      },
      errors: {
        errorCodes: ['ERR_YOUTUBE_QUOTA_EXCEEDED', 'ERR_YOUTUBE_AUTH_EXPIRED', 'ERR_PACKAGE_INCOMPLETE'],
        httpStatusMappings: { ERR_YOUTUBE_QUOTA_EXCEEDED: 429, ERR_YOUTUBE_AUTH_EXPIRED: 401, ERR_PACKAGE_INCOMPLETE: 422 },
        userRecoveryAction: 'Refresh YouTube OAuth credentials or reschedule publish slot.',
      },
      audit: {
        auditEvents: ['AUDIT_VIDEO_PUBLISHED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['publication.status'],
        broadcastPayloadSummary: 'Emits package ID, YouTube video ID, live URL, and publication timestamp.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'API', 'Integration', 'Workflow', 'E2E'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js / Cloud Tasks',
        environmentVars: ['PORT', 'NODE_ENV', 'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Incorrect video content published or copyright notice triggered.',
        rollbackMechanism: 'Set YouTube video privacy status to private/unlisted, mark package UNPUBLISHED.',
        dataCompensationPlan: 'Emit emergency unpublish audit event and alert Distribution Lead.',
        maxRtoSeconds: 60,
      },
    },
  },

  [FeatureContractId.FEAT_08]: {
    id: FeatureContractId.FEAT_08,
    name: 'Analytics & Feedback Closed-Loop',
    version: '1.1.0',
    status: FeatureStatus.ACCEPTED,
    contractDocPath: 'docs/architecture/feature-contracts/08-FEAT-ANALYTICS-INTELLIGENCE-FEEDBACK.md',
    dimensions: {
      requirement: {
        problemStatement: 'Ingest YouTube performance analytics and close the manufacturing loop with Step 01.',
        businessObjective: 'Calculate retention and virality scores to inform question topic and difficulty selection.',
        userOutcome: 'Analyst inspects performance trends and curriculum demand signals in Intelligence Hub.',
      },
      businessAcceptance: {
        acceptanceCriteria: [
          'Automated 24-hour YouTube analytics sync (views, retention, CTR, likes).',
          'Calculation of Retention Factor and Virality Index.',
          'Closed-loop feedback signals routed to Question Studio.',
        ],
        successMetrics: ['100% daily analytics sync reliability', 'Accurate feedback signal generation'],
        signOffRole: 'HEAD_OF_INTELLIGENCE',
      },
      domainEntities: {
        primaryEntities: ['AnalyticsSnapshotEntity', 'FeedbackSignalEntity'],
        valueObjects: ['PerformanceScoreRecord', 'TopicDemandMetric'],
        relationships: ['VideoEntity 1:N AnalyticsSnapshotEntity', 'TopicDemandMetric 1:N FeedbackSignalEntity'],
      },
      database: {
        collections: ['analytics_snapshots', 'topic_metrics', 'feedback_signals'],
        primaryKeys: ['snapshotId'],
        indexes: ['analytics_video_period_idx', 'topic_metrics_score_idx'],
        concurrencyMode: 'OPTIMISTIC_CONCURRENCY_CONTROL',
      },
      api: {
        endpoints: [
          { method: 'POST', path: '/api/v1/analytics/sync', description: 'Ingest YouTube analytics snapshot' },
          { method: 'GET', path: '/api/v1/intelligence/signals', description: 'Fetch topic demand feedback signals' },
        ],
        responseEnvelope: 'ApiResponseEnvelope',
      },
      frontend: {
        workspaceHub: 'Intelligence Hub',
        routePath: '/intelligence/analytics',
        layoutMode: 'Analytics Intelligence Matrix',
        interactiveComponents: ['RetentionCurveVisualizer', 'TopicHeatmapMatrix', 'AiRecommendationDrawer'],
      },
      rbac: {
        requiredCapabilities: ['analytics:view'],
        allowedRoles: ['ANALYST', 'PRODUCER', 'ADMIN', 'SUPER_ADMIN'],
        antiSelfApprovalEnforced: false,
        segregationOfDuties: 'Analyst manages performance models; feedback automates to Question Studio.',
      },
      workflow: {
        workflowSteps: [13, 14, 15],
        initialStatus: 'PUBLISHED',
        targetStatus: 'FEEDBACK_EMITTED',
        isHumanGated: false,
        nonAuthoritativeAiEnforced: true,
      },
      validation: {
        zodSchemas: ['AnalyticsSnapshotSchema', 'FeedbackSignalSchema'],
        bilingualValidation: false,
        invariants: ['Retention percentage between 0 and 100%', 'Views count non-negative'],
      },
      errors: {
        errorCodes: ['ERR_ANALYTICS_API_UNAVAILABLE', 'ERR_METRIC_OUT_OF_BOUNDS', 'ERR_FEEDBACK_LOOP_CYCLE'],
        httpStatusMappings: { ERR_ANALYTICS_API_UNAVAILABLE: 503, ERR_METRIC_OUT_OF_BOUNDS: 422, ERR_FEEDBACK_LOOP_CYCLE: 409 },
        userRecoveryAction: 'Retry analytics sync during off-peak hours or reset invalid topic weight.',
      },
      audit: {
        auditEvents: ['AUDIT_ANALYTICS_INGESTED', 'AUDIT_FEEDBACK_SIGNAL_GENERATED'],
        forensicDimensions: ['Actor ID', 'Action Name', 'Resource Target', 'Timestamp', 'IP/Origin', 'Reason Code', 'Result Status'],
        severity: 'INFO',
      },
      realtime: {
        sseTopics: ['analytics.updated'],
        broadcastPayloadSummary: 'Emits video ID, view count, retention percentage, and sync timestamp.',
      },
      tests: {
        testSuitePath: 'src/tests/stage26-feature-contracts.test.ts',
        coveredScenariosCount: 9,
        testLevelsCovered: ['Unit', 'API', 'Integration', 'Workflow'],
      },
      deployment: {
        runtime: 'Cloud Run Node.js / Cloud Tasks Cron',
        environmentVars: ['PORT', 'NODE_ENV', 'YOUTUBE_ANALYTICS_API_KEY'],
        resourceLimits: '512MiB RAM / 1 vCPU',
      },
      rollback: {
        rollbackTrigger: 'Erroneous metric ingestion skewing topic demand recommendations.',
        rollbackMechanism: 'Purge corrupted snapshot and recalculate topic scores from prior baseline.',
        dataCompensationPlan: 'Reset topic recommendation weights and emit compensation audit log.',
        maxRtoSeconds: 60,
      },
    },
  },
};

// ============================================================================
// 5. CONTRACT EVALUATION & QUERY HELPER FUNCTIONS
// ============================================================================

/**
 * Validates any object against the strict FeatureContractSchema.
 */
export function validateFeatureContract(contract: unknown): FeatureContract {
  return FeatureContractSchema.parse(contract);
}

/**
 * Retrieves a canonical feature contract by its FeatureContractId.
 */
export function getFeatureContractById(id: FeatureContractId): FeatureContract {
  const contract = CANONICAL_FEATURE_CONTRACTS[id];
  if (!contract) {
    throw new Error(`Feature contract not found for ID: ${id}`);
  }
  return contract;
}

/**
 * Returns all canonical feature contracts as an array.
 */
export function getAllFeatureContracts(): FeatureContract[] {
  return Object.values(CANONICAL_FEATURE_CONTRACTS);
}

/**
 * Enforces the Anti-Self-Approval rule (GAR-02, AP-009).
 * Rejects with false if reviewerId === authorId.
 */
export function verifyAntiSelfApprovalRule(authorId: string, reviewerId: string): boolean {
  if (!authorId || !reviewerId) return false;
  return authorId !== reviewerId;
}

/**
 * Enforces the Non-Authoritative AI rule (AP-009).
 * Verifies that AI agents cannot execute approvals on human-gated steps.
 */
export function verifyNonAuthoritativeAiRule(isAiAgent: boolean, stepNumber: number): boolean {
  // Human gated steps: 02 (Question Review), 04 (Script Polish), 06 (Audio QC), 08 (Thumbnail QC), 10 (Video QC), 12 (Publish Dispatch)
  const humanGatedSteps = [2, 4, 6, 8, 10, 12];
  if (isAiAgent && humanGatedSteps.includes(stepNumber)) {
    return false; // AI cannot approve human-gated steps
  }
  return true;
}

/**
 * Computes overall feature contract architecture completeness.
 * Verifies all 8 features x 15 dimensions = 120 total proof points.
 */
export function verifyContractCompleteness(): {
  totalContracts: number;
  totalDimensionsChecked: number;
  isComplete: boolean;
} {
  const contracts = getAllFeatureContracts();
  let totalDimensions = 0;

  for (const c of contracts) {
    const parsed = validateFeatureContract(c);
    const dimensionKeys = Object.keys(parsed.dimensions);
    totalDimensions += dimensionKeys.length;
  }

  const isComplete = contracts.length === 8 && totalDimensions === 8 * 15;
  return {
    totalContracts: contracts.length,
    totalDimensionsChecked: totalDimensions,
    isComplete,
  };
}
