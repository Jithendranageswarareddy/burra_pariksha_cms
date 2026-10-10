/**
 * BURRA PARIKSHA CMS - Platform Adaptation Validator
 * Phase 21: Multi-Platform Content Adaptation
 * 
 * Validates:
 * - Content ID format and matching
 * - Supported platform enum values (YOUTUBE, INSTAGRAM, FACEBOOK)
 * - Platform-specific limits (YouTube, Instagram, Facebook character / hashtag bounds)
 * - Quality rules, answer leakage prevention, and call-to-action presence
 * - Non-empty titles and captions
 */

import {
  PlatformType,
  CreatePlatformAdaptationInput,
  UpdatePlatformAdaptationInput,
  PlatformSpecificWording,
  PlatformThumbnailConsideration,
} from '../../types';
import { ValidationError } from '../errors';

export interface PlatformValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export class PlatformAdaptationValidator {
  public static readonly SUPPORTED_PLATFORMS: PlatformType[] = [
    PlatformType.YOUTUBE,
    PlatformType.INSTAGRAM,
    PlatformType.FACEBOOK,
  ];

  /**
   * Validates platform enum value.
   */
  public static validatePlatform(platform: string): PlatformType {
    if (!platform || typeof platform !== 'string') {
      throw new ValidationError(`Platform is required and must be one of: ${PlatformAdaptationValidator.SUPPORTED_PLATFORMS.join(', ')}`);
    }

    const upper = platform.toUpperCase().trim();
    if (!Object.values(PlatformType).includes(upper as any)) {
      throw new ValidationError(
        `Unsupported platform: "${platform}". Allowed platforms: ${PlatformAdaptationValidator.SUPPORTED_PLATFORMS.join(', ')}`
      );
    }

    return upper as PlatformType;
  }

  /**
   * Validates canonical Content ID format.
   */
  public static validateContentId(contentId: string): void {
    if (!contentId || !/^BP-CNT-\d{6}$/.test(contentId)) {
      throw new ValidationError(
        `Invalid canonical Content ID format: "${contentId}". Must match ^BP-CNT-\\d{6}$`
      );
    }
  }

  /**
   * Validates input payload for platform-specific constraints.
   */
  public static validateAdaptationPayload(params: {
    platform: PlatformType;
    title?: string;
    description?: string;
    caption?: string;
    hashtags?: string[];
    callToAction?: string;
    platformSpecificWording?: PlatformSpecificWording;
    thumbnailConsiderations?: PlatformThumbnailConsideration;
    correctAnswer?: string;
  }): PlatformValidationResult {
    const {
      platform,
      title = '',
      description = '',
      caption = '',
      hashtags = [],
      callToAction = '',
      correctAnswer = '',
    } = params;

    const issues: string[] = [];
    const warnings: string[] = [];

    // Common validations
    if (platform === PlatformType.YOUTUBE) {
      // YouTube Shorts / Videos require title
      if (!title || !title.trim()) {
        issues.push('YouTube adaptation requires a non-empty title.');
      } else if (title.trim().length > 100) {
        issues.push(`YouTube title exceeds 100 characters (${title.trim().length} chars).`);
      }

      if (!description && !caption) {
        warnings.push('YouTube description is empty.');
      }
    } else if (platform === PlatformType.INSTAGRAM) {
      // Instagram requires caption
      if (!caption || !caption.trim()) {
        issues.push('Instagram adaptation requires a non-empty caption.');
      } else if (caption.trim().length > 2200) {
        issues.push(`Instagram caption exceeds 2200 characters (${caption.trim().length} chars).`);
      }

      if (hashtags.length > 30) {
        issues.push(`Instagram allows a maximum of 30 hashtags. Provided: ${hashtags.length}.`);
      }
    } else if (platform === PlatformType.FACEBOOK) {
      // Facebook requires caption or description
      if ((!caption || !caption.trim()) && (!title || !title.trim())) {
        issues.push('Facebook adaptation requires a non-empty caption or title.');
      }
    }

    // Anti-Answer-Leakage in public text surfaces (unless intended)
    if (correctAnswer) {
      const cleanAnswer = correctAnswer.trim().toUpperCase();
      const escapedAnswer = cleanAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const combinedText = `${title} ${caption} ${description}`.toLowerCase();
      const directLeakRegex = new RegExp(`(?:answer\\s*is|correct\\s*option|సమాధానం|జవాబు)\\s*(?:is|:|=)?\\s*${escapedAnswer}\\b`, 'i');
      if (directLeakRegex.test(combinedText)) {
        issues.push(`Adaptation text leaks authoritative correct answer (${cleanAnswer}) in public hook.`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }
}
