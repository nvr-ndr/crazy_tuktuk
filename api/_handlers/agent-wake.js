const { processWake } = require('../_lib/wake');

module.exports = async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return response.status(405).json({ error: 'method_not_allowed' });
  const expected = process.env.AGENT_WAKE_SECRET || process.env.CRON_SECRET;
  const supplied = request.headers?.['x-agent-wake-secret'] || request.headers?.authorization?.replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) return response.status(401).json({ error: 'wake_unauthorized' });
  try { return response.status(200).json(await processWake()); }
  catch (error) { console.error('agent wake failed', error); return response.status(500).json({ error: 'agent_wake_failed' }); }
};
