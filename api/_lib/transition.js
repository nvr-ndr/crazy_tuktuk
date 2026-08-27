const CLAIM_DUE_STATES_SQL = `
  SELECT id, shift_id, agent_id, status, state_version, lease_token
  FROM agent_shift_states
  WHERE next_action_at <= now()
    AND status IN ('READY_NEXT_SHIFT', 'ACTIVE')
    AND (lease_until IS NULL OR lease_until < now())
  ORDER BY next_action_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT $1`;

function makeLeaseToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

module.exports = { CLAIM_DUE_STATES_SQL, makeLeaseToken };
