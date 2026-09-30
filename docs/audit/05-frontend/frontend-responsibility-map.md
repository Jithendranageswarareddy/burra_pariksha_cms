# Frontend Layer Responsibility Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Architectural Responsibility Breakdown

| Architectural Layer | Intended Responsibility | Actual Implemented Responsibility | Observed Deficiencies / Overlap |
| :--- | :--- | :--- | :--- |
| **Application Root (`App.tsx`)** | Top-level routing and provider tree | Mounts providers, handles auth gate, registers routes | Unrouted legacy pages remain in repo; lacks route guards |
| **Application Shell (`Layout.tsx`)** | Common layout framing and navigation | Renders Header, Sidebar, JourneyBar, and Outlet | Coupled to `localStorage` for sidebar collapse |
| **Pages (`src/pages/`)** | Route coordinate, compose views | Composes views, holds local `useState`, calls `apiClient` | `PlanningPage` executes 17 direct `fetch` calls; business logic leaks into pages |
| **Workspaces (`src/components/video/`)** | Specialized step editing environments | Handles video stages, uploads, script edits | Direct dependency on raw Google Drive folder IDs |
| **Design System (`src/design-system/`)** | Canonical token-based UI primitives | Provides standard buttons, cards, modals | Competes directly with `src/components/common/` |
| **Common Components (`src/components/common/`)** | Ad-hoc UI widgets | Duplicate implementations of Button, Modal, EmptyState | Redundant code; inconsistent visual styling |
| **Contexts (`src/contexts/`)** | Shared global state | `AuthContext` (Auth); `ProductionJourneyContext` (Workflow) | `ProductionJourneyContext` is 996 lines and holds heavy stage blocker rules |
| **API Client (`src/lib/api-client.ts`)** | HTTP bridge to server | Monolithic fetch client for 49 consumers | 1,667 lines; no domain modularization |
| **Custom Hooks** | Encapsulated state & effects | Only 2 context hooks exist; 0 domain hooks | Pages write heavy imperative `useEffect` fetch blocks |
