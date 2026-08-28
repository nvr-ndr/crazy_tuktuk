const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sourcePath = path.join(__dirname, '..', 'data', 'routeCacheSubset.js');
const outputRoot = path.join(__dirname, '..', 'cloudflare', 'routes', 'v1');
const source = fs.readFileSync(sourcePath, 'utf8');
const startMarker = 'export const CACHED_ROUTE_SUBSET = ';
const start = source.indexOf(startMarker);
const end = source.indexOf('const routeMap', start);
if (start < 0 || end < 0) throw new Error('Could not locate CACHED_ROUTE_SUBSET in routeCacheSubset.js');
const routes = JSON.parse(source.slice(start + startMarker.length, end).trim().replace(/;\s*$/, ''));
const byOrigin = new Map();
for (const route of routes) {
  const key = route.from || 'unassigned';
  const list = byOrigin.get(key) || [];
  list.push(route);
  byOrigin.set(key, list);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
const chunks = [];

for (const [origin, entries] of [...byOrigin.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const file = `${origin}.json`;
  const body = JSON.stringify({ version: 'routes-v1', origin, routes: entries });
  const fileBody = `${body}\n`;
  fs.writeFileSync(path.join(outputRoot, file), fileBody);
  chunks.push({
    key: origin,
    url: `routes/v1/${file}`,
    routeKeys: entries.map(route => `${route.from}:${route.to}`),
    bytes: Buffer.byteLength(body),
    sha256: crypto.createHash('sha256').update(fileBody).digest('hex'),
  });
}

const manifestBody = JSON.stringify({
  version: 'routes-v1',
  generatedAt: new Date().toISOString(),
  source: 'data/routeCacheSubset.js',
  routeCount: routes.length,
  chunkCount: chunks.length,
  chunks,
}, null, 2);
fs.writeFileSync(path.join(outputRoot, 'manifest.json'), `${manifestBody}\n`);
console.log(`Prepared ${routes.length} routes in ${chunks.length} Cloudflare-ready chunks at ${path.relative(process.cwd(), outputRoot)}`);
