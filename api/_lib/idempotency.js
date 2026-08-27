function validateIdempotencyKey(value) {
  return typeof value === 'string' && /^[A-Za-z0-9:_-]{8,160}$/.test(value);
}

function transitionKey({ agentId, shiftId, action, version }) {
  return [agentId, shiftId, action, version].join(':');
}

module.exports = { validateIdempotencyKey, transitionKey };
