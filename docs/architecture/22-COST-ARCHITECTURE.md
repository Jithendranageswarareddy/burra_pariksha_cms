# Burra Pariksha CMS
# 22 — Cost Architecture

Stage: 22 — Cost Architecture

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative Cost Architecture for the Burra Pariksha Content Management System (BP-CMS). Formally codifies:
1. **The Inviolable Financial Constraint (`COST-001`, `AP-012`):** Total monthly cloud operational expenditure MUST remain $\le$ ₹100 INR/month ($\approx$ $1.20 USD), with a baseline operating cost target of **₹0.00 INR / month**.
2. **Component-by-Component Free Tier Mapping:** Exhaustive architectural analysis and free-tier allocation across all 10 system domains (Frontend, Backend, Database, Media, Archive, Realtime, Background Jobs, AI Subsystem, Observability, and Analytics).
3. **The Cost Gate Invariant:** *"No component moves from `DESIGN` to `IMPLEMENT` until its expected cost is understood."* Mandates a formal 6-state lifecycle (`DESIGN` $\to$ `COST_ESTIMATED` $\to$ `COST_APPROVED` $\to$ `IMPLEMENTATION_AUTHORIZED` $\to$ `IMPLEMENTED` $\to$ `OPERATIONAL`) with mathematical headroom verification.
4. **Anti-SaaS Architectural Discipline:** Strict prohibition of fee-charging standalone SaaS dependencies (e.g. Redis Cloud, Celery, Pusher, Ably, Datadog, New Relic, standalone SQL instances) in favor of Google Cloud Free Tier native integrations and in-process constructs.
5. **Circuit Breakers & Hard Budget Controls:** Google Cloud Billing alerts at ₹50 (warning) and ₹100 (hard cap) with automatic operational fallback modes.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 22 Cost Architecture | FACT |
| **File Path** | `docs/architecture/22-COST-ARCHITECTURE.md` | FACT |
| **Document Stage** | Stage 22 — Cost Architecture | FACT |
| **Authority** | Authoritative Financial Constraint Specification (COST-001, AP-012) | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 21 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 23+ (Physical Backend Services & Data Access Layer) | FACT |
| **Baseline Repository Commit** | `429b417` | FACT |
| **Financial Ceilings** | Hard maximum ceiling: ₹100.00 INR/month; Baseline Target: ₹0.00 INR/month | FACT |

---

## 02. Component-by-Component Cost Architecture Matrix

| Component | Current State | Target Architecture | Cost (Baseline) | Free Tier Option | Trigger to Upgrade | Cost Impact if Upgraded |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Existing Vite SPA | Static SPA served via Cloud Run / Cloudflare Pages | ₹0.00 | Yes (Cloud Run static files or Cloudflare Pages free tier) | Global CDN edge routing >100,000 visitors/month | +₹0.00 (Cloudflare Pages free) / ₹50/mo |
| **Backend** | Cloud Run Express | Google Cloud Run Containerized Monolith | ₹0.00 | Yes (2M req/mo, 360,000 vCPU-s, 180,000 GiB-s free) | >2,000,000 req/mo or min-instances > 0 | ~₹0.00002400 / vCPU-s |
| **Database** | Google Sheets | Firestore Native Spark Mode (`FIRESTORE_HYBRID`) | ₹0.00 | Yes (50,000 reads/day, 20,000 writes/day, 1 GiB storage) | >50,000 reads/day or >1 GiB storage | ~₹0.005 per 10k reads |
| **Media (Active)** | Google Drive | Google Drive API v3 + Firestore metadata refs | ₹0.00 | Yes (15 GB account storage or Workspace quota) | >15 GB active storage or 10k req/100s quota | ₹130/mo for 100 GB Google One |
| **Archive (Cold)** | Manual backup | External GCS Coldline/Archive or secondary Drive | ₹0.00 | Yes (5 GiB GCS free tier or secondary Drive) | >5 GiB archive in GCS | ₹0.10/GB/month |
| **Realtime** | Polling/None | Server-Sent Events (SSE) + in-process EventBus | ₹0.00 | Yes (100% in-process HTTP streaming, 0 Firestore reads) | Distributed multi-instance scaling >100 concurrent staff | ₹0.00 (In-process) |
| **Jobs (Async)** | In-process/Sync | Cloud Tasks push in prod + in-process local runner | ₹0.00 | Yes (1,000,000 tasks/month free tier) | >1,000,000 tasks/month | ~₹0.03 per 10k tasks |
| **AI Subsystem** | Ad-hoc Gemini | Controlled 7-Step Human-Gated Gemini 2.5 Flash | ₹0.00 | Yes (15 RPM, 1,500 RPD, 1M TPM free tier) | >1,500 RPD or requirement for paid Tier 1 keys | ~₹0.006 per 1k input tokens |
| **Observability** | Console stdout | Google Cloud Logging via stdout single-line JSON | ₹0.00 | Yes (50 GiB/month free ingestion) | >50 GiB/month log volume | ₹4.20 per GiB above 50 GiB |
| **Analytics** | None | On-demand cohort aggregations in Firestore | ₹0.00 | Yes (runs within Firestore Spark free tier) | >50,000 reads/day | Included in Firestore quota |

