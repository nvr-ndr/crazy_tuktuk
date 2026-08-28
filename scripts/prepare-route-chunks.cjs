const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sourcePath = path.join(__dirname, '..', 'CRAZY_TUK_LOCAL_ROUTE_CACHE', 'routes_export.json');
const outputRoot = path.join(__dirname, '..', 'cloudflare', 'routes', 'v2');
const sourceRows = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const routes = sourceRows.map(row => {
  const primary = row.primary_geometry;
  if (!primary || !Array.isArray(primary.coordinates)) return null;
  const route = {
    id: `${row.origin_id}->${row.destination_id}`,
    from: row.origin_id,
    to: row.destination_id,
    primary: {
      ...primary,
      distanceMeters: row.primary_distance_m,
      durationSeconds: row.primary_duration_s,
    },
  };
  if (row.alt_geometry && Array.isArray(row.alt_geometry.coordinates)) {
    route.alternative = {
      ...row.alt_geometry,
      distanceMeters: row.alt_distance_m,
      durationSeconds: row.alt_duration_s,
    };
  }
  return route;
}).filter(Boolean);
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
  const body = JSON.stringify({ version: 'routes-v2', origin, routes: entries });
  const fileBody = `${body}\n`;
  fs.writeFileSync(path.join(outputRoot, file), fileBody);
  chunks.push({
    key: origin,
    url: `routes/v2/${file}`,
    routeKeys: entries.map(route => `${route.from}:${route.to}`),
    bytes: Buffer.byteLength(body),
    sha256: crypto.createHash('sha256').update(fileBody).digest('hex'),
  });
}

const manifestBody = JSON.stringify({
  version: 'routes-v2',
  generatedAt: new Date().toISOString(),
  source: 'CRAZY_TUK_LOCAL_ROUTE_CACHE/routes_export.json',
  routeCount: routes.length,
  chunkCount: chunks.length,
  chunks,
}, null, 2);
fs.writeFileSync(path.join(outputRoot, 'manifest.json'), `${manifestBody}\n`);
console.log(`Prepared ${routes.length} routes in ${chunks.length} Cloudflare-ready chunks at ${path.relative(process.cwd(), outputRoot)}`);
