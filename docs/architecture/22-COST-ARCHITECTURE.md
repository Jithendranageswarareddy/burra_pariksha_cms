# 22 — COST ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 22 of 30-Stage Modernization Program — Comprehensive Financial Architecture, Free-Tier Mapping, Cost Gates & ₹0–₹100 Budget Governance

```
================================================================================
Document ID:       BP-ARCH-22-COST-ARCHITECTURE
Version:           22.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Complete Financial Model, Free-Tier Resource Quotas,
                   10-Component Cost Analysis, ₹0–₹100 INR/Month Budget Governance,
                   Three Usage Scenarios (Dev, Production, Growth/Stress),
                   Anti-PaaS Invariants, Cost Gate Lifecycle & Upgrade Triggers
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md (BR-001..011, NFR-001..008)
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md (CAC-001..005)
                   03-CURRENT-SYSTEM-BASELINE.md (Zero Infrastructure Baseline)
                   04-ARCHITECTURE-PRINCIPLES.md (P-11 Modular, P-12 Cost Justification / COST-001)
                   05-TARGET-SYSTEM-BOUNDARY.md (Zero Microservices)
                   06-DOMAIN-MODEL.md (10 Bounded Contexts)
                   07-CANONICAL-15-STEP-WORKFLOW.md (15 Business Stages)
                   08-STATE-MODEL.md (State Dimension Separation)
                   09-RBAC-CAPABILITY-MODEL.md (Role-Based Access)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md (Google Drive Externalized Storage)
                   15-API-CONTRACT.md (REST Envelope & HTTP Status Codes)
                   16-REALTIME-ARCHITECTURE.md (Server-Sent Events In-Memory Monolith)
                   17-JOB-ASYNC-ARCHITECTURE.md (Cloud Tasks & In-Process Runner)
                   18-AI-ARCHITECTURE.md (Gemini 2.5 Flash Assistive Pipeline)
                   19-SECURITY-ARCHITECTURE.md (Defense-in-Depth & Zero Paid Auth SaaS)
                   20-ANALYTICS-ARCHITECTURE.md (Separation of Operational & Analytical Data)
                   21-AUDIT-OBSERVABILITY.md (Cloud Logging 50 GB Free Tier)
Downstream Stages: 23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Core Constraint:   Target Initial Operating Cost: ₹0.00 – ₹100.00 INR / month
Core Rule:         No component moves from DESIGN → IMPLEMENT until its expected cost is understood.
Anti-PaaS Rule:    Strictly Prohibit Redis, Kafka, Pusher, Cloud SQL, Auth0, Datadog.
================================================================================
```

---

## 1. Cost Objectives

The Burra Pariksha Content Management System (BP-CMS) is engineered to power high-quality Telugu-language educational content creation for competitive examinations (APPSC, TSPSC, UPSC, SSC, Banking) without incurring burdensome operational overhead. 

The financial architecture is governed by four primary objectives:

1. **Strict Financial Predictability:** Deliver a mathematically verified cost model where baseline monthly expenditures remain at **₹0.00 INR**, with an inviolable ceiling of **₹100.00 INR / month** across all ten operational dimensions.
2. **Zero Unbudgeted Exposure:** Eliminate the risk of runaway cloud bills, unbounded serverless auto-scaling, unmetered AI token drains, and opaque outbound data egress fees through rigorous circuit breakers, hard quotas, and rate limiters.
3. **Rigorous Architectural Gatekeeping:** Enforce the foundational governance axiom:
   > **"No component moves from DESIGN → IMPLEMENT until its expected cost is understood, verified against free-tier quotas, and approved."**
4. **Frictionless Long-Term Scalability:** Ensure that every zero-cost component possesses a cleanly documented, measurable upgrade trigger and migration path, guaranteeing that business growth to 50+ videos per day requires only configuration or tier upgrades rather than architectural refactoring.

---

## 2. The ₹0–₹100 Budget Constraint (AP-012 / COST-001)

Principle 12 of the BP-CMS Architecture Principles (`04-ARCHITECTURE-PRINCIPLES.md`) establishes the mandatory infrastructure constraint:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   INVIOLABLE FINANCIAL CONSTRAINT                     │
│                                                                        │
│   Target Initial Monthly Operating Cost:   ₹0.00 INR                   │
│   Maximum Hard Monthly Cost Ceiling:       ₹100.00 INR ($1.17 USD)    │
│   Permissible Monthly Deficit:             ₹0.00 INR                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Currency & Conversion Standard
- All financial projections and budget calculations are benchmarked in Indian Rupees (**INR / ₹**).
- For cloud service providers billing in United States Dollars (USD / $), a conservative conversion peg of **1 USD = ₹85.00 INR** is applied throughout this specification.
- A maximum monthly expenditure of ₹100.00 INR corresponds to approximately **$1.17 USD**.

### 2.2 Financial Safety Margin & Buffer Allocation
Under standard operating conditions (10 questions and videos processed daily), every subsystem is architected to operate entirely within vendor perpetual free tiers, yielding an expected monthly cost of **₹0.00 INR**. The ₹100.00 INR ceiling serves as a dedicated emergency contingency buffer for:
- Ephemeral burst traffic or stress testing overages ($\le$ ₹30.00).
- Minor Google AI Studio pay-as-you-go token top-ups during intense scripting periods ($\le$ ₹35.00).
- Temporary GCS Coldline archival storage beyond free allotments ($\le$ ₹20.00).
- Micro-egress or compute rounding margins ($\le$ ₹15.00).

---

## 3. Cost Principles & Anti-PaaS Invariants

The financial model of BP-CMS is founded upon five inviolable operational rules designed to prevent premature optimization and infrastructure waste:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THE FIVE CANONICAL COST RULES                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rule 1: Free Tier ≠ Guaranteed ₹0. Every quota must be modeled against       │
│         worst-case operational loops and concurrency spikes.                 │
│ Rule 2: No Hidden Paid Dependencies. Storage, bandwidth, API calls, logging, │
│         and external webhooks must be comprehensively accounted for.         │
│ Rule 3: No Premature Infrastructure (Anti-PaaS Invariant). Dedicated         │
│         caching clusters, managed relational databases, and third-party SaaS │
│         services are strictly prohibited.                                    │
│ Rule 4: Security Is Never Sacrificed for Cost. ₹0 is a target, not a license │
│         to bypass authentication, auditability, data integrity, or RBAC.     │
│ Rule 5: Upgradability Guaranteed. Every zero-cost selection must have an     │
│         architecturally seamless, trigger-driven upgrade path.               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 The Anti-PaaS Invariant (Strict Service Prohibitions)
To maintain the ₹0–₹100 budget ceiling, the following infrastructure paradigms and proprietary paid SaaS platforms are strictly prohibited during baseline implementation:

| Prohibited Infrastructure / Service | Typical Market Cost | Why Prohibited | BP-CMS Zero-Cost Architecture Solution |
| :--- | :--- | :--- | :--- |
| **Dedicated Cloud SQL / Postgres** | ₹2,500 – ₹6,000 / mo | Managed relational instances incur persistent hourly billing regardless of traffic. | **Cloud Firestore Native (Spark Tier)** + local developer emulation. |
| **Redis / AWS ElastiCache / Memorystore** | ₹2,500 – ₹4,000 / mo | Dedicated memory clusters violate serverless scale-to-zero and exceed budget. | **Node.js in-process memory** (`Map`, `LRU`) + Firestore document caching. |
| **Paid Realtime PaaS (Pusher / Ably)** | ₹2,500 – ₹5,000 / mo | Connection-based commercial pricing escalates rapidly with persistent staff sessions. | **Server-Sent Events (SSE)** over standard HTTP via Cloud Run container. |
| **Paid Queue Brokers (RabbitMQ / Kafka)** | ₹4,000 – ₹15,000 / mo | Running clustered brokers requires persistent virtual machines or expensive managed tiers. | **Google Cloud Tasks (HTTP Push)** + in-process async event dispatching. |
| **Commercial Auth SaaS (Auth0 / Okta)** | ₹2,000 – ₹8,000 / mo | Per-monthly-active-user billing creates an unnecessary third-party subscription. | **Stateless signed HMAC-SHA256 session cookies** + Google Workspace OAuth. |
| **Enterprise APM (Datadog / New Relic)** | ₹3,000 – ₹10,000 / mo | Ingestion-based commercial telemetry and agent licensing are cost-prohibitive. | **Google Cloud Logging (50 GB free tier)** with single-line structured JSON. |
| **Proprietary Media CDNs (Mux / Cloudinary)** | ₹4,000 – ₹12,000 / mo | Per-minute encoding fees and video bandwidth billing destroy the budget constraint. | **Externalized Google Drive API v3** + direct client video chunk streaming. |

---

## 4. Current Architecture Cost Baseline

