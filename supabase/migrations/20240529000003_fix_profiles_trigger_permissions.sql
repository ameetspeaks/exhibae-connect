-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _role user_role;
    _full_name TEXT;
    _company_name TEXT;
BEGIN
    -- Extract metadata with better error handling
    BEGIN
        -- Get role with proper type casting and validation
        _role := CASE 
            WHEN NEW.raw_user_meta_data->>'role' IS NULL THEN 'shopper'::user_role
            ELSE (NEW.raw_user_meta_data->>'role')::user_role
        END;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Invalid role in metadata, defaulting to shopper: %', SQLERRM;
        _role := 'shopper'::user_role;
    END;

    -- Get full_name with fallback
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Get company_name (only if role is brand)
    _company_name := CASE 
        WHEN _role = 'brand' THEN NEW.raw_user_meta_data->>'company_name'
        ELSE NULL
    END;

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
        )
        ON CONFLICT (id) DO UPDATE
        SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
            role = COALESCE(EXCLUDED.role, profiles.role),
            company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NULL;
    END;

    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "System can create user profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Ensure proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Grant table permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO anon;

-- Grant type permissions
GRANT USAGE ON TYPE public.user_role TO anon, authenticated, service_role; 