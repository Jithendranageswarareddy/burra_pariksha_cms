# Workflow Entry Points

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 04 of 41  

---

## 1. Discovered Workflow Ingress Paths

| Ingress Path | Entry Surface | User Role | Initial Entity | Initial State | Downstream Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Manual Question Creation** | `/questions/new` (Modal) | Creator / SME | `Question` (`BP-Q-`) | `GENERATED` | Straight to Verification |
| **AI Question Studio** | `/studio` | Creator / Lead | `QuestionDraft` (`BP-DFT-`) | `DRAFT` | Review -> Approval Gate |
| **Planning Batch Generation**| `/planning` | Content Lead | `ContentPlan` / `Batch` | `PLANNED` | Batch Questions Ingress |
| **Direct Video Queueing** | `/questions/approved`| Manager / Lead | `Video` (`BP-V-`) | `QUEUED` | Skips Script if existing |
| **Test Script Injection** | `scripts/seed-*.ts` | CLI / Admin | Test Question / Video | `APPROVED` / `QUEUED` | Production Sheet Write |
