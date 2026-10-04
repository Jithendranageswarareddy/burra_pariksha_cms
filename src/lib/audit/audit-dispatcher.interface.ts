/**
 * BURRA PARIKSHA CMS — Audit Dispatcher Abstraction
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY (Section 08 & 09)
 */

import {
  AuditEvent,
  CreateAuditEventInput,
  AuditQueryFilters,
} from '../../types/audit';

export interface AuditQueryResult {
  events: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAuditDispatcher {
  /**
   * Dispatches and appends a canonical 7-dimensional audit event.
   * Enforces immutability: Records can never be updated or deleted.
   */
  dispatch(input: CreateAuditEventInput): Promise<AuditEvent>;

  /**
   * Queries audit records with filtering and pagination.
   * Access restricted to AUDIT_VIEW capability holders.
   */
  query(filters?: AuditQueryFilters): Promise<AuditQueryResult>;
}
