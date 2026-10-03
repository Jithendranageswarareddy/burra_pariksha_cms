# BP-CMS FEATURE CONTRACT INDEX
## Burra Pariksha Content Management System
### Authoritative Feature Contract Inventory & Stage 27 Implementation Gateway

```
================================================================================
Document ID:       BP-FC-INDEX
Version:           1.0.0
Status:            APPROVED / READY FOR STAGE 27 IMPLEMENTATION
Scope:             Complete inventory of 22 implementation-ready Feature Contracts,
                   Topological execution sequence, Critical path analysis,
                   Readiness classifications, and Stage 27 gating rules.
Upstream Inputs:   Stages 01–25 Authoritative Specifications
Downstream:        Stage 27 (Physical Implementation)
Zero-Code Rule:    Contracts are specification documents only. 0 runtime changes.
================================================================================
```

---

## 1. Master Feature Contract Inventory Matrix

| ID | Feature Name | Business Area | Canonical Workflow Stage(s) | Dependencies | Contract Status | Priority | Implementation Readiness | Target Stage 27 Phase |
|---|---|---|---|---|---|---|---|---|
| **FC-001** | System Foundation & Identity Authentication | Foundation / IAM | Universal (Prerequisite) | None (Root) | APPROVED | P0 | **READY_FOR_IMPLEMENTATION** | Phase A (Sprint 1) |
| **FC-002** | Roles & Capability Authorization Matrix | Foundation / Access Control | Universal (Prerequisite) | FC-001 | APPROVED | P0 | **READY_FOR_IMPLEMENTATION** | Phase A (Sprint 1) |
| **FC-003** | Database Abstraction & Universal API Envelopes | Foundation / Persistence & API | Universal (Prerequisite) | FC-001, FC-002 | APPROVED | P0 | **READY_FOR_IMPLEMENTATION** | Phase A (Sprint 1) |
| **FC-004** | Audit Ledger & Observability | Foundation / Audit & Telemetry | Universal (Prerequisite) | FC-001, FC-002, FC-003 | APPROVED | P0 | **READY_FOR_IMPLEMENTATION** | Phase A (Sprint 1) |
| **FC-005** | Canonical 15-Step Workflow State Machine | Core Content / State Engine | Governs Steps 01–15 | FC-001..FC-004 | APPROVED | P0 | **READY_WITH_DEPENDENCIES** | Phase B (Sprint 2) |
| **FC-006** | Question Generation & Versioning | Core Content / Question Authoring | Step 01 (Question Gen) | FC-001..FC-005 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase B (Sprint 2) |
| **FC-007** | Question Verification & Reviews with GAR-02 | Core Content / Quality Assurance | Step 02 (Question Verify) | FC-005, FC-006 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase B (Sprint 2) |
| **FC-008** | Audience Scripting & Versioning | Content Production / Scriptwriting | Step 03 (Audience Script) | FC-005, FC-006, FC-007 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase C (Sprint 3) |
| **FC-009** | Teleprompter & Filming Studio | Studio Operations / Filming | Step 04 (Prompter & Film) | FC-005, FC-008 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase C (Sprint 3) |
| **FC-010** | Google Drive Media Storage & Raw Video | Media Management / Tri-Layer Storage | Step 05 (Raw Video) | FC-003, FC-005, FC-009 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase C (Sprint 3) |
| **FC-011** | Editing Bay & 9:16 Timeline | Video Production / Editing & Assembly | Step 06 (Editing Bay) | FC-005, FC-008, FC-010 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase D (Sprint 4) |
| **FC-012** | Final QC Review Gate with Safe-Zone Validation | Quality Assurance / Content QC | Step 07 (Final QC) | FC-005, FC-011 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase D (Sprint 4) |
| **FC-013** | Thumbnail Creative & CDN Delivery | Creative Production / Thumbnails | Step 08 (Thumbnail) | FC-005, FC-010, FC-012 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase E (Sprint 5) |
| **FC-014** | Social Review & Compliance Gate | Publishing Governance / Compliance | Step 09 (Social Review) | FC-005, FC-012, FC-013 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase E (Sprint 5) |
| **FC-015** | Publishing Package Assembly & Scheduling | Distribution / Publishing Setup | Steps 10 & 11 (Publish) | FC-005, FC-012..FC-014 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase E (Sprint 5) |
| **FC-016** | External Platform Release & Sync | Distribution / Platform Sync | Step 12 (Platform Sync) | FC-010, FC-015 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase E (Sprint 5) |
| **FC-017** | Background Job Queue & Task Workers | Infrastructure / Async Execution | Cross-cutting (05, 12, 13) | FC-001..FC-004 | APPROVED | P1 | **READY_WITH_DEPENDENCIES** | Phase F (Sprint 6) |
| **FC-018** | Realtime SSE Bus & In-App Alerts | UX & Realtime / SSE Bus | Cross-cutting (All Hubs) | FC-001..FC-005 | APPROVED | P2 | **READY_WITH_DEPENDENCIES** | Phase F (Sprint 6) |
| **FC-019** | Assistive AI Pipeline & Human Approval | Content Intelligence / Assistive AI | Steps 01, 03, 10 | FC-006, FC-008, FC-017 | APPROVED | P2 | **BLOCKED** (Awaits FC-017 Jobs) | Phase G (Sprint 7) |
| **FC-020** | Platform Telemetry & Performance Deciles | Analytics / Performance Tracking | Steps 13 & 14 (Analytics) | FC-016, FC-017 | APPROVED | P2 | **BLOCKED** (Awaits FC-016 Sync) | Phase H (Sprint 8) |
| **FC-021** | Content Intelligence Loop & Topic Strategy | Content Strategy / Feedback Loop | Step 15 (Intelligence Loop) | FC-006, FC-020 | APPROVED | P2 | **BLOCKED** (Awaits FC-020 Metrics) | Phase H (Sprint 8) |
| **FC-022** | Strangler Fig Dual-Write & Sheets Migration | Migration & Coexistence / Legacy | Universal (Stages 27–29) | FC-003, FC-006, FC-017 | APPROVED | P2 | **READY_WITH_DEPENDENCIES** | Phase H (Sprint 8) |

