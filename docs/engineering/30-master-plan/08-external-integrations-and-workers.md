# Step 30: 08 — External Integrations & Worker Architecture Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** External Integrations & Asynchronous Jobs Specification  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Asynchronous Job Processing Topology (BullMQ + Redis)

To eliminate the synchronous blocking, timeout risks, and manual UI stubbing identified in Steps 11, 21, and 23, all long-running tasks are offloaded to dedicated BullMQ worker queues:

```
[ Express API Gateway ]
          │
          ▼ addJob()
[ Redis Message Broker ]
    ├── Queue: `video-transcode-queue`
    ├── Queue: `social-publish-queue`
    ├── Queue: `analytics-sync-queue`
    └── Queue: `ai-synthesis-queue`
          │
          ▼ processJob()
[ Background Worker Fleet (Node.js 22 LTS) ]
    ├── Video Transcoding Worker (FFmpeg / Thumbnail Generation)
    ├── YouTube Publishing Worker (YouTube Data API v3)
    ├── Instagram Publishing Worker (Meta Graph API v20.0)
    └── Metrics Ingestion Worker (Scheduled Cron / Webhooks)
```

---

## 2. Social Publishing Worker Engine

```typescript
// src/workers/socialPublishWorker.ts
import { Worker, Job } from 'bullmq';
import { google } from 'googleapis';
import { db } from '../db';
import { publishingRecords, contentItems } from '../db/schema';
import { eq } from 'drizzle-orm';

export const socialPublishWorker = new Worker('social-publish-queue', async (job: Job) => {
  const { publishingId } = job.data;
  const publishRecord = await db.query.publishingRecords.findFirst({
    where: eq(publishingRecords.id, publishingId),
    with: { video: true, content: true }
  });

  if (!publishRecord) throw new Error(`Publishing record ${publishingId} not found`);

  // 1. YouTube Data API v3 Upload
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const ytResponse = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: publishRecord.title,
        description: `${publishRecord.description}\n\n#BurraPariksha #Aptitude`,
        tags: publishRecord.tags,
        categoryId: '27' // Education
      },
      status: {
        privacyStatus: publishRecord.visibility || 'public',
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      body: await fetchDriveStream(publishRecord.video.driveEditedFileId)
    }
  });

  const youtubeVideoId = ytResponse.data.id!;

  // 2. Post Pinned Comment
  if (publishRecord.pinnedCommentText) {
    await youtube.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId: youtubeVideoId,
          topLevelComment: {
            snippet: { textOriginal: publishRecord.pinnedCommentText }
          }
        }
      }
    });
  }

  // 3. Atomic Database State Cascade
  await db.transaction(async (tx) => {
    await tx.update(publishingRecords).set({
      youtubeId: youtubeVideoId,
      status: 'PUBLISHED',
      publishedAt: new Date()
    }).where(eq(publishingRecords.id, publishingId));

    await tx.update(contentItems).set({
      status: 'PUBLISHED',
      updatedAt: new Date()
    }).where(eq(contentItems.id, publishRecord.contentId));
  });

  return { success: true, youtubeVideoId };
}, {
  connection: redisConnection,
  concurrency: 5,
  limiter: { max: 10, duration: 60000 } // Respect YouTube API rate quotas
});
```

---

## 3. Resilience & Failure Handling Matrix

| Worker Queue | Max Retries | Backoff Strategy | Failure Action | Dead Letter Queue |
| :--- | :---: | :--- | :--- | :--- |
| `social-publish-queue` | 5 | Exponential (2s, 4s, 8s, 16s, 32s) | Mark record `PUBLISH_FAILED`, alert Slack/Email | `social-publish-dlq` |
| `analytics-sync-queue` | 3 | Exponential (5s, 15s, 45s) | Log warning, retry next hourly cycle | `analytics-sync-dlq` |
| `video-transcode-queue` | 2 | Fixed (10s) | Mark `QC_FAILED`, notify assigned editor | `video-transcode-dlq` |
