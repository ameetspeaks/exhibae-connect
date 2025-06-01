-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "System can create default notification settings" ON public.notification_settings;

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper TO clause and explicit roles
CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add a policy for the service role to handle default settings creation
CREATE POLICY "Service role can manage notification settings"
ON public.notification_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant explicit permissions
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;

-- Recreate the trigger function with proper error handling
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