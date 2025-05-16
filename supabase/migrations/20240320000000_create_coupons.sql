-- Create enum for coupon types
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');

-- Create enum for coupon scope
CREATE TYPE coupon_scope AS ENUM ('all_exhibitions', 'specific_exhibition', 'all_brands', 'specific_brand');

-- Create coupons table
CREATE TABLE coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    type coupon_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    scope coupon_scope NOT NULL,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    min_booking_amount DECIMAL(10, 2),
    max_discount_amount DECIMAL(10, 2),
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_scope_references CHECK (
        (scope = 'specific_exhibition' AND exhibition_id IS NOT NULL) OR
        (scope = 'specific_brand' AND brand_id IS NOT NULL) OR
        (scope IN ('all_exhibitions', 'all_brands') AND exhibition_id IS NULL AND brand_id IS NULL)
    ),
    CONSTRAINT valid_value CHECK (
        (type = 'percentage' AND value BETWEEN 0 AND 100) OR
        (type = 'fixed' AND value >= 0)
    ),
    CONSTRAINT unique_code_per_organiser UNIQUE (organiser_id, code)
);

-- Create RLS policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy for organizers to manage their own coupons
CREATE POLICY "Organizers can manage their own coupons"
    ON coupons
    FOR ALL
    TO authenticated
    USING (auth.uid() = organiser_id);

-- Policy for brands to view coupons applicable to them
CREATE POLICY "Brands can view applicable coupons"
    ON coupons
    FOR SELECT
    TO authenticated
    USING (
        (scope = 'all_brands') OR
        (scope = 'specific_brand' AND brand_id = auth.uid()) OR
        (scope = 'all_exhibitions') OR
        (scope = 'specific_exhibition' AND exhibition_id IN (
            SELECT exhibition_id 
            FROM stall_applications 
            WHERE brand_id = auth.uid()
        ))
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_organiser ON coupons(organiser_id);
CREATE INDEX idx_coupons_exhibition ON coupons(exhibition_id) WHERE exhibition_id IS NOT NULL;
CREATE INDEX idx_coupons_brand ON coupons(brand_id) WHERE brand_id IS NOT NULL; 