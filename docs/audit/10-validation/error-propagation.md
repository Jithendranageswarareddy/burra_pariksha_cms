# Error Propagation Forensic Trace (23 Swallowed Catch Blocks)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 12 of 30  

---

## 1. Executive Summary

Tracing asynchronous execution chains across BP-CMS revealed that while Express route handlers uniformly return JSON errors (`res.status(code).json({ error: message })`), the frontend consuming layer frequently swallows or mishandles errors. Specifically, **23 catch blocks** across components log errors to `console.error` without setting user-facing error state.

---

## 2. Representative Swallowed Error Traces

### Trace 1: `PlanningPage.tsx` Batch Generation Fetch
```typescript
// src/pages/PlanningPage.tsx line 312
try {
  const res = await fetch("/api/planning/batches", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("Failed");
  const data = await res.json();
  setBatches(prev => [...prev, data]);
} catch (err) {
  console.error("Error creating batch:", err);
  // DEFECT: No setError state called!
  // Loading spinner remains active or resets silently without informing user!
} finally {
  setIsLoading(false);
}
```

### Trace 2: `QuestionDetailPage.tsx` Metadata Refresh
```typescript
// src/pages/QuestionDetailPage.tsx line 184
try {
  await questionService.updateMetadata(id, metadata);
} catch (e) {
  console.log("Failed to update metadata", e);
  // DEFECT: Error swallowed silently; user sees optimistic update revert or stale UI!
}
```

---

## 3. Propagation Integrity Breakdown
- **Preserved Context**: 42% of errors properly extract `err.message` and display it in an active banner.
- **Generic Fallback**: 36% of errors discard backend error messages and display a hardcoded string.
- **Swallowed / Invisible**: 22% of errors (23 locations) are logged to console with zero visual indication to the user.
