-- First update any invalid status values in stalls table
UPDATE "public"."stalls"
SET status = 'available'
WHERE status NOT IN ('available', 'applied', 'confirmed', 'rejected', 'cancelled', 'expired');

-- Update stalls table status constraint
ALTER TABLE "public"."stalls"
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE "public"."stalls"
ADD CONSTRAINT valid_status 
CHECK (status IN ('available', 'applied', 'confirmed', 'rejected', 'cancelled', 'expired'));

-- First update any invalid status values in stall_instances table
UPDATE "public"."stall_instances"
SET status = 'available'
WHERE status NOT IN ('available', 'reserved', 'booked', 'expired');

-- Update stall_instances table status constraint
ALTER TABLE "public"."stall_instances"
DROP CONSTRAINT IF EXISTS stall_instances_status_check;

ALTER TABLE "public"."stall_instances"
ADD CONSTRAINT stall_instances_status_check 
CHECK (status IN ('available', 'reserved', 'booked', 'expired'));

-- Update expired status for existing records
UPDATE "public"."stall_instances" si
SET status = 'expired'
WHERE EXISTS (
    SELECT 1
    FROM exhibitions e
    WHERE e.id = si.exhibition_id
    AND NOW() > e.end_date
); 