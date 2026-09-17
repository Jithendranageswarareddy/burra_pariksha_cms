import {
  contentMastersRepository,
  questionsRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  videosRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  socialReviewsRepository,
  publishingRepository,
  assignmentsRepository,
  mediaAssetsRepository,
  validationsRepository,
  contentPlansRepository,
  contentBatchesRepository,
  auditLogRepository,
  usersRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  sequencesRepository,
} from '../lib/repositories';
import { questionConfigRepository } from '../lib/repositories/question-config.repository';

async function verifyFinalCleanup() {
  console.log('=== FINAL PRODUCTION CLEANUP VERIFICATION ===\n');

  const questions = await questionsRepository.findAll();
  const cms = await contentMastersRepository.findAll();
  const validations = await validationsRepository.findAll();

  const users = await usersRepository.findAll();
  const categories = await categoriesRepository.findAll();
  const topics = await topicsRepository.findAll();
  const subtopics = await subtopicsRepository.findAll();
  const qConfig = await questionConfigRepository.findAll();
  const sequences = await sequencesRepository.findAll();
  const plans = await contentPlansRepository.findAll();
  const batches = await contentBatchesRepository.findAll();

  // Downstream
  const qVideos = await questionVideosRepository.findAll();
  const scripts = await scriptsRepository.findAll();
  const scriptVersions = await scriptVersionsRepository.findAll();
  const videos = await videosRepository.findAll();
  const thumbnails = await thumbnailsRepository.findAll();
  const thumbnailVersions = await thumbnailVersionsRepository.findAll();
  const pinnedComments = await pinnedCommentsRepository.findAll();
  const pinnedCommentVersions = await pinnedCommentVersionsRepository.findAll();
  const socialReviews = await socialReviewsRepository.findAll();
  const publishing = await publishingRepository.findAll();
  const assignments = await assignmentsRepository.findAll();
  const mediaAssets = await mediaAssetsRepository.findAll();

  const targetQuestionIds = ['BP-Q-000190', 'BP-Q-000196'];
  const orphanVal = validations.filter((v: any) => targetQuestionIds.includes(v.questionId));

  console.log('--- PRODUCTION SHEET COUNTS ---');
  console.log(`QUESTIONS: ${questions.length} (Expected 0)`);
  console.log(`CONTENT_MASTERS: ${cms.length} (Expected 0)`);
  console.log(`TARGET QUESTION VALIDATIONS: ${orphanVal.length} (Expected 0)`);

  console.log('\n--- FOUNDATION COUNTS ---');
  console.log(`USERS: ${users.length} (Expected 2)`);
  console.log(`CATEGORIES: ${categories.length} (Expected 4)`);
  console.log(`TOPICS: ${topics.length} (Expected 100)`);
  console.log(`SUBTOPICS: ${subtopics.length} (Expected 100)`);
  console.log(`QUESTION_CONFIG: ${qConfig.length} (Expected 2)`);
  console.log(`SEQUENCES: ${sequences.length} (Expected 18)`);
  console.log(`CONTENT_PLANS: ${plans.length} (Expected 0)`);
  console.log(`CONTENT_BATCHES: ${batches.length} (Expected 0)`);

  console.log('\n--- DOWNSTREAM ORPHAN CHECK ---');
  console.log(`QUESTION_VIDEOS: ${qVideos.length}`);
  console.log(`SCRIPTS: ${scripts.length}`);
  console.log(`SCRIPT_VERSIONS: ${scriptVersions.length}`);
  console.log(`VIDEOS: ${videos.length}`);
  console.log(`THUMBNAILS: ${thumbnails.length}`);
  console.log(`THUMBNAIL_VERSIONS: ${thumbnailVersions.length}`);
  console.log(`PINNED_COMMENTS: ${pinnedComments.length}`);
  console.log(`PINNED_COMMENT_VERSIONS: ${pinnedCommentVersions.length}`);
  console.log(`SOCIAL_REVIEWS: ${socialReviews.length}`);
  console.log(`PUBLISHING: ${publishing.length}`);
  console.log(`ASSIGNMENTS: ${assignments.length}`);
  console.log(`MEDIA_ASSETS: ${mediaAssets.length}`);

  const totalDownstream =
    qVideos.length +
    scripts.length +
    scriptVersions.length +
    videos.length +
    thumbnails.length +
    thumbnailVersions.length +
    pinnedComments.length +
    pinnedCommentVersions.length +
    socialReviews.length +
    publishing.length +
    assignments.length +
    mediaAssets.length;

  console.log(`TOTAL DOWNSTREAM ORPHANS: ${totalDownstream} (Expected 0)`);

  console.log('\n--- SEQUENCES STATUS ---');
  for (const seq of sequences) {
    const name = (seq as any).sequenceName || (seq as any).name || (seq as any).id;
    const val = (seq as any).currentValue || (seq as any).value;
    console.log(`Sequence ${name}: ${val}`);
  }

  const isClean =
    questions.length === 0 &&
    cms.length === 0 &&
    orphanVal.length === 0 &&
    users.length === 2 &&
    categories.length === 4 &&
    topics.length === 100 &&
    subtopics.length === 100 &&
    qConfig.length === 2 &&
    sequences.length === 18 &&
    plans.length === 0 &&
    batches.length === 0 &&
    totalDownstream === 0;

  console.log('\n========================================');
  console.log(`FINAL PRODUCTION CONTENT STATE: ${isClean ? 'CLEAN' : 'NOT CLEAN'}`);
  console.log('========================================');
}

verifyFinalCleanup().catch(console.error);
