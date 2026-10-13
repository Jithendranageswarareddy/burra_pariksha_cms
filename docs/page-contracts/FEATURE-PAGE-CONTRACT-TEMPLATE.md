# Feature Page Contract Template

Use this exact section order for every stage contract. In **3.1 Page Identity**,
record one of these statuses:

- **Draft** — initial contract or material claims remain unverified.
- **Reviewed** — checked against current implementation and authoritative
  architecture, with unresolved gaps explicitly identified.
- **Approved** — formally accepted as the authoritative page contract; never use
  this status without explicit approval.

Every material claim about a route, request, API function, backend use case,
persistence, transition, audit event, or role must cite a repository file,
feature contract, or authoritative architecture document. Label claims as
`IMPLEMENTED` only when observed in code/tests; distinguish intended
architecture from runtime behavior and mark insufficient evidence
`UNVERIFIED`. Use `ARCHITECTURE GAP`, `IMPLEMENTATION GAP`, or
`DOCUMENTATION GAP` for identified discrepancies.

## 3.1 Page Identity
## 3.2 Purpose
## 3.3 Entry Condition
## 3.4 Required Data
## 3.5 GET Requests
## 3.6 User Inputs
## 3.7 Defaults
## 3.8 Primary Action
## 3.9 API Request
## 3.10 Backend Use Case
## 3.11 Response
## 3.12 Persistence
## 3.13 Workflow State
## 3.14 Audit
## 3.15 Error States
## 3.16 Empty States
## 3.17 Next Action
## 3.18 Role Visibility
## 3.19 Performance
## 3.20 Acceptance Criteria
