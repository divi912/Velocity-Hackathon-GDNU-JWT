import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const indexHtml = path.join(dist, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('postbuild error: dist/index.html does not exist');
  process.exit(1);
}

const content = fs.readFileSync(indexHtml, 'utf8');

// List of client routes that should have direct index.html entrypoints for GitHub Pages
const routes = ['sessions', 'debugger', 'login', 'auth'];

for (const route of routes) {
  const routeDir = path.join(dist, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), content);
  console.log(`Generated route fallback: dist/${route}/index.html`);
}

// Ensure 404.html exists as a direct copy of index.html for any arbitrary unknown route
fs.writeFileSync(path.join(dist, '404.html'), content);
console.log('Generated fallback: dist/404.html');

// Ensure .nojekyll is present so GitHub Pages never runs Jekyll
fs.writeFileSync(path.join(dist, '.nojekyll'), '# Disable Jekyll\n');
console.log('Ensured dist/.nojekyll');

console.log('Postbuild finished successfully!');
