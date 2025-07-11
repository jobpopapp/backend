CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE jobs ADD COLUMN category_id INTEGER REFERENCES categories(id);


ALTER TABLE jobs DROP COLUMN category;

INSERT INTO categories (name, description) VALUES
    ('Technology', 'Tech and IT related jobs'),
    ('Education', 'Teaching and academic jobs'),
    ('Healthcare', 'Medical and healthcare jobs'),
    ('Construction', 'Building and construction jobs'),
    ('Hospitality', 'Hotel, restaurant, and catering jobs'),
    ('Agriculture', 'Farming and agricultural jobs'),
    ('Engineering', 'Engineering and technical jobs'),
    ('Transportation', 'Driving and transport jobs'),
    ('Security', 'Security and protection jobs'),
    ('Domestic Work', 'Housekeeping, nanny, and domestic jobs'),
    ('Sales & Marketing', 'Sales, marketing, and business development'),
    ('Finance & Accounting', 'Finance, accounting, and banking'),
    ('Administration', 'Administrative and office jobs'),
    ('Manufacturing', 'Factory and manufacturing jobs'),
    ('Retail', 'Retail and shop jobs'),
    ('Customer Service', 'Customer support and call center jobs'),
    ('Legal', 'Legal and paralegal jobs'),
    ('Media & Communication', 'Media, journalism, and communication'),
    ('Science & Research', 'Scientific and research jobs'),
    ('Social Work', 'Social work and community service'),
    ('Arts & Entertainment', 'Arts, music, and entertainment'),
    ('Sports & Fitness', 'Sports, coaching, and fitness jobs'),
    ('Tourism & Travel', 'Tourism, travel, and tour guide jobs'),
    ('Logistics & Supply Chain', 'Logistics, warehousing, and supply chain'),
    ('Cleaning & Maintenance', 'Cleaning, janitorial, and maintenance jobs')
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