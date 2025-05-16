-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    subject text NOT NULL,
    template text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.email_templates(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    sent_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS email_queue_status_idx ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS email_queue_user_id_idx ON public.email_queue(user_id);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email queue"
    ON public.email_queue
    FOR SELECT
    USING (auth.uid() = user_id);

-- Insert default email templates
INSERT INTO public.email_templates (type, subject, template) VALUES
('user_registered', 'New Brand Registration', 'A new brand has registered: {{company_name}}'),
('exhibition_created', 'New Exhibition Created', 'A new exhibition has been created: {{title}}'),
('stall_booked', 'New Stall Application', 'A new stall application has been received for {{exhibition_title}}'),
('application_received', 'Application Status Updated', 'Your application for {{exhibition_title}} has been {{status}}'),
('exhibition_reminder', 'Exhibition Reminder', 'Reminder: {{exhibition_title}} starts in {{days}} days'),
('payment_reminder', 'Payment Reminder', 'You have a pending payment for {{exhibition_title}}'),
('exhibition_cancelled', 'Exhibition Cancelled', 'The exhibition "{{exhibition_title}}" has been cancelled'),
('exhibition_updated', 'Exhibition Updated', 'The exhibition "{{exhibition_title}}" has been updated'),
('message_received', 'New Message Received', 'You have received a new message from {{sender}}');

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically queue email notifications
CREATE OR REPLACE FUNCTION queue_email_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_settings record;
    template_id uuid;
BEGIN
    -- Get user notification settings
    SELECT * FROM notification_settings
    WHERE user_id = NEW.user_id
    INTO user_settings;

    -- Only queue email if user has email notifications enabled
    IF user_settings.email_notifications THEN
        -- Get template ID
        SELECT id FROM email_templates
        WHERE type = NEW.type
        INTO template_id;

        -- Insert into email queue
        INSERT INTO email_queue (user_id, notification_id, template_id, status)
        VALUES (NEW.user_id, NEW.id, template_id, 'pending');
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to queue emails for new notifications
CREATE TRIGGER queue_notification_email
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION queue_email_notification(); 