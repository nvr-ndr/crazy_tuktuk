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
  platform_fee_account TEXT,
  signature TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_bps SMALLINT CHECK (platform_fee_bps BETWEEN 0 AND 10000);
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_mode TEXT CHECK (platform_fee_mode IN ('inputMint', 'outputMint'));
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(30,0);
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS platform_fee_account TEXT;
ALTER TABLE agent_swaps ADD COLUMN IF NOT EXISTS notional_usd NUMERIC(18,6);

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
CREATE TABLE IF NOT EXISTS standard_daily_reward_awards (
  id UUID PRIMARY KEY, competition_period DATE NOT NULL, environment TEXT NOT NULL CHECK (environment IN ('NORMAL','PRODUCTION_TEST')),
  player_wallet TEXT NOT NULL REFERENCES standard_players(wallet_address), rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
  pool_amount_atomic NUMERIC(30,0) NOT NULL CHECK (pool_amount_atomic > 0), award_amount_atomic NUMERIC(30,0) NOT NULL CHECK (award_amount_atomic > 0),
  source TEXT NOT NULL DEFAULT 'STANDARD_LEADERBOARD', status TEXT NOT NULL DEFAULT 'ACCRUED' CHECK (status IN ('ACCRUED','RESERVED','PAID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), paid_at TIMESTAMPTZ,
  UNIQUE (competition_period, environment, player_wallet, rank)
);
CREATE INDEX IF NOT EXISTS standard_results_period_idx ON standard_game_results (competition_period, environment, player_wallet);
CREATE INDEX IF NOT EXISTS standard_transactions_wallet_idx ON standard_transactions (player_wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS standard_awards_unpaid_idx ON standard_daily_reward_awards (status, player_wallet);
