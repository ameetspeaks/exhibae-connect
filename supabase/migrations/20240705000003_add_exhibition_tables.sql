-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON exhibition_categories;
DROP POLICY IF EXISTS "Only managers can modify categories" ON exhibition_categories;
DROP POLICY IF EXISTS "Users can view their own attending records" ON exhibition_attending;
DROP POLICY IF EXISTS "Users can add their own attending records" ON exhibition_attending;
DROP POLICY IF EXISTS "Users can remove their own attending records" ON exhibition_attending;
DROP POLICY IF EXISTS "Users can view their own favorites" ON exhibition_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON exhibition_favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON exhibition_favorites;

-- Create exhibition_categories table
CREATE TABLE IF NOT EXISTS exhibition_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exhibition_attending table
CREATE TABLE IF NOT EXISTS exhibition_attending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_exhibition_attending UNIQUE (user_id, exhibition_id)
);

-- Create exhibition_favorites table
CREATE TABLE IF NOT EXISTS exhibition_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_exhibition_favorite UNIQUE (user_id, exhibition_id)
);

-- Enable RLS
ALTER TABLE exhibition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_attending ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_favorites ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON exhibition_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can modify categories"
  ON exhibition_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Attending policies
CREATE POLICY "Users can view their own attending records"
  ON exhibition_attending
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own attending records"
  ON exhibition_attending
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own attending records"
  ON exhibition_attending
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON exhibition_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON exhibition_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON exhibition_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exhibition_attending_user_id ON exhibition_attending(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_attending_exhibition_id ON exhibition_attending(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_favorites_user_id ON exhibition_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_favorites_exhibition_id ON exhibition_favorites(exhibition_id);

-- Add some default categories
INSERT INTO exhibition_categories (name, description) VALUES
  ('Art & Design', 'Art exhibitions, design showcases, and creative displays'),
  ('Fashion', 'Fashion shows, clothing exhibitions, and style events'),
  ('Technology', 'Tech exhibitions, gadget shows, and innovation displays'),
  ('Food & Beverage', 'Food festivals, culinary exhibitions, and beverage shows'),
  ('Home & Living', 'Home decor, furniture, and lifestyle exhibitions'),
  ('Beauty & Wellness', 'Beauty products, cosmetics, and wellness exhibitions'),
  ('Sports & Fitness', 'Sports equipment, fitness gear, and athletic exhibitions'),
  ('Books & Media', 'Book fairs, media exhibitions, and publishing events'),
  ('Automotive', 'Car shows, automotive exhibitions, and vehicle displays'),
  ('Others', 'Other types of exhibitions and events')
ON CONFLICT DO NOTHING; 