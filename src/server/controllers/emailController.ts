import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { compileTemplate } from '../../services/email/templateCompiler';

// Load environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'info@exhibae.com';
const SMTP_PASS = process.env.SMTP_PASSWORD || 'Test@121!';
const SMTP_FROM = process.env.SMTP_FROM_EMAIL || 'info@exhibae.com';
const SMTP_SECURE = true; // Always true for port 465

// Create reusable transporter object using SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

// Templates directory
const TEMPLATE_DIR = path.resolve(process.cwd(), 'src/email-templates');

/**
 * Send a test email
 * @param req Express request
 * @param res Express response
 */
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: 'Exhibae Test Email',
      text: 'This is a test email from Exhibae',
      html: '<b>This is a test email from Exhibae</b>',
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Send an email using a template
 * @param req Express request
 * @param res Express response
 */
export const sendTemplateEmail = async (req: Request, res: Response) => {
  try {
    const { to, templateId, data, from } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    // Load the template
    const templatePath = path.join(TEMPLATE_DIR, `${templateId}.html`);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        error: `Template "${templateId}" not found`
      });
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template with the provided data
    const html = compileTemplate(templateContent, data || {});

    // Send the email
    const info = await transporter.sendMail({
      from: from || SMTP_FROM,
      to,
      subject: data.subject || `Exhibae: ${templateId}`,
      html,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending template email:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 