-- Create exhibition_categories table
CREATE TABLE IF NOT EXISTS "public"."exhibition_categories" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("name")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exhibition_categories_name ON exhibition_categories(name);

-- Enable RLS
ALTER TABLE exhibition_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "exhibition_categories_select_policy" 
ON exhibition_categories FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "exhibition_categories_insert_policy" 
ON exhibition_categories FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "exhibition_categories_update_policy" 
ON exhibition_categories FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "exhibition_categories_delete_policy" 
ON exhibition_categories FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'manager'
    )
);

-- Insert some default categories
INSERT INTO exhibition_categories (name, description)
VALUES
    ('Fashion', 'Fashion and apparel related exhibitions'),
    ('Technology', 'Technology and innovation exhibitions'),
    ('Art', 'Art exhibitions and galleries'),
    ('Food & Beverage', 'Food and beverage industry exhibitions'),
    ('Automotive', 'Automotive industry exhibitions'),
    ('Healthcare', 'Healthcare and medical exhibitions'),
    ('Education', 'Educational exhibitions and fairs'),
    ('Real Estate', 'Real estate and property exhibitions')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON TABLE public.exhibition_categories TO authenticated;
GRANT SELECT ON TABLE public.exhibition_categories TO anon; 