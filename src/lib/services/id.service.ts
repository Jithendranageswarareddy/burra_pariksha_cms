/**
 * BURRA PARIKSHA CMS — ID Generation Service Facade
 * Sprint 6: Complete Removal of Entity ID Sequence Infrastructure
 *
 * Facade bridging to CanonicalIdService.
 * Guarantees zero database-backed counter dependency.
 */

import { CanonicalIdService, canonicalIdService } from '../id.service';

export { CanonicalIdService, CanonicalIdService as IdService, canonicalIdService, canonicalIdService as idService } from '../id.service';

export default canonicalIdService;
