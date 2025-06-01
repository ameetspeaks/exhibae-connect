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
    comment_received_enabled boolean DEFAULT true,
    review_submitted_enabled boolean DEFAULT true,
    review_response_enabled boolean DEFAULT true,
    profile_updated_enabled boolean DEFAULT true,
    document_uploaded_enabled boolean DEFAULT true,
    document_approved_enabled boolean DEFAULT true,
    document_rejected_enabled boolean DEFAULT true,
    exhibition_status_updated_enabled boolean DEFAULT true,
    payment_status_updated_enabled boolean DEFAULT true,
    stall_application_received_enabled boolean DEFAULT true,
    stall_approved_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings(user_id);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification settings"
    ON public.notification_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
    ON public.notification_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
    ON public.notification_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create default settings for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default settings for new user
  INSERT INTO public.notification_settings (
    user_id,
    email_notifications,
    desktop_notifications,
    sound_enabled,
    user_registered_enabled,
    exhibition_created_enabled,
    stall_booked_enabled,
    stall_updated_enabled,
    application_received_enabled,
    exhibition_reminder_enabled,
    payment_reminder_enabled,
    exhibition_cancelled_enabled,
    exhibition_updated_enabled,
    message_received_enabled,
    comment_received_enabled,
    review_submitted_enabled,
    review_response_enabled,
    profile_updated_enabled,
    document_uploaded_enabled,
    document_approved_enabled,
    document_rejected_enabled,
    exhibition_status_updated_enabled,
    payment_status_updated_enabled,
    stall_application_received_enabled,
    stall_approved_enabled
  ) VALUES (
    NEW.id,
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true, true,
    true, true, true, true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in create_default_notification_settings: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to create default settings for new users
DROP TRIGGER IF EXISTS create_notification_settings_for_new_user ON auth.users;
CREATE TRIGGER create_notification_settings_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_notification_settings(); 