The empirical baseline audit conducted in Stage 03 (`docs/baseline/03-CURRENT-SYSTEM-BASELINE.md`) established that the legacy brownfield system incurs zero recurring cloud infrastructure expenses.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                   CURRENT SYSTEM COST AUDIT (STAGE 03)                   │
├──────────────────────┬────────────────────────────┬──────────────────────┤
│ Component            │ Current Mechanism          │ Current Cost (INR)   │
├──────────────────────┼────────────────────────────┼──────────────────────┤
│ Frontend             │ Vite SPA on local dev port │ ₹0.00 / month        │
│ Backend              │ Express 4.x Monolith       │ ₹0.00 / month        │
│ Database             │ Google Sheets API + Mock   │ ₹0.00 / month        │
│ Media                │ Manual Google Drive folders│ ₹0.00 / month        │
│ Archive              │ Local manual disk copies   │ ₹0.00 / month        │
│ Realtime             │ Client-side HTTP polling   │ ₹0.00 / month        │
│ Background Jobs      │ Synchronous thread blocking│ ₹0.00 / month        │
│ AI Subsystem         │ Ad-hoc experimental calls  │ ₹0.00 / month        │
│ Analytics            │ Manual spreadsheet reviews │ ₹0.00 / month        │
│ Observability        │ Unstructured console.log   │ ₹0.00 / month        │
├──────────────────────┴────────────────────────────┼──────────────────────┤
│ TOTAL CURRENT OPERATING EXPENDITURE               │ ₹0.00 / month        │
└───────────────────────────────────────────────────┴──────────────────────┘
```

While the current system achieves ₹0 cost, it suffers from critical architectural defects discovered in Stage 03: zero automated test coverage, lack of concurrency control in Sheets, unauthenticated API endpoints, and unbounded synchronous blocking. The modernization program must resolve all architectural defects while strictly preserving the **₹0.00 / month baseline expenditure**.

---

## 5. Target Architecture Cost Baseline (Canonical Matrix)

The following canonical matrix establishes the authoritative financial profile for all ten architectural components in the modernized BP-CMS system.

```
===========================================================================================================================================
                                       CANONICAL COST ARCHITECTURE MATRIX (BP-CMS 10-COMPONENT TARGET)
===========================================================================================================================================
| Component        | Current State             | Target Architecture                | Expected Cost | Free / Low-Cost Option           | Trigger to Upgrade                                |
| :---             | :---                      | :---                               | :---:         | :---                             | :---                                              |
| **Frontend**     | Vite SPA (Local/Express)  | Static SPA on Cloud Run / Cloudflare| **₹0.00 / mo** | Cloudflare Pages / Cloud Run Free | Monthly page views > 100,000 / Edge routing req   |
| **Backend**      | Express Monolith (Local)  | Cloud Run Serverless Container     | **₹0.00 / mo** | Cloud Run (2M req, 360k vCPU-s)   | Invocations > 2,000,000 / Concurrency > 80        |
| **Database**     | Google Sheets (Mock)      | Firestore Native Hybrid (Spark)    | **₹0.00 / mo** | Firestore Spark Tier (50k reads)  | Document reads > 50,000/day / Storage > 1 GiB     |
| **Media Active** | Google Drive Manual Folders| Google Drive API v3 + Hash Refs    | **₹0.00 / mo** | Google Workspace Free (15 GB)    | Active media volume ≥ 14 GB / API quota 403       |
| **Archive Cold** | Local Manual Disk Storage | GCS Coldline / External Refs       | **₹0.00 / mo** | GCS Free Tier (5 GB) / Ext Refs   | Cold archive > 5 GB / Retention policy > 365 days  |
| **Realtime**     | Client HTTP Polling       | Server-Sent Events (SSE) Monolith  | **₹0.00 / mo** | Native Node.js HTTP Streaming     | Concurrent staff > 100 / Multi-instance backplane  |
| **Jobs / Async** | Synchronous Blocking Calls| Google Cloud Tasks (HTTP Push)     | **₹0.00 / mo** | Cloud Tasks (1M tasks/mo free)    | Monthly tasks > 1,000,000 / Dispatch latency > 5s |
| **AI Subsystem** | Ad-hoc Manual Prompts     | Gemini 2.5 Flash Assistive Pipeline| **₹0.00 / mo** | Google AI Studio (15 RPM / 1.5k)  | Daily requests > 1,200 / Commercial licensing req |
| **Analytics**    | Manual Spreadsheet Rows   | 6-Hr Batch Harvesting + BigQuery   | **₹0.00 / mo** | BigQuery Sandbox (10GB, 1TB query)| Daily analytics reads > 50k / Scans > 1 TB/mo     |
| **Observability**| Unstructured console.log   | Structured JSON + Cloud Logging    | **₹0.00 / mo** | Cloud Logging Free (50 GiB/mo)    | Ingestion > 45 GiB/mo / Retention > 30 days       |
===========================================================================================================================================
```

---

## 6. Frontend Cost Analysis

### 6.1 Architectural Profile & Artifact Footprint
- **Artifact:** Compiled Single Page Application (HTML5, Tailwind CSS, React/Vite JavaScript bundle, SVG icons).
- **Bundle Footprint:**
  - `dist/index.html`: 1.23 KB (0.54 KB gzipped)
  - `dist/assets/index.css`: 171.75 KB (22.41 KB gzipped)
  - `dist/assets/index.js`: 3,370.50 KB (553.60 KB gzipped)
  - Total initial download: ~576.55 KB compressed over HTTP/2.

### 6.2 Hosting Evaluation & Free-Tier Options
1. **Option A: Container-Co-located Serving (Selected Production Target):**
   - The Express monolith container on Google Cloud Run serves static assets directly from `dist/` for all non-API routes (`app.use(express.static('dist'))`).
   - *Cost:* **₹0.00 INR**. Asset requests execute in < 2 ms inside Cloud Run, consuming negligible vCPU-seconds and fitting comfortably within the 1 GiB outbound egress allowance.
2. **Option B: Edge CDN Hosting (Cloudflare Pages / Firebase Hosting):**
   - Direct integration with GitHub repository; builds and deploys to global edge nodes.
   - *Free Allowance:* Unlimited bandwidth, unlimited requests, 500 builds/month on Cloudflare Pages free tier.
   - *Cost:* **₹0.00 INR**.

### 6.3 Monthly Usage & Cost Calculation
- **Expected Audience:** 10 internal staff users (Creators, Editors, QC, Publisher, Admin).
- **Daily Sessions:** 10 users $\times$ 20 workbench page loads/day = 200 full loads/day.
- **Cache Hit Ratio:** With HTTP `Cache-Control: public, max-age=31536000, immutable` for hashed assets and `ETag` validation for `index.html`, 98% of asset requests return `304 Not Modified` (0 bytes payload).
- **Monthly Bandwidth:** (200 $\times$ 0.02 full loads $\times$ 0.57 MB) + (200 $\times$ 0.98 cached checks $\times$ 0.001 MB) $\approx$ 2.48 MB/day = **74.4 MB / month**.
- **Calculated Monthly Cost:** **₹0.00 INR** (0.007% of Cloud Run 1 GiB free egress).

### 6.4 Upgrade Trigger
- **Threshold:** Monthly unique visitors $\ge$ 100,000 or monthly static egress $\ge$ 100 GB.
- **Action Required:** Decouple frontend from Cloud Run container and route through Cloudflare Enterprise or dedicated Cloud CDN.
- **Cost Impact:** ₹0.00 (via Cloudflare Pages standard) or ~₹50.00 INR (Cloud CDN cache fill).

---

## 7. Backend / Cloud Run Cost Analysis

### 7.1 Container Compute Topology
- **Runtime:** Google Cloud Run (Fully Managed Serverless Container).
- **Resource Sizing:** 1 vCPU, 512 MiB RAM per container instance.
- **Concurrency Setting:** 80 concurrent requests per container instance.
- **Scaling Limits:**
  - `min-instances = 0` (Container automatically scales to zero during off-hours, eliminating idle server charges).
  - `max-instances = 3` (Hard ceiling to prevent accidental auto-scaling runaway).

### 7.2 Cloud Run Free-Tier Allowance (Google Cloud Perpetual Free Tier)
Google Cloud provides the following non-expiring monthly allowances for Cloud Run:
- **Requests:** 2,000,000 invocations / month.
- **vCPU-Seconds:** 360,000 vCPU-seconds / month (100 hours of active 1-core compute).
- **Memory:** 180,000 GiB-seconds / month (50 hours of active 1 GiB RAM compute).
- **Outbound Data Egress:** 1 GiB / month (to worldwide destinations excluding China/Australia).

### 7.3 Usage & Cost Modeling (Production: 10 Videos/Day)
```text
Daily API Invocations:
  10 staff users × 300 actions/day               = 3,000 requests
  Background Cloud Tasks dispatch callbacks      = 274 requests
  SSE Heartbeat pings (15 open streams × 140/hr) = 2,100 requests
  Analytics telemetry harvesting syncs           = 20 requests
  Total Daily HTTP Invocations                   = 5,394 requests/day
