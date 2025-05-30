-- Disable the existing trigger temporarily
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
BEGIN
    -- Extract role with proper error handling
    BEGIN
        _role := COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'shopper'::user_role
        );
    EXCEPTION WHEN OTHERS THEN
        _role := 'shopper'::user_role;
    END;

    -- Insert the profile with proper handling of metadata
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        _role,
        NEW.raw_user_meta_data->>'company_name',
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

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for the new function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon; 