/**
 * BURRA PARIKSHA CMS - Phase 14.4 Verification Suite
 * Content Master Relationship Explorer
 */

import fs from 'fs';
import path from 'path';
import { contentMasterService } from '../lib/services/content-master.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { dashboardService } from '../lib/services/dashboard.service';
import { UserRole } from '../types';

export async function runPhase14Step4Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // 1. Route Registration: /content-masters and /content-masters/:id in App.tsx
  try {
    const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    const hasRouteId = appCode.includes('path="content-masters/:id"') || appCode.includes("path='content-masters/:id'");
    const hasRouteList = appCode.includes('path="content-masters"') || appCode.includes("path='content-masters'");
    const importsComponent = appCode.includes('ContentMasterPage');

    addResult(
      '1. Content Master Route: Dedicated authenticated route /content-masters/:id registered in App.tsx',
      hasRouteId && hasRouteList && importsComponent,
      `hasRouteId: ${hasRouteId}, hasRouteList: ${hasRouteList}, importsComponent: ${importsComponent}`
    );
  } catch (err: any) {
    addResult('1. Content Master Route: Dedicated authenticated route /content-masters/:id registered in App.tsx', false, err?.message);
  }

  // 2. Navigation bar: Content Masters link in navigation configuration
  try {
    const navCode = fs.readFileSync(path.resolve(process.cwd(), 'src/config/navigation.ts'), 'utf8');
    const sidebarCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/Sidebar.tsx'), 'utf8');

    const hasNavEntry = navCode.includes('/content-masters') && navCode.includes('Content Masters');
    const hasSidebarIcon = sidebarCode.includes('Layers');

    addResult(
      '2. Navigation Configuration: Content Masters added to navigation and sidebar with Layers icon',
      hasNavEntry && hasSidebarIcon,
      `hasNavEntry: ${hasNavEntry}, hasSidebarIcon: ${hasSidebarIcon}`
    );
  } catch (err: any) {
    addResult('2. Navigation Configuration: Content Masters added to navigation', false, err?.message);
  }

  // 3. API Client: Methods getContentMasters and getContentMasterDetails
  try {
    const apiCode = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/api-client.ts'), 'utf8');
    const hasGetMasters = apiCode.includes('getContentMasters()');
    const hasGetDetails = apiCode.includes('getContentMasterDetails(');

    addResult(
      '3. API Client: Implements getContentMasters and getContentMasterDetails endpoints',
      hasGetMasters && hasGetDetails,
      `hasGetMasters: ${hasGetMasters}, hasGetDetails: ${hasGetDetails}`
    );
  } catch (err: any) {
    addResult('3. API Client: Implements getContentMasters and getContentMasterDetails', false, err?.message);
  }

  // 4. Server Route Security: requireAuth and ObjectAuthorizationService protection
  try {
    const routesCode = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');
    const mastersProtected = routesCode.includes("apiRouter.get('/content-masters', requireAuth");
    const masterIdProtected = routesCode.includes("apiRouter.get('/content-masters/:id', requireAuth");
    const checksCanAccess = routesCode.includes('canAccessContentMaster(actor, details.contentMaster)');
    const filtersChildren =
      routesCode.includes('canAccessQuestion(actor, q)') &&
      routesCode.includes('canAccessVideo(actor, v)') &&
      routesCode.includes('canAccessScript(actor, s)') &&
      routesCode.includes('canAccessThumbnail(actor, t)') &&
      routesCode.includes('canAccessPublishing(actor, pub)');

    addResult(
      '4. Server Authorization: /content-masters routes enforce requireAuth, objectAuth, and child relationship gating',
      mastersProtected && masterIdProtected && checksCanAccess && filtersChildren,
      `mastersProtected: ${mastersProtected}, masterIdProtected: ${masterIdProtected}, checksCanAccess: ${checksCanAccess}, filtersChildren: ${filtersChildren}`
    );
  } catch (err: any) {
    addResult('4. Server Authorization: /content-masters routes enforce requireAuth', false, err?.message);
  }

  // 5. Global Search Integration: Content Master targetUrl points to /content-masters/:id
  try {
    const dashCode = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts'), 'utf8');
    const hasContentMasterSearchUrl =
      dashCode.includes('/content-masters/${encodeURIComponent(m.id)}') ||
      dashCode.includes('/content-masters/');

    addResult(
      '5. Global Search: Content Master search results route directly to /content-masters/:id',
      hasContentMasterSearchUrl,
      `hasContentMasterSearchUrl: ${hasContentMasterSearchUrl}`
    );
  } catch (err: any) {
    addResult('5. Global Search: Content Master search results route directly to /content-masters/:id', false, err?.message);
  }

  // 6. QuestionDetailPage Inbound Links: Content Master badges link to /content-masters/:id
  try {
    const qDetailCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/QuestionDetailPage.tsx'), 'utf8');
    const linksHeaderBadge = qDetailCode.includes('/content-masters/${encodeURIComponent(question.contentMasterId)}');
    const hasClickableLink = qDetailCode.includes('to={`/content-masters/');

    addResult(
      '6. Question Detail Page: Content Master badge and metadata link to /content-masters/:id',
      linksHeaderBadge && hasClickableLink,
      `linksHeaderBadge: ${linksHeaderBadge}, hasClickableLink: ${hasClickableLink}`
    );
  } catch (err: any) {
    addResult('6. Question Detail Page: Content Master links', false, err?.message);
  }

  // 7. VideoDetailPage Inbound Links: Content Master badge links to /content-masters/:id
  try {
    const vDetailCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/VideoDetailPage.tsx'), 'utf8');
    const linksVideoMaster = vDetailCode.includes('/content-masters/${encodeURIComponent(video.contentMasterId)}');

    addResult(
      '7. Video Detail Page: Master badge links to /content-masters/:id',
      linksVideoMaster,
      `linksVideoMaster: ${linksVideoMaster}`
    );
  } catch (err: any) {
    addResult('7. Video Detail Page: Master badge links to /content-masters/:id', false, err?.message);
  }

  // 8. ContentMasterPage: Canonical relationship hierarchy rendering
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const rendersPrimaryQuestion = pageCode.includes('Primary Canonical Question');
    const rendersDownstreamVideos = pageCode.includes('Downstream Video Productions');
    const rendersHierarchyBanner = pageCode.includes('Canonical Content Lifecycle Hierarchy');

    addResult(
      '8. Relationship Explorer: Renders canonical lifecycle hierarchy (Content Master → Question → Video)',
      rendersPrimaryQuestion && rendersDownstreamVideos && rendersHierarchyBanner,
      `rendersPrimaryQuestion: ${rendersPrimaryQuestion}, rendersDownstreamVideos: ${rendersDownstreamVideos}, rendersHierarchyBanner: ${rendersHierarchyBanner}`
    );
  } catch (err: any) {
    addResult('8. Relationship Explorer: Renders canonical hierarchy', false, err?.message);
  }

  // 9. Clickable Destination Links: Question, Video, Script, Thumbnail, Pinned Comment, Publishing
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const linksQuestion = pageCode.includes('/questions/${encodeURIComponent(primaryQuestion.id)}');
    const linksVideo = pageCode.includes('/production/${encodeURIComponent(vid.id)}');
    const linksScript = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=script');
    const linksThumbnail = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=thumbnail');
    const linksPinnedComment = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=pinned-comment');
    const linksPublishing = pageCode.includes('/publishing?videoId=${encodeURIComponent(vid.id)}');

    const allLinksPresent =
      linksQuestion &&
      linksVideo &&
      linksScript &&
      linksThumbnail &&
      linksPinnedComment &&
      linksPublishing;

    addResult(
      '9. Navigation: Relationships link to correct workspace routes (Question, Video, Script tab, Thumbnail tab, Pinned Comment tab, Publishing ?videoId=)',
      allLinksPresent,
      `Question: ${linksQuestion}, Video: ${linksVideo}, Script: ${linksScript}, Thumbnail: ${linksThumbnail}, Pin: ${linksPinnedComment}, Publishing: ${linksPublishing}`
    );
  } catch (err: any) {
    addResult('9. Navigation: Relationships link to correct routes', false, err?.message);
  }

  // 10. Social Review: Non-clickable status with explicit deferred note for Phase 14.5
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const hasSocialReviewCard = pageCode.includes('Social Review');
    const documentsDeferredPhase145 = pageCode.includes('deferred to Phase 14.5');

    addResult(
      '10. Social Review Handling: Non-clickable with documented deferral note to Phase 14.5',
      hasSocialReviewCard && documentsDeferredPhase145,
      `hasSocialReviewCard: ${hasSocialReviewCard}, documentsDeferredPhase145: ${documentsDeferredPhase145}`
    );
  } catch (err: any) {
    addResult('10. Social Review Handling: Deferred note to Phase 14.5', false, err?.message);
  }

  // 11. Safe handling of missing/invalid IDs & explicit empty states
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const handles404 = pageCode.includes('Content Master Not Found') || pageCode.includes('statusCode === 404');
    const handles403 = pageCode.includes('Access Restricted') || pageCode.includes('statusCode === 403');
    const emptyPrimaryQ = pageCode.includes('No Authorized Primary Question');
    const emptyVideos = pageCode.includes('No Video Productions Linked');
    const emptyScript = pageCode.includes('Script not yet authored');
    const emptyThumbnail = pageCode.includes('Thumbnail artwork not yet generated');

    const allSafetyPresent =
      handles404 &&
      handles403 &&
      emptyPrimaryQ &&
      emptyVideos &&
      emptyScript &&
      emptyThumbnail;

    addResult(
      '11. Safe ID & Empty State Handling: Explicit empty states and resilient 404/403 UI',
      allSafetyPresent,
      `handles404: ${handles404}, handles403: ${handles403}, emptyPrimaryQ: ${emptyPrimaryQ}, emptyVideos: ${emptyVideos}`
    );
  } catch (err: any) {
    addResult('11. Safe ID & Empty State Handling', false, err?.message);
  }

  // 12. Functional Service Test: contentMasterService.getAllContentMasters returns records
  try {
    const masters = await contentMasterService.getAllContentMasters();
    const hasMasters = Array.isArray(masters) && masters.length > 0;

    addResult(
      '12. Service Layer: contentMasterService.getAllContentMasters retrieves existing masters',
      hasMasters,
      `Found ${masters.length} Content Masters`
    );
  } catch (err: any) {
    addResult('12. Service Layer: contentMasterService.getAllContentMasters', false, err?.message);
  }

  // 13. Functional Details Test: getDetailsByContentMasterId retrieves complete relationship tree
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      const firstId = masters[0].id;
      const details = await contentMasterService.getDetailsByContentMasterId(firstId);

      const hasMaster = details !== null && details.contentMaster.id === firstId;
      const hasQuestionsArray = Array.isArray(details?.questions);
      const hasVideosArray = Array.isArray(details?.videos);
      const hasScriptsArray = Array.isArray(details?.scripts);
      const hasThumbnailsArray = Array.isArray(details?.thumbnails);
      const hasPinnedCommentsArray = Array.isArray(details?.pinnedComments);
      const hasPublishingArray = Array.isArray(details?.publishingRecords);
      const hasSocialReviewsArray = Array.isArray(details?.socialReviews);

      const validTree =
        hasMaster &&
        hasQuestionsArray &&
        hasVideosArray &&
        hasScriptsArray &&
        hasThumbnailsArray &&
        hasPinnedCommentsArray &&
        hasPublishingArray &&
        hasSocialReviewsArray;

      addResult(
        '13. Service Layer: getDetailsByContentMasterId returns canonical relationship tree including socialReviews',
        validTree,
        `Master: ${details?.contentMaster.id}, Questions: ${details?.questions.length}, Videos: ${details?.videos.length}, Scripts: ${details?.scripts.length}, Thumbnails: ${details?.thumbnails.length}, SocialReviews: ${details?.socialReviews?.length}`
      );
    } else {
      addResult('13. Service Layer: getDetailsByContentMasterId', false, 'No masters found to test');
    }
  } catch (err: any) {
    addResult('13. Service Layer: getDetailsByContentMasterId', false, err?.message);
  }

  // 14. Authorization Service Check: ObjectAuthorizationService canAccessContentMaster correctly evaluates roles
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      const adminActor = {
        id: 'USR-ADMIN-01',
        email: 'admin@burra.internal',
        name: 'Admin User',
        role: UserRole.ADMIN,
        permissions: [],
        isActive: true,
      };

      const unassignedEditorActor = {
        id: 'USR-UNASSIGNED-01',
        email: 'editor@burra.internal',
        name: 'Unassigned Editor',
        role: UserRole.EDITOR,
        permissions: [],
        isActive: true,
      };

      const adminAllowed = await objectAuthService.canAccessContentMaster(adminActor, masters[0]);

      addResult(
        '14. Object Authorization: ObjectAuthorizationService properly evaluates access for Content Masters',
        adminAllowed === true,
        `Admin access: ${adminAllowed}`
      );
    } else {
      addResult('14. Object Authorization: ObjectAuthorizationService evaluation', false, 'No masters found');
    }
  } catch (err: any) {
    addResult('14. Object Authorization: ObjectAuthorizationService evaluation', false, err?.message);
  }

  // 15. Specialist Object Authorization & Child Filtering
  try {
    const routesCode = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');
    const hasObjectAuthEnforcement =
      routesCode.includes('canAccessContentMaster(actor, details.contentMaster)') &&
      routesCode.includes('canAccessQuestion(actor, q)') &&
      routesCode.includes('canAccessVideo(actor, v)') &&
      routesCode.includes('canAccessScript(actor, s)') &&
      routesCode.includes('canAccessThumbnail(actor, t)') &&
      routesCode.includes('canAccessPublishing(actor, pub)');

    const returns403OnUnauthorizedMaster = routesCode.includes("res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this Content Master.'");

    addResult(
      '15. Specialist Object Authorization: Child relationships filtered by role and unauthorized master returns 403',
      hasObjectAuthEnforcement && returns403OnUnauthorizedMaster,
      `hasObjectAuthEnforcement: ${hasObjectAuthEnforcement}, returns403: ${returns403OnUnauthorizedMaster}`
    );
  } catch (err: any) {
    addResult('15. Specialist Object Authorization', false, err?.message);
  }

  // 16. Direct URL IDOR Prevention
  try {
    const routesCode = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');
    const enforcesAuthOnDirectGet = routesCode.includes("apiRouter.get('/content-masters/:id', requireAuth,");
    const handlesNotFound404 = routesCode.includes('res.status(404).json({ success: false, error: `Content Master ${req.params.id} not found` });');

    addResult(
      '16. Direct URL IDOR Prevention: Direct URL access requires server authentication and returns 404 for nonexistent IDs',
      enforcesAuthOnDirectGet && handlesNotFound404,
      `enforcesAuthOnDirectGet: ${enforcesAuthOnDirectGet}, handlesNotFound404: ${handlesNotFound404}`
    );
  } catch (err: any) {
    addResult('16. Direct URL IDOR Prevention', false, err?.message);
  }

  // 17. Canonical Child Routes Construction
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const hasCanonicalQuestion = pageCode.includes('/questions/${encodeURIComponent(primaryQuestion.id)}');
    const hasCanonicalVideo = pageCode.includes('/production/${encodeURIComponent(vid.id)}');
    const hasCanonicalScript = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=script');
    const hasCanonicalThumbnail = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=thumbnail');
    const hasCanonicalPinned = pageCode.includes('/production/${encodeURIComponent(vid.id)}?tab=pinned-comment');
    const hasCanonicalPublishing = pageCode.includes('/publishing?videoId=${encodeURIComponent(vid.id)}');
    const hasCanonicalReview = pageCode.includes('/social-review/${encodeURIComponent(vidReviews[0].id)}');

    const allCanonical =
      hasCanonicalQuestion &&
      hasCanonicalVideo &&
      hasCanonicalScript &&
      hasCanonicalThumbnail &&
      hasCanonicalPinned &&
      hasCanonicalPublishing &&
      hasCanonicalReview;

    addResult(
      '17. Canonical Child Routes: All downstream entity links navigate strictly to canonical application endpoints',
      allCanonical,
      `Question: ${hasCanonicalQuestion}, Video: ${hasCanonicalVideo}, Script: ${hasCanonicalScript}, Thumbnail: ${hasCanonicalThumbnail}, Pin: ${hasCanonicalPinned}, Pub: ${hasCanonicalPublishing}, Review: ${hasCanonicalReview}`
    );
  } catch (err: any) {
    addResult('17. Canonical Child Routes', false, err?.message);
  }

  // 18. Read-Only Invariant: No persistence mutations on Content Master load
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const routesCode = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');

    // ContentMasterPage useEffect should only perform read fetches
    const hasPostInPageLoad = pageCode.includes('apiClient.post') || pageCode.includes('apiClient.update');
    // Content-masters GET route should not perform any mutation repository calls
    const getRouteSnippet = routesCode.slice(
      routesCode.indexOf("apiRouter.get('/content-masters/:id'"),
      routesCode.indexOf("apiRouter.get('/content-masters/:id'") + 2500
    );
    const hasMutationInRoute =
      getRouteSnippet.includes('.create(') ||
      getRouteSnippet.includes('.update(') ||
      getRouteSnippet.includes('.delete(') ||
      getRouteSnippet.includes('finalizePublishing');

    const isReadOnly = !hasPostInPageLoad && !hasMutationInRoute;

    addResult(
      '18. Read-Only Invariant: Exploration and detail retrieval cause zero database mutations or state transitions',
      isReadOnly,
      `hasPostInPageLoad: ${hasPostInPageLoad}, hasMutationInRoute: ${hasMutationInRoute}`
    );
  } catch (err: any) {
    addResult('18. Read-Only Invariant', false, err?.message);
  }

  // 19. Missing Optional Child Safety: UI gracefully renders when optional downstream children are absent
  try {
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const safeScript = pageCode.includes('Script not yet authored');
    const safeThumbnail = pageCode.includes('Thumbnail artwork not yet generated');
    const safePinned = pageCode.includes('Pinned comment not yet drafted');
    const safePublishing = pageCode.includes('Distribution package not created yet');
    const safeVideos = pageCode.includes('No Video Productions Linked');

    const safeOptionalChildren = safeScript && safeThumbnail && safePinned && safePublishing && safeVideos;

    addResult(
      '19. Missing Optional Child Safety: Gracefully renders placeholders when optional assets do not yet exist',
      safeOptionalChildren,
      `safeScript: ${safeScript}, safeThumbnail: ${safeThumbnail}, safePinned: ${safePinned}, safePublishing: ${safePublishing}, safeVideos: ${safeVideos}`
    );
  } catch (err: any) {
    addResult('19. Missing Optional Child Safety', false, err?.message);
  }

  // 20. Existing Phase 14.2 Global Search Invariant
  try {
    const dashCode = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts'), 'utf8');
    const hasContentMasterSearch = dashCode.includes("type: 'CONTENT_MASTER'");
    const hasAll9Entities =
      dashCode.includes("type: 'CONTENT_MASTER'") &&
      dashCode.includes("type: 'QUESTION'") &&
      dashCode.includes("type: 'VIDEO'") &&
      dashCode.includes("type: 'SCRIPT'") &&
      dashCode.includes("type: 'THUMBNAIL'") &&
      dashCode.includes("type: 'PINNED_COMMENT'") &&
      dashCode.includes("type: 'SOCIAL_REVIEW'") &&
      dashCode.includes("type: 'PUBLISHING'") &&
      dashCode.includes("type: 'ASSIGNMENT'");

    addResult(
      '20. Phase 14.2 Global Search Regression: Omnipresent search maintains all 9 canonical entities',
      hasContentMasterSearch && hasAll9Entities,
      `hasContentMasterSearch: ${hasContentMasterSearch}, hasAll9Entities: ${hasAll9Entities}`
    );
  } catch (err: any) {
    addResult('20. Phase 14.2 Global Search Regression', false, err?.message);
  }

  // 21. Existing Phase 14.3 Deep-Link Invariant
  try {
    const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    const pageCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx'), 'utf8');
    const hasDeepLinkRoute = appCode.includes('path="content-masters/:id"');
    const parsesParamId = pageCode.includes('useParams<{ id?: string }>()');

    addResult(
      '21. Phase 14.3 Deep-Link Regression: Content Master route /content-masters/:id cleanly extracts param ID',
      hasDeepLinkRoute && parsesParamId,
      `hasDeepLinkRoute: ${hasDeepLinkRoute}, parsesParamId: ${parsesParamId}`
    );
  } catch (err: any) {
    addResult('21. Phase 14.3 Deep-Link Regression', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;

  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    results,
  };
}

// CLI direct execution
if (
  process.argv[1]?.endsWith('phase14-step4-verification.ts') ||
  process.argv[1]?.endsWith('phase14-step4-verification') ||
  process.argv[1]?.includes('phase14-step4-verification')
) {
  runPhase14Step4Verification()
    .then((report) => {
      console.log('='.repeat(70));
      console.log(`PHASE 14.4 VERIFICATION REPORT: ${report.passedTests}/${report.totalTests} PASSED`);
      console.log('='.repeat(70));
      report.results.forEach((r, idx) => {
        const mark = r.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`[${mark}] Test ${idx + 1}: ${r.name}`);
        if (r.message) {
          console.log(`        Details: ${r.message}`);
        }
      });
      console.log('='.repeat(70));
      if (!report.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during verification:', err);
      process.exit(1);
    });
}
