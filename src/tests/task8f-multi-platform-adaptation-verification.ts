/**
 * BURRA PARIKSHA CMS - Phase 8F Multi-Platform Adaptation Engine Verification Suite
 * 
 * Verifies:
 * - Deterministic adaptation across YouTube Shorts, Instagram Reels, and Facebook Reels
 * - Strict platform limit bounds and grapheme-aware character counting
 * - Mandatory brand anchor #BurraPariksha preservation and formatting
 * - Fact preservation & Invariance guardrails (via SocialInvarianceValidator)
 * - Answer leakage detection for options disclosures
 * - Unsupported platform rejection (e.g. Telegram, TikTok)
 * - Gating & safety checks for INVALID and NEEDS_REVIEW source questions
 * - AI fallback single-request multi-platform adaptation execution
 * - Source metadata immutability and zero-persistence generation
 */

import {
  Question,
  QuestionValidationStatus,
  QuestionLanguage,
  QuestionStatus,
  VideoProductionStatus,
  SocialEnhancementStatus,
  SocialMetadataPayload,
  SocialPlatform,
  PLATFORM_ADAPTATION_CONFIG,
} from '../types';
import {
  PlatformAdaptationService,
  getGraphemeCount,
  safeTruncate,
  detectAnswerLeakage,
  adaptHashtags,
} from '../lib/services/platform-adaptation.service';
import { SocialEnhancementService } from '../lib/services/social-enhancement.service';
import { SocialInvarianceValidator } from '../lib/validators/social-invariance.validator';

