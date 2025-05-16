-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS user_role;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'organiser', 'brand', 'shopper');

-- Create profiles table
CREATE TABLE profiles (
    id UUID NOT NULL PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'shopper',
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_role_idx ON profiles(role);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create function to handle new user creation
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

    -- Insert or update the profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        company_name
    )
    VALUES (
        NEW.id,
        NEW.email,
        _full_name,
        _role,
        _company_name
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = NEW.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        company_name = EXCLUDED.company_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant specific permissions on profiles table
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO anon;

-- Grant usage on the user_role type
GRANT USAGE ON TYPE public.user_role TO postgres, anon, authenticated, service_role;

-- Enable triggers again
SET session_replication_role = DEFAULT; 