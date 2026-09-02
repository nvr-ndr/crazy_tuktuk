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
  status TEXT NOT NULL CHECK (status IN ('HELD','READY','SUBMITTED','PARTIAL','CONFIRMED','FAILED')),
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
  allocated_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  paid_atomic NUMERIC(30,0) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO reward_pool_balances (pool) VALUES ('STANDARD'), ('AGENT') ON CONFLICT DO NOTHING;

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
  trigger_key DATE NOT NULL UNIQUE,
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
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS funding_source TEXT NOT NULL DEFAULT 'SEEDED_MANUAL'
  CHECK (funding_source IN ('FEE_ACCRUED','SEEDED_MANUAL','MIXED','UNKNOWN'));
ALTER TABLE reward_payout_batches ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'STANDARD'
  CHECK (pool IN ('STANDARD','AGENT'));

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
ALTER TABLE standard_daily_reward_awards ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'STANDARD'
  CHECK (pool IN ('STANDARD','AGENT'));
CREATE INDEX IF NOT EXISTS standard_results_period_idx ON standard_game_results (competition_period, environment, player_wallet);
CREATE INDEX IF NOT EXISTS standard_transactions_wallet_idx ON standard_transactions (player_wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS standard_awards_unpaid_idx ON standard_daily_reward_awards (status, player_wallet);
