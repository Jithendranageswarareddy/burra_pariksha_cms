/**
 * BURRA PARIKSHA CMS — Text Normalization & Similarity Utility
 * Pure deterministic algorithms for duplicate detection and lexical comparison.
 * Zero database, network, or server dependencies.
 */

export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTokens(text: string): Set<string> {
  const normalized = normalizeText(text);
  return new Set(normalized.split(' ').filter((w) => w.length > 2));
}

export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = getTokens(textA);
  const tokensB = getTokens(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  });

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  if (unionCount === 0) return 0;

  return Math.round((intersectionCount / unionCount) * 100) / 100;
}
