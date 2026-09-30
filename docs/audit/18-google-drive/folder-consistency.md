# Folder Consistency & Resolution Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 27 of 40  

---

## 1. In-Memory Folder Resolution Cache (`folderCache`)

To prevent excessive `drive.files.list` quota calls, `GoogleDriveService` maintains an in-memory cache:

```typescript
// src/lib/services/google-drive.service.ts:65
private folderCache = new Map<string, string>();

public async ensureFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const cacheKey = `${parentFolderId || 'ROOT'}/${folderName}`;
  if (this.folderCache.has(cacheKey)) {
    return this.folderCache.get(cacheKey)!;
  }
  // Query or create folder...
}
```

---

## 2. Consistency & Concurrency Vulnerabilities

1. **Race Condition on First Folder Creation:**  
   If two requests for `BP-CNT-000001` arrive concurrently on a cold server:
   - Both check `folderCache` (miss).
   - Both execute `drive.files.list` (miss).
   - Both execute `drive.files.create({ name: 'BP-CNT-000001' })`.
   - **Result:** Two duplicate folders named `BP-CNT-000001` are created in Google Drive.
2. **Cache Desynchronization on Cloud Run:**  
   If Container A creates a folder, Container B has no awareness of it and creates a duplicate folder when handling a request for the same content ID.
