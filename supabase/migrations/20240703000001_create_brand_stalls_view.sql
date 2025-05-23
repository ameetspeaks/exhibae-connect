-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop the view if it exists
DROP VIEW IF EXISTS brand_stalls_view;

-- Create the view
CREATE VIEW brand_stalls_view AS
SELECT 
    sa.id as application_id,
    sa.brand_id,
    sa.exhibition_id,
    sa.stall_id,
    sa.stall_instance_id,
    sa.status as application_status,
    sa.created_at as application_date,
    sa.booking_deadline,
    sa.booking_confirmed,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM payment_submissions ps 
            WHERE ps.application_id = sa.id 
            AND ps.status = 'approved'
        ) THEN 'completed'
        WHEN EXISTS (
            SELECT 1 FROM payment_submissions ps 
            WHERE ps.application_id = sa.id 
            AND ps.status = 'pending_review'
        ) THEN 'pending_review'
        ELSE 'pending'
    END as payment_status,
    e.title as exhibition_title,
    e.start_date as exhibition_start_date,
    e.end_date as exhibition_end_date,
    e.address as exhibition_address,
    e.status as exhibition_status,
    s.name as stall_name,
    s.price as stall_price,
    s.length as stall_length,
    s.width as stall_width,
    COALESCE(
        (SELECT SUM(amount) 
         FROM payment_submissions ps 
         WHERE ps.application_id = sa.id AND ps.status = 'approved'),
        0
    ) as total_paid_amount,
    sa.exhibition_expiry
FROM stall_applications sa
JOIN exhibitions e ON e.id = sa.exhibition_id
JOIN stalls s ON s.id = sa.stall_id
WHERE sa.status IN ('approved', 'booked');

-- Grant access to authenticated users
GRANT SELECT ON brand_stalls_view TO authenticated;

-- Enable triggers again
SET session_replication_role = DEFAULT; 