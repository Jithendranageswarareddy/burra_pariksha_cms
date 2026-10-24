import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  createArtifactEditorProjection,
  createArtifactPreviewProjection,
} from '../../../shared/contracts/artifact-projection.contract';
import { ArtifactProjectionPreview } from '../../../frontend/components/ArtifactProjectionPreview';

const base = {
  id: 'artifact-1',
  learningUnitId: 'lnu_12345678-1234-4234-8234-123456789abc',
  mode: 'TOPIC_INTRODUCTION' as const,
  title: 'Discount explanation',
  updatedAt: '2026-10-25T00:00:00.000Z',
};

const media = (format: 'VIDEO' | 'AUDIO' | 'IMAGE' | 'ANIMATION') => ({
  ...base,
  format,
  media: {
    mediaId: `${format.toLowerCase()}-media-1`,
    fileName: `asset.${format === 'IMAGE' ? 'png' : format === 'AUDIO' ? 'mp3' : 'mp4'}`,
    mimeType: format === 'IMAGE' ? 'image/png' : format === 'AUDIO' ? 'audio/mpeg' : 'video/mp4',
    fileSize: 128,
    checksum: '0123456789abcdef',
    version: 1,
  },
});

const text = createArtifactEditorProjection({
  ...base,
  format: 'TEXT',
  content: { body: 'Structured explanation.', language: 'ENGLISH' },
});
assert.equal(text.format, 'TEXT');
if (text.format === 'TEXT') {
  assert.equal(text.content.body, 'Structured explanation.');
}
const textHtml = renderToString(React.createElement(ArtifactProjectionPreview, {
  projection: text,
}));
assert.ok(textHtml.includes('Structured explanation.'));
assert.ok(textHtml.includes('data-artifact-format="TEXT"'));

for (const format of ['VIDEO', 'AUDIO', 'IMAGE', 'ANIMATION'] as const) {
  const projection = createArtifactPreviewProjection(media(format));
  assert.equal(projection.format, format);
  assert.equal('binary' in projection, false);
  assert.equal('body' in projection, false);
  const html = renderToString(React.createElement(ArtifactProjectionPreview, { projection }));
  assert.ok(html.includes(`data-artifact-format="${format}"`));
  assert.ok(html.includes(projection.media.fileName));
  assert.ok(!html.includes('binary'));
}

assert.throws(() => createArtifactPreviewProjection({
  ...media('VIDEO'),
  binary: Buffer.from('not allowed'),
}));
assert.throws(() => createArtifactPreviewProjection({
  ...base,
  format: 'IMAGE',
  content: { body: 'wrong payload', language: 'ENGLISH' },
}));
assert.throws(() => createArtifactPreviewProjection({
  ...media('AUDIO'),
  media: { ...media('AUDIO').media, fileSize: 0 },
}));

console.log('S19-T02 artifact projection tests passed (five formats, strict metadata-only media, and format-safe payloads).');
