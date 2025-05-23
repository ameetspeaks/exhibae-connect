# ExhiBae Email Service Testing Guide

This document provides instructions for testing the email service functionality.

## Prerequisites

Before testing, ensure you have:

1. Node.js and npm installed
2. Required dependencies installed: `npm install`
3. Environment variables set up in `.env` file with correct SMTP credentials and Supabase credentials

## Quick Start: Comprehensive Testing

For a streamlined testing experience, use the comprehensive test script:

```bash
# Navigate to server directory
cd server

# Run the comprehensive test script
node src/test-all.js
```

This script will:
1. Run all tests in sequence
2. Ask for confirmation before running optional tests
3. Provide a summary of test results
4. Stop on critical failures

## Database Setup

Before testing, you need to set up the database schema:

### Option 1: Automatic Setup

Run the database setup script:

```bash
# Navigate to server directory
cd server

# Run the setup script
node src/db/setup-db.js
```

This script will:
- Connect to your Supabase instance using the credentials in `.env`
- Execute the SQL statements in `src/db/schema.sql`
- Create the necessary tables and default email templates

**Note:** This requires the `exec_sql` function to be available in your Supabase project. If it's not available, the script will provide instructions on how to create it.

### Option 2: Manual Setup

If the automatic setup doesn't work, you can manually execute the SQL statements:

1. Open the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of `src/db/schema.sql`
4. Paste into the SQL Editor and run

## Testing Components

### 1. Database Schema Testing

This test verifies the Supabase database schema for email templates and queue:

```bash
# Navigate to server directory
cd server

# Run the database schema test script
node src/test-db-schema.js
```

The script will:
- Check if the required tables exist
- Create sample data if tables are empty
- Provide SQL statements to create tables if they don't exist

### 2. Template Compiler Testing

This test verifies the functionality of the email template compiler:

```bash
# Navigate to server directory
cd server

# Run the template compiler test script
node src/test-template-compiler.js
```

The script will test:
- Simple template compilation
- Templates with multiple placeholders
- Templates with missing data
- Email template compilation (subject and HTML content)

### 3. Direct Nodemailer Testing

This test verifies the SMTP connection and sends a test email directly using Nodemailer:

```bash
# Navigate to server directory
cd server

# Run the test script
node src/test-email-service.js
```

Before running, update the following in the test script:
- Replace `'test@example.com'` with your actual test email address
- Ensure your `.env` file contains the correct SMTP password or update it directly in the test script

### 4. API Testing

To test the API endpoints:

1. Start the server:
   ```bash
   cd server
   npm run dev
   ```

2. Run the API test script:
   ```bash
   cd server
   node src/test-api.js
   ```

   Or use Postman, curl, or another API testing tool to test the endpoints:

   **Send Simple Email:**
   ```bash
   curl -X POST http://localhost:3001/api/email/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "your-email@example.com",
       "subject": "API Test Email",
       "html": "<h1>Test Email</h1><p>This is a test email from the API.</p>",
       "from": "hi@sportsvani.in"
     }'
   ```

   **Send Template Email:**
   ```bash
   curl -X POST http://localhost:3001/api/email/template \
     -H "Content-Type: application/json" \
     -d '{
       "to": "your-email@example.com",
       "templateId": "welcome",
       "data": {
         "name": "Test User",
         "dashboardLink": "https://exhibae.com/dashboard"
       }
     }'
   ```

   **Process Email Queue:**
   ```bash
   curl -X POST http://localhost:3001/api/email/queue/process \
     -H "Content-Type: application/json" \
     -d '{
       "batchSize": 5
     }'
   ```

## Troubleshooting

If tests fail, check the following:

1. **Database Issues:**
   - Verify Supabase URL and service key in `.env` file
   - Check if tables exist and have the correct schema
   - Ensure you have permissions to read/write to the tables

2. **SMTP Connection Issues:**
   - Verify SMTP credentials in `.env` file
   - Check if your email provider requires app-specific passwords
   - Ensure port 465 is not blocked by your network

3. **API Endpoint Issues:**
   - Verify the server is running
   - Check server logs for error messages
   - Ensure the API URL is correct

4. **Template Issues:**
   - Verify template exists in the database
   - Check template format and variable placeholders

## Complete Testing Workflow

For a thorough test of the email system:

1. First, set up the database schema using the setup script
2. Then, test the database schema to ensure tables exist
3. Next, test the template compiler to ensure templates can be processed correctly
4. Then, test direct Nodemailer functionality to verify SMTP configuration
5. Finally, test the API endpoints to ensure the server is properly handling requests

## Next Steps

After successful testing:

1. Update the client-side email service to use the server API
2. Implement proper error handling and retries
3. Set up monitoring for email delivery status 