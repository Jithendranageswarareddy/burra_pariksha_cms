/**
 * BURRA PARIKSHA CMS - Media Upload Configuration & Validation
 * Phase 7: Google Drive Real Media Infrastructure
 */

import { ValidationError } from '../lib/errors';

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
] as const;

export const ALLOWED_THUMBNAIL_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_MEDIA_MIME_TYPES = [
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_THUMBNAIL_MIME_TYPES,
] as const;

export const ALLOWED_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.mkv',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB default

/**
 * Sanitizes input filenames to block path traversal, control chars, and null bytes.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed_asset';
  }

  // Remove null bytes and directory traversal constructs
  let cleaned = fileName.replace(/\0/g, '').replace(/\\/g, '/');
  const baseName = cleaned.split('/').pop() || 'unnamed_asset';

  // Strip non-printable ascii or dangerous chars, preserve safe dots/dashes/underscores
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.length > 0 ? sanitized : 'unnamed_asset';
}

/**
 * Validates file upload parameters against allowed MIME types, extensions, and max file size.
 */
export function validateMediaUpload(params: {
  fileName: string;
  mimeType: string;
  size: number;
  category?: 'video' | 'thumbnail' | 'any';
}): { sanitizedFileName: string } {
  const { fileName, mimeType, size, category = 'video' } = params;

  if (!fileName || typeof fileName !== 'string') {
    throw new ValidationError('Invalid filename provided for upload.');
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const ext = '.' + sanitizedFileName.split('.').pop()?.toLowerCase();

  // 1. File extension validation
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ValidationError(
      `Unsupported file extension "${ext}". Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}.`
    );
  }

  // 2. Category-specific MIME type validation
  const allowedMimes =
    category === 'video'
      ? ALLOWED_VIDEO_MIME_TYPES
      : category === 'thumbnail'
      ? ALLOWED_THUMBNAIL_MIME_TYPES
      : ALLOWED_MEDIA_MIME_TYPES;

  if (!(allowedMimes as readonly string[]).includes(mimeType)) {
    throw new ValidationError(
      `Unsupported MIME type "${mimeType}". Allowed MIME types for ${category}: ${allowedMimes.join(', ')}.`
    );
  }

  // 3. File size validation
  if (size <= 0) {
    throw new ValidationError('Uploaded file is empty (0 bytes).');
  }

  if (size > MAX_VIDEO_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size (${(size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${
        MAX_VIDEO_FILE_SIZE_BYTES / (1024 * 1024)
      } MB.`
    );
  }

  return { sanitizedFileName };
}
