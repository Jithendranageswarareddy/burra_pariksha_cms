/**
 * BURRA PARIKSHA CMS — Authoritative Content Mode Registry
 * Location: shared/registry/content-mode.registry.ts
 *
 * Implements authoritative registry specifications from:
 * - docs/sprints/sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md
 * - docs/sprints/sprint-08/S8-T07-WORKFLOW-RESOLUTION-TRANSITION-DESIGN.md
 *
 * Enforces declarative, strongly typed registry for all production modes:
 * - Mode 1: QUESTION_CHALLENGE_SHORT
 * - Mode 2: TOPIC_INTRODUCTION
 * - Mode 3: EXPLAINED_QUESTIONS_VIDEO
 */

import { ContentProductionMode } from '../types/production-context';
import {
  ContentModeDefinition,
  SupportedAspectRatio,
} from '../types/content-mode-registry';
import { WorkflowStepNumber } from '../constants/workflow';
import { CanonicalRbacRole } from '../constants/roles';

export class ContentModeRegistry {
  private static instance: ContentModeRegistry | null = null;
  private readonly definitions: Map<ContentProductionMode, ContentModeDefinition> = new Map();

  private constructor() {
    this.registerCanonicalModes();
  }

  public static getInstance(): ContentModeRegistry {
    if (!ContentModeRegistry.instance) {
      ContentModeRegistry.instance = new ContentModeRegistry();
    }
    return ContentModeRegistry.instance;
  }

  /**
   * Registers a new content mode definition according to the Open-Closed Principle.
   */
  public register(definition: ContentModeDefinition): void {
    if (!definition || !definition.id) {
      throw new Error('Cannot register content mode without valid id.');
    }
    this.definitions.set(definition.id, Object.freeze({ ...definition }));
  }

  /**
   * Retrieves definition for the given production mode.
   * Throws an error if the mode is not registered.
   */
  public getDefinition(mode: ContentProductionMode | string): ContentModeDefinition {
    const def = this.definitions.get(mode as ContentProductionMode);
    if (!def) {
      throw new Error(`Unregistered content production mode: '${mode}'.`);
    }
    return def;
  }

  /**
   * Returns whether a mode is registered.
   */
  public hasDefinition(mode: string): boolean {
    return this.definitions.has(mode as ContentProductionMode);
  }

  /**
   * Returns all registered content mode definitions.
   */
  public getAllDefinitions(): ContentModeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Returns applicable stages for a given mode.
   * Throws an error if the mode is not registered.
   */
  public getApplicableStages(mode: ContentProductionMode | string): readonly WorkflowStepNumber[] {
    if (!this.hasDefinition(mode)) {
      throw new Error(`Unregistered content production mode: '${mode}'.`);
    }
    return this.getDefinition(mode).applicableStages;
  }

