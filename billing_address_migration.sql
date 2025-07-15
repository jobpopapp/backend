
CREATE TABLE billing_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    country_code VARCHAR(2),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    line_1 VARCHAR(255),
    line_2 VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    postal_code VARCHAR(255),
    zip_code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE billing_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can view their own billing address"
ON billing_addresses FOR SELECT
TO authenticated
USING (company_id = auth.uid());

CREATE POLICY "Company can insert their own billing address"
ON billing_addresses FOR INSERT
TO authenticated
WITH CHECK (company_id = auth.uid());

CREATE POLICY "Company can update their own billing address"
ON billing_addresses FOR UPDATE
TO authenticated
USING (company_id = auth.uid());
