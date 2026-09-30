# Step 30: 10 — Observability, Monitoring & Telemetry Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Observability & Telemetry Engineering Blueprint  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Observability Architecture

To ensure high availability and rapid incident response across production workloads, BP-CMS implements a structured 3-tier observability stack:

```
[ Application Tier (React / Express) ]
    │
    ├── Structured JSON Logs (Pino) ───────────► Google Cloud Logging (Stackdriver)
    ├── Distributed Traces (OpenTelemetry) ────► Google Cloud Trace
    ├── System & Custom Metrics (Prometheus) ──► Google Cloud Monitoring
    └── Security Audit Events ─────────────────► Immutable PostgreSQL Table
```

---

## 2. Structured Logging & Context Propagation

All log entries are emitted in structured JSON format and tagged with a unique `traceId` and `actorId`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

// Express Request Logging Interceptor
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  req.traceId = traceId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      traceId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      actorId: req.user?.id || 'ANONYMOUS',
      ip: req.ip
    }, `${req.method} ${req.originalUrl} completed with status ${res.statusCode}`);
  });

  next();
}
```

---

## 3. SLA & Health Monitoring Metrics

| Metric Category | Target SLA | Alert Threshold | Notification Channel |
| :--- | :--- | :--- | :--- |
| **API Availability** | 99.9% Uptime | Error Rate > 1% over 5m | PagerDuty / Telegram Alert |
| **P95 Latency** | < 150ms | P95 > 500ms over 5m | Slack `#dev-alerts` |
| **Database Pool Exhaustion**| 0 Saturation | Active Connections > 85% | Slack `#dev-alerts` |
| **Worker Queue Depth** | < 20 pending jobs | Queue Depth > 100 jobs | Telegram Urgent Alert |
| **Publishing Failure Rate** | 0% Failed Publishes | Failed Jobs > 0 | Immediate SMS / Slack |