  /**
   * Validates a candidate configuration against registered mode constraints.
   */
  public validateConfig(
    mode: ContentProductionMode | string,
    questionCount: number,
    aspectRatio: string
  ): { isValid: boolean; error?: string } {
    if (!this.hasDefinition(mode)) {
      return { isValid: false, error: `Invalid production mode: '${mode}'.` };
    }

    const def = this.getDefinition(mode);

    // Validate question count
    if (!def.questionCount.allowedValues.includes(questionCount)) {
      return {
        isValid: false,
        error: `Mode '${def.name}' requires question count in [${def.questionCount.allowedValues.join(
          ', '
        )}], but received ${questionCount}.`,
      };
    }

    // Validate aspect ratio
    if (!def.aspectRatio.allowedValues.includes(aspectRatio as SupportedAspectRatio)) {
      return {
        isValid: false,
        error: `Mode '${def.name}' requires aspect ratio in [${def.aspectRatio.allowedValues.join(
          ', '
        )}], but received '${aspectRatio}'.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Registers the three approved canonical modes.
   */
  private registerCanonicalModes(): void {
    const allStages: readonly WorkflowStepNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    // Standard shared actions
    const standardActions = [
      {
        actionId: 'ACTION_SAVE_DRAFT',
        label: 'Save Working Draft',
        applicableStages: [1 as WorkflowStepNumber],
        requiredCapability: 'QUESTION:CREATE',
        allowedRoles: [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.ADMIN],
        isVerificationGate: false,
      },
      {
        actionId: 'ACTION_SUBMIT_VERIFY',
        label: 'Submit for Verification',
        applicableStages: [1 as WorkflowStepNumber],
        requiredCapability: 'QUESTION:SUBMIT',
        allowedRoles: [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.ADMIN],
        isVerificationGate: false,
      },
      {
        actionId: 'ACTION_APPROVE_QUESTION',
        label: 'Approve & Queue for Production',
        applicableStages: [2 as WorkflowStepNumber],
        requiredCapability: 'QUESTION:APPROVE',
        allowedRoles: [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
        isVerificationGate: true,
      },
      {
        actionId: 'ACTION_REJECT_QUESTION',
        label: 'Request Changes',
        applicableStages: [2 as WorkflowStepNumber],
        requiredCapability: 'QUESTION:REJECT',
        allowedRoles: [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
        isVerificationGate: true,
      },
      {
        actionId: 'ACTION_APPROVE_QC',
        label: 'Approve Final QC',
        applicableStages: [7 as WorkflowStepNumber],
        requiredCapability: 'VIDEO:APPROVE',
        allowedRoles: [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
        isVerificationGate: true,
      },
      {
        actionId: 'ACTION_APPROVE_SOCIAL',
        label: 'Approve Social Package',
        applicableStages: [9 as WorkflowStepNumber],
        requiredCapability: 'CONTENT:APPROVE',
        allowedRoles: [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
        isVerificationGate: true,
      },
      {
        actionId: 'ACTION_SCHEDULE_PUBLISH',
        label: 'Schedule Publication',
        applicableStages: [10 as WorkflowStepNumber],
        requiredCapability: 'PUBLICATION:SCHEDULE',
        allowedRoles: [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
        isVerificationGate: false,
      },
    ];

    // Mode 1: Question Challenge Short
    this.register({
      id: 'QUESTION_CHALLENGE_SHORT',
      code: 'MODE_1',
      name: 'Question Challenge Short',
      shortLabel: 'Challenge Short',
      description: 'Single-question vertical short with speed math trick and fast solution (<= 58s). Supports single short (1 question) or batch series (5, 10, 15, 20 questions) sharing taxonomy context.',
      pedagogicalObjective: 'Rapid engagement, viral comment challenge, and instant mental math shortcut reveal.',
      questionCount: {
        allowedValues: [1, 5, 10, 15, 20],
        defaultValue: 1,
        isConfigurable: true,
        requiresQuestionsArray: false,
      },
      aspectRatio: {
        allowedValues: ['9:16'],
        defaultValue: '9:16',
        isConfigurable: false,
      },
      duration: {
        minSeconds: 30,
        maxSeconds: 58,
        targetSeconds: 52,
        hardCeilingSeconds: 58,
      },
      inputs: {
        requiresTaxonomy: true,
        requiresMCQOptions: true,
        requiresCorrectAnswer: true,
        requiresIntroductoryConcept: false,
        requiresRealWorldContext: true,
        requiresProofExplanation: true,
        allowedChallengeTypes: ['ABCD'],
      },
      verification: {
        checklistType: '10_POINT_PROOF',
        checklistCodePrefix: 'S8-M1',
        totalCheckpoints: 10,
        evaluatesMathematicalProof: true,
        evaluatesSyllabusAccuracy: true,
        enforcesGar02: true,
      },
      applicableStages: allStages,
      supportedActions: standardActions,
      presentation: {
        badgeLabel: 'Mode 1',
        badgeVariant: 'amber',
        iconToken: 'Zap',
        studioWorkspaceComponent: 'QuestionStudioWorkspace',
        teleprompterTemplateType: '4_PART_SHORT',
        editingBayFormat: 'VERTICAL_9_16_SNAPPY',
        thumbnailFormat: 'VERTICAL_CTR_SPLIT',
      },
    });

    // Mode 2: Topic Introduction
    this.register({
      id: 'TOPIC_INTRODUCTION',
      code: 'MODE_2',
      name: 'Topic Introduction',
      shortLabel: 'Topic Intro',
      description: 'Foundational topic overview demystifying concepts without practice questions (60-180s).',
      pedagogicalObjective: 'Curriculum onboarding, syllabus mapping, exam weightage, and intuitive concept clarity.',
      questionCount: {
        allowedValues: [0],
        defaultValue: 0,
        isConfigurable: false,
        requiresQuestionsArray: false,
      },
      aspectRatio: {
        allowedValues: ['9:16', '16:9'],
        defaultValue: '9:16',
        isConfigurable: true,
      },
      duration: {
        minSeconds: 60,
        maxSeconds: 180,
        targetSeconds: 90,
        hardCeilingSeconds: 180,
      },
      inputs: {
        requiresTaxonomy: true,
        requiresMCQOptions: false,
        requiresCorrectAnswer: false,
        requiresIntroductoryConcept: true,
        requiresRealWorldContext: true,
        requiresProofExplanation: false,
        allowedChallengeTypes: [],
      },
      verification: {
        checklistType: '5_POINT_CONCEPT',
        checklistCodePrefix: 'S8-M2',
        totalCheckpoints: 5,
        evaluatesMathematicalProof: false,
        evaluatesSyllabusAccuracy: true,
        enforcesGar02: true,
      },
      applicableStages: allStages,
      supportedActions: standardActions,
      presentation: {
        badgeLabel: 'Mode 2',
        badgeVariant: 'indigo',
        iconToken: 'BookOpen',
        studioWorkspaceComponent: 'TopicIntroWorkspace',
        teleprompterTemplateType: 'FOUNDATIONAL_CONCEPT',
        editingBayFormat: 'HYBRID_OVERVIEW',
        thumbnailFormat: 'CONFIGURABLE_SPLIT',
      },
    });

    // Mode 3: Explained Questions Video
    this.register({
      id: 'EXPLAINED_QUESTIONS_VIDEO',
      code: 'MODE_3',
      name: 'Explained Questions Video',
      shortLabel: 'Explained Masterclass',
      description: 'Comprehensive topic masterclass combining conceptual intro with sequential practice questions (12-52 min).',
      pedagogicalObjective: 'In-depth topic masterclass combining an intro orientation with sequential question breakdowns.',
      questionCount: {
        allowedValues: [5, 10, 15, 20],
        defaultValue: 10,
        isConfigurable: true,
        requiresQuestionsArray: true,
      },
      aspectRatio: {
        allowedValues: ['16:9'],
        defaultValue: '16:9',
        isConfigurable: false,
      },
      duration: {
        minSeconds: 720,
        maxSeconds: 3120,
        targetSeconds: 1500,
        hardCeilingSeconds: 3600,
      },
      inputs: {
        requiresTaxonomy: true,
        requiresMCQOptions: true,
        requiresCorrectAnswer: true,
        requiresIntroductoryConcept: true,
        requiresRealWorldContext: true,
        requiresProofExplanation: true,
        allowedChallengeTypes: ['ABCD'],
      },
      verification: {
        checklistType: '10_POINT_PROOF',
        checklistCodePrefix: 'S8-M3',
        totalCheckpoints: 10,
        evaluatesMathematicalProof: true,
        evaluatesSyllabusAccuracy: true,
        enforcesGar02: true,
      },
      applicableStages: allStages,
      supportedActions: standardActions,
      presentation: {
        badgeLabel: 'Mode 3',
        badgeVariant: 'emerald',
        iconToken: 'ListOrdered',
        studioWorkspaceComponent: 'ExplainedQuestionsWorkspace',
        teleprompterTemplateType: 'SEGMENTED_MASTERCLASS',
        editingBayFormat: 'LANDSCAPE_16_9_CHAPTERED',
        thumbnailFormat: 'LANDSCAPE_16_9_CTR',
      },
    });
  }
}

export const contentModeRegistry = ContentModeRegistry.getInstance();
