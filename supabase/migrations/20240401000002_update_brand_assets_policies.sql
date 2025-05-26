-- Drop existing policies
DROP POLICY IF EXISTS "Users can view any brand's lookbooks" ON public.brand_lookbooks;
DROP POLICY IF EXISTS "Users can view any brand's gallery" ON public.brand_gallery;
DROP POLICY IF EXISTS "brands_can_view_own_applications" ON public.stall_applications;
DROP POLICY IF EXISTS "organizers_can_view_applications" ON public.stall_applications;

-- Create new policies allowing public access
CREATE POLICY "Brand lookbooks are viewable by everyone"
ON public.brand_lookbooks FOR SELECT
TO public
USING (true);

CREATE POLICY "Brand gallery is viewable by everyone"
ON public.brand_gallery FOR SELECT
TO public
USING (true);

-- Allow public access to approved stall applications
CREATE POLICY "Stall applications are viewable by everyone"
ON public.stall_applications FOR SELECT
TO public
USING (status = 'approved'); 