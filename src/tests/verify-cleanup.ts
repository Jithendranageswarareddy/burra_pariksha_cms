import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { scriptVersionsRepository } from '../lib/repositories/script-versions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { thumbnailVersionsRepository } from '../lib/repositories/thumbnail-versions.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { pinnedCommentVersionsRepository } from '../lib/repositories/pinned-comment-versions.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { categoriesRepository } from '../lib/repositories/categories.repository';
import { usersRepository } from '../lib/repositories/users.repository';

async function main() {
  console.log('=== REAL-TIME GOOGLE SHEETS CONTENT STATUS ===');
  
  const repos = {
    CONTENT_MASTERS: contentMastersRepository,
    QUESTIONS: questionsRepository,
    VIDEOS: videosRepository,
    SCRIPT: scriptsRepository,
    SCRIPT_VERSIONS: scriptVersionsRepository,
    THUMBNAILS: thumbnailsRepository,
    THUMBNAIL_VERSIONS: thumbnailVersionsRepository,
    PINNED_COMMENTS: pinnedCommentsRepository,
    PINNED_COMMENT_VERSIONS: pinnedCommentVersionsRepository,
    SOCIAL_REVIEWS: socialReviewsRepository,
    PUBLISHING: publishingRepository,
    ASSIGNMENTS: assignmentsRepository,
    WORKFLOW: workflowRepository,
    MEDIA_ASSETS: mediaAssetsRepository,
    QUESTION_VALIDATIONS: validationsRepository,
    USERS: usersRepository,
    CATEGORIES: categoriesRepository,
  };

  for (const [name, repo] of Object.entries(repos)) {
    try {
      const records = await repo.findAll();
      const ids = records.map((r: any) => r.id);
      console.log(`Tab: ${name.padEnd(25)} | Count: ${records.length} | IDs: [${ids.slice(0, 10).join(', ')}${ids.length > 10 ? '...' : ''}]`);
    } catch (err: any) {
      console.error(`Error reading ${name}:`, err.message);
    }
  }
}

main().catch(console.error);