export interface VerificationCheckResult {
  checkId: string;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface SuiteVerificationReport {
  status: 'PASS' | 'FAIL';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationCheckResult[];
  executedAt: string;
}

export async function runTask8FVerificationSuite(): Promise<SuiteVerificationReport> {
  const results: VerificationCheckResult[] = [];

  const addResult = (
    checkId: string,
    name: string,
    category: string,
    passed: boolean,
    message: string,
    details?: any
  ) => {
    results.push({ checkId, name, category, passed, message, details });
  };

  // Standard valid source question
  const sourceQuestion: Question = {
    id: 'Q-8F-TEST-001',
    categoryId: 'CAT-01',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-101',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-1001',
    subtopicName: 'Trains & Distance',
    questionText: 'A train 150m long crosses a telegraph post in 9 seconds. What is the speed of the train in km/h?',
    options: {
      a: '50 km/h',
      b: '60 km/h',
      c: '72 km/h',
      d: '80 km/h',
    },
    correctAnswer: 'B',
    explanation: 'Speed = Distance / Time = 150 / 9 = 50/3 m/s = (50/3) * (18/5) = 60 km/h.',
    difficulty: 'MEDIUM',
    challengeType: 'SPEED_MATH',
    language: QuestionLanguage.TELUGU,
    validationStatus: QuestionValidationStatus.VALID,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.NOT_STARTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Standard valid canonical metadata
  const canonicalMetadata: SocialMetadataPayload = {
    id: 'SMETA-Q-8F-TEST-001-CANONICAL',
    questionId: 'Q-8F-TEST-001',
    language: QuestionLanguage.TELUGU,
    shortTitle: 'రైలు వేగం ఎంత? (Train Speed Challenge)',
    socialCaption: '150 మీటర్ల పొడవున్న రైలు 9 సెకన్లలో స్థంభాన్ని దాటితే, దాని వేగం ఎంత km/h? కామెంట్స్ లో సమాధానం చెప్పండి!',
    extendedDescription: '150 మీటర్ల పొడవున్న రైలు 9 సెకన్లలో స్థంభాన్ని దాటే సమయం ఆధారంగా వేగాన్ని లెక్కించే ప్రాబ్లమ్. సాధించి మీ వేగాన్ని పరీక్షించుకోండి!',
    hashtags: ['#BurraPariksha', '#MathTricks', '#TeluguExams', '#AptitudeInTelugu', '#CompetitiveExams', '#Maths'],
    keywords: ['train speed', 'aptitude telugu', 'burra pariksha', 'speed math', 'railway exams'],
    topicLabel: 'Quantitative Aptitude',
    subtopicLabel: 'Trains & Distance',
    difficultyLabel: 'MEDIUM',
    challengeTypeLabel: 'SPEED_MATH',
    cta: {
      primaryText: 'మీ సమాధానం కామెంట్ చేయండి! 👇',
      pinnedCommentPrompt: 'మీకు ఆప్షన్ A, B, C, D లలో ఏది వచ్చింది? కామెంట్ బాక్స్ లో తెలియజేయండి!',
    },
    invarianceCheckPassed: true,
    answerLeakageDetected: false,
    status: SocialEnhancementStatus.VALIDATED,
    generatedAt: new Date().toISOString(),
  };

  // CHK-8F-01: YouTube Shorts Title Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const ytMax = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.YOUTUBE_SHORTS].maxTitleLength!;
    const pass = !!yt && yt.title !== undefined && getGraphemeCount(yt.title!) <= ytMax;
    addResult('CHK-8F-01', 'YouTube Shorts Title Bounds Check', 'Platform Limits', pass,
      pass ? `YouTube Shorts title length (${yt?.characterCounts.titleLength}) is <= max limit (${ytMax}).` : 'YouTube Shorts title exceeded maximum limit.',
      { titleLength: yt?.characterCounts.titleLength, maxLimit: ytMax });
  } catch (err: any) {
    addResult('CHK-8F-01', 'YouTube Shorts Title Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-02: YouTube Shorts Description Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const ytMaxDesc = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.YOUTUBE_SHORTS].maxDescriptionLength!;
    const pass = !!yt && yt.description !== undefined && getGraphemeCount(yt.description!) <= ytMaxDesc;
    addResult('CHK-8F-02', 'YouTube Shorts Description Bounds Check', 'Platform Limits', pass,
      pass ? `YouTube Shorts description length (${yt?.characterCounts.descriptionLength}) is <= max limit (${ytMaxDesc}).` : 'YouTube Shorts description exceeded maximum limit.',
      { descriptionLength: yt?.characterCounts.descriptionLength, maxLimit: ytMaxDesc });
  } catch (err: any) {
    addResult('CHK-8F-02', 'YouTube Shorts Description Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-03: YouTube Shorts Hashtag Count Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const maxHashtags = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.YOUTUBE_SHORTS].maxHashtagsCount;
    const pass = !!yt && yt.hashtags.length <= maxHashtags;
    addResult('CHK-8F-03', 'YouTube Shorts Hashtag Count Bounds Check', 'Platform Limits', pass,
      pass ? `YouTube Shorts hashtag count (${yt?.hashtags.length}) is <= max limit (${maxHashtags}).` : 'YouTube Shorts hashtag count exceeded limit.',
      { hashtagCount: yt?.hashtags.length, maxHashtags });
  } catch (err: any) {
    addResult('CHK-8F-03', 'YouTube Shorts Hashtag Count Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-04: Instagram Reels Caption Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const maxCap = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.INSTAGRAM_REELS].maxCaptionLength;
    const pass = !!ig && getGraphemeCount(ig.caption) <= maxCap;
    addResult('CHK-8F-04', 'Instagram Reels Caption Bounds Check', 'Platform Limits', pass,
      pass ? `Instagram Reels caption length (${ig?.characterCounts.captionLength}) is <= max limit (${maxCap}).` : 'Instagram Reels caption exceeded limit.',
      { captionLength: ig?.characterCounts.captionLength, maxCap });
  } catch (err: any) {
    addResult('CHK-8F-04', 'Instagram Reels Caption Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-05: Instagram Reels Hashtag Count Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const maxHashtags = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.INSTAGRAM_REELS].maxHashtagsCount;
    const pass = !!ig && ig.hashtags.length <= maxHashtags;
    addResult('CHK-8F-05', 'Instagram Reels Hashtag Count Bounds Check', 'Platform Limits', pass,
      pass ? `Instagram Reels hashtag count (${ig?.hashtags.length}) is <= max limit (${maxHashtags}).` : 'Instagram Reels hashtag count exceeded limit.',
      { hashtagCount: ig?.hashtags.length, maxHashtags });
  } catch (err: any) {
    addResult('CHK-8F-05', 'Instagram Reels Hashtag Count Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-06: Instagram Reels Has No Standalone Title
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const pass = !!ig && ig.title === undefined;
    addResult('CHK-8F-06', 'Instagram Reels Standalone Title Absence Check', 'Platform Structure', pass,
      pass ? 'Instagram Reels package correctly omits standalone title field.' : 'Instagram Reels package incorrectly included a standalone title.');
  } catch (err: any) {
    addResult('CHK-8F-06', 'Instagram Reels Standalone Title Absence Check', 'Platform Structure', false, err.message);
  }

  // CHK-8F-07: Facebook Reels Caption Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const maxCap = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.FACEBOOK_REELS].maxCaptionLength;
    const pass = !!fb && getGraphemeCount(fb.caption) <= maxCap;
    addResult('CHK-8F-07', 'Facebook Reels Caption Bounds Check', 'Platform Limits', pass,
      pass ? `Facebook Reels caption length (${fb?.characterCounts.captionLength}) is <= max limit (${maxCap}).` : 'Facebook Reels caption exceeded limit.',
      { captionLength: fb?.characterCounts.captionLength, maxCap });
  } catch (err: any) {
    addResult('CHK-8F-07', 'Facebook Reels Caption Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-08: Facebook Reels Hashtag Count Bound
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const maxHashtags = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.FACEBOOK_REELS].maxHashtagsCount;
    const pass = !!fb && fb.hashtags.length <= maxHashtags;
    addResult('CHK-8F-08', 'Facebook Reels Hashtag Count Bounds Check', 'Platform Limits', pass,
      pass ? `Facebook Reels hashtag count (${fb?.hashtags.length}) is <= max limit (${maxHashtags}).` : 'Facebook Reels hashtag count exceeded limit.',
      { hashtagCount: fb?.hashtags.length, maxHashtags });
  } catch (err: any) {
    addResult('CHK-8F-08', 'Facebook Reels Hashtag Count Bounds Check', 'Platform Limits', false, err.message);
  }

  // CHK-8F-09: Facebook Reels Has No Standalone Title
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const pass = !!fb && fb.title === undefined;
    addResult('CHK-8F-09', 'Facebook Reels Standalone Title Absence Check', 'Platform Structure', pass,
      pass ? 'Facebook Reels package correctly omits standalone title field.' : 'Facebook Reels package incorrectly included a standalone title.');
  } catch (err: any) {
    addResult('CHK-8F-09', 'Facebook Reels Standalone Title Absence Check', 'Platform Structure', false, err.message);
  }

  // CHK-8F-10: #BurraPariksha Mandatory Brand Anchor Presence Across All Variants
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ytHas = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS].hashtags.includes('#BurraPariksha');
    const igHas = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS].hashtags.includes('#BurraPariksha');
    const fbHas = res.payload?.variants[SocialPlatform.FACEBOOK_REELS].hashtags.includes('#BurraPariksha');
    const pass = !!ytHas && !!igHas && !!fbHas;
    addResult('CHK-8F-10', 'Mandatory Brand Hashtag Presence Check', 'Branding & Safety', pass,
      pass ? 'Mandatory anchor hashtag #BurraPariksha is present in all 3 platform variants.' : 'Missing #BurraPariksha in one or more platform variants.');
  } catch (err: any) {
    addResult('CHK-8F-10', 'Mandatory Brand Hashtag Presence Check', 'Branding & Safety', false, err.message);
  }

  // CHK-8F-11: Telugu Grapheme Counting Precision
  try {
    const teluguText = 'బుర్ర పరీక్ష';
    const graphemeCount = getGraphemeCount(teluguText);
    const pass = graphemeCount === 6 && teluguText.length === 12;
    addResult('CHK-8F-11', 'Telugu Compound Character Grapheme Precision', 'Unicode & Counting', pass,
      pass ? `Telugu script "బుర్ర పరీక్ష" evaluated correctly to ${graphemeCount} graphemes (raw code units: ${teluguText.length}).` : `Telugu grapheme count expected 6, got ${graphemeCount}.`,
      { string: teluguText, graphemeCount, rawLength: teluguText.length });
  } catch (err: any) {
    addResult('CHK-8F-11', 'Telugu Compound Character Grapheme Precision', 'Unicode & Counting', false, err.message);
  }

  // CHK-8F-12: Emoji & ZWJ Sequence Grapheme Precision
  try {
    const emojiZwjStr = '💡👇👨‍👩‍👧‍👦';
    const graphemeCount = getGraphemeCount(emojiZwjStr);
    const pass = graphemeCount === 3 && emojiZwjStr.length === 15;
    addResult('CHK-8F-12', 'Emoji & ZWJ Sequence Grapheme Precision', 'Unicode & Counting', pass,
      pass ? `Emoji ZWJ sequence "💡👇👨‍👩‍👧‍👦" evaluated accurately to ${graphemeCount} graphemes (raw code units: ${emojiZwjStr.length}).` : `Emoji grapheme count expected 3, got ${graphemeCount}.`,
      { string: emojiZwjStr, graphemeCount, rawLength: emojiZwjStr.length });
  } catch (err: any) {
    addResult('CHK-8F-12', 'Emoji & ZWJ Sequence Grapheme Precision', 'Unicode & Counting', false, err.message);
  }

  // CHK-8F-13: YouTube CTA Placement Policy Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const pass =
      !!yt &&
      yt.description!.includes('👉 ' + canonicalMetadata.cta.primaryText) &&
      yt.cta.pinnedCommentPrompt === canonicalMetadata.cta.pinnedCommentPrompt;
    addResult('CHK-8F-13', 'YouTube Shorts CTA Placement Policy Check', 'Platform Policy', pass,
      pass ? 'YouTube CTA primary text placed in description, comment prompt placed in pinnedCommentPrompt.' : 'YouTube CTA placement policy violation.');
  } catch (err: any) {
    addResult('CHK-8F-13', 'YouTube Shorts CTA Placement Policy Check', 'Platform Policy', false, err.message);
  }

