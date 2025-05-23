-- Drop existing table if it exists
DROP TABLE IF EXISTS public.exhibition_interests;

-- Create exhibition_interests table
CREATE TABLE IF NOT EXISTS public.exhibition_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    UNIQUE(exhibition_id, brand_id)
);

-- Add RLS policies
ALTER TABLE public.exhibition_interests ENABLE ROW LEVEL SECURITY;

-- Policy for brands to view their own interests
CREATE POLICY "Users can view own interests"
    ON public.exhibition_interests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = brand_id);

-- Policy for brands to create interests
CREATE POLICY "Users can create own interests"
    ON public.exhibition_interests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = brand_id);

-- Policy for organizers to view interests for their exhibitions
CREATE POLICY "Organizers can view exhibition interests"
    ON public.exhibition_interests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exhibitions e
            WHERE e.id = exhibition_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Add indexes for better performance
CREATE INDEX idx_exhibition_interests_exhibition_id ON public.exhibition_interests(exhibition_id);
CREATE INDEX idx_exhibition_interests_brand_id ON public.exhibition_interests(brand_id);

-- Grant permissions
GRANT ALL ON public.exhibition_interests TO authenticated; 