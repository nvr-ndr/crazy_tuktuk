const fs = require('node:fs');

(async () => {
const configuredLocations = JSON.parse(fs.readFileSync('CRAZY_TUK_LOCAL_ROUTE_CACHE/locations.json', 'utf8'));
const rows = JSON.parse(fs.readFileSync('CRAZY_TUK_LOCAL_ROUTE_CACHE/routes_export.json', 'utf8'));
const origins = configuredLocations.filter(location => location.pickupEligible);
const destinations = configuredLocations.filter(location => location.destinationEligible);
const locationIds = configuredLocations.map(location => location.id);
const cached = new Set(rows.map(row => `${row.origin_id}:${row.destination_id}`));
const missing = [];

for (const origin of origins.map(location => location.id)) {
  for (const destination of destinations.map(location => location.id)) {
    if (origin !== destination && !cached.has(`${origin}:${destination}`)) {
      missing.push(`${origin}->${destination}`);
    }
  }
}

console.log(JSON.stringify({
  locationCount: locationIds.length,
  pickupEligibleOrigins: origins.length,
  destinationEligibleDestinations: destinations.length,
  expectedDirectionalPairs: origins.length * destinations.length - origins.filter(origin => destinations.some(destination => destination.id === origin.id)).length,
  cachedPairs: rows.length,
  missingCount: missing.length,
  missing,
}, null, 2));
})();
