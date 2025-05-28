-- Create hero_sliders table
CREATE TABLE IF NOT EXISTS public.hero_sliders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hero_sliders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hero sliders are viewable by everyone"
    ON public.hero_sliders
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only managers can manage hero sliders"
    ON public.hero_sliders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_hero_sliders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_hero_sliders_updated_at
    BEFORE UPDATE ON public.hero_sliders
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_sliders_updated_at();

-- Create index for ordering
CREATE INDEX idx_hero_sliders_order ON public.hero_sliders(order_index);

-- Insert some sample data
INSERT INTO public.hero_sliders (title, description, image_url, link_url, order_index) VALUES
('Fashion Week Exhibition', 'Discover the latest trends in fashion', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', '/exhibitions/fashion-week', 1),
('Home Decor Expo', 'Transform your living space', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329', '/exhibitions/home-decor', 2),
('Tech Gadgets Show', 'Experience the future of technology', 'https://images.unsplash.com/photo-1492571350019-22de08371fd3', '/exhibitions/tech-show', 3); 