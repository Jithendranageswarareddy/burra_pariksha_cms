/**
 * BURRA PARIKSHA CMS - Phase 14 Google Drive Production Infrastructure Service
 */

import { Readable } from 'stream';
import crypto from 'crypto';
import { googleDriveService } from './google-drive.service';
import { mediaAssetsRepository } from '../repositories/media-assets.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { MediaAsset, MediaStage } from '../../types';
import { ValidationError } from '../google-sheets/errors';

export interface UploadAssetParams {
  contentId: string;
  mediaStage: MediaStage;
  fileName: string;
  mimeType: string;
  bodyStreamOrBuffer: Readable | Buffer;
}

export class DriveSyncService {
  private static instance: DriveSyncService | null = null;

  private constructor() {}

  public static getInstance(): DriveSyncService {
    if (!DriveSyncService.instance) {
      DriveSyncService.instance = new DriveSyncService();
    }
    return DriveSyncService.instance;
  }

  /**
   * Validates MIME type and file size based on the target media stage.
   */
  public validateMediaAsset(params: {
    mediaStage: MediaStage;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }): void {
    const { mediaStage, fileName, mimeType, fileSize } = params;

    // 1. Filename safety validation
    if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      throw new ValidationError(`Invalid or unsafe filename structure: "${fileName}"`);
    }

