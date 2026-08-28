const fs = require('node:fs');

(async () => {
const { LOCATIONS } = await import('../data/locations.js');
const rows = JSON.parse(fs.readFileSync('CRAZY_TUK_LOCAL_ROUTE_CACHE/routes_export.json', 'utf8'));
const locationIds = LOCATIONS.features.map(feature => feature.properties.id);
const cached = new Set(rows.map(row => `${row.origin_id}:${row.destination_id}`));
const missing = [];

for (const origin of locationIds) {
  for (const destination of locationIds) {
    if (origin !== destination && !cached.has(`${origin}:${destination}`)) {
      missing.push(`${origin}->${destination}`);
    }
  }
}

console.log(JSON.stringify({
  locationCount: locationIds.length,
  expectedDirectionalPairs: locationIds.length * (locationIds.length - 1),
  cachedPairs: rows.length,
  missingCount: missing.length,
  missing,
}, null, 2));
})();
