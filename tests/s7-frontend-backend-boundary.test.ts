/**
 * BURRA PARIKSHA CMS — S7 Frontend / Backend Architectural Boundary Test
 *
 * Verifies that:
 * 1. The client application under `frontend/` contains ZERO dependencies on backend
 *    domain services, repositories, Firestore adapters, Firebase Admin, server implementation,
 *    or server-side AI validators.
 * 2. The server application under `backend/` contains ZERO dependencies on frontend
 *    modules (React, JSX, presentation components, pages, contexts, or frontend api clients).
 * 3. Physical ownership: Active Express/backend implementation lives under `backend/`
 *    and old backend implementation folders in `src/` are fully decommissioned.
 *
 * Authoritative boundary:
 * Frontend -> Frontend API Layer -> Backend API Gateway -> Domain/Database/AI
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFilesRecursively(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

interface BoundaryRule {
  category: string;
  pattern: RegExp;
  description: string;
}

const FORBIDDEN_FRONTEND_RULES: BoundaryRule[] = [
  {
    category: 'Backend Services',
    pattern: /(from\s+['"][^'"]*\/services(\/[^'"]*)?['"]|import\(['"][^'"]*\/services\/[^'"]*['"]\))/,
    description: 'Direct import of backend application/domain services',
  },
  {
    category: 'Repositories',
    pattern: /(from\s+['"][^'"]*\/repositories(\/[^'"]*)?['"]|import\(['"][^'"]*\/repositories\/[^'"]*['"]\))/,
    description: 'Direct import of database repositories',
  },
  {
    category: 'Database & Schema Infrastructure',
    pattern: /(from\s+['"][^'"]*\/schemas(\/[^'"]*)?['"]|import\(['"][^'"]*\/schemas\/[^'"]*['"]\))/,
    description: 'Direct import of database/validation schemas or Google Sheets schema contracts',
  },
  {
    category: 'Database Adapters & Infrastructure',
    pattern: /(from\s+['"][^'"]*\/db(\/[^'"]*)?['"]|import\(['"][^'"]*\/db\/[^'"]*['"]\))/,
    description: 'Direct import of database layer or db adapters',
  },
  {
    category: 'Firestore & Firebase Admin',
    pattern: /(from\s+['"][^'"]*(firebase|firebase-admin)(\/[^'"]*)?['"]|import\(['"][^'"]*(firebase|firebase-admin)[^'"]*['"]\))/,
    description: 'Direct import of Firebase Admin SDK or Firestore adapters',
  },
  {
    category: 'Backend AI Validators',
    pattern: /(from\s+['"][^'"]*\/ai\/validators(\/[^'"]*)?['"]|\bCandidateValidator\b|\bMathematicalValidator\b)/,
    description: 'Execution or import of server-side AI validation engines',
  },
  {
    category: 'AI Provider Implementation',
    pattern: /from\s+['"]@google\/genai['"]/,
    description: 'Client-side import of Google Gemini SDK',
  },
  {
    category: 'Server Implementation',
    pattern: /from\s+['"][^'"]*(\/src\/server|\/backend\/server)(\/[^'"]*)?['"]/,
    description: 'Direct import of server routing or server infrastructure',
  },
  {
    category: 'Workflow Engine Implementation',
    pattern: /from\s+['"][^'"]*\/workflow\/workflow-engine(\.ts)?['"]/,
    description: 'Direct import of backend workflow engine state machine',
  },
  {
    category: 'Backend Root Import',
    pattern: /from\s+['"][^'"]*\/backend\//,
    description: 'Direct import from backend/ architectural layer',
  },
  {
    category: 'Server Environment Secrets',
    pattern: /\bprocess\.env\b/,
    description: 'Access to server-only process.env secrets in client bundle',
  },
  {
    category: 'Database Root Import',
    pattern: /(from\s+['"][^'"]*\/database(\/[^'"]*)?['"]|import\(['"][^'"]*\/database\/[^'"]*['"]\))/,
    description: 'Direct import from database/ architectural layer',
  },
  {
    category: 'Legacy src/types Root Import',
    pattern: /(from\s+['"][^'"]*\/src\/types(\/[^'"]*)?['"]|import\(['"][^'"]*\/src\/types\/[^'"]*['"]\))/,
    description: 'Direct import of legacy src/types in frontend (must import from shared/)',
  },
];

const FORBIDDEN_BACKEND_RULES: BoundaryRule[] = [
  {
    category: 'Frontend Root Import',
    pattern: /from\s+['"][^'"]*\/frontend\//,
    description: 'Direct import of frontend/ modules in backend',
  },
  {
    category: 'React Presentation Framework',
    pattern: /from\s+['"](react|react-dom|react-router-dom)['"]/,
    description: 'Import of React presentation libraries in backend',
  },
  {
    category: 'Frontend UI Components',
    pattern: /from\s+['"][^'"]*\/frontend\/components\//,
    description: 'Import of UI components in backend',
  },
  {
    category: 'Frontend Pages',
    pattern: /from\s+['"][^'"]*\/frontend\/pages\//,
    description: 'Import of frontend pages in backend',
  },
  {
    category: 'Frontend Contexts',
    pattern: /from\s+['"][^'"]*\/frontend\/contexts\//,
    description: 'Import of frontend React contexts in backend',
  },
  {
    category: 'Frontend Design System',
    pattern: /from\s+['"][^'"]*\/frontend\/design-system\//,
    description: 'Import of frontend design system in backend',
  },
];

async function runBoundarySuite() {
  console.log('============================================================');
  console.log('BP-CMS S7 FRONTEND / BACKEND BOUNDARY ARCHITECTURAL TEST');
  console.log('============================================================\n');

  // 1. FRONTEND BOUNDARY AUDIT
  const frontendDir = path.resolve(__dirname, '../frontend');
  assert(fs.existsSync(frontendDir), 'frontend/ directory must exist');

  const allFrontendFiles = scanFilesRecursively(frontendDir);
  console.log(`[1] Scanning ${allFrontendFiles.length} frontend files across ${frontendDir}...`);

  const frontendViolations: Array<{ file: string; category: string; description: string; line: number }> = [];

  for (const filePath of allFrontendFiles) {
    const relPath = path.relative(frontendDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rule of FORBIDDEN_FRONTEND_RULES) {
      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
          return;
        }

        if (rule.pattern.test(line)) {
          frontendViolations.push({
            file: relPath,
            category: rule.category,
            description: rule.description,
            line: lineIndex + 1,
          });
        }
      });
    }
  }

  if (frontendViolations.length > 0) {
    console.error(`FAILED: Found ${frontendViolations.length} frontend boundary violations:`);
    frontendViolations.forEach((v) => {
      console.error(`  - [${v.category}] frontend/${v.file}:${v.line} -> ${v.description}`);
    });
    process.exit(1);
  }
  console.log(`    PASS: Zero backend/database/server leaks in frontend/ (0 violations).\n`);

  // 2. BACKEND BOUNDARY AUDIT
  const backendDir = path.resolve(__dirname, '../backend');
  assert(fs.existsSync(backendDir), 'backend/ directory must exist');

  const allBackendFiles = scanFilesRecursively(backendDir);
  console.log(`[2] Scanning ${allBackendFiles.length} backend files across ${backendDir}...`);

  const backendViolations: Array<{ file: string; category: string; description: string; line: number }> = [];

  for (const filePath of allBackendFiles) {
    const relPath = path.relative(backendDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rule of FORBIDDEN_BACKEND_RULES) {
      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
          return;
        }

        if (rule.pattern.test(line)) {
          backendViolations.push({
            file: relPath,
            category: rule.category,
            description: rule.description,
            line: lineIndex + 1,
          });
        }
      });
    }
  }

  if (backendViolations.length > 0) {
    console.error(`FAILED: Found ${backendViolations.length} backend boundary violations:`);
    backendViolations.forEach((v) => {
      console.error(`  - [${v.category}] backend/${v.file}:${v.line} -> ${v.description}`);
    });
    process.exit(1);
  }
  console.log(`    PASS: Zero frontend/React leaks in backend/ (0 violations).\n`);

  // 3. PHYSICAL OWNERSHIP AUDIT
  console.log('[3] Verifying physical backend ownership...');
  assert(fs.existsSync(path.resolve(__dirname, '../backend/server/server.ts')), 'backend/server/server.ts must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../backend/server/routers/routes.ts')), 'backend/server/routers/routes.ts must exist');

  const decommissionedDirs = [
    'src/server',
    'src/lib/services',
    'src/lib/workflow',
    'src/lib/auth',
    'src/lib/ownership',
    'src/lib/ai',
    'src/lib/validation',
    'src/lib/validators',
  ];

  for (const d of decommissionedDirs) {
    const fullPath = path.resolve(__dirname, '..', d);
    assert(!fs.existsSync(fullPath), `Legacy backend directory ${d} must not exist`);
  }
  // 4. DATABASE LAYER BOUNDARY AUDIT
  const databaseDir = path.resolve(__dirname, '../database/firestore');
  assert(fs.existsSync(databaseDir), 'database/firestore/ directory must exist');

  const allDatabaseFiles = scanFilesRecursively(databaseDir);
  console.log(`[4] Scanning ${allDatabaseFiles.length} database files across ${databaseDir}...`);

  const databaseViolations: Array<{ file: string; rule: string; line: number }> = [];

  for (const filePath of allDatabaseFiles) {
    const relPath = path.relative(databaseDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      // No imports from frontend
      if (/from\s+['"][^'"]*\/frontend\//.test(line)) {
        databaseViolations.push({
          file: relPath,
          rule: 'Direct import of frontend/ modules in database layer',
          line: lineIndex + 1,
        });
      }

      // No React presentation
      if (/from\s+['"](react|react-dom|react-router-dom)['"]/.test(line)) {
        databaseViolations.push({
          file: relPath,
          rule: 'Import of React presentation libraries in database layer',
          line: lineIndex + 1,
        });
      }

      // No request validation schemas / API contracts in database layer
      if (/from\s+['"][^'"]*google-sheets-schema['"]/.test(line)) {
        databaseViolations.push({
          file: relPath,
          rule: 'Import of API request validation schema in database layer',
          line: lineIndex + 1,
        });
      }
    });
  }

  if (databaseViolations.length > 0) {
    console.error(`FAILED: Found ${databaseViolations.length} database boundary violations:`);
    databaseViolations.forEach((v) => {
      console.error(`  - database/${v.file}:${v.line} -> ${v.rule}`);
    });
    process.exit(1);
  }
  console.log(`    PASS: Zero frontend/React/request-validation leaks in database/firestore/ (0 violations).\n`);

  // 5. DATABASE PHYSICAL OWNERSHIP & ARCHITECTURE AUDIT
  console.log('[5] Verifying physical database ownership...');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/adapter/firestore.repository.ts')), 'Firestore repository adapter must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/adapter/admin.ts')), 'Firebase admin adapter must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/rules/firestore.rules')), 'database/firestore/rules/firestore.rules must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/schemas/domain-schemas.ts')), 'domain-schemas.ts must exist under database/firestore/schemas');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/initialization/firestore-production-initializer.ts')), 'Firestore initializer must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/migrations/firestore-migration.ts')), 'Firestore migration engine must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/utilities/firestore-converters.ts')), 'Firestore converters must exist');

  // Verify 34 repository implementations in database/firestore/repositories/
  const repoFiles = fs.readdirSync(path.resolve(__dirname, '../database/firestore/repositories'))
    .filter((f) => f.endsWith('.repository.ts'));
  assert.strictEqual(repoFiles.length, 34, `Expected 34 repository implementations in database/firestore/repositories/, found ${repoFiles.length}`);
  assert(fs.existsSync(path.resolve(__dirname, '../database/firestore/repositories/index.ts')), 'repositories index.ts must exist');

  // Decommissioned database dirs in src/
  const decommissionedDbDirs = [
    'src/lib/repositories',
    'src/lib/firebase',
  ];
  for (const d of decommissionedDbDirs) {
    const fullPath = path.resolve(__dirname, '..', d);
    assert(!fs.existsSync(fullPath), `Legacy database directory ${d} must not exist`);
  }

  // Decommissioned root firestore.rules
  assert(!fs.existsSync(path.resolve(__dirname, '../firestore.rules')), 'Root firestore.rules must be relocated to database/firestore/rules/firestore.rules');

  // Verify firebase.json points to database/firestore/rules/firestore.rules
  const firebaseJsonPath = path.resolve(__dirname, '../firebase.json');
  assert(fs.existsSync(firebaseJsonPath), 'firebase.json must exist');
  const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf-8'));
  assert.strictEqual(firebaseJson.firestore.rules, 'database/firestore/rules/firestore.rules', 'firebase.json must point firestore.rules to database/firestore/rules/firestore.rules');

  // Verify request validation schemas remain OUTSIDE database/firestore
  assert(fs.existsSync(path.resolve(__dirname, '../src/lib/schemas/google-sheets-schema.ts')), 'Request validation schemas must remain in src/lib/schemas/');
  assert(!fs.existsSync(path.resolve(__dirname, '../database/firestore/schemas/google-sheets-schema.ts')), 'Request validation schemas must NOT exist in database/firestore/schemas/');

  console.log(`    PASS: All database physical ownership gates passed (35 repositories, isolated adapter, schemas, rules, initialization, migrations, utilities).\n`);

  // 6. SHARED LAYER BOUNDARY AUDIT
  const sharedDir = path.resolve(__dirname, '../shared');
  assert(fs.existsSync(sharedDir), 'shared/ directory must exist');

  const allSharedFiles = scanFilesRecursively(sharedDir);
  console.log(`[6] Scanning ${allSharedFiles.length} shared files across ${sharedDir}...`);

  const sharedViolations: Array<{ file: string; rule: string; line: number }> = [];

  for (const filePath of allSharedFiles) {
    const relPath = path.relative(sharedDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      // Shared -> Frontend: 0
      if (/(from\s+['"][^'"]*\/frontend\b|import\(['"][^'"]*\/frontend\b)/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of frontend in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> Backend: 0
      if (/(from\s+['"][^'"]*\/backend\b|import\(['"][^'"]*\/backend\b)/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of backend in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> Database: 0
      if (/(from\s+['"][^'"]*\/database\b|import\(['"][^'"]*\/database\b)/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of database in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> src: 0
      if (/(from\s+['"][^'"]*\/src\b|import\(['"][^'"]*\/src\b)/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of src/ in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> Firebase / Firestore: 0
      if (/(from\s+['"][^'"]*(firebase|firebase-admin)\b|import\(['"][^'"]*(firebase|firebase-admin)\b)/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of Firebase/Firestore in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> AI Provider: 0
      if (/from\s+['"]@google\/genai['"]/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Direct import of AI SDK in shared layer',
          line: lineIndex + 1,
        });
      }

      // Shared -> process.env: 0
      if (/\bprocess\.env\b/.test(line)) {
        sharedViolations.push({
          file: relPath,
          rule: 'Reference to process.env in shared layer',
          line: lineIndex + 1,
        });
      }
    });
  }

  if (sharedViolations.length > 0) {
    console.error(`FAILED: Found ${sharedViolations.length} shared layer boundary violations:`);
    sharedViolations.forEach((v) => {
      console.error(`  - shared/${v.file}:${v.line} -> ${v.rule}`);
    });
    process.exit(1);
  }
  console.log(`    PASS: Shared layer is completely isolated (0 violations across frontend, backend, database, src, AI SDK, secrets).\n`);

  // Verify shared directory structure
  assert(fs.existsSync(path.resolve(__dirname, '../shared/types')), 'shared/types/ must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../shared/contracts')), 'shared/contracts/ must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../shared/constants')), 'shared/constants/ must exist');
  assert(fs.existsSync(path.resolve(__dirname, '../shared/index.ts')), 'shared/index.ts must exist');

  console.log('============================================================');
  console.log('S7 ARCHITECTURAL BOUNDARY VERIFICATION: ALL GATES PASSED');
  console.log('============================================================\n');
}

runBoundarySuite().catch((err) => {
  console.error('Fatal error during boundary check:', err);
  process.exit(1);
});
