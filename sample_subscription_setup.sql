-- Sample SQL to set up subscription for grealmkids@gmail.com
-- Company ID: 0ea8ee8b-ebf0-48e7-8a50-12717e686b68

-- 1. Verify company exists and mark as verified
UPDATE companies 
SET is_verified = true,
    updated_at = NOW()
WHERE id = '0ea8ee8b-ebf0-48e7-8a50-12717e686b68'
  AND email = 'grealmkids@gmail.com';

-- 2. Insert monthly subscription
INSERT INTO subscriptions (
    company_id,
    plan_type,
    start_date,
    end_date,
    is_active,
    auto_renew,
    pesapal_txn_id
) VALUES (
    '0ea8ee8b-ebf0-48e7-8a50-12717e686b68',
    'monthly',
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    true,
    'TXN_MONTHLY_' || EXTRACT(EPOCH FROM NOW())::TEXT
);

-- 3. Insert a sample job posting
INSERT INTO jobs (
    company_id,
    company,
    title,
    job_description,
    category,
    country,
    salary,
    deadline,
    email,
    phone,
    application_link,
    is_foreign,
    created_at
) VALUES (
    '0ea8ee8b-ebf0-48e7-8a50-12717e686b68',
    'GrealM Kids',
    'Senior Software Developer',
    'We are looking for an experienced software developer to join our team. Must have 3+ years experience in React, Node.js, and PostgreSQL.',
    'Technology',
    'Kenya',
    '80,000 - 120,000 KES',
    NOW() + INTERVAL '30 days',
    'grealmkids@gmail.com',
    '+254700000000',
    'https://company.com/apply',
    false,
    NOW()
);

-- 4. Verify the insertion
SELECT 
    c.name,
    c.email,
    c.is_verified,
    s.plan_type,
    s.start_date,
    s.end_date,
    s.is_active
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id
WHERE c.id = '0ea8ee8b-ebf0-48e7-8a50-12717e686b68';
