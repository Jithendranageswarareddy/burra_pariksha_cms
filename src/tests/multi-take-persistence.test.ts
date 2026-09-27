/**
 * BURRA PARIKSHA CMS — MULTI-TAKE PERSISTENCE & RAW FOOTAGE VERIFICATION
 */

import { videoService } from '../lib/services/video.service';
import { phase17VideoProductionService } from '../lib/services/phase17-video-production.service';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { idService } from '../lib/services/id.service';
import {
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  UserRole,
  VideoProductionStatus,
} from '../types';

export async function runMultiTakeVerification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
}> {
  console.log('==================================================================');
  console.log('BURRA PARIKSHA CMS — MULTI-TAKE PERSISTENCE VERIFICATION');
  console.log('==================================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition: boolean, code: string, check: string, details?: string) => {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] ${code}: ${check}\n      Details: ${details || 'OK'}`);
    } else {
      console.error(`[FAIL] ${code}: ${check}\n      Details: ${details || 'FAILED'}`);
      throw new Error(`Verification failed at ${code}: ${check} - ${details}`);
    }
  };

  const actor = { id: 'USR-OPERATOR', name: 'Camera Lead', role: UserRole.ADMIN };

  // 1. Setup Content Master and Question
  const contentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
  const questionId = `BP-Q-${Math.floor(100000 + Math.random() * 900000)}`;
  const videoId = await idService.allocateVideoId();

  await contentMastersRepository.create({
    id: contentId,
    title: 'Multi-Take Geometry Theorem',
    primaryQuestionId: questionId,
    status: 'ACTIVE' as any,
    totalVideos: 1,
    totalThumbnails: 0,
    totalScripts: 1,
    totalPinnedComments: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await questionsRepository.create({
    id: questionId,
    contentId,
    contentMasterId: contentId,
    topicId: 'TOPIC-01',
    topicName: 'Geometry',
    subtopicId: 'SUBTOPIC-01',
    subtopicName: 'Triangles',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    questionText: 'Find hypotenuse given sides 3 and 4.',
    optionA: '3',
    optionB: '4',
    optionC: '5',
    optionD: '6',
    correctAnswer: 'C',
    explanation: '3^2 + 4^2 = 25 -> 5',
    options: [
      { textTelugu: '3', isCorrect: false },
      { textTelugu: '4', isCorrect: false },
      { textTelugu: '5', isCorrect: true },
      { textTelugu: '6', isCorrect: false },
    ],
    videoStatus: VideoProductionStatus.SCRIPT_READY,
    status: QuestionStatus.APPROVED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await videosRepository.create({
    id: videoId,
    contentId,
    contentMasterId: contentId,
    questionId,
    title: 'Short: Find hypotenuse given sides 3 and 4',
    status: VideoProductionStatus.SCRIPT_READY,
    priority: 'NORMAL' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 2. Upload Take #1
  console.log('--- Step 1: Uploading Take #1 ---');
  const take1Buffer = Buffer.from('video-payload-take-1-bytes-stream');
  const upload1 = await videoService.uploadVideoAsset({
    contentId,
    videoId,
    fileName: 'vd1.1.mp4',
    mimeType: 'video/mp4',
    size: take1Buffer.length,
    fileStreamOrBuffer: take1Buffer,
    actor,
  });

  assert(
    !!upload1.driveFileId,
    'MT-01',
    'Take #1 uploaded to Google Drive',
    `Drive File ID: ${upload1.driveFileId}`
  );
  assert(
    upload1.version === 1,
    'MT-02',
    'Take #1 version initialized to 1',
    `Version: ${upload1.version}`
  );
  assert(
    upload1.status === VideoProductionStatus.RECORDED,
    'MT-03',
    'Video state transitioned to RECORDED',
    `Status: ${upload1.status}`
  );

  const rawAssetsAfterTake1 = await mediaAssetsRepository.findByContentIdAndStage(contentId, 'RAW');
  assert(
    rawAssetsAfterTake1.length === 1,
    'MT-04',
    'MEDIA_ASSETS contains exactly 1 record after Take #1',
    `Count: ${rawAssetsAfterTake1.length}, ID: ${rawAssetsAfterTake1[0]?.id}`
  );
  assert(
    rawAssetsAfterTake1[0]?.fileName === 'vd1.1.mp4',
    'MT-05',
    'Take #1 file name persisted in MEDIA_ASSETS',
    `File: ${rawAssetsAfterTake1[0]?.fileName}`
  );

  // 3. Upload Take #2
  console.log('\n--- Step 2: Uploading Take #2 ---');
  const take2Buffer = Buffer.from('video-payload-take-2-best-hook-energy');
  const upload2 = await videoService.uploadVideoAsset({
    contentId,
    videoId,
    fileName: 'vd1.2.mp4',
    mimeType: 'video/mp4',
    size: take2Buffer.length,
    fileStreamOrBuffer: take2Buffer,
    actor,
  });

  assert(
    !!upload2.driveFileId && upload2.driveFileId !== upload1.driveFileId,
    'MT-06',
    'Take #2 created a distinct Google Drive file',
    `Drive File #2: ${upload2.driveFileId} !== Drive File #1: ${upload1.driveFileId}`
  );
  assert(
    upload2.version === 2,
    'MT-07',
    'Take #2 incremented version monotonically to 2',
    `Version: ${upload2.version}`
  );

  const rawAssetsAfterTake2 = await mediaAssetsRepository.findByContentIdAndStage(contentId, 'RAW');
  assert(
    rawAssetsAfterTake2.length === 2,
    'MT-08',
    'MEDIA_ASSETS contains BOTH takes (Take #1 and Take #2 preserved)',
    `Total raw assets in DB: ${rawAssetsAfterTake2.length}`
  );

  const take1Persisted = rawAssetsAfterTake2.find((a) => a.version === 1);
  const take2Persisted = rawAssetsAfterTake2.find((a) => a.version === 2);
  assert(
    take1Persisted?.fileName === 'vd1.1.mp4' && take2Persisted?.fileName === 'vd1.2.mp4',
    'MT-09',
    'Both file identities intact in MEDIA_ASSETS',
    `Take 1: ${take1Persisted?.fileName}, Take 2: ${take2Persisted?.fileName}`
  );

  // 4. Verify History API Endpoint Service
  console.log('\n--- Step 3: Production History & Active Video Pointer ---');
  const history = await phase17VideoProductionService.getVideoProductionHistory(videoId);
  assert(
    history.rawAssets.length === 2,
    'MT-10',
    'getVideoProductionHistory returns all ingested takes',
    `Returned ${history.rawAssets.length} takes`
  );
  assert(
    history.rawAssets[0]?.version === 2 && history.rawAssets[1]?.version === 1,
    'MT-11',
    'Raw assets sorted descending by version for UI display',
    `Order: V${history.rawAssets[0]?.version}, V${history.rawAssets[1]?.version}`
  );

  // 5. Verify Video Enriched Entity
  const enrichedVideo = await videoService.getVideoById(videoId);
  assert(
    (enrichedVideo?.rawAssets?.length ?? 0) === 2,
    'MT-12',
    'getVideoById returns video enriched with rawAssets collection',
    `rawAssets count: ${enrichedVideo?.rawAssets?.length}`
  );

  return {
    passed: passedCount === totalCount,
    totalChecks: totalCount,
    passedChecks: passedCount,
    failedChecks: totalCount - passedCount,
  };
}

if (process.argv[1]?.includes('multi-take-persistence.test')) {
  runMultiTakeVerification()
    .then((r) => {
      console.log(`\n==================================================================`);
      console.log(`VERDICT: ${r.passed ? 'ALL CHECKS PASSED' : 'FAILED'}`);
      console.log(`==================================================================`);
      process.exit(r.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
