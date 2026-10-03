/**
 * BURRA PARIKSHA CMS - Google Drive Service
 * Phase 7: Google Drive Real Media Infrastructure
 * 
 * Provides authentic, server-side Google Drive binary file operations,
 * deterministic folder hierarchy management, and media streaming/downloads.
 * Uses service account JWT credentials configured via server environment.
 * Includes in-memory binary media engine when SKIP_DRIVE_SYNC=true or fallback mode.
 */

import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { GoogleAuthError, ValidationError } from '../google-sheets/errors';

export interface DriveFileMetadata {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  createdTime?: string;
  folderId?: string;
}

export interface ContentFolderHierarchy {
  rootFolderId: string;
  parentContentFolderId: string;
  contentFolderId: string;
  videosFolderId: string;
  scriptsFolderId: string;
  thumbnailsFolderId: string;
}

export interface DriveDownloadResult {
  stream: Readable;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  statusCode: number;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService | null = null;
  private driveApi: drive_v3.Drive | null = null;
  private isAuthInitialized = false;
  private tempRefreshToken: string | null = null;

  public setInMemoryAuth(token: string | null): void {
    this.tempRefreshToken = token;
    this.driveApi = null;
    this.isAuthInitialized = false;
  }

  public getInMemoryAuth(): string | null {
    return this.tempRefreshToken;
  }

  // In-memory folder ID cache to guarantee zero redundant folder queries
  private folderCache = new Map<string, string>();

  private constructor() {}

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Resets folder resolution cache.
   */
  public clearFolderCache(): void {
    this.folderCache.clear();
  }

  /**
   * Determines which Google Drive authentication provider mode is active.
   */
  public getAuthProviderMode(): 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE' {
    if (process.env.SKIP_DRIVE_SYNC === 'true') {
      return 'NONE';
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Canonical variable is GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN.
    // In production, in-memory tokens are forbidden. In test/dev, tempRefreshToken is allowed only when env is absent.
    const refreshToken =
      process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN ||
      (process.env.NODE_ENV !== 'production' ? this.tempRefreshToken : null);

    if (clientId && clientSecret && refreshToken) {
      return 'OAUTH2';
    }

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;

    if (email && key) {
      return 'SERVICE_ACCOUNT';
    }

    return 'NONE';
  }

  /**
   * Returns a sanitized diagnostic overview of Google Drive configuration without revealing any secret values.
   */
  public getDriveConfigurationStatus(): {
    mode: 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE';
    refreshToken: 'CONFIGURED' | 'MISSING';
    clientId: 'CONFIGURED' | 'MISSING';
    clientSecret: 'CONFIGURED' | 'MISSING';
    rootFolder: 'CONFIGURED' | 'MISSING';
    isConfigured: boolean;
  } {
    const mode = this.getAuthProviderMode();
    const hasRefreshToken = Boolean(
      process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN ||
      (process.env.NODE_ENV !== 'production' && this.tempRefreshToken)
    );
    const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
    const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
    const hasRootFolder = Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

    return {
      mode,
      refreshToken: hasRefreshToken ? 'CONFIGURED' : 'MISSING',
      clientId: hasClientId ? 'CONFIGURED' : 'MISSING',
      clientSecret: hasClientSecret ? 'CONFIGURED' : 'MISSING',
      rootFolder: hasRootFolder ? 'CONFIGURED' : 'MISSING',
      isConfigured: this.isConfigured(),
    };
  }

  /**
   * Checks if Google credentials for Drive are configured and enabled.
   */
  public isConfigured(): boolean {
    const mode = this.getAuthProviderMode();
    if (mode === 'OAUTH2') {
      return true;
    }
    if (mode === 'SERVICE_ACCOUNT') {
      // Service account is only allowed in non-production, or if explicitly configured for legacy dev
      return process.env.NODE_ENV !== 'production';
    }
    return false;
  }

  /**
   * Returns authenticated Drive API client instance.
   */
  private getDriveApi(): drive_v3.Drive {
    if (this.driveApi && this.isAuthInitialized) {
      return this.driveApi;
    }

    const mode = this.getAuthProviderMode();

    if (mode === 'OAUTH2') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken =
        process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN ||
        (process.env.NODE_ENV !== 'production' ? this.tempRefreshToken : null);

      if (!refreshToken) {
        throw new GoogleAuthError('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN is not configured.');
      }

      try {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        this.driveApi = google.drive({ version: 'v3', auth: oauth2Client });
        this.isAuthInitialized = true;
        return this.driveApi;
      } catch (err: any) {
        if (
          err?.message?.includes('invalid_grant') ||
          err?.response?.data?.error === 'invalid_grant'
        ) {
          throw new GoogleAuthError(
            'Google Drive OAuth refresh token is invalid, expired, or revoked. Update GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN in the runtime secret store.'
          );
        }
        throw new GoogleAuthError(
          `Failed to initialize Google Drive OAuth 2.0 authentication: ${err?.message || 'Unknown auth error'}`
        );
      }
    }

