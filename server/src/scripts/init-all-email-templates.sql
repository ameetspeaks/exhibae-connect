-- Initialize email tables and templates
-- Run this script in Supabase SQL Editor to set up all email templates

-- First, ensure the email tables exist
\i src/scripts/create_email_tables.sql

-- Remind users to run the Node.js script to populate the templates
SELECT 'Email tables have been created. Now run the following command to initialize the templates:';
SELECT 'node src/scripts/initEmailTemplates.js';

-- Alternatively, you can use the test script to preview templates:
SELECT 'To preview a template, run:';
SELECT 'node src/scripts/test-email-template.js [template_id]';
SELECT 'Available template IDs:';
SELECT '- welcome (Welcome email for all users)';
SELECT '- exhibition_published (Notification when exhibition is published)';
SELECT '- new_stall_interest (Alert for organiser about new stall application)';
SELECT '- stall_approved (Notification for brand when stall is approved)';
SELECT '- upcoming_exhibition_reminder (Weekly reminder for shoppers)';
SELECT '- new_exhibition_listing (Alert for manager about new exhibition)';
SELECT '- payment_confirmation (Confirmation of stall payment)';
SELECT '- exhibition_reminder_brand (Reminder for brands before exhibition)';
SELECT '- exhibition_reminder_organiser (Reminder for organisers before exhibition)';
SELECT '- stall_application_rejected (Notification for rejected applications)'; 