-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create function to handle brand profile creation
CREATE OR REPLACE FUNCTION handle_brand_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create brand profile for users with 'brand' role
    IF NEW.role = 'brand'::user_role THEN
        -- Check if brand profile already exists
        IF NOT EXISTS (
            SELECT 1 FROM brand_profiles WHERE user_id = NEW.id
        ) THEN
            INSERT INTO brand_profiles (
                user_id,
                company_name,
                contact_email
            )
            VALUES (
                NEW.id,
                COALESCE(NEW.company_name, 'Untitled Brand'),
                NEW.email
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger to create brand profile after profile creation
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_brand_profile_creation();

-- Create any missing brand profiles for existing brand users
DO $$
BEGIN
    INSERT INTO brand_profiles (user_id, company_name, contact_email)
    SELECT 
        p.id,
        COALESCE(p.company_name, 'Untitled Brand'),
        p.email
    FROM profiles p
    WHERE p.role = 'brand'::user_role
    AND NOT EXISTS (
        SELECT 1 FROM brand_profiles bp WHERE bp.user_id = p.id
    );
END $$;

-- Enable triggers again
SET session_replication_role = DEFAULT; 