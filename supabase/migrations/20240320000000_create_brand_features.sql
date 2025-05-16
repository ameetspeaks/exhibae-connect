-- Create exhibitions table
CREATE TABLE IF NOT EXISTS exhibitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT NOT NULL,
    application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed'))
);

-- Create stall_types table
CREATE TABLE IF NOT EXISTS stall_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stall_type_id UUID REFERENCES stall_types(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    company_description TEXT NOT NULL,
    special_requirements TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand_profiles table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    application_updates BOOLEAN DEFAULT true,
    new_exhibitions BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Exhibitions policies
CREATE POLICY "Exhibitions are viewable by everyone" 
    ON exhibitions FOR SELECT 
    USING (status = 'published');

CREATE POLICY "Organizers can manage their own exhibitions" 
    ON exhibitions FOR ALL 
    USING (organizer_id = auth.uid());

-- Stall types policies
CREATE POLICY "Stall types are viewable by everyone" 
    ON stall_types FOR SELECT 
    USING (true);

CREATE POLICY "Organizers can manage stall types" 
    ON stall_types FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM exhibitions 
        WHERE exhibitions.id = stall_types.exhibition_id 
        AND exhibitions.organizer_id = auth.uid()
    ));

-- Applications policies
CREATE POLICY "Brands can view their own applications" 
    ON applications FOR SELECT 
    USING (brand_id = auth.uid());

CREATE POLICY "Brands can create applications" 
    ON applications FOR INSERT 
    WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Brands can update their pending applications" 
    ON applications FOR UPDATE 
    USING (brand_id = auth.uid() AND status = 'pending');

-- Brand profiles policies
CREATE POLICY "Brands can manage their own profile" 
    ON brand_profiles FOR ALL 
    USING (user_id = auth.uid());

CREATE POLICY "Brand profiles are viewable by everyone" 
    ON brand_profiles FOR SELECT 
    USING (true);

-- Notification settings policies
CREATE POLICY "Users can manage their own notification settings" 
    ON notification_settings FOR ALL 
    USING (user_id = auth.uid());

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_exhibitions_updated_at
    BEFORE UPDATE ON exhibitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exhibitions_status ON exhibitions(status);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_brand_id ON applications(brand_id);
CREATE INDEX idx_applications_exhibition_id ON applications(exhibition_id); 