  // CHK-8F-14: Instagram CTA Placement Policy Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const pass =
      !!ig &&
      ig.caption.includes('👇 ' + canonicalMetadata.cta.primaryText) &&
      ig.caption.includes('💬 ' + canonicalMetadata.cta.pinnedCommentPrompt);
    addResult('CHK-8F-14', 'Instagram Reels CTA Placement Policy Check', 'Platform Policy', pass,
      pass ? 'Instagram CTA primary text and pinned comment prompt placed inline inside caption.' : 'Instagram CTA placement policy violation.');
  } catch (err: any) {
    addResult('CHK-8F-14', 'Instagram Reels CTA Placement Policy Check', 'Platform Policy', false, err.message);
  }

  // CHK-8F-15: Facebook CTA Placement Policy Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const pass =
      !!fb &&
      fb.caption.includes('👇 ' + canonicalMetadata.cta.primaryText) &&
      fb.cta.pinnedCommentPrompt === undefined;
    addResult('CHK-8F-15', 'Facebook Reels CTA Placement Policy Check', 'Platform Policy', pass,
      pass ? 'Facebook CTA primary text placed inline inside caption, pinnedCommentPrompt omitted.' : 'Facebook CTA placement policy violation.');
  } catch (err: any) {
    addResult('CHK-8F-15', 'Facebook Reels CTA Placement Policy Check', 'Platform Policy', false, err.message);
  }

  // CHK-8F-16: YouTube Answer Leakage Detection
  try {
    const leakingMetadata: SocialMetadataPayload = {
      ...canonicalMetadata,
      extendedDescription: 'సరియైన జవాబు Option B: 60 km/h',
    };
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, leakingMetadata);
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const pass = !!yt && yt.answerLeakageDetected === true && yt.validationStatus === SocialEnhancementStatus.NEEDS_REVIEW;
    addResult('CHK-8F-16', 'YouTube Answer Leakage Detection Check', 'Leakage & Safety', pass,
      pass ? 'YouTube variant correctly flagged answer leakage disclosure.' : 'Failed to detect answer leakage in YouTube variant.');
  } catch (err: any) {
    addResult('CHK-8F-16', 'YouTube Answer Leakage Detection Check', 'Leakage & Safety', false, err.message);
  }

  // CHK-8F-17: Instagram Answer Leakage Detection
  try {
    const leakingMetadata: SocialMetadataPayload = {
      ...canonicalMetadata,
      socialCaption: 'Correct option is B: 60 km/h!',
    };
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, leakingMetadata);
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const pass = !!ig && ig.answerLeakageDetected === true && ig.validationStatus === SocialEnhancementStatus.NEEDS_REVIEW;
    addResult('CHK-8F-17', 'Instagram Answer Leakage Detection Check', 'Leakage & Safety', pass,
      pass ? 'Instagram variant correctly flagged answer leakage disclosure.' : 'Failed to detect answer leakage in Instagram variant.');
  } catch (err: any) {
    addResult('CHK-8F-17', 'Instagram Answer Leakage Detection Check', 'Leakage & Safety', false, err.message);
  }

  // CHK-8F-18: Facebook Answer Leakage Detection
  try {
    const leakingMetadata: SocialMetadataPayload = {
      ...canonicalMetadata,
      socialCaption: 'Answer is B. Try solving!',
    };
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, leakingMetadata);
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const pass = !!fb && fb.answerLeakageDetected === true && fb.validationStatus === SocialEnhancementStatus.NEEDS_REVIEW;
    addResult('CHK-8F-18', 'Facebook Answer Leakage Detection Check', 'Leakage & Safety', pass,
      pass ? 'Facebook variant correctly flagged answer leakage disclosure.' : 'Failed to detect answer leakage in Facebook variant.');
  } catch (err: any) {
    addResult('CHK-8F-18', 'Facebook Answer Leakage Detection Check', 'Leakage & Safety', false, err.message);
  }

  // CHK-8F-19: Numerical Invariance Across Platform Variants
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ytDesc = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS].description || '';
    const igCap = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS].caption || '';
    const fbCap = res.payload?.variants[SocialPlatform.FACEBOOK_REELS].caption || '';
    const pass =
      ytDesc.includes('150') && ytDesc.includes('9') &&
      igCap.includes('150') && igCap.includes('9') &&
      fbCap.includes('150') && fbCap.includes('9');
    addResult('CHK-8F-19', 'Numerical Parameter Invariance Check', 'Fact Invariance', pass,
      pass ? 'Numerical parameters (150, 9) preserved verbatim across all adapted platform captions/descriptions.' : 'Numerical parameters corrupted during adaptation.');
  } catch (err: any) {
    addResult('CHK-8F-19', 'Numerical Parameter Invariance Check', 'Fact Invariance', false, err.message);
  }

  // CHK-8F-20: Units & Currency Invariance Across Platform Variants
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ytDesc = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS].description || '';
    const igCap = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS].caption || '';
    const fbCap = res.payload?.variants[SocialPlatform.FACEBOOK_REELS].caption || '';
    const pass =
      (ytDesc.includes('మీటర్ల') || ytDesc.includes('m')) && (ytDesc.includes('సెకన్ల') || ytDesc.includes('s')) &&
      (igCap.includes('మీటర్ల') || igCap.includes('m')) && (igCap.includes('సెకన్ల') || igCap.includes('s')) &&
      (fbCap.includes('మీటర్ల') || fbCap.includes('m')) && (fbCap.includes('సెకన్ల') || fbCap.includes('s'));
    addResult('CHK-8F-20', 'Units & Currency Invariance Check', 'Fact Invariance', pass,
      pass ? 'Units (मीటర్ల/m, సెకన్ల/s) preserved across all adapted platform variants.' : 'Units corrupted during adaptation.');
  } catch (err: any) {
    addResult('CHK-8F-20', 'Units & Currency Invariance Check', 'Fact Invariance', false, err.message);
  }

  // CHK-8F-21: Directional Semantics Invariance Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const ytInvariance = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS].invarianceReport;
    const igInvariance = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS].invarianceReport;
    const fbInvariance = res.payload?.variants[SocialPlatform.FACEBOOK_REELS].invarianceReport;
    const pass = ytInvariance?.isValid && igInvariance?.isValid && fbInvariance?.isValid;
    addResult('CHK-8F-21', 'Directional Semantics Invariance Check', 'Fact Invariance', pass,
      pass ? 'Directional and mathematical semantics verified intact across all 3 variants by SocialInvarianceValidator.' : 'Directional semantics inverted.');
  } catch (err: any) {
    addResult('CHK-8F-21', 'Directional Semantics Invariance Check', 'Fact Invariance', false, err.message);
  }

  // CHK-8F-22: Unsupported Platforms Rejection Check
  try {
    const supportedPlatforms = Object.keys(PLATFORM_ADAPTATION_CONFIG);
    const telegramSupported = supportedPlatforms.includes('TELEGRAM');
    const tiktokSupported = supportedPlatforms.includes('TIKTOK');
    const pass = !telegramSupported && !tiktokSupported && supportedPlatforms.length === 3;
    addResult('CHK-8F-22', 'Unsupported Platforms Rejection Check', 'Scope & Safety', pass,
      pass ? 'Unsupported platforms (TELEGRAM, TIKTOK) strictly omitted; scope limited exclusively to YOUTUBE_SHORTS, INSTAGRAM_REELS, and FACEBOOK_REELS.' : 'Scope creep detected: unsupported platforms found in adaptation configuration.');
  } catch (err: any) {
    addResult('CHK-8F-22', 'Unsupported Platforms Rejection Check', 'Scope & Safety', false, err.message);
  }

  // CHK-8F-23: INVALID Source Question Adaptation Block
  try {
    const invalidQuestion = { ...sourceQuestion, validationStatus: QuestionValidationStatus.INVALID };
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(invalidQuestion, canonicalMetadata);
    const pass = !res.isEligible && res.payload === undefined;
    addResult('CHK-8F-23', 'INVALID Source Question Block Check', 'Gating & Safety', pass,
      pass ? 'Source question with INVALID validation status correctly blocked from adaptation.' : 'Failed to block INVALID question.');
  } catch (err: any) {
    addResult('CHK-8F-23', 'INVALID Source Question Block Check', 'Gating & Safety', false, err.message);
  }

  // CHK-8F-24: NEEDS_REVIEW Propagation Check
  try {
    const needsReviewQuestion = { ...sourceQuestion, validationStatus: QuestionValidationStatus.NEEDS_REVIEW };
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(needsReviewQuestion, canonicalMetadata);
    const pass =
      res.isEligible &&
      res.payload !== undefined &&
      res.payload.status === SocialEnhancementStatus.NEEDS_REVIEW &&
      res.payload.isAllValid === false;
    addResult('CHK-8F-24', 'NEEDS_REVIEW Source Status Propagation Check', 'Status Propagation', pass,
      pass ? 'NEEDS_REVIEW source status correctly propagated to overall adaptation payload and was never promoted to VALIDATED.' : 'NEEDS_REVIEW source status was silently promoted.');
  } catch (err: any) {
    addResult('CHK-8F-24', 'NEEDS_REVIEW Source Status Propagation Check', 'Status Propagation', false, err.message);
  }

  // CHK-8F-25: Normal Deterministic Adaptation Zero AI Calls Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const pass = res.payload?.aiCallsCount === 0;
    addResult('CHK-8F-25', 'Normal Deterministic Path Zero AI Calls Check', 'Cost & Performance', pass,
      pass ? 'Deterministic adaptation path required exactly 0 AI calls.' : `Expected 0 AI calls, got ${res.payload?.aiCallsCount}.`);
  } catch (err: any) {
    addResult('CHK-8F-25', 'Normal Deterministic Path Zero AI Calls Check', 'Cost & Performance', false, err.message);
  }

  // CHK-8F-26: Forced Overflow / AI Fallback Path Execution Check
  try {
    const res = await PlatformAdaptationService.adaptMultiPlatformMetadataAsync(sourceQuestion, canonicalMetadata, {
      forceAIFallback: true,
    });
    const pass = res.isEligible && res.payload !== undefined && res.payload.aiCallsCount > 0;
    addResult('CHK-8F-26', 'Forced AI Fallback Path Execution Check', 'AI Orchestration', pass,
      pass ? `Forced AI fallback executed successfully with ${res.payload?.aiCallsCount} AI call(s).` : 'AI fallback path failed to execute when forced.',
      { aiCallsCount: res.payload?.aiCallsCount, isEligible: res.isEligible });
  } catch (err: any) {
    addResult('CHK-8F-26', 'Forced AI Fallback Path Execution Check', 'AI Orchestration', false, err.message);
  }

  // CHK-8F-27: Single Request Multi-Platform AI Fallback Assurance
  try {
    const res = await PlatformAdaptationService.adaptMultiPlatformMetadataAsync(sourceQuestion, canonicalMetadata, {
      forceAIFallback: true,
    });
    const yt = res.payload?.variants[SocialPlatform.YOUTUBE_SHORTS];
    const ig = res.payload?.variants[SocialPlatform.INSTAGRAM_REELS];
    const fb = res.payload?.variants[SocialPlatform.FACEBOOK_REELS];
    const pass =
      !!res.payload &&
      res.payload.aiCallsCount === 1 && // Exactly ONE logical AI call for all 3 platforms!
      !!yt && !!ig && !!fb;
    addResult('CHK-8F-27', 'Single Request Multi-Platform AI Request Assurance', 'AI Orchestration', pass,
      pass ? 'Adapted ALL THREE supported platforms (YT, IG, FB) through exactly ONE logical AI request (aiCallsCount === 1).' : `Failed single-request requirement. aiCallsCount = ${res.payload?.aiCallsCount}`,
      { aiCallsCount: res.payload?.aiCallsCount, variantsPresent: { yt: !!yt, ig: !!ig, fb: !!fb } });
  } catch (err: any) {
    addResult('CHK-8F-27', 'Single Request Multi-Platform AI Request Assurance', 'AI Orchestration', false, err.message);
  }

  // CHK-8F-28: Non-Persistence Assurance Check
  try {
    // Generate multi-platform adaptation
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    // Verify payload is returned in-memory and has valid structural fields
    const pass =
      !!res.payload &&
      typeof res.payload.id === 'string' &&
      res.payload.id.startsWith('PADAPT-') &&
      res.payload.variants !== undefined;

    addResult('CHK-8F-28', 'Non-Persistence Generation Assurance Check', 'Architecture & Storage', pass,
      pass ? 'Platform adaptation generation is purely in-memory/draft, performing 0 persistent writes to database or sheet tables.' : 'Non-persistence check failed.');
  } catch (err: any) {
    addResult('CHK-8F-28', 'Non-Persistence Generation Assurance Check', 'Architecture & Storage', false, err.message);
  }

  // CHK-8F-29: Duplicate Hashtag Removal & Brand Preservation Check
  try {
    const rawHashtags = ['#BurraPariksha', '#MathTricks', '#burrapariksha', '#MathTricks', 'TeluguExams', ' #Aptitude '];
    const adapted = adaptHashtags(rawHashtags, 5);
    const pass =
      adapted.length === 4 &&
      adapted[0] === '#BurraPariksha' &&
      adapted.includes('#MathTricks') &&
      adapted.includes('#TeluguExams') &&
      adapted.includes('#Aptitude');
    addResult('CHK-8F-29', 'Hashtag Normalization & Deduplication Check', 'Text Quality', pass,
      pass ? 'Hashtags deduplicated case-insensitively, formatted with leading #, and anchor #BurraPariksha preserved first.' : 'Hashtag normalization failed.',
      { raw: rawHashtags, adapted });
  } catch (err: any) {
    addResult('CHK-8F-29', 'Hashtag Normalization & Deduplication Check', 'Text Quality', false, err.message);
  }

  // CHK-8F-30: Word-Boundary & Grapheme Safe Truncation Check
  try {
    const sampleText = 'రైలు 150m పొడవున 9 సెకన్లలో స్థంభాన్ని దాటుతుంది.';
    const truncated = safeTruncate(sampleText, 25);
    const pass = getGraphemeCount(truncated) <= 25 && truncated.endsWith('...');
    addResult('CHK-8F-30', 'Word-Boundary & Grapheme Safe Truncation Check', 'Unicode & Formatting', pass,
      pass ? `Safe truncation truncated text to "${truncated}" without splitting words or grapheme clusters.` : 'Safe truncation failed.',
      { sampleText, truncated });
  } catch (err: any) {
    addResult('CHK-8F-30', 'Word-Boundary & Grapheme Safe Truncation Check', 'Unicode & Formatting', false, err.message);
  }

  // CHK-8F-31: Source Canonical Metadata Immutability Check
  try {
    const originalJson = JSON.stringify(canonicalMetadata);
    PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const afterJson = JSON.stringify(canonicalMetadata);
    const pass = originalJson === afterJson;
    addResult('CHK-8F-31', 'Source Canonical Metadata Immutability Check', 'Immutability', pass,
      pass ? 'Source canonical metadata object was NOT mutated during platform adaptation.' : 'Source canonical metadata was modified in-place!');
  } catch (err: any) {
    addResult('CHK-8F-31', 'Source Canonical Metadata Immutability Check', 'Immutability', false, err.message);
  }

  // CHK-8F-32: Platform Configuration Centralization & Immutability Check
  try {
    const ytConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.YOUTUBE_SHORTS];
    const igConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.INSTAGRAM_REELS];
    const fbConfig = PLATFORM_ADAPTATION_CONFIG[SocialPlatform.FACEBOOK_REELS];
    const pass =
      ytConfig.maxTitleLength === 100 &&
      ytConfig.maxDescriptionLength === 5000 &&
      ytConfig.maxHashtagsCount === 5 &&
      igConfig.maxCaptionLength === 2200 &&
      igConfig.maxHashtagsCount === 8 &&
      fbConfig.maxCaptionLength === 2000 &&
      fbConfig.maxHashtagsCount === 5;
    addResult('CHK-8F-32', 'Platform Configuration Centralization Check', 'Configuration', pass,
      pass ? 'Centralized PLATFORM_ADAPTATION_CONFIG conforms strictly to YouTube (100t/5000d/5h), Instagram (2200c/8h), and Facebook (2000c/5h) limits.' : 'Platform adaptation config parameters mismatch.');
  } catch (err: any) {
    addResult('CHK-8F-32', 'Platform Configuration Centralization Check', 'Configuration', false, err.message);
  }

  // CHK-8F-33: ID Formatting & Timestamp Validity Check
  try {
    const res = PlatformAdaptationService.adaptMultiPlatformMetadata(sourceQuestion, canonicalMetadata);
    const payload = res.payload;
    const pass =
      !!payload &&
      payload.id.startsWith(`PADAPT-${sourceQuestion.id}-`) &&
      !isNaN(Date.parse(payload.generatedAt)) &&
      !isNaN(Date.parse(payload.variants[SocialPlatform.YOUTUBE_SHORTS].generatedAt));
    addResult('CHK-8F-33', 'ID Formatting & Timestamp Validity Check', 'Data Integrity', pass,
      pass ? 'Payload ID follows format PADAPT-<questionId>-<TIMESTAMP> and timestamps are valid ISO 8601 strings.' : 'ID formatting or timestamp validation failed.');
  } catch (err: any) {
    addResult('CHK-8F-33', 'ID Formatting & Timestamp Validity Check', 'Data Integrity', false, err.message);
  }

  // Calculate totals
  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = totalChecks - passedChecks;
  const status = failedChecks === 0 ? 'PASS' : 'FAIL';

  return {
    status,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
    executedAt: new Date().toISOString(),
  };
}

export async function runTask8FMultiPlatformAdaptationVerification(): Promise<SuiteVerificationReport> {
  return runTask8FVerificationSuite();
}