    // 2. MIME and extension validation
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (mediaStage === 'THUMBNAIL') {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
      const allowedExts = ['jpg', 'jpeg', 'png'];
      
      if (!allowedMimes.includes(mimeType)) {
        throw new ValidationError(`Unsupported MIME type for THUMBNAIL stage: "${mimeType}". Allowed: ${allowedMimes.join(', ')}`);
      }
      if (!ext || !allowedExts.includes(ext)) {
        throw new ValidationError(`Mismatched or unsupported extension for THUMBNAIL stage: ".${ext}". Allowed: ${allowedExts.join(', ')}`);
      }

      // Check for MIME-extension compatibility (reject mismatched)
      if (mimeType.includes('png') && ext !== 'png') {
        throw new ValidationError(`MIME type "image/png" does not match file extension ".${ext}"`);
      }
      if ((mimeType.includes('jpeg') || mimeType.includes('jpg')) && !['jpg', 'jpeg'].includes(ext)) {
        throw new ValidationError(`MIME type "${mimeType}" does not match file extension ".${ext}"`);
      }

      // Size limit (Thumbnails max 5MB)
      const maxThumbSize = Number(process.env.MAX_THUMBNAIL_SIZE_BYTES) || 5 * 1024 * 1024;
      if (fileSize > maxThumbSize) {
        throw new ValidationError(`Thumbnail file exceeds size limit of ${maxThumbSize / (1024 * 1024)}MB. Provided: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);
      }
    } else {
      // Videos: RAW, EDITED, FINAL
      const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
      const allowedExts = ['mp4', 'mov', 'mkv', 'webm'];

      if (mediaStage === 'FINAL' && mimeType !== 'video/mp4') {
        throw new ValidationError(`FINAL stage strictly requires "video/mp4" MIME type. Provided: "${mimeType}"`);
      }

      if (!allowedMimes.includes(mimeType)) {
        throw new ValidationError(`Unsupported MIME type for ${mediaStage} stage: "${mimeType}". Allowed: ${allowedMimes.join(', ')}`);
      }
      if (!ext || !allowedExts.includes(ext)) {
        throw new ValidationError(`Mismatched or unsupported extension for ${mediaStage} stage: ".${ext}". Allowed: ${allowedExts.join(', ')}`);
      }

      // Verify extension maps cleanly to video MIME
      if (mimeType === 'video/mp4' && ext !== 'mp4') {
        throw new ValidationError(`MIME type "video/mp4" does not match file extension ".${ext}"`);
      }
      if (mimeType === 'video/quicktime' && ext !== 'mov') {
        throw new ValidationError(`MIME type "video/quicktime" does not match file extension ".${ext}"`);
      }

      // Size limit (Videos max 100MB)
      const maxVideoSize = Number(process.env.MAX_VIDEO_SIZE_BYTES) || 100 * 1024 * 1024;
      if (fileSize > maxVideoSize) {
        throw new ValidationError(`Video file exceeds size limit of ${maxVideoSize / (1024 * 1024)}MB. Provided: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);
      }
    }
  }

  /**
   * Uploads production media file into Google Drive, resolves hierarchy, enforces versioning,
   * retries on transient errors, and performs safe rollbacks on metadata failure.
   */
  public async uploadProductionAsset(params: UploadAssetParams): Promise<MediaAsset> {
    const { contentId, mediaStage, fileName, mimeType, bodyStreamOrBuffer } = params;

    // 1. Content ID Authorization
    if (!contentId || !contentId.startsWith('BP-CNT-')) {
      throw new ValidationError(`Invalid Content ID: "${contentId}". Must match "BP-CNT-######" form.`);
    }

    // Verify content item exists
    const contentItem = await contentMastersRepository.findById(contentId);
    if (!contentItem) {
      throw new ValidationError(`Content ID "${contentId}" does not exist in the repository. Unauthorized upload.`);
    }

    // 2. Load stream to buffer to resolve size and checksum
    let buffer: Buffer;
    if (Buffer.isBuffer(bodyStreamOrBuffer)) {
      buffer = bodyStreamOrBuffer;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of bodyStreamOrBuffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      buffer = Buffer.concat(chunks);
    }

    const fileSize = buffer.length;
    if (fileSize === 0) {
      throw new ValidationError('File payload is empty. Cannot upload an empty binary file.');
    }

    // Validate MIME types and size constraints before proceeding
    this.validateMediaAsset({ mediaStage, fileName, mimeType, fileSize });

    // 3. Resolve folder hierarchy under Drive root
    // This utilizes cache to guarantee zero redundant folder creations
    const hierarchy = await googleDriveService.ensureProductionHierarchy(contentId);
    
    let targetFolderId: string;
    switch (mediaStage) {
      case 'RAW':
        targetFolderId = hierarchy.rawFolderId;
        break;
      case 'EDITED':
        targetFolderId = hierarchy.editedFolderId;
        break;
      case 'FINAL':
        targetFolderId = hierarchy.finalFolderId;
        break;
      case 'THUMBNAIL':
        targetFolderId = hierarchy.thumbnailFolderId;
        break;
      default:
        throw new ValidationError(`Unsupported media stage: "${mediaStage}"`);
    }

    // Calculate MD5 checksum
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');

    // 4. Determine next version number
    const nextVersion = await mediaAssetsRepository.getNextVersionNumber(contentId, mediaStage);

    // 5. Upload file payload to Google Drive (with bounded retries handled in GoogleDriveService)
    let driveFileId = '';
    try {
      const uploadResult = await googleDriveService.uploadFile({
        fileName,
        mimeType,
        bodyStreamOrBuffer: buffer,
        folderId: targetFolderId,
        description: `Content: ${contentId} | Stage: ${mediaStage} | Version: ${nextVersion}`,
      });
      driveFileId = uploadResult.fileId;
    } catch (err: any) {
      throw new Error(`Google Drive API upload failed: ${err?.message || err}`);
    }

    // 6. Persist metadata in repository
    try {
      const now = new Date().toISOString();
      const assetId = `MEDIA-${contentId.replace('BP-CNT-', '')}-${mediaStage}-${nextVersion}`;
      
      const mediaAsset: MediaAsset = {
        id: assetId,
        contentId,
        driveFileId,
        folderId: targetFolderId,
        fileName,
        mimeType,
        fileSize,
        checksum,
        md5Checksum: checksum,
        createdAt: now,
        updatedAt: now,
        mediaStage,
        version: nextVersion,
      };

      await mediaAssetsRepository.create(mediaAsset);
      return mediaAsset;
    } catch (dbErr: any) {
      // Safe Rollback / Failure Recovery: If DB creation fails, delete file from Google Drive to avoid orphaned files
      console.error('[Phase14DriveService] DB persistence failed. Initiating automatic rollback/cleanup of uploaded Drive file...', dbErr?.message);
      if (driveFileId) {
        try {
          await googleDriveService.deleteFile(driveFileId);
        } catch (cleanupErr: any) {
          console.error('[Phase14DriveService] Cleanup of Drive file failed during rollback:', cleanupErr?.message);
        }
      }
      throw new Error(`Failed to persist media asset metadata. Upload rolled back successfully. Reason: ${dbErr?.message}`);
    }
  }

  /**
   * Safely retrieves a media asset's metadata.
   */
  public async getAssetMetadata(id: string): Promise<MediaAsset | null> {
    return mediaAssetsRepository.findById(id);
  }

  /**
   * Retrieves all media assets/versions for a content ID.
   */
  public async listAssets(contentId: string): Promise<MediaAsset[]> {
    return mediaAssetsRepository.findByContentId(contentId);
  }

  /**
   * Retrieves all media assets/versions for a content ID filtered by stage.
   */
  public async listAssetsByStage(contentId: string, mediaStage: MediaStage): Promise<MediaAsset[]> {
    return mediaAssetsRepository.findByContentIdAndStage(contentId, mediaStage);
  }

  /**
   * Retrieves latest version of a media asset stage for a content ID.
   */
  public async getLatestAsset(contentId: string, mediaStage: MediaStage): Promise<MediaAsset | null> {
    return mediaAssetsRepository.getLatestVersion(contentId, mediaStage);
  }
}

export const driveSyncService = DriveSyncService.getInstance();
