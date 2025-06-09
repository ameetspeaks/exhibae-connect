-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_brand_profile_creation();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _role TEXT;
    _full_name TEXT;
    _company_name TEXT;
BEGIN
    -- Get role with fallback
    _role := COALESCE(
        LOWER(NEW.raw_user_meta_data->>'role'),
        'shopper'
    );

    -- Validate role
    IF _role NOT IN ('admin', 'organiser', 'brand', 'shopper') THEN
        _role := 'shopper';
    END IF;

    -- Get full_name with fallback
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Get company_name
    _company_name := NEW.raw_user_meta_data->>'company_name';

    -- Insert profile with explicit error handling
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            company_name,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.email,
            _full_name,
            _role,
            _company_name,
            NOW(),
            NOW()
        );

        -- If this is a brand user, create the brand profile
        IF _role = 'brand' THEN
            INSERT INTO public.brand_profiles (
                user_id,
                company_name,
                contact_email
            )
            VALUES (
                NEW.id,
                COALESCE(_company_name, 'Untitled Brand'),
                NEW.email
            );
        END IF;

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NULL;
    END;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO anon;

-- Create missing brand profiles for any existing brand users
INSERT INTO public.brand_profiles (user_id, company_name, contact_email)
SELECT 
    p.id,
    COALESCE(p.company_name, 'Untitled Brand'),
    p.email
FROM profiles p
WHERE p.role = 'brand'
AND NOT EXISTS (
    SELECT 1 FROM brand_profiles bp WHERE bp.user_id = p.id
); 