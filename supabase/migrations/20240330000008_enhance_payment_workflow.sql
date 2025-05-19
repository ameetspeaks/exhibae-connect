-- Create payment_methods table
CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "code" text NOT NULL UNIQUE,
    "description" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now()
);

-- Insert or update default payment methods
INSERT INTO "public"."payment_methods" (name, code, description)
VALUES
('Bank Transfer', 'bank_transfer', 'Direct bank transfer to organizer account'),
('NEFT', 'neft', 'National Electronic Funds Transfer'),
('UPI', 'upi', 'Unified Payments Interface'),
('Manual Payment', 'manual', 'Manual payment to organizer')
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- Create organizer_payment_details table
CREATE TABLE IF NOT EXISTS "public"."organizer_payment_details" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizer_id" uuid REFERENCES "public"."profiles"("id"),
    "payment_method_id" uuid REFERENCES "public"."payment_methods"("id"),
    "bank_name" text,
    "account_number" text,
    "ifsc_code" text,
    "account_holder_name" text,
    "upi_id" text,
    "additional_instructions" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Create payment_submissions table
CREATE TABLE IF NOT EXISTS "public"."payment_submissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" uuid REFERENCES "public"."stall_applications"("id"),
    "payment_method_id" uuid REFERENCES "public"."payment_methods"("id"),
    "transaction_id" text NOT NULL,
    "amount" decimal(10,2) NOT NULL,
    "email" text NOT NULL,
    "proof_file_url" text,
    "status" text NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected')),
    "notes" text,
    "submitted_at" timestamptz DEFAULT now(),
    "reviewed_at" timestamptz,
    "reviewed_by" uuid REFERENCES "public"."profiles"("id")
);

-- Update stall_applications table to include payment review status
ALTER TABLE "public"."stall_applications"
DROP CONSTRAINT IF EXISTS stall_applications_status_check,
ADD CONSTRAINT stall_applications_status_check 
CHECK (status IN ('pending', 'payment_pending', 'payment_review', 'booked', 'rejected'));

-- Create function to handle payment submission
CREATE OR REPLACE FUNCTION handle_payment_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Update application status to payment_review when payment is submitted
    UPDATE stall_applications
    SET status = 'payment_review'
    WHERE id = NEW.application_id
    AND status = 'payment_pending';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment submission
DROP TRIGGER IF EXISTS payment_submission_trigger ON payment_submissions;
CREATE TRIGGER payment_submission_trigger
    AFTER INSERT ON payment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_submission();

-- Create function to handle payment review
CREATE OR REPLACE FUNCTION handle_payment_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending_review' THEN
        -- Update application status to booked when payment is approved
        UPDATE stall_applications
        SET 
            status = 'booked',
            payment_status = 'completed',
            payment_date = NOW(),
            booking_confirmed = true
        WHERE id = NEW.application_id;

        -- Update stall instance status to booked
        UPDATE stall_instances
        SET status = 'booked'
        WHERE id = (
            SELECT stall_instance_id 
            FROM stall_applications 
            WHERE id = NEW.application_id
        )
        AND status = 'reserved';
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_review' THEN
        -- Update application status back to payment_pending when payment is rejected
        UPDATE stall_applications
        SET status = 'payment_pending'
        WHERE id = NEW.application_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment review
DROP TRIGGER IF EXISTS payment_review_trigger ON payment_submissions;
CREATE TRIGGER payment_review_trigger
    AFTER UPDATE OF status ON payment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_review();

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_payment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Payment methods visible to all" ON payment_methods;
DROP POLICY IF EXISTS "Organizers can manage their payment details" ON organizer_payment_details;
DROP POLICY IF EXISTS "Brands can view organizer payment details" ON organizer_payment_details;
DROP POLICY IF EXISTS "Brands can submit payments" ON payment_submissions;
DROP POLICY IF EXISTS "Brands can view their payments" ON payment_submissions;
DROP POLICY IF EXISTS "Organizers can manage payment submissions" ON payment_submissions;

-- Payment methods visible to all authenticated users
CREATE POLICY "Payment methods visible to all"
    ON payment_methods FOR SELECT
    TO authenticated
    USING (true);

-- Organizers can manage their payment details
CREATE POLICY "Organizers can manage their payment details"
    ON organizer_payment_details FOR ALL
    TO authenticated
    USING (organizer_id = auth.uid());

-- Brands can view organizer payment details
CREATE POLICY "Brands can view organizer payment details"
    ON organizer_payment_details FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            JOIN exhibitions e ON e.id = sa.exhibition_id
            WHERE e.organiser_id = organizer_payment_details.organizer_id
            AND sa.brand_id = auth.uid()
            AND sa.status = 'payment_pending'
        )
    );

-- Brands can submit payments
CREATE POLICY "Brands can submit payments"
    ON payment_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = application_id
            AND sa.brand_id = auth.uid()
            AND sa.status = 'payment_pending'
        )
    );

-- Brands can view their payment submissions
CREATE POLICY "Brands can view their payments"
    ON payment_submissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = application_id
            AND sa.brand_id = auth.uid()
        )
    );

-- Organizers can view and manage payment submissions
CREATE POLICY "Organizers can manage payment submissions"
    ON payment_submissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            JOIN exhibitions e ON e.id = sa.exhibition_id
            WHERE sa.id = application_id
            AND e.organiser_id = auth.uid()
        )
    );

-- Function to get application status display
CREATE OR REPLACE FUNCTION get_application_status_display(
    application_status text,
    is_organizer boolean
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT
        CASE
            WHEN application_status = 'payment_pending' AND is_organizer THEN 'Approved'
            WHEN application_status = 'payment_review' AND is_organizer THEN 'Payment Review'
            ELSE application_status
        END;
$$; 