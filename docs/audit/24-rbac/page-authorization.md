# Page Authorization Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 11 of 41  

---

## 1. Page Guard Architecture in React Router

In `src/App.tsx` (lines 64–75):
```typescript
function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginPage />;
  // ALL PAGES NESTED UNDER <Layout />
```

### Forensic Finding:
1. **Binary Authentication Gate:** `App.tsx` enforces that any visitor without an authenticated `user` is rendered `<LoginPage />`.
2. **Absence of Route-Level Role Guards:** Once authenticated, **ANY user can directly type ANY URL into the browser bar** (e.g. `/planning`, `/questions/verify`, `/publishing`, `/analytics/overview`).
3. **Client-Side Exception:** Only `RecoveryAdminPage.tsx` contains an internal conditional check (`if (!isAdmin) return <AccessDenied />`). All other pages render their markup and rely on backend API calls failing if unauthorized.
