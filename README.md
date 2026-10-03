# BURRA PARIKSHA CMS Production Management

> **Phase 1: Application Architecture & UI Shell (Foundation Only)**

A dedicated personal content repository and video-production workflow management system built for the **Burra Pariksha** aptitude channel.

---

## 1. Product Purpose & Scope

The application manages the end-to-end Burra Pariksha content lifecycle:

```text
Question Generation (AI Studio)
  → Question Editing & Review
  → Question Approval
  → Video Queue
  → Script Creation & Teleprompter
  → Studio Recording
  → Post-Production / Editing
  → Final QC Review
  → Ready to Upload
  → Manual Multi-Platform Publishing (YouTube Shorts, Instagram Reels, Facebook)
  → Live URL & Performance Tracking
```

**Key Architectural Principles:**
- **Content Database + Production System:** The core application is a structured workflow system; AI generation is one integrated subsystem.
- **Single Admin User:** Designed for the content owner and lead producer.
- **Manual Social Uploads:** Video publishing to YouTube, Instagram, and Facebook is handled manually by design (no social media API credentials or automation).
- **Phased Evolution:** Built to scale across 10 progressive development phases.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript (Vite runtime in AI Studio) |
| **Styling & Design** | Tailwind CSS v4 + Lucide Icons + Minimalist Internal UI System |
| **Routing** | React Router v7 (Client-side routing with deep link support) |
| **Backend / Server** | Express / Node.js API layer (prepared for Phase 2+) |
| **Database (Future - Phase 2)** | Google Sheets API (Target Spreadsheet: *Burra Pariksha CMS - TEST*) |
| **Media Storage (Future - Phase 3)** | Google Drive API (Folder-structured raw footage & 4K master renders) |
| **AI Generation (Future - Phase 4)** | Gemini API via `@google/genai` TypeScript SDK |
| **Hosting Target** | Vercel / Cloud Run |
| **Source Control** | GitHub |

*Note on Framework Selection:* AI Studio runs on a containerized Vite + React TypeScript environment. The codebase is organized modularly to enable direct portability and export to Next.js App Router on Vercel.

---

## 3. Project Structure

```text
burra-pariksha-cms/
├── .env.example                # Documented future environment variables
├── metadata.json               # Application metadata & capabilities
├── package.json                # Project dependencies & scripts
├── vite.config.ts              # Vite build configuration
├── src/
│   ├── main.tsx                # Client entry point
│   ├── App.tsx                 # Route declarations & ErrorBoundary provider
│   ├── index.css               # Global Tailwind CSS imports
│   ├── types/
│   │   └── index.ts            # Centralized domain types (Users, Questions, Videos, etc.)
│   ├── config/
│   │   ├── constants.ts        # App configuration, status configs & badge styles
│   │   └── navigation.ts       # Navigation hierarchy & links
│   ├── lib/
│   │   └── mock-data/          # Isolated mock layer for Phase 1
│   │       ├── taxonomy.ts     # Categories, Topics, Subtopics
│   │       ├── questions.ts    # Realistic aptitude questions & solution breakdowns
│   │       ├── production.ts   # Multi-stage video tracking records
│   │       ├── queue.ts        # Prioritized filming queue records
│   │       ├── publishing.ts   # Manual social publishing records
│   │       ├── dashboard.ts    # Metrics, today's tasks, audit activity
│   │       └── index.ts        # Unified repository exports & helpers
│   ├── components/
│   │   ├── common/             # StatCard, StatusBadge, DifficultyBadge, Button, etc.
│   │   ├── layout/             # Sidebar, Header, PageHeader, ErrorBoundary, Layout
│   │   ├── questions/          # QuestionTable
│   │   ├── production/         # ProductionKanban, ProductionTable, PipelineProgress
│   │   ├── queue/              # QueueTable
│   │   └── publishing/         # PublishingTable
│   └── pages/
│       ├── DashboardPage.tsx           # /dashboard & /
│       ├── QuestionLibraryPage.tsx     # /questions
│       ├── NewQuestionPage.tsx         # /questions/new
│       ├── QuestionDetailPage.tsx      # /questions/:id
│       ├── QuestionGeneratorPage.tsx   # /generate (AI Studio Prototype)
│       ├── QueuePage.tsx               # /queue
│       ├── ProductionTrackerPage.tsx   # /production
│       ├── PublishingPage.tsx          # /publishing
│       ├── SettingsPage.tsx            # /settings
│       └── NotFoundPage.tsx            # 404 handler
```

---

## 4. Application Routes (Phase 1 Implemented)

- `/` → Automatically redirects to `/dashboard`
- `/dashboard` → Metric cards, today's schedule, pipeline flow, delayed content alerts, recent questions
- `/questions` → Master question bank with search, category, topic, difficulty, and status filters
- `/questions/new` → Manual question authoring workspace with options and solution explanation
- `/questions/:id` → Detailed view and status manager for individual questions
- `/generate` → Prototype AI Question Studio parameter configurator & prompt modifier workspace
- `/queue` → Prioritized video filming and teleprompter queue
- `/production` → Multi-stage production pipeline with Kanban board and table view toggles
- `/publishing` → Manual multi-platform upload checklist & live URL tracker
- `/settings` → Configuration views for Application, Taxonomy, Gemini, Sheets, and Drive

---

## 5. Local Development Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Production Build
```bash
npm run build
```

---

## 6. Environment Variables Overview

See `.env.example` for all future variables:

```env
# Gemini API Key for AI Studio question generation (Phase 4+)
GEMINI_API_KEY=""

# Target Google Spreadsheet ID (Phase 2+)
GOOGLE_SHEETS_ID=""

# Google Drive Root Folder ID for video footage & renders (Phase 3+)
GOOGLE_DRIVE_FOLDER_ID=""

# Google OAuth 2.0 Credentials for Admin Sign-In (Phase 8+)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Public Application URL
APP_URL="http://localhost:3000"
```

> **IMPORTANT:** In Phase 1, no live credentials or external API connections are required. The entire system runs deterministically on the isolated mock data layer.

---

## 7. Current Phase & Future Roadmap

- **Phase 1 (Current):** Application Architecture, UI Shell, Domain Types & Isolated Mock Layer.
- **Phase 2 (Next):** Google Sheets API integration (Database layer schema mapping for 17 tabs).
- **Phase 3:** Google Drive API integration (Media assets & teleprompter scripts).
- **Phase 4:** Server-side Gemini API integration (AI Question & Script Studio).
- **Phase 5:** Video Queue & Filming Workflow persistence.
- **Phase 6:** Post-Production & Review System.
- **Phase 7:** Publishing & URL Tracking persistence.
- **Phase 8:** Google Authentication & Security.
- **Phase 9:** Performance, Polishing & Error Recovery.
- **Phase 10:** Production Deployment to Vercel & GitHub sync.
