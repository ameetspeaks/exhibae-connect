import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

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

// Get email templates
app.get('/api/email/templates', async (c) => {
  try {
    // Path to email templates directory
    const templatesDir = join(__dirname, '../../../src/email-templates');
    
    // Read template files from directory
    const files = await readdir(templatesDir);
    const templates = files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
    
    return c.json({ 
      success: true, 
      templates 
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get email stats
app.get('/api/email/stats', async (c) => {
  try {
    // Get email logs from Supabase
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('status, operation, template_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Initialize statistics with default empty values
    const stats = {
      total: logs?.length || 0,
      byStatus: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      byTemplate: {} as Record<string, number>,
      recent: logs?.slice(0, 5) || []
    };

    // Count emails by status, operation, and template
    logs?.forEach(log => {
      // Count by status
      const status = log.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by operation
      const operation = log.operation || 'unknown';
      stats.byOperation[operation] = (stats.byOperation[operation] || 0) + 1;

      // Count by template
      const template = log.template_id || 'direct';
      stats.byTemplate[template] = (stats.byTemplate[template] || 0) + 1;
    });

    // Ensure at least one entry in each category to avoid Object.entries() issues
    if (Object.keys(stats.byStatus).length === 0) stats.byStatus['no-data'] = 0;
    if (Object.keys(stats.byOperation).length === 0) stats.byOperation['no-data'] = 0;
    if (Object.keys(stats.byTemplate).length === 0) stats.byTemplate['no-data'] = 0;

    return c.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Error getting email stats:', error);
    // Return default stats structure even on error
    return c.json({ 
      success: false, 
      stats: {
        total: 0,
        byStatus: { 'no-data': 0 },
        byOperation: { 'no-data': 0 },
        byTemplate: { 'no-data': 0 },
        recent: []
      },
      error: 'Failed to get email statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get email logs
app.get('/api/email/logs', async (c) => {
  try {
    const { limit = '20', offset = '0' } = c.req.query();

    // Get email logs from Supabase with proper types
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    return c.json({ 
      success: true, 
      logs: logs || [] 
    });
  } catch (error) {
    console.error('Error getting email logs:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get email logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

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

    // Log email to Supabase
    await supabase.from('email_logs').insert({
      recipient_email: to,
      subject,
      content: { text, html },
      status: 'sent',
      message_id: info.messageId,
      created_at: new Date().toISOString()
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