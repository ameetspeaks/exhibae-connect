# ExhiBae Connect Email System

This document explains the email system in ExhiBae Connect, including its features, configuration, and usage.

## Features

- **Email Templates**: Professionally designed HTML email templates with variable substitution
- **Template Management**: Store and retrieve email templates from the database
- **Email Queue**: Queue emails for later processing
- **Scheduled Emails**: Schedule emails to be sent at a specific time
- **Robust Error Handling**: Automatically retry failed emails
- **Specialized Email Types**: Pre-configured email types for common scenarios

## Email Types

The system supports the following email types:

1. **Welcome Email**: Sent to new users when they register
2. **Exhibition Published**: Sent to organisers when their exhibition is published
3. **New Stall Interest**: Sent to organisers when a brand applies for a stall
4. **Stall Approved**: Sent to brands when their stall application is approved
5. **Upcoming Exhibition Reminder**: Sent to shoppers as a weekly reminder
6. **New Exhibition Listing**: Sent to managers when a new exhibition is listed
7. **Payment Confirmation**: Sent to brands when their payment is confirmed
8. **Exhibition Reminder for Brands**: Sent to brands as a reminder before an exhibition
9. **Exhibition Reminder for Organisers**: Sent to organisers as a reminder before their exhibition
10. **Stall Application Rejected**: Sent to brands when their stall application is rejected

## Setup and Configuration

### Environment Variables

Configure the following environment variables:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Database Setup

Run the following SQL script to set up the required tables:

```sql
\i src/scripts/create_email_tables.sql
```

### Initialize Templates

Run the following command to initialize the email templates:

```bash
node src/scripts/initEmailTemplates.js
```

## Usage

### Sending a Simple Email

```javascript
const emailService = require('./services/emailService');

// Send a simple email
await emailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello from ExhiBae',
  html: '<h1>Hello!</h1><p>This is a test email.</p>'
});
```

### Sending a Template Email

```javascript
const emailService = require('./services/emailService');

// Send a template email
await emailService.sendTemplateEmail({
  to: 'recipient@example.com',
  templateId: 'welcome',
  data: {
    name: 'John Smith',
    role: 'organiser',
    dashboardLink: 'https://exhibae.com/dashboard'
  }
});
```

### Using Specialized Email Functions

```javascript
const emailService = require('./services/emailService');

// Send a welcome email
await emailService.sendWelcomeEmail({
  to: 'john@example.com',
  name: 'John Smith',
  role: 'organiser',
  dashboardLink: 'https://exhibae.com/dashboard'
});

// Send an exhibition published notification
await emailService.sendExhibitionPublishedEmail({
  to: 'organiser@example.com',
  name: 'Sarah Johnson',
  exhibitionName: 'Fashion Forward 2023',
  exhibitionDate: 'October 15-17, 2023',
  exhibitionLocation: 'London Exhibition Centre',
  exhibitionDescription: 'A showcase of the latest fashion trends',
  exhibitionLink: 'https://exhibae.com/exhibitions/123'
});

// See emailService.js for more specialized functions
```

### Queueing Emails

```javascript
const emailService = require('./services/emailService');

// Queue an email for later processing
await emailService.queueEmail({
  to: 'recipient@example.com',
  subject: 'Hello from ExhiBae',
  html: '<h1>Hello!</h1><p>This is a test email.</p>'
});

// Queue a template email
await emailService.queueEmail({
  to: 'recipient@example.com',
  templateId: 'welcome',
  data: {
    name: 'John Smith',
    role: 'organiser',
    dashboardLink: 'https://exhibae.com/dashboard'
  }
});

// Schedule an email for later
await emailService.queueEmail({
  to: 'recipient@example.com',
  subject: 'Reminder',
  html: '<p>This is a scheduled reminder.</p>',
  scheduled_for: '2023-12-25T09:00:00Z'
});
```

### Processing the Email Queue

```javascript
const emailService = require('./services/emailService');

// Process pending emails in the queue
await emailService.processEmailQueue();

// Process scheduled emails whose time has come
await emailService.processScheduledEmails();
```

## Testing Email Templates

You can preview email templates using the test script:

```bash
node src/scripts/test-email-template.js welcome
```

Replace `welcome` with any of the available template IDs:

- `welcome`
- `exhibition_published`
- `new_stall_interest`
- `stall_approved`
- `upcoming_exhibition_reminder`
- `new_exhibition_listing`
- `payment_confirmation`
- `exhibition_reminder_brand`
- `exhibition_reminder_organiser`
- `stall_application_rejected`

## Customizing Templates

You can customize email templates by:

1. Modifying the HTML in `src/services/emailTemplates.js`
2. Running `node src/scripts/initEmailTemplates.js` to update the database

Alternatively, you can modify templates directly in the database through the Supabase dashboard.

## Troubleshooting

- **Emails not sending**: Check SMTP credentials and connection
- **Templates not loading**: Ensure templates are initialized in the database
- **Errors when sending**: Check the server logs for detailed error messages

For more information, consult the code documentation in the following files:

- `src/services/emailService.js`
- `src/services/templateCompiler.js`
- `src/services/emailTemplates.js` 