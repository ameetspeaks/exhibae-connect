-- Drop existing objects if they exist
DROP TABLE IF EXISTS "public"."email_logs";
DROP TYPE IF EXISTS email_type;
DROP TYPE IF EXISTS email_status;

-- Create email_type enum
CREATE TYPE email_type AS ENUM (
    'exhibition_created',
    'exhibition_approved',
    'exhibition_rejected',
    'exhibition_status_update',
    'exhibition_interest',
    'stall_application',
    'application_approved',
    'application_rejected',
    'application_waitlisted',
    'payment_status',
    'payment_completed',
    'payment_reminder',
    'welcome_email',
    'contact_response'
);

-- Create email_status enum
CREATE TYPE email_status AS ENUM (
    'pending',
    'sent',
    'failed'
);

-- Create email_logs table
CREATE TABLE "public"."email_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email_type" email_type NOT NULL,
    "recipient_email" text NOT NULL,
    "recipient_name" text,
    "subject" text NOT NULL,
    "content" jsonb NOT NULL,
    "status" email_status NOT NULL DEFAULT 'pending',
    "error_message" text,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Managers can view all email logs"
    ON email_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'manager'
        )
    );

-- Create function to update updated_at on email_logs
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_email_logs_updated_at(); 