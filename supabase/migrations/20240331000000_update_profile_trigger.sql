-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop only the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation with better metadata handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _full_name TEXT;
    _role user_role;
    _company_name TEXT;
BEGIN
    -- Extract metadata values with proper error handling
    BEGIN
        _full_name := NEW.raw_user_meta_data->>'full_name';
        _role := (NEW.raw_user_meta_data->>'role')::user_role;
        _company_name := NEW.raw_user_meta_data->>'company_name';
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error parsing user metadata: %', SQLERRM;
        -- Set default values if metadata parsing fails
        _full_name := NEW.email;
        _role := 'shopper';
        _company_name := NULL;
    END;

    -- Insert the profile if it doesn't exist, or update if it does
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
        COALESCE(_role, 'shopper'),
        _company_name,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = NEW.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role),
        company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
        updated_at = NOW()
    WHERE profiles.id = NEW.id;

    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable triggers again
SET session_replication_role = DEFAULT; 