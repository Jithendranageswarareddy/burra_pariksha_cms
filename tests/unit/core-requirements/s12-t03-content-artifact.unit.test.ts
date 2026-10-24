import assert from 'node:assert/strict';
import { ContentArtifactService } from '../../../backend/features/planning/services/content-artifact.service';
import { ImageArtifactInputSchema, TextArtifactSchema } from '../../../shared/contracts/content-artifacts.contract';

const learningUnitId = 'lnu_12345678-1234-4234-8234-123456789abc';
const actor = { id: 'usr_owner', role: 'CONTENT_MANAGER' };

const service = new ContentArtifactService({
  validateLink: async (id) => {
    assert.equal(id, learningUnitId);
    return undefined;
  },
  uploadAsset: async (params) => {
    assert.equal(params.mediaStage, 'THUMBNAIL');
    assert.equal(params.learningUnitId, learningUnitId);
    assert(Buffer.isBuffer(params.bodyStreamOrBuffer));
    return {
      id: 'MEDIA-CONTENT-THUMBNAIL-1',
      contentId: params.contentId,
      learningUnitId: params.learningUnitId,
      driveFileId: 'drive-image-1',
      folderId: 'drive-thumbnail-folder',
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: 4,
      checksum: '0123456789abcdef0123456789abcdef',
      version: 1,
      mediaStage: 'THUMBNAIL',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    };
  },
});

const text = service.validateTextArtifact({
  id: 'txt-1',
  learningUnitId,
  title: 'Discount explanation',
  body: 'Structured text remains application content.',
  language: 'TELUGU',
  format: 'PLAIN_TEXT',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
});
assert.equal(text.learningUnitId, learningUnitId);

assert.throws(() => TextArtifactSchema.parse({ ...text, body: '' }));
assert.throws(() => ImageArtifactInputSchema.parse({
  id: 'img-1',
  learningUnitId,
  contentId: 'BP-CNT-1',
  fileName: 'image.gif',
  mimeType: 'image/gif',
  fileSize: 4,
  altText: 'Image',
  createdAt: new Date(0).toISOString(),
}));
assert.throws(() => ImageArtifactInputSchema.parse({
  id: 'img-1',
  learningUnitId: 'not-a-learning-unit',
  contentId: 'BP-CNT-1',
  fileName: 'image.png',
  mimeType: 'image/png',
  fileSize: 4,
  altText: 'Image',
  createdAt: new Date(0).toISOString(),
}));

const image = await service.uploadImageArtifact({
  id: 'img-1',
  learningUnitId,
  contentId: 'BP-CNT-1',
  fileName: 'image.png',
  mimeType: 'image/png',
  fileSize: 4,
  altText: 'Synthetic image',
  createdAt: new Date(0).toISOString(),
}, Buffer.from('test'), actor);
assert.equal(image.driveFileId, 'drive-image-1');
assert.equal('body' in image, false);
assert.equal('binary' in image, false);

await assert.rejects(() => service.uploadImageArtifact({
id: 'img-2',
learningUnitId,
contentId: 'BP-CNT-1',
fileName: 'image.png',
mimeType: 'image/png',
fileSize: 99,
altText: 'Synthetic image',
createdAt: new Date(0).toISOString(),
}, Buffer.from('test'), actor));

console.log('S12-T03 content artifact tests passed (6 cases).');
