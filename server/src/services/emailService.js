const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { format } = require('date-fns');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client if configuration is available
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase configuration missing. Email logging will be disabled.');
}

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'info@exhibae.com';
const SMTP_PASS = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM_EMAIL || 'info@exhibae.com';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'ExhiBae';

if (!SMTP_PASS) {
  console.error('SMTP_PASSWORD environment variable is not set');
  process.exit(1);
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true, // Always true for port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  },
  debug: process.env.NODE_ENV !== 'production',
  logger: process.env.NODE_ENV !== 'production'
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection verification failed:', error);
  } else {
    console.log('SMTP connection verified successfully');
  }
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
 * Log email to database
 * @param {Object} emailData - Email data to log
 * @returns {Promise<Object>} Log result
 */
async function logEmailToDatabase(emailData) {
  if (!supabase) {
    console.warn('Supabase not configured - skipping email logging');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert(emailData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging email to database:', error);
    return null;
  }
}

/**
 * Update email log status
 * @param {string} id - Log ID
 * @param {string} status - New status
 * @param {string} error - Error message if any
 */
async function updateEmailLogStatus(id, status, error = null) {
  if (!supabase) {
    console.warn('Supabase not configured - skipping email log update');
    return;
  }

  try {
    await supabase
      .from('email_logs')
      .update({
        status,
        error_message: error,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  } catch (error) {
    console.error('Error updating email log:', error);
  }
}

/**
 * Send an email
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Result
 */
async function sendEmail({ to, subject, html, text, from = SMTP_FROM }) {
  let logId = null;

  try {
    // Log the email attempt
    logId = await logEmailToDatabase({
      recipient_email: to,
      subject,
      content: { html, text },
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
      html
    });
    
    // Update log status
    if (logId) {
      await updateEmailLogStatus(logId, 'sent');
    }

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    
    // Update log status
    if (logId) {
      await updateEmailLogStatus(logId, 'failed', error.message);
    }
    
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

/**
 * Fetch manager emails from the database
 * @returns {Promise<string[]>} Array of manager email addresses
 */
async function getManagerEmails() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('role', 'manager');

    if (error) throw error;
    return data.map(user => user.email);
  } catch (error) {
    console.error('Error fetching manager emails:', error);
    return [];
  }
}

/**
 * Fetch organizer profile by user ID
 * @param {string} userId - Organizer's user ID
 * @returns {Promise<Object|null>} Organizer profile data
 */
async function getOrganizerProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('organizer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching organizer profile:', error);
    return null;
  }
}

/**
 * Fetch brand profile by user ID
 * @param {string} userId - Brand's user ID
 * @returns {Promise<Object|null>} Brand profile data
 */
async function getBrandProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return null;
  }
}

/**
 * Send exhibition creation notification to organizer
 */
