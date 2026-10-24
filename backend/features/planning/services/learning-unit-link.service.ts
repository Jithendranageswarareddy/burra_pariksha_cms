import {
  LearningUnit,
  validateLearningUnit,
  canonicalIdService,
} from '../../../../shared';
import { learningUnitsRepository } from '../../../../database/firestore/repositories/learning-units.repository';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessInvariantError,
} from '../../../../src/lib/errors';

export interface LearningUnitLinkActor {
  id: string;
  role?: string;
  roles?: string[];
}

const ELEVATED_LINK_ROLES = new Set([
  'ADMIN',
  'CONTENT_LEAD',
  'CONTENT_MANAGER',
  'TOPIC_LEAD',
  'QA_REVIEWER',
  'REVIEWER',
]);

/**
 * Validates a client-supplied relationship against the persisted LearningUnit.
 * The planning contract has no VERIFIED state, so SUBMITTED_FOR_VERIFICATION is
 * the strongest authoritative eligibility state currently available.
 */
export async function validateLearningUnitLink(
  learningUnitId: string | undefined,
  actor: LearningUnitLinkActor,
  repository: Pick<typeof learningUnitsRepository, 'findById'> = learningUnitsRepository
): Promise<LearningUnit | undefined> {
  if (learningUnitId === undefined || learningUnitId === null || learningUnitId === '') {
    return undefined;
  }

  const normalizedId = typeof learningUnitId === 'string' ? learningUnitId.trim() : '';
  if (!canonicalIdService.validateCanonicalId(normalizedId, 'lnu_')) {
    throw new ValidationError(
      `Invalid LearningUnit reference "${String(learningUnitId)}". Expected canonical lnu_<uuid_v4> identifier.`,
      { learningUnitId }
    );
  }

  const learningUnit = await repository.findById(normalizedId);
  if (!learningUnit) {
    throw new NotFoundError(`LearningUnit with ID "${normalizedId}" does not exist.`, {
      learningUnitId: normalizedId,
    });
  }

  const validation = validateLearningUnit(learningUnit);
  if (!validation.isValid) {
    throw new BusinessInvariantError(
      `LearningUnit "${normalizedId}" is not eligible for artifact linking because its persisted record is invalid.`,
      { learningUnitId: normalizedId, errors: validation.errors || [] }
    );
  }

  if (learningUnit.planningStatus !== 'SUBMITTED_FOR_VERIFICATION') {
    throw new BusinessInvariantError(
      `LearningUnit "${normalizedId}" is not eligible for artifact linking until it is submitted for verification.`,
      { learningUnitId: normalizedId, planningStatus: learningUnit.planningStatus || 'DRAFT' }
    );
  }

  const actorRoles = [actor.role, ...(actor.roles || [])]
    .filter((role): role is string => typeof role === 'string')
    .map((role) => role.toUpperCase());
  const mayLinkAnyUnit = actorRoles.some((role) => ELEVATED_LINK_ROLES.has(role));
  if (!mayLinkAnyUnit && learningUnit.authorId !== actor.id) {
    throw new ForbiddenError(
      `User "${actor.id}" is not authorized to link LearningUnit "${normalizedId}" because it is owned by another author.`,
      { learningUnitId: normalizedId, authorId: learningUnit.authorId }
    );
  }

  return learningUnit;
}
