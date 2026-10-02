/**
 * BURRA PARIKSHA CMS — Stage 25 Implementation Dependency Graph
 *
 * Defines the complete Directed Acyclic Graph (DAG) for all 20 system components,
 * topological sorting algorithms, cycle detection, critical path calculation, and gating rules.
 */

import { z } from 'zod';

// ============================================================================
// 1. ENUMS & TAXONOMY
// ============================================================================

export enum DependencyNodeId {
  REQUIREMENTS = 'REQUIREMENTS',
  DOMAIN_MODEL = 'DOMAIN_MODEL',
  WORKFLOW = 'WORKFLOW',
  STATE_MODEL = 'STATE_MODEL',
  RBAC = 'RBAC',
  DATABASE = 'DATABASE',
  MEDIA = 'MEDIA',
  BACKGROUND_JOBS = 'BACKGROUND_JOBS',
  AI_SUBSYSTEM = 'AI_SUBSYSTEM',
  REALTIME = 'REALTIME',
  SECURITY = 'SECURITY',
  API_CONTRACTS = 'API_CONTRACTS',
  FRONTEND_IA = 'FRONTEND_IA',
  PAGE_ROUTES = 'PAGE_ROUTES',
  ANALYTICS = 'ANALYTICS',
  AUDIT_OBSERVABILITY = 'AUDIT_OBSERVABILITY',
  COST_GOVERNANCE = 'COST_GOVERNANCE',
  MIGRATION = 'MIGRATION',
  TEST_ARCHITECTURE = 'TEST_ARCHITECTURE',
  PHYSICAL_IMPLEMENTATION = 'PHYSICAL_IMPLEMENTATION',
}

export enum DependencyLayer {
  FOUNDATION = 'FOUNDATION',
  CORE_DOMAIN = 'CORE_DOMAIN',
  PERSISTENCE = 'PERSISTENCE',
  CROSS_CUTTING = 'CROSS_CUTTING',
  INTERFACE = 'INTERFACE',
  GOVERNANCE = 'GOVERNANCE',
  EXECUTION = 'EXECUTION',
}

