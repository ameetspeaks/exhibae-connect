-- First, check if the old table exists and migrate data if it does
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizer_payment_details') THEN
        -- First deactivate any existing records
        UPDATE organiser_bank_details SET is_active = false;
        UPDATE organiser_upi_details SET is_active = false;

        -- Migrate bank details
        INSERT INTO organiser_bank_details (
            organiser_id,
            bank_name,
            account_number,
            ifsc_code,
            account_holder_name,
            is_active
        )
        SELECT 
            organizer_id,
            bank_name,
            account_number,
            ifsc_code,
            account_holder_name,
            true
        FROM organizer_payment_details
        WHERE bank_name IS NOT NULL
        AND account_number IS NOT NULL;

        -- Migrate UPI details
        INSERT INTO organiser_upi_details (
            organiser_id,
            upi_id,
            is_active
        )
        SELECT 
            organizer_id,
            upi_id,
            true
        FROM organizer_payment_details
        WHERE upi_id IS NOT NULL;

        -- Drop the old table
        DROP TABLE IF EXISTS organizer_payment_details;
    END IF;
END $$; 