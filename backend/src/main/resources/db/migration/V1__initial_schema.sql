-- Railway PostgreSQL baseline. Kept separate from Supabase role/storage migrations.
-- UUIDs are assigned by the application; enum values are stored as strings by JPA.

-- Source: 20260829000002_create_users_and_vendors.sql
-- ==============================================================================
-- VESTIGE DATABASE MIGRATION 02: USERS, VENDOR PROFILES & DOCUMENTS
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(50) NOT NULL DEFAULT 'USER',
  preferred_lang  VARCHAR(50) NOT NULL DEFAULT 'en',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. VENDOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id                    UUID PRIMARY KEY,
  user_id               UUID NOT NULL,
  business_name         VARCHAR(150) NOT NULL,
  business_type         VARCHAR(100),
  address               TEXT NOT NULL,
  city                  VARCHAR(100) NOT NULL,
  state                 VARCHAR(100) NOT NULL,
  pincode               VARCHAR(10) NOT NULL,
  whatsapp_number       VARCHAR(20),
  operating_hours       JSONB DEFAULT '{}'::jsonb,
  service_types         TEXT[] NOT NULL DEFAULT ARRAY['REPAIR']::TEXT[],
  device_categories     TEXT[] NOT NULL DEFAULT ARRAY['SMARTPHONE']::TEXT[],
  verification_status   VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason      TEXT,
  rating_avg            DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count          INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_vendor_profiles_user_id UNIQUE (user_id),
  CONSTRAINT fk_vendor_profiles_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_vendor_rating_range CHECK (rating_avg >= 0.00 AND rating_avg <= 5.00),
  CONSTRAINT chk_vendor_rating_count CHECK (rating_count >= 0),
  CONSTRAINT chk_vendor_rejection_reason CHECK (
    (verification_status = 'REJECTED' AND rejection_reason IS NOT NULL AND trim(rejection_reason) <> '')
    OR (verification_status != 'REJECTED')
  )
);

-- 3. VENDOR DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id              UUID PRIMARY KEY,
  vendor_id       UUID NOT NULL,
  document_type   VARCHAR(100) NOT NULL, -- e.g. 'BUSINESS_REGISTRATION', 'GOVERNMENT_ID', 'CERTIFICATION'
  file_url        TEXT NOT NULL,
  file_name       VARCHAR(255),
  file_size_bytes BIGINT,
  mime_type       VARCHAR(100),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_vendor_documents_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id) ON DELETE CASCADE
);


-- Source: 20260829000003_create_device_submissions.sql
-- ==============================================================================
-- VESTIGE DATABASE MIGRATION 03: DEVICE SUBMISSIONS
-- ==============================================================================

-- 4. DEVICE SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.device_submissions (
  id                    UUID PRIMARY KEY,
  user_id               UUID NOT NULL,
  device_type           VARCHAR(50) NOT NULL,
  brand                 VARCHAR(100) NOT NULL,
  model                 VARCHAR(100) NOT NULL,
  device_age_years      INTEGER NOT NULL,
  condition             VARCHAR(50) NOT NULL,
  known_issues          TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_repair_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  original_value        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  part_availability     VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
  engine_score          INTEGER,
  engine_recommendation VARCHAR(50),
  engine_confidence     VARCHAR(50),
  engine_rationale      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_device_submissions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_device_age_positive CHECK (device_age_years >= 0),
  CONSTRAINT chk_repair_cost_positive CHECK (estimated_repair_cost >= 0.00),
  CONSTRAINT chk_original_value_positive CHECK (original_value >= 0.00),
  CONSTRAINT chk_engine_score_range CHECK (engine_score IS NULL OR (engine_score >= 0 AND engine_score <= 100))
);


-- Source: 20260829000004_create_repair_and_recycling.sql
-- ==============================================================================
-- VESTIGE DATABASE MIGRATION 04: REPAIR & RECYCLING WORKFLOWS & STATUS AUDIT TRAILS
-- ==============================================================================

