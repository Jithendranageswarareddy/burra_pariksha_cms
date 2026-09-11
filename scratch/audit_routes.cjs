const fs = require('fs');
const content = fs.readFileSync('src/server/routes.ts', 'utf8');
const routes = [];
const regex = /apiRouter\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
let m;
while ((m = regex.exec(content)) !== null) {
  routes.push({ method: m[1].toUpperCase(), path: m[2] });
}
console.log('Total routes:', routes.length);
const matchingRoutes = routes.filter(r => 
  r.path.includes('workflow') || 
  r.path.includes('plan') || 
  r.path.includes('batch') || 
  r.path.includes('master') || 
  r.path.includes('transition') || 
  r.path.includes('status') ||
  r.path.includes('canonical')
);
console.log('Matching routes count:', matchingRoutes.length);
console.log(JSON.stringify(matchingRoutes, null, 2));