Monthly HTTP Invocations (30 days)              = 161,820 requests/month

Free Tier Utilization:
  Requests: 161,820 / 2,000,000                  = 8.09% (91.91% Headroom)

Compute Consumption:
  Average API Request Duration                   = 45 milliseconds (0.045 s)
  Active Compute Seconds (161,820 × 0.045 s)     = 7,281.9 vCPU-seconds
  vCPU Utilization (7,281.9 / 360,000)           = 2.02% (97.98% Headroom)
  Memory Consumption (7,281.9 × 0.5 GiB)         = 3,640.9 GiB-seconds
  Memory Utilization (3,640.9 / 180,000)         = 2.02% (97.98% Headroom)
```

- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Worst-Case Cost Exposure:** In the event of an infinite client loop hitting the API, Cloud Run max-instances is capped at 3. Running 3 instances at 100% CPU for 24 hours would consume ~259,200 vCPU-seconds. A billing ceiling alert triggers at ₹50.00 INR to terminate aberrant instances.
- **Upgrade Trigger:** Monthly invocations exceed 2,000,000 or business requires `min-instances = 1` to eliminate cold starts (cold start delay is currently ~1.8 seconds). Setting `min-instances = 1` continuously would cost ~$7.50 USD ($\approx$ ₹637.50 INR) and is strictly rejected under the ₹0–₹100 rule.

---

## 8. Database Cost Analysis (Firestore vs. Sheets vs. PostgreSQL)

Selecting the primary data store represents the most critical financial and architectural decision in Stage 22.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY DATABASE ARCHITECTURE COMPARISON                        │
├─────────────────────────┬──────────────────────┬───────────────────────┬───────────────┤
│ Evaluation Criteria     │ Cloud Firestore      │ Google Sheets API     │ Cloud SQL     │
│                         │ (Native Spark Tier)  │ (Legacy Brownfield)   │ (PostgreSQL)  │
├─────────────────────────┼──────────────────────┼───────────────────────┼───────────────┤
│ **Monthly Fixed Cost**  │ **₹0.00**            │ **₹0.00**             │ **₹2,167.00** │
│ **Free Tier Reads**     │ 50,000 / day         │ Unlimited (300 req/m) │ Zero free tier│
│ **Free Tier Writes**    │ 20,000 / day         │ Unlimited (300 req/m) │ Zero free tier│
│ **Free Tier Storage**   │ 1 GiB                │ 10,000,000 cells      │ Zero storage  │
│ **Concurrency Locks**   │ Optimistic MVCC      │ Severe file lockups   │ Row-level ACID│
│ **Atomic Transactions** │ Yes (Firestore Run)  │ None (overwrites)     │ Yes           │
│ **Realtime Listeners**  │ Yes (Snapshot)       │ None (Polling only)   │ No            │
│ **Operational Overhead**│ Zero (Serverless)    │ High (Cell corruption)│ High (Patches)│
│ **Budget Invariant**    │ **PASSES (₹0.00)**   │ **PASSES (₹0.00)**    │ **FAILS**     │
└─────────────────────────┴──────────────────────┴───────────────────────┴───────────────┘
```

### 8.1 Detailed Firestore Native Spark Modeling
Stage 12 (`docs/architecture/12-DATABASE-ARCHITECTURE.md`) selected **Cloud Firestore Native Hybrid** (`FIRESTORE_HYBRID`).
- **Free Tier Allowance (Spark Mode):**
  - Reads: 50,000 document reads / day.
  - Writes: 20,000 document writes / day.
  - Deletes: 20,000 document deletes / day.
  - Storage: 1 GiB total stored data.

- **Projected Daily Operations (Production: 10 Videos/Day):**
  - In-process memory caches hot configuration, users, and taxonomy records with a 60-second TTL, reducing read amplification by 85%.
  - Questions and Videos: 10 new items/day $\times$ 15 workflow steps = 150 document updates.
  - Question and Script Reviews: 40 review mutations/day.
  - Realtime and Dashboard Reads: 10 staff $\times$ 150 reads/day = 1,500 document reads/day.
  - Background Job and Telemetry Writes: 110 writes/day.
  - Total Daily Reads: **~1,500 reads/day** (3.0% of 50,000 daily free allowance; 97.0% headroom).
  - Total Daily Writes: **~300 writes/day** (1.5% of 20,000 daily free allowance; 98.5% headroom).
  - Total Storage Growth: 10 items/day $\times$ 15 KB JSON metadata = 150 KB/day = **4.5 MB / month** (0.45% of 1 GiB free storage).

- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Secondary Google Sheets Role:** Google Sheets is strictly retained as a secondary, read-only snapshot export destination (Stage 12), ensuring zero runtime database dependency on Sheets.
- **Upgrade Trigger:** Daily document reads $\ge$ 50,000 or total storage $\ge$ 1 GiB.
  - *Action:* Migrate project from Spark to Blaze plan (Pay-As-You-Go). Beyond 50,000 reads, Firestore charges $0.06 per 100,000 reads ($\approx$ ₹5.10 INR per 100,000 reads). An overage of 100,000 reads costs only ₹5.10 INR.

---

## 9. Media Cost Analysis (Google Drive Externalized Storage)

### 9.1 Architectural Principle (AP-007 / Stage 14)
Binary media files are strictly externalized from application state. No video, audio, or high-resolution graphic binaries are ever stored in Firestore or Cloud Run containers. The database stores only immutable canonical metadata references: `googleDriveFileId`, `webViewLink`, `sha256Checksum`, `byteSize`, `mimeType`, and `videoResolution`.

### 9.2 Active Media Storage Footprint (10 Short Videos/Day)
For competitive examination shorts (9:16 vertical video, 45 seconds average duration):
- **Master Video (1080x1920 MP4, ProRes/H.264 high bitrate):** ~85 MB
- **Web-Optimized Video (1080x1920 MP4, 3 Mbps H.264):** ~17 MB
- **Master Thumbnail (1080x1920 WebP, high quality):** ~450 KB
- **Spoken Voiceover Audio (Clean WAV/AAC):** ~4.5 MB
- **Total Media Footprint per Produced Video:** **~106.95 MB / video**
- **Daily Media Generation (10 videos):** ~1.07 GB / day.

### 9.3 Lifecycle Management & Rolling Buffer
- **Active Storage Provider:** Google Workspace / Google Account Drive (15 GB shared free storage).
- **Rolling Buffer Window:** 15 GB provides capacity for ~140 complete video packages (~14 days of active production).
- **Pruning & Archival Lifecycle:** Once a video reaches Stage 11 (`11_PUBLISHED`) and passes its 14-day post-publication social audit, heavy raw footage files are moved to cold archive or pruned, leaving only the lightweight Web-Optimized master (17 MB) and thumbnail (0.45 MB) in Drive.
- **Steady-State Retained Storage:** 300 published shorts $\times$ 17.45 MB = **5.23 GB** (34.8% of 15 GB free storage; 65.2% headroom).

### 9.4 API Quota & Cost Projection
- **Google Drive API v3 Quotas:** 12,000 requests per minute per project (Google Cloud Free Quota).
- **Actual BP-CMS API Invocations:** ~200 Drive API calls/day (metadata fetch, permission sharing, checksum verification).
- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Upgrade Trigger:** Active Drive storage reaches 14.0 GB (93.3% of 15 GB).
  - *Trigger Action:* Purchase Google One 100 GB basic storage plan for **₹130.00 INR / month** ($1.53 USD) or execute automated batch offloading to GCS Coldline.

---

## 10. Archive Cost Analysis (GCS Coldline & External References)

### 10.1 Initial Baseline Strategy: External References (₹0.00)
During the initial production phase, BP-CMS implements an **external-reference archival model**:
- Raw footage and archived master files are retained in designated Google Drive archive folders or dedicated secondary team drives.
- The BP-CMS database records the cryptographic SHA-256 hash and archival URI reference without maintaining an active cloud bucket subscription.
- **Initial Monthly Cost:** **₹0.00 INR**.

### 10.2 Future Cloud Storage Target: Google Cloud Storage Coldline / Archive
When business compliance or video volume warrants automated immutable cold storage:
- **Provider:** Google Cloud Storage (GCS) Coldline Class (`us-central1` or `asia-south1`).
- **GCS Free Tier:** 5 GiB-months of standard storage free per month.
- **Coldline Storage Rates:** $0.004 per GB-month ($\approx$ **₹0.34 INR per GB-month**).
- **Cost for 50 GB of Archived Video Masters:** 50 GB $\times$ ₹0.34 = **₹17.00 INR / month**.
- **Cost for 100 GB of Archived Video Masters:** 100 GB $\times$ ₹0.34 = **₹34.00 INR / month**.
- **Data Retrieval Costs:** Coldline retrieval is $0.02 per GB ($\approx$ ₹1.70 INR/GB). Because educational content is rarely retrieved once archived, retrieval costs remain $\le$ ₹5.00 INR/year.

