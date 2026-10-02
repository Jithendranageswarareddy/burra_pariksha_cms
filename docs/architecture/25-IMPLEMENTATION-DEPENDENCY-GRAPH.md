# Burra Pariksha CMS
# 25 — Implementation Dependency Graph

Stage: 25 — Implementation Dependency Graph

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative Implementation Dependency Graph for the Burra Pariksha Content Management System (BP-CMS). Formally codifies:
1. **The Master Directed Acyclic Graph (DAG):** Structural dependency modeling of all 20 system components across 7 architectural layers (`FOUNDATION`, `CORE_DOMAIN`, `PERSISTENCE`, `CROSS_CUTTING`, `INTERFACE`, `GOVERNANCE`, and `EXECUTION`).
2. **Topological Execution Schedule:** Mathematically proves an acyclic dependency graph ($\text{hasCycle} == \text{false}$) and determines the exact topological sort order for physical development.
3. **The Critical Path Analysis:** Identifies the longest sequential dependency chain defining the minimal time schedule:
   `REQUIREMENTS` $\to$ `DOMAIN_MODEL` $\to$ `WORKFLOW` $\to$ `STATE_MODEL` $\to$ `RBAC` $\to$ `DATABASE` $\to$ `SECURITY` $\to$ `API_CONTRACTS` $\to$ `PAGE_ROUTES` $\to$ `FRONTEND_IA` $\to$ `PHYSICAL_IMPLEMENTATION`.
4. **Decoupled Parallel Streams:** Formally isolates independent execution tracks (e.g. Media Lab, Gemini AI, Realtime SSE EventBus, and Analytics Loop) once upstream data dependencies are established.
5. **Execution Gating Invariant:** Strict rule that no component can commence physical coding until 100% of its hard upstream prerequisites are verified and closed.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 25 Implementation Dependency Graph | FACT |
| **File Path** | `docs/architecture/25-IMPLEMENTATION-DEPENDENCY-GRAPH.md` | FACT |
| **Document Stage** | Stage 25 — Implementation Dependency Graph | FACT |
| **Authority** | Master SDLC Dependency & Sequencing Specification | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 24 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 26+ (Physical Backend Data Access Layer, Controllers & Frontend Execution) | FACT |
| **Baseline Repository Commit** | `429b417` | FACT |
| **Acyclic Verification** | Graph verified 100% acyclic with Kahn's Algorithm & DFS | FACT |

---

## 02. The 7 Structural Layers of the Dependency Graph

```
Layer 7: EXECUTION       [ PHYSICAL_IMPLEMENTATION ]
                                  ▲
Layer 6: GOVERNANCE      [ COST_GOV ]  [ MIGRATION ]  [ TEST_ARCH ]
                                  ▲
Layer 5: INTERFACE       [ FRONTEND_IA ] ──► [ PAGE_ROUTES ] ──► [ API_CONTRACTS ]
                                  ▲
Layer 4: CROSS-CUTTING   [ SECURITY ]  [ AI_SUBSYSTEM ]  [ REALTIME ]  [ BACKGROUND_JOBS ]  [ OBSERVABILITY ]  [ ANALYTICS ]
                                  ▲
Layer 3: PERSISTENCE     [ DATABASE (Firestore) ]  [ MEDIA (Drive API) ]
                                  ▲
Layer 2: CORE DOMAIN     [ RBAC ] ──► [ STATE_MODEL ] ──► [ WORKFLOW (15-Step) ] ──► [ DOMAIN_MODEL ]
                                  ▲
Layer 1: FOUNDATION      [ REQUIREMENTS ]
```

---

## 03. Complete Dependency Matrix Table (All 20 Canonical Nodes)