export enum EdgeType {
  HARD_PREREQUISITE = 'HARD_PREREQUISITE',
  CONTRACT_DEPENDENCY = 'CONTRACT_DEPENDENCY',
  INFORMATIONAL = 'INFORMATIONAL',
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const DependencyNodeSchema = z.object({
  id: z.nativeEnum(DependencyNodeId),
  name: z.string().min(1),
  layer: z.nativeEnum(DependencyLayer),
  prerequisites: z.array(z.nativeEnum(DependencyNodeId)),
  estimatedEffortDays: z.number().positive(),
  isCriticalPath: z.boolean(),
});

export type DependencyNode = z.infer<typeof DependencyNodeSchema>;

export const DependencyEdgeSchema = z.object({
  source: z.nativeEnum(DependencyNodeId),
  target: z.nativeEnum(DependencyNodeId),
  edgeType: z.nativeEnum(EdgeType),
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

export const DependencyGraphSchema = z.object({
  nodes: z.array(DependencyNodeSchema),
  edges: z.array(DependencyEdgeSchema),
});

export type DependencyGraph = z.infer<typeof DependencyGraphSchema>;

export const TopologicalSortResultSchema = z.object({
  isAcyclic: z.boolean(),
  executionOrder: z.array(z.nativeEnum(DependencyNodeId)),
  cycleDetected: z.boolean(),
});

export type TopologicalSortResult = z.infer<typeof TopologicalSortResultSchema>;

// ============================================================================
// 3. CANONICAL GRAPH DEFINITION (ALL 20 NODES & EDGES)
// ============================================================================

export const CANONICAL_DEPENDENCY_NODES: DependencyNode[] = [
  {
    id: DependencyNodeId.REQUIREMENTS,
    name: 'Business & Educational Requirements',
    layer: DependencyLayer.FOUNDATION,
    prerequisites: [],
    estimatedEffortDays: 2,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.DOMAIN_MODEL,
    name: '27 Domain Entities & Boundary Specification',
    layer: DependencyLayer.CORE_DOMAIN,
    prerequisites: [DependencyNodeId.REQUIREMENTS],
    estimatedEffortDays: 3,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.WORKFLOW,
    name: 'Canonical 15-Step Workflow Engine',
    layer: DependencyLayer.CORE_DOMAIN,
    prerequisites: [DependencyNodeId.DOMAIN_MODEL],
    estimatedEffortDays: 3,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.STATE_MODEL,
    name: 'Decoupled 5-Dimension State Model & OCC',
    layer: DependencyLayer.CORE_DOMAIN,
    prerequisites: [DependencyNodeId.WORKFLOW],
    estimatedEffortDays: 3,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.RBAC,
    name: '11 Roles & 37 Capabilities Authorization Model',
    layer: DependencyLayer.CORE_DOMAIN,
    prerequisites: [DependencyNodeId.STATE_MODEL],
    estimatedEffortDays: 2,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.DATABASE,
    name: 'Firestore Hybrid Native Database Schema',
    layer: DependencyLayer.PERSISTENCE,
    prerequisites: [DependencyNodeId.STATE_MODEL, DependencyNodeId.RBAC],
    estimatedEffortDays: 4,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.MEDIA,
    name: 'Google Drive Tri-Layer Media Pipeline',
    layer: DependencyLayer.PERSISTENCE,
    prerequisites: [DependencyNodeId.DATABASE],
    estimatedEffortDays: 3,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.BACKGROUND_JOBS,
    name: 'Asynchronous Job & Queue Engine',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.DATABASE, DependencyNodeId.MEDIA],
    estimatedEffortDays: 3,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.AI_SUBSYSTEM,
    name: 'Gemini AI 7-Step Assistive Pipeline',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.BACKGROUND_JOBS, DependencyNodeId.MEDIA],
    estimatedEffortDays: 4,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.REALTIME,
    name: 'Server-Sent Events (SSE) Real-Time Bus',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.STATE_MODEL],
    estimatedEffortDays: 2,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.SECURITY,
    name: 'Zero-Trust Authentication & SessionRevocation',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.DATABASE, DependencyNodeId.RBAC],
    estimatedEffortDays: 3,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.API_CONTRACTS,
    name: 'Universal API Envelopes & REST Endpoints',
    layer: DependencyLayer.INTERFACE,
    prerequisites: [
      DependencyNodeId.DATABASE,
      DependencyNodeId.SECURITY,
      DependencyNodeId.AI_SUBSYSTEM,
      DependencyNodeId.REALTIME,
    ],
    estimatedEffortDays: 4,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.PAGE_ROUTES,
    name: '14 Canonical Production Web Routes',
    layer: DependencyLayer.INTERFACE,
    prerequisites: [DependencyNodeId.API_CONTRACTS],
    estimatedEffortDays: 2,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.FRONTEND_IA,
    name: '8 Domain Hubs with Unified Studio',
    layer: DependencyLayer.INTERFACE,
    prerequisites: [DependencyNodeId.PAGE_ROUTES, DependencyNodeId.REALTIME],
    estimatedEffortDays: 3,
    isCriticalPath: true,
  },
  {
    id: DependencyNodeId.ANALYTICS,
    name: 'Analytics Pipeline & Intelligence Feedback',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.DATABASE, DependencyNodeId.API_CONTRACTS],
    estimatedEffortDays: 3,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.AUDIT_OBSERVABILITY,
    name: '7-Dimension Forensic Audit & Cloud Logging',
    layer: DependencyLayer.CROSS_CUTTING,
    prerequisites: [DependencyNodeId.SECURITY, DependencyNodeId.BACKGROUND_JOBS],
    estimatedEffortDays: 2,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.COST_GOVERNANCE,
    name: 'Zero-Cost Gate & Free Tier Verification',
    layer: DependencyLayer.GOVERNANCE,
    prerequisites: [DependencyNodeId.DATABASE, DependencyNodeId.AI_SUBSYSTEM, DependencyNodeId.BACKGROUND_JOBS],
    estimatedEffortDays: 2,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.MIGRATION,
    name: '7-Phase Strangler Fig Migration Strategy',
    layer: DependencyLayer.GOVERNANCE,
    prerequisites: [DependencyNodeId.DATABASE, DependencyNodeId.API_CONTRACTS, DependencyNodeId.PAGE_ROUTES],
    estimatedEffortDays: 3,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.TEST_ARCHITECTURE,
    name: 'Universal 135-Cell Quality Matrix',
    layer: DependencyLayer.GOVERNANCE,
    prerequisites: [DependencyNodeId.API_CONTRACTS, DependencyNodeId.WORKFLOW, DependencyNodeId.SECURITY],
    estimatedEffortDays: 3,
    isCriticalPath: false,
  },
  {
    id: DependencyNodeId.PHYSICAL_IMPLEMENTATION,
    name: 'Physical Backend & Frontend Production Cutover',
    layer: DependencyLayer.EXECUTION,
    prerequisites: [
      DependencyNodeId.FRONTEND_IA,
      DependencyNodeId.PAGE_ROUTES,
      DependencyNodeId.ANALYTICS,
      DependencyNodeId.AUDIT_OBSERVABILITY,
      DependencyNodeId.COST_GOVERNANCE,
      DependencyNodeId.MIGRATION,
      DependencyNodeId.TEST_ARCHITECTURE,
    ],
    estimatedEffortDays: 5,
    isCriticalPath: true,
  },
];

