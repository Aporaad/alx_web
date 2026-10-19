-- =============================================================================
-- ALX Web Portal - Customer Details Database Setup Script
-- Supabase (PostgreSQL)
-- Table: cust_details with extracted top-level relational columns
-- =============================================================================

CREATE TABLE IF NOT EXISTS cust_details (
  id                   TEXT PRIMARY KEY,                     -- e.g. cust_detail_id or user_uid
  user_uid             TEXT NOT NULL,                         -- FK to portal_users.id / Supabase Auth UID
  customer_id          TEXT,                                  -- FK to customers.id
  join_by              TEXT,                                  -- Registration acquisition method (ad, facebook, friend, courier, employee, etc.)
  referrer_id          TEXT,                                  -- ID of referring user/courier/employee
  onboarding_completed BOOLEAN DEFAULT FALSE,                 -- Onboarding flow status
  created_at           BIGINT DEFAULT (extract(epoch from now()) * 1000), -- Epoch ms
  updated_at           BIGINT DEFAULT (extract(epoch from now()) * 1000), -- Epoch ms
  data                 JSONB NOT NULL DEFAULT '{}'::jsonb     -- All nested details (location, body, categories, etc.)
);

-- Indexes for efficient relational querying & foreign keys
CREATE INDEX IF NOT EXISTS idx_cust_details_user_uid     ON cust_details(user_uid);
CREATE INDEX IF NOT EXISTS idx_cust_details_customer_id  ON cust_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_details_join_by       ON cust_details(join_by);
CREATE INDEX IF NOT EXISTS idx_cust_details_referrer_id   ON cust_details(referrer_id);

-- Add join_by and referrer_id columns to portal_users & customers if not already present
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portal_users' AND column_name='join_by') THEN
    ALTER TABLE portal_users ADD COLUMN join_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portal_users' AND column_name='referrer_id') THEN
    ALTER TABLE portal_users ADD COLUMN referrer_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='join_by') THEN
    ALTER TABLE customers ADD COLUMN join_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='referrer_id') THEN
    ALTER TABLE customers ADD COLUMN referrer_id TEXT;
  END IF;
END $$;
