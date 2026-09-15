import fs from 'fs';
import path from 'path';

function findFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        findFiles(path.join(dir, file), fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles(path.join(process.cwd(), 'src'));
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Look for anything calling auditService.log(
  const matches = content.matchAll(/auditService\.log\s*\(([\s\S]*?)\)/g);
  for (const match of matches) {
    const args = match[1].split(',').map(s => s.trim());
    if (args.length < 5) {
      console.log(`Potential malformed call in ${file}:`);
      console.log(match[0]);
    }
  }
  const repoMatches = content.matchAll(/auditLogRepository\.logAction\s*\(([\s\S]*?)\)/g);
  for (const match of repoMatches) {
    const args = match[1].split(',').map(s => s.trim());
    if (args.length < 5) {
      console.log(`Potential malformed repo call in ${file}:`);
      console.log(match[0]);
    }
  }
}
console.log("Done checking calls.");
