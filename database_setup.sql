-- JobPop Company Backend Database Setup
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'per_job')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT FALSE,
    pesapal_txn_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update the existing jobs table to include company_id reference
-- (Skip if the jobs table already has company_id)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add missing columns to jobs table if they don't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_foreign BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_link TEXT;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON companies(is_verified);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for companies table
-- Companies can only access their own data
CREATE POLICY "Companies can view own data" ON companies
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Companies can update own data" ON companies
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow insert for registration
CREATE POLICY "Allow company registration" ON companies
    FOR INSERT WITH CHECK (true);

-- 9. Create RLS policies for subscriptions table
-- Companies can only access their own subscriptions
CREATE POLICY "Companies can view own subscriptions" ON subscriptions
    FOR SELECT USING (company_id::text = auth.uid()::text);

CREATE POLICY "Companies can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (company_id::text = auth.uid()::text);

CREATE POLICY "Companies can update own subscriptions" ON subscriptions
    FOR UPDATE USING (company_id::text = auth.uid()::text);

-- 10. Create RLS policies for jobs table (if not already exists)
-- Companies can only access their own jobs
DROP POLICY IF EXISTS "Companies can view own jobs" ON jobs;
CREATE POLICY "Companies can view own jobs" ON jobs
    FOR SELECT USING (company_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Companies can insert own jobs" ON jobs;
CREATE POLICY "Companies can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (company_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Companies can update own jobs" ON jobs;
CREATE POLICY "Companies can update own jobs" ON jobs
    FOR UPDATE USING (company_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Companies can delete own jobs" ON jobs;
CREATE POLICY "Companies can delete own jobs" ON jobs
    FOR DELETE USING (company_id::text = auth.uid()::text);

-- 11. Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Create storage policies
CREATE POLICY "Companies can upload their own certificates" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "Companies can view their own certificates" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-documents');

CREATE POLICY "Companies can update their own certificates" ON storage.objects
    FOR UPDATE USING (bucket_id = 'company-documents');

-- 13. Create admin view for company verification (optional)
CREATE OR REPLACE VIEW admin_company_verification AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.country,
    c.is_verified,
    c.certificate_url,
    c.created_at,
    (SELECT COUNT(*) FROM jobs WHERE company_id = c.id) as total_jobs,
    (SELECT COUNT(*) FROM subscriptions WHERE company_id = c.id AND is_active = true) as active_subscriptions
FROM companies c
ORDER BY c.created_at DESC;

-- Grant access to admin view (replace 'admin_role' with your actual admin role)
-- GRANT SELECT ON admin_company_verification TO admin_role;

COMMENT ON TABLE companies IS 'Stores hiring company information and verification status';
COMMENT ON TABLE subscriptions IS 'Stores company subscription plans and payment information';
COMMENT ON COLUMN companies.is_verified IS 'Whether the company has been verified by admin after certificate upload';
COMMENT ON COLUMN companies.certificate_url IS 'URL to the uploaded Certificate of Incorporation';
COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan: monthly, annual, or per_job';
COMMENT ON COLUMN subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscriptions.pesapal_txn_id IS 'Pesapal transaction ID for payment tracking';
