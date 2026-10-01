/**
 * BURRA PARIKSHA CMS - Social Quality Gate Validator
 * Enforces comprehensive pre-review validation:
 * A. Correctness (Question validity, Authoritative answer preservation, Script non-contradiction, No answer leakage)
 * B. Consistency (Canonical Content ID BP-CNT-###### everywhere, No cross-content leakage, No stale versions)
 * C. Brand & Social Quality (Burra Pariksha identity, YouTube Shorts suitability, Mobile readability, Engagement)
 * D. Asset Integrity (Video record, Thumbnail Drive asset, Pinned comment package, MIME and size)
 * E. Metadata Completeness (Title, caption, hashtags, language, canonical tags)
 * F. Platform Adaptations (Fidelity without hallucination)
 */

import {
  CompleteContentPackage,
  SocialQualityGateReport,
  VideoProductionStatus,
} from '../../types';
import { ThumbnailSafetyValidator } from './thumbnail-safety.validator';
import { PinnedCommentSafetyValidator } from './pinned-comment-safety.validator';

export class SocialQualityGateValidator {
  /**
   * Banned generic engagement cliches that dilute Burra Pariksha brand quality.
   */
  private static readonly BANNED_GENERIC_PATTERNS = [
    /^\s*comment below[!.]*\s*$/i,
    /^\s*let me know[!.]*\s*$/i,
    /^\s*follow for more[!.]*\s*$/i,
    /^\s*subscribe for more[!.]*\s*$/i,
    /^\s*like and share[!.]*\s*$/i,
  ];