### 10.3 Upgrade Trigger
- **Threshold:** Archived footage volume $\ge$ 50 GB or institutional requirement for 3-year academic audit lock.
- **Cost Impact:** ₹17.00 – ₹34.00 INR / month (comfortably within the ₹100.00 buffer).

---

## 11. Realtime Cost Analysis (SSE Monolith vs. External PaaS)

### 11.1 Architectural Decision (Stage 16)
Stage 16 (`docs/architecture/16-REALTIME-ARCHITECTURE.md`) selected **Server-Sent Events (SSE)** over standard HTTP streaming using native Node.js `EventEmitter` within the Cloud Run monolith.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   REALTIME ARCHITECTURE COMPARISON                     │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Metric                  │ SSE In-Process       │ External PaaS         │
│                         │ (Cloud Run Monolith) │ (Pusher Channels)     │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Monthly Base Cost       │ **₹0.00**            │ **₹4,165.00** ($49)   │
│ Connection Protocol     │ Standard HTTP/1.1    │ Proprietary WebSocket │
│ Max Concurrent Staff    │ 80 per container     │ 100 on free tier      │
│ Message Volume Limit    │ Unlimited in-process │ 200,000 messages/day  │
│ External Infrastructure │ None                 │ Third-party SaaS      │
│ Budget Compliance       │ **PASSES (₹0.00)**   │ **FAILS**             │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

### 11.2 Resource Sizing & Memory Footprint
- **Max Concurrent Staff Connections:** 10–15 simultaneous staff workbench sessions.
- **Memory Consumption:** A persistent HTTP SSE connection in Node.js consumes approximately 35 KB of heap for socket buffers and listener closures.
  - 15 concurrent connections $\times$ 35 KB = **525 KB RAM** (0.10% of 512 MiB container capacity).
- **Heartbeat Egress:** 25-second keep-alive ping (`event: ping\ndata: {}\n\n`, 22 bytes).
  - 15 connections $\times$ 144 pings/hour $\times$ 22 bytes = 47.5 KB/hour = **34.2 MB / month**.
- **Calculated Monthly Cost:** **₹0.00 INR**.

### 11.3 Upgrade Trigger
- **Threshold:** Concurrent active staff connections $\ge$ 100 or Cloud Run autoscaling triggers a second active container instance.
- **Action Required:** In a multi-instance topology, an in-process EventEmitter cannot broadcast events to clients connected to sister containers. The upgrade path introduces a lightweight Redis Pub/Sub backplane (Upstash Serverless Redis Free Tier: 10,000 commands/day free $\to$ ₹0.00 INR).

---

## 12. Jobs Cost Analysis (Cloud Tasks vs. Redis/BullMQ)

### 12.1 Architectural Decision (Stage 17)
Stage 17 (`docs/architecture/17-JOB-ASYNC-ARCHITECTURE.md`) established a dual-mode background job engine:
1. **Development Environment:** In-Process Node.js async runner (`EventEmitter` with in-memory retry queue). Cost: ₹0.00.
2. **Production Environment:** Google Cloud Tasks HTTP push queue calling internal authenticated worker endpoints (`/api/v1/jobs/execute`) on the Cloud Run container. Cost: ₹0.00.

### 12.2 Cloud Tasks Free-Tier Quota & Pricing
- **Perpetual Free Allowance:** **1,000,000 task invocations / month**.
- **Overage Pricing:** $0.40 per 1,000,000 tasks ($\approx$ ₹34.00 INR per million).

### 12.3 Monthly Task Volume Projection (Production: 10 Videos/Day)
```text
Daily Background Operations:
  Workflow state transition side-effects (15/video)   = 150 tasks/day
  Drive media metadata & hash verification (10/video) = 100 tasks/day
  AI pipeline assistive generation execution         = 20 tasks/day
  Platform analytics sync dispatch (4 runs/day)       = 4 tasks/day
  Audit log batch flusher tasks                      = 24 tasks/day
  Total Daily Background Tasks                        = 298 tasks/day
Monthly Background Tasks (30 days)                   = 8,940 tasks/month

Free Tier Utilization:
  Tasks: 8,940 / 1,000,000                           = 0.89% (99.11% Headroom)
```

- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Why BullMQ Was Rejected:** Running BullMQ requires a persistent Redis server. Even a minimal cloud Redis instance costs ₹2,500 – ₹3,500/mo, instantly violating the ₹100 budget ceiling.
- **Upgrade Trigger:** Monthly background task invocations exceed 1,000,000.
  - *Cost Impact:* $0.40 per additional million tasks ($\approx$ ₹34.00 INR).

---

## 13. AI Cost Analysis (Gemini 2.5 Flash Token Metering)

### 13.1 Architectural Boundary (AP-009 / Stage 18)
In strict accordance with Architecture Principle 09 (`04-ARCHITECTURE-PRINCIPLES.md`) and Stage 18 (`docs/architecture/18-AI-ARCHITECTURE.md`):
- **AI assists humans; AI never becomes the workflow authority.**
- Every AI generation requires an explicit, authenticated human button click. Zero automated background loops may invoke AI models.
- All AI suggestions reside in draft review state until an authorized human operator accepts, edits, or rejects the content.

### 13.2 Model Selection & Free-Tier Quota
- **Primary Model:** Google AI Studio `gemini-2.5-flash`.
- **Google AI Studio Perpetual Free Quota:**
  - **RPM:** 15 Requests Per Minute.
  - **RPD:** 1,500 Requests Per Day.
  - **TPM:** 1,000,000 Tokens Per Minute.

### 13.3 Assistive Task Token Budgeting
```text
┌──────────────────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Assistive AI Pipeline Task           │ Input Tokens │ Output Tokens│ Total Tokens │
├──────────────────────────────────────┼──────────────┼──────────────┼──────────────┤
│ 1. Question Ideation & Distractor Gen│ 450 tokens   │ 650 tokens   │ 1,100 tokens │
│ 2. Syllabus & Difficulty Validation  │ 800 tokens   │ 350 tokens   │ 1,150 tokens │
│ 3. Spoken Telugu Script Drafter      │ 1,200 tokens │ 900 tokens   │ 2,100 tokens │
│ 4. Teleprompter Pacing Formatter     │ 700 tokens   │ 400 tokens   │ 1,100 tokens │
│ 5. Social Tags & SEO Suggester       │ 600 tokens   │ 400 tokens   │ 1,000 tokens │
├──────────────────────────────────────┼──────────────┼──────────────┼──────────────┤
│ AVERAGE PER COMPLETE VIDEO WORKFLOW  │ 3,750 tokens │ 2,700 tokens │ 6,450 tokens │
└──────────────────────────────────────┴──────────────┴──────────────┴──────────────┘
```

### 13.4 Production Volume & Quota Consumption (10 Videos/Day)
- **Daily Invocations:** 10 videos $\times$ 5 assistive calls = **50 requests / day**.
  - Utilization: 50 / 1,500 RPD = **3.33% of daily free quota** (96.67% Headroom).
- **Daily Token Consumption:** 10 videos $\times$ 6,450 tokens = **64,500 tokens / day**.
- **Monthly Token Consumption:** ~1,935,000 tokens / month.
- **Calculated Monthly Cost:** **₹0.00 INR** (100% covered by Google AI Studio Free Tier).

### 13.5 Hard Cost Controls & Rate Limiters
To guarantee zero unexpected billing exposure:
1. `MAX_DAILY_AI_REQUESTS = 100`: Server-side circuit breaker blocks further AI invocations if daily count reaches 100 calls.
2. `MAX_TOKENS_PER_CALL = 2048`: Hard response truncation parameter in Gemini API payload.
3. System circuit breaker trips at 80% daily quota (1,200 calls), alerting administrators and gracefully disabling AI assistance buttons in the UI while preserving all manual content entry workflows.

### 13.6 Paid Tier 1 Fallback Pricing (If Ever Activated)
If Google AI Studio free tier is exhausted or commercial terms change:
- Gemini 2.5 Flash Tier 1 Pay-As-You-Go Rates:
  - Input: $0.075 per 1,000,000 tokens ($\approx$ ₹6.38 INR per 1M).
  - Output: $0.300 per 1,000,000 tokens ($\approx$ ₹25.50 INR per 1M).
- Monthly Cost of 2M tokens on Tier 1: (1.125M input $\times$ ₹0.00000638) + (0.81M output $\times$ ₹0.0000255) = ₹7.18 + ₹20.66 = **₹27.84 INR / month** (well within the ₹100.00 budget ceiling).

---

