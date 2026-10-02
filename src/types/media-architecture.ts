/**
 * BURRA PARIKSHA CMS — Stage 14 Media Architecture
 *
 * Implements the authoritative tri-layer media architecture:
 * BP-CMS
 * │
 * ├── Metadata (Firestore Native Mode)
 * │
 * ├── Google Drive (Active Media Binaries)
 * │
 * └── External Archive (Cold / Preservation Media)
 *
 * Strictly adheres to provider independence (AP-007 / AP-008):
 * - Zero binary payload stored in Firestore
 * - Metadata, SHA-256 hashes, and abstract references in CMS
 * - Active binaries in Google Drive
 * - Deep archival storage in Google Cloud Storage (Coldline)
 */

import { z } from 'zod';

// ============================================================================
// 1. CANONICAL MEDIA TYPES & MIME FORMATS
// ============================================================================

export enum MediaType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export const MEDIA_TYPES = Object.values(MediaType);

export enum CanonicalMimeType {
  // Image (9:16 vertical thumbnails, formulas, math diagrams)
  IMAGE_PNG = 'image/png',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_WEBP = 'image/webp',

  // Audio (Scratch audio, teleprompter tracks, voiceovers)
  AUDIO_WAV = 'audio/wav',
  AUDIO_MPEG = 'audio/mpeg',
  AUDIO_AAC = 'audio/aac',

  // Video (Studio filming camera takes, rendered MP4 master cuts)
  VIDEO_MP4 = 'video/mp4',
  VIDEO_QUICKTIME = 'video/quicktime',

  // Document (Syllabus, LaTeX sheets, teleprompter copy, audit manifests)
  DOCUMENT_PDF = 'application/pdf',
  DOCUMENT_PLAIN = 'text/plain',
  DOCUMENT_JSON = 'application/json',
}

export const CANONICAL_MIME_TYPES = Object.values(CanonicalMimeType);

export const MEDIA_TYPE_TO_MIMES_MAP: Record<MediaType, readonly CanonicalMimeType[]> = {
  [MediaType.IMAGE]: [
    CanonicalMimeType.IMAGE_PNG,
    CanonicalMimeType.IMAGE_JPEG,
    CanonicalMimeType.IMAGE_WEBP,
  ],
  [MediaType.AUDIO]: [
    CanonicalMimeType.AUDIO_WAV,
    CanonicalMimeType.AUDIO_MPEG,
    CanonicalMimeType.AUDIO_AAC,
  ],
  [MediaType.VIDEO]: [
    CanonicalMimeType.VIDEO_MP4,
    CanonicalMimeType.VIDEO_QUICKTIME,
  ],
  [MediaType.DOCUMENT]: [
    CanonicalMimeType.DOCUMENT_PDF,
    CanonicalMimeType.DOCUMENT_PLAIN,
    CanonicalMimeType.DOCUMENT_JSON,
  ],
};

// ============================================================================
// 2. MEDIA LIFECYCLE & PROCESSING STATES (STAGE 08 ALIGNMENT)
// ============================================================================

export enum MediaProcessingState {
  UNPROCESSED = 'UNPROCESSED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
}

export enum MediaArchiveState {
  HOT_ACTIVE = 'HOT_ACTIVE',
  STAGED_FOR_ARCHIVE = 'STAGED_FOR_ARCHIVE',
  ARCHIVING = 'ARCHIVING',
  COLD_ARCHIVED = 'COLD_ARCHIVED',
  RESTORE_IN_PROGRESS = 'RESTORE_IN_PROGRESS',
}

export const MEDIA_ARCHIVE_STATES = Object.values(MediaArchiveState);

// ============================================================================
// 3. MEDIA IDENTIFIERS REGEX
// ============================================================================

export const MEDIA_ID_PATTERNS = {
  MEDIA_ASSET: /^MED-[0-9]{6}$/,
  DRIVE_REFERENCE: /^REF-[0-9]{6}$/,
  ARCHIVE_REFERENCE: /^ARC-[0-9]{6}$/,
  USER_ID: /^USR-[0-9]{6}$/,
  SHA256_HASH: /^[a-f0-9]{64}$/,
};

// ============================================================================
// 4. PROVIDER-INDEPENDENT REFERENCE CONTRACTS
// ============================================================================

