# 27 — Dependency Boundaries

S7-T16 enforces eight implementation-layer boundaries through the
`tests/architecture/s7-t16-dependency-boundaries.test.ts` suite.

| Rule | Importing root | Forbidden dependency |
|---|---|---|
| DB-001 | `frontend/` | `backend/` implementation modules |
| DB-002 | `frontend/` | `database/firestore/` implementation modules |
| DB-003 | `frontend/` | `firebase-admin` and subpaths |
| DB-004 | `frontend/` | `backend/ai/` providers and `@google/genai` |
| DB-005 | `backend/` | `frontend/` implementation modules |
| DB-006 | `database/firestore/` | `frontend/` implementation modules |
| DB-007 | `shared/` | `backend/` implementation modules |
| DB-008 | `shared/` | `frontend/` implementation modules |

The scanner resolves relative imports and the repository `@/*` alias, and
parses ES imports, type imports, re-exports, static dynamic imports, and
CommonJS `require()` calls. It scans production TypeScript/TSX files under the
four canonical roots while excluding build output and dependencies.

Run the complete architecture suite with:

```text
npm run test:architecture
```

The S7-T16 test includes mutation fixtures for every rule. A failure reports
the rule ID, importing file, forbidden specifier, source declaration, line, and
the expected boundary. New rules should extend the scanner's typed rule IDs,
add a production scan assertion, add a forbidden and permitted fixture, and
update this matrix. Exceptions require a narrow, documented rule/file rationale
and a regression fixture; wildcard layer exemptions are not permitted.