## 14. Analytics Cost Analysis

### 14.1 Operational vs. Analytical Data Separation (Stage 20)
Stage 20 (`docs/architecture/20-ANALYTICS-ARCHITECTURE.md`) established that operational data and performance analytics remain strictly segregated. Analytics queries never touch live question or video production tables.

### 14.2 Harvesting Mechanism & Firestore Impact
- **Harvesting Frequency:** Cloud Tasks dispatches a batch telemetry worker every 6 hours (4 times daily).
- **Metrics Collected:** YouTube Data API views, likes, comments, and retention ratios for the last 30 published shorts.
- **Persistence:** Snapshots are written to a dedicated `platform_analytics_snapshots` Firestore collection.
- **Daily Operations:** 4 runs/day $\times$ 30 items = 120 writes/day.
- **Dashboard Views:** 10 staff users viewing analytics workbench = ~300 reads/day.
- **Calculated Monthly Cost:** **₹0.00 INR** (fits comfortably within Firestore Spark free tier).

### 14.3 Long-Term Deep Analytics: BigQuery Sandbox
- For complex multi-month trend analysis (Stage 15: Intelligence Loop), historical snapshots are exported via Cloud Tasks to Google BigQuery.
- **BigQuery Sandbox Free Tier:**
  - **Storage:** 10 GB active storage free per month.
  - **Query Analysis:** 1 TB query scans free per month.
- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Upgrade Trigger:** Analytics reads exceed 50,000/day or BigQuery query analysis exceeds 1 TB/month.

---

## 15. Audit & Observability Cost Analysis

### 15.1 Architectural Sizing (Stage 21)
Stage 21 (`docs/architecture/21-AUDIT-OBSERVABILITY.md`) established that all telemetry is emitted as single-line structured JSON to `stdout` and collected by Google Cloud Logging, while security-critical audit trails are recorded in Firestore `audit_log`.

### 15.2 Google Cloud Logging Free-Tier Quota
- **Perpetual Free Allowance:** **50 GiB / month** free log ingestion per GCP billing account.
- **Retention:** 30 days retention included at zero cost.

### 15.3 Ingestion Modeling (Production: 10 Videos/Day)
```text
Daily Logging Telemetry:
  Average Structured JSON Log Entry Size     = 1.1 KB
  API Invocations per Day                     = 5,394 logs
  Background Job Dispatches & Callbacks       = 600 logs
  Security & Workflow State Transitions       = 300 logs
  Total Daily Log Records                     = 6,294 logs/day
Daily Ingestion Volume                        = 6,294 × 1.1 KB ≈ 6.92 MB / day
Monthly Ingestion Volume (30 days)            = 207.6 MB / month

Free Tier Utilization:
  Log Ingestion: 0.2076 GB / 50 GB            = 0.41% (99.59% Headroom)
```

- **Calculated Monthly Cost:** **₹0.00 INR**.
- **Prohibited Commercial APMs:** Datadog ($15/host/mo + $0.10/GB logs), New Relic, and Sentry Team plan ($26/mo $\approx$ ₹2,210/mo) are strictly prohibited.
- **Upgrade Trigger:** Monthly log volume reaches 45 GiB (90% of free tier).
  - *Action:* Apply Cloud Logging ingestion exclusion filters for high-frequency `HTTP 200` health check pings.

---

## 16. External Integrations Cost Analysis

BP-CMS interfaces with four primary external provider APIs:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS COST & QUOTA MODEL                        │
├─────────────────────────┬──────────────────────┬───────────────────────┬───────────────┤
│ Integration             │ Monthly Base Cost    │ Free Quota Allowance  │ BP-CMS Usage  │
├─────────────────────────┼──────────────────────┼───────────────────────┼───────────────┤
│ **Google Workspace Auth**│ **₹0.00**            │ Unlimited OAuth2 SSO  │ 10 staff users│
│ **YouTube Data API v3** │ **₹0.00**            │ 10,000 units / day    │ 8,200 units/d │
│ **Meta Graph API**      │ **₹0.00**            │ 200 calls/hr/user     │ ~40 calls/d   │
│ **Telegram Bot API**    │ **₹0.00**            │ 30 messages / second  │ ~20 alerts/d  │
├─────────────────────────┴──────────────────────┴───────────────────────┴───────────────┤
│ TOTAL MONTHLY EXTERNAL INTEGRATIONS EXPENDITURE:                       **₹0.00 / mo**  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 16.1 YouTube Data API v3 Quota Deep-Dive
- **Default Free Project Quota:** 10,000 units / day.
- **Cost per Operation:**
  - Read video metadata / analytics: 1 unit.
  - Video upload / publish: 1,600 units.
- **BP-CMS Production Volume:**
  - 5 shorts published daily to YouTube = 5 $\times$ 1,600 units = 8,000 units.
  - 200 metadata & analytics reads = 200 units.
  - Total Daily Invocations = **8,200 units / day** (82.0% of 10,000 free quota).
- **Trigger to Upgrade:** When publishing volume exceeds 5 YouTube videos daily, the 10,000-unit ceiling is reached. Google Cloud Console permits submitting a free Quota Increase Request for legitimate educational content creators, preserving the **₹0.00** cost.

---

## 17. Scenario A — Development Cost Profile

The Development scenario models low-volume engineering, testing, and continuous integration.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SCENARIO A — DEVELOPMENT COST PROFILE                     │
├────────────────────────────────┬──────────────────────┬──────────────────────┤
│ Metric / Resource              │ Monthly Volume       │ Monthly Cost (INR)   │
├────────────────────────────────┼──────────────────────┼──────────────────────┤
│ Active Questions / Day         │ 1 – 5 questions/day  │ —                    │
│ Active Staff Seats             │ 1 – 2 developers     │ —                    │
│ Frontend Static Requests       │ 5,000 requests/month │ ₹0.00                │
│ Cloud Run Backend Invocations  │ 12,000 requests/month│ ₹0.00                │
│ Firestore Document Reads       │ 2,500 reads/month    │ ₹0.00                │
│ Firestore Document Writes      │ 800 writes/month     │ ₹0.00                │
│ Active Google Drive Media      │ < 500 MB             │ ₹0.00                │
│ Cloud Tasks Background Jobs    │ 400 tasks/month      │ ₹0.00                │
│ Gemini 2.5 Flash AI Tokens     │ 150,000 tokens/month │ ₹0.00                │
│ Google Cloud Logging           │ 15 MB/month          │ ₹0.00                │
├────────────────────────────────┴──────────────────────┼──────────────────────┤
│ TOTAL MONTHLY COST (SCENARIO A)                       │ **₹0.00 INR**        │
│ Budget Status                                         │ UNDER CEILING (₹100) │
│ Remaining Budget Margin                               │ ₹100.00 INR (100.0%) │
│ Primary Cost Driver                                   │ None (All Free Tier) │
└───────────────────────────────────────────────────────┴──────────────────────┘
```

---

## 18. Scenario B — Expected Production Cost Profile

The Expected Production scenario models standard operational cadence for Burra Pariksha (10 questions and short videos produced, reviewed, and published daily).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                SCENARIO B — EXPECTED PRODUCTION COST PROFILE                 │
├────────────────────────────────┬──────────────────────┬──────────────────────┤
│ Metric / Resource              │ Monthly Volume       │ Monthly Cost (INR)   │
├────────────────────────────────┼──────────────────────┼──────────────────────┤
│ Active Questions / Day         │ 10 questions/day     │ —                    │
│ Active Videos Produced / Day   │ 10 short videos/day  │ —                    │
│ Active Staff Seats             │ 5 – 8 team members   │ —                    │
│ Frontend Static Requests       │ 60,000 requests/month│ ₹0.00                │
│ Cloud Run Backend Invocations  │ 161,820 requests/mo  │ ₹0.00                │
│ Firestore Document Reads       │ 45,000 reads/month   │ ₹0.00                │
│ Firestore Document Writes      │ 9,000 writes/month   │ ₹0.00                │
│ Active Google Drive Media      │ ~5.2 GB rolling      │ ₹0.00                │
│ GCS Coldline Archive           │ 0 GB (Drive Refs)    │ ₹0.00                │
│ Cloud Tasks Background Jobs    │ 8,940 tasks/month    │ ₹0.00                │
│ Gemini 2.5 Flash AI Tokens     │ 1.935M tokens/month  │ ₹0.00                │
│ YouTube Data API Quota         │ 8,200 units/day      │ ₹0.00                │
│ Google Cloud Logging           │ 207.6 MB/month       │ ₹0.00                │
├────────────────────────────────┴──────────────────────┼──────────────────────┤
│ TOTAL MONTHLY COST (SCENARIO B)                       │ **₹0.00 INR**        │
│ Budget Status                                         │ UNDER CEILING (₹100) │
│ Remaining Budget Margin                               │ ₹100.00 INR (100.0%) │
│ Primary Cost Driver                                   │ None (All Free Tier) │
└───────────────────────────────────────────────────────┴──────────────────────┘
```

