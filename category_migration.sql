CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

ALTER TABLE jobs ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Add new columns for city, whatsapp, job_type
ALTER TABLE jobs ADD COLUMN city VARCHAR(100);
ALTER TABLE jobs ADD COLUMN whatsapp VARCHAR(20);
ALTER TABLE jobs ADD COLUMN job_type VARCHAR(20);


ALTER TABLE jobs DROP COLUMN category;

INSERT INTO categories (name) VALUES
    ('Technology'),
    ('Education'),
    ('Healthcare'),
    ('Construction'),
    ('Hospitality'),
    ('Agriculture'),
    ('Engineering'),
    ('Transportation'),
    ('Security'),
    ('Domestic Work'),
    ('Sales & Marketing'),
    ('Finance & Accounting'),
    ('Administration'),
    ('Manufacturing'),
    ('Retail'),
    ('Customer Service'),
    ('Legal'),
    ('Media & Communication'),
    ('Science & Research'),
    ('Social Work'),
    ('Arts & Entertainment'),
    ('Sports & Fitness'),
    ('Tourism & Travel'),
    ('Logistics & Supply Chain'),
    ('Cleaning & Maintenance')
ON CONFLICT (name) DO NOTHING;


INSERT INTO jobs (
    company_id,
    company,
    title,
    job_description,
    category_id,
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
    (SELECT id FROM categories WHERE name = 'Technology'),
    'Kenya',
    '80,000 - 120,000 KES',
    NOW() + INTERVAL '30 days',
    'grealmkids@gmail.com',
    '+254700000000',
    'https://company.com/apply',
    false,
    NOW()
);