-- supabase/migrations/001_initial_schema.sql

-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  telegram_id     BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_name   TEXT NOT NULL,
  photo_url       TEXT,
  wallet_address  TEXT UNIQUE,
  device_uuid     TEXT,
  mudang_balance  BIGINT NOT NULL DEFAULT 0,
  total_earned    BIGINT NOT NULL DEFAULT 0,
  referral_code   TEXT UNIQUE NOT NULL,
  referred_by     UUID REFERENCES users(id),
  karma_points    INT NOT NULL DEFAULT 0,
  has_free_egg    BOOLEAN NOT NULL DEFAULT TRUE,
  tutorial_complete BOOLEAN NOT NULL DEFAULT FALSE,
  birth_year      INT,
  birth_month     INT,
  birth_day       INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Pets
CREATE TABLE pets (
  id              UUID PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL,
  rarity          TEXT NOT NULL CHECK (rarity IN ('common','blessed','mudang','grand_mudang')),
  element         TEXT NOT NULL CHECK (element IN ('wood','fire','earth','metal','water')),
  status          TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive','cursed','dead','transcended')),
  luck_stat       INT NOT NULL DEFAULT 50,
  vitality_stat   INT NOT NULL DEFAULT 50,
  wealth_stat     INT NOT NULL DEFAULT 50,
  wisdom_stat     INT NOT NULL DEFAULT 50,
  base_mining_rate INT NOT NULL DEFAULT 100,
  total_mined     BIGINT NOT NULL DEFAULT 0,
  current_level   INT NOT NULL DEFAULT 1,
  xp              INT NOT NULL DEFAULT 0,
  xp_to_next      INT NOT NULL DEFAULT 100,
  born_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dies_at         TIMESTAMPTZ NOT NULL,
  crisis_type     TEXT CHECK (crisis_type IN ('sal','samjae') OR crisis_type IS NULL),
  crisis_started_at TIMESTAMPTZ,
  crisis_ends_at  TIMESTAMPTZ,
  token_id        INT,
  on_chain        BOOLEAN NOT NULL DEFAULT FALSE,
  mint_tx_hash    TEXT,
  sprite_seed     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_status ON pets(status);

-- Daily Fortunes
CREATE TABLE daily_fortunes (
  id               UUID PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id),
  date             DATE NOT NULL,
  score            INT NOT NULL,
  label            TEXT NOT NULL,
  mining_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  element_of_day   TEXT NOT NULL,
  stem_branch      TEXT,
  advisory_text    TEXT,
  crisis_probability NUMERIC(4,3),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Mining Sessions
CREATE TABLE mining_sessions (
  id          UUID PRIMARY KEY,
  pet_id      UUID NOT NULL REFERENCES pets(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at  TIMESTAMPTZ,
  amount      BIGINT NOT NULL DEFAULT 0,
  multiplier  NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','claimable','claimed'))
);

CREATE INDEX idx_mining_pet_id ON mining_sessions(pet_id);
CREATE INDEX idx_mining_status ON mining_sessions(status);

-- Transactions
CREATE TABLE transactions (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL,
  amount_ton  NUMERIC(18,9),
  amount_mudang BIGINT,
  tx_hash     TEXT UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending',
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_user_id ON transactions(user_id);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);

-- Revenue Splits
CREATE TABLE revenue_splits (
  id              UUID PRIMARY KEY,
  source_tx_hash  TEXT,
  total_ton       NUMERIC(18,9),
  reward_pool     NUMERIC(18,9),
  ops_fund        NUMERIC(18,9),
  mudang_pool     NUMERIC(18,9),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOS Requests
CREATE TABLE sos_requests (
  id            UUID PRIMARY KEY,
  pet_id        UUID NOT NULL REFERENCES pets(id),
  owner_id      UUID NOT NULL REFERENCES users(id),
  helper_count  INT NOT NULL DEFAULT 0,
  helper_ids    TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','resolved','expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- NFT Listings
CREATE TABLE nft_listings (
  id          UUID PRIMARY KEY,
  pet_id      UUID NOT NULL REFERENCES pets(id),
  seller_id   UUID NOT NULL REFERENCES users(id),
  buyer_id    UUID REFERENCES users(id),
  price_ton   NUMERIC(18,9) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at     TIMESTAMPTZ
);

-- Pending Withdrawals (7-day lockup)
CREATE TABLE pending_withdrawals (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  pet_id          UUID REFERENCES pets(id),
  amount          BIGINT NOT NULL,
  lockup_ends_at  TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','unlocked','withdrawn')),
  tx_hash         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user ON pending_withdrawals(user_id);
CREATE INDEX idx_withdrawals_lockup ON pending_withdrawals(lockup_ends_at);

-- Security Events
CREATE TABLE security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  user_id     UUID REFERENCES users(id),
  device_uuid TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Add MUDANG balance
CREATE OR REPLACE FUNCTION add_mudang_balance(p_user_id UUID, p_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET mudang_balance = mudang_balance + p_amount,
      total_earned   = total_earned   + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Deduct MUDANG balance
CREATE OR REPLACE FUNCTION deduct_mudang_balance(p_user_id UUID, p_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET mudang_balance = GREATEST(0, mudang_balance - p_amount)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Increment helper
CREATE OR REPLACE FUNCTION increment(x INT)
RETURNS INT AS $$
  SELECT x + 1
$$ LANGUAGE SQL;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_fortunes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_listings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_withdrawals ENABLE ROW LEVEL SECURITY;

-- All reads/writes go through service role (API routes)
-- No direct client access

-- Lock-up unlocking via cron job (see cron section)
-- Runs daily via cron-job.org calling /api/cron/unlock

-- Add 'processing' status to pending_withdrawals
ALTER TABLE pending_withdrawals
  DROP CONSTRAINT IF EXISTS pending_withdrawals_status_check;
ALTER TABLE pending_withdrawals
  ADD CONSTRAINT pending_withdrawals_status_check
  CHECK (status IN ('locked', 'unlocked', 'processing', 'completed', 'failed'));