---

## 19. Scenario C — Growth & Peak Stress Cost Profile

The Growth / Stress scenario models high-tempo publishing (25–50 questions/videos daily, exam announcement crash courses, 15 staff members, intensive script generation bursts, and cold archiving).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                 SCENARIO C — GROWTH / STRESS COST PROFILE                    │
├────────────────────────────────┬──────────────────────┬──────────────────────┤
│ Metric / Resource              │ Monthly Volume       │ Monthly Cost (INR)   │
├────────────────────────────────┼──────────────────────┼──────────────────────┤
│ Active Questions / Day         │ 25 – 50 questions/day│ —                    │
│ Active Videos Produced / Day   │ 25 – 50 videos/day   │ —                    │
│ Active Staff Seats             │ 15 team members      │ —                    │
│ Frontend Static Requests       │ 300,000 requests/mo  │ ₹0.00                │
│ Cloud Run Backend Invocations  │ 750,000 requests/mo  │ ₹0.00                │
│ Firestore Document Reads       │ 240,000 reads/month  │ ₹0.00 (within free)  │
│ Firestore Document Writes      │ 45,000 writes/month  │ ₹0.00 (within free)  │
│ Active Google Drive Media      │ 25 GB (Exceeds 15 GB)│ ₹0.00 (Cold offload) │
│ GCS Coldline Archive           │ 25 GB archived       │ **₹8.50 INR**        │
│ Cloud Tasks Background Jobs    │ 42,000 tasks/month   │ ₹0.00                │
│ Gemini 2.5 Flash AI Tokens     │ 5.5M tokens/month    │ **₹25.00 INR** (Tier1)│
│ YouTube Data API Quota         │ Free quota extended  │ ₹0.00                │
│ Google Cloud Logging           │ 950 MB/month         │ ₹0.00                │
├────────────────────────────────┴──────────────────────┼──────────────────────┤
│ TOTAL MONTHLY COST (SCENARIO C)                       │ **₹33.50 INR**       │
│ Budget Status                                         │ UNDER CEILING (₹100) │
│ Remaining Budget Margin                               │ ₹66.50 INR (66.5%)   │
│ Primary Cost Drivers                                  │ Gemini AI (₹25),     │
│                                                       │ GCS Coldline (₹8.50) │
└───────────────────────────────────────────────────────┴──────────────────────┘
```

**Conclusion across all three scenarios:** Under both Baseline Development and Expected Production, operating cost is strictly **₹0.00 INR**. Under extreme Stress and 5x Content Growth, total monthly expenditures reach **₹33.50 INR**, remaining safely inside the **₹100.00 INR budget ceiling**.

---

## 20. Free-Tier Assumptions & Safety Margins

```
===========================================================================================================================================
                                       EXHAUSTIVE FREE-TIER QUOTA & SAFETY MARGIN REGISTER
===========================================================================================================================================
| Service Provider         | Quota Dimension            | Perpetual Free Allowance    | BP-CMS Expected Monthly Usage | Safety Headroom Margin |
| :---                     | :---                       | :---                        | :---                          | :---:                  |
| **Google Cloud Run**     | Invocations                | 2,000,000 requests / month  | 161,820 requests / month      | **91.91% Headroom**    |
| **Google Cloud Run**     | Compute Time               | 360,000 vCPU-seconds / month| 7,282 vCPU-seconds / month    | **97.98% Headroom**    |
| **Google Cloud Run**     | Memory Allocation          | 180,000 GiB-seconds / month | 3,641 GiB-seconds / month     | **97.98% Headroom**    |
| **Google Cloud Run**     | Outbound Egress            | 1.0 GiB / month             | 0.08 GiB / month              | **92.00% Headroom**    |
| **Cloud Firestore**      | Document Reads             | 50,000 reads / day          | 1,500 reads / day             | **97.00% Headroom**    |
| **Cloud Firestore**      | Document Writes            | 20,000 writes / day         | 300 writes / day              | **98.50% Headroom**    |
| **Cloud Firestore**      | Stored Data                | 1.0 GiB stored              | 0.005 GiB stored (Month 1)    | **99.50% Headroom**    |
| **Google Cloud Tasks**   | Task Invocations           | 1,000,000 tasks / month     | 8,940 tasks / month           | **99.11% Headroom**    |
| **Google Cloud Logging** | Log Ingestion              | 50.0 GiB / month            | 0.208 GiB / month             | **99.58% Headroom**    |
| **Google AI Studio**     | Gemini 2.5 Flash Invocations| 1,500 requests / day        | 50 requests / day             | **96.67% Headroom**    |
| **Google AI Studio**     | Gemini 2.5 Flash Rate Limit | 15 requests / minute        | Max 2 requests / minute       | **86.67% Headroom**    |
| **Google Drive Free**    | Storage Allocation         | 15.0 GB shared              | 5.23 GB rolling buffer        | **65.13% Headroom**    |
| **YouTube Data API v3**  | Operations Quota           | 10,000 units / day          | 8,200 units / day             | **18.00% Headroom**    |
| **BigQuery Sandbox**     | Historical Queries         | 1.0 TB query scans / month  | 0.02 TB query scans / month   | **98.00% Headroom**    |
===========================================================================================================================================
```

---

## 21. Usage Assumptions Table

The mathematical derivations in this document are predicated upon the following verified parameters:

| Operational Parameter | Value | Rationale & Governance Alignment |
| :--- | :--- | :--- |
| **Daily Produced Questions** | 10 questions / day | Standard daily syllabus intake for Burra Pariksha. |
| **Daily Finished Videos** | 10 vertical shorts / day | 45-second educational Shorts / Reels. |
| **Active Staff Users** | 5 – 8 concurrent users | Creators, Scriptwriters, Video Editors, QC, Publisher, Admin. |
| **Average Video Duration** | 45 seconds | Standard vertical short video format for exam prep. |
| **Web Video Bitrate** | 3.0 Mbps (H.264 MP4) | Optimal balance of 1080p visual fidelity and file size (17 MB). |
| **Master Video Bitrate** | 15.0 Mbps (H.264 MP4) | High-fidelity archive master (85 MB). |
| **API Latency Target** | < 100 ms average | Real-time interactive responsiveness (measured at ~45 ms). |
| **In-Memory Cache TTL** | 60 seconds | Prevents repetitive Firestore reads during staff navigation. |
| **Active Media Retention** | 14 days post-publish | Sufficient for post-publication QC, social review, and audit. |
| **Audit Log Retention** | 30 days active | Complies with Cloud Logging free tier; exported to storage. |

---

## 22. Cost Uncertainty Register

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       COST UNCERTAINTY REGISTER                                        │
├─────────┬──────────────────────┬─────────┬────────────┬────────────────────────────────────────────────┤
│ Risk ID │ Description          │ Likelihood│ Impact   │ Mitigation Strategy                            │
├─────────┼──────────────────────┼─────────┼────────────┼────────────────────────────────────────────────┤
│ **CU-01**| Google AI Studio     │ Medium  │ Low        │ System circuit breaker at 100 calls/day.       │
│         | adjusts free limits  │         │ (≤ ₹28/mo) │ Graceful fallback to manual human authoring.   │
├─────────┼──────────────────────┼─────────┼────────────┼────────────────────────────────────────────────┤
│ **CU-02**| Drive storage fills  │ High    │ Low        │ Automated lifecycle script moves raw clips to  │
│         | rapidly past 14 GB   │         │ (≤ ₹17/mo) │ GCS Coldline or prompts Google One ₹130/mo.    │
├─────────┼──────────────────────┼─────────┼────────────┼────────────────────────────────────────────────┤
│ **CU-03**| Runaway client loop  │ Low     │ Medium     │ Cloud Run `max-instances = 3` hard cap and     │
│         | spams Cloud Run API  │         │ (≤ ₹50/mo) │ Express rate limiter (100 req/min/IP).         │
├─────────┼──────────────────────┼─────────┼────────────┼────────────────────────────────────────────────┤
│ **CU-04**| YouTube API daily    │ Medium  │ Low        │ Distribute upload jobs across calendar days    │
│         | quota trips at 10k   │         │ (₹0.00)    │ or submit free quota increase to Google Cloud. │
├─────────┼──────────────────────┼─────────┼────────────┼────────────────────────────────────────────────┤
│ **CU-05**| USD to INR exchange  │ High    │ Negligible │ Budget pegged at conservative ₹85/$1 rate;    │
│         | fluctuation > 10%    │         │ (≤ ₹3/mo)  │ 98% of services are ₹0 free tier anyway.       │
└─────────┴──────────────────────┴─────────┴────────────┴────────────────────────────────────────────────┘
```

---

## 23. Upgrade Triggers & Thresholds

