# Step 30: 07 — Storage & Asset Pipeline Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Binary Storage & Asset Hierarchy Specification  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Google Drive Directory Architecture

To resolve the folder convention divergence discovered in Step 18 (Phase 7 vs Phase 14 folder structures), BP-CMS unifies all binary asset storage into a single, deterministic Google Drive folder hierarchy:

```
Google Drive Root: BP_CMS_PROD_ROOT/
├── 01_RAW_VIDEOS/
│   ├── 2026-W38/
│   │   ├── BP-V-000001_Take1_raw.mp4
│   │   └── BP-V-000002_Take1_raw.mp4
│   └── 2026-W39/
├── 02_EDITED_VIDEOS/
│   ├── 2026-W38/
│   │   ├── BP-V-000001_final_master.mp4
│   │   └── BP-V-000001_subtitles_te.vtt
│   └── 2026-W39/
├── 03_THUMBNAILS/
│   ├── 2026-W38/
│   │   ├── BP-V-000001_thumb_1280x720.png
│   │   └── BP-V-000001_thumb_variantB.png
│   └── 2026-W39/
├── 04_PROMPTER_SCRIPTS/
│   └── BP-S-000001_script.json
└── 05_SYSTEM_BACKUPS/
    ├── hourly/
    └── daily/
```

---

## 2. Resilient Asset Ingestion Engine

```typescript
export class GoogleDriveAssetService {
  private drive: drive_v3.Drive;

  async uploadLargeAsset(
    fileStream: Readable,
    fileName: string,
    folderType: 'RAW' | 'EDITED' | 'THUMBNAIL',
    mimeType: string
  ): Promise<DriveAssetUploadResult> {
    const targetFolderId = await this.resolveWeeklyFolder(folderType);

    // Resumable upload chunked at 8MB
    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [targetFolderId]
      },
      media: {
        mimeType,
        body: fileStream
      },
      fields: 'id, name, size, md5Checksum, webViewLink'
    }, {
      retryConfig: { retry: 3, retryDelay: 1000 }
    });

    return {
      fileId: response.data.id!,
      fileName: response.data.name!,
      size: Number(response.data.size),
      checksum: response.data.md5Checksum!,
      viewUrl: response.data.webViewLink!
    };
  }
}
```

---

## 3. Storage Integrity & Lifecycle Rules

1. **Deterministic Naming:** All binary uploads must strictly follow `<ENTITY_CODE>_<TYPE>.<EXT>` to guarantee idempotency and searchability.
2. **Checksum Verification:** The client transmits a SHA256 checksum with upload payloads; the server asserts checksum parity against Google Drive's MD5/SHA256 after upload completion.
3. **Automated Archiving:** Raw video files older than 90 days are automatically archived to cold Google Cloud Storage buckets to optimize active Google Drive quotas.
