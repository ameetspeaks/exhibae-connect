-- Add rejection_reason and rejection_date to payment_submissions table
ALTER TABLE "public"."payment_submissions"
ADD COLUMN IF NOT EXISTS "rejection_reason" text,
ADD COLUMN IF NOT EXISTS "rejection_date" timestamptz;

-- Add function to handle payment rejection
CREATE OR REPLACE FUNCTION handle_payment_rejection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'rejected' AND OLD.status = 'pending_review' THEN
        -- Set rejection date
        NEW.rejection_date := NOW();
        
        -- Update application status back to payment_pending
        UPDATE stall_applications
        SET status = 'payment_pending'
        WHERE id = NEW.application_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment rejection
DROP TRIGGER IF EXISTS payment_rejection_trigger ON payment_submissions;
CREATE TRIGGER payment_rejection_trigger
    BEFORE UPDATE OF status ON payment_submissions
    FOR EACH ROW
    WHEN (NEW.status = 'rejected' AND OLD.status = 'pending_review')
    EXECUTE FUNCTION handle_payment_rejection();

-- Update payment_submissions RLS policies
DROP POLICY IF EXISTS "Brands can view their payment submissions" ON payment_submissions;
DROP POLICY IF EXISTS "Organizers can manage payment submissions" ON payment_submissions;
DROP POLICY IF EXISTS "Brands can submit payments" ON payment_submissions;

-- Brands can view their payment submissions
CREATE POLICY "Brands can view their payment submissions"
    ON payment_submissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = application_id
            AND sa.brand_id = auth.uid()
        )
    );

-- Brands can submit payments
CREATE POLICY "Brands can submit payments"
    ON payment_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = application_id
            AND sa.brand_id = auth.uid()
            AND sa.status = 'payment_pending'
        )
    );

-- Organizers can manage payment submissions
CREATE POLICY "Organizers can manage payment submissions"
    ON payment_submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            JOIN exhibitions e ON e.id = sa.exhibition_id
            WHERE sa.id = application_id
            AND e.organiser_id = auth.uid()
        )
    ); 