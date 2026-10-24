import assert from 'node:assert/strict';
import { ContentArtifactService } from '../../../backend/features/planning/services/content-artifact.service';
import { driveSyncService } from '../../../backend/infrastructure/services/drive-sync.service';
import {
  AnimationBriefSchema,
  AudioNarrationSchema,
} from '../../../shared/contracts/content-artifacts.contract';

const learningUnitId = 'lnu_12345678-1234-4234-8234-123456789abc';
const actor = { id: 'usr_owner', role: 'CONTENT_MANAGER' };
const timestamp = new Date(0).toISOString();

const audio = AudioNarrationSchema.parse({
  id: 'audio-brief-1',
  learningUnitId,
  title: 'Voice narration',
  language: 'TELUGU',
  timing: { estimatedDurationSeconds: 12 },
  createdAt: timestamp,
  updatedAt: timestamp,
});
assert.equal(audio.narration, '');
assert.deepEqual(audio.pronunciationGuides, []);
assert.equal(audio.accessibility.transcript, '');

const animation = AnimationBriefSchema.parse({
  id: 'animation-brief-1',
  learningUnitId,
  title: 'Animated explanation',
  scenes: [{
    sceneNumber: 1,
    description: 'Show the percentage formula.',
    timing: { estimatedDurationSeconds: 4 },
  }],
  createdAt: timestamp,
  updatedAt: timestamp,
});
assert.equal(animation.scenes[0].narration, '');
assert.equal(animation.scenes[0].accessibility.visualDescription, '');
assert.throws(() => AnimationBriefSchema.parse({ ...animation, scenes: [] }));

const service = new ContentArtifactService({
  validateLink: async (id) => {
    assert.equal(id, learningUnitId);
    return undefined;
  },
  uploadAsset: async (params) => ({
    id: `MEDIA-CONTENT-${params.mediaStage}-1`,
    contentId: params.contentId,
    learningUnitId: params.learningUnitId,
    driveFileId: `drive-${params.mediaStage.toLowerCase()}-1`,
    folderId: 'drive-raw-folder',
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: 4,
    checksum: '0123456789abcdef0123456789abcdef',
    version: 1,
    mediaStage: params.mediaStage,
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
});

const audioMetadata = await service.uploadAudioArtifact({
  id: 'audio-1',
  learningUnitId,
  contentId: 'BP-CNT-1',
  fileName: 'narration.wav',
  mimeType: 'audio/wav',
  fileSize: 4,
  createdAt: timestamp,
}, Buffer.from('test'), actor);
assert.equal(audioMetadata.driveFileId, 'drive-audio-1');
assert.equal('binary' in audioMetadata, false);

const animationMetadata = await service.uploadAnimationArtifact({
  id: 'animation-1',
  learningUnitId,
  contentId: 'BP-CNT-1',
  fileName: 'formula.mp4',
  mimeType: 'video/mp4',
  fileSize: 4,
  createdAt: timestamp,
}, Buffer.from('test'), actor);
assert.equal(animationMetadata.driveFileId, 'drive-animation-1');
assert.equal('body' in animationMetadata, false);

const unauthorizedService = new ContentArtifactService({
  validateLink: async () => {
    throw new Error('Learning Unit ownership rejected');
  },
  uploadAsset: async () => {
    throw new Error('Upload must not be reached after authorization failure');
  },
});
await assert.rejects(() => unauthorizedService.uploadAudioArtifact({
  id: 'audio-unauthorized',
  learningUnitId,
  contentId: 'BP-CNT-1',
  fileName: 'narration.wav',
  mimeType: 'audio/wav',
  fileSize: 4,
  createdAt: timestamp,
}, Buffer.from('test'), { id: 'usr_other' }), /ownership rejected/);

assert.throws(() => driveSyncService.validateMediaAsset({
  mediaStage: 'AUDIO',
  fileName: 'narration.wav',
  mimeType: 'audio/ogg',
  fileSize: 4,
}));
assert.throws(() => driveSyncService.validateMediaAsset({
  mediaStage: 'ANIMATION',
  fileName: 'formula.mp4',
  mimeType: 'video/mp4',
  fileSize: 101 * 1024 * 1024,
}));
assert.doesNotThrow(() => driveSyncService.validateMediaAsset({
  mediaStage: 'AUDIO',
  fileName: 'narration.wav',
  mimeType: 'audio/wav',
  fileSize: 4,
}));
assert.doesNotThrow(() => driveSyncService.validateMediaAsset({
  mediaStage: 'RAW',
  fileName: 'recording.mp4',
  mimeType: 'video/mp4',
  fileSize: 4,
}));

console.log('S12-T04 audio and animation tests passed (10 cases).');