---

## 2. Recommended Stage 27 Implementation Order

Derived from the mathematically proven Stage 25 Directed Acyclic Graph (DAG), implementation in Stage 27 proceeds in eight sequential, tightly bounded phases:

### Phase A: System Foundation (Sprint 1)
- **1. FC-001**: System Foundation & Identity Authentication
- **2. FC-002**: Roles & Capability Authorization Matrix
- **3. FC-003**: Database Abstraction & Universal API Envelopes
- **4. FC-004**: Audit Ledger & Observability
- *Phase Exit Gate*: Zero-trust session creation, RBAC checks, in-memory repository CRUD, and structured logging 100% verified via automated tests.

### Phase B: Core Content Engine (Sprint 2)
- **5. FC-005**: Canonical 15-Step Workflow State Machine
- **6. FC-006**: Question Generation & Versioning (Step 01)
- **7. FC-007**: Question Verification & Reviews with GAR-02 Rule (Step 02)
- *Phase Exit Gate*: Question authoring, immutable versioning, independent SME review queue, and anti-self-approval rule proven.

### Phase C: Scripting & Media Engine (Sprint 3)
- **8. FC-008**: Audience Scripting & Versioning (Step 03)
- **9. FC-009**: Teleprompter & Filming Studio (Step 04)
- **10. FC-010**: Google Drive Media Storage & Raw Video (Step 05)
- *Phase Exit Gate*: Script timing calculator, fullscreen mirrored teleprompter, direct-to-Drive resumable upload tickets, and SHA-256 integrity verification passing.

### Phase D: Editing Bay & Final QC (Sprint 4)
- **11. FC-011**: Editing Bay & 9:16 Timeline (Step 06)
- **12. FC-012**: Final QC Review Gate with Safe-Zone Validation (Step 07)
- *Phase Exit Gate*: 9:16 mobile safe-zone overlay player, frame-accurate defect markers, 5-point QC checklist, and editor anti-self-approval enforced.

### Phase E: Publishing & Distribution (Sprint 5)
- **13. FC-013**: Thumbnail Creative & CDN Delivery (Step 08)
- **14. FC-014**: Social Review & Compliance Gate (Step 09)
- **15. FC-015**: Publishing Package Assembly & Scheduling (Steps 10 & 11)
- **16. FC-016**: External Platform Release & Sync (Step 12)
- *Phase Exit Gate*: Multi-aspect crop preview, social compliance checklist, release scheduler, and YouTube Data API v3 upload verified.

### Phase F: Asynchronous Services & Realtime (Sprint 6)
- **17. FC-017**: Background Job Queue & Task Workers
- **18. FC-018**: Realtime SSE Bus & In-App Alerts
- *Phase Exit Gate*: Cloud Tasks lease-locking worker, DLQ routing, in-process SSE broadcast, and fallback to 15s HTTP polling passing.

