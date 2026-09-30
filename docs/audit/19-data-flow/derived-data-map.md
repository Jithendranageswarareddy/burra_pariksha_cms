# Derived Data Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 20 of 35  

---

## 1. Catalog of Calculated & Derived Values

| Derived Field / Metric | Source Data | Calculation Location | Recalculation Trigger | Stale Risk | Authoritative Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **completedPlatformsCount** | `Publishing.youtube`, `instagram`, `facebook` | `PublishingService.updatePublishingRecord` | On platform publish | Low (Computed synchronously) | DERIVED |
| **PublishReadinessResult.isReady** | Video, Thumbnail, Script, Comment, Review | `PublishingService.validatePublishReadiness` | On demand | High (If underlying entity changes) | DERIVED / ADVISORY |
| **Question.validationScore** | MultiLayerVerificationEngine check weights | `MultiLayerVerificationEngine.verify()` | On question creation/edit | None (Immutable per verification run)| DERIVED |
| **ProductionStats** | `VIDEOS` sheet rows | `DashboardService.getProductionStats()` | On dashboard load | Medium (2.5s row cache window) | DERIVED |
| **AI Performance Intelligence** | `ANALYTICS` historical snapshots | `SocialPerformanceIntelligenceService` | On AI generate click | High (Static snapshot until rerun) | DERIVED / ADVISORY |
| **Taxonomy Metrics** | `QUESTIONS` categorized counts | `TaxonomyService.getTaxonomyMetrics()` | On taxonomy view | Medium (Full sheet scan compute) | DERIVED |
| **WorkloadSummary** | `ASSIGNMENTS` + `VIDEOS` active rows | `AssignmentService.getUserWorkload()` | On team page load | Medium (In-memory aggregation) | DERIVED |
