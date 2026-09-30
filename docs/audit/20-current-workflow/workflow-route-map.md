# Workflow Route Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 24 of 41  

---

## 1. Complete Route Configuration for Workflows

From `src/App.tsx`:

```tsx
<Route path="/studio" element={<QuestionStudioPage />} />
<Route path="/questions" element={<QuestionsListPage />} />
<Route path="/questions/:id" element={<QuestionDetailPage />} />
<Route path="/questions/:id/verify" element={<QuestionVerifyApprovePage />} />
<Route path="/videos" element={<ProductionPage />} />
<Route path="/videos/:id" element={<VideoDetailPage />} />
<Route path="/social-review/:reviewId" element={<SocialReviewPage />} />
<Route path="/publishing" element={<PublishingPage />} />
<Route path="/platform-packages" element={<PlatformPackagesPage />} />
<Route path="/social-analytics/:contentId" element={<SocialAnalyticsPage />} />
<Route path="/analytics/*" element={<AnalyticsExperiencePage />} />
```

### Route Shims & Backward-Compatibility Redirects:
- `/videos/:id/script` -> `<Navigate to="/videos/:id?tab=script" replace />`
- `/videos/:id/recording` -> `<Navigate to="/videos/:id?tab=recording" replace />`
- `/videos/:id/editing` -> `<Navigate to="/videos/:id?tab=editing" replace />`
- `/videos/:id/final-review` -> `<Navigate to="/videos/:id?tab=final-review" replace />`
- `/videos/:id/thumbnail` -> `<Navigate to="/videos/:id?tab=thumbnail" replace />`
