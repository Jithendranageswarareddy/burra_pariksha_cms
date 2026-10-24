import assert from 'node:assert/strict';
import {
  CANONICAL_CONTENT_MODES,
  CONTENT_MODE_FORMAT_COMPATIBILITY,
  getContentModeFormatRule,
  isContentModeFormatSupported,
  PRESENTATION_FORMATS,
  resolveCanonicalContentMode,
  toLegacyContentMode,
} from '../../../shared';

for (const mode of CANONICAL_CONTENT_MODES) {
  for (const format of PRESENTATION_FORMATS) {
    const rule = getContentModeFormatRule(mode, format);
    assert.equal(rule.status, 'SUPPORTED');
    assert.equal(rule.mode, mode);
    assert.equal(rule.format, format);
    assert.ok(rule.rationale.length > 0);
  }
}

assert.equal(Object.keys(CONTENT_MODE_FORMAT_COMPATIBILITY).length, 3);
assert.equal(resolveCanonicalContentMode('EXPLAINED_QUESTIONS_VIDEO'), 'WORKED_EXAMPLES');
assert.equal(getContentModeFormatRule('EXPLAINED_QUESTIONS_VIDEO', 'AUDIO').mode, 'WORKED_EXAMPLES');
assert.equal(toLegacyContentMode('WORKED_EXAMPLES'), 'EXPLAINED_QUESTIONS_VIDEO');
assert.equal(toLegacyContentMode('TOPIC_INTRODUCTION'), 'TOPIC_INTRODUCTION');
assert.equal(isContentModeFormatSupported('QUESTION_CHALLENGE_SHORT', 'VIDEO'), true);
assert.equal(isContentModeFormatSupported('NOT_A_MODE', 'VIDEO'), false);
assert.equal(isContentModeFormatSupported('TOPIC_INTRODUCTION', 'PODCAST'), false);
assert.throws(() => getContentModeFormatRule('TOPIC_INTRODUCTION', 'PODCAST'));
assert.throws(() => getContentModeFormatRule('NOT_A_MODE', 'TEXT'));

console.log('S12-T06 compatibility tests passed (15 decisions and 9 compatibility cases).');
