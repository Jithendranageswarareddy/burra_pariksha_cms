# Publishing Record Business Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 18 of 51  

---

## 1. Publishing Identity & Schema

- **Canonical Name:** Publishing Record
- **Classification:** Business Entity (Multi-Platform Distribution Configuration)
- **Primary Identifier:** `id` (Pattern: `PUB-XXXXXX` or UUID)
- **Foreign Keys Held:**
  - `videoId` -> `VIDEOS.id`
  - `contentMasterId` -> `CONTENT_MASTERS.id`
- **Physical Storage:** Google Sheets tab `PUBLISHING` (20 columns)
- **TypeScript Model:** `interface Publishing` (`src/types/index.ts:720–780`)
- **Repository:** `publishingRepository` (`src/lib/repositories/publishing.repository.ts`)

---

## 2. Multi-Platform Schema Columns

| Col | Header | Description |
| :-: | :--- | :--- |
| **A** | `id` | Primary Key |
| **B** | `video_id` | FK to `VIDEOS` |
| **C** | `youtube_status` | `NOT_STARTED`, `SCHEDULED`, `PUBLISHED`, `FAILED` |
| **D** | `youtube_scheduled_at` | Future ISO timestamp for YouTube publish |
| **E** | `youtube_post_id` | External YouTube Video ID (e.g. `dQw4w9WgXcQ`) |
| **F** | `instagram_status` | Instagram Reels publish status |
| **G** | `facebook_status` | Facebook Video publish status |
| **H** | `status` | Aggregate status across all platforms |
| **I** | `completed_platforms` | Count of platforms live |
