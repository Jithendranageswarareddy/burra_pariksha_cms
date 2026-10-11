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
  console.log(`    PASS: All 8 legacy backend implementation locations decommissioned.\n`);

  console.log('============================================================');
  console.log('S7 ARCHITECTURAL BOUNDARY VERIFICATION: ALL GATES PASSED');
  console.log('============================================================\n');
}

runBoundarySuite().catch((err) => {
  console.error('Fatal error during boundary check:', err);
  process.exit(1);
});