### Phase G: Assistive AI Pipeline (Sprint 7)
- **19. FC-019**: Assistive AI Pipeline & Human Approval (Steps 01, 03, 10)
- *Phase Exit Gate*: Gemini 2.5 Flash adapter, 15 RPM token bucket rate limiter, `ai_proposals` collection, and AP-009 human approval barrier mathematically proven.

### Phase H: Analytics, Intelligence & Migration (Sprint 8)
- **20. FC-020**: Platform Telemetry & Performance Deciles (Steps 13 & 14)
- **21. FC-021**: Content Intelligence Loop & Topic Strategy (Step 15 $\to$ Step 01)
- **22. FC-022**: Strangler Fig Dual-Write & Sheets Migration
- *Phase Exit Gate*: Automated telemetry ingestion, decile distribution ranking ($D_1..D_{10}$), closed-loop topic recommendations feeding Step 01, and 30-day zero-diff dual-write verified.

---

## 3. Critical Path Analysis

The Critical Path represents the primary spine of hard dependencies. Any delay in this chain directly blocks all downstream features:

$$\mathbf{FC\text{-}001 \to FC\text{-}002 \to FC\text{-}003 \to FC\text{-}004 \to FC\text{-}005 \to FC\text{-}006 \to FC\text{-}007 \to FC\text{-}008 \to FC\text{-}010 \to FC\text{-}011 \to FC\text{-}012 \to FC\text{-}015 \to FC\text{-}016}$$

- **Primary Spine Size**: 13 interconnected feature contracts.
- **Total Critical Path Duration**: 34 developer days (under standard velocity).

---

## 4. Parallelizable Features

While the Critical Path is executed sequentially, the following features can be developed concurrently by auxiliary developers using stubbed contracts and test doubles:

1. **FC-009 (Teleprompter Studio)**: Can be built against mocked `Script` interfaces concurrently with FC-008.
2. **FC-013 (Thumbnail Creative Management)**: Can be built in parallel with FC-011 (Editing Bay) since it depends primarily on media storage tickets and visual cropping.
3. **FC-017 (Background Job Queue)**: Can be constructed in parallel during Phase C/D against the `IRepository` abstraction.
4. **FC-018 (Realtime SSE Bus)**: In-process event emitter can be developed in parallel with Phase B/C.
5. **FC-022 (Strangler Fig Importers)**: Data transformation parsing utilities can be created in parallel with Phase A/B.

---

## 5. Blocked Features & Blocker Resolution

The following features cannot enter physical implementation until their architectural and technical predecessors are completed:

| Feature ID | Feature Name | Immediate Blocker | Blocker Resolution Path |
|---|---|---|---|
| **FC-019** | Assistive AI Pipeline | FC-017 (Background Jobs) | AI requests must be processed asynchronously to prevent HTTP gateway timeouts. Unblocks in Phase G after FC-017 completes. |
| **FC-020** | Platform Telemetry & Deciles | FC-016 (Platform Sync) | Metrics cannot be harvested until live platform publication returns remote video IDs. Unblocks in Phase H after FC-016 completes. |
| **FC-021** | Content Intelligence Strategy | FC-020 (Telemetry) | Strategic recommendations require historical decile performance data. Unblocks in Phase H after FC-020 completes. |

---

## 6. Implementation Readiness Classification Summary

- **`READY_FOR_IMPLEMENTATION` (4 Features)**: FC-001, FC-002, FC-003, FC-004 (Phase A Foundation).
- **`READY_WITH_DEPENDENCIES` (15 Features)**: FC-005 through FC-018, FC-022 (Architecturally complete; scheduled sequentially behind prerequisites).
- **`BLOCKED` (3 Features)**: FC-019, FC-020, FC-021 (Requires execution of async or distribution infrastructure before code entry).

---

## 7. Stage 27 Implementation Gating Protocol

No feature contract in this index may move into Stage 27 code implementation unless the following 5 runtime invariants are respected:
1. **One Feature at a Time**: Stage 27 implements features strictly one contract at a time in the Phase A–H sequence.
2. **Test-First Verification**: Every feature implementation must include the explicit unit and API test identifiers specified in Section 22 of its contract.
3. **Budget Compliance**: No feature may introduce paid GCP infrastructure outside the Stage 22 ₹0–₹100 INR/month limit.
4. **Zero Duplicate Truth**: Backend remains the sole operational authority; frontend permission checks are UX hints only.
5. **GAR-02 Strictness**: Anti-self-approval rules cannot be bypassed for testing or administrative shortcuts.
