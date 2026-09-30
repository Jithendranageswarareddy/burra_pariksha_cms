# Controller & Handler Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 04 of 30  

---

## 1. Controller Implementation Pattern

BP-CMS does not use separate class-based or standalone controller files. Instead, **every endpoint handler is implemented as an inline asynchronous anonymous function** directly within the `apiRouter.METHOD(path, async (req, res) => { ... })` declaration in `src/server/routes.ts`.

### Typical Handler Structure:
```typescript
apiRouter.post('/videos/:id/record', async (req, res) => {
  try {
    const { id } = req.params;
    const { rawDriveUrl, takeNumber } = req.body;
    // 1. Parameter validation
    if (!rawDriveUrl) return res.status(400).json({ error: 'rawDriveUrl is required' });
    // 2. Service invocation
    const video = await videoService.recordTake(id, { rawDriveUrl, takeNumber });
    // 3. Response dispatch
    return res.status(200).json({ success: true, video });
  } catch (error: any) {
    // 4. Error response
    return res.status(500).json({ error: error.message || 'Failed to record take' });
  }
});
```

---

## 2. Handler Responsibility Audit
- **Direct Logic in Handlers**: Handlers are generally thin (average 15-30 lines of code), delegating heavy business operations to `src/lib/services/`.
- **Validation in Handlers**: Handlers perform first-line imperative parameter presence checks before dispatching to services.
- **Exception Catching**: 100% of handlers wrap logic in `try/catch` blocks, preventing unhandled promise rejections from crashing the Express Node.js process.
