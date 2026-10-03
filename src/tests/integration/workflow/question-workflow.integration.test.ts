/**
 * BURRA PARIKSHA CMS — Question Workflow Integration Test Suite
 *
 * Verifies:
 * 1. Stage 01 Draft creation vs Stage 02 Question Verification separation.
 * 2. Question Studio state machine rules and validation gates.
 * 3. Question status transition lifecycle and canonical step mapping.
 */

export { runDraftSeparationTests } from '../../draft-workflow-separation.test';
