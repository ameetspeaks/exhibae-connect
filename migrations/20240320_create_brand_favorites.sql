-- Create brand_favorites table
CREATE TABLE IF NOT EXISTS brand_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- Create brand_gallery table if not exists
CREATE TABLE IF NOT EXISTS brand_gallery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand_lookbooks table if not exists
CREATE TABLE IF NOT EXISTS brand_lookbooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_lookbooks ENABLE ROW LEVEL SECURITY;

-- Policies for brand_favorites
CREATE POLICY "Enable read access for all users" ON brand_favorites FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON brand_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for user's own favorites" ON brand_favorites FOR DELETE USING (auth.uid() = user_id);

-- Policies for brand_gallery
CREATE POLICY "Enable read access for all users" ON brand_gallery FOR SELECT USING (true);
CREATE POLICY "Enable insert for brand owners" ON brand_gallery 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles 
            WHERE id = brand_id 
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Enable delete for brand owners" ON brand_gallery 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM brand_profiles 
            WHERE id = brand_id 
            AND user_id = auth.uid()
        )
    );

-- Policies for brand_lookbooks
CREATE POLICY "Enable read access for all users" ON brand_lookbooks FOR SELECT USING (true);
CREATE POLICY "Enable insert for brand owners" ON brand_lookbooks 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM brand_profiles 
            WHERE id = brand_id 
            AND user_id = auth.uid()
        )
    );
CREATE POLICY "Enable delete for brand owners" ON brand_lookbooks 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM brand_profiles 
            WHERE id = brand_id 
            AND user_id = auth.uid()
        )
    ); 