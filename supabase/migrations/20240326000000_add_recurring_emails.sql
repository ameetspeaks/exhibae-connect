-- Add recurring email support to email_queue table
ALTER TABLE public.email_queue
ADD COLUMN IF NOT EXISTS recurring_type text CHECK (recurring_type IN ('daily', 'weekly', 'monthly', 'custom')),
ADD COLUMN IF NOT EXISTS recurring_interval integer,
ADD COLUMN IF NOT EXISTS recurring_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata',
ADD COLUMN IF NOT EXISTS next_scheduled_at timestamp with time zone;

-- Create index for scheduled emails
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled 
ON public.email_queue (status, scheduled_for, next_scheduled_at);

-- Add function to handle recurring email scheduling
CREATE OR REPLACE FUNCTION public.handle_recurring_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.recurring_type IS NOT NULL AND NEW.status = 'sent' THEN
    -- Calculate next scheduled date based on recurring type
    CASE NEW.recurring_type
      WHEN 'daily' THEN
        NEW.next_scheduled_at = NEW.scheduled_for + interval '1 day';
      WHEN 'weekly' THEN
        NEW.next_scheduled_at = NEW.scheduled_for + interval '1 week';
      WHEN 'monthly' THEN
        NEW.next_scheduled_at = NEW.scheduled_for + interval '1 month';
      WHEN 'custom' THEN
        NEW.next_scheduled_at = NEW.scheduled_for + (NEW.recurring_interval || ' days')::interval;
    END CASE;

    -- Check if we've reached the end date
    IF NEW.recurring_end_date IS NOT NULL AND NEW.next_scheduled_at > NEW.recurring_end_date THEN
      RETURN NEW;
    END IF;

    -- Create new queue entry for next occurrence
    INSERT INTO public.email_queue (
      template_id,
      status,
      data,
      scheduled_for,
      recurring_type,
      recurring_interval,
      recurring_end_date,
      timezone,
      next_scheduled_at
    ) VALUES (
      NEW.template_id,
      'scheduled',
      NEW.data,
      NEW.next_scheduled_at,
      NEW.recurring_type,
      NEW.recurring_interval,
      NEW.recurring_end_date,
      NEW.timezone,
      NEW.next_scheduled_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for recurring emails
DROP TRIGGER IF EXISTS trigger_handle_recurring_email ON public.email_queue;
CREATE TRIGGER trigger_handle_recurring_email
  AFTER UPDATE OF status ON public.email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION public.handle_recurring_email(); 