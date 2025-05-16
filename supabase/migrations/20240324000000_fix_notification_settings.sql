-- Drop existing notification settings tables if they exist
DROP TABLE IF EXISTS public.notification_settings CASCADE;

-- Create the notification_settings table with the correct structure
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications boolean DEFAULT true,
    desktop_notifications boolean DEFAULT true,
    sound_enabled boolean DEFAULT true,
    user_registered_enabled boolean DEFAULT true,
    exhibition_created_enabled boolean DEFAULT true,
    stall_booked_enabled boolean DEFAULT true,
    stall_updated_enabled boolean DEFAULT true,
    application_received_enabled boolean DEFAULT true,
    exhibition_reminder_enabled boolean DEFAULT true,
    payment_reminder_enabled boolean DEFAULT true,
    exhibition_cancelled_enabled boolean DEFAULT true,
    exhibition_updated_enabled boolean DEFAULT true,
    message_received_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings(user_id);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification settings"
    ON public.notification_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
    ON public.notification_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
    ON public.notification_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 