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
