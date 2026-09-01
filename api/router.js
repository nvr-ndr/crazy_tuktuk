const handlers = {
  '/api/agent/decide': require('./_handlers/decide'),
  '/api/agent/event': require('./_handlers/event'),
  '/api/agent/fares': require('./_handlers/fares'),
  '/api/agent/pit-call': require('./_handlers/pit-call'),
  '/api/agent/register': require('./_handlers/register'),
  '/api/agent/shift': require('./_handlers/shift'),
  '/api/agent/transition': require('./_handlers/transition'),
  '/api/agent/zones': require('./_handlers/zones'),
  '/api/auth/challenge': require('./_handlers/challenge'),
  '/api/auth/verify': require('./_handlers/verify'),
  '/api/cron/agent-wake': require('./_handlers/agent-wake'),
  '/api/dflow/order': require('./_handlers/order'),
  '/api/dflow/eligibility': require('./_handlers/dflowEligibility'),
  '/api/leaderboard': require('./_handlers/leaderboard'),
  '/api/standard': require('./_handlers/standard')
};

module.exports = async function handler(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const path = String(request.query?.route || url.searchParams.get('route') || url.pathname).replace(/\/$/, '') || '/';
  const target = handlers[path];
  if (!target) return response.status(404).json({ error: 'api_route_not_found' });
  return target(request, response);
};
