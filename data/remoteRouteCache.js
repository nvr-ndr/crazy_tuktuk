import { hydrateCachedRoutes } from './routeCacheSubset.js?v=20260827routes4';

const ROUTE_ASSET_BASE = 'https://pub-6318bca05ff3439585d2c1d2553d01da.r2.dev';
const MANIFEST_URL = `${ROUTE_ASSET_BASE}/routes/v2/manifest.json`;
const chunkCache = new Map();
const chunkLoadPromises = new Map();
let manifestPromise = null;
let manifestCache = null;

async function getManifest() {
  if (manifestCache) return manifestCache;
  if (!manifestPromise) {
    manifestPromise = fetchJsonWithRetry(MANIFEST_URL)
      .then(result => {
        if (result?.chunks) manifestCache = result;
        return manifestCache;
      })
      .finally(() => { manifestPromise = null; });
  }
  return manifestPromise;
}

async function fetchJsonWithRetry(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      // A cache reload is important here: an initial transient CDN or browser-cache
      // failure must not turn the otherwise valid road route into a session fallback.
      const response = await fetch(url, { cache: attempt === 0 ? 'force-cache' : 'reload' });
      if (response.ok) {
        const result = await response.json();
        if (result) return result;
      }
    } catch {
      // Retry once below. Failures are deliberately not cached.
    }
  }
  return null;
}

export async function ensureRemoteRouteChunk(origin) {
  if (!origin) return null;
  if (chunkCache.has(origin)) return chunkCache.get(origin);
  if (chunkLoadPromises.has(origin)) return chunkLoadPromises.get(origin);

  const loadPromise = loadRemoteRouteChunk(origin);
  chunkLoadPromises.set(origin, loadPromise);
  try {
    return await loadPromise;
  } finally {
    chunkLoadPromises.delete(origin);
  }
}

async function loadRemoteRouteChunk(origin) {
  const manifest = await getManifest();
  const chunk = manifest?.chunks?.find(entry => entry.key === origin);
  if (!chunk) return null;
  const result = await fetchJsonWithRetry(`${ROUTE_ASSET_BASE}/${chunk.url}`);
  if (!result?.routes) return null;
  hydrateCachedRoutes(result.routes);
  chunkCache.set(origin, result);
  return result;
}