| Node ID | Layer | Direct Prerequisites | Downstream Dependents | Critical Path | Effort (Days) |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **REQUIREMENTS** | Foundation | None (Root) | `DOMAIN_MODEL` | **YES** | 2 |
| **DOMAIN_MODEL** | Core Domain | `REQUIREMENTS` | `WORKFLOW` | **YES** | 3 |
| **WORKFLOW** | Core Domain | `DOMAIN_MODEL` | `STATE_MODEL` | **YES** | 3 |
| **STATE_MODEL** | Core Domain | `WORKFLOW` | `RBAC`, `DATABASE` | **YES** | 3 |
| **RBAC** | Core Domain | `STATE_MODEL` | `DATABASE`, `SECURITY` | **YES** | 2 |
| **DATABASE** | Persistence | `STATE_MODEL`, `RBAC` | `MEDIA`, `BACKGROUND_JOBS`, `SECURITY`, `API_CONTRACTS`, `ANALYTICS` | **YES** | 4 |
| **MEDIA** | Persistence | `DATABASE` | `BACKGROUND_JOBS`, `AI_SUBSYSTEM` | NO | 3 |
| **BACKGROUND_JOBS**| Cross-Cutting| `DATABASE`, `MEDIA` | `AI_SUBSYSTEM`, `AUDIT_OBSERVABILITY` | NO | 3 |
| **AI_SUBSYSTEM** | Cross-Cutting| `BACKGROUND_JOBS`, `MEDIA` | `API_CONTRACTS` | NO | 4 |
| **REALTIME** | Cross-Cutting| `STATE_MODEL` | `API_CONTRACTS`, `FRONTEND_IA` | NO | 2 |
| **SECURITY** | Cross-Cutting| `DATABASE`, `RBAC` | `API_CONTRACTS`, `AUDIT_OBSERVABILITY` | **YES** | 3 |
| **API_CONTRACTS** | Interface | `DATABASE`, `SECURITY`, `AI_SUBSYSTEM`, `REALTIME` | `PAGE_ROUTES`, `FRONTEND_IA` | **YES** | 4 |
| **FRONTEND_IA** | Interface | `PAGE_ROUTES`, `REALTIME` | `PHYSICAL_IMPLEMENTATION` | **YES** | 3 |
| **PAGE_ROUTES** | Interface | `API_CONTRACTS` | `FRONTEND_IA` | **YES** | 2 |
| **ANALYTICS** | Cross-Cutting| `DATABASE`, `API_CONTRACTS` | `PHYSICAL_IMPLEMENTATION` | NO | 3 |
| **AUDIT_OBSERVABILITY**| Cross-Cutting| `SECURITY`, `BACKGROUND_JOBS` | `PHYSICAL_IMPLEMENTATION` | NO | 2 |
| **COST_GOVERNANCE** | Governance | `DATABASE`, `AI_SUBSYSTEM`, `BACKGROUND_JOBS` | `PHYSICAL_IMPLEMENTATION` | NO | 2 |
| **MIGRATION** | Governance | `DATABASE`, `API_CONTRACTS`, `PAGE_ROUTES` | `PHYSICAL_IMPLEMENTATION` | NO | 3 |
| **TEST_ARCHITECTURE**| Governance | `API_CONTRACTS`, `WORKFLOW`, `SECURITY` | `PHYSICAL_IMPLEMENTATION` | NO | 3 |
| **PHYSICAL_IMPLEMENTATION**| Execution| `FRONTEND_IA`, `PAGE_ROUTES`, `ANALYTICS`, `AUDIT_OBSERVABILITY`, `COST_GOVERNANCE`, `MIGRATION`, `TEST_ARCHITECTURE` | None (Terminal Node) | **YES** | 5 |

---

## 04. Critical Path & Bottleneck Analysis

The primary critical path comprises 11 sequential milestones:
$$\text{REQUIREMENTS} \to \text{DOMAIN\_MODEL} \to \text{WORKFLOW} \to \text{STATE\_MODEL} \to \text{RBAC} \to \text{DATABASE} \to \text{SECURITY} \to \text{API\_CONTRACTS} \to \text{PAGE\_ROUTES} \to \text{FRONTEND\_IA} \to \text{PHYSICAL\_IMPLEMENTATION}$$

- **Total Critical Path Duration:** $2 + 3 + 3 + 3 + 2 + 4 + 3 + 4 + 2 + 3 + 5 = \mathbf{34\text{ Days}}$
- **Bottleneck Node:** `DATABASE` (Firestore Native Hybrid schema) and `API_CONTRACTS` (Universal Envelopes) unlock the highest degree of parallel downstream work streams.

---

## 05. Decoupled Parallel Implementation Streams

Once `DATABASE` and `STATE_MODEL` are closed, development can execute simultaneously across 4 independent tracks:
1. **Track A (Media Pipeline):** `MEDIA` $\to$ Google Drive API v3 binary chunking & SHA-256 integrity validators.
2. **Track B (AI Generation):** `AI_SUBSYSTEM` $\to$ Gemini 2.5 Flash 7-step assistive drafting pipeline.
3. **Track C (Real-Time Communication):** `REALTIME` $\to$ In-memory SSE EventBus streaming.
4. **Track D (Analytics & Observability):** `ANALYTICS` + `AUDIT_OBSERVABILITY` $\to$ Cloud Logging stdout & telemetry loops.

---

## 06. Execution Gating Invariant

1. **Strict Upstream Completion:** No engineer or agent can commence physical implementation on a node until all prerequisite nodes in `prerequisites[]` have achieved status `ACCEPTED — COMPLETE — CLOSED`.
2. **Zero Circularity:** Any PR or architectural update introducing cyclic dependencies is automatically rejected by the `test:stage25` test suite.
