-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  from_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (template_id, subject, html_content, description)
VALUES
  (
    'welcome', 
    'Welcome to ExhiBae!', 
    '<h1>Welcome {{name}}!</h1><p>We are excited to have you on board. <a href="{{dashboardLink}}">Visit your dashboard</a> to get started.</p>', 
    'Welcome email for new users'
  ),
  (
    'application_status_update', 
    'Update on your ExhiBae application', 
    '<h1>Application Status Update</h1><p>Dear {{name}},</p><p>Your application status has been updated to: <strong>{{status}}</strong>.</p><p>{{message}}</p><p>You can view more details on your <a href="{{dashboardLink}}">dashboard</a>.</p>', 
    'Email sent when application status changes'
  ),
  (
    'password_reset', 
    'Reset your ExhiBae password', 
    '<h1>Password Reset</h1><p>Dear {{name}},</p><p>We received a request to reset your password. Click the link below to reset your password:</p><p><a href="{{resetLink}}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p>', 
    'Email sent for password reset'
  )
ON CONFLICT (template_id) DO NOTHING;

-- Create index on email queue for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist to avoid errors
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;

-- Create triggers to automatically update the updated_at timestamp
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON email_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 