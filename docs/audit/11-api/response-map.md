# API Response Shapes & Contract Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 18 of 30  

---

## 1. Response Envelope Standards

BP-CMS implements a standard JSON response envelope across the majority of its endpoints:

### Success Envelope (Standard)
```json
{
  "success": true,
  "data": { ... } // or named entity property, e.g. "video": { ... }
}
```

### Error Envelope (Standard)
```json
{
  "error": "Descriptive error message string",
  "details": [ ... ] // Optional validation error details
}
```

---

## 2. Response Inconsistencies Discovered
1. **Bare Entity vs Wrapped Entity**: Some endpoints return `{ success: true, video }` while others return the raw video object `{ id, title, status }` without a wrapper, forcing frontend callers to use inconsistent extraction patterns.
2. **Internal Property Leakage**: Certain endpoints return raw Google Sheets row array indices (`_rowIndex`, `_sheetName`) directly to the client browser.
