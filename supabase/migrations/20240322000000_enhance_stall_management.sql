-- Add new columns to stall_instances table
ALTER TABLE "public"."stall_instances"
ADD COLUMN IF NOT EXISTS "amenities" jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "notes" text,
ADD COLUMN IF NOT EXISTS "last_maintenance_date" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "next_maintenance_date" timestamp with time zone;

-- Add new columns to stall_applications table
ALTER TABLE "public"."stall_applications"
ADD COLUMN IF NOT EXISTS "preferred_location" text,
ADD COLUMN IF NOT EXISTS "requirements" jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
ADD COLUMN IF NOT EXISTS "payment_amount" decimal(10,2),
ADD COLUMN IF NOT EXISTS "payment_date" timestamp with time zone;

-- Create maintenance_logs table
CREATE TABLE IF NOT EXISTS "public"."maintenance_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "stall_instance_id" uuid NOT NULL REFERENCES "public"."stall_instances" ("id") ON DELETE CASCADE,
    "maintenance_type" text NOT NULL,
    "description" text,
    "performed_by" uuid REFERENCES "public"."profiles" ("id"),
    "performed_at" timestamp with time zone NOT NULL DEFAULT now(),
    "next_maintenance_date" timestamp with time zone,
    "status" text NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    PRIMARY KEY ("id")
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "application_id" uuid NOT NULL REFERENCES "public"."stall_applications" ("id") ON DELETE CASCADE,
    "amount" decimal(10,2) NOT NULL,
    "payment_method" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    "transaction_date" timestamp with time zone NOT NULL DEFAULT now(),
    "reference_number" text,
    PRIMARY KEY ("id")
);

-- Enable RLS on new tables
ALTER TABLE "public"."maintenance_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_logs
CREATE POLICY "organizers_can_manage_maintenance_logs"
    ON "public"."maintenance_logs"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."stall_instances" si
            JOIN "public"."exhibitions" e ON si.exhibition_id = e.id
            WHERE si.id = maintenance_logs.stall_instance_id
            AND e.organiser_id = auth.uid()
        )
    );

CREATE POLICY "staff_can_view_maintenance_logs"
    ON "public"."maintenance_logs"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."stall_instances" si
            JOIN "public"."exhibitions" e ON si.exhibition_id = e.id
            WHERE si.id = maintenance_logs.stall_instance_id
        )
    );

-- Create policies for payment_transactions
CREATE POLICY "organizers_can_manage_payment_transactions"
    ON "public"."payment_transactions"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "public"."stall_applications" sa
            JOIN "public"."exhibitions" e ON sa.exhibition_id = e.id
            WHERE sa.id = payment_transactions.application_id
            AND e.organiser_id = auth.uid()
        )
    );

CREATE POLICY "brands_can_view_own_payment_transactions"
    ON "public"."payment_transactions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."stall_applications" sa
            WHERE sa.id = payment_transactions.application_id
            AND sa.brand_id = auth.uid()
        )
    );

-- Create function to update application payment status
CREATE OR REPLACE FUNCTION update_application_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total paid amount for the application
    WITH total_paid AS (
        SELECT SUM(amount) as total
        FROM payment_transactions
        WHERE application_id = NEW.application_id
        AND status = 'completed'
    )
    UPDATE stall_applications
    SET 
        payment_amount = COALESCE((SELECT total FROM total_paid), 0),
        payment_status = 
            CASE 
                WHEN COALESCE((SELECT total FROM total_paid), 0) = 0 THEN 'pending'
                WHEN COALESCE((SELECT total FROM total_paid), 0) < (
                    SELECT price FROM stall_instances WHERE id = stall_applications.stall_instance_id
                ) THEN 'partial'
                ELSE 'completed'
            END,
        payment_date = CASE 
            WHEN COALESCE((SELECT total FROM total_paid), 0) >= (
                SELECT price FROM stall_instances WHERE id = stall_applications.stall_instance_id
            ) THEN NOW()
            ELSE NULL
        END
    WHERE id = NEW.application_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status updates
CREATE TRIGGER update_payment_status_on_transaction
    AFTER INSERT OR UPDATE OF status
    ON "public"."payment_transactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_application_payment_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_stall_instance_id ON maintenance_logs(stall_instance_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_application_id ON payment_transactions(application_id);
CREATE INDEX IF NOT EXISTS idx_stall_instances_maintenance_dates ON stall_instances(last_maintenance_date, next_maintenance_date); 