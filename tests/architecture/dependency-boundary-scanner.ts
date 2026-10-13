import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export type BoundaryRuleId =
  | 'DB-001'
  | 'DB-002'
  | 'DB-003'
  | 'DB-004'
  | 'DB-005'
  | 'DB-006'
  | 'DB-007'
  | 'DB-008';

export interface BoundaryViolation {
  rule: BoundaryRuleId;
  importer: string;
  forbiddenDependency: string;
  importDeclaration: string;
  expected: string;
  line: number;
}

export interface BoundarySource {
  fileName: string;
  content: string;
}

interface ResolvedImport {
  specifier: string;
  resolvedPath?: string;
  packageName?: string;
}

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'];

function normalize(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}

function sourceFiles(root: string, results: string[] = []): string[] {
  if (!fs.existsSync(root)) return results;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(fullPath, results);
    } else if (sourceExtensions.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function resolvePathAlias(specifier: string, projectRoot: string): string | undefined {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return undefined;
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
  const paths = config?.compilerOptions?.paths as Record<string, string[]> | undefined;
  if (!paths) return undefined;
  const baseUrl = path.resolve(projectRoot, config.compilerOptions?.baseUrl || '.');
  for (const [pattern, targets] of Object.entries(paths)) {
    const prefix = pattern.endsWith('/*') ? pattern.slice(0, -2) : pattern;
    if (!specifier.startsWith(prefix) || !targets?.[0]) continue;
    const suffix = specifier.slice(prefix.length).replace(/^\//, '');
    return path.resolve(baseUrl, targets[0].replace(/\/\*$/, ''), suffix);
  }
  return undefined;
}

function resolveLocalImport(importer: string, specifier: string, projectRoot: string): string | undefined {
  let candidate: string;
  const aliasCandidate = resolvePathAlias(specifier, projectRoot);
  if (aliasCandidate) {
    candidate = aliasCandidate;
  } else if (specifier.startsWith('.')) {
    candidate = path.resolve(path.dirname(importer), specifier);
  } else {
    return undefined;
  }

  const possibilities = [
    candidate,
    ...sourceExtensions.map((extension) => `${candidate}${extension}`),
    ...sourceExtensions.map((extension) => path.join(candidate, `index${extension}`)),
  ];
  return possibilities.find((possible) => fs.existsSync(possible)) || candidate;
}

function importTargets(node: ts.SourceFile): Array<{ specifier: string; line: number; text: string }> {
  const targets: Array<{ specifier: string; line: number; text: string }> = [];
  const add = (literal: ts.StringLiteralLike) => {
    const position = node.getLineAndCharacterOfPosition(literal.getStart(node));
    targets.push({
      specifier: literal.text,
      line: position.line + 1,
      text: literal.parent.getText(node),
    });
  };

  const visit = (current: ts.Node) => {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) {
      if (current.moduleSpecifier && ts.isStringLiteralLike(current.moduleSpecifier)) add(current.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(current) && ts.isExternalModuleReference(current.moduleReference)) {
      if (ts.isStringLiteralLike(current.moduleReference.expression)) add(current.moduleReference.expression);
    } else if (ts.isCallExpression(current) && current.arguments.length === 1) {
      const expression = current.expression;
      if ((expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(expression) && expression.text === 'require'))
        && ts.isStringLiteralLike(current.arguments[0])) {
        add(current.arguments[0]);
      }
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return targets;
}

function classify(
  importer: string,
  target: ResolvedImport,
): { rule: BoundaryRuleId; expected: string; forbiddenDependency: string } | undefined {
  const importerPath = normalize(importer);
  const targetPath = target.resolvedPath ? normalize(target.resolvedPath) : '';
  const packageName = target.packageName || '';
  const under = (root: string) => targetPath.includes(`/${root}/`) || targetPath.endsWith(`/${root}`);
  const frontend = importerPath.includes('/frontend/');
  const backend = importerPath.includes('/backend/');
  const database = importerPath.includes('/database/firestore/');
  const shared = importerPath.includes('/shared/');

  if (frontend && (under('backend/ai/providers') || under('backend/ai') || packageName === '@google/genai')) {
    return { rule: 'DB-004', expected: 'Frontend must not import server-only AI provider implementations or SDKs.', forbiddenDependency: target.specifier };
  }
  if (frontend && (under('backend') || packageName === 'backend')) {
    return { rule: 'DB-001', expected: 'Frontend must use the approved API client instead of backend implementation modules.', forbiddenDependency: target.specifier };
  }
  if (frontend && under('database')) {
    return { rule: 'DB-002', expected: 'Frontend must not import database implementation modules.', forbiddenDependency: target.specifier };
  }
  if (frontend && (packageName === 'firebase-admin' || packageName.startsWith('firebase-admin/'))) {
    return { rule: 'DB-003', expected: 'Frontend must not import the server-side Firebase Admin SDK.', forbiddenDependency: target.specifier };
  }
  if (backend && under('frontend')) {
    return { rule: 'DB-005', expected: 'Backend must not import frontend implementation modules.', forbiddenDependency: target.specifier };
  }
  if (database && under('frontend')) {
    return { rule: 'DB-006', expected: 'Database infrastructure must not import frontend implementation modules.', forbiddenDependency: target.specifier };
  }
  if (shared && under('backend')) {
    return { rule: 'DB-007', expected: 'Shared code must remain independent of backend implementation modules.', forbiddenDependency: target.specifier };
  }
  if (shared && under('frontend')) {
    return { rule: 'DB-008', expected: 'Shared code must remain independent of frontend implementation modules.', forbiddenDependency: target.specifier };
  }
  return undefined;
}

function resolveTarget(importer: string, specifier: string, projectRoot: string): ResolvedImport {
  const resolvedPath = resolveLocalImport(importer, specifier, projectRoot);
  if (specifier.startsWith('@google/') || specifier === 'firebase-admin' || specifier.startsWith('firebase-admin/')) {
    return { specifier, packageName: specifier, resolvedPath };
  }
  return { specifier, resolvedPath };
}

export function scanBoundarySources(sources: BoundarySource[], projectRoot: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const source of sources) {
    const fileName = path.resolve(projectRoot, source.fileName);
    const sourceFile = ts.createSourceFile(fileName, source.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const target of importTargets(sourceFile)) {
      const resolved = resolveTarget(fileName, target.specifier, projectRoot);
      const result = classify(fileName, resolved);
      if (result) {
        violations.push({
          ...result,
          importer: normalize(source.fileName),
          importDeclaration: target.text,
          line: target.line,
        });
      }
    }
  }
  return violations;
}

export function scanProductionBoundaries(projectRoot: string): BoundaryViolation[] {
  const roots = ['frontend', 'backend', 'database/firestore', 'shared'];
  const sources = roots.flatMap((root) => sourceFiles(path.join(projectRoot, root)).map((fileName) => ({
    fileName: path.relative(projectRoot, fileName),
    content: fs.readFileSync(fileName, 'utf8'),
  })));
  return scanBoundarySources(sources, projectRoot);
}
