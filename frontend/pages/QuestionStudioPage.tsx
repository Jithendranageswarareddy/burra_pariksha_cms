/**
 * BURRA PARIKSHA CMS — Question Studio Page (Route Target)
 * Feature Slice Integration: delegates to frontend/features/question-generation
 */

export { QuestionStudioPage } from '../features/question-generation/pages/QuestionStudioPage';
export type {
  StudioCandidate,
  Step01WorkflowState,
  Step01StateEvaluation,
} from '../../shared/contracts/question-generation';
export { evaluateStep01CandidateState as getStep01WorkflowState } from '../../shared/contracts/question-generation';
