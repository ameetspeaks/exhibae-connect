-- Drop existing tables if they exist
DROP TABLE IF EXISTS "public"."organiser_bank_details";
DROP TABLE IF EXISTS "public"."organiser_upi_details";

-- Create organiser_bank_details table
CREATE TABLE "public"."organiser_bank_details" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "organiser_id" uuid NOT NULL REFERENCES auth.users(id),
    "bank_name" text NOT NULL,
    "account_number" text NOT NULL,
    "ifsc_code" text NOT NULL,
    "account_holder_name" text NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    CONSTRAINT "organiser_bank_details_pkey" PRIMARY KEY ("id")
);

-- Create organiser_upi_details table
CREATE TABLE "public"."organiser_upi_details" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "organiser_id" uuid NOT NULL REFERENCES auth.users(id),
    "upi_id" text NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    CONSTRAINT "organiser_upi_details_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "idx_organiser_bank_details_organiser_id_is_active" ON "public"."organiser_bank_details" ("organiser_id", "is_active");
CREATE INDEX "idx_organiser_upi_details_organiser_id_is_active" ON "public"."organiser_upi_details" ("organiser_id", "is_active");

-- Enable RLS
ALTER TABLE "public"."organiser_bank_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organiser_upi_details" ENABLE ROW LEVEL SECURITY;

-- Create policies for organiser_bank_details
DROP POLICY IF EXISTS "Organisers can manage their bank details" ON "public"."organiser_bank_details";
DROP POLICY IF EXISTS "Anyone can view active bank details" ON "public"."organiser_bank_details";

CREATE POLICY "Organisers can manage their bank details"
    ON "public"."organiser_bank_details"
    FOR ALL
    TO authenticated
    USING (organiser_id = auth.uid())
    WITH CHECK (organiser_id = auth.uid());

CREATE POLICY "Anyone can view active bank details"
    ON "public"."organiser_bank_details"
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create policies for organiser_upi_details
DROP POLICY IF EXISTS "Organisers can manage their UPI details" ON "public"."organiser_upi_details";
DROP POLICY IF EXISTS "Anyone can view active UPI details" ON "public"."organiser_upi_details";

CREATE POLICY "Organisers can manage their UPI details"
    ON "public"."organiser_upi_details"
    FOR ALL
    TO authenticated
    USING (organiser_id = auth.uid())
    WITH CHECK (organiser_id = auth.uid());

CREATE POLICY "Anyone can view active UPI details"
    ON "public"."organiser_upi_details"
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_organiser_bank_details_updated_at ON "public"."organiser_bank_details";
CREATE TRIGGER update_organiser_bank_details_updated_at
    BEFORE UPDATE ON "public"."organiser_bank_details"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organiser_upi_details_updated_at ON "public"."organiser_upi_details";
CREATE TRIGGER update_organiser_upi_details_updated_at
    BEFORE UPDATE ON "public"."organiser_upi_details"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 