// 4.1 MediaAsset (Firestore Metadata Entity)
export const MediaAssetSchema = z.object({
  id: z.string().regex(MEDIA_ID_PATTERNS.MEDIA_ASSET),
  name: z.string().min(1),
  mediaType: z.nativeEnum(MediaType),
  mimeType: z.nativeEnum(CanonicalMimeType),
  sizeBytes: z.number().int().positive(),
  sha256Hash: z.string().regex(MEDIA_ID_PATTERNS.SHA256_HASH),
  ownerUserId: z.string().regex(MEDIA_ID_PATTERNS.USER_ID),
  processingState: z.nativeEnum(MediaProcessingState),
  archiveState: z.nativeEnum(MediaArchiveState),
  activeDriveReferenceId: z.string().regex(MEDIA_ID_PATTERNS.DRIVE_REFERENCE).nullable(),
  activeArchiveReferenceId: z.string().regex(MEDIA_ID_PATTERNS.ARCHIVE_REFERENCE).nullable(),
  isQuarantined: z.boolean().default(false),
  version: z.number().int().positive().default(1),
  isDeleted: z.boolean().default(false),
  deletedAt: z.string().datetime().nullable().default(null),
  deletedBy: z.string().regex(MEDIA_ID_PATTERNS.USER_ID).nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;

// 4.2 DriveReference (Active Media Locator in Google Drive)
export const DriveReferenceSchema = z.object({
  id: z.string().regex(MEDIA_ID_PATTERNS.DRIVE_REFERENCE),
  mediaAssetId: z.string().regex(MEDIA_ID_PATTERNS.MEDIA_ASSET),
  driveFileId: z.string().min(5),
  driveFolderId: z.string().min(5),
  folderHierarchyPath: z.string().min(1), // e.g. '/BP-Production/2026-W40/Takes/'
  webViewLink: z.string().url(),
  webContentLink: z.string().url(),
  isAccessible: z.boolean(),
  isQuarantined: z.boolean().default(false),
  quarantineReason: z.string().nullable().default(null),
  lastVerifiedAt: z.string().datetime(),
});

export type DriveReference = z.infer<typeof DriveReferenceSchema>;

// 4.3 ArchiveReference (Cold Storage Preservation Locator in GCS Coldline)
export const ArchiveReferenceSchema = z.object({
  id: z.string().regex(MEDIA_ID_PATTERNS.ARCHIVE_REFERENCE),
  mediaAssetId: z.string().regex(MEDIA_ID_PATTERNS.MEDIA_ASSET),
  archiveProvider: z.enum(['GCS_COLDLINE', 'EXTERNAL_ARCHIVE']),
  bucketName: z.string().min(3),
  objectPath: z.string().min(3),
  archiveSha256: z.string().regex(MEDIA_ID_PATTERNS.SHA256_HASH),
  manifestId: z.string().min(3),
  archivedAt: z.string().datetime(),
  restoredAt: z.string().datetime().nullable().default(null),
});

export type ArchiveReference = z.infer<typeof ArchiveReferenceSchema>;

// ============================================================================
// 5. ARCHIVE VERIFICATION & INTEGRITY HELPERS
// ============================================================================

/**
 * Validates cryptographic checksum matching between active Google Drive file
 * and cold archive storage before allowing Google Drive binary retirement.
 */
export function verifyArchiveIntegrity(activeHash: string, archiveHash: string): boolean {
  if (!activeHash || !archiveHash) {
    throw new Error('[CORRUPTED_ARCHIVE_ABORT] Missing hash for archive verification.');
  }

  const normalizedActive = activeHash.trim().toLowerCase();
  const normalizedArchive = archiveHash.trim().toLowerCase();

  if (normalizedActive !== normalizedArchive) {
    throw new Error(
      `[CORRUPTED_ARCHIVE_ABORT] Hash mismatch between active media (${normalizedActive}) and archive (${normalizedArchive}). Drive binary retirement blocked.`
    );
  }

  return true;
}

// ============================================================================
// 6. BROKEN REFERENCE HANDLING & QUARANTINE PROTOCOL
// ============================================================================

export interface BrokenReferenceResolutionResult {
  quarantinedReference: DriveReference;
  fallbackPlaceholderUri: string;
  alertNotificationPayload: {
    alertType: 'BROKEN_MEDIA_REFERENCE';
    mediaAssetId: string;
    driveFileId: string;
    reason: string;
    timestamp: string;
  };
}

/**
 * Handles unreachable or missing Google Drive files by quarantining the reference,
 * providing safe UI fallback assets, and generating high-priority operational alerts.
 */
export function handleBrokenReference(
  ref: DriveReference,
  reason: string = 'File inaccessible or permission revoked in Google Drive'
): BrokenReferenceResolutionResult {
  const quarantinedReference: DriveReference = {
    ...ref,
    isAccessible: false,
    isQuarantined: true,
    quarantineReason: reason,
    lastVerifiedAt: new Date().toISOString(),
  };

  const fallbackPlaceholderUri = '/assets/placeholders/media-unavailable-placeholder.svg';

  const alertNotificationPayload = {
    alertType: 'BROKEN_MEDIA_REFERENCE' as const,
    mediaAssetId: ref.mediaAssetId,
    driveFileId: ref.driveFileId,
    reason,
    timestamp: new Date().toISOString(),
  };

  return {
    quarantinedReference,
    fallbackPlaceholderUri,
    alertNotificationPayload,
  };
}

// ============================================================================
// 7. RESTORE PROCESS CONTRACT
// ============================================================================

export interface RestoreMediaRequest {
  mediaAssetId: string;
  requestedByUserId: string;
  destinationDriveFolderId: string;
}

export interface RestoreMediaResult {
  mediaAssetId: string;
  newArchiveState: MediaArchiveState;
  rehydratedDriveReferenceId: string;
  restoredAt: string;
  auditEventId: string;
}

/**
 * Transitions media asset lifecycle state from COLD_ARCHIVED to RESTORE_IN_PROGRESS
 */
export function initiateMediaRestore(
  asset: MediaAsset,
  actorUserId: string
): { updatedAsset: MediaAsset; auditAction: string } {
  if (asset.archiveState !== MediaArchiveState.COLD_ARCHIVED) {
    throw new Error(
      `[RESTORE_STATE_INVALID] Media asset ${asset.id} is in state ${asset.archiveState}; restore requires COLD_ARCHIVED.`
    );
  }

  const updatedAsset: MediaAsset = {
    ...asset,
    archiveState: MediaArchiveState.RESTORE_IN_PROGRESS,
    updatedAt: new Date().toISOString(),
    version: asset.version + 1,
  };

  return {
    updatedAsset,
    auditAction: 'MEDIA_RESTORE_INITIATED',
  };
}
