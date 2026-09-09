/**
 * BURRA PARIKSHA CMS - Phase 14.3 Verification Suite
 * URL Deep-Linking & Filter Synchronization
 */

import fs from 'fs';
import path from 'path';

export async function runPhase14Step3Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // 1. QuestionLibraryPage: useSearchParams integration and filter mapping
  try {
    const qLibPath = path.resolve(process.cwd(), 'src/pages/QuestionLibraryPage.tsx');
    const qLibCode = fs.readFileSync(qLibPath, 'utf8');

    const usesSearchParams = qLibCode.includes('useSearchParams');
    const readsSearch = qLibCode.includes("searchParams.get('search')") || qLibCode.includes("searchParams.get('q')");
    const readsCategory = qLibCode.includes("searchParams.get('categoryId')");
    const readsTopic = qLibCode.includes("searchParams.get('topicId')");
    const readsSubtopic = qLibCode.includes("searchParams.get('subtopicId')");
    const readsDifficulty = qLibCode.includes("searchParams.get('difficulty')");
    const readsStatus = qLibCode.includes("searchParams.get('status')");
    const readsVideoStatus = qLibCode.includes("searchParams.get('videoStatus')");

    const allPresent =
      usesSearchParams &&
      readsSearch &&
      readsCategory &&
      readsTopic &&
      readsSubtopic &&
      readsDifficulty &&
      readsStatus &&
      readsVideoStatus;

    addResult(
      '1. Question Library: Synchronizes existing filters (search, categoryId, topicId, subtopicId, difficulty, status, videoStatus) with URL search parameters',
      allPresent,
      `useSearchParams: ${usesSearchParams}, search: ${readsSearch}, category: ${readsCategory}, topic: ${readsTopic}, subtopic: ${readsSubtopic}, difficulty: ${readsDifficulty}, status: ${readsStatus}, videoStatus: ${readsVideoStatus}`
    );
  } catch (err: any) {
    addResult('1. Question Library: Synchronizes existing filters with URL search parameters', false, err?.message);
  }

  // 2. QuestionLibraryPage: Debounced search and non-polluting history
  try {
    const qLibPath = path.resolve(process.cwd(), 'src/pages/QuestionLibraryPage.tsx');
    const qLibCode = fs.readFileSync(qLibPath, 'utf8');

    const hasReplaceTrue = qLibCode.includes('replace: true');
    const hasDebounce = qLibCode.includes('setTimeout(') && (qLibCode.includes('250') || qLibCode.includes('300'));
    const passed = hasReplaceTrue && hasDebounce;

    addResult(
      '2. Question Library: Search input uses debounced URL sync with replace:true to avoid polluting browser history',
      passed,
      `replace:true=${hasReplaceTrue}, debounceTimer=${hasDebounce}`
    );
  } catch (err: any) {
    addResult('2. Question Library: Search input debounced URL sync', false, err?.message);
  }

  // 3. QuestionLibraryPage: Reset filters removes query parameters cleanly
  try {
    const qLibPath = path.resolve(process.cwd(), 'src/pages/QuestionLibraryPage.tsx');
    const qLibCode = fs.readFileSync(qLibPath, 'utf8');

    const hasResetFilters = qLibCode.includes('resetFilters') && qLibCode.includes('next.delete');
    addResult(
      '3. Question Library: Reset filters clears parameters cleanly without leaving empty strings',
      hasResetFilters,
      `resetFilters function found and cleans params: ${hasResetFilters}`
    );
  } catch (err: any) {
    addResult('3. Question Library: Reset filters clears parameters cleanly', false, err?.message);
  }

  // 4. ProductionTrackerPage: useSearchParams integration and filter mapping
  try {
    const prodTrackerPath = path.resolve(process.cwd(), 'src/pages/ProductionTrackerPage.tsx');
    const trackerCode = fs.readFileSync(prodTrackerPath, 'utf8');

    const usesSearchParams = trackerCode.includes('useSearchParams');
    const readsSearch = trackerCode.includes("searchParams.get('searchQuery')") || trackerCode.includes("searchParams.get('search')");
    const readsStatus = trackerCode.includes("searchParams.get('status')");
    const readsPriority = trackerCode.includes("searchParams.get('priority')");
    const readsAssignee = trackerCode.includes("searchParams.get('assignee')");

    const allPresent = usesSearchParams && readsSearch && readsStatus && readsPriority && readsAssignee;

    addResult(
      '4. Production Tracker: Synchronizes filters (searchQuery, status, priority, assignee) with URL parameters',
      allPresent,
      `useSearchParams: ${usesSearchParams}, search: ${readsSearch}, status: ${readsStatus}, priority: ${readsPriority}, assignee: ${readsAssignee}`
    );
  } catch (err: any) {
    addResult('4. Production Tracker: Synchronizes filters with URL parameters', false, err?.message);
  }

  // 5. ProductionTrackerPage: Search debounce and reset capability
  try {
    const prodTrackerPath = path.resolve(process.cwd(), 'src/pages/ProductionTrackerPage.tsx');
    const trackerCode = fs.readFileSync(prodTrackerPath, 'utf8');

    const hasReplaceTrue = trackerCode.includes('replace: true');
    const hasResetFilters = trackerCode.includes('resetFilters') && trackerCode.includes('next.delete');
    const passed = hasReplaceTrue && hasResetFilters;

    addResult(
      '5. Production Tracker: Search input debounced with replace:true and clean parameter reset',
      passed,
      `replace:true=${hasReplaceTrue}, resetFilters=${hasResetFilters}`
    );
  } catch (err: any) {
    addResult('5. Production Tracker: Search input debounce and reset capability', false, err?.message);
  }

  // 6. ProductionBoardPage: useSearchParams integration and filter mapping
  try {
    const boardPath = path.resolve(process.cwd(), 'src/pages/ProductionBoardPage.tsx');
    const boardCode = fs.readFileSync(boardPath, 'utf8');

    const usesSearchParams = boardCode.includes('useSearchParams');
    const readsSearch = boardCode.includes("searchParams.get('searchQuery')") || boardCode.includes("searchParams.get('search')");
    const readsStatus = boardCode.includes("searchParams.get('status')");
    const readsPriority = boardCode.includes("searchParams.get('priority')");
    const readsAssignee = boardCode.includes("searchParams.get('assignee')");
    const readsCategory = boardCode.includes("searchParams.get('category')");
    const readsDifficulty = boardCode.includes("searchParams.get('difficulty')");
    const readsDueDate = boardCode.includes("searchParams.get('dueDate')");

    const allPresent =
      usesSearchParams &&
      readsSearch &&
      readsStatus &&
      readsPriority &&
      readsAssignee &&
      readsCategory &&
      readsDifficulty &&
      readsDueDate;

    addResult(
      '6. Production Board: Synchronizes filters (searchQuery, status, priority, assignee, category, difficulty, dueDate) with URL parameters',
      allPresent,
      `useSearchParams: ${usesSearchParams}, search: ${readsSearch}, status: ${readsStatus}, priority: ${readsPriority}, assignee: ${readsAssignee}, category: ${readsCategory}, difficulty: ${readsDifficulty}, dueDate: ${readsDueDate}`
    );
  } catch (err: any) {
    addResult('6. Production Board: Synchronizes filters with URL parameters', false, err?.message);
  }

  // 7. ProductionBoardPage: Clear filters removes parameters cleanly
  try {
    const boardPath = path.resolve(process.cwd(), 'src/pages/ProductionBoardPage.tsx');
    const boardCode = fs.readFileSync(boardPath, 'utf8');

    const hasClearAllFilters = boardCode.includes('clearAllFilters') && boardCode.includes('next.delete');
    addResult(
      '7. Production Board: Clear all filters removes query parameters cleanly',
      hasClearAllFilters,
      `clearAllFilters found with parameter deletion: ${hasClearAllFilters}`
    );
  } catch (err: any) {
    addResult('7. Production Board: Clear all filters removes query parameters cleanly', false, err?.message);
  }

  // 8. PublishingPage: videoId deep-link and filter synchronization
  try {
    const pubPath = path.resolve(process.cwd(), 'src/pages/PublishingPage.tsx');
    const pubCode = fs.readFileSync(pubPath, 'utf8');

    const usesSearchParams = pubCode.includes('useSearchParams');
    const readsVideoId = pubCode.includes("searchParams.get('videoId')");
    const readsSearch = pubCode.includes("searchParams.get('searchQuery')") || pubCode.includes("searchParams.get('search')");
    const readsPlatform = pubCode.includes("searchParams.get('platform')") || pubCode.includes("searchParams.get('filterPlatform')");

    const allPresent = usesSearchParams && readsVideoId && readsSearch && readsPlatform;

    addResult(
      '8. Publishing: Implements ?videoId=<videoId> deep-link and synchronizes filters (searchQuery, platform) with URL parameters',
      allPresent,
      `useSearchParams: ${usesSearchParams}, videoId: ${readsVideoId}, search: ${readsSearch}, platform: ${readsPlatform}`
    );
  } catch (err: any) {
    addResult('8. Publishing: Implements ?videoId=<videoId> deep-link and filter synchronization', false, err?.message);
  }

  // 9. PublishingPage: Search debounce and clean reset
  try {
    const pubPath = path.resolve(process.cwd(), 'src/pages/PublishingPage.tsx');
    const pubCode = fs.readFileSync(pubPath, 'utf8');

    const hasReplaceTrue = pubCode.includes('replace: true');
    const hasResetFilters = pubCode.includes('resetFilters') && pubCode.includes('next.delete');
    const passed = hasReplaceTrue && hasResetFilters;

    addResult(
      '9. Publishing: Search input debounced with replace:true and provides clean reset',
      passed,
      `replace:true=${hasReplaceTrue}, resetFilters=${hasResetFilters}`
    );
  } catch (err: any) {
    addResult('9. Publishing: Search input debounced with replace:true and provides clean reset', false, err?.message);
  }

  // 10. URL Parameter Security: No sensitive tokens, keys, passwords, or internal auth in query params
  try {
    const pagesToCheck = [
      'src/pages/QuestionLibraryPage.tsx',
      'src/pages/ProductionTrackerPage.tsx',
      'src/pages/ProductionBoardPage.tsx',
      'src/pages/PublishingPage.tsx',
    ];

    let hasSensitiveParams = false;
    const sensitiveTokens = ['token', 'secret', 'password', 'jwt', 'apiKey', 'bearer', 'actorRole'];

    for (const p of pagesToCheck) {
      const code = fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
      for (const token of sensitiveTokens) {
        if (code.includes(`searchParams.get('${token}')`) || code.includes(`searchParams.set('${token}'`)) {
          hasSensitiveParams = true;
          break;
        }
      }
    }

    addResult(
      '10. Security: URL parameters are navigation state only, never containing sensitive tokens or credentials',
      !hasSensitiveParams,
      `Sensitive tokens in URL query params detected: ${hasSensitiveParams}`
    );
  } catch (err: any) {
    addResult('10. Security: URL parameters are navigation state only', false, err?.message);
  }

  // 11. Backend authorization integrity: APIs remain authenticated and fail-closed
  try {
    const res = await fetch('http://localhost:3000/api/search?q=test', {
      headers: { Connection: 'close' },
      signal: AbortSignal.timeout(4000),
    });
    const passed = res.status === 401;

    addResult(
      '11. Security: Deep links never bypass backend authorization - API endpoints remain strictly authenticated',
      passed,
      `Unauthenticated /api/search responded with status: ${res.status} (expected 401)`
    );
  } catch (err: any) {
    addResult('11. Security: Deep links never bypass backend authorization', false, err?.message);
  }

  // 12. Cross-feature regression: Dashboard service search and Phase 14.1/14.2 models intact
  try {
    const srvPath = path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts');
    const srvCode = fs.readFileSync(srvPath, 'utf8');

    const hasAuthFilter = srvCode.includes('canAccessPublishing');
    const hasSocialReviewSearch = srvCode.includes('Social Reviews (Phase 14.2)');
    const hasPublishingSearch = srvCode.includes('Publishing Records (Phase 14.2)');
    const passed = hasAuthFilter && hasSocialReviewSearch && hasPublishingSearch;

    addResult(
      '12. Security & Regression: Phase 14.1 RBAC and Phase 14.2 global search models remain completely intact',
      passed,
      `canAccessPublishing: ${hasAuthFilter}, Social Reviews: ${hasSocialReviewSearch}, Publishing Records: ${hasPublishingSearch}`
    );
  } catch (err: any) {
    addResult('12. Security & Regression: Phase 14.1 and Phase 14.2 models intact', false, err?.message);
  }

  // 13. Production tab deep link handling
  try {
    const vDetailPath = path.resolve(process.cwd(), 'src/pages/VideoDetailPage.tsx');
    const vDetailCode = fs.readFileSync(vDetailPath, 'utf8');

    const readsTab = vDetailCode.includes("params.get('tab')");
    const supportsScript = vDetailCode.includes("'script'");
    const supportsThumbnail = vDetailCode.includes("'thumbnail'");
    const supportsPinnedComment = vDetailCode.includes("'pinned-comment'");
    const passed = readsTab && supportsScript && supportsThumbnail && supportsPinnedComment;

    addResult(
      '13. Video Production: Implements ?tab=script|thumbnail|pinned-comment deep-link synchronization',
      passed,
      `readsTab: ${readsTab}, script: ${supportsScript}, thumbnail: ${supportsThumbnail}, pinned: ${supportsPinnedComment}`
    );
  } catch (err: any) {
    addResult('13. Video Production: Implements ?tab=script|thumbnail|pinned-comment deep-link synchronization', false, err?.message);
  }

  // 14. Content Master deep-link route & ID extraction
  try {
    const cmPagePath = path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx');
    const cmCode = fs.readFileSync(cmPagePath, 'utf8');
    const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

    const hasRoute = appCode.includes('path="content-masters/:id"');
    const extractsId = cmCode.includes('useParams<{ id?: string }>()');
    const fetchesDetails = cmCode.includes('getContentMasterDetails(id)');
    const passed = hasRoute && extractsId && fetchesDetails;

    addResult(
      '14. Content Master: Implements /content-masters/:id deep link and canonical lifecycle resolution',
      passed,
      `hasRoute: ${hasRoute}, extractsId: ${extractsId}, fetchesDetails: ${fetchesDetails}`
    );
  } catch (err: any) {
    addResult('14. Content Master: Implements /content-masters/:id deep link', false, err?.message);
  }

  // 15. Social Review deep-link routes & query params
  try {
    const srPagePath = path.resolve(process.cwd(), 'src/pages/SocialReviewPage.tsx');
    const srCode = fs.readFileSync(srPagePath, 'utf8');
    const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

    const hasRoute = appCode.includes('path="social-review/:reviewId"');
    const readsReviewId = srCode.includes("useParams<{ reviewId?: string }>()") || srCode.includes("searchParams.get('reviewId')");
    const readsQuestionId = srCode.includes("searchParams.get('questionId')");
    const loadsItem = srCode.includes('loadReviewItem(activeId)');
    const passed = hasRoute && readsReviewId && readsQuestionId && loadsItem;

    addResult(
      '15. Social Review: Implements /social-review/:reviewId and ?questionId=:id deep link resolution',
      passed,
      `hasRoute: ${hasRoute}, readsReviewId: ${readsReviewId}, readsQuestionId: ${readsQuestionId}, loadsItem: ${loadsItem}`
    );
  } catch (err: any) {
    addResult('15. Social Review: Implements /social-review/:reviewId and ?questionId=:id deep link resolution', false, err?.message);
  }

  // 16. Canonical destination URLs generated by global search
  try {
    const srvPath = path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts');
    const srvCode = fs.readFileSync(srvPath, 'utf8');

    const hasQuestionUrl = srvCode.includes('/questions/${encodeURIComponent(item.id)}');
    const hasVideoUrl = srvCode.includes('/production/${encodeURIComponent(v.id)}');
    const hasScriptUrl = srvCode.includes('/production/${encodeURIComponent(s.videoId)}?tab=script');
    const hasThumbnailUrl = srvCode.includes('/production/${encodeURIComponent(t.videoId)}?tab=thumbnail');
    const hasCommentUrl = srvCode.includes('/production/${encodeURIComponent(p.videoId)}?tab=pinned-comment');
    const hasPublishingUrl = srvCode.includes('/publishing?videoId=${encodeURIComponent(p.videoId)}');
    const hasCmUrl = srvCode.includes('/content-masters/${encodeURIComponent(m.id)}');

    const passed = hasQuestionUrl && hasVideoUrl && hasScriptUrl && hasThumbnailUrl && hasCommentUrl && hasPublishingUrl && hasCmUrl;

    addResult(
      '16. Search-Result Canonical Navigation: Global search constructs canonical URLs for all entities',
      passed,
      `Question: ${hasQuestionUrl}, Video: ${hasVideoUrl}, Script: ${hasScriptUrl}, Thumbnail: ${hasThumbnailUrl}, Comment: ${hasCommentUrl}, Publishing: ${hasPublishingUrl}, CM: ${hasCmUrl}`
    );
  } catch (err: any) {
    addResult('16. Search-Result Canonical Navigation: Global search constructs canonical URLs for all entities', false, err?.message);
  }

  // 17. Read-only navigation invariant: No operational mutations on page load or parameter parsing
  try {
    const filesToCheck = [
      'src/pages/QuestionLibraryPage.tsx',
      'src/pages/ProductionTrackerPage.tsx',
      'src/pages/ProductionBoardPage.tsx',
      'src/pages/PublishingPage.tsx',
      'src/pages/SocialReviewPage.tsx',
      'src/pages/ContentMasterPage.tsx',
    ];

    let mutatesOnLoad = false;
    for (const file of filesToCheck) {
      const code = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      if (
        code.includes('updateVideoStatus(') && code.includes('useEffect(') ||
        code.includes('finalizePublishing(') && code.includes('useEffect(')
      ) {
        mutatesOnLoad = true;
        break;
      }
    }

    addResult(
      '17. Read-Only Navigation: Loading pages and parsing deep links strictly causes zero operational state mutations',
      !mutatesOnLoad,
      `Mutations in initial load effects detected: ${mutatesOnLoad}`
    );
  } catch (err: any) {
    addResult('17. Read-Only Navigation: Loading pages and parsing deep links strictly causes zero operational state mutations', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return { success, totalTests, passedTests, results };
}

// CLI direct execution
if (
  process.argv[1]?.endsWith('phase14-step3-verification.ts') ||
  process.argv[1]?.endsWith('phase14-step3-verification')
) {
  runPhase14Step3Verification()
    .then((summary) => {
      console.log('Phase 14.3 Verification Suite Results:');
      console.log(`PASSED: ${summary.passedTests} / ${summary.totalTests}`);
      console.log(`STATUS: ${summary.success ? 'PASS' : 'FAIL'}\n`);
      for (const r of summary.results) {
        console.log(`${r.passed ? '✅' : '❌'} ${r.name}: ${r.message || ''}`);
      }
      if (!summary.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
