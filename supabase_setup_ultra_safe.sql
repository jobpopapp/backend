-- JobPop Company Backend Database Setup - ULTRA SAFE VERSION
-- This version avoids all DROP statements to prevent destructive operation warnings
-- Run these SQL commands in your Supabase SQL editor

-- 1. Create companies table for hiring companies
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

-- 2. Create subscriptions table for company payment plans
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

-- 3. Add company_id to existing jobs table (links jobs to companies)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'company_id') THEN
        ALTER TABLE jobs ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add additional fields to jobs table for company portal
DO $$ 
BEGIN
    -- Add is_foreign column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'is_foreign') THEN
        ALTER TABLE jobs ADD COLUMN is_foreign BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'email') THEN
        ALTER TABLE jobs ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'phone') THEN
        ALTER TABLE jobs ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Add whatsapp column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'whatsapp') THEN
        ALTER TABLE jobs ADD COLUMN whatsapp VARCHAR(20);
    END IF;
    
    -- Add application_link column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'application_link') THEN
        ALTER TABLE jobs ADD COLUMN application_link TEXT;
    END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON companies(is_verified);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);

-- 6. Create updated_at trigger function (using CREATE OR REPLACE to avoid conflicts)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create admin view for company verification (using CREATE OR REPLACE)
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
    c.updated_at,
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(sub_stats.active_subscriptions, 0) as active_subscriptions,
    CASE 
        WHEN c.certificate_url IS NULL THEN 'Awaiting Certificate'
        WHEN c.is_verified = false THEN 'Under Review'
        ELSE 'Verified'
    END as verification_status
FROM companies c
LEFT JOIN (
    SELECT company_id, COUNT(*) as total_jobs
    FROM jobs 
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) job_stats ON c.id = job_stats.company_id
LEFT JOIN (
    SELECT company_id, COUNT(*) as active_subscriptions
    FROM subscriptions 
    WHERE is_active = true AND end_date > NOW()
    GROUP BY company_id
) sub_stats ON c.id = sub_stats.company_id
ORDER BY c.created_at DESC;

-- 9. Add helpful comments
COMMENT ON TABLE companies IS 'Stores hiring company information and verification status';
COMMENT ON TABLE subscriptions IS 'Stores company subscription plans and payment information';
COMMENT ON COLUMN companies.is_verified IS 'Whether the company has been verified by admin after certificate upload';
COMMENT ON COLUMN companies.certificate_url IS 'URL to the uploaded Certificate of Incorporation in Supabase Storage';
COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan: monthly, annual, or per_job';
COMMENT ON COLUMN subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscriptions.pesapal_txn_id IS 'Pesapal transaction ID for payment tracking';
COMMENT ON VIEW admin_company_verification IS 'Admin view to see all companies with verification status and statistics';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'JobPop Company Backend database setup completed successfully!';
    RAISE NOTICE 'Created tables: companies, subscriptions';
    RAISE NOTICE 'Updated jobs table with company portal fields';
    RAISE NOTICE 'Created storage bucket: company-documents';
    RAISE NOTICE 'Created admin view: admin_company_verification';
    RAISE NOTICE '';
    RAISE NOTICE 'MANUAL STEPS REQUIRED:';
    RAISE NOTICE '1. Create triggers manually using the Supabase dashboard';
    RAISE NOTICE '2. Create storage policies manually using the Supabase dashboard';
    RAISE NOTICE 'See the README.md for detailed instructions';
END $$;
