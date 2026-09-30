# "Does Nothing" & Stub Action Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 21 of 30  

---

## 1. Does-Nothing Action Criteria

An action is classified as **DOES_NOTHING (ACT-001)** if clicking it:
1. Has an empty handler (`onClick={() => {}}`).
2. Only outputs to browser console (`console.log("TODO")`).
3. Calls a stub returning hardcoded mock data without persistence.
4. Is permanently disabled with no path to enablement.

---

## 2. Does-Nothing Action Register

| Host Page / Component | UI Element Label | Handler Implementation | Intended Behavior | Actual Behavior | Classification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `PlanningPage.tsx:412` | "Export Curriculum Plan" | `onClick={() => console.log("Exporting...")}` | Export CSV/PDF of curriculum | Only logs to console | **ACT-001 (Stub)** |
| `PlanningPage.tsx:445` | "Batch Print Question Cards"| Empty `onClick` handler | Print physical review cards | Does nothing | **ACT-001 (No-op)** |
| `DashboardPage.tsx:88` | "Filter By Quarter" | `onChange={() => {}}` | Filters KPI dashboard by fiscal quarter | Does nothing (No filter logic) | **ACT-001 (No-op)** |
| `SocialAnalyticsPage:224`| "Auto-Moderate Comments" | `onClick={() => alert("Coming soon")}` | AI auto-moderation of spam | Shows browser alert (disabled) | **ACT-001 (Stub)** |
