-- Fix brand activity log permissions
BEGIN;

-- Drop existing objects
DROP POLICY IF EXISTS "Brands can view their own activity logs" ON public.brand_activity_log;
DROP POLICY IF EXISTS "Brands can view their own statistics" ON public.brand_statistics;
DROP POLICY IF EXISTS "Brands can view active exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Brands can view their stall applications" ON public.stall_applications;
DROP POLICY IF EXISTS "Brands can view accessible stalls" ON public.stalls;
DROP VIEW IF EXISTS public.brand_activities_secure;
DROP VIEW IF EXISTS public.brand_accessible_exhibitions;
DROP VIEW IF EXISTS public.brand_exhibition_access;

-- Create view for brand exhibition access
CREATE VIEW public.brand_exhibition_access AS
SELECT DISTINCT 
    e.id as exhibition_id
FROM exhibitions e
LEFT JOIN stall_applications sa ON sa.exhibition_id = e.id
WHERE 
    e.status = 'active' 
    OR (sa.brand_id = auth.uid() AND sa.brand_id IS NOT NULL);

-- Create secure view for brand activities
CREATE OR REPLACE VIEW public.brand_activities_secure AS
SELECT 
    bal.id,
    bal.activity_type,
    bal.stall_application_id,
    bal.details,
    bal.created_at,
    sa.id as application_id,
    e.id as exhibition_id,
    e.title as exhibition_title
FROM brand_activity_log bal
LEFT JOIN stall_applications sa ON sa.id = bal.stall_application_id
LEFT JOIN exhibitions e ON e.id = sa.exhibition_id
WHERE bal.brand_id = auth.uid();

-- Grant access to the secure views
GRANT SELECT ON public.brand_activities_secure TO authenticated;
GRANT SELECT ON public.brand_exhibition_access TO authenticated;

-- Create brand_activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.brand_activity_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL,
    activity_type text NOT NULL,
    stall_application_id uuid REFERENCES public.stall_applications(id),
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create brand_statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.brand_statistics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL UNIQUE,
    total_applications integer DEFAULT 0,
    approved_applications integer DEFAULT 0,
    rejected_applications integer DEFAULT 0,
    active_stalls integer DEFAULT 0,
    total_exhibitions_participated integer DEFAULT 0,
    last_updated timestamptz DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.brand_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_statistics ENABLE ROW LEVEL SECURITY;

-- Simple policies for direct table access
CREATE POLICY "Brands can view their own activity logs"
    ON public.brand_activity_log
    FOR SELECT
    TO authenticated
    USING (brand_id = auth.uid());

CREATE POLICY "Brands can view their own statistics"
    ON public.brand_statistics
    FOR SELECT
    TO authenticated
    USING (brand_id = auth.uid());

-- Simple exhibition policy using the view
CREATE POLICY "Brands can view exhibitions"
    ON public.exhibitions
    FOR SELECT
    TO authenticated
    USING (id IN (SELECT exhibition_id FROM public.brand_exhibition_access));

-- Simple stall applications policy
CREATE POLICY "Brands can view their stall applications"
    ON public.stall_applications
    FOR SELECT
    TO authenticated
    USING (brand_id = auth.uid());

-- Simple stalls policy using the view
CREATE POLICY "Brands can view stalls"
    ON public.stalls
    FOR SELECT
    TO authenticated
    USING (exhibition_id IN (SELECT exhibition_id FROM public.brand_exhibition_access));

-- Create function to update brand statistics
CREATE OR REPLACE FUNCTION public.update_brand_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.brand_statistics (brand_id)
    VALUES (NEW.brand_id)
    ON CONFLICT (brand_id) DO UPDATE
    SET
        total_applications = (
            SELECT count(*) FROM public.stall_applications
            WHERE brand_id = NEW.brand_id
        ),
        approved_applications = (
            SELECT count(*) FROM public.stall_applications
            WHERE brand_id = NEW.brand_id AND status = 'approved'
        ),
        rejected_applications = (
            SELECT count(*) FROM public.stall_applications
            WHERE brand_id = NEW.brand_id AND status = 'rejected'
        ),
        active_stalls = (
            SELECT count(*) FROM public.stall_applications sa
            JOIN public.exhibitions e ON e.id = sa.exhibition_id
            WHERE sa.brand_id = NEW.brand_id
            AND sa.status = 'approved'
            AND e.status = 'active'
        ),
        total_exhibitions_participated = (
            SELECT count(DISTINCT exhibition_id)
            FROM public.stall_applications
            WHERE brand_id = NEW.brand_id
            AND status = 'approved'
        ),
        last_updated = now();
    RETURN NEW;
END;
$$;

-- Create trigger for updating brand statistics
DROP TRIGGER IF EXISTS update_brand_stats_trigger ON public.stall_applications;
CREATE TRIGGER update_brand_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.stall_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_brand_statistics();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_brand_statistics TO authenticated;

COMMIT; 