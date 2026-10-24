import {
  CANONICAL_CONTENT_MODES,
  CanonicalContentMode,
  PresentationFormat,
  PRESENTATION_FORMATS,
  isSupportedContentMode,
  resolveCanonicalContentMode,
} from './core-requirements';

export type ContentModeFormatCompatibility = 'SUPPORTED';

export interface ContentModeFormatRule {
  mode: CanonicalContentMode;
  format: PresentationFormat;
  status: ContentModeFormatCompatibility;
  rationale: string;
}

/**
 * Formats are orthogonal to educational mode in the approved requirements.
 * "SUPPORTED" means the shared contract/link model accepts the pair; it does
 * not trigger rendering, provider calls, or automatic generation.
 */
export const CONTENT_MODE_FORMAT_COMPATIBILITY: Readonly<
  Record<CanonicalContentMode, Readonly<Record<PresentationFormat, ContentModeFormatRule>>>
> = Object.freeze(Object.fromEntries(
  CANONICAL_CONTENT_MODES.map((mode) => [
    mode,
    Object.fromEntries(PRESENTATION_FORMATS.map((format) => [
      format,
      {
        mode,
        format,
        status: 'SUPPORTED',
        rationale: `${format} is an independent presentation format for ${mode}; the linked artifact contract governs its payload.`,
      },
    ])),
  ])
) as Record<CanonicalContentMode, Readonly<Record<PresentationFormat, ContentModeFormatRule>>>);

export function getContentModeFormatRule(
  mode: string,
  format: string
): ContentModeFormatRule {
  const canonicalMode = resolveCanonicalContentMode(mode);
  if (!(PRESENTATION_FORMATS as readonly string[]).includes(format)) {
    throw new Error(`Unsupported presentation format '${format}'. Expected one of: ${PRESENTATION_FORMATS.join(', ')}`);
  }
  return CONTENT_MODE_FORMAT_COMPATIBILITY[canonicalMode][format as PresentationFormat];
}

export function isContentModeFormatSupported(mode: string, format: string): boolean {
  return isSupportedContentMode(mode) &&
    (PRESENTATION_FORMATS as readonly string[]).includes(format);
}