    if (mode === 'SERVICE_ACCOUNT' && process.env.NODE_ENV !== 'production') {
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;

      if (!email || !privateKey) {
        throw new GoogleAuthError(
          'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are required for legacy Service Account.'
        );
      }

      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      try {
        const auth = new google.auth.JWT({
          email,
          key: privateKey,
          scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive',
          ],
        });

        this.driveApi = google.drive({ version: 'v3', auth });
        this.isAuthInitialized = true;
        return this.driveApi;
      } catch (err: any) {
        throw new GoogleAuthError(
          `Failed to initialize legacy Google Drive Service Account authentication: ${err?.message || 'Unknown auth error'}`
        );
      }
    }

    throw new GoogleAuthError(
      'Google Drive integration is not configured or unavailable in this environment.'
    );
  }

  /**
   * Deterministically finds or creates a Drive folder with exact name under a parent folder.
   */
  public async ensureFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const cacheKey = `${parentFolderId || 'ROOT'}/${folderName}`;
    if (this.folderCache.has(cacheKey)) {
      return this.folderCache.get(cacheKey)!;
    }

    if (!this.isConfigured()) {
      throw new GoogleAuthError('Google Drive integration is not configured or unavailable in this environment.');
    }

    try {
      const drive = this.getDriveApi();
      const safeName = folderName.replace(/'/g, "\\'");
      let q = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentFolderId) {
        q += ` and '${parentFolderId}' in parents`;
      }

      const res = await drive.files.list({
        q,
        fields: 'files(id, name)',
        pageSize: 1,
      });

      if (res.data.files && res.data.files.length > 0) {
        const existingFolderId = res.data.files[0].id!;
        this.folderCache.set(cacheKey, existingFolderId);
        return existingFolderId;
      }

      const createRes = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentFolderId ? [parentFolderId] : undefined,
        },
        fields: 'id',
      });

      if (!createRes.data.id) {
        throw new Error(`Failed to create Google Drive folder "${folderName}".`);
      }

      const newFolderId = createRes.data.id;
      this.folderCache.set(cacheKey, newFolderId);
      return newFolderId;
    } catch (err: any) {
      console.error(`[GoogleDriveService] Drive ensureFolder failed for "${folderName}":`, err?.message || err);
      throw err;
    }
  }

  /**
   * Ensures the complete deterministic folder hierarchy for a Content ID:
   * Burra Pariksha -> Content -> BP-CNT-###### -> { Videos, Scripts, Thumbnails }
   */
  public async ensureContentHierarchy(contentId: string): Promise<ContentFolderHierarchy> {
    if (!contentId || typeof contentId !== 'string') {
      throw new ValidationError('A valid canonical Content ID (e.g. BP-CNT-000001) is required for folder hierarchy.');
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      ? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      : await this.ensureFolder('Burra Pariksha');

    const parentContentFolderId = await this.ensureFolder('Content', rootFolderId);
    const contentFolderId = await this.ensureFolder(contentId, parentContentFolderId);

    const [videosFolderId, scriptsFolderId, thumbnailsFolderId] = await Promise.all([
      this.ensureFolder('Videos', contentFolderId),
      this.ensureFolder('Scripts', contentFolderId),
      this.ensureFolder('Thumbnails', contentFolderId),
    ]);

    return {
      rootFolderId,
      parentContentFolderId,
      contentFolderId,
      videosFolderId,
      scriptsFolderId,
      thumbnailsFolderId,
    };
  }

  /**
   * Ensures the Phase 14 production folder hierarchy for a Content ID:
   * Root (configurable) -> BP-CNT-###### -> { Raw, Edited, Final, Thumbnail }
   */
  public async ensureProductionHierarchy(contentId: string): Promise<{
    rootFolderId: string;
    contentFolderId: string;
    rawFolderId: string;
    editedFolderId: string;
    finalFolderId: string;
    thumbnailFolderId: string;
  }> {
    if (!contentId || typeof contentId !== 'string') {
      throw new ValidationError('A valid canonical Content ID (e.g. BP-CNT-000001) is required for folder hierarchy.');
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      ? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      : await this.ensureFolder('Burra Pariksha');

    const contentFolderId = await this.ensureFolder(contentId, rootFolderId);

    const [rawFolderId, editedFolderId, finalFolderId, thumbnailFolderId] = await Promise.all([
      this.ensureFolder('Raw', contentFolderId),
      this.ensureFolder('Edited', contentFolderId),
      this.ensureFolder('Final', contentFolderId),
      this.ensureFolder('Thumbnail', contentFolderId),
    ]);

    return {
      rootFolderId,
      contentFolderId,
      rawFolderId,
      editedFolderId,
      finalFolderId,
      thumbnailFolderId,
    };
  }

  /**
   * Executes a Google Drive API operation with bounded retries for transient failures.
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (err: any) {
        if (
          err?.message?.includes('invalid_grant') ||
          err?.response?.data?.error === 'invalid_grant'
        ) {
          throw new GoogleAuthError(
            'Google Drive OAuth refresh token is invalid, expired, or revoked. Update GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN in the runtime secret store.'
          );
        }
        attempt++;
        const isTransient = this.isTransientError(err);
        if (!isTransient || attempt >= maxRetries) {
          throw err;
        }
        const backoff = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[GoogleDriveService] Transient error encountered (attempt ${attempt}/${maxRetries}), retrying in ${backoff}ms:`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw new Error('Operation failed after retries');
  }

  private isTransientError(err: any): boolean {
    const errMsg = (err?.message || '').toLowerCase();
    if (errMsg.includes('invalid_grant')) {
      return false;
    }
    const status = err?.status || err?.statusCode || (err?.response && err.response.status);
    if (status) {
      return [408, 429, 500, 502, 503, 504].includes(status);
    }
    return errMsg.includes('timeout') || errMsg.includes('econnreset') || errMsg.includes('etimedout') || errMsg.includes('network') || errMsg.includes('rate limit');
  }

  /**
   * Uploads a binary media stream or buffer into Google Drive.
   */
  public async uploadFile(params: {
    fileName: string;
    mimeType: string;
    bodyStreamOrBuffer: Readable | Buffer;
    folderId?: string;
    description?: string;
  }): Promise<DriveFileMetadata> {
    let buffer: Buffer;
    if (Buffer.isBuffer(params.bodyStreamOrBuffer)) {
      buffer = params.bodyStreamOrBuffer;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of params.bodyStreamOrBuffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      buffer = Buffer.concat(chunks);
    }

    if (!this.isConfigured()) {
      throw new GoogleAuthError('Google Drive integration is not configured or unavailable in this environment.');
    }

    try {
      const drive = this.getDriveApi();
      const mediaBody = Readable.from(buffer);

      const createRes = await this.executeWithRetry(() =>
        drive.files.create({
          requestBody: {
            name: params.fileName,
            parents: params.folderId ? [params.folderId] : undefined,
            description: params.description || `Burra Pariksha asset upload: ${params.fileName}`,
          },
          media: {
            mimeType: params.mimeType,
            body: mediaBody,
          },
          fields: 'id, name, mimeType, size, webViewLink, createdTime',
        })
      );

      const file = createRes.data;
      if (!file.id) {
        throw new Error(`Google Drive file upload failed for "${params.fileName}".`);
      }

      return {
        fileId: file.id,
        name: file.name || params.fileName,
        mimeType: file.mimeType || params.mimeType,
        size: file.size ? Number(file.size) : buffer.length,
        webViewLink: file.webViewLink || undefined,
        createdTime: file.createdTime || new Date().toISOString(),
        folderId: params.folderId,
      };
    } catch (err: any) {
      console.error(`[GoogleDriveService] Drive uploadFile failed for "${params.fileName}":`, err?.message || err);
      throw err;
    }
  }

  /**
   * Retrieves file metadata from Google Drive.
   */
  public async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    if (!fileId) {
      throw new ValidationError('Drive File ID is required.');
    }

    if (!this.isConfigured()) {
      throw new GoogleAuthError('Google Drive integration is not configured or unavailable in this environment.');
    }

    try {
      const drive = this.getDriveApi();
      const res = await this.executeWithRetry(() =>
        drive.files.get({
          fileId,
          fields: 'id, name, mimeType, size, webViewLink, createdTime, parents',
        })
      );

      const file = res.data;
      return {
        fileId: file.id!,
        name: file.name || 'unnamed',
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size ? Number(file.size) : 0,
        webViewLink: file.webViewLink || undefined,
        createdTime: file.createdTime || undefined,
        folderId: file.parents && file.parents.length > 0 ? file.parents[0] : undefined,
      };
    } catch (err: any) {
      console.error(`[GoogleDriveService] Drive getFileMetadata failed for "${fileId}":`, err?.message || err);
      throw err;
    }
  }

  /**
   * Streams or downloads binary content from Google Drive with optional HTTP Range header support.
   */
  public async downloadFile(fileId: string, rangeHeader?: string): Promise<DriveDownloadResult> {
    if (!fileId) {
      throw new ValidationError('Drive File ID is required for download.');
    }

    if (!this.isConfigured()) {
      throw new GoogleAuthError('Google Drive integration is not configured or unavailable in this environment.');
    }

    try {
      const drive = this.getDriveApi();
      const headers: Record<string, string> = {};
      if (rangeHeader) {
        headers['Range'] = rangeHeader;
      }

      const res = await this.executeWithRetry(() =>
        drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream', headers }
        )
      );

      const contentType = (res.headers['content-type'] as string) || 'application/octet-stream';
      const contentLength = res.headers['content-length']
        ? Number(res.headers['content-length'])
        : undefined;
      const contentRange = (res.headers['content-range'] as string) || undefined;
      const statusCode = res.status || (rangeHeader ? 206 : 200);

      return {
        stream: res.data as Readable,
        contentType,
        contentLength,
        contentRange,
        statusCode,
      };
    } catch (err: any) {
      console.error(`[GoogleDriveService] Drive downloadFile failed for "${fileId}":`, err?.message || err);
      throw err;
    }
  }

  /**
   * Permanently deletes a file from Drive (strictly for temporary/test cleanup or rollback).
   * Propagates errors on Drive API failure so callers cannot mistakenly report success.
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    if (!fileId) return false;
    if (!this.isConfigured()) {
      throw new GoogleAuthError('Google Drive integration is not configured or unavailable in this environment.');
    }

    try {
      const drive = this.getDriveApi();
      await drive.files.delete({ fileId });
      return true;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`[GoogleDriveService] Drive deleteFile failed for "${fileId}": ${msg}`);
      throw new Error(`Drive deleteFile failed for "${fileId}": ${msg}`);
    }
  }

  /**
   * Lists all Drive folders and files specifically belonging to a content ID hierarchy.
   */
  public async listContentFoldersAndFiles(contentId: string): Promise<
    Array<{
      id: string;
      name: string;
      mimeType: string;
      parents?: string[];
      isFolder: boolean;
      path: string;
    }>
  > {
    const results: Array<{
      id: string;
      name: string;
      mimeType: string;
      parents?: string[];
      isFolder: boolean;
      path: string;
    }> = [];

    if (!contentId || !this.isConfigured()) {
      return results;
    }

    try {
      const drive = this.getDriveApi();
      const safeId = contentId.replace(/'/g, "\\'");
      const res = await drive.files.list({
        q: `name = '${safeId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, mimeType, parents)',
      });

      const rootFolders = res.data.files || [];
      for (const root of rootFolders) {
        results.push({
          id: root.id!,
          name: root.name!,
          mimeType: root.mimeType || 'application/vnd.google-apps.folder',
          parents: root.parents || undefined,
          isFolder: true,
          path: `/${root.name}`,
        });

        // 1st level subfolders/files (e.g. Videos, Scripts, Thumbnails, Raw, Edited, Final)
        const subRes = await drive.files.list({
          q: `'${root.id}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, parents)',
        });

        for (const sub of subRes.data.files || []) {
          const isFolder = sub.mimeType === 'application/vnd.google-apps.folder';
          results.push({
            id: sub.id!,
            name: sub.name!,
            mimeType: sub.mimeType || '',
            parents: sub.parents || undefined,
            isFolder,
            path: `/${root.name}/${sub.name}`,
          });

          if (isFolder) {
            // 2nd level files (e.g. /Videos/vd1.1.mp4)
            const leafRes = await drive.files.list({
              q: `'${sub.id}' in parents and trashed = false`,
              fields: 'files(id, name, mimeType, parents)',
            });
            for (const leaf of leafRes.data.files || []) {
              results.push({
                id: leaf.id!,
                name: leaf.name!,
                mimeType: leaf.mimeType || '',
                parents: leaf.parents || undefined,
                isFolder: leaf.mimeType === 'application/vnd.google-apps.folder',
                path: `/${root.name}/${sub.name}/${leaf.name}`,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[GoogleDriveService] listContentFoldersAndFiles warning for "${contentId}":`, err?.message || err);
    }

    return results;
  }
}

export const googleDriveService = GoogleDriveService.getInstance();
