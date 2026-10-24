import assert from 'node:assert/strict';
import {
  BusinessInvariantError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../src/lib/errors';
import { validateLearningUnitLink } from '../../../backend/features/planning/services/learning-unit-link.service';
import { LearningUnit } from '../../../shared';

const learningUnitId = 'lnu_11111111-1111-4111-8111-111111111111';

function createLearningUnit(
  planningStatus: LearningUnit['planningStatus'] = 'SUBMITTED_FOR_VERIFICATION'
): LearningUnit {
  return {
    id: learningUnitId,
    topicId: 'top_11111111-1111-4111-8111-111111111111',
    subtopicId: 'sub_22222222-2222-4222-8222-222222222222',
    title: 'Calculate discounts',
    learningObjective: 'Calculate a discount and compare final prices.',
    verifiedMethod: 'Convert the percentage to a decimal and multiply by the original price.',
    skillLevel: 'BEGINNER',
    planningStatus,
    authorId: 'usr_author',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function repositoryWith(record?: LearningUnit) {
  return {
    async findById(id: string) {
      return id === record?.id ? record || null : null;
    },
  };
}

async function expectReject<T extends Error>(
  action: () => Promise<unknown>,
  errorType: new (...args: any[]) => T,
  message: string
): Promise<void> {
  await assert.rejects(action, (error: unknown) => error instanceof errorType, message);
}

// S11-T05 keeps standalone artifacts valid while validating every supplied link
// against persisted state rather than trusting client status or ownership fields.
async function main(): Promise<void> {
  const submitted = createLearningUnit();
  const ownerActor = { id: 'usr_author', role: 'CONTENT_WRITER' };
  const elevatedActor = { id: 'usr_manager', role: 'CONTENT_MANAGER' };

  const linked = await validateLearningUnitLink(
    learningUnitId,
    ownerActor,
    repositoryWith(submitted)
  );
  assert.equal(linked?.id, learningUnitId);

  const standalone = await validateLearningUnitLink(undefined, ownerActor, repositoryWith());
  assert.equal(standalone, undefined);

  await expectReject(
    () => validateLearningUnitLink('not-a-learning-unit', ownerActor, repositoryWith(submitted)),
    ValidationError,
    'invalid identifiers fail closed'
  );
  await expectReject(
    () => validateLearningUnitLink(learningUnitId, ownerActor, repositoryWith()),
    NotFoundError,
    'nonexistent references fail closed'
  );
  await expectReject(
    () => validateLearningUnitLink(learningUnitId, ownerActor, repositoryWith(createLearningUnit('DRAFT'))),
    BusinessInvariantError,
    'draft units are not eligible'
  );
  await expectReject(
    () => validateLearningUnitLink(learningUnitId, { id: 'usr_other', role: 'CONTENT_WRITER' }, repositoryWith(submitted)),
    ForbiddenError,
    'non-owners cannot link another authors unit'
  );

  // Elevated management authorization is persisted-role based; forged client
  // metadata cannot turn a DRAFT record into an eligible verified unit.
  const forgedDraft = { ...createLearningUnit('DRAFT'), planningStatus: 'SUBMITTED_FOR_VERIFICATION' as const };
  await expectReject(
    () => validateLearningUnitLink(learningUnitId, elevatedActor, repositoryWith({ ...forgedDraft, planningStatus: 'DRAFT' })),
    BusinessInvariantError,
    'client-supplied status cannot bypass persisted eligibility'
  );

  console.log('S11-T05 LearningUnit linking validation tests passed (6 cases).');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
