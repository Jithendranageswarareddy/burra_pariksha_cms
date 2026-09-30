# Step 29: Requirements → Target Architecture Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Target Architecture Blueprint & Specifications  
**Phase:** Step 29 of 30  
**Status:** **AUTHORITATIVE TARGET SPECIFICATION (DESIGN ONLY)**  
**Date:** 2026-09-29  

---

## 1. Executive Architecture Specification

This blueprint synthesizes the forensic findings of Steps 01–28 to define the authoritative **Target Architecture for BP-CMS**. Grounded in brownfield preservation and evidence-first design, this specification details the business requirements, functional contracts, canonical 15-stage workflow, relational PostgreSQL persistence model, Zero-Trust multi-layer RBAC, asynchronous worker architecture, and AI assistive boundaries.

---

## 2. Core Architectural Pillars

1. **Canonical 15-Stage Workflow Engine:** Exactly 15 business stages with formal Stage Contracts, eliminating state machine divergences (`Video.status` vs `Question.videoStatus`) via atomic ACID transactions.
2. **Relational PostgreSQL Core (Cloud SQL):** Transitions tabular storage from Google Sheets API v4 (rate limits, 0 ACID) to PostgreSQL 16 with Drizzle ORM (< 35ms p95 latency target).
3. **Zero-Trust Multi-Layer RBAC:** Client-side React Router `RequireRole` route guards combined with Express `requireRole` middleware and `ObjectAuthService` anti-self-approval enforcement.
4. **Deterministic Storage Hierarchy:** Unified Google Drive weekly directory structure (`BP_CMS_PROD_ROOT/01_RAW_VIDEOS/`, etc.) resolving Phase 7 vs Phase 14 divergence.
5. **Asynchronous BullMQ Worker Fleet:** Offloads long-running YouTube Data API v3 uploads, Meta Graph API publishing, and hourly analytics ingestion to background Redis queues.
6. **Closed-Loop Intelligence Engine:** Connects Stage 14 drop-off analytics directly into Stage 15 synthesis and Stage 01 Gemini prompt directives with 1-click draft pre-population.

---

## 3. Master Deliverable

The complete, unabridged master target architecture specification is available in:  
👉 **`TARGET-BP-CMS-ARCHITECTURE-SPECIFICATION.md`**
