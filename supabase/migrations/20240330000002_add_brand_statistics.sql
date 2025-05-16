-- Create brand_statistics table to track overall statistics
CREATE TABLE IF NOT EXISTS "public"."brand_statistics" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "total_applications" integer DEFAULT 0,
    "approved_applications" integer DEFAULT 0,
    "rejected_applications" integer DEFAULT 0,
    "active_stalls" integer DEFAULT 0,
    "total_exhibitions_participated" integer DEFAULT 0,
    "total_revenue" decimal(10,2) DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("brand_id")
);

-- Create brand_activity_log to track important events
CREATE TABLE IF NOT EXISTS "public"."brand_activity_log" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "activity_type" text NOT NULL CHECK (activity_type IN ('application_submitted', 'application_approved', 'application_rejected', 'exhibition_started', 'exhibition_completed', 'payment_made')),
    "reference_id" uuid,
    "details" jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create function to update brand statistics
CREATE OR REPLACE FUNCTION update_brand_statistics()
RETURNS TRIGGER AS $$
DECLARE
    brand_id uuid;
    total_apps integer;
    approved_apps integer;
    rejected_apps integer;
    active_stalls integer;
    total_exhibitions integer;
    total_rev decimal(10,2);
BEGIN
    -- Get the brand_id based on the table being updated
    IF TG_TABLE_NAME = 'stall_applications' THEN
        brand_id := NEW.brand_id;
    ELSE
        RETURN NEW;
    END IF;

    -- Calculate statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'approved' OR status = 'confirmed'),
        COUNT(*) FILTER (WHERE status = 'rejected'),
        COUNT(*) FILTER (WHERE (status = 'approved' OR status = 'confirmed') 
            AND EXISTS (
                SELECT 1 FROM exhibitions e 
                WHERE e.id = stall_applications.exhibition_id 
                AND e.end_date >= NOW()
                AND NOT exhibition_expiry
            ))
    INTO 
        total_apps,
        approved_apps,
        rejected_apps,
        active_stalls
    FROM stall_applications
    WHERE brand_id = brand_id;

    -- Calculate total exhibitions participated
    SELECT COUNT(DISTINCT exhibition_id)
    INTO total_exhibitions
    FROM stall_applications
    WHERE brand_id = brand_id
    AND (status = 'approved' OR status = 'confirmed');

    -- Calculate total revenue (from payments)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_rev
    FROM payment_transactions pt
    JOIN stall_applications sa ON sa.id = pt.application_id
    WHERE sa.brand_id = brand_id
    AND pt.status = 'completed';

    -- Insert or update statistics
    INSERT INTO brand_statistics (
        brand_id,
        total_applications,
        approved_applications,
        rejected_applications,
        active_stalls,
        total_exhibitions_participated,
        total_revenue,
        last_updated
    ) VALUES (
        brand_id,
        total_apps,
        approved_apps,
        rejected_apps,
        active_stalls,
        total_exhibitions,
        total_rev,
        NOW()
    )
    ON CONFLICT (brand_id) DO UPDATE SET
        total_applications = EXCLUDED.total_applications,
        approved_applications = EXCLUDED.approved_applications,
        rejected_applications = EXCLUDED.rejected_applications,
        active_stalls = EXCLUDED.active_stalls,
        total_exhibitions_participated = EXCLUDED.total_exhibitions_participated,
        total_revenue = EXCLUDED.total_revenue,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update statistics
CREATE TRIGGER update_brand_stats_on_application
    AFTER INSERT OR UPDATE OF status
    ON "public"."stall_applications"
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_statistics();

-- Create function to log brand activity
CREATE OR REPLACE FUNCTION log_brand_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'stall_applications' THEN
        IF TG_OP = 'INSERT' THEN
            -- Log application submission
            INSERT INTO brand_activity_log (
                brand_id,
                activity_type,
                reference_id,
                details
            ) VALUES (
                NEW.brand_id,
                'application_submitted',
                NEW.id,
                jsonb_build_object(
                    'exhibition_id', NEW.exhibition_id,
                    'stall_id', NEW.stall_id,
                    'status', NEW.status
                )
            );
        ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            -- Log status changes
            INSERT INTO brand_activity_log (
                brand_id,
                activity_type,
                reference_id,
                details
            ) VALUES (
                NEW.brand_id,
                CASE 
                    WHEN NEW.status = 'approved' OR NEW.status = 'confirmed' THEN 'application_approved'
                    WHEN NEW.status = 'rejected' THEN 'application_rejected'
                    ELSE 'application_submitted'
                END,
                NEW.id,
                jsonb_build_object(
                    'exhibition_id', NEW.exhibition_id,
                    'stall_id', NEW.stall_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for activity logging
CREATE TRIGGER log_brand_activity_on_application
    AFTER INSERT OR UPDATE OF status
    ON "public"."stall_applications"
    FOR EACH ROW
    EXECUTE FUNCTION log_brand_activity();

-- Enable RLS
ALTER TABLE "public"."brand_statistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."brand_activity_log" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own brand statistics"
    ON "public"."brand_statistics"
    FOR SELECT
    USING (auth.uid() = brand_id);

CREATE POLICY "Users can view their own activity logs"
    ON "public"."brand_activity_log"
    FOR SELECT
    USING (auth.uid() = brand_id);

-- Grant permissions
GRANT ALL ON TABLE public.brand_statistics TO authenticated;
GRANT ALL ON TABLE public.brand_activity_log TO authenticated; 