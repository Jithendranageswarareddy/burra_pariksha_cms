/**
 * BURRA PARIKSHA CMS - Canonical Frontend API Public Barrel
 * S7-T11: Establish One Authoritative Frontend API Access Boundary
 *
 * Exposes feature-oriented API functions and canonical HTTP transport.
 */

// Authoritative HTTP client & error abstractions
export {
  ApiClient,
  ApiClientError,
  apiClient,
  getApiErrorMessage,
  type ApiResponse,
  type RecoveryStatusResponse,
  type SnapshotHistoryItem,
} from './api-client';

// Canonical Feature-Oriented API modules
export { planningApi } from './planning.api';
export { learningUnitsApi } from './learning-units.api';
export { taxonomyApi } from './taxonomy.api';
export { questionsApi } from './questions.api';
export { videosApi } from './videos.api';
export { publishingApi } from './publishing.api';

// Canonical contracts & types re-exported for frontend consumers
export * from './contracts';
