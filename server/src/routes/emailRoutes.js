const express = require('express');
const emailService = require('../services/emailService');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * @route POST /api/email/send
 * @desc Send an email
 * @access Private
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;
    
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }
    
    if (!subject || (!html && !text)) {
      return res.status(400).json({ success: false, error: 'Subject and content (html or text) are required' });
    }
    
    const result = await emailService.sendEmail({ to, subject, html, text, from });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /send endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/email/template
 * @desc Send an email using a template
 * @access Private
 */
router.post('/template', async (req, res) => {
  try {
    const { to, templateId, data, from } = req.body;
    
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }
    
    if (!templateId) {
      return res.status(400).json({ success: false, error: 'Template ID is required' });
    }
    
    const result = await emailService.sendTemplateEmail({ to, templateId, data, from });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /template endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/email/queue
 * @desc Queue an email for later sending
 * @access Private
 */
router.post('/queue', async (req, res) => {
  try {
    const { to, subject, html, text, from, sendAt } = req.body;
    
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }
    
    if (!subject || (!html && !text)) {
      return res.status(400).json({ success: false, error: 'Subject and content (html or text) are required' });
    }
    
    const result = await emailService.queueEmail({ to, subject, html, text, from, sendAt });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /queue endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/email/process-queue
 * @desc Process the email queue
 * @access Private
 */
router.post('/process-queue', async (req, res) => {
  try {
    const result = await emailService.processEmailQueue();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /process-queue endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/email/templates
 * @desc Get all available email templates
 * @access Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await emailService.getAvailableTemplates();
    return res.status(200).json({ success: true, templates });
  } catch (error) {
    console.error('Error in /templates endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/email/template/:id
 * @desc Get a specific email template by ID
 * @access Private
 */
router.get('/template/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if a template exists in the database
    const template = await emailService.getTemplate(id);
    
    if (template) {
      return res.json({
        success: true,
        template
      });
    }
    
    // If not found in database, try to read from filesystem
    try {
      const templatePath = path.join(__dirname, '../../..', 'src/email-templates', `${id}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      return res.json({
        success: true,
        template: {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
          html_content: templateContent,
          subject: 'ExhiBae - ' + id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
          created_at: new Date().toISOString()
        }
      });
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: `Template with ID ${id} not found`
      });
    }
  } catch (error) {
    console.error(`Error in /api/email/template/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/verify
 * @desc Verify SMTP connection
 * @access Private
 */
router.post('/verify', async (req, res) => {
  try {
    const result = await emailService.verifyConnection();
    return res.status(200).json({ success: true, connected: result });
  } catch (error) {
    console.error('Error in /verify endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get email logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0, status, operation, toEmail, templateId } = req.query;
    
    const logs = await emailService.getLogs({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      operation,
      toEmail,
      templateId
    });
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error getting email logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnose email issues
router.get('/diagnose', async (req, res) => {
  try {
    const diagnostics = await emailService.diagnoseEmailIssues();
    res.json({ success: true, diagnostics });
  } catch (error) {
    console.error('Error diagnosing email issues:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/email/test
 * @desc Send a test email
 * @access Private
 */
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address is required'
      });
    }
    
    const result = await emailService.sendTestEmail(to);
    
    if (result.success) {
      return res.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/test/template
 * @desc Send a test template email
 * @access Private
 */
router.post('/test/template', async (req, res) => {
  try {
    const { to, templateId = 'welcome' } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address is required'
      });
    }
    
    // Create test data based on template ID
    let testData = {};
    
    switch (templateId) {
      case 'welcome':
        testData = {
          name: 'Test User',
          role: 'brand',
          role_is_brand: true,
          dashboardLink: `${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard`
        };
        break;
        
      case 'exhibition-reminder':
        testData = {
          name: 'Test User',
          user_role: 'participating',
          role_is_brand: true,
          exhibition_name: 'Test Exhibition',
          exhibition_date: 'June 1, 2024',
          exhibition_time: '10:00 AM - 6:00 PM',
          exhibition_location: 'Test Convention Center, London',
          exhibition_description: 'This is a test exhibition for demonstration purposes.',
          exhibition_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/exhibitions/1`,
          days_until: 15,
          stall_number: 'B42'
        };
        break;
        
      case 'new-exhibition':
        testData = {
          name: 'Test User',
          role: 'brand',
          role_is_brand: true,
          exhibition_name: 'New Test Exhibition',
          exhibition_date: 'July 15-17, 2024',
          exhibition_time: '9:00 AM - 5:00 PM',
          exhibition_location: 'Test Exhibition Hall, New York',
          exhibition_description: 'This is a new test exhibition for demonstration purposes.',
          exhibition_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/exhibitions/2`,
          exhibition_image: 'https://via.placeholder.com/600x400?text=Test+Exhibition',
          organizer_name: 'Test Organizer Inc.',
          application_deadline: 'June 1, 2024',
          categories: ['Fashion', 'Home Decor', 'Art'],
          apply_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/apply/2`,
          unsubscribe_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/unsubscribe`
        };
        break;
        
      case 'stall-status':
        testData = {
          brand_name: 'Test Brand',
          status: 'approved',
          status_display: 'Approved',
          status_class: 'approved',
          is_approved: true,
          exhibition_name: 'Test Exhibition',
          exhibition_date: 'June 10, 2024',
          exhibition_location: 'Test Convention Center, London',
          organizer_name: 'Test Organizer',
          organizer_comments: 'We are excited to have your brand at our exhibition!',
          application_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/applications/1`,
          stall_number: 'C15',
          stall_size: '3m x 3m',
          setup_date: 'June 9, 2024',
          setup_time: '2:00 PM - 6:00 PM',
          payment_required: true,
          payment_deadline: 'May 25, 2024',
          payment_amount: '£500',
          payment_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment/1`
        };
        break;
        
      default:
        testData = { name: 'Test User' };
    }
    
    const result = await emailService.sendTemplateEmail({
      to,
      templateId,
      data: testData
    });
    
    if (result.success) {
      return res.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test template email:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send welcome emails to all users
router.post('/send-welcome-emails', async (req, res) => {
  try {
    // Start the process asynchronously
    emailService.sendWelcomeEmailsToAllUsers()
      .then((result) => {
        console.log('Welcome emails sent:', result);
      })
      .catch((error) => {
        console.error('Error sending welcome emails:', error);
      });
    
    // Return immediately
    return res.status(200).json({
      success: true,
      message: 'Welcome emails sending process has started. Check server logs for progress.'
    });
  } catch (error) {
    console.error('Error in /send-welcome-emails endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Send a test welcome email
router.post('/test-welcome-email', async (req, res) => {
  try {
    const { email, name, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const result = await emailService.sendWelcomeEmail({
      to: email,
      name: name || 'Test User',
      role: role || 'shopper',
      dashboardLink: `${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard`
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /test-welcome-email endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 