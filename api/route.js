const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

module.exports = async function routeHandler(request, response) {
  if (request.method && request.method !== 'GET') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET');
    return response.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const from = parseCoordinates(request.query?.from);
  const to = parseCoordinates(request.query?.to);
  if (!from || !to) {
    response.statusCode = 400;
    response.setHeader('Content-Type', 'application/json');
    return response.end(JSON.stringify({ error: 'Valid from and to coordinates are required' }));
  }

  try {
    const coordinates = `${from.join(',')};${to.join(',')}`;
    const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`;
    const upstream = await fetch(url, { headers: { 'User-Agent': 'CrazyTuk/1.0' } });
    const data = await upstream.json();
    const route = data.routes?.[0];
    if (!upstream.ok || data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error(data.message || data.code || `Routing failed (${upstream.status})`);
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return response.end(JSON.stringify({
      coordinates: route.geometry.coordinates,
      distanceMeters: route.distance,
      durationSeconds: route.duration
    }));
  } catch (error) {
    response.statusCode = 502;
    response.setHeader('Content-Type', 'application/json');
    return response.end(JSON.stringify({ error: error.message || 'Road route unavailable' }));
  }
};

function parseCoordinates(value) {
  if (typeof value !== 'string') return null;
  const coordinates = value.split(',').map(Number);
  if (coordinates.length !== 2 || coordinates.some((coordinate) => !Number.isFinite(coordinate))) return null;
  const [longitude, latitude] = coordinates;
  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return null;
  return coordinates;
}
