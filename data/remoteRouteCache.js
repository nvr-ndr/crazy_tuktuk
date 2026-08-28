import { hydrateCachedRoutes } from './routeCacheSubset.js?v=20260827routes4';

const ROUTE_ASSET_BASE = 'https://pub-6318bca05ff3439585d2c1d2553d01da.r2.dev';
const MANIFEST_URL = `${ROUTE_ASSET_BASE}/routes/v2/manifest.json`;
const chunkCache = new Map();
let manifestPromise = null;

async function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
  }
  return manifestPromise;
}

export async function ensureRemoteRouteChunk(origin) {
  if (!origin || chunkCache.has(origin)) return chunkCache.get(origin) || null;
  const manifest = await getManifest();
  const chunk = manifest?.chunks?.find(entry => entry.key === origin);
  if (!chunk) { chunkCache.set(origin, null); return null; }
  const result = await fetch(`${ROUTE_ASSET_BASE}/${chunk.url}`, { cache: 'force-cache' })
    .then(response => response.ok ? response.json() : null)
    .catch(() => null);
  if (!result?.routes) { chunkCache.set(origin, null); return null; }
  hydrateCachedRoutes(result.routes);
  chunkCache.set(origin, result);
  return result;
}