-- 5. REPAIR BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.repair_bookings (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL,
  vendor_id         UUID NOT NULL,
  submission_id     UUID NOT NULL,
  preferred_date    DATE NOT NULL,
  preferred_time    TIME,
  issue_description TEXT NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason  TEXT,
  user_rating       INTEGER,
  user_feedback     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_repair_bookings_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_repair_bookings_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_repair_bookings_submission FOREIGN KEY (submission_id) REFERENCES public.device_submissions(id) ON DELETE RESTRICT,
  CONSTRAINT chk_booking_rating_range CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5))
);

-- 6. REPAIR STATUS HISTORY TABLE (APPEND-ONLY AUDIT LOG)
CREATE TABLE IF NOT EXISTS public.repair_status_history (
  id                  UUID PRIMARY KEY,
  booking_id          UUID NOT NULL,
  previous_status     VARCHAR(50),
  new_status          VARCHAR(50) NOT NULL,
  changed_by_user_id  UUID NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_repair_history_booking FOREIGN KEY (booking_id) REFERENCES public.repair_bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_repair_history_user FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT
);

-- 7. RECYCLING REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.recycling_requests (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL,
  vendor_id       UUID NOT NULL,
  submission_id   UUID NOT NULL,
  pickup_address  TEXT NOT NULL,
  pickup_date     DATE NOT NULL,
  pickup_time     TIME,
  device_count    INTEGER NOT NULL DEFAULT 1,
  status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  points_awarded  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_recycling_requests_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_recycling_requests_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_recycling_requests_submission FOREIGN KEY (submission_id) REFERENCES public.device_submissions(id) ON DELETE RESTRICT,
  CONSTRAINT chk_recycling_device_count CHECK (device_count >= 1),
  CONSTRAINT chk_recycling_points_positive CHECK (points_awarded >= 0)
);

-- 8. RECYCLING STATUS HISTORY TABLE (APPEND-ONLY AUDIT LOG)
CREATE TABLE IF NOT EXISTS public.recycling_status_history (
  id                  UUID PRIMARY KEY,
  request_id          UUID NOT NULL,
  previous_status     VARCHAR(50),
  new_status          VARCHAR(50) NOT NULL,
  changed_by_user_id  UUID NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_recycling_history_request FOREIGN KEY (request_id) REFERENCES public.recycling_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_recycling_history_user FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT
);


-- Source: 20260829000005_create_rewards_and_audit.sql
-- ==============================================================================
-- VESTIGE DATABASE MIGRATION 05: REWARD ACCOUNTS, TRANSACTIONS, REDEMPTIONS & AUDIT LOGS
-- ==============================================================================

-- 9. REWARD ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.reward_accounts (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL,
  balance           INTEGER NOT NULL DEFAULT 0,
  lifetime_earned   INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_reward_accounts_user_id UNIQUE (user_id),
  CONSTRAINT fk_reward_accounts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chk_reward_balance_positive CHECK (balance >= 0),
  CONSTRAINT chk_lifetime_earned_positive CHECK (lifetime_earned >= 0),
  CONSTRAINT chk_lifetime_redeemed_positive CHECK (lifetime_redeemed >= 0)
);

-- 10. REWARD TRANSACTIONS TABLE (APPEND-ONLY AUDIT LOG)
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id                UUID PRIMARY KEY,
  account_id        UUID NOT NULL,
  points            INTEGER NOT NULL,
  transaction_type  VARCHAR(50) NOT NULL,
  source            VARCHAR(50) NOT NULL,
  reference_id      UUID,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_reward_transactions_account FOREIGN KEY (account_id) REFERENCES public.reward_accounts(id) ON DELETE CASCADE,
  CONSTRAINT chk_reward_transaction_points_positive CHECK (points > 0)
);

-- 11. REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.redemptions (
  id                UUID PRIMARY KEY,
  user_id           UUID NOT NULL,
  reward_item       VARCHAR(150) NOT NULL,
  points_used       INTEGER NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  fulfillment_notes TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_redemptions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_redemption_points_positive CHECK (points_used > 0)
);

