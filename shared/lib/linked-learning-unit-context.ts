import { LearningUnit } from '../types/learning-unit';
import {
  AudienceLearningUnitContext,
  LinkedLearningUnitContext,
} from '../contracts/linked-learning-unit-context';

export function toLinkedLearningUnitContext(unit: LearningUnit): LinkedLearningUnitContext {
  return {
    learningUnitId: unit.id,
    title: unit.title,
    learningObjective: unit.learningObjective,
    verifiedMethod: unit.verifiedMethod,
    correctCalculations: unit.correctCalculations,
    commonMistakes: unit.commonMistakes || [],
    realLifeApplications: unit.realLifeApplications || [],
    realLifeScenario: unit.realLifeScenario,
    topicName: unit.topicName,
    subtopicName: unit.subtopicName,
  };
}

/**
 * Removes internal identity and planning metadata before prompt/audience use.
 */
export function toAudienceLearningUnitContext(
  context: LinkedLearningUnitContext
): AudienceLearningUnitContext {
  const { learningUnitId: _learningUnitId, ...audienceContext } = context;
  return audienceContext;
}

export function propagateLearningUnitId<T extends { learningUnitId?: string }>(
  source: { learningUnitId?: string },
  target: T
): T {
  return source.learningUnitId ? { ...target, learningUnitId: source.learningUnitId } : target;
}
