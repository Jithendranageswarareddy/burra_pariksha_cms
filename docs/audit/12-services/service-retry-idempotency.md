# Service Retry Behavior & Idempotency Forensic Audit (11 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 21 of 30  

---

## 1. Retry Implementations

**11 domain services** implement explicit retry logic:
- `google-sheets.service.ts`: Implements exponential backoff (retries up to 3 times on HTTP 429 quota exhaustion).
- `gemini.service.ts`: Retries failed model queries once with a 2000ms delay.
- `publishing.service.ts`: Retries platform status check up to 5 times with 5000ms polling intervals.

---

## 2. Idempotency Risks in Mutating Services
- **Missing Idempotency Guards**: Mutating methods like `questionService.createQuestion()` and `videoService.recordTake()` allocate new IDs on every invocation. If a client retries due to a network timeout where the server actually processed the write, duplicate entities are created.
