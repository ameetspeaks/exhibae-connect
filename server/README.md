# ExhiBae Email Service

A robust email service for ExhiBae Connect, built with Node.js, Express, Nodemailer, and Supabase.

## Features

- **SMTP Email Sending**: Send emails via Hostinger SMTP server
- **HTML Email Templates**: Support for HTML templates with variable substitution
- **Conditional Content**: Template support for conditional content blocks
- **Email Queueing**: Queue emails for later sending
- **Scheduled Emails**: Schedule emails to be sent at a specific time
- **Retry Mechanism**: Automatic retry for failed emails
- **Email Templates**: Store and manage email templates in the database
- **Default Templates**: Built-in default templates for common scenarios
- **API Endpoints**: RESTful API endpoints for email operations
- **Queue Processing**: Background processing of email queue
- **Error Handling**: Robust error handling and logging

## Configuration

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=hi@sportsvani.in
EMAIL_PASSWORD=your-email-password

# Supabase Configuration
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Application URLs
CLIENT_URL=https://exhibae.com
API_URL=https://api.exhibae.com
```

### SMTP Configuration

The email service is configured to use Hostinger SMTP with the following settings:

- **Host**: smtp.hostinger.com
- **Port**: 587 (TLS)
- **Secure**: true
- **Username**: hi@sportsvani.in
- **Password**: [Set in environment variables]

## API Endpoints

### Send Email

```
POST /api/email/send
```

Request body:
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from ExhiBae",
  "html": "<p>This is a test email</p>",
  "from": "hi@sportsvani.in" // Optional
}
```

### Send Template Email

```
POST /api/email/template
```

Request body:
```json
{
  "to": "recipient@example.com",
  "templateId": "welcome",
  "data": {
    "name": "John Doe",
    "dashboardLink": "https://exhibae.com/dashboard",
    "unsubscribeLink": "https://exhibae.com/unsubscribe"
  },
  "from": "hi@sportsvani.in" // Optional
}
```

### Queue Email

```
POST /api/email/queue
```

Request body:
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from ExhiBae",
  "html": "<p>This is a queued email</p>",
  "from": "hi@sportsvani.in", // Optional
  "scheduled_for": "2023-06-01T10:00:00Z" // Optional
}
```

Or for template emails:

```json
{
  "to": "recipient@example.com",
  "templateId": "welcome",
  "data": {
    "name": "John Doe",
    "dashboardLink": "https://exhibae.com/dashboard"
  },
  "from": "hi@sportsvani.in", // Optional
  "scheduled_for": "2023-06-01T10:00:00Z" // Optional
}
```

### Process Email Queue

```
POST /api/email/process-queue
```

Request body:
```json
{
  "batchSize": 10 // Optional
}
```

### Get Email Templates

```
GET /api/email/templates
```

### Verify SMTP Connection

```
POST /api/email/verify
```

## Database Schema

### Email Templates Table

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Email Queue Table

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  from_email TEXT,
  subject TEXT,
  html_content TEXT,
  template_id TEXT,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3
);
```

## Default Email Templates

The system includes the following default templates:

1. **Welcome**: Sent when a new user joins
2. **Application Status Update**: Sent when an application status changes
3. **Password Reset**: Sent when a user requests a password reset

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Testing Email Templates

You can test email templates using the provided test scripts:

### Node.js Script

```bash
node test-email-templates.js list                   # List available templates
node test-email-templates.js all [recipient]        # Test all templates
node test-email-templates.js [template] [recipient] # Test specific template
```

### PowerShell Script

```powershell
.\test-email-templates.ps1
```

## Scheduled Tasks

The server automatically runs the following scheduled tasks:

- **Process Email Queue**: Every 5 minutes
- **Process Scheduled Emails**: Every 1 minute

## Security Considerations

- Store email passwords securely in environment variables
- Implement proper authentication for API endpoints
- Use HTTPS for all API requests
- Validate all input data
- Handle errors gracefully without exposing sensitive information 