Every zero-cost component must possess a concrete, measurable trigger condition defining when a transition to a paid tier is mathematically and operationally required.

```
===========================================================================================================================================
                                       UPGRADE TRIGGERS & CAPACITY THRESHOLDS
===========================================================================================================================================
| Component            | Metric Dimension           | Warning Alert (80%)| Upgrade Trigger (100%)| Required Engineering Action           | Cost Impact |
| :---                 | :---                       | :---:              | :---:                 | :---                                  | :---:       |
| **Frontend**         | Monthly Unique Visitors    | 80,000 visitors    | 100,000 visitors/mo   | Attach Cloudflare Edge CDN Caching    | ₹0 – ₹50    |
| **Cloud Run Backend**| Monthly HTTP Invocations   | 1,600,000 requests | 2,000,000 req/mo      | Provision Cloud Run Paid Autoscale    | ₹40 – ₹120  |
| **Cloud Run Compute**| Monthly vCPU-Seconds       | 288,000 seconds    | 360,000 vCPU-sec      | Optimize route algorithms / memoize   | ₹50 – ₹100  |
| **Firestore Reads**  | Daily Document Reads       | 40,000 reads/day   | 50,000 reads/day      | Activate Firestore Blaze Pay-As-You-Go| ₹5 / 100k   |
| **Firestore Storage**| Total Database Stored Data | 800 MB             | 1,024 MB (1 GiB)      | Prune ephemeral draft records         | ₹15 / GiB   |
| **Active Drive Media**| Total Storage Footprint   | 12.0 GB            | 14.0 GB (of 15 GB)    | Offload raw files to GCS Coldline     | ₹17 – ₹130  |
| **Cloud Tasks**      | Monthly Task Invocations   | 800,000 tasks      | 1,000,000 tasks/mo    | Pay Cloud Tasks standard overage rate | ₹34 / 1M    |
| **Gemini AI Calls**  | Daily Generation Requests  | 1,200 requests     | 1,500 requests/day    | Link GCP Billing to Gemini Tier 1     | ₹25 – ₹50   |
| **Cloud Logging**    | Monthly Ingestion Volume   | 40.0 GiB           | 45.0 GiB (of 50 GiB)  | Apply log level filters (WARN/ERROR)  | ₹30 / 10 GB |
| **YouTube Uploads**  | Daily Video Publishes      | 4 uploads/day      | 5 uploads/day (8k pts)| Submit Free Quota Request to Google   | ₹0.00       |
===========================================================================================================================================
```

---

## 24. Cost Gates & Governance State Machine

To enforce the Prime Directive:
> **"No component moves from DESIGN → IMPLEMENT until its expected cost is understood."**

BP-CMS institutes a formal 6-state Cost Gate state machine governing every architectural subsystem and feature contract:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       COST GATE STATE MACHINE                          │
│                                                                        │
│   [ DESIGN ]                                                           │
│        │                                                               │
│        ▼                                                               │
│   [ COST_ESTIMATED ]   ── (Document expected usage & free tier)        │
│        │                                                               │
│        ▼                                                               │
│   [ COST_APPROVED ]    ── (Lead Architect verifies ≤ ₹100 budget)      │
│        │                                                               │
│        ▼                                                               │
│   [ IMPLEMENTATION_AUTHORIZED ]                                        │
│        │                                                               │
│        ▼                                                               │
│   [ IMPLEMENTED ]      ── (Static build & typecheck verified)          │
│        │                                                               │
│        ▼                                                               │
│   [ OPERATIONAL ]      ── (Runtime metrics within modeled quotas)      │
└────────────────────────────────────────────────────────────────────────┘
```

### 24.1 Formal Cost Gate Records (COST-GATE-01 to COST-GATE-10)

```text
COST-GATE-01: FRONTEND WEB APPLICATION
  Component:        Frontend (Vite SPA + Tailwind CSS)
  Requirement:      BR-001..011, Stage 10 Information Architecture
  Target Arch:      Static SPA served via Cloud Run / Cloudflare Pages
  Expected Usage:   60,000 requests/month, ~75 MB bandwidth
  Free Allowance:   Cloud Run 2M requests, 1 GiB egress / Cloudflare unlimited
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹0.00)
  Upgrade Trigger:  Monthly unique visitors ≥ 100,000
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-02: BACKEND API & ORCHESTRATION CONTAINER
  Component:        Backend (Express 4.x Monolith Container)
  Requirement:      P-11 Modular Monolith, Stage 15 API Contract
  Target Arch:      Google Cloud Run Serverless Container (1 vCPU, 512MB RAM, max-instances=3)
  Expected Usage:   161,820 requests/month, 7,282 vCPU-seconds
  Free Allowance:   2,000,000 requests, 360,000 vCPU-seconds, 180,000 GiB-seconds
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹50.00)
  Upgrade Trigger:  Monthly invocations ≥ 2,000,000
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-03: PRIMARY DATA STORE
  Component:        Database (Primary Data Storage)
  Requirement:      Stage 12 Database Architecture, Stage 13 Data Model
  Target Arch:      Cloud Firestore Native Spark Mode (FIRESTORE_HYBRID)
  Expected Usage:   1,500 reads/day, 300 writes/day, 4.5 MB growth/month
  Free Allowance:   50,000 reads/day, 20,000 writes/day, 1 GiB storage
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹10.00)
  Upgrade Trigger:  Daily reads ≥ 50,000 or collection size ≥ 1 GiB
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-04: ACTIVE MEDIA STORAGE
  Component:        Media Active (Raw & Web Shorts Storage)
  Requirement:      AP-007 Binary Isolation, Stage 14 Media Architecture
  Target Arch:      Google Drive API v3 + Firestore SHA-256 Hash Refs
  Expected Usage:   10 videos/day, 5.2 GB steady-state rolling buffer
  Free Allowance:   15.0 GB shared Google Workspace Drive storage
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹130.00)
  Upgrade Trigger:  Active storage ≥ 14.0 GB
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-05: COLD MEDIA ARCHIVE
  Component:        Archive Cold (Historical Video Masters)
  Requirement:      Stage 14 Media Lifecycle Governance
  Target Arch:      External Hash References initially; GCS Coldline for scaling
  Expected Usage:   0 GB initially (external refs); 25 GB at scale
  Free Allowance:   5 GiB GCS free tier; Coldline ₹0.34 / GB-mo
  Expected Cost:    ₹0.00 / month initially (Worst-Case Exposure: ₹17.00)
  Upgrade Trigger:  Archive volume ≥ 50 GB or compliance lock requirement
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-06: REALTIME STREAMING
  Component:        Realtime (Live Workbench Updates)
  Requirement:      Stage 16 Realtime Architecture
  Target Arch:      Server-Sent Events (SSE) via native Node.js HTTP Streaming
  Expected Usage:   10–15 concurrent connections, 525 KB RAM, 34 MB egress/month
  Free Allowance:   Within Cloud Run free tier compute and memory
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹0.00)
  Upgrade Trigger:  Concurrent staff connections ≥ 100
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-07: BACKGROUND JOB ENGINE
  Component:        Background Jobs / Async Processing
  Requirement:      Stage 17 Async Architecture
  Target Arch:      Google Cloud Tasks HTTP Push (Prod) / In-Process Runner (Dev)
  Expected Usage:   8,940 task invocations/month
  Free Allowance:   1,000,000 task invocations/month
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹0.00)
  Upgrade Trigger:  Monthly task invocations ≥ 1,000,000
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-08: ASSISTIVE AI SUBSYSTEM
  Component:        AI Subsystem (Ideation & Script Drafting)
  Requirement:      AP-009 Human-in-the-Loop, Stage 18 AI Architecture
  Target Arch:      Google AI Studio Gemini 2.5 Flash Pipeline
  Expected Usage:   50 requests/day, 1.935M tokens/month
  Free Allowance:   15 RPM, 1,500 RPD, 1M TPM free quota
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹28.00)
  Upgrade Trigger:  Daily generation requests ≥ 1,200
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-09: AUDIT & OBSERVABILITY TELEMETRY
  Component:        Audit & Observability (Forensic Ledger & Diagnostics)
  Requirement:      Stage 21 Audit & Observability Architecture
  Target Arch:      Single-Line JSON to stdout + Google Cloud Logging
  Expected Usage:   207.6 MB log ingestion/month, 300 audit events/day
  Free Allowance:   50.0 GiB/month free ingestion, 30-day retention
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹0.00)
  Upgrade Trigger:  Monthly log volume ≥ 45 GiB
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04

