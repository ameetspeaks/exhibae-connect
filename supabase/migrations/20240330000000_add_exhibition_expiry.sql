-- Add exhibition_expiry column to stall_applications table
ALTER TABLE "public"."stall_applications"
ADD COLUMN IF NOT EXISTS "exhibition_expiry" boolean DEFAULT false;

-- Create or replace function to check and update exhibition_expiry
CREATE OR REPLACE FUNCTION check_exhibition_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the current date is greater than exhibition end date
    IF EXISTS (
        SELECT 1 
        FROM exhibitions e 
        WHERE e.id = NEW.exhibition_id 
        AND NOW() > e.end_date
    ) THEN
        NEW.exhibition_expiry := true;
    ELSE
        NEW.exhibition_expiry := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update exhibition_expiry
DROP TRIGGER IF EXISTS check_exhibition_expiry_trigger ON "public"."stall_applications";
CREATE TRIGGER check_exhibition_expiry_trigger
    BEFORE INSERT OR UPDATE
    ON "public"."stall_applications"
    FOR EACH ROW
    EXECUTE FUNCTION check_exhibition_expiry();

-- Create function to update all applications expiry status
CREATE OR REPLACE FUNCTION update_all_applications_expiry()
RETURNS void AS $$
BEGIN
    -- Update all stall applications
    UPDATE "public"."stall_applications" sa
    SET exhibition_expiry = (
        SELECT NOW() > e.end_date
        FROM exhibitions e
        WHERE e.id = sa.exhibition_id
    );

    -- Update stalls status for expired exhibitions
    UPDATE "public"."stalls" s
    SET status = 'expired'
    WHERE EXISTS (
        SELECT 1
        FROM exhibitions e
        WHERE e.id = s.exhibition_id
        AND NOW() > e.end_date
    )
    AND status != 'expired';

    -- Update stall instances status for expired exhibitions
    UPDATE "public"."stall_instances" si
    SET status = 'expired'
    WHERE EXISTS (
        SELECT 1
        FROM exhibitions e
        WHERE e.id = si.exhibition_id
        AND NOW() > e.end_date
    )
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial update of existing records
SELECT update_all_applications_expiry();

-- Create a scheduled job to run daily and update expiry status
SELECT cron.schedule(
    'update-exhibition-expiry',  -- job name
    '0 0 * * *',               -- run at midnight every day
    $$
    SELECT update_all_applications_expiry();
    $$
); 