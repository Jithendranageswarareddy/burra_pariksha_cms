/**
 * BURRA PARIKSHA CMS — Stage 22 Cost Architecture & Financial Governance
 *
 * Enforces the inviolable ₹0–₹100 INR/month constraint (COST-001, AP-012),
 * 10-domain free-tier mapping, Cost Gate state machine, and Anti-SaaS invariants.
 */

import { z } from 'zod';

// ============================================================================
// 1. COST ENUMS & TAXONOMY
// ============================================================================

export enum CostComponentId {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  MEDIA_ACTIVE = 'MEDIA_ACTIVE',
  ARCHIVE_COLD = 'ARCHIVE_COLD',
  REALTIME = 'REALTIME',
  BACKGROUND_JOBS = 'BACKGROUND_JOBS',
  AI_SUBSYSTEM = 'AI_SUBSYSTEM',
  OBSERVABILITY = 'OBSERVABILITY',
  ANALYTICS = 'ANALYTICS',
}

export enum CostGateState {
  DESIGN = 'DESIGN',
  COST_ESTIMATED = 'COST_ESTIMATED',
  COST_APPROVED = 'COST_APPROVED',
  IMPLEMENTATION_AUTHORIZED = 'IMPLEMENTATION_AUTHORIZED',
  IMPLEMENTED = 'IMPLEMENTED',
  OPERATIONAL = 'OPERATIONAL',
}

