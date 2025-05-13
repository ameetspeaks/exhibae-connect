-- Create measurement_units table
CREATE TABLE IF NOT EXISTS "public"."measurement_units" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "symbol" text NOT NULL,
    "type" text NOT NULL CHECK (type IN ('length', 'area', 'volume', 'weight', 'temperature', 'other')),
    "description" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid,
    PRIMARY KEY ("id"),
    UNIQUE ("name"),
    UNIQUE ("symbol"),
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_measurement_units_type ON measurement_units(type);
CREATE INDEX IF NOT EXISTS idx_measurement_units_created_by ON measurement_units(created_by);

-- Enable RLS
ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "measurement_units_select_policy" 
ON measurement_units FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "measurement_units_insert_policy" 
ON measurement_units FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = auth.users.id 
        AND (
            raw_user_meta_data->>'role' = 'manager'
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'manager'
            )
        )
    )
);

CREATE POLICY "measurement_units_update_policy" 
ON measurement_units FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = auth.users.id 
        AND (
            raw_user_meta_data->>'role' = 'manager'
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'manager'
            )
        )
    )
);

CREATE POLICY "measurement_units_delete_policy" 
ON measurement_units FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = auth.users.id 
        AND (
            raw_user_meta_data->>'role' = 'manager'
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'manager'
            )
        )
    )
);

-- Insert some default measurement units
INSERT INTO measurement_units (name, symbol, type, description)
VALUES
    ('Meter', 'm', 'length', 'Standard unit of length'),
    ('Centimeter', 'cm', 'length', '1/100 of a meter'),
    ('Square Meter', 'm²', 'area', 'Standard unit of area'),
    ('Kilogram', 'kg', 'weight', 'Standard unit of mass'),
    ('Gram', 'g', 'weight', '1/1000 of a kilogram'),
    ('Liter', 'L', 'volume', 'Standard unit of volume'),
    ('Milliliter', 'mL', 'volume', '1/1000 of a liter'),
    ('Celsius', '°C', 'temperature', 'Standard unit of temperature')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON TABLE public.measurement_units TO authenticated;
GRANT SELECT ON TABLE public.measurement_units TO anon;

-- Grant access to auth.users for RLS policies
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated; 