---

## 03. The Cost Gate Lifecycle State Machine

To enforce financial discipline throughout development, all software components must strictly follow the Cost Gate state machine:

```
[ DESIGN ] 
     │
     ▼ (Compute monthly cost model at 1–5 q/day and 20 q/day)
[ COST_ESTIMATED ]
     │
     ▼ (Verify >50% free-tier headroom & define upgrade triggers)
[ COST_APPROVED ]
     │
     ▼ (Product Owner & Architect Sign-off)
[ IMPLEMENTATION_AUTHORIZED ]
     │
     ▼ (Code authored and verified against test suites)
[ IMPLEMENTED ]
     │
     ▼ (Production deployment under monitoring)
[ OPERATIONAL ]
```

### Invariant:
No component can transition directly from `DESIGN` or `COST_ESTIMATED` to `IMPLEMENTATION_AUTHORIZED` or `IMPLEMENTED`. Attempting to authorize implementation without cost approval is a fatal SDLC violation.

---

## 04. Mathematical Cost Model & Budget Projection

### 4.1 Baseline Scale: 1 to 5 Questions / Day (Normal Operations)
- **Content Throughput:** 30 questions/month $\times$ 7 workflow steps = 210 workflow actions/month.
- **Cloud Run Compute:** ~15,000 vCPU-seconds (<5% of 360,000 vCPU-seconds free quota) = **₹0.00**.
- **Firestore Transactions:** ~30,000 reads/month, ~1,500 writes/month (<2% of 1.5M reads/mo quota) = **₹0.00**.
- **Google Drive Storage:** ~300 MB/month raw videos & assets (<2% of 15 GB free storage) = **₹0.00**.
- **Cloud Tasks Ingestion:** ~1,500 tasks/month (0.15% of 1,000,000 tasks/month free quota) = **₹0.00**.
- **Gemini 2.5 Flash Calls:** ~1,500 requests/month (3.3% of 45,000 requests/month free quota) = **₹0.00**.
- **Google Cloud Logging:** ~75 MB/month (<0.15% of 50 GiB/month free quota) = **₹0.00**.
- **Total Baseline Monthly Cost:** **₹0.00 INR / month**.

### 4.2 Stress Scale: 20 Questions / Day (Peak Scale)
- **Content Throughput:** 600 questions/month $\times$ 7 workflow steps = 4,200 workflow actions/month.
- **Cloud Run Compute:** ~60,000 vCPU-seconds (16.7% of free quota) = **₹0.00**.
- **Firestore Transactions:** ~120,000 reads/month, ~6,000 writes/month (8% of free quota) = **₹0.00**.
- **Google Drive Storage:** ~6 GB raw videos over 10 months (40% of 15 GB free storage) = **₹0.00**.
- **Cloud Tasks Ingestion:** ~6,000 tasks/month (0.6% of free quota) = **₹0.00**.
- **Gemini 2.5 Flash Calls:** ~6,000 requests/month (13.3% of free quota) = **₹0.00**.
- **Google Cloud Logging:** ~300 MB/month (0.6% of free quota) = **₹0.00**.
- **Total Stress Scale Monthly Cost:** **₹0.00 INR / month**.

---

## 05. Anti-SaaS Architectural Invariants

The BP-CMS architecture formally rejects external fee-generating SaaS dependencies:
1. **No External Message Brokers / Task Queues:** Prohibits Redis Cloud, Upstash, Celery, RabbitMQ. Uses native Cloud Tasks push queues and in-process task loops.
2. **No External WebSockets / Realtime Providers:** Prohibits Pusher, Ably, Socket.io cloud. Uses standard HTTP Server-Sent Events (SSE).
3. **No Paid APM / Log Vendors:** Prohibits Datadog, New Relic, Paid Sentry. Uses Google Cloud Logging free tier.
4. **No Managed Relational Database Instances:** Prohibits RDS, Cloud SQL, Neon, Supabase. Uses Firestore Native Spark free tier.

---

## 06. Billing Circuit Breakers & Risk Mitigations

- **Budget Alert 1 (50% Warning):** Google Cloud billing alert triggered at ₹50.00 INR.
- **Budget Alert 2 (100% Hard Cap):** Google Cloud billing alert triggered at ₹100.00 INR.
- **Throttling & Backpressure:**
  - Gemini API rate limiter strictly caps calls at 12 RPM (leaving 20% margin below the 15 RPM free ceiling).
  - Background task worker implements exponential backoff to smooth traffic spikes.
  - Image and video assets exceeding 50 MB are compressed client-side before upload to Google Drive.