async function sendExhibitionCreatedEmail({ 
  organizer_id,
  exhibition_name, 
  exhibition_date,
  exhibition_time,
  exhibition_location,
  exhibition_status,
  dashboard_link
}) {
  try {
    const organizerProfile = await getOrganizerProfile(organizer_id);
    if (!organizerProfile) {
      throw new Error('Organizer profile not found');
    }

    return await sendTemplateEmail({
      to: organizerProfile.contact_email,
      templateId: 'exhibition-created',
      data: {
        organizer_name: organizerProfile.company_name,
        exhibition_name,
        exhibition_date,
        exhibition_time,
        exhibition_location,
        exhibition_status,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending exhibition created email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send exhibition notification to managers
 */
async function sendExhibitionManagerNotification({
  exhibition_name,
  organizer_id,
  exhibition_date,
  exhibition_time,
  exhibition_location,
  review_link
}) {
  try {
    const managerEmails = await getManagerEmails();
    const organizerProfile = await getOrganizerProfile(organizer_id);
    
    if (!organizerProfile) {
      throw new Error('Organizer profile not found');
    }

    const results = [];
    
    // Send to all managers
    for (const email of managerEmails) {
      const result = await sendTemplateEmail({
        to: email,
        templateId: 'exhibition-manager-notification',
        data: {
          manager_name: 'Exhibition Manager', // Generic name for managers
          exhibition_name,
          organizer_name: organizerProfile.company_name,
          exhibition_date,
          exhibition_time,
          exhibition_location,
          review_link
        }
      });
      results.push(result);
    }
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error sending manager notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send exhibition status update to organizer
 */
async function sendExhibitionStatusEmail({
  organizer_id,
  exhibition_name,
  exhibition_date,
  exhibition_time,
  exhibition_location,
  status,
  manager_comments,
  dashboard_link
}) {
  try {
    const organizerProfile = await getOrganizerProfile(organizer_id);
    if (!organizerProfile) {
      throw new Error('Organizer profile not found');
    }

    const statusClass = status.toLowerCase();
    const is_approved = status.toLowerCase() === 'approved';
    const is_rejected = status.toLowerCase() === 'rejected';

    return await sendTemplateEmail({
      to: organizerProfile.contact_email,
      templateId: 'exhibition-status-update',
      data: {
        organizer_name: organizerProfile.company_name,
        exhibition_name,
        exhibition_date,
        exhibition_time,
        exhibition_location,
        status,
        status_class: statusClass,
        is_approved,
        is_rejected,
        manager_comments,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending exhibition status email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send stall application notification to organizer
 */
async function sendStallApplicationEmail({
  organizer_id,
  brand_id,
  exhibition_name,
  stall_size,
  product_categories,
  special_requirements,
  application_date,
  review_link
}) {
  try {
    const [organizerProfile, brandProfile] = await Promise.all([
      getOrganizerProfile(organizer_id),
      getBrandProfile(brand_id)
    ]);

    if (!organizerProfile || !brandProfile) {
      throw new Error('Profile not found');
    }

    // Send email to organizer
    const organizerEmailResult = await sendTemplateEmail({
      to: organizerProfile.contact_email,
      templateId: 'stall-application',
      data: {
        organizer_name: organizerProfile.company_name,
        exhibition_name,
        brand_name: brandProfile.company_name,
        brand_email: brandProfile.contact_email,
        stall_size,
        product_categories,
        special_requirements,
        application_date,
        review_link
      }
    });

    // Send confirmation email to brand
    const brandEmailResult = await sendTemplateEmail({
      to: brandProfile.contact_email,
      templateId: 'stall-application-confirmation',
      data: {
        brand_name: brandProfile.company_name,
        exhibition_name,
        stall_size,
        application_date,
        dashboard_link: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/brand/applications`
      }
    });

    return {
      success: organizerEmailResult.success && brandEmailResult.success,
      error: organizerEmailResult.error || brandEmailResult.error
    };
  } catch (error) {
    console.error('Error sending stall application email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send stall application status update to brand
 */
async function sendStallApplicationStatusEmail({
  brand_id,
  exhibition_name,
  exhibition_location,
  exhibition_date,
  stall_size,
  stall_number,
  status,
  organizer_comments,
  payment_amount,
  payment_deadline,
  payment_link,
  dashboard_link
}) {
  try {
    const brandProfile = await getBrandProfile(brand_id);
    if (!brandProfile) {
      throw new Error('Brand profile not found');
    }

    const statusClass = status.toLowerCase();
    const is_approved = status.toLowerCase() === 'approved';

    return await sendTemplateEmail({
      to: brandProfile.contact_email,
      templateId: 'stall-application-status',
      data: {
        brand_name: brandProfile.company_name,
        exhibition_name,
        exhibition_location,
        exhibition_date,
        stall_size,
        stall_number,
        status,
        status_class: statusClass,
        is_approved,
        organizer_comments,
        payment_amount,
        payment_deadline,
        payment_link,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending stall application status email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment review notification to organizer
 */
async function sendPaymentReviewEmail({
  organizer_id,
  brand_id,
  exhibition_name,
  stall_number,
  stall_size,
  payment_amount,
  payment_date,
  payment_method,
  transaction_id,
  review_link
}) {
  try {
    const [organizerProfile, brandProfile] = await Promise.all([
      getOrganizerProfile(organizer_id),
      getBrandProfile(brand_id)
    ]);

    if (!organizerProfile || !brandProfile) {
      throw new Error('Profile not found');
    }

    return await sendTemplateEmail({
      to: organizerProfile.contact_email,
      templateId: 'payment-review',
      data: {
        organizer_name: organizerProfile.company_name,
        exhibition_name,
        brand_name: brandProfile.company_name,
        stall_number,
        stall_size,
        payment_amount,
        payment_date,
        payment_method,
        transaction_id,
        review_link
      }
    });
  } catch (error) {
    console.error('Error sending payment review email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send stall confirmation email to brand
 */
async function sendStallConfirmedEmail({
  brand_id,
  exhibition_name,
  exhibition_date,
  exhibition_location,
  stall_number,
  stall_size,
  setup_date,
  setup_time,
  dashboard_link
}) {
  try {
    const brandProfile = await getBrandProfile(brand_id);
    if (!brandProfile) {
      throw new Error('Brand profile not found');
    }

    return await sendTemplateEmail({
      to: brandProfile.contact_email,
      templateId: 'stall-confirmed',
      data: {
        brand_name: brandProfile.company_name,
        exhibition_name,
        exhibition_date,
        exhibition_location,
        stall_number,
        stall_size,
        setup_date,
        setup_time,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending stall confirmed email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send exhibition update notification
 */
async function sendExhibitionUpdateEmail({
  exhibition_id,
  recipient_type, // 'organizer', 'brand', 'attendee'
  changes = []
}) {
  try {
    // Get exhibition details
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select(`
        *,
        organiser:profiles!inner(
          id,
          full_name,
          email,
          company_name
        )
      `)
      .eq('id', exhibition_id)
      .single();

    if (exhibitionError) throw exhibitionError;

    // Get recipients based on type
    let recipients = [];
    
    if (recipient_type === 'organizer') {
      recipients = [{ 
        email: exhibition.organiser.email,
        name: exhibition.organiser.company_name || exhibition.organiser.full_name
      }];
    } else if (recipient_type === 'brand') {
      // Get all brands with approved applications
      const { data: brands } = await supabase
        .from('stall_applications')
        .select(`
          brand:profiles!inner(
            email,
            company_name,
            full_name
          )
        `)
        .eq('exhibition_id', exhibition_id)
        .eq('status', 'approved');

      recipients = brands?.map(b => ({
        email: b.brand.email,
        name: b.brand.company_name || b.brand.full_name
      })) || [];
    } else if (recipient_type === 'attendee') {
      // Get all attendees
      const { data: attendees } = await supabase
        .from('exhibition_attendance')
        .select(`
          attendee:profiles!inner(
            email,
            full_name
          )
        `)
        .eq('exhibition_id', exhibition_id)
        .eq('attending', true);

      recipients = attendees?.map(a => ({
        email: a.attendee.email,
        name: a.attendee.full_name
      })) || [];
    }

    // Send email to each recipient
    const results = [];
    for (const recipient of recipients) {
      const result = await sendTemplateEmail({
        to: recipient.email,
        templateId: 'exhibition-updated',
        data: {
          recipient_name: recipient.name,
          exhibition_name: exhibition.title,
          exhibition_date: `${format(new Date(exhibition.start_date), 'MMMM d, yyyy')} - ${format(new Date(exhibition.end_date), 'MMMM d, yyyy')}`,
          exhibition_time: exhibition.time || '9:00 AM - 6:00 PM',
          exhibition_location: `${exhibition.venue}, ${exhibition.address}`,
          exhibition_status: exhibition.status,
          has_changes: changes.length > 0,
          changes,
          exhibition_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/exhibitions/${exhibition_id}`
        }
      });
      results.push(result);
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error sending exhibition update email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send exhibition reminder emails
 */
async function sendExhibitionReminderEmails({
  exhibition_id,
  days_until
}) {
  try {
    // Get exhibition details
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select(`
        *,
        organiser:profiles!inner(
          id,
          full_name,
          email,
          company_name
        )
      `)
      .eq('id', exhibition_id)
      .single();

    if (exhibitionError) throw exhibitionError;

    // Get all recipients with their roles
    const recipients = [];

    // Add organizer
    recipients.push({
      email: exhibition.organiser.email,
      name: exhibition.organiser.company_name || exhibition.organiser.full_name,
      role: 'organizing',
      role_is_organiser: true
    });

    // Add brands with approved applications
    const { data: brands } = await supabase
      .from('stall_applications')
      .select(`
        stall_number,
        brand:profiles!inner(
          email,
          company_name,
          full_name
        )
      `)
      .eq('exhibition_id', exhibition_id)
      .eq('status', 'approved');

    if (brands) {
      brands.forEach(b => {
        recipients.push({
          email: b.brand.email,
          name: b.brand.company_name || b.brand.full_name,
          role: 'participating',
          role_is_brand: true,
          stall_number: b.stall_number
        });
      });
    }

    // Add attendees
    const { data: attendees } = await supabase
      .from('exhibition_attendance')
      .select(`
        attendee:profiles!inner(
          email,
          full_name
        )
      `)
      .eq('exhibition_id', exhibition_id)
      .eq('attending', true);

    if (attendees) {
      attendees.forEach(a => {
        recipients.push({
          email: a.attendee.email,
          name: a.attendee.full_name,
          role: 'attending',
          role_is_shopper: true
        });
      });
    }

    // Send reminder email to each recipient
    const results = [];
    for (const recipient of recipients) {
      const result = await sendTemplateEmail({
        to: recipient.email,
        templateId: 'exhibition-reminder',
        data: {
          recipient_name: recipient.name,
          exhibition_name: exhibition.title,
          exhibition_date: `${format(new Date(exhibition.start_date), 'MMMM d, yyyy')} - ${format(new Date(exhibition.end_date), 'MMMM d, yyyy')}`,
          exhibition_time: exhibition.time || '9:00 AM - 6:00 PM',
          exhibition_location: `${exhibition.venue}, ${exhibition.address}`,
          days_until,
          user_role: recipient.role,
          role_is_organiser: recipient.role_is_organiser,
          role_is_brand: recipient.role_is_brand,
          role_is_shopper: recipient.role_is_shopper,
          stall_number: recipient.stall_number,
          exhibition_link: `${process.env.CLIENT_URL || 'http://localhost:8080'}/exhibitions/${exhibition_id}`
        }
      });
      results.push(result);
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error sending exhibition reminder emails:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send application waitlist notification to brand
 */
async function sendApplicationWaitlistedEmail({
  brand_id,
  exhibition_name,
  exhibition_location,
  exhibition_date,
  stall_size,
  organizer_comments,
  queue_position,
  dashboard_link
}) {
  try {
    const brandProfile = await getBrandProfile(brand_id);
    if (!brandProfile) {
      throw new Error('Brand profile not found');
    }

    return await sendTemplateEmail({
      to: brandProfile.contact_email,
      templateId: 'application-waitlisted',
      data: {
        brand_name: brandProfile.company_name,
        exhibition_name,
        exhibition_location,
        exhibition_date,
        stall_size,
        organizer_comments,
        queue_position,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending application waitlisted email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send application rejection notification to brand
 */
async function sendApplicationRejectedEmail({
  brand_id,
  exhibition_name,
  exhibition_location,
  exhibition_date,
  stall_size,
  rejection_reason,
  organizer_comments,
  alternative_exhibitions,
  dashboard_link
}) {
  try {
    const brandProfile = await getBrandProfile(brand_id);
    if (!brandProfile) {
      throw new Error('Brand profile not found');
    }

    return await sendTemplateEmail({
      to: brandProfile.contact_email,
      templateId: 'application-rejected',
      data: {
        brand_name: brandProfile.company_name,
        exhibition_name,
        exhibition_location,
        exhibition_date,
        stall_size,
        rejection_reason,
        organizer_comments,
        has_alternatives: alternative_exhibitions && alternative_exhibitions.length > 0,
        alternative_exhibitions,
        dashboard_link
      }
    });
  } catch (error) {
    console.error('Error sending application rejected email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send contact form response email
 */
async function sendContactResponseEmail({
  name,
  email,
  subject,
  message,
  response_message,
  support_ticket_id,
  support_link
}) {
  try {
    return await sendTemplateEmail({
      to: email,
      templateId: 'contact-response',
      data: {
        name,
        original_subject: subject,
        original_message: message,
        response_message,
        support_ticket_id,
        support_link,
        contact_email: SMTP_FROM,
        sent_date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending contact response email:', error);
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
  sendWelcomeEmailsToAllUsers,
  sendExhibitionCreatedEmail,
  sendExhibitionManagerNotification,
  sendExhibitionStatusEmail,
  sendStallApplicationEmail,
  sendStallApplicationStatusEmail,
  sendPaymentReviewEmail,
  sendStallConfirmedEmail,
  getManagerEmails,
  getOrganizerProfile,
  getBrandProfile,
  sendExhibitionUpdateEmail,
  sendExhibitionReminderEmails,
  sendApplicationWaitlistedEmail,
  sendApplicationRejectedEmail,
  sendContactResponseEmail
}; 