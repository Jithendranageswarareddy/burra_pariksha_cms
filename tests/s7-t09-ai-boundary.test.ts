import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Import from the new authoritative AI boundary
import {
  aiOrchestrator,
  AIOrchestrationService,
  DEFAULT_AI_CONFIG,
  AIProviderError,
  classifyAIError,
  QuestionCandidateZodSchema,
  CandidateValidator,
  ScriptValidator,
  BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
} from '../backend/ai';

async function runTests() {
  console.log('============================================================');
  console.log('S7-T09 AI BOUNDARY ISOLATION ARCHITECTURAL VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Structure Verification
  try {
    const requiredDirs = [
      'backend/ai',
      'backend/ai/orchestrator',
      'backend/ai/providers',
      'backend/ai/prompts',
      'backend/ai/schemas',
      'backend/ai/validators',
      'backend/ai/errors',
    ];

    for (const dir of requiredDirs) {
      assert(fs.existsSync(dir), `Required directory ${dir} must exist`);
      assert(fs.statSync(dir).isDirectory(), `${dir} must be a directory`);
    }

    console.log('✓ TC-AI-01 PASSED: All 6 canonical backend/ai directories exist.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-01 FAILED:', err.message);
    failed++;
  }

  // 2. Obsolete AI Locations Removed
  try {
    assert(!fs.existsSync('backend/infrastructure/ai'), 'backend/infrastructure/ai must not exist');
    assert(!fs.existsSync('backend/features/ai'), 'backend/features/ai must not exist');
    assert(!fs.existsSync('backend/features/question-verification/ai'), 'backend/features/question-verification/ai must not exist');
    assert(!fs.existsSync('backend/features/question-verification/validation'), 'backend/features/question-verification/validation must not exist');

    console.log('✓ TC-AI-02 PASSED: All obsolete AI directories removed.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-02 FAILED:', err.message);
    failed++;
  }

  // 3. Provider SDK Isolation Verification
  try {
    const checkFileForGenAI = (filePath: string) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.includes('@google/genai') && !filePath.includes('SettingsPage.tsx');
    };

    const scanDir = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDir(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          if (checkFileForGenAI(fullPath)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const frontendLeaks = scanDir('frontend');
    const sharedLeaks = scanDir('shared');

    assert.strictEqual(frontendLeaks.length, 0, `Frontend must have zero @google/genai imports. Leaks: ${frontendLeaks.join(', ')}`);
    assert.strictEqual(sharedLeaks.length, 0, `Shared must have zero @google/genai imports. Leaks: ${sharedLeaks.join(', ')}`);

    console.log('✓ TC-AI-03 PASSED: Zero @google/genai leaks in frontend or shared.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-03 FAILED:', err.message);
    failed++;
  }

  // 4. Orchestrator and Error boundary
  try {
    assert(aiOrchestrator instanceof AIOrchestrationService, 'aiOrchestrator must be an instance of AIOrchestrationService');
    assert(typeof DEFAULT_AI_CONFIG.defaultProvider === 'string', 'defaultProvider must be configured');

    const classified = classifyAIError(new Error('Resource has been exhausted (quota)'));
    assert.strictEqual(classified.classification, 'QUOTA_EXHAUSTED', 'Error classification must work');
    assert.strictEqual(classified.isRetryable, false, 'Quota errors must be non-retryable');

    const aiErr = new AIProviderError('Test error', 'gemini', 'gemini-3.1-flash-lite', 'AUTH_ERROR', false, 401);
    assert.strictEqual(aiErr.classification, 'AUTH_ERROR');

    console.log('✓ TC-AI-04 PASSED: AI Orchestrator and Error boundaries functioning properly.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-04 FAILED:', err.message);
    failed++;
  }

  // 5. Schemas, Prompts, and Validators boundary
  try {
    assert(typeof BURRA_PARIKSHA_SYSTEM_INSTRUCTION === 'string', 'Prompt instructions must be loaded');
    assert(typeof QuestionCandidateZodSchema.parse === 'function', 'Question candidate schema must be loaded');
    assert(typeof CandidateValidator.validate === 'function', 'CandidateValidator must be loaded');
    assert(typeof ScriptValidator.validate === 'function', 'ScriptValidator must be loaded');

    console.log('✓ TC-AI-05 PASSED: Schemas, Prompts, and Validators correctly exported from backend/ai.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-05 FAILED:', err.message);
    failed++;
  }

  // 6. Zero Feature Dependencies in backend/ai
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const featureLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*features/);
    assert.strictEqual(
      featureLeaks.length,
      0,
      `backend/ai must have ZERO imports from backend/features. Found leaks in: ${featureLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-06 PASSED: backend/ai has zero dependencies on backend/features.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-06 FAILED:', err.message);
    failed++;
  }

  // 7. Zero Database & Persistence Dependencies in backend/ai
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const dbLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*(database|repositories)/);
    assert.strictEqual(
      dbLeaks.length,
      0,
      `backend/ai must have ZERO database/repository imports. Found leaks in: ${dbLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-07 PASSED: backend/ai has zero dependencies on database repositories.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-07 FAILED:', err.message);
    failed++;
  }

  // 8. Zero src/types/ai dependencies in backend/ai (Canonical Ownership)
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const typeLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*src\/types\/ai/);
    assert.strictEqual(
      typeLeaks.length,
      0,
      `backend/ai must have ZERO imports from src/types/ai (canonical definitions live in backend/ai/orchestrator/types). Found leaks in: ${typeLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-08 PASSED: backend/ai has zero dependencies on legacy src/types/ai.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-08 FAILED:', err.message);
    failed++;
  }

  // 10. Zero src/ imports in backend/ai (Strict Subsystem Independence)
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const srcLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*src\//);
    assert.strictEqual(
      srcLeaks.length,
      0,
      `backend/ai must have ZERO imports from src/. Found leaks in: ${srcLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-10 PASSED: backend/ai has zero dependencies on src/ (types, config, or lib).');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-10 FAILED:', err.message);
    failed++;
  }

  // 9. Zero backend/ai imports in Frontend and Shared
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const frontendAiLeaks = scanDirForPattern('frontend', /from\s+['"][^'"]*backend\/ai/);
    const sharedAiLeaks = scanDirForPattern('shared', /from\s+['"][^'"]*backend\/ai/);

    assert.strictEqual(
      frontendAiLeaks.length,
      0,
      `Frontend must have ZERO backend/ai imports. Found: ${frontendAiLeaks.join(', ')}`
    );
    assert.strictEqual(
      sharedAiLeaks.length,
      0,
      `Shared must have ZERO backend/ai imports. Found: ${sharedAiLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-09 PASSED: Zero backend/ai imports in frontend or shared.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-09 FAILED:', err.message);
    failed++;
  }

  // 11. Zero Concrete Provider Coupling in AI Orchestrator
  try {
    const orchestratorFile = path.resolve('backend/ai/orchestrator/ai-orchestrator.service.ts');
    assert(fs.existsSync(orchestratorFile), 'ai-orchestrator.service.ts must exist');
    const content = fs.readFileSync(orchestratorFile, 'utf-8');

    const hasGeminiService = /import\s+.*(?:geminiService|gemini\.service).*\s+from/i.test(content);
    assert(!hasGeminiService, 'AI Orchestrator must NOT directly import geminiService or concrete provider implementations');

    const hasQuestionConfig = /import\s+.*questionConfigService.*\s+from/i.test(content);
    assert(!hasQuestionConfig, 'AI Orchestrator must NOT directly import questionConfigService');

    console.log('✓ TC-AI-11 PASSED: AI Orchestrator has ZERO direct dependencies on concrete providers or questionConfigService.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-11 FAILED:', err.message);
    failed++;
  }

  // 12. Zero Domain Service Coupling in Providers
  try {
    const providersDir = path.resolve('backend/ai/providers');
    const providerFiles = fs.readdirSync(providersDir).filter((f) => f.endsWith('.ts'));

    const domainViolations: string[] = [];
    for (const f of providerFiles) {
      const fullPath = path.join(providersDir, f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (/(?:taxonomyService|from\s+['"][^'"]*domain\/taxonomy)/i.test(content)) {
        domainViolations.push(f);
      }
    }

    assert.strictEqual(
      domainViolations.length,
      0,
      `Providers must NOT import taxonomy or domain services directly. Violations: ${domainViolations.join(', ')}`
    );

    console.log('✓ TC-AI-12 PASSED: AI Providers have ZERO imports of taxonomy or domain services.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-12 FAILED:', err.message);
    failed++;
  }

  // 13. Zero Provider SDK / Client Coupling in Refinement & Verification
  try {
    const refinementFile = path.resolve('backend/infrastructure/services/question-refinement.service.ts');
    assert(fs.existsSync(refinementFile), 'question-refinement.service.ts must exist');
    const content = fs.readFileSync(refinementFile, 'utf-8');

    const hasGeminiClient = /import\s+.*(?:geminiClient|@google\/genai).*\s+from/i.test(content);
    assert(!hasGeminiClient, 'Question Refinement service must NOT import geminiClient or provider SDKs directly');

    const verificationDir = path.resolve('backend/features/question-verification');
    const checkDir = (dir: string): string[] => {
      let leaks: string[] = [];
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
          leaks = leaks.concat(checkDir(full));
        } else if (entry.endsWith('.ts')) {
          const txt = fs.readFileSync(full, 'utf-8');
          if (/(?:geminiClient|@google\/genai)/i.test(txt)) {
            leaks.push(entry);
          }
        }
      }
      return leaks;
    };
    const verificationLeaks = checkDir(verificationDir);
    assert.strictEqual(
      verificationLeaks.length,
      0,
      `Question Verification must NOT import geminiClient or provider SDKs. Found in: ${verificationLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-13 PASSED: Refinement & Verification services have ZERO direct dependencies on provider SDKs or concrete clients.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-13 FAILED:', err.message);
    failed++;
  }

  // 14. Zero Domain Dependencies in backend/ai (Strict Subsystem Independence)
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const domainLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*(?:domain\/|\/domain)/);
    assert.strictEqual(
      domainLeaks.length,
      0,
      `backend/ai must have ZERO imports from backend/domain. Leaks: ${domainLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-14 PASSED: Entire backend/ai has ZERO dependencies on backend/domain.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-14 FAILED:', err.message);
    failed++;
  }

  // 15. Zero Infrastructure Dependencies in backend/ai (Strict Subsystem Independence)
  try {
    const scanDirForPattern = (dir: string, pattern: RegExp): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirForPattern(fullPath, pattern));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (pattern.test(content)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    };

    const infraLeaks = scanDirForPattern('backend/ai', /from\s+['"][^'"]*(?:infrastructure\/|\/infrastructure)/);
    assert.strictEqual(
      infraLeaks.length,
      0,
      `backend/ai must have ZERO imports from backend/infrastructure. Leaks: ${infraLeaks.join(', ')}`
    );

    console.log('✓ TC-AI-15 PASSED: Entire backend/ai has ZERO dependencies on backend/infrastructure.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-15 FAILED:', err.message);
    failed++;
  }

  // 16. Zero Concrete AI Provider Imports in Express Routers
  try {
    const routesFile = path.resolve('backend/server/routers/routes.ts');
    assert(fs.existsSync(routesFile), 'routes.ts must exist');
    const content = fs.readFileSync(routesFile, 'utf-8');

    const hasConcreteClient = /import\s+.*(?:geminiClient|geminiService).*\s+from/i.test(content);
    assert(!hasConcreteClient, 'routes.ts must NOT directly import geminiClient or concrete provider services');

    console.log('✓ TC-AI-16 PASSED: Express routes depend strictly on neutral aiOrchestrator abstraction.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-16 FAILED:', err.message);
    failed++;
  }

  // 17. Question Verification Imports from Authoritative AI Boundary
  try {
    const qvFile = path.resolve('backend/features/question-verification/services/question-validation.service.ts');
    assert(fs.existsSync(qvFile), 'question-validation.service.ts must exist');
    const content = fs.readFileSync(qvFile, 'utf-8');

    const reachesIntoSubfolder = /from\s+['"][^'"]*ai\/validators['"]/i.test(content);
    assert(!reachesIntoSubfolder, 'question-validation.service.ts must NOT reach into internal ai/validators subfolder');

    const usesCanonicalBoundary = /from\s+['"][^'"]*\/ai['"]/i.test(content);
    assert(usesCanonicalBoundary, 'question-validation.service.ts must import from canonical backend/ai boundary');

    console.log('✓ TC-AI-17 PASSED: Question verification service imports cleanly from canonical backend/ai entry point.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AI-17 FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`S7-T09 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