function buildCanonicalEdges(): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  for (const node of CANONICAL_DEPENDENCY_NODES) {
    for (const prereq of node.prerequisites) {
      edges.push({
        source: prereq,
        target: node.id,
        edgeType: EdgeType.HARD_PREREQUISITE,
      });
    }
  }
  return edges;
}

export const CANONICAL_DEPENDENCY_GRAPH: DependencyGraph = {
  nodes: CANONICAL_DEPENDENCY_NODES,
  edges: buildCanonicalEdges(),
};

// ============================================================================
// 4. EVALUATOR FUNCTIONS
// ============================================================================

/**
 * Detects cycles in the dependency graph using Depth-First Search with recursion stack.
 */
export function detectGraphCycles(nodes: DependencyNode[]): { hasCycle: boolean; cycleNodes?: string[] } {
  const adj = new Map<DependencyNodeId, DependencyNodeId[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      if (adj.has(prereq)) {
        adj.get(prereq)!.push(node.id);
      }
    }
  }

  const visited = new Set<DependencyNodeId>();
  const recStack = new Set<DependencyNodeId>();
  const cyclePath: DependencyNodeId[] = [];

  function dfs(nodeId: DependencyNodeId): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    cyclePath.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        cyclePath.push(neighbor);
        return true;
      }
    }

    recStack.delete(nodeId);
    cyclePath.pop();
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return { hasCycle: true, cycleNodes: cyclePath.map((n) => String(n)) };
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Computes topological sort using Kahn's algorithm (In-Degree counting).
 */
export function computeTopologicalSort(nodes: DependencyNode[]): { success: boolean; order: DependencyNodeId[] } {
  const inDegree = new Map<DependencyNodeId, number>();
  const adj = new Map<DependencyNodeId, DependencyNodeId[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      if (adj.has(prereq)) {
        adj.get(prereq)!.push(node.id);
      }
      inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
    }
  }

  const queue: DependencyNodeId[] = [];
  for (const [nodeId, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(nodeId);
    }
  }

  const order: DependencyNodeId[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  const success = order.length === nodes.length;
  return { success, order };
}

/**
 * Calculates the critical path (longest path through DAG by weighted effort days).
 */
export function calculateCriticalPath(nodes: DependencyNode[]): { path: DependencyNodeId[]; totalDays: number } {
  const topo = computeTopologicalSort(nodes);
  if (!topo.success) {
    return { path: [], totalDays: 0 };
  }

  const nodeMap = new Map<DependencyNodeId, DependencyNode>(nodes.map((n) => [n.id, n]));
  const dist = new Map<DependencyNodeId, number>();
  const parent = new Map<DependencyNodeId, DependencyNodeId | null>();

  for (const nodeId of topo.order) {
    const node = nodeMap.get(nodeId)!;
    dist.set(nodeId, node.estimatedEffortDays);
    parent.set(nodeId, null);
  }

  for (const u of topo.order) {
    const uNode = nodeMap.get(u)!;
    const currentDist = dist.get(u)!;

    for (const v of topo.order) {
      const vNode = nodeMap.get(v)!;
      if (vNode.prerequisites.includes(u)) {
        const potentialDist = currentDist + vNode.estimatedEffortDays;
        if (potentialDist > (dist.get(v) || 0)) {
          dist.set(v, potentialDist);
          parent.set(v, u);
        }
      }
    }
  }

  // Find max terminal node
  let maxNode = topo.order[0];
  let maxDist = dist.get(maxNode) || 0;

  for (const [nodeId, d] of dist.entries()) {
    if (d > maxDist) {
      maxDist = d;
      maxNode = nodeId;
    }
  }

  const path: DependencyNodeId[] = [];
  let curr: DependencyNodeId | null = maxNode;
  while (curr !== null) {
    path.unshift(curr);
    curr = parent.get(curr) || null;
  }

  return { path, totalDays: maxDist };
}

/**
 * Validates if a given component is ready to commence implementation.
 */
export function canExecuteNode(
  nodeId: DependencyNodeId,
  completedNodes: Set<DependencyNodeId>,
  nodes: DependencyNode[]
): { ready: boolean; missingPrerequisites: DependencyNodeId[] } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) {
    return { ready: false, missingPrerequisites: [] };
  }

  const missingPrerequisites = node.prerequisites.filter((p) => !completedNodes.has(p));
  return {
    ready: missingPrerequisites.length === 0,
    missingPrerequisites,
  };
}