export enum CostRiskRating {
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CostProfileScale {
  BASELINE_LOW = 'BASELINE_LOW', // 1-5 questions/day
  MODERATE = 'MODERATE',         // 10 questions/day
  STRESS_HIGH = 'STRESS_HIGH',   // 20 questions/day
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const UpgradeTriggerSchema = z.object({
  triggerMetric: z.string().min(1),
  thresholdValue: z.number().positive(),
  unit: z.string().min(1),
  actionRequired: z.string().min(1),
  costImpactINR: z.number().nonnegative(),
});

export type UpgradeTrigger = z.infer<typeof UpgradeTriggerSchema>;

export const ComponentCostEntrySchema = z.object({
  componentId: z.nativeEnum(CostComponentId),
  name: z.string().min(1),
  currentState: z.string().min(1),
  targetArchitecture: z.string().min(1),
  monthlyCostINR: z.number().nonnegative(),
  freeTierName: z.string().min(1),
  freeTierQuota: z.string().min(1),
  freeTierHeadroomPercent: z.number().min(0).max(100),
  upgradeTrigger: UpgradeTriggerSchema,
  gateState: z.nativeEnum(CostGateState),
  riskRating: z.nativeEnum(CostRiskRating),
});

export type ComponentCostEntry = z.infer<typeof ComponentCostEntrySchema>;

export const SystemCostBudgetSchema = z.object({
  profile: z.nativeEnum(CostProfileScale),
  totalMonthlyCostINR: z.number().nonnegative(),
  isUnderCostCeiling: z.boolean(),
  components: z.array(ComponentCostEntrySchema),
});

export type SystemCostBudget = z.infer<typeof SystemCostBudgetSchema>;

// ============================================================================
// 3. CONSTANTS & REGISTRY
// ============================================================================

export const MAX_MONTHLY_BUDGET_CEILING_INR = 100; // AP-012

export const SYSTEM_COST_COMPONENTS_REGISTRY: Record<CostComponentId, ComponentCostEntry> = {
  [CostComponentId.FRONTEND]: {
    componentId: CostComponentId.FRONTEND,
    name: 'Frontend Web Application',
    currentState: 'Vite SPA with Tailwind CSS',
    targetArchitecture: 'Static SPA hosted on Cloud Run / Cloudflare Pages',
    monthlyCostINR: 0,
    freeTierName: 'Cloud Run Static / Cloudflare Pages Free',
    freeTierQuota: 'Unlimited bandwidth / 2M requests',
    freeTierHeadroomPercent: 95,
    upgradeTrigger: {
      triggerMetric: 'Monthly Unique Visitors',
      thresholdValue: 100000,
      unit: 'visitors/mo',
      actionRequired: 'Attach Enterprise CDN edge routing',
      costImpactINR: 50,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.NEGLIGIBLE,
  },
  [CostComponentId.BACKEND]: {
    componentId: CostComponentId.BACKEND,
    name: 'API & Orchestration Server',
    currentState: 'Express 4.x Monolith with TypeScript',
    targetArchitecture: 'Google Cloud Run Serverless Container',
    monthlyCostINR: 0,
    freeTierName: 'Google Cloud Run Free Tier',
    freeTierQuota: '2,000,000 requests, 360,000 vCPU-sec, 180,000 GiB-sec',
    freeTierHeadroomPercent: 96,
    upgradeTrigger: {
      triggerMetric: 'Monthly HTTP Invocations',
      thresholdValue: 2000000,
      unit: 'invocations/mo',
      actionRequired: 'Provision minimum instances or autoscale compute units',
      costImpactINR: 120,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.LOW,
  },
  [CostComponentId.DATABASE]: {
    componentId: CostComponentId.DATABASE,
    name: 'Primary Data Store',
    currentState: 'Google Sheets (Legacy Mock)',
    targetArchitecture: 'Firestore Native Spark Mode (FIRESTORE_HYBRID)',
    monthlyCostINR: 0,
    freeTierName: 'Firestore Spark Tier',
    freeTierQuota: '50,000 reads/day, 20,000 writes/day, 1 GiB storage',
    freeTierHeadroomPercent: 98,
    upgradeTrigger: {
      triggerMetric: 'Daily Document Reads',
      thresholdValue: 50000,
      unit: 'reads/day',
      actionRequired: 'Upgrade to Firestore Blaze Pay-as-you-go',
      costImpactINR: 25,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.LOW,
  },
  [CostComponentId.MEDIA_ACTIVE]: {
    componentId: CostComponentId.MEDIA_ACTIVE,
    name: 'Active Media & Binary Store',
    currentState: 'Google Drive Manual Folders',
    targetArchitecture: 'Google Drive API v3 + Firestore metadata hash refs',
    monthlyCostINR: 0,
    freeTierName: 'Google Drive Free Account Quota',
    freeTierQuota: '15 GB shared storage',
    freeTierHeadroomPercent: 80,
    upgradeTrigger: {
      triggerMetric: 'Active Media Volume',
      thresholdValue: 15,
      unit: 'GB',
      actionRequired: 'Purchase Google One 100 GB tier or migrate old items to cold storage',
      costImpactINR: 130,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.MEDIUM,
  },
  [CostComponentId.ARCHIVE_COLD]: {
    componentId: CostComponentId.ARCHIVE_COLD,
    name: 'Cold Media Archive',
    currentState: 'Manual Local Backup',
    targetArchitecture: 'Google Cloud Storage Coldline / Archive Class',
    monthlyCostINR: 0,
    freeTierName: 'Google Cloud Storage Free Tier',
    freeTierQuota: '5 GiB standard storage / Zero-cost initial tier',
    freeTierHeadroomPercent: 85,
    upgradeTrigger: {
      triggerMetric: 'Cold Archive Volume',
      thresholdValue: 5,
      unit: 'GB',
      actionRequired: 'Pay per GB Coldline storage rate',
      costImpactINR: 10,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.LOW,
  },
  [CostComponentId.REALTIME]: {
    componentId: CostComponentId.REALTIME,
    name: 'Live Realtime Streaming',
    currentState: 'Client Polling',
    targetArchitecture: 'Server-Sent Events (SSE) + In-Process EventBus',
    monthlyCostINR: 0,
    freeTierName: 'In-Process Monolith HTTP Free (0 Firestore Reads)',
    freeTierQuota: 'Unlimited internal events on Node.js EventLoop',
    freeTierHeadroomPercent: 99,
    upgradeTrigger: {
      triggerMetric: 'Concurrent Staff Connections',
      thresholdValue: 100,
      unit: 'concurrent users',
      actionRequired: 'Introduce Redis Pub/Sub backplane across horizontal nodes',
      costImpactINR: 0,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.NEGLIGIBLE,
  },
  [CostComponentId.BACKGROUND_JOBS]: {
    componentId: CostComponentId.BACKGROUND_JOBS,
    name: 'Asynchronous Job Engine',
    currentState: 'Synchronous execution',
    targetArchitecture: 'Google Cloud Tasks (Prod) / In-Process Runner (Dev)',
    monthlyCostINR: 0,
    freeTierName: 'Cloud Tasks Free Tier',
    freeTierQuota: '1,000,000 task invocations/month',
    freeTierHeadroomPercent: 99,
    upgradeTrigger: {
      triggerMetric: 'Monthly Task Invocations',
      thresholdValue: 1000000,
      unit: 'tasks/mo',
      actionRequired: 'Pay standard Cloud Tasks overage',
      costImpactINR: 20,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.NEGLIGIBLE,
  },
  [CostComponentId.AI_SUBSYSTEM]: {
    componentId: CostComponentId.AI_SUBSYSTEM,
    name: 'Gemini AI Assistant Pipeline',
    currentState: 'Ad-hoc LLM calls',
    targetArchitecture: 'Human-Gated 7-Step Gemini 2.5 Flash Pipeline',
    monthlyCostINR: 0,
    freeTierName: 'Google AI Studio Gemini Free Tier',
    freeTierQuota: '15 RPM, 1,500 RPD, 1M TPM free quota',
    freeTierHeadroomPercent: 90,
    upgradeTrigger: {
      triggerMetric: 'Daily AI Generation Requests',
      thresholdValue: 1500,
      unit: 'requests/day',
      actionRequired: 'Attach billing key to Gemini API Tier 1',
      costImpactINR: 50,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.MEDIUM,
  },
  [CostComponentId.OBSERVABILITY]: {
    componentId: CostComponentId.OBSERVABILITY,
    name: 'Audit & System Observability',
    currentState: 'Console stdout logs',
    targetArchitecture: 'Google Cloud Logging single-line structured JSON',
    monthlyCostINR: 0,
    freeTierName: 'Google Cloud Logging Free Tier',
    freeTierQuota: '50 GiB/month free ingestion',
    freeTierHeadroomPercent: 99,
    upgradeTrigger: {
      triggerMetric: 'Monthly Log Volume',
      thresholdValue: 50,
      unit: 'GiB/mo',
      actionRequired: 'Apply log exclusions or retention pruning',
      costImpactINR: 30,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.NEGLIGIBLE,
  },
  [CostComponentId.ANALYTICS]: {
    componentId: CostComponentId.ANALYTICS,
    name: 'Analytics & Intelligence Loop',
    currentState: 'None',
    targetArchitecture: 'On-demand Firestore aggregation queries',
    monthlyCostINR: 0,
    freeTierName: 'Firestore Spark Tier Ingestion',
    freeTierQuota: '50,000 daily read quota pool',
    freeTierHeadroomPercent: 95,
    upgradeTrigger: {
      triggerMetric: 'Analytics Document Reads',
      thresholdValue: 50000,
      unit: 'reads/day',
      actionRequired: 'Export analytical records to BigQuery sandbox',
      costImpactINR: 0,
    },
    gateState: CostGateState.OPERATIONAL,
    riskRating: CostRiskRating.NEGLIGIBLE,
  },
};

// ============================================================================
// 4. EVALUATOR FUNCTIONS
// ============================================================================

/**
 * Validates the Cost Gate transition invariant.
 * Rule: No component can move to IMPLEMENTATION_AUTHORIZED or IMPLEMENTED while in DESIGN or COST_ESTIMATED.
 */
export function canTransitionToImplementation(currentState: CostGateState): boolean {
  return (
    currentState === CostGateState.COST_APPROVED ||
    currentState === CostGateState.IMPLEMENTATION_AUTHORIZED ||
    currentState === CostGateState.IMPLEMENTED ||
    currentState === CostGateState.OPERATIONAL
  );
}

/**
 * Computes the total monthly cost across all system components in INR.
 */
export function calculateTotalSystemCost(components: ComponentCostEntry[]): number {
  return components.reduce((sum, comp) => sum + comp.monthlyCostINR, 0);
}

/**
 * Enforces the COST-001 / AP-012 financial invariant (Total <= ₹100 INR/month).
 */
export function validateCostInvariant(totalCostINR: number): { valid: boolean; marginINR: number } {
  const marginINR = MAX_MONTHLY_BUDGET_CEILING_INR - totalCostINR;
  return {
    valid: totalCostINR <= MAX_MONTHLY_BUDGET_CEILING_INR,
    marginINR: Math.max(0, marginINR),
  };
}

/**
 * Checks if a component's operational metric exceeds its predefined upgrade threshold.
 */
export function evaluateUpgradeRisk(
  component: ComponentCostEntry,
  currentUsageValue: number
): { triggerTripped: boolean; message: string } {
  const threshold = component.upgradeTrigger.thresholdValue;
  if (currentUsageValue >= threshold) {
    return {
      triggerTripped: true,
      message: `Trigger tripped: ${component.name} usage (${currentUsageValue} ${component.upgradeTrigger.unit}) reached threshold of ${threshold} ${component.upgradeTrigger.unit}. Action required: ${component.upgradeTrigger.actionRequired}`,
    };
  }
  return {
    triggerTripped: false,
    message: `${component.name} operating within free quota (${currentUsageValue} / ${threshold} ${component.upgradeTrigger.unit}).`,
  };
}
