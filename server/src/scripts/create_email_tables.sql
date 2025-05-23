-- SQL script to create email-related tables and functions

-- Create email_templates table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_email_templates_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Add RLS policies
  ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for service role
  DROP POLICY IF EXISTS "Service role can manage email templates" ON public.email_templates;
  CREATE POLICY "Service role can manage email templates" 
    ON public.email_templates 
    USING (true) 
    WITH CHECK (auth.role() = 'service_role');
  
  -- Create policy for authenticated users to read templates
  DROP POLICY IF EXISTS "Authenticated users can read email templates" ON public.email_templates;
  CREATE POLICY "Authenticated users can read email templates" 
    ON public.email_templates 
    FOR SELECT
    USING (auth.role() = 'authenticated');
END;
$$;

-- Create email_queue table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_email_queue_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email TEXT NOT NULL,
    from_email TEXT,
    subject TEXT,
    html_content TEXT,
    template_id TEXT,
    template_data JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3
  );
  
  -- Check if scheduled_for column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_queue' 
    AND column_name = 'scheduled_for'
  ) INTO column_exists;
  
  -- Add scheduled_for column if it doesn't exist
  IF NOT column_exists THEN
    ALTER TABLE public.email_queue ADD COLUMN scheduled_for TIMESTAMPTZ;
  END IF;
  
  -- Add indexes for better performance
  CREATE INDEX IF NOT EXISTS email_queue_status_idx ON public.email_queue(status);
  CREATE INDEX IF NOT EXISTS email_queue_scheduled_for_idx ON public.email_queue(scheduled_for);
  
  -- Add RLS policies
  ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for service role
  DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;
  CREATE POLICY "Service role can manage email queue" 
    ON public.email_queue 
    USING (true) 
    WITH CHECK (auth.role() = 'service_role');
  
  -- Fixed policy: Using a column that exists in the table
  DROP POLICY IF EXISTS "Authenticated users can read their own emails" ON public.email_queue;
  CREATE POLICY "Authenticated users can read their own emails" 
    ON public.email_queue 
    FOR SELECT
    USING (auth.role() = 'service_role');
END;
$$;

-- Create function to queue an email
CREATE OR REPLACE FUNCTION public.queue_email(
  p_to_email TEXT,
  p_subject TEXT,
  p_html_content TEXT,
  p_from_email TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO public.email_queue (
    to_email,
    subject,
    html_content,
    from_email,
    scheduled_for
  ) VALUES (
    p_to_email,
    p_subject,
    p_html_content,
    p_from_email,
    p_scheduled_for
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Create function to queue a template email
CREATE OR REPLACE FUNCTION public.queue_template_email(
  p_to_email TEXT,
  p_template_id TEXT,
  p_template_data JSONB,
  p_from_email TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO public.email_queue (
    to_email,
    template_id,
    template_data,
    from_email,
    scheduled_for
  ) VALUES (
    p_to_email,
    p_template_id,
    p_template_data,
    p_from_email,
    p_scheduled_for
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Create email_logs table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_email_logs_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    template_id TEXT,
    template_data JSONB,
    error_message TEXT,
    message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Add indexes for better performance
  CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs(status);
  CREATE INDEX IF NOT EXISTS email_logs_operation_idx ON public.email_logs(operation);
  CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs(created_at);
  CREATE INDEX IF NOT EXISTS email_logs_to_email_idx ON public.email_logs(to_email);
  
  -- Add RLS policies
  ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for service role
  DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
  CREATE POLICY "Service role can manage email logs" 
    ON public.email_logs 
    USING (true) 
    WITH CHECK (auth.role() = 'service_role');
  
  -- Create policy for authenticated users to read logs
  DROP POLICY IF EXISTS "Authenticated users can read email logs" ON public.email_logs;
  CREATE POLICY "Authenticated users can read email logs" 
    ON public.email_logs 
    FOR SELECT
    USING (auth.role() = 'authenticated');
END;
$$;

-- Execute the functions to create tables
SELECT create_email_templates_table();
SELECT create_email_queue_table();
SELECT create_email_logs_table(); 