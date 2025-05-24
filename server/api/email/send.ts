import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const app = new Hono();

// Configure CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.VITE_SMTP_HOST,
  port: parseInt(process.env.VITE_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.VITE_SMTP_USER,
    pass: process.env.VITE_SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Email sending endpoint
app.post('/api/email/send', async (c) => {
  try {
    const body = await c.req.json();
    const { to, subject, text, html } = body;

    // Validate request
    if (!to || !subject || (!text && !html)) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.VITE_SMTP_FROM,
      to,
      subject,
      text,
      html: html || text,
    });

    return c.json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return c.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Test endpoint
app.get('/api/email/test', async (c) => {
  try {
    // Verify SMTP connection
    await transporter.verify();
    
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.VITE_SMTP_FROM,
      to: process.env.VITE_SMTP_USER,
      subject: 'Test Email Configuration',
      text: 'If you receive this email, it means your SMTP configuration is working correctly!',
      html: '<h1>Email Configuration Test</h1><p>If you receive this email, it means your SMTP configuration is working correctly!</p>',
    });

    return c.json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error testing email:', error);
    return c.json({ 
      error: 'Failed to test email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Start the server
const port = parseInt(process.env.PORT || '3001');
console.log(`Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
}); 