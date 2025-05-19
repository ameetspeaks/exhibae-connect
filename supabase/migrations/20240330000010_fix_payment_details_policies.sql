-- Enable RLS on organizer_payment_details if not already enabled
ALTER TABLE IF EXISTS "public"."organizer_payment_details" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Organizers can manage their payment details" ON "public"."organizer_payment_details";
DROP POLICY IF EXISTS "Anyone can view active payment details" ON "public"."organizer_payment_details";

-- Create policies for organizer_payment_details
CREATE POLICY "Organizers can manage their payment details"
    ON "public"."organizer_payment_details"
    FOR ALL
    TO authenticated
    USING (organizer_id = auth.uid())
    WITH CHECK (organizer_id = auth.uid());

-- Allow anyone to view active payment details
CREATE POLICY "Anyone can view active payment details"
    ON "public"."organizer_payment_details"
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Fix payment_submissions policies
DROP POLICY IF EXISTS "Brands can view their payment submissions" ON "public"."payment_submissions";
DROP POLICY IF EXISTS "Brands can submit payments" ON "public"."payment_submissions";
DROP POLICY IF EXISTS "Organizers can manage payment submissions" ON "public"."payment_submissions";

-- Enable RLS on payment_submissions if not already enabled
ALTER TABLE IF EXISTS "public"."payment_submissions" ENABLE ROW LEVEL SECURITY;

-- Recreate payment_submissions policies
CREATE POLICY "Brands can view their payment submissions"
    ON "public"."payment_submissions"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stall_applications sa
            WHERE sa.id = application_id
            AND sa.brand_id = auth.uid()
        )
    );

CREATE POLICY "Brands can submit payments"
    ON "public"."payment_submissions"
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

CREATE POLICY "Organizers can manage payment submissions"
    ON "public"."payment_submissions"
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