-- Drop existing policies
DROP POLICY IF EXISTS "Organisers can manage their bank details" ON "public"."organiser_bank_details";
DROP POLICY IF EXISTS "Anyone can view active bank details" ON "public"."organiser_bank_details";
DROP POLICY IF EXISTS "Organisers can manage their UPI details" ON "public"."organiser_upi_details";
DROP POLICY IF EXISTS "Anyone can view active UPI details" ON "public"."organiser_upi_details";

-- Create more permissive policies for bank details
CREATE POLICY "Enable read access for bank details"
    ON "public"."organiser_bank_details"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for own bank details"
    ON "public"."organiser_bank_details"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Enable update for own bank details"
    ON "public"."organiser_bank_details"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = organiser_id)
    WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Enable delete for own bank details"
    ON "public"."organiser_bank_details"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = organiser_id);

-- Create more permissive policies for UPI details
CREATE POLICY "Enable read access for UPI details"
    ON "public"."organiser_upi_details"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for own UPI details"
    ON "public"."organiser_upi_details"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Enable update for own UPI details"
    ON "public"."organiser_upi_details"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = organiser_id)
    WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Enable delete for own UPI details"
    ON "public"."organiser_upi_details"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = organiser_id);

-- Ensure RLS is enabled
ALTER TABLE "public"."organiser_bank_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organiser_upi_details" ENABLE ROW LEVEL SECURITY; 