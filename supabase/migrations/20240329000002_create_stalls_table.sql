-- Disable triggers temporarily
SET session_replication_role = replica;

-- Create stalls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stalls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    length NUMERIC NOT NULL,
    width NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.measuring_units(id),
    status TEXT DEFAULT 'available',
    position_x NUMERIC,
    position_y NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('available', 'applied', 'confirmed', 'rejected', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stalls_exhibition_id ON public.stalls(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_stalls_unit_id ON public.stalls(unit_id);
CREATE INDEX IF NOT EXISTS idx_stalls_status ON public.stalls(status);

-- Create stall_amenities junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stall_amenities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stall_id UUID NOT NULL REFERENCES public.stalls(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stall_id, amenity_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stall_amenities_stall_id ON public.stall_amenities(stall_id);
CREATE INDEX IF NOT EXISTS idx_stall_amenities_amenity_id ON public.stall_amenities(amenity_id);

-- Enable RLS on stalls table
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stall_amenities table
ALTER TABLE public.stall_amenities ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON TABLE public.stalls TO authenticated;
GRANT SELECT ON TABLE public.stalls TO anon;
GRANT ALL ON TABLE public.stall_amenities TO authenticated;
GRANT SELECT ON TABLE public.stall_amenities TO anon;

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stalls table
DROP TRIGGER IF EXISTS update_stalls_updated_at ON public.stalls;
CREATE TRIGGER update_stalls_updated_at
    BEFORE UPDATE ON public.stalls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable triggers again
SET session_replication_role = DEFAULT; 