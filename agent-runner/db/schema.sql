CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('REGISTRATION','LIVE','INTAKE_CLOSED','FINALIZING','COMPLETE','INTERMISSION')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  starting_bankroll NUMERIC(18,6) NOT NULL,
  rules_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY,
  owner_wallet TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  persona TEXT NOT NULL,
  dflow_wallet_name TEXT NOT NULL UNIQUE,
  wallet_public_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily Agent is the MVP lifecycle. `tournaments` remains as a compatibility
-- wrapper for the development quote path until the legacy runner is migrated.
CREATE TABLE IF NOT EXISTS daily_shifts (
  id UUID PRIMARY KEY,
  shift_key DATE NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('QUEUED','ACTIVE','FINALIZING','COMPLETE')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_shift_states (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES daily_shifts(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  status TEXT NOT NULL CHECK (status IN ('READY_NEXT_SHIFT','ACTIVE','PARKED','STALLED','UNDERFUNDED','DISABLED')),
  gas_remaining NUMERIC(18,6) NOT NULL DEFAULT 0,
  gas_allocated NUMERIC(18,6) NOT NULL DEFAULT 0,
  crazy_score INTEGER NOT NULL DEFAULT 0,
  fares_completed INTEGER NOT NULL DEFAULT 0,
  bankroll NUMERIC(18,6) NOT NULL DEFAULT 0,
  pit_calls_used SMALLINT NOT NULL DEFAULT 0 CHECK (pit_calls_used BETWEEN 0 AND 3),
  next_decision_at TIMESTAMPTZ,
  last_observed_at TIMESTAMPTZ,
  current_route JSONB,
  route_started_at TIMESTAMPTZ,
  state_version BIGINT NOT NULL DEFAULT 0,
  lease_token TEXT,
  lease_until TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, agent_id)
);

CREATE TABLE IF NOT EXISTS daily_shift_events (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES daily_shifts(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('FARE_COMPLETED','FARE_STALLED','AGENT_PARKED','FARE_REJECTED','IDLE_OBSERVED')),
  fare_id TEXT,
  score_delta INTEGER NOT NULL DEFAULT 0,
  gas_delta NUMERIC(18,6) NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_shifts_active_idx ON daily_shifts (status, starts_at, ends_at);
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS gas_allocated NUMERIC(18,6) NOT NULL DEFAULT 0;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS next_decision_at TIMESTAMPTZ;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS current_route JSONB;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS route_started_at TIMESTAMPTZ;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS state_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS lease_token TEXT;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS active_trip_id UUID;
ALTER TABLE agent_shift_states ADD COLUMN IF NOT EXISTS strategy JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE agent_shift_states DROP CONSTRAINT IF EXISTS agent_shift_states_status_check;
DO $$ BEGIN
  ALTER TABLE agent_shift_states ADD CONSTRAINT agent_shift_states_status_check CHECK (status IN ('READY_NEXT_SHIFT','ACTIVE','EVALUATING_FARES','FARE_ACCEPTED','ROUTE_SELECTED','ON_TRIP','STALLED','PARKED','SHIFT_COMPLETE','UNDERFUNDED','DISABLED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE daily_shift_events DROP CONSTRAINT IF EXISTS daily_shift_events_type_check;
DO $$ BEGIN
  ALTER TABLE daily_shift_events ADD CONSTRAINT daily_shift_events_type_check CHECK (type IN ('FARE_OBSERVED','FARE_ACCEPTED','ROUTE_SELECTED','TRIP_STARTED','TRIP_ADVANCED','FARE_COMPLETED','FARE_STALLED','AGENT_PARKED','FARE_REJECTED','IDLE_OBSERVED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS daily_shift_results (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES daily_shifts(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  final_rank INTEGER,
  crazy_score INTEGER NOT NULL,
  fares_completed INTEGER NOT NULL,
  gas_remaining NUMERIC(18,6) NOT NULL,
  bankroll NUMERIC(18,6) NOT NULL,
  final_status TEXT NOT NULL,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, agent_id)
);

CREATE TABLE IF NOT EXISTS transition_attempts (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  agent_id UUID REFERENCES agents(id),
  shift_id UUID REFERENCES daily_shifts(id),
  action TEXT NOT NULL,
  state_version BIGINT,
  status TEXT NOT NULL CHECK (status IN ('CLAIMED','COMMITTED','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_shift_states_due_idx ON agent_shift_states (next_action_at, status);

CREATE TABLE IF NOT EXISTS zone_states (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES daily_shifts(id),
  zone_id TEXT NOT NULL,
  agent_count INTEGER NOT NULL DEFAULT 0,
  demand_score INTEGER NOT NULL DEFAULT 50,
  supply_score INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL CHECK (state IN ('NORMAL','SURGE','OVERSUPPLIED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_id, zone_id)
);

CREATE TABLE IF NOT EXISTS game_activity (
  id UUID PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('STANDARD','AGENT')),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'Anon',
  zone_id TEXT,
  type TEXT NOT NULL,
  detail TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_activity_feed_idx ON game_activity (mode, created_at DESC);
CREATE INDEX IF NOT EXISTS game_activity_presence_idx ON game_activity (mode, zone_id, expires_at);

CREATE TABLE IF NOT EXISTS daily_fares (
  id UUID PRIMARY KEY, shift_id UUID NOT NULL REFERENCES daily_shifts(id), passenger_id TEXT NOT NULL,
  pickup_location_id TEXT NOT NULL, destination_location_id TEXT NOT NULL, point_value INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, claimed_by UUID REFERENCES agents(id), claimed_at TIMESTAMPTZ, eligibility JSONB NOT NULL DEFAULT '{}'::jsonb, surge_multiplier NUMERIC(10,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE daily_fares ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE daily_fares ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE daily_fares ADD COLUMN IF NOT EXISTS locked_surge_multiplier NUMERIC(10,4);
DO $$ BEGIN
  ALTER TABLE daily_fares ADD CONSTRAINT daily_fares_status_check CHECK (status IN ('AVAILABLE','CLAIMED','COMPLETED','EXPIRED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS agent_trips (
  id UUID PRIMARY KEY, shift_id UUID NOT NULL REFERENCES daily_shifts(id), agent_id UUID NOT NULL REFERENCES agents(id),
  fare_id UUID NOT NULL REFERENCES daily_fares(id), origin_location_id TEXT NOT NULL, destination_location_id TEXT NOT NULL,
  route_variant TEXT NOT NULL CHECK (route_variant IN ('primary','alternative')), route_version TEXT NOT NULL, route_geometry JSONB,
  route_distance_meters NUMERIC(18,3) NOT NULL, base_duration_seconds NUMERIC(18,3) NOT NULL,
  trip_started_at TIMESTAMPTZ, progress NUMERIC(8,6) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  time_modifier_seconds NUMERIC(18,3) NOT NULL DEFAULT 0, gas_modifier NUMERIC(18,3) NOT NULL DEFAULT 0,
  score_modifier NUMERIC(18,3) NOT NULL DEFAULT 0, projected_arrival TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('ROUTE_SELECTED','ON_TRIP','EVENT_PENDING','COMPLETED','STALLED','PARKED')),
  next_action_at TIMESTAMPTZ, state_version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, shift_id, fare_id)
);
ALTER TABLE agent_trips ADD COLUMN IF NOT EXISTS route_decision JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE agent_trips ADD COLUMN IF NOT EXISTS gas_consumed NUMERIC(18,3) NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS trip_events (
  id UUID PRIMARY KEY, trip_id UUID NOT NULL REFERENCES agent_trips(id), shift_id UUID NOT NULL REFERENCES daily_shifts(id), agent_id UUID NOT NULL REFERENCES agents(id),
  idempotency_key TEXT NOT NULL UNIQUE, event_id TEXT NOT NULL, event_version INTEGER NOT NULL DEFAULT 1, outcome_id TEXT NOT NULL,
  random_roll NUMERIC(18,8), time_effect NUMERIC(18,3) NOT NULL DEFAULT 0, gas_effect NUMERIC(18,3) NOT NULL DEFAULT 0, score_effect NUMERIC(18,3) NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, resolved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trip_events_trip_idx ON trip_events (trip_id, resolved_at);
CREATE UNIQUE INDEX IF NOT EXISTS trip_events_trip_event_idx ON trip_events (trip_id, event_id);

CREATE TABLE IF NOT EXISTS agent_commands (
  id UUID PRIMARY KEY, agent_id UUID NOT NULL REFERENCES agents(id), shift_id UUID NOT NULL REFERENCES daily_shifts(id), owner_wallet TEXT NOT NULL,
  command_type TEXT NOT NULL, target TEXT NOT NULL CHECK (target IN ('CURRENT_TRIP','NEXT_DECISION')), payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('PENDING','CONSUMED','EXPIRED','REJECTED')), idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ, consuming_transition_id UUID
);
CREATE INDEX IF NOT EXISTS agent_commands_pending_idx ON agent_commands (agent_id, shift_id, status, target, expires_at);
CREATE INDEX IF NOT EXISTS agent_trips_due_idx ON agent_trips (next_action_at, status);
CREATE UNIQUE INDEX IF NOT EXISTS agent_trips_one_active_idx ON agent_trips (agent_id, shift_id) WHERE status IN ('ROUTE_SELECTED','ON_TRIP','EVENT_PENDING');
CREATE INDEX IF NOT EXISTS daily_fares_claim_idx ON daily_fares (shift_id, expires_at, claimed_by);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  status TEXT NOT NULL CHECK (status IN ('REGISTERED','IDLE','EVALUATING','QUOTING','SWAPPING','DRIVING_TO_PICKUP','DRIVING_PASSENGER','STALLED','RETIRED','FINISHED')),
  bankroll NUMERIC(18,6) NOT NULL,
  crazy_score INTEGER NOT NULL DEFAULT 0,
  fares_completed INTEGER NOT NULL DEFAULT 0,
  pit_calls_used SMALLINT NOT NULL DEFAULT 0 CHECK (pit_calls_used BETWEEN 0 AND 3),
  strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, agent_id)
);

CREATE TABLE IF NOT EXISTS agent_swaps (
  id UUID PRIMARY KEY,
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id),
  fare_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('QUOTED','SUBMITTED','CONFIRMED','FAILED')),
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  input_amount NUMERIC(30,0),
  output_amount NUMERIC(30,0),
  notional_usd NUMERIC(18,6),
  platform_fee_bps SMALLINT CHECK (platform_fee_bps BETWEEN 0 AND 10000),
  platform_fee_mode TEXT CHECK (platform_fee_mode IN ('inputMint', 'outputMint')),
  platform_fee_amount NUMERIC(30,0),
  reward_contribution_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  platform_fee_account TEXT,
  signature TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_bps SMALLINT CHECK (platform_fee_bps BETWEEN 0 AND 10000);
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_mode TEXT CHECK (platform_fee_mode IN ('inputMint', 'outputMint'));
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(30,0);
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_account TEXT;
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS notional_usd NUMERIC(18,6);
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS reward_contribution_atomic NUMERIC(30,0) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS pit_calls (
  id UUID PRIMARY KEY,
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id),
  revision SMALLINT NOT NULL CHECK (revision BETWEEN 1 AND 3),
  strategy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_run_id, revision)
);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY,
  agent_run_id UUID NOT NULL REFERENCES agent_runs(id),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_activity (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_activity_created_idx ON public_activity (created_at DESC);

-- Reward settlement is deliberately separate from fee accounting and from the
-- wallet that receives DFlow fees. A settlement can be held until the reward
-- treasury has enough USDC to fund the complete daily pool.
CREATE TABLE IF NOT EXISTS reward_settlements (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL UNIQUE REFERENCES daily_shifts(id),
  shift_key DATE NOT NULL UNIQUE,
  reward_wallet TEXT NOT NULL,
  reward_mint TEXT NOT NULL,
  treasury_balance_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  payout_pool_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  threshold_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  winner_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('HELD','PAYOUT_PENDING','READY','SUBMITTED','PARTIAL','CONFIRMED','FAILED')),
  reason TEXT,
  transaction_signature TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reward_payout_entries (
  id UUID PRIMARY KEY,
  settlement_id UUID NOT NULL REFERENCES reward_settlements(id),
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  agent_id UUID NOT NULL REFERENCES agents(id),
  recipient_wallet TEXT NOT NULL,
  points INTEGER NOT NULL,
  share_bps INTEGER NOT NULL CHECK (share_bps IN (6000,2500,1500)),
  amount_atomic NUMERIC(30,0) NOT NULL CHECK (amount_atomic > 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING','SUBMITTED','CONFIRMED','FAILED')) DEFAULT 'PENDING',
  transaction_signature TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  payout_at TIMESTAMPTZ,
  UNIQUE (settlement_id, rank),
  UNIQUE (settlement_id, recipient_wallet)
);

CREATE INDEX IF NOT EXISTS reward_settlements_status_idx ON reward_settlements (status, shift_key);
CREATE INDEX IF NOT EXISTS reward_payout_entries_status_idx ON reward_payout_entries (status, settlement_id);

-- Immutable daily awards and aggregate unpaid balances. Awards remain audit
-- records; a later payout may batch several awards for the same wallet.
CREATE TABLE IF NOT EXISTS daily_reward_awards (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES daily_shifts(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  player_wallet TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  pool_amount_atomic NUMERIC(30,0) NOT NULL CHECK (pool_amount_atomic > 0),
  award_amount_atomic NUMERIC(30,0) NOT NULL CHECK (award_amount_atomic > 0),
  source TEXT NOT NULL DEFAULT 'DAILY_AGENT_LEADERBOARD',
  status TEXT NOT NULL DEFAULT 'ACCRUED' CHECK (status IN ('ACCRUED','RESERVED','PAID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  UNIQUE (shift_id, agent_id, rank)
);
ALTER TABLE daily_reward_awards ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'AGENT'
  CHECK (pool IN ('STANDARD','AGENT'));

CREATE TABLE IF NOT EXISTS reward_balances (
  player_wallet TEXT PRIMARY KEY,
  accrued_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  paid_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  unpaid_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool-level accounting is deliberately separate from wallet balances. A
-- player's Standard and Agent awards must never be mixed before settlement.
CREATE TABLE IF NOT EXISTS reward_pool_balances (
  pool TEXT PRIMARY KEY CHECK (pool IN ('STANDARD','AGENT')),
  funded_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  accrued_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  allocated_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  paid_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO reward_pool_balances (pool) VALUES ('STANDARD'), ('AGENT') ON CONFLICT DO NOTHING;

-- A reward epoch is an independently funded competition window. Standard and
-- Agent epochs never share points or thresholds.
CREATE TABLE IF NOT EXISTS reward_epochs (
  id UUID PRIMARY KEY,
  pool TEXT NOT NULL CHECK (pool IN ('STANDARD','AGENT')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','THRESHOLD_REACHED','PAYOUT_PENDING','PAID','CLOSED')),
  threshold_atomic NUMERIC(30,0) NOT NULL CHECK (threshold_atomic > 0),
  pool_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  threshold_reached_at TIMESTAMPTZ,
  payout_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP INDEX IF EXISTS reward_epochs_one_open_per_pool_idx;
CREATE UNIQUE INDEX reward_epochs_one_open_per_pool_idx
  ON reward_epochs (pool) WHERE status = 'OPEN';
ALTER TABLE reward_epochs DROP CONSTRAINT IF EXISTS reward_epochs_status_check;
ALTER TABLE reward_epochs ADD CONSTRAINT reward_epochs_status_check
  CHECK (status IN ('OPEN','THRESHOLD_REACHED','PAYOUT_PENDING','READY','SUBMITTED','PAID','CLOSED'));
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
      WHERE conrelid = 'reward_epochs'::regclass
        AND conname IN ('reward_epochs_id_pool_key', 'reward_epochs_id_pool_uq')
  ) THEN
    ALTER TABLE reward_epochs ADD CONSTRAINT reward_epochs_id_pool_uq UNIQUE (id, pool);
  END IF;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reward_epoch_scores (
  epoch_id UUID NOT NULL REFERENCES reward_epochs(id),
  player_wallet TEXT NOT NULL,
  points BIGINT NOT NULL DEFAULT 0,
  days_played INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (epoch_id, player_wallet)
);
CREATE INDEX IF NOT EXISTS reward_epoch_scores_rank_idx
  ON reward_epoch_scores (epoch_id, points DESC, days_played DESC, player_wallet ASC);

CREATE TABLE IF NOT EXISTS reward_epoch_days (
  epoch_id UUID NOT NULL REFERENCES reward_epochs(id),
  pool TEXT NOT NULL CHECK (pool IN ('STANDARD','AGENT')),
  period_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (epoch_id, period_key)
);
DO $$ BEGIN
  ALTER TABLE reward_epoch_days ADD CONSTRAINT reward_epoch_days_epoch_pool_fkey
    FOREIGN KEY (epoch_id, pool) REFERENCES reward_epochs (id, pool);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reward_epoch_contributions (
  id UUID PRIMARY KEY,
  epoch_id UUID NOT NULL REFERENCES reward_epochs(id),
  pool TEXT NOT NULL CHECK (pool IN ('STANDARD','AGENT')),
  player_wallet TEXT,
  transaction_signature TEXT NOT NULL UNIQUE,
  amount_atomic NUMERIC(30,0) NOT NULL CHECK (amount_atomic >= 0),
  confirmed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reward_epoch_contributions_epoch_idx ON reward_epoch_contributions (epoch_id, confirmed_at);
DO $$ BEGIN
  ALTER TABLE reward_epoch_contributions ADD CONSTRAINT reward_epoch_contributions_epoch_pool_fkey
    FOREIGN KEY (epoch_id, pool) REFERENCES reward_epochs (id, pool);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- This is the only mutation path for a confirmed reward contribution.  The
-- transaction signature is immutable across pools; the advisory lock makes a
-- pool's epoch selection, ledger insert, and pool increment one operation.
-- When the threshold contribution arrives, the old epoch is frozen at that
-- contribution's confirmation timestamp and a new OPEN epoch starts at the
-- same timestamp.  This lets a later confirmation be assigned to the next
-- epoch without waiting for the one-hour payout window to close.
CREATE OR REPLACE FUNCTION reward_record_epoch_contribution(
  p_contribution_id UUID,
  p_initial_epoch_id UUID,
  p_next_epoch_id UUID,
  p_pool TEXT,
  p_player_wallet TEXT,
  p_transaction_signature TEXT,
  p_amount_atomic NUMERIC(30,0),
  p_confirmed_at TIMESTAMPTZ,
  p_threshold_atomic NUMERIC(30,0)
) RETURNS TABLE (
  epoch_id UUID,
  inserted BOOLEAN,
  epoch_status TEXT,
  pool_atomic NUMERIC(30,0),
  threshold_reached_at TIMESTAMPTZ,
  payout_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
DECLARE
  v_epoch reward_epochs%ROWTYPE;
  v_existing reward_epoch_contributions%ROWTYPE;
  v_inserted_id UUID;
BEGIN
  IF p_pool NOT IN ('STANDARD', 'AGENT') THEN RAISE EXCEPTION 'reward_pool_invalid'; END IF;
  IF p_amount_atomic <= 0 THEN RAISE EXCEPTION 'reward_contribution_amount_invalid'; END IF;
  IF p_confirmed_at IS NULL THEN RAISE EXCEPTION 'reward_contribution_confirmation_required'; END IF;
  IF p_threshold_atomic <= 0 THEN RAISE EXCEPTION 'reward_threshold_invalid'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('reward-epoch:' || p_pool));

  SELECT * INTO v_existing FROM reward_epoch_contributions
    WHERE transaction_signature = p_transaction_signature;
  IF FOUND THEN
    SELECT * INTO v_epoch FROM reward_epochs WHERE id = v_existing.epoch_id;
    RETURN QUERY SELECT v_epoch.id, false, v_epoch.status, v_epoch.pool_atomic,
      v_epoch.threshold_reached_at, v_epoch.payout_at;
    RETURN;
  END IF;

  -- A delayed confirmation that predates a pending cutoff is still part of
  -- that closing epoch.  This preserves assignment by confirmed_at, not by
  -- the time the accounting worker happens to run.
  SELECT * INTO v_epoch FROM reward_epochs
    WHERE reward_epochs.pool = p_pool
      AND reward_epochs.status = 'PAYOUT_PENDING'
      AND reward_epochs.threshold_reached_at IS NOT NULL
      AND p_confirmed_at <= reward_epochs.threshold_reached_at
    ORDER BY reward_epochs.threshold_reached_at DESC
    LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_epoch FROM reward_epochs
      WHERE pool = p_pool AND status = 'OPEN'
      ORDER BY starts_at DESC
      LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO reward_epochs (id, pool, status, threshold_atomic, starts_at)
      VALUES (p_initial_epoch_id, p_pool, 'OPEN', p_threshold_atomic, p_confirmed_at)
      RETURNING * INTO v_epoch;
  END IF;

  INSERT INTO reward_epoch_contributions
    (id, epoch_id, pool, player_wallet, transaction_signature, amount_atomic, confirmed_at)
    VALUES (p_contribution_id, v_epoch.id, p_pool, p_player_wallet,
      p_transaction_signature, p_amount_atomic, p_confirmed_at)
    ON CONFLICT (transaction_signature) DO NOTHING
    RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    SELECT * INTO v_existing FROM reward_epoch_contributions
      WHERE transaction_signature = p_transaction_signature;
    SELECT * INTO v_epoch FROM reward_epochs WHERE id = v_existing.epoch_id;
    RETURN QUERY SELECT v_epoch.id, false, v_epoch.status, v_epoch.pool_atomic,
      v_epoch.threshold_reached_at, v_epoch.payout_at;
    RETURN;
  END IF;

  UPDATE reward_epochs SET pool_atomic = reward_epochs.pool_atomic + p_amount_atomic
    WHERE reward_epochs.id = v_epoch.id
    RETURNING * INTO v_epoch;

  IF v_epoch.status = 'OPEN' AND v_epoch.pool_atomic >= v_epoch.threshold_atomic THEN
    UPDATE reward_epochs
      SET status = 'PAYOUT_PENDING',
          threshold_reached_at = COALESCE(reward_epochs.threshold_reached_at, p_confirmed_at),
          payout_at = COALESCE(reward_epochs.payout_at, p_confirmed_at + interval '1 hour')
      WHERE reward_epochs.id = v_epoch.id
      RETURNING * INTO v_epoch;
    INSERT INTO reward_epochs (id, pool, status, threshold_atomic, starts_at)
      VALUES (p_next_epoch_id, p_pool, 'OPEN', v_epoch.threshold_atomic, p_confirmed_at)
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_epoch.id, true, v_epoch.status, v_epoch.pool_atomic,
    v_epoch.threshold_reached_at, v_epoch.payout_at;
END;
$$;

CREATE TABLE IF NOT EXISTS reward_funding_transfers (
  id UUID PRIMARY KEY,
  source_wallet TEXT NOT NULL,
  reward_wallet TEXT NOT NULL,
  reward_mint TEXT NOT NULL,
  pool TEXT NOT NULL CHECK (pool IN ('STANDARD','AGENT')),
  amount_atomic NUMERIC(30,0) NOT NULL CHECK (amount_atomic > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUBMITTED','CONFIRMED','FAILED')),
  transaction_signature TEXT UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reward_payout_batches (
  id UUID PRIMARY KEY,
  trigger_key DATE NOT NULL,
  reward_wallet TEXT NOT NULL,
  reward_mint TEXT NOT NULL,
  treasury_balance_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  unpaid_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  threshold_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('HELD','READY','SUBMITTED','PARTIAL','CONFIRMED','FAILED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  transaction_signature TEXT UNIQUE
);
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS epoch_id UUID REFERENCES reward_epochs(id);
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'STANDARD'
  CHECK (pool IN ('STANDARD','AGENT'));
ALTER TABLE reward_payout_batches DROP CONSTRAINT IF EXISTS reward_payout_batches_trigger_key_key;
DROP INDEX IF EXISTS reward_payout_batches_trigger_key_key;
DROP INDEX IF EXISTS reward_payout_batches_pool_trigger_idx;
CREATE UNIQUE INDEX IF NOT EXISTS reward_payout_batches_pool_epoch_idx
  ON reward_payout_batches (pool, epoch_id) WHERE epoch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reward_payout_batches_trigger_key_idx ON reward_payout_batches (trigger_key);
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS funding_source TEXT NOT NULL DEFAULT 'SEEDED_MANUAL'
  CHECK (funding_source IN ('FEE_ACCRUED','SEEDED_MANUAL','MIXED','UNKNOWN'));
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS payout_at TIMESTAMPTZ;
ALTER TABLE reward_payout_batches DROP CONSTRAINT IF EXISTS reward_payout_batches_status_check;
ALTER TABLE reward_payout_batches ADD CONSTRAINT reward_payout_batches_status_check CHECK (status IN ('HELD','PAYOUT_PENDING','READY','SUBMITTED','PARTIAL','CONFIRMED','FAILED'));

CREATE TABLE IF NOT EXISTS reward_payout_batch_entries (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES reward_payout_batches(id),
  player_wallet TEXT NOT NULL,
  amount_atomic NUMERIC(30,0) NOT NULL CHECK (amount_atomic > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUBMITTED','CONFIRMED','FAILED')),
  transaction_signature TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  UNIQUE (batch_id, player_wallet)
);
ALTER TABLE reward_payout_batch_entries ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE reward_payout_batch_entries ADD COLUMN IF NOT EXISTS share_bps INTEGER;
DO $$ BEGIN
  ALTER TABLE reward_payout_batch_entries ADD CONSTRAINT reward_payout_batch_entries_rank_check
    CHECK (rank BETWEEN 1 AND 3);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE reward_payout_batch_entries ADD CONSTRAINT reward_payout_batch_entries_share_bps_check
    CHECK (share_bps IN (6000,2500,1500));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS reward_payout_batch_entries_rank_idx
  ON reward_payout_batch_entries (batch_id, rank) WHERE rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS daily_reward_awards_unpaid_idx ON daily_reward_awards (status, player_wallet);
CREATE INDEX IF NOT EXISTS reward_balances_unpaid_idx ON reward_balances (unpaid_atomic DESC);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id UUID PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_sessions_active_token_idx ON agent_sessions (token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS standard_players (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE standard_players ADD COLUMN IF NOT EXISTS display_name TEXT;
CREATE TABLE IF NOT EXISTS standard_transactions (
  id UUID PRIMARY KEY, player_wallet TEXT NOT NULL REFERENCES standard_players(wallet_address),
  mode TEXT NOT NULL DEFAULT 'STANDARD' CHECK (mode='STANDARD'), environment TEXT NOT NULL CHECK (environment IN ('NORMAL','PRODUCTION_TEST')),
  input_mint TEXT NOT NULL, output_mint TEXT NOT NULL, input_amount_raw NUMERIC(30,0) NOT NULL, output_amount_raw NUMERIC(30,0),
  transaction_signature TEXT NOT NULL UNIQUE, platform_fee_bps SMALLINT NOT NULL CHECK (platform_fee_bps BETWEEN 0 AND 10000),
  platform_fee_mode TEXT NOT NULL CHECK (platform_fee_mode IN ('inputMint','outputMint')), platform_fee_account TEXT,
  platform_fee_amount NUMERIC(30,0), platform_fee_mint TEXT, reward_contribution_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','CONFIRMED','FAILED')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(), confirmed_at TIMESTAMPTZ, backfilled BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS standard_game_results (
  id UUID PRIMARY KEY, player_wallet TEXT NOT NULL REFERENCES standard_players(wallet_address), fare_session_id TEXT NOT NULL,
  competition_period DATE NOT NULL, environment TEXT NOT NULL CHECK (environment IN ('NORMAL','PRODUCTION_TEST')), score_delta INTEGER NOT NULL,
  resulting_period_score INTEGER NOT NULL, fare_completed BOOLEAN NOT NULL, transaction_signature TEXT REFERENCES standard_transactions(transaction_signature),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (player_wallet, fare_session_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS standard_game_results_transaction_idx ON standard_game_results (transaction_signature) WHERE transaction_signature IS NOT NULL;
ALTER TABLE standard_game_results ADD COLUMN IF NOT EXISTS final_stars SMALLINT;
ALTER TABLE standard_game_results ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE standard_game_results ADD COLUMN IF NOT EXISTS event_outcome_id TEXT;
ALTER TABLE standard_game_results ADD COLUMN IF NOT EXISTS score_version TEXT;
ALTER TABLE standard_game_results ADD COLUMN IF NOT EXISTS fare_snapshot JSONB;
ALTER TABLE standard_transactions ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(30,0);
ALTER TABLE standard_transactions ADD COLUMN IF NOT EXISTS platform_fee_mint TEXT;
ALTER TABLE standard_transactions ADD COLUMN IF NOT EXISTS reward_contribution_atomic NUMERIC(30,0) NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS standard_daily_reward_awards (
  id UUID PRIMARY KEY, competition_period DATE NOT NULL, environment TEXT NOT NULL CHECK (environment IN ('NORMAL','PRODUCTION_TEST')),
  player_wallet TEXT NOT NULL REFERENCES standard_players(wallet_address), rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  pool_amount_atomic NUMERIC(30,0) NOT NULL CHECK (pool_amount_atomic > 0), award_amount_atomic NUMERIC(30,0) NOT NULL CHECK (award_amount_atomic > 0),
  source TEXT NOT NULL DEFAULT 'STANDARD_LEADERBOARD', status TEXT NOT NULL DEFAULT 'ACCRUED' CHECK (status IN ('ACCRUED','RESERVED','PAID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), paid_at TIMESTAMPTZ,
  UNIQUE (competition_period, environment, player_wallet, rank)
);
ALTER TABLE standard_daily_reward_awards ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'STANDARD'
  CHECK (pool IN ('STANDARD','AGENT'));
CREATE INDEX IF NOT EXISTS standard_results_period_idx ON standard_game_results (competition_period, environment, player_wallet);
CREATE INDEX IF NOT EXISTS standard_transactions_wallet_idx ON standard_transactions (player_wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS standard_awards_unpaid_idx ON standard_daily_reward_awards (status, player_wallet);
