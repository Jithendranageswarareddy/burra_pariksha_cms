/**
 * BURRA PARIKSHA CMS — Media Storage & Reference Architecture Guard
 * Stage 04 Architecture Enforcement: AP-007 & AP-008
 *
 * AP-007: Media binaries remain external to application database.
 * AP-008: Media references belong to application data model.
 */

export interface MediaAssetMetadataInput {
  id?: string;
  entityId: string;
  entityType: string;
  driveFileId?: string;
  driveFolderId?: string;
  externalUrl?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes?: number;
  byteSize?: number;
  rawBinaryData?: unknown;
  [key: string]: unknown;
}

export interface MediaGuardValidationResult {
  valid: boolean;
  isValid: boolean;
  error?: string;
  violatedPrinciple?: 'AP-007' | 'AP-008';
}

/**
 * Validates that media asset records conform strictly to metadata and reference-only models.
 * Binary buffers and large base64 data payloads are prohibited from database models.
 */
export function validateMediaAssetMetadata(
  input: MediaAssetMetadataInput
): MediaGuardValidationResult {
  // AP-007: Media Binaries External to Database
  if (input.rawBinaryData !== undefined && input.rawBinaryData !== null) {
    return {
      valid: false,
      isValid: false,
      error: 'AP-007 Violation: Raw binary media data cannot be stored in application database models.',
      violatedPrinciple: 'AP-007',
    };
  }

  // Check for embedded base64 data strings in text properties
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      if (
        value.startsWith('data:image/') ||
        value.startsWith('data:video/') ||
        value.startsWith('data:application/') ||
        (value.length > 65536 && /^[A-Za-z0-9+/=]+$/.test(value.slice(0, 100)))
      ) {
        return {
          valid: false,
          isValid: false,
          error: `AP-007 Violation: Field "${key}" contains base64/binary media payload. Binaries must remain in external storage.`,
          violatedPrinciple: 'AP-007',
        };
      }
    }
  }

  // AP-008: Media References Belong to Application Data Model
  if (!input.entityId || input.entityId.trim() === '') {
    return {
      valid: false,
      isValid: false,
      error: 'AP-008 Violation: Media asset record must be linked to an authoritative entityId.',
      violatedPrinciple: 'AP-008',
    };
  }

  if (!input.entityType || input.entityType.trim() === '') {
    return {
      valid: false,
      isValid: false,
      error: 'AP-008 Violation: Media asset record must specify an authoritative entityType.',
      violatedPrinciple: 'AP-008',
    };
  }

  const hasDriveRef = input.driveFileId && input.driveFileId.trim() !== '';
  const hasExternalRef = input.externalUrl && input.externalUrl.trim() !== '';

  if (!hasDriveRef && !hasExternalRef) {
    return {
      valid: false,
      isValid: false,
      error: 'AP-008 Violation: Media asset record must maintain a valid external reference (driveFileId or externalUrl).',
      violatedPrinciple: 'AP-008',
    };
  }

  return { valid: true, isValid: true };
}
