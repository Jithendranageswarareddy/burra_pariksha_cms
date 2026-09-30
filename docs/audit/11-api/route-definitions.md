# Route Definitions & Dispatch Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 03 of 30  

---

## 1. Route Mounting Architecture

BP-CMS configures its API routes in `src/server/routes.ts`, which creates and exports an Express `Router` instance:
```typescript
// src/server/routes.ts line 68
export const apiRouter = Router();
```
In `server.ts`, this router is mounted at the `/api` path prefix:
```typescript
// server.ts line 38
app.use('/api', apiRouter);
```
All client-side fetch requests therefore target paths prefixed with `/api/...`.

---

## 2. Parameter Extraction & Route Matching Patterns

The router uses standard Express parameterized route segments:
1. **Entity ID Matching**: `/:id` (e.g. `/api/videos/:id`, `/api/questions/:id`)
2. **Sub-resource Action Routing**: `/:id/:action` (e.g. `/api/videos/:id/record`, `/api/videos/:id/final-qc`)
3. **Compound Phase Routing**: `/phase15/:action`, `/phase18/:action` (Legacy subsystem namespaces)
4. **Query Parameter Filters**: Extracted via `req.query` (e.g. `?status=`, `?subject=`, `?page=`, `?limit=`)

---

## 3. Route Definition AST Anomalies
- **Monolithic Route File**: All 270 endpoints are defined inside a single 2,800+ line file (`src/server/routes.ts`) rather than split into modular domain router controllers.
- **Route Collisions**: `GET /questions/verify` is defined above `GET /questions/:id`; if the order were inverted, `:id` would intercept the static segment `verify`.
