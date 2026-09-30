# Step 30: 04 — Relational Data Model & Persistence Migration Strategy

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Data Model Specification & Persistence Strategy  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Relational Entity-Relationship Blueprint

To eliminate the Google Sheets concurrency and quota limitations audited in Steps 15, 17, and 19, the target persistence layer transitions to a normalized, high-performance PostgreSQL 16 schema.

```
                   ┌────────────────────────────────┐
                   │          users                 │
                   │ (id, email, password_hash,    │
                   │  role, session_version)        │
                   └───────────────┬────────────────┘
                                   │ 1:N
                                   ▼
                   ┌────────────────────────────────┐
                   │       content_items            │◄──────────┐
                   │ (id, canonical_code, title,    │           │
                   │  topic, status, author_id)     │           │
                   └───────────────┬────────────────┘           │
                                   │                            │
         ┌─────────────────────────┼─────────────────────────┐  │
         │ 1:1                     │ 1:1                     │ 1:1
         ▼                         ▼                         ▼  │
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    questions     │      │     scripts      │      │      videos      │
│ (id, content_id, │      │ (id, content_id, │      │ (id, content_id, │
│  english_text,   │      │  teleprompter,   │      │  drive_raw_id,   │
│  telugu_text,    │      │  target_seconds, │      │  drive_edited_id,│
│  options, expl)  │      │  author_id)      │      │  editor_id, etc) │
└──────────────────┘      └──────────────────┘      └────────┬─────────┘
                                                             │
                                   ┌─────────────────────────┴─────────┐
                                   │ 1:1                               │ 1:1
                                   ▼                                   ▼
                        ┌────────────────────┐              ┌────────────────────┐
                        │     thumbnails     │              │ publishing_records │
                        │ (id, video_id,     │              │ (id, video_id,     │
                        │  drive_thumb_id,   │              │  youtube_id,       │
                        │  aspect_ratio)     │              │  insta_id, status) │
                        └────────────────────┘              └────────┬───────────┘
                                                                     │ 1:N
                                                                     ▼
                                                            ┌────────────────────┐
                                                            │  analytics_metrics │
                                                            │ (id, publish_id,   │
                                                            │  platform, views,  │
                                                            │  watch_time, ctr)  │
                                                            └────────────────────┘
```

---

## 2. Core PostgreSQL Drizzle ORM Schema Specification

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, pgEnum, index } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN', 'CONTENT_MANAGER', 'TOPIC_LEAD', 'QUESTION_CREATOR',
  'SCRIPT_WRITER', 'STUDIO_PRESENTER', 'VIDEO_EDITOR', 'THUMBNAIL_DESIGNER',
  'PUBLISHING_MANAGER', 'COMMUNITY_MANAGER', 'ANALYTICS_VIEWER', 'REVIEWER'
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'DRAFT', 'QUESTION_GENERATED', 'QUESTION_VERIFIED', 'SCRIPT_CREATED',
  'FILMED', 'RAW_UPLOADED', 'EDITING', 'EDITED_QC_PASSED',
  'THUMBNAIL_READY', 'SOCIAL_REVIEWED', 'READY_TO_PUBLISH',
  'PUBLISHED', 'VERIFIED_LIVE', 'PERFORMANCE_INGESTED', 'DIAGNOSED', 'LOOP_CLOSED',
  'REJECTED', 'ARCHIVED'
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('QUESTION_CREATOR'),
  sessionVersion: integer('session_version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const contentItems = pgTable('content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g. BP-CNT-000001
  topic: text('topic').notNull(),
  subject: text('subject').notNull(),
  examCategory: text('exam_category').notNull(),
  difficulty: text('difficulty').notNull(),
  status: workflowStatusEnum('status').notNull().default('DRAFT'),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  statusIdx: index('content_status_idx').on(table.status),
  codeIdx: index('content_code_idx').on(table.code)
}));

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
  questionCode: text('question_code').notNull().unique(), // BP-Q-000001
  englishText: text('english_text').notNull(),
  teluguText: text('telugu_text').notNull(),
  options: jsonb('options').notNull(), // [{ id: 'A', en: '...', te: '...' }]
  correctOption: text('correct_option').notNull(),
  explanationEn: text('explanation_en').notNull(),
  explanationTe: text('explanation_te').notNull(),
  verifiedById: uuid('verified_by_id').references(() => users.id),
  verifiedAt: timestamp('verified_at')
});

export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentId: uuid('content_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
  videoCode: text('video_code').notNull().unique(), // BP-V-000001
  presenterId: uuid('presenter_id').references(() => users.id),
  editorId: uuid('editor_id').references(() => users.id),
  driveRawFolderId: text('drive_raw_folder_id'),
  driveRawFileId: text('drive_raw_file_id'),
  driveEditedFileId: text('drive_edited_file_id'),
  durationSeconds: integer('duration_seconds'),
  status: workflowStatusEnum('status').notNull().default('FILMED'),
  qcScore: integer('qc_score'),
  qcPassedAt: timestamp('qc_passed_at')
});
```

---

## 3. Google Sheets Migration & Zero-Downtime Cutover

1. **Step 1: Read-Only Freeze of Google Sheets** — Export all 25 operational sheets via Google Sheets API v4.
2. **Step 2: Automated ETL & ID Mapping** — Ingest rows into PostgreSQL with deterministic ID reconciliation:
   - `BP-CNT-*` mapped directly to `content_items.id`.
   - `BP-Q-*` linked to corresponding `content_items`.
   - `BP-V-*` linked to corresponding `content_items`.
3. **Step 3: Verification & Foreign Key Assertion** — Validate 100% row count parity and foreign key constraints.
4. **Step 4: Cutover & Archive** — Switch repository interfaces from `GoogleSheetsRepository` to `PostgresRepository`.
