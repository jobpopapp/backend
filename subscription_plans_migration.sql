-- 1. Create the subscription_plans table
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY, -- e.g., 'per_job', 'monthly', 'annual'
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  duration_days INTEGER, -- null for per_job, 30 for monthly, 365 for annual
  features JSONB, -- Store features as a JSON array of strings
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add comments for clarity
COMMENT ON COLUMN subscription_plans.id IS 'Unique identifier for the plan, used in code.';
COMMENT ON COLUMN subscription_plans.duration_days IS 'Duration of the subscription in days.';
COMMENT ON COLUMN subscription_plans.features IS 'A JSON array of feature strings for the plan.';
COMMENT ON COLUMN subscription_plans.is_popular IS 'Flag to mark a plan as popular in the UI.';

-- 3. Insert the subscription plans
INSERT INTO subscription_plans (id, name, description, price, currency, duration_days, features, is_popular)
VALUES
  (
    'per_job',
    'Per Job Plan',
    'Pay only for the jobs you post',
    500,
    'UGX',
    NULL, -- No duration for a single job post
    '["Single job posting", "Job management dashboard", "Email support", "No expiry date"]'::jsonb,
    FALSE
  ),
  (
    'monthly',
    'Monthly Plan',
    'Post unlimited jobs for 30 days',
    700,
    'UGX',
    30,
    '["Unlimited job postings", "Job management dashboard", "Email support", "30 days validity"]'::jsonb,
    TRUE
  ),
  (
    'annual',
    'Annual Plan',
    'Post unlimited jobs for 365 days with significant savings',
    1000,
    'UGX',
    365,
    '["Unlimited job postings", "Job management dashboard", "Priority email support", "365 days validity", "Save vs monthly"]'::jsonb,
    FALSE
  );