-- 12. ADMIN ACTIONS TABLE (APPEND-ONLY AUDIT LOG)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id            UUID PRIMARY KEY,
  admin_id      UUID NOT NULL,
  action_type   VARCHAR(100) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_id     UUID NOT NULL,
  details       JSONB DEFAULT '{}'::jsonb,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE RESTRICT
);


-- Source: 20260829000006_create_indexes_and_constraints.sql
-- ==============================================================================
-- VESTIGE DATABASE MIGRATION 06: INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================

-- 1. Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users (role, is_active);

-- 2. Vendor Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON public.vendor_profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_city_status ON public.vendor_profiles (city, verification_status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_services ON public.vendor_profiles USING GIN (service_types);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_categories ON public.vendor_profiles USING GIN (device_categories);

-- 3. Vendor Documents Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents (vendor_id);

-- 4. Device Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_device_submissions_user_id ON public.device_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_device_submissions_recommendation ON public.device_submissions (engine_recommendation);
CREATE INDEX IF NOT EXISTS idx_device_submissions_created_at ON public.device_submissions (created_at DESC);

-- 5. Repair Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_repair_bookings_user_id ON public.repair_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_vendor_id ON public.repair_bookings (vendor_id);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_status ON public.repair_bookings (status);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_date ON public.repair_bookings (preferred_date);

-- 6. Repair Status History Indexes
CREATE INDEX IF NOT EXISTS idx_repair_status_history_booking_id ON public.repair_status_history (booking_id);
CREATE INDEX IF NOT EXISTS idx_repair_status_history_created_at ON public.repair_status_history (created_at DESC);

-- 7. Recycling Requests Indexes
CREATE INDEX IF NOT EXISTS idx_recycling_requests_user_id ON public.recycling_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_vendor_id ON public.recycling_requests (vendor_id);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_status ON public.recycling_requests (status);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_date ON public.recycling_requests (pickup_date);

-- 8. Recycling Status History Indexes
CREATE INDEX IF NOT EXISTS idx_recycling_status_history_request_id ON public.recycling_status_history (request_id);
CREATE INDEX IF NOT EXISTS idx_recycling_status_history_created_at ON public.recycling_status_history (created_at DESC);

-- 9. Reward Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_reward_accounts_user_id ON public.reward_accounts (user_id);

-- 10. Reward Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_reward_transactions_account_id ON public.reward_transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_created_at ON public.reward_transactions (created_at DESC);

-- 11. Redemptions Indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions (status);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON public.redemptions (created_at DESC);

-- 12. Admin Actions Indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions (created_at DESC);


-- Source: 20260829000010_create_payments.sql
-- 2. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY,
  user_id             UUID NOT NULL,
  related_entity_type VARCHAR(50) NOT NULL, -- e.g. 'REPAIR_BOOKING', 'RECYCLING_LOGISTICS'
  related_entity_id   UUID NOT NULL,
  provider            VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  provider_order_id   VARCHAR(100) NOT NULL,
  provider_payment_id VARCHAR(100),
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
  status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_payments_amount_positive CHECK (amount > 0)
);

-- Indexes for performance & auditability
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_related_entity ON public.payments(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Grants for application role


-- Source: 20260829000011_secure_bootstrap_and_audit.sql
-- Remove the known placeholder administrator account from earlier installations.
UPDATE public.users
SET is_active = false
WHERE email = 'admin@vestige.internal'
  AND password_hash = '$2a$12$e6mZt65P3y21r5XNf2lRxe46GZ/P698UjUa9lX19b52wYQ0p3H90.';

-- The application stores audit details as text. Keep the database column aligned.
ALTER TABLE public.admin_actions
  ALTER COLUMN details TYPE TEXT USING details::text,
  ALTER COLUMN details SET DEFAULT '{}';
