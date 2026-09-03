const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const modulePath = path.resolve(__dirname, '..', 'data', 'remoteRouteCache.js');

async function loadRouteCache(fetch, hydrateCachedRoutes = () => {}) {
  const context = vm.createContext({ fetch, console });
  const source = fs.readFileSync(modulePath, 'utf8');
  const routeModule = new vm.SourceTextModule(source, { context, identifier: modulePath });
  const cacheModule = new vm.SyntheticModule(['hydrateCachedRoutes'], function initialize() {
    this.setExport('hydrateCachedRoutes', hydrateCachedRoutes);
  }, { context, identifier: 'routeCacheSubset.js' });
  await routeModule.link(async () => cacheModule);
  await cacheModule.evaluate();
  await routeModule.evaluate();
  return routeModule.namespace;
}

function response(body, ok = true) {
  return { ok, json: async () => body };
}

test('retries a transient route-chunk failure without caching the fallback result', async () => {
  const requests = [];
  const hydrated = [];
  const fetch = async (url, options) => {
    requests.push({ url, cache: options.cache });
    if (url.endsWith('manifest.json')) return response({ chunks: [{ key: 'origin', url: 'routes/v2/origin.json' }] });
    if (requests.filter(request => request.url.endsWith('origin.json')).length === 1) throw new Error('temporary network error');
    return response({ routes: [{ from: 'origin', to: 'destination', primary: { coordinates: [] } }] });
  };
  const { ensureRemoteRouteChunk } = await loadRouteCache(fetch, routes => hydrated.push(routes));

  const first = await ensureRemoteRouteChunk('origin');
  const second = await ensureRemoteRouteChunk('origin');

  assert.equal(first.routes.length, 1);
  assert.strictEqual(second, first);
  assert.deepEqual(requests.map(request => request.cache), ['force-cache', 'force-cache', 'reload']);
  assert.equal(hydrated.length, 1);
});

test('does not preserve a failed manifest request for the rest of the session', async () => {
  let manifestRequests = 0;
  const fetch = async url => {
    if (!url.endsWith('manifest.json')) throw new Error(`unexpected route fetch: ${url}`);
    manifestRequests += 1;
    return response(null, false);
  };
  const { ensureRemoteRouteChunk } = await loadRouteCache(fetch);

  await ensureRemoteRouteChunk('missing-origin');
  await ensureRemoteRouteChunk('missing-origin');

  assert.equal(manifestRequests, 4, 'each request retries its failed manifest fetch');
});
