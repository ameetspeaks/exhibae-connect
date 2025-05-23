const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@exhibae.com';
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  debug: true, // Show debug output
  logger: true // Log information about the mail
});

// Template directory
const TEMPLATE_DIR = path.resolve(process.cwd(), 'src/email-templates');

// Email queue - in memory for simplicity
// In production, this would be in a database
const emailQueue = [];

/**
 * Compile an email template with variables
 * @param {string} template - Email template with placeholders
 * @param {Object} data - Data to replace placeholders
 * @returns {string} Compiled template
 */
function compileTemplate(template, data = {}) {
  let compiledTemplate = template;
  
  // Replace all variables in the template
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledTemplate = compiledTemplate.replace(regex, value?.toString() || '');
  }
  
  return compiledTemplate;
}

/**
 * Read a template file from disk
 * @param {string} templateId - Template ID/name
 * @returns {Promise<string>} Template content
 */
async function readTemplate(templateId) {
  try {
    const templatePath = path.join(TEMPLATE_DIR, `${templateId}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${templateId}.html not found`);
    }
    
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`Error reading template ${templateId}:`, error);
    throw error;
  }
}

/**
 * Send an email
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Result
 */
async function sendEmail({ to, subject, html, text, from = SMTP_FROM }) {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
      html
    });
    
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    
    // Queue the email for retry
    queueEmail({ to, subject, html, text, from });
    
    return { success: false, error: error.message, queued: true };
  }
}

/**
 * Send an email using a template
 * @param {Object} data - Template email data
 * @returns {Promise<Object>} Result
 */
async function sendTemplateEmail({ to, templateId, data = {}, from = SMTP_FROM }) {
  try {
    // Read the template
    const template = await readTemplate(templateId);
    
    // Compile the template with data
    const html = compileTemplate(template, data);
    
    // Generate a subject if not provided in data
    const subject = data.subject || `${templateId.charAt(0).toUpperCase() + templateId.slice(1).replace(/-/g, ' ')}`;
    
    // Send the email
    return await sendEmail({ to, subject, html, from });
  } catch (error) {
    console.error(`Error sending template email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Queue an email for later sending
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Result
 */
async function queueEmail({ 
  to, subject, html, text, templateId, data, from = SMTP_FROM, sendAt 
}) {
  try {
    // Create queue item
    const queueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Add to queue
    emailQueue.push({
      id: queueId,
      to,
      subject,
      html,
      text,
      templateId,
      data,
      from,
      sendAt: sendAt ? new Date(sendAt) : null,
      createdAt: new Date(),
      attempts: 0
    });
    
    console.log(`Email queued for ${to}: ${queueId}`);
    return { success: true, queueId };
  } catch (error) {
    console.error(`Error queuing email for ${to}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process the email queue
 * @returns {Promise<Object>} Result
 */
async function processEmailQueue() {
  try {
    let processed = 0;
    let failed = 0;
    
    // Process emails that don't have a scheduled time or are due
    const now = new Date();
    
    for (let i = 0; i < emailQueue.length; i++) {
      const email = emailQueue[i];
      
      // Skip if scheduled for future
      if (email.sendAt && email.sendAt > now) {
        continue;
      }
      
      // Remove from queue
      emailQueue.splice(i, 1);
      i--; // Adjust index
      
      try {
        // If it's a template email
        if (email.templateId) {
          await sendTemplateEmail({
            to: email.to,
            templateId: email.templateId,
            data: email.data,
            from: email.from
          });
        } else {
          // Regular email
          await sendEmail({
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
            from: email.from
          });
        }
        
        processed++;
      } catch (error) {
        console.error(`Error processing queued email ${email.id}:`, error);
        
        // If less than 3 attempts, requeue
        if (email.attempts < 3) {
          email.attempts++;
          emailQueue.push(email);
        } else {
          failed++;
        }
      }
    }
    
    return { 
      success: true, 
      processed, 
      failed, 
      remaining: emailQueue.length 
    };
  } catch (error) {
    console.error('Error processing email queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify the SMTP connection
 * @returns {Promise<boolean>} Connection status
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
}

/**
 * Get all available templates
 * @returns {Promise<Array>} Templates list
 */
async function getAvailableTemplates() {
  try {
    const templateFiles = fs.readdirSync(TEMPLATE_DIR);
    
    return templateFiles
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Error getting templates:', error);
    throw error;
  }
}

/**
 * Send a welcome email
 * @param {Object} data - Welcome email data
 * @returns {Promise<Object>} Result
 */
async function sendWelcomeEmail({ to, name, role, dashboardLink }) {
  try {
    return await sendTemplateEmail({
      to,
      templateId: 'welcome',
      data: {
        name: name || 'User',
        role: role || 'user',
        dashboardLink: dashboardLink || `${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard`
      }
    });
  } catch (error) {
    console.error(`Error sending welcome email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome emails to all users
 * @returns {Promise<Object>} Result
 */
async function sendWelcomeEmailsToAllUsers() {
  try {
    // This is a placeholder - in a real implementation, you would:
    // 1. Fetch all users from your database
    // 2. Send a welcome email to each user
    // 3. Track success/failure

    console.log('Sending welcome emails to all users - this is a placeholder function');
    
    // Simulate sending to a few users
    const testUsers = [
      { email: 'user1@example.com', name: 'User 1', role: 'brand' },
      { email: 'user2@example.com', name: 'User 2', role: 'organiser' },
      { email: 'user3@example.com', name: 'User 3', role: 'shopper' }
    ];
    
    let success = 0;
    let failed = 0;
    
    for (const user of testUsers) {
      try {
        const result = await sendWelcomeEmail({
          to: user.email,
          name: user.name,
          role: user.role,
          dashboardLink: `${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard`
        });
        
        if (result.success) {
          success++;
        } else {
          failed++;
        }
        
        // Small delay to prevent overwhelming the email server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sending welcome email to ${user.email}:`, error);
        failed++;
      }
    }
    
    return { success: true, total: testUsers.length, succeeded: success, failed };
  } catch (error) {
    console.error('Error sending welcome emails to all users:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendTemplateEmail,
  queueEmail,
  processEmailQueue,
  verifyConnection,
  getAvailableTemplates,
  sendWelcomeEmail,
  sendWelcomeEmailsToAllUsers
}; 