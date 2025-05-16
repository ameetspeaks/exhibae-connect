-- Create brand_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS brand_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    logo_url TEXT,
    social_media JSONB DEFAULT '{}',
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on brand_profiles
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_profiles
CREATE POLICY "Brands can manage their own profile"
    ON brand_profiles FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Brand profiles are viewable by everyone"
    ON brand_profiles FOR SELECT
    USING (true);

-- Create storage bucket for brand materials if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'brand-materials'
    ) THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('brand-materials', 'brand-materials', false);
    END IF;
END $$;

-- Enable RLS on the bucket and create policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Brands can manage their own materials'
    ) THEN
        CREATE POLICY "Brands can manage their own materials"
        ON storage.objects
        FOR ALL USING (
            bucket_id = 'brand-materials' AND 
            (auth.uid() = owner OR auth.uid() IN (
                SELECT user_id FROM brand_profiles WHERE id = SPLIT_PART(name, '/', 1)::uuid
            ))
        );
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_profiles_updated_at();

-- Create index for better performance
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id); 