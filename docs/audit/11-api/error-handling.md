# API Error Handling & Catch Block Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 20 of 30  

---

## 1. Exception Handling Architecture

In `src/server/routes.ts`, **269 explicit `try/catch` blocks** wrap endpoint logic.
Typical catch block implementation:
```typescript
} catch (error: any) {
  console.error("Error in [ROUTE_NAME]:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
}
```

---

## 2. Error Leakage & Masking Vulnerabilities
1. **Technical Stack Trace Leakage**: When external Google APIs throw errors (e.g. Google Sheets 429 quota exhaustion or Drive 403 API key restrictions), `error.message` containing raw Google Cloud internal RPC error strings is returned directly to the client browser.
2. **Masked 404s**: Certain services throw generic `Error("Not found")` inside domain logic; the route handler catches it as an unhandled exception and returns `500 Internal Server Error` instead of the appropriate `404 Not Found`.
