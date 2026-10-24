/**
 * Safe downstream context derived from a LearningUnit.
 *
 * The identifier is retained for internal correlation, while the audience
 * projection deliberately excludes author, reviewer, OCC, and audit metadata.
 */
export interface LinkedLearningUnitContext {
  learningUnitId: string;
  title: string;
  learningObjective: string;
  verifiedMethod: string;
  correctCalculations?: string;
  commonMistakes: string[];
  realLifeApplications: string[];
  realLifeScenario?: string;
  topicName?: string;
  subtopicName?: string;
}

export interface AudienceLearningUnitContext {
  title: string;
  learningObjective: string;
  verifiedMethod: string;
  correctCalculations?: string;
  commonMistakes: string[];
  realLifeApplications: string[];
  realLifeScenario?: string;
  topicName?: string;
  subtopicName?: string;
}
