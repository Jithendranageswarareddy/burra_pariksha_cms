# Storage Source-of-Truth Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 17 of 40  

---

## 1. Dual-Tier Source of Truth Architecture

BP-CMS divides its Source of Truth across two cloud storage tiers:

```
┌────────────────────────────────────────────────────────┐
│                   BURRA PARIKSHA CMS                   │
├──────────────────────────┬─────────────────────────────┤
│   TABULAR PERSISTENCE    │      BINARY ASSET STORE     │
│      (Google Sheets)     │       (Google Drive)        │
├──────────────────────────┼─────────────────────────────┤
│ - Canonical Entity IDs   │ - Actual Video Bitstreams   │
│ - Conveyor Stage States  │ - Real Audio Tracks         │
│ - Script Text & Prompter │ - High-Res Thumbnail Images │
│ - User RBAC & Roles      │ - Master Final MP4 Renders  │
│ - Audit Event Logs       │                             │
│ - Monotonic Version #s   │                             │
└──────────────────────────┴─────────────────────────────┘
```

---

## 2. Authority Rules
1. **Binary Content:** Google Drive is **AUTHORITATIVE**. The actual pixels and audio frequencies exist only in Drive.
2. **Entity Metadata:** Google Sheets is **AUTHORITATIVE**. The production status, title, assigned editor, and quality approval state exist only in Sheets.
3. **Linkage Mechanism:** The string `driveFileId` is the sole foreign key connecting the two systems.
