-- Remove description column from stalls
ALTER TABLE stalls DROP COLUMN IF EXISTS description;

-- Drop existing RLS policies for stall_amenities
DROP POLICY IF EXISTS "Organisers can manage stall amenities" ON stall_amenities;
DROP POLICY IF EXISTS "Public can view stall amenities" ON stall_amenities;

-- Enable RLS on stall_amenities if not already enabled
ALTER TABLE stall_amenities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stall_amenities
CREATE POLICY "Organisers can manage stall amenities"
ON stall_amenities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stalls s
    JOIN exhibitions e ON s.exhibition_id = e.id
    WHERE s.id = stall_amenities.stall_id
    AND e.organiser_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stalls s
    JOIN exhibitions e ON s.exhibition_id = e.id
    WHERE s.id = stall_amenities.stall_id
    AND e.organiser_id = auth.uid()
  )
);

CREATE POLICY "Public can view stall amenities"
ON stall_amenities
FOR SELECT
USING (true); 