# ExhiBae Email Service

A robust email service for ExhiBae Connect, built with Node.js, Express, Nodemailer, and Supabase.

## Features

- **SMTP Email Sending**: Send emails via Hostinger SMTP server
- **HTML Email Templates**: Support for HTML templates with variable substitution
- **Email Queueing**: Queue emails for later sending
- **Scheduled Emails**: Schedule emails to be sent at a specific time
- **Retry Mechanism**: Automatic retry for failed emails
- **Email Templates**: Store and manage email templates in the database
- **API Endpoints**: RESTful API endpoints for email operations
- **Error Handling**: Robust error handling and logging

## Configuration

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@exhibae.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=info@exhibae.com
SMTP_FROM_NAME=ExhiBae

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Application URLs
CLIENT_URL=https://exhibae.com
API_URL=https://api.exhibae.com
```

## Email Types

The system supports the following email types:

1. **Welcome Email**: Sent to new users when they register
2. **Exhibition Published**: Sent to organisers when their exhibition is published
3. **New Stall Interest**: Sent to organisers when a brand applies for a stall
4. **Stall Approved**: Sent to brands when their stall application is approved
5. **Upcoming Exhibition Reminder**: Sent to shoppers as a weekly reminder
6. **New Exhibition Listing**: Sent to managers when a new exhibition is listed
7. **Payment Confirmation**: Sent to brands when their payment is confirmed
8. **Exhibition Reminder**: Sent to brands and organisers before an exhibition
9. **Stall Application Rejected**: Sent to brands when their application is rejected

## Testing

### Quick Test

To quickly test the email configuration:

```bash
npm run test-email
```

This will:
1. Verify SMTP connection
2. Send a test email to the configured SMTP user
3. Log the results

### Comprehensive Testing

For thorough testing of all email features:

```bash
npm run test-all
```

This includes:
- Template rendering tests
- Queue processing tests
- Scheduled email tests
- Error handling tests

## Database Schema

The service uses the following tables:

1. **email_templates**: Stores email templates
2. **email_queue**: Manages email sending queue
3. **email_logs**: Tracks all sent emails

To set up the database schema:

```bash
npm run setup-email-tables
```

## API Endpoints

### Send Email
```
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Hello",
  "html": "<p>Email content</p>"
}
```

### Get Templates
```
GET /api/email/templates
```

### Test Configuration
```
GET /api/email/test
```

## Error Handling

The service includes comprehensive error handling:

- SMTP connection errors
- Template rendering errors
- Queue processing errors
- Database errors

All errors are logged to:
1. Console (development)
2. Log files (production)
3. Supabase email_logs table

## Maintenance

Regular maintenance tasks:

1. Monitor email_logs table for failed emails
2. Check SMTP configuration if multiple failures occur
3. Review and update email templates as needed
4. Monitor queue performance

## Support

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Check the error logs 