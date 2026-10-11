/**
 * BURRA PARIKSHA CMS — S7-T05 Frontend / Backend Architectural Boundary Test
 *
 * Verifies that the client application under `frontend/` contains ZERO dependencies
 * on backend domain services, repositories, Firestore adapters, Firebase Admin,
 * server implementation, or server-side AI validators.
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

const FORBIDDEN_RULES: BoundaryRule[] = [
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
    pattern: /from\s+['"][^'"]*\/src\/server(\/[^'"]*)?['"]/,
    description: 'Direct import of server routing or server infrastructure',
  },
  {
    category: 'Workflow Engine Implementation',
    pattern: /from\s+['"][^'"]*\/workflow\/workflow-engine(\.ts)?['"]/,
    description: 'Direct import of backend workflow engine state machine',
  },
  {
    category: 'Server Environment Secrets',
    pattern: /\bprocess\.env\b/,
    description: 'Access to server-only process.env secrets in client bundle',
  },
];

async function runFrontendBoundarySuite() {
  console.log('============================================================');
  console.log('BP-CMS S7-T05 FRONTEND / BACKEND BOUNDARY ARCHITECTURAL TEST');
  console.log('============================================================\n');

  const frontendDir = path.resolve(__dirname, '../frontend');
  assert(fs.existsSync(frontendDir), 'frontend/ directory must exist');

  const allFrontendFiles = scanFilesRecursively(frontendDir);
  console.log(`Scanning ${allFrontendFiles.length} frontend source files across ${frontendDir}...\n`);

  const violations: Array<{ file: string; category: string; description: string; line: number }> = [];

  for (const filePath of allFrontendFiles) {
    const relPath = path.relative(frontendDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rule of FORBIDDEN_RULES) {
      lines.forEach((line, lineIndex) => {
        // Skip comment-only lines or documentation strings if any
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
          return;
        }

        if (rule.pattern.test(line)) {
          violations.push({
            file: relPath,
            category: rule.category,
            description: rule.description,
            line: lineIndex + 1,
          });
        }
      });
    }
  }

  if (violations.length > 0) {
    console.error(`FAILED: Found ${violations.length} architectural boundary violations:`);
    violations.forEach((v) => {
      console.error(`  - [${v.category}] frontend/${v.file}:${v.line} -> ${v.description}`);
    });
    process.exit(1);
  }

  console.log(`[PASS] All ${allFrontendFiles.length} frontend files strictly adhere to architectural boundaries.`);
  console.log('       Zero backend services, repositories, validators, or server secrets imported in frontend.\n');
  console.log('============================================================');
  console.log('S7-T05 FRONTEND BOUNDARY VERIFICATION: SUCCESS');
  console.log('============================================================\n');
}

runFrontendBoundarySuite().catch((err) => {
  console.error('Fatal error during boundary check:', err);
  process.exit(1);
});
