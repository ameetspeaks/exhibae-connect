-- Create organiser_bank_details table
CREATE TABLE organiser_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    branch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organiser_id)
);

-- Create organiser_upi_details table
CREATE TABLE organiser_upi_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    upi_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organiser_id)
);

-- Add RLS policies
ALTER TABLE organiser_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE organiser_upi_details ENABLE ROW LEVEL SECURITY;

-- Policy for organiser_bank_details
CREATE POLICY "Organisers can view and edit their own bank details"
    ON organiser_bank_details
    FOR ALL
    USING (auth.uid() = organiser_id)
    WITH CHECK (auth.uid() = organiser_id);

-- Policy for organiser_upi_details
CREATE POLICY "Organisers can view and edit their own UPI details"
    ON organiser_upi_details
    FOR ALL
    USING (auth.uid() = organiser_id)
    WITH CHECK (auth.uid() = organiser_id);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_bank_details
    BEFORE UPDATE ON organiser_bank_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_upi_details
    BEFORE UPDATE ON organiser_upi_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 