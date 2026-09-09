import { Video, RenderValidationStatus, VideoProductionStatus, CanonicalProductionReadiness } from '../../types';

export class ProductionAssetValidationService {
  /**
   * Deterministic logic for mapping a video and its publish readiness to the canonical read-model
   * status (A to F):
   * A. RENDER_NOT_STARTED
   * B. RENDER_METADATA_INCOMPLETE
   * C. RENDER_INVALID
   * D. RENDER_VALID_BUT_EDITING
   * E. EDITING_COMPLETE
   * F. READY_FOR_PUBLISHING
   */
  public static determineReadiness(
    video: {
      status: VideoProductionStatus;
      finalRenderWidth?: number | null;
      finalRenderHeight?: number | null;
      finalRenderFormat?: string | null;
      finalRenderAspectRatio?: string | null;
      actualDurationSeconds?: number | null;
      targetDurationSeconds?: number | null;
      finalRenderPath?: string | null;
    },
    publishReadiness?: { isReady: boolean } | null
  ): CanonicalProductionReadiness {
    const validation = this.validateMetadata(video);

    if (validation.status === RenderValidationStatus.NOT_VALIDATED) {
      return CanonicalProductionReadiness.RENDER_NOT_STARTED;
    }

    const hasAllFields = Boolean(
      video.finalRenderPath && video.finalRenderPath.trim() !== '' &&
      video.finalRenderWidth !== undefined && video.finalRenderWidth !== null && !isNaN(Number(video.finalRenderWidth)) &&
      video.finalRenderHeight !== undefined && video.finalRenderHeight !== null && !isNaN(Number(video.finalRenderHeight)) &&
      video.finalRenderFormat && video.finalRenderFormat.trim() !== '' &&
      video.finalRenderAspectRatio && video.finalRenderAspectRatio.trim() !== '' &&
      video.actualDurationSeconds !== undefined && video.actualDurationSeconds !== null && !isNaN(Number(video.actualDurationSeconds))
    );

    if (validation.status === RenderValidationStatus.INVALID) {
      if (!hasAllFields) {
        return CanonicalProductionReadiness.RENDER_METADATA_INCOMPLETE;
      }
      return CanonicalProductionReadiness.RENDER_INVALID;
    }

    if (validation.status === RenderValidationStatus.VALID) {
      if (video.status === VideoProductionStatus.EDITING) {
        return CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING;
      }

      if (
        (video.status === VideoProductionStatus.READY_TO_UPLOAD || video.status === VideoProductionStatus.UPLOADED) &&
        publishReadiness?.isReady
      ) {
        return CanonicalProductionReadiness.READY_FOR_PUBLISHING;
      }

      return CanonicalProductionReadiness.EDITING_COMPLETE;
    }

    return CanonicalProductionReadiness.RENDER_NOT_STARTED;
  }

  /**
   * Deterministic metadata validation for short-form vertical video renders.
   * Performs only logical/business rules checks on metadata, not physical file analysis.
   */
  public static validateMetadata(video: {
    finalRenderWidth?: number | null;
    finalRenderHeight?: number | null;
    finalRenderFormat?: string | null;
    finalRenderAspectRatio?: string | null;
    actualDurationSeconds?: number | null;
    targetDurationSeconds?: number | null;
    finalRenderPath?: string | null;
  }): {
    status: RenderValidationStatus;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const {
      finalRenderWidth,
      finalRenderHeight,
      finalRenderFormat,
      finalRenderAspectRatio,
      actualDurationSeconds,
      targetDurationSeconds,
      finalRenderPath,
    } = video;

    // By design: if there is no finalRenderPath and no metadata is supplied,
    // it's simply NOT_VALIDATED.
    const hasAnyMetadata =
      (finalRenderPath && finalRenderPath.trim() !== '') ||
      (finalRenderWidth !== undefined && finalRenderWidth !== null) ||
      (finalRenderHeight !== undefined && finalRenderHeight !== null) ||
      (finalRenderFormat !== undefined && finalRenderFormat !== null) ||
      (finalRenderAspectRatio !== undefined && finalRenderAspectRatio !== null) ||
      (actualDurationSeconds !== undefined && actualDurationSeconds !== null);

    if (!hasAnyMetadata) {
      return {
        status: RenderValidationStatus.NOT_VALIDATED,
        errors: [],
        warnings: [],
      };
    }

    // 1. Dimensions validation
    if (finalRenderWidth === undefined || finalRenderWidth === null || isNaN(Number(finalRenderWidth)) || Number(finalRenderWidth) <= 0) {
      errors.push('Width must be a positive integer.');
    }
    if (finalRenderHeight === undefined || finalRenderHeight === null || isNaN(Number(finalRenderHeight)) || Number(finalRenderHeight) <= 0) {
      errors.push('Height must be a positive integer.');
    }

    // 2. Vertical Orientation Check (height must exceed width)
    if (finalRenderWidth && finalRenderHeight) {
      const w = Number(finalRenderWidth);
      const h = Number(finalRenderHeight);
      if (h <= w) {
        errors.push('Height must exceed width for vertical video (landscape video rejected).');
      }
    }

    // 3. Aspect Ratio Validation (compatible with 9:16)
    if (finalRenderWidth && finalRenderHeight) {
      const w = Number(finalRenderWidth);
      const h = Number(finalRenderHeight);
      const ratio = w / h;
      const targetRatio = 9 / 16;
      // Allow minor floating point tolerances (e.g. 0.02)
      if (Math.abs(ratio - targetRatio) > 0.02) {
        errors.push(`Aspect ratio is not compatible with 9:16 (tolerance +/- 0.02).`);
      }
    }

    // 4. Format Validation
    const allowedFormats = ['MP4', 'MOV', 'M4V'];
    if (!finalRenderFormat) {
      errors.push('Format must be provided.');
    } else {
      const formatUpper = finalRenderFormat.trim().toUpperCase();
      if (!allowedFormats.includes(formatUpper)) {
        errors.push(`Format "${finalRenderFormat}" is not supported. Supported: MP4, MOV, M4V.`);
      }
    }

    // 5. Duration Check (positive and conforms to rules)
    if (actualDurationSeconds === undefined || actualDurationSeconds === null || isNaN(Number(actualDurationSeconds)) || Number(actualDurationSeconds) <= 0) {
      errors.push('Actual duration must be positive when final render is submitted.');
    } else {
      const duration = Number(actualDurationSeconds);
      
      // MAXIMUM-DURATION POLICY: DEFERRED
      // No canonical maximum-duration policy of 60 seconds exists in the business rules.
      // Do not invent a hard 60-second maximum limit here.

      // Comparison with target duration
      if (targetDurationSeconds && targetDurationSeconds > 0) {
        const target = Number(targetDurationSeconds);
        if (duration > target) {
          warnings.push(`Actual duration of ${duration}s exceeds configured target duration of ${target}s.`);
        }
      }
    }

    const status = errors.length > 0 ? RenderValidationStatus.INVALID : RenderValidationStatus.VALID;

    return {
      status,
      errors,
      warnings,
    };
  }
}
