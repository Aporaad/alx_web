-- =============================================================================
-- ALX Web Portal - Database Setup Script
-- Supabase (PostgreSQL) - Tables following { id TEXT, data JSONB } pattern
-- Generated: 2026-07-30
-- =============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor).
-- All tables follow the system-wide schema convention:
--   id   TEXT PRIMARY KEY   --> unique identifier (UUID or custom)
--   data JSONB NOT NULL     --> all business fields stored as a JSON object
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.1  portal_users  (مستخدمو بوابة الويب)
-- Holds all external portal accounts: customers, couriers, suppliers.
-- id = Supabase Auth UID (from auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_users (
  id   TEXT PRIMARY KEY,            -- Supabase Auth UID
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
-- Indexes on frequently-queried data fields
CREATE INDEX IF NOT EXISTS idx_portal_users_email
  ON portal_users ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_portal_users_phone
  ON portal_users ((data->>'phone'));
CREATE INDEX IF NOT EXISTS idx_portal_users_username
  ON portal_users ((data->>'username'));
CREATE INDEX IF NOT EXISTS idx_portal_users_portalRole
  ON portal_users ((data->>'portalRole'));
CREATE INDEX IF NOT EXISTS idx_portal_users_approvalStatus
  ON portal_users ((data->>'approvalStatus'));
CREATE INDEX IF NOT EXISTS idx_portal_users_linkedAccId
  ON portal_users ((data->>'linkedAccId'));

-- Expected data fields (stored inside JSONB `data` column):
-- uid              TEXT        Supabase Auth UID (mirrors id column)
-- username         TEXT        Login/display name (derived from email or chosen)
-- email            TEXT        UNIQUE – primary login identifier
-- phone            TEXT        Mobile number for contact & WhatsApp
-- fullName         TEXT        Full Arabic/English name
-- portalRole       TEXT        'customer' | 'courier' | 'supplier'
-- approvalStatus   TEXT        'approved' | 'pending_approval' | 'rejected'
-- address          TEXT        Residential/business address
-- gpsLocation      TEXT        GPS coordinates string "lat,lng"
-- identityDocUrl   TEXT        National ID scan URL (couriers)
-- commercialRegisterUrl TEXT   Commercial register scan URL (suppliers)
-- profileImageUrl  TEXT        Profile/company logo URL
-- linkedAccId      TEXT        ID of linked entity in customers/couriers/sources
-- linkedCustomerId TEXT        FK -> customers.id   (for customer role)
-- linkedCourierId  TEXT        FK -> couriers.id    (for courier role)
-- linkedSourceId   TEXT        FK -> sources.id     (for supplier role)
-- notes            TEXT        Admin notes on account verification
-- createdAt        BIGINT      Epoch milliseconds
-- updatedAt        BIGINT      Epoch milliseconds


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.2  portal_orders  (طلبات الشحن الذاتية من بوابة الويب)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_orders (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_portal_orders_customerUid
  ON portal_orders ((data->>'customerUid'));
CREATE INDEX IF NOT EXISTS idx_portal_orders_trackingNumber
  ON portal_orders ((data->>'trackingNumber'));
CREATE INDEX IF NOT EXISTS idx_portal_orders_status
  ON portal_orders ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_portal_orders_courierId
  ON portal_orders ((data->>'courierId'));
CREATE INDEX IF NOT EXISTS idx_portal_orders_createdAt
  ON portal_orders ((data->>'createdAt'));

-- Expected data fields:
-- trackingNumber   TEXT        Unique portal tracking ref  (e.g. ALX-123456)
-- customerUid      TEXT        FK -> portal_users.id
-- customerId       TEXT        FK -> customers.id  (set after linking)
-- customerName     TEXT
-- customerPhone    TEXT
-- recipientName    TEXT
-- recipientPhone   TEXT
-- recipientAddress TEXT
-- deliveryCity     TEXT
-- packageType      TEXT        'standard'|'express'|'factory_cbm'|'heavy'
-- weightKg         NUMERIC
-- cbmVolume        NUMERIC
-- goodsDescription TEXT
-- estimatedCost    NUMERIC
-- currency         TEXT        Default 'YER'
-- status           TEXT        'pending_review'|'accepted'|'in_progress'|
--                               'out_for_delivery'|'delivered'|'cancelled'|'returned'
-- source           TEXT        Default 'web_portal'
-- courierId        TEXT        FK -> couriers.id  (assigned after acceptance)
-- courierName      TEXT
-- attachments      JSONB       Array of image URLs
-- notes            TEXT
-- createdAt        BIGINT
-- updatedAt        BIGINT


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.3  transactions  (كشف الحساب المالي للبوابة)
-- Portal-facing financial statement lines for customers/couriers/suppliers.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_transactions_userUid
  ON transactions ((data->>'userUid'));
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions ((data->>'date'));
CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions ((data->>'type'));

-- Expected data fields:
-- userUid          TEXT        FK -> portal_users.id
-- date             BIGINT      Epoch ms of the transaction
-- description      TEXT        Arabic narrative of the movement
-- refNumber        TEXT        Shipment/voucher reference number
-- amount           NUMERIC
-- currency         TEXT
-- type             TEXT        'debit' | 'credit'
-- runningBalance   NUMERIC     Cumulative balance after this line
-- notes            TEXT


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.4  portal_tickets  (تذاكر الدعم الفني والشكاوى)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_tickets (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_portal_tickets_userUid
  ON portal_tickets ((data->>'userUid'));
CREATE INDEX IF NOT EXISTS idx_portal_tickets_status
  ON portal_tickets ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_portal_tickets_type
  ON portal_tickets ((data->>'type'));

-- Expected data fields:
-- userUid          TEXT        FK -> portal_users.id
-- userName         TEXT
-- userRole         TEXT        'customer' | 'courier' | 'supplier'
-- type             TEXT        'suggestion' | 'complaint' | 'inquiry'
-- subject          TEXT        Short title
-- message          TEXT        Full ticket body
-- status           TEXT        'open' | 'in_progress' | 'resolved' | 'closed'
-- adminResponse    TEXT        Admin reply text
-- respondedAt      BIGINT      Epoch ms when admin responded
-- createdAt        BIGINT


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.5  announcements  (الإعلانات والعروض الترويجية)
-- Published by system admins, displayed on the portal landing and dashboards.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_announcements_isActive
  ON announcements ((data->>'isActive'));
CREATE INDEX IF NOT EXISTS idx_announcements_targetAudience
  ON announcements ((data->>'targetAudience'));
CREATE INDEX IF NOT EXISTS idx_announcements_priority
  ON announcements ((data->>'priority'));

-- Expected data fields:
-- title            TEXT        Announcement headline
-- content          TEXT        Promotional body text
-- imageUrl         TEXT        Banner/image URL
-- targetAudience   TEXT        'all' | 'customer' | 'courier' | 'supplier'
-- priority         TEXT        'normal' | 'high' | 'urgent'
-- isActive         BOOLEAN     Whether displayed on portal
-- createdAt        BIGINT


-- =============================================================================
-- NOTE: `customers`, `couriers`, `sources`, `orders`, `users`, `accounts` etc.
-- are system tables that ALREADY EXIST in the main swiftship database.
-- This script only creates the NEW portal-specific tables listed above.
-- The portal writes to the system tables (customers, couriers) during user
-- registration to ensure data is unified in the main system.
-- =============================================================================

-- Verify creation
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'portal_users', 'portal_orders', 'transactions',
    'portal_tickets', 'announcements'
  )
ORDER BY table_name;