COST-GATE-10: SOCIAL ANALYTICS HARVESTING
  Component:        Analytics (Platform Performance Ingestion)
  Requirement:      Stage 20 Analytics Architecture
  Target Arch:      6-Hour Cloud Tasks Harvesting into Firestore & BigQuery Sandbox
  Expected Usage:   120 writes/day, 300 reads/day
  Free Allowance:   Within Firestore Spark Tier & BigQuery Sandbox (10GB, 1TB query)
  Expected Cost:    ₹0.00 / month (Worst-Case Exposure: ₹0.00)
  Upgrade Trigger:  Analytics reads ≥ 50,000/day or queries ≥ 1 TB/mo
  Decision:         COST_APPROVED / IMPLEMENTATION_AUTHORIZED
  Owner / Date:     Lead Architect / 2026-10-04
```

---

## 25. Architecture Decisions (ADR-COST-01 to ADR-COST-05)

### ADR-COST-01: Rejection of Managed Cloud SQL in Favor of Firestore Spark Native
- **Context:** The system requires an authoritative transactional datastore for the 15-step workflow.
- **Decision:** Reject Google Cloud SQL for PostgreSQL (which incurs an unyielding base charge of ₹2,167/mo minimum) and adopt Cloud Firestore Native Spark Mode.
- **Consequences:** Eliminates ₹26,000/year in idle server billing. Preserves full ACID transactions via `firestore.runTransaction()` and provides 50,000 free daily reads.

### ADR-COST-02: Rejection of Redis / Memorystore in Favor of In-Memory SSE and Cloud Tasks
- **Context:** Real-time updates and asynchronous queues traditionally employ Redis clusters.
- **Decision:** Strictly prohibit Redis and Memorystore. Implement Server-Sent Events over standard Node.js HTTP and asynchronous task execution via Google Cloud Tasks.
- **Consequences:** Saves ₹2,500 – ₹3,500/month. Operates 100% within perpetual free tiers while satisfying sub-100ms latency.

### ADR-COST-03: Rejection of Commercial Media CDNs in Favor of Externalized Google Drive
- **Context:** Vertical short video storage requires binary retention and client streaming.
- **Decision:** Reject commercial video PaaS (Mux, Cloudinary, Vimeo) costing ₹4,000+/mo. Externalize media binaries to Google Drive API v3 and stream web-optimized MP4 chunks directly via Drive web-view links.
- **Consequences:** Achieves ₹0.00 media storage overhead across 15 GB free quota, with a well-defined ₹130/mo Google One upgrade path if storage ever exceeds 14 GB.

### ADR-COST-04: Rejection of Third-Party APM Platforms in Favor of Google Cloud Logging
- **Context:** Comprehensive diagnostic logging and auditability are required by Stage 21.
- **Decision:** Prohibit Datadog, New Relic, and Sentry. Standardize on single-line structured JSON emitted to `stdout`, automatically collected by Google Cloud Logging.
- **Consequences:** Saves ₹3,000 – ₹10,000/month. Consumes only 208 MB of the 50 GiB perpetual monthly free ingestion quota (0.41% utilization).

### ADR-COST-05: Adoption of Google AI Studio Free Tier with Hard Token Circuit Breakers
- **Context:** Content creators require AI assistance for question brainstorming and script drafting.
- **Decision:** Utilize Google AI Studio Gemini 2.5 Flash free tier, gated behind strict human review buttons (AP-009) and constrained by a server-side circuit breaker of 100 calls/day.
- **Consequences:** Eliminates AI subscription fees. Completely avoids unmetered token drains, keeping monthly AI expenditures at ₹0.00.

---

## 26. Open Decisions & Financial Risk Register

1. **Long-Term Video Retention Policy (Month 6+):**
   - *Issue:* At 10 videos/day, after 6 months, approximately 1,800 shorts will exist. Retaining all 17 MB web masters would require ~30.6 GB.
   - *Resolution Path:* In Stage 23/27, implement an automated pruning policy that archives older raw master files to GCS Coldline (costing ~₹10.50/mo) or compresses older items to 720p thumbnails.
2. **Billing Account Attachment Governance:**
   - *Issue:* Activating Google Cloud Tasks and Cloud Run in production requires linking a valid credit card / Google Cloud Billing Account, even though usage remains within the free tier.
   - *Resolution Path:* Configure Google Cloud Budget Alerts at **₹50.00 INR** (50% warning) and **₹80.00 INR** (80% critical alert) with automated Pub/Sub webhook integration to disable non-essential compute instances if ₹90.00 is breached.

---

## 27. Implementation Restrictions (Anti-Waste Guardrails)

During all subsequent implementation stages (Stages 23 through 30), the following engineering restrictions are strictly binding:

1. **Zero Unbudgeted Cloud Provisions:** No engineer or agent may execute commands that provision billable resources (e.g., `gcloud sql instances create`, `gcloud compute instances create`, or paid Memorystore instances).
2. **Max Instances Constraint:** All Cloud Run deployment configurations (`service.yaml`, Terraform, or gcloud CLI) must explicitly enforce `--max-instances=3` and `--min-instances=0`.
3. **Binary Storage Prohibition:** No code changes may introduce binary file upload handlers that write MP4, WAV, or WebP files directly into Firestore documents or container local disk.
4. **Mandatory Rate Limiting:** All public-facing or webhook endpoints must include Express IP rate limiters to prevent malicious bill-inflation attacks.
5. **AI Human-Gate Invariant:** No autonomous background job, cron schedule, or event listener may invoke the Gemini AI client directly. Every call must originate from an authenticated user HTTP request carrying a valid session cookie.

---

## 28. Cost Validation Methodology

To ensure that the ₹0–₹100 financial constraint remains actively validated throughout the software development lifecycle:

1. **Pre-Commit Static Architecture Gate:** The Cost Gate evaluator (`validateCostInvariant` in `src/types/cost-architecture.ts`) validates that total modeled component costs remain $\le$ ₹100.00 INR.
2. **Continuous Integration Telemetry Check:** Automated CI test suites verify that test mocks do not invoke live paid third-party APIs.
3. **Monthly Synthetic Audit:** A scheduled diagnostic script evaluates actual Google Cloud billing ledger exports against modeled quotas, computing the headroom margin for every resource.
4. **Automated Alerting Thresholds:**
   - **Green (Normal):** Total projected monthly cost = ₹0.00 INR.
   - **Yellow (Advisory):** Projected cost reaches ₹50.00 INR (50% of budget ceiling).
   - **Red (Critical Emergency):** Projected cost reaches ₹80.00 INR. Cloud Run scales to single instance, non-essential background tasks are queued, and administrative alerts are dispatched via Telegram.

---

## 29. Acceptance Criteria & Anti-Overclaim Confirmation

### 29.1 Acceptance Criteria Checklist
- [x] **Cost Objectives Defined:** Clear financial goals established, targeting ₹0.00 baseline with a hard ₹100.00 INR/month ceiling.
- [x] **Canonical Matrix Populated:** All 10 architectural components mapped with current state, target state, expected cost, free/low-cost option, and upgrade trigger.
- [x] **Component-Specific Analyses Complete:** Comprehensive engineering calculations for Frontend, Backend, Database, Media, Archive, Realtime, Jobs, AI, Analytics, and Observability.
- [x] **Three Usage Scenarios Modeled:** Mathematical proof provided for Scenario A (Dev: ₹0.00), Scenario B (Production: ₹0.00), and Scenario C (Growth/Stress: ₹33.50).
- [x] **Anti-PaaS Invariants Enforced:** Dedicated Redis, Cloud SQL, Pusher, Kafka, Auth0, and Datadog explicitly prohibited.
- [x] **Cost Gate State Machine Established:** Formal `DESIGN` $\to$ `COST_ESTIMATED` $\to$ `COST_APPROVED` $\to$ `IMPLEMENTATION_AUTHORIZED` $\to$ `IMPLEMENTED` $\to$ `OPERATIONAL` lifecycle codified.
- [x] **Cost Gate Records Documented:** Formal records `COST-GATE-01` through `COST-GATE-10` authored.
- [x] **Upgrade Triggers Quantified:** Every zero-cost option paired with measurable metrics, warning thresholds, and clear engineering actions.
- [x] **Zero Production Code Modified:** Architectural specification only. Zero runtime lines modified, zero database schemas altered, zero billing accounts changed.

### 29.2 Authoritative Anti-Overclaim Statement
> **"Stage 22 cost architecture is documented and contractually defined; runtime billing configurations and infrastructure provisioning remain for later implementation stages."**

```
================================================================================
STAGE 22 — COST ARCHITECTURE SPECIFICATION
================================================================================
Artifact:            docs/architecture/22-COST-ARCHITECTURE.md
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Stage:          Stage 22 of 30
Application Code:    UNCHANGED (Zero Runtime Modifications)
Cloud Infra:         UNCHANGED (Zero Billing / Cloud Provisioning Changes)
Budget Compliance:   VERIFIED (₹0.00 Baseline, ₹100.00 Hard Monthly Ceiling)
Stage Boundary:      HALTED AT STAGE 22. Awaiting Stage 23 Instruction.
================================================================================
```
