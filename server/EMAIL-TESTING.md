# ExhiBae Email Testing Guide

This document provides instructions for testing the email functionality using various test scripts.

## Prerequisites

Before testing, ensure you have:

1. Node.js and npm installed
2. Required dependencies installed: `npm install`
3. Environment variables set up in `.env` file with correct SMTP credentials and Supabase credentials

## Test Scripts

### 1. Send Test Email to Specific Addresses

This script allows you to send a test email to one or more specific email addresses:

```bash
# Navigate to server directory
cd server

# Run the test script
node src/send-test-email.js
```

The script will:
1. Verify the SMTP connection
2. Ask you to enter email addresses (comma-separated)
3. Ask for a name to personalize each email
4. Send the test emails and provide a summary

This is useful for testing the email service with your own email address before sending to real users.

### 2. Send Test Email to All Users

This script sends a test email to all active users in your database:

```bash
# Navigate to server directory
cd server

# Run the test script
node src/send-test-email-to-all.js
```

The script will:
1. Verify the SMTP connection
2. Fetch all active users from the database
3. Ask for confirmation before sending
4. Send the test emails and provide a summary

**Warning:** This script will send an email to all active users in your database. Use with caution!

## Email Template

The test emails use a simple template with the following content:

- **Subject:** Test Email from ExhiBae
- **Content:**
  - A greeting with the recipient's name
  - A message explaining that this is a test email
  - A call-to-action button to visit the ExhiBae website
  - A closing message

## Troubleshooting

If you encounter issues when sending emails, check the following:

1. **SMTP Connection Issues:**
   - Verify SMTP credentials in `.env` file
   - Check if your email provider requires app-specific passwords
   - Ensure port 465 is not blocked by your network

2. **Database Issues (for send-to-all script):**
   - Verify Supabase URL and service key in `.env` file
   - Check if the users table exists and has the correct schema
   - Ensure you have permissions to read from the users table

3. **Rate Limiting:**
   - Some email providers limit the number of emails you can send in a short period
   - If sending to many users, consider adding longer delays between emails

## Next Steps

After successfully testing the email functionality, you can:

1. Customize the email templates for different types of notifications
2. Set up scheduled emails for regular updates
3. Implement email tracking to monitor open rates and engagement 