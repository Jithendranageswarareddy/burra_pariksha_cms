# Canonical Component Candidates Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Canonical Candidate Criteria
To qualify as a canonical candidate, a component must demonstrate:
1. Application-wide reuse across multiple distinct routes.
2. Formalized prop interface and token-based styling.
3. Centralized maintenance rather than ad-hoc copy-pasted styling.

---

## 2. Identified Canonical Component Candidates

### A. Design System Foundations (`src/design-system/`)
- **`src/design-system/components/Button.tsx`**: Provides standardized primary, secondary, danger, and ghost variants with integrated loading spinner.
- **`src/design-system/components/Card.tsx`**: Standardized container with uniform background, border, and elevation tokens.
- **`src/design-system/components/Badge.tsx`**: Structured status badge supporting colors mapped to semantic states.
- **`src/design-system/components/Modal.tsx`**: Accessible dialog backdrop, keyboard escape handler, and header/footer slots.
- **`src/design-system/components/Alert.tsx`**: Semantic notification banner (info, success, warning, error).
- **`src/design-system/components/Table.tsx`**: Structured table primitive with sort headers and empty states.

### B. Global Application Shell Primitives (`src/components/layout/`)
- **`src/components/layout/Layout.tsx`**: Authoritative application shell.
- **`src/components/layout/Header.tsx`**: Authoritative global header.
- **`src/components/layout/Sidebar.tsx`**: Authoritative role-filtered navigation drawer.
- **`src/components/layout/ErrorBoundary.tsx`**: Authoritative crash boundary.

### C. Workflow Primitives
- **`src/components/production/ProductionJourneyBar.tsx`**: Authoritative visual representation of the 15 canonical production stages.