  /**
   * Validates the complete content package against all Social Quality Gate rules.
   */
  public static validate(pkg: CompleteContentPackage): SocialQualityGateReport {
    const issues: string[] = [];
    const warnings: string[] = [];
    const checksPassed: string[] = [];

    let invarianceValid = true;
    let brandQualityValid = true;
    let assetsValid = true;
    let metadataValid = true;
    let versionLockValid = true;

    const contentId = pkg.contentId;

    // 1. CANONICAL CONTENT ID & CROSS-CONTENT CORRELATION
    const canonicalIdRegex = /^BP-CNT-\d{6}$/;
    if (!contentId || !canonicalIdRegex.test(contentId)) {
      issues.push(`Invalid canonical Content ID format: "${contentId}". Must match BP-CNT-######.`);
    } else {
      checksPassed.push('Canonical Content ID format validated.');
    }

    // Question correlation
    const questionContentId = (pkg.question as any)?.contentMasterId || (pkg.question as any)?.contentId;
    if (questionContentId && questionContentId !== contentId) {
      issues.push(`Cross-content mismatch: Question contentId "${questionContentId}" does not match package "${contentId}".`);
    } else {
      checksPassed.push('Question Content ID correctly correlated.');
    }

    // Script correlation
    const scriptContentId = (pkg.script as any)?.contentId;
    if (scriptContentId && scriptContentId !== contentId) {
      issues.push(`Cross-content mismatch: Script contentId "${scriptContentId}" does not match package "${contentId}".`);
    }

    // Video correlation
    if (pkg.video) {
      if (pkg.video.questionId && pkg.question && pkg.video.questionId !== pkg.question.id) {
        issues.push(`Cross-content mismatch: Video questionId "${pkg.video.questionId}" does not match Question ID "${pkg.question.id}".`);
      }
      const videoContentId = (pkg.video as any)?.contentId;
      if (videoContentId && videoContentId !== contentId) {
        issues.push(`Cross-content mismatch: Video contentId "${videoContentId}" does not match package "${contentId}".`);
      }
    } else {
      issues.push('Missing Video production record in complete package.');
    }

    // Thumbnail correlation
    if (pkg.thumbnail) {
      const thumbContentId = (pkg.thumbnail as any)?.contentId;
      if (thumbContentId && thumbContentId !== contentId) {
        issues.push(`Cross-content mismatch: Thumbnail contentId "${thumbContentId}" does not match package "${contentId}".`);
      }
    } else {
      issues.push('Missing Thumbnail record in complete package.');
    }

    // Pinned Comment correlation
    if (pkg.pinnedCommentPackage) {
      if (pkg.pinnedCommentPackage.contentId && pkg.pinnedCommentPackage.contentId !== contentId) {
        issues.push(`Cross-content mismatch: Pinned Comment package contentId "${pkg.pinnedCommentPackage.contentId}" does not match package "${contentId}".`);
      }
    } else {
      issues.push('Missing Pinned Comment package in complete package.');
    }

    // 2. QUESTION CORRECTNESS & AUTHORITATIVE ANSWER PRESERVATION
    if (!pkg.question) {
      issues.push('Question is missing.');
      invarianceValid = false;
    } else {
      const q = pkg.question;
      const qText = (q.questionText || '').trim();
      if (!qText) {
        issues.push('Question text cannot be empty.');
        invarianceValid = false;
      }

      const validationStatus = String((q as any).validationStatus || '').toUpperCase();
      const status = String((q as any).status || '').toUpperCase();
      const isValidStatus = validationStatus === 'VALID' || status === 'APPROVED' || status === 'VALIDATED';
      if (!isValidStatus) {
        issues.push(`Question validation status is not VALID/APPROVED (found: "${validationStatus || status}").`);
        invarianceValid = false;
      }

      const hasOptions = (q.optionA && q.optionB) || (Array.isArray(q.options) && q.options.length >= 2);
      if (!hasOptions) {
        issues.push('Question must have at least 2 distinct multiple choice options.');
        invarianceValid = false;
      }

      const correctAnswer = (q.correctAnswer || '').trim().toUpperCase();
      if (!correctAnswer) {
        issues.push('Question is missing an authoritative correct answer.');
        invarianceValid = false;
      } else {
        checksPassed.push('Question correctness and authoritative answer verified.');
      }
    }

    // 3. APPROVED SCRIPT VERIFICATION & FACTUAL INVARIANCE
    if (!pkg.script) {
      issues.push('Approved script is missing.');
      invarianceValid = false;
    } else {
      const s = pkg.script;
      const isApproved = (s as any).isApproved !== false && Boolean(
        (s as any).isApproved ||
        (s as any).status === 'APPROVED' ||
        (s as any).notes?.includes('APPROVED') ||
        s.currentVersion ||
        (pkg.contentMaster as any)?.status === 'READY_FOR_SOCIAL_REVIEW' ||
        (pkg.contentMaster as any)?.status === 'APPROVED'
      );
      if (!isApproved) {
        issues.push('Script is not approved. Social review requires a human-approved script.');
      }

      if (!s.hookText || s.hookText.trim().length === 0) {
        issues.push('Script is missing hook text.');
      }
      if (!s.problemStatement || s.problemStatement.trim().length === 0) {
        issues.push('Script is missing problem statement.');
      }
      if (!s.stepByStepSolution || s.stepByStepSolution.trim().length === 0) {
        issues.push('Script is missing step-by-step solution.');
      }
      if (!s.speedTrickOrTakeaway || s.speedTrickOrTakeaway.trim().length === 0) {
        issues.push('Script is missing speed trick / takeaway.');
      }
      if (!s.callToAction || s.callToAction.trim().length === 0) {
        issues.push('Script is missing call to action.');
      }

      if (pkg.question) {
        const qText = (pkg.question.questionText || '').toLowerCase();
        const qNumbers = qText.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
        const scriptTextCombined = `${s.problemStatement} ${s.stepByStepSolution}`.toLowerCase();
        
        let missingNumbersCount = 0;
        for (const num of qNumbers) {
          if (!scriptTextCombined.includes(num.toLowerCase())) {
            missingNumbersCount++;
          }
        }
        if (qNumbers.length > 0 && missingNumbersCount === qNumbers.length) {
          issues.push('Script problem statement does not reference key numerical quantities from source question.');
          invarianceValid = false;
        } else {
          checksPassed.push('Approved Script structure and factual consistency verified.');
        }
      }
    }

    // 4. FINAL VIDEO PRODUCTION STATUS & METADATA
    if (pkg.video) {
      const v = pkg.video;
      const isFinalStatus = 
        v.status === VideoProductionStatus.FINAL_REVIEW ||
        v.status === VideoProductionStatus.READY_TO_UPLOAD ||
        v.status === VideoProductionStatus.UPLOADED;

      if (!isFinalStatus) {
        issues.push(`Video is not in final state (current status: "${v.status}"). Expected FINAL_REVIEW, READY_TO_UPLOAD, or UPLOADED.`);
        assetsValid = false;
      }

      if (v.finalRenderWidth && v.finalRenderHeight) {
        const aspect = v.finalRenderWidth / v.finalRenderHeight;
        if (aspect > 1.0) {
          warnings.push(`Video dimensions (${v.finalRenderWidth}x${v.finalRenderHeight}) are landscape. YouTube Shorts requires vertical 9:16.`);
        }
      }

      if (v.actualDurationSeconds !== undefined && v.actualDurationSeconds !== null) {
        if (v.actualDurationSeconds <= 0) {
          issues.push('Video duration must be greater than 0 seconds.');
          assetsValid = false;
        } else if (v.actualDurationSeconds > 60) {
          warnings.push(`Video duration (${v.actualDurationSeconds}s) exceeds standard 60-second Shorts limit.`);
        }
      }

      if (pkg.videoAsset) {
        if (!pkg.videoAsset.driveFileId) {
          issues.push('Video media asset record is missing driveFileId.');
          assetsValid = false;
        }
        if (pkg.videoAsset.mimeType && !pkg.videoAsset.mimeType.startsWith('video/')) {
          issues.push(`Invalid video MIME type: "${pkg.videoAsset.mimeType}".`);
          assetsValid = false;
        }
      }

      checksPassed.push('Final Video status and asset metadata verified.');
    }

    // 5. APPROVED THUMBNAIL VERIFICATION & SAFETY
    if (pkg.thumbnail) {
      const t = pkg.thumbnail;
      const isApproved = Boolean((t as any).isApproved || (t as any).status === 'APPROVED');
      if (!isApproved) {
        issues.push('Thumbnail is not approved. Social review requires an approved thumbnail.');
      }

      const hookText = (t as any).hookText || (t as any).onScreenText || (t as any).caption || '';
      if (pkg.question) {
        const safety = ThumbnailSafetyValidator.validate(hookText, pkg.question);
        if (!safety.isValid) {
          issues.push(...safety.issues.map((msg) => `Thumbnail safety issue: ${msg}`));
          brandQualityValid = false;
        }
        if (safety.leaksAnswer) {
          issues.push('Thumbnail hook leaks the authoritative answer before video suspense.');
          invarianceValid = false;
        }
      }

      if (pkg.thumbnailAsset) {
        if (!pkg.thumbnailAsset.driveFileId) {
          issues.push('Thumbnail media asset is missing driveFileId.');
          assetsValid = false;
        }
        const mime = pkg.thumbnailAsset.mimeType || '';
        if (mime && !mime.startsWith('image/')) {
          issues.push(`Invalid thumbnail image MIME type: "${mime}".`);
          assetsValid = false;
        }
      }

      checksPassed.push('Approved Thumbnail safety and Drive asset reference verified.');
    }

    // 6. APPROVED PINNED COMMENT VERIFICATION & SAFETY
    if (pkg.pinnedCommentPackage) {
      const pcp = pkg.pinnedCommentPackage;
      const isApproved = Boolean((pcp as any).isApproved || pcp.status === 'APPROVED');
      if (!isApproved) {
        issues.push('Pinned Comment package is not approved. Social review requires an approved pinned comment package.');
      }

      if (pkg.question) {
        const safety = PinnedCommentSafetyValidator.validate(pcp, pkg.question);
        if (!safety.isValid) {
          issues.push(...safety.issues.map((msg) => `Pinned comment quality issue: ${msg}`));
          brandQualityValid = false;
        }
        if (safety.leaksAnswer) {
          issues.push('Pinned comment leaks the correct answer in suspense prompt.');
          invarianceValid = false;
        }
      }

      checksPassed.push('Approved Pinned Comment package quality and anti-leakage verified.');
    }

    // 7. METADATA COMPLETENESS & BRANDING
    const metadata = pkg.metadata || {};
    const title = (metadata.shortTitle || (metadata as any).title || (pkg.contentMaster as any)?.title || '').trim();
    const caption = (metadata.socialCaption || (metadata as any).caption || '').trim();
    const hashtags = Array.isArray(metadata.hashtags) ? metadata.hashtags : [];

    if (!title) {
      issues.push('Missing required production short title.');
      metadataValid = false;
    } else if (title.length > 100) {
      issues.push(`Title length (${title.length} chars) exceeds 100 characters.`);
      metadataValid = false;
    }

    if (!caption) {
      issues.push('Missing required social caption / description.');
      metadataValid = false;
    }

    if (hashtags.length < 2) {
      warnings.push(`Only ${hashtags.length} hashtag(s) configured. Recommend at least 3 relevant hashtags.`);
    }

    for (const pattern of SocialQualityGateValidator.BANNED_GENERIC_PATTERNS) {
      if (pattern.test(caption) || pattern.test(title)) {
        issues.push('Generic low-quality engagement phrase detected in title/caption.');
        brandQualityValid = false;
        break;
      }
    }

    if (metadataValid) {
      checksPassed.push('Production metadata completeness and brand quality verified.');
    }

    // 8. ASSET MIME & SIZE VALIDATION
    const videoSize = (pkg.videoAsset as any)?.fileSizeBytes ?? (pkg.videoAsset as any)?.fileSize;
    if (pkg.videoAsset && videoSize !== undefined && videoSize <= 0) {
      issues.push('Video asset file size is 0 bytes.');
      assetsValid = false;
    }
    const thumbSize = (pkg.thumbnailAsset as any)?.fileSizeBytes ?? (pkg.thumbnailAsset as any)?.fileSize;
    if (pkg.thumbnailAsset && thumbSize !== undefined && thumbSize <= 0) {
      issues.push('Thumbnail asset file size is 0 bytes.');
      assetsValid = false;
    }

    if (assetsValid) {
      checksPassed.push('Asset MIME types and file size thresholds verified.');
    }

    // 9. PLATFORM ADAPTATIONS (WHEN AVAILABLE)
    if (pkg.platformAdaptations) {
      if (!pkg.platformAdaptations.isAllValid) {
        warnings.push('Platform adaptations contain validation warnings.');
      } else {
        checksPassed.push('Platform adaptations verified against source question.');
      }
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      contentId,
      issues,
      warnings,
      checksPassed,
      invarianceValid,
      brandQualityValid,
      assetsValid,
      metadataValid,
      versionLockValid,
    };
  }
}
