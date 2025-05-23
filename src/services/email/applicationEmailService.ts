import emailService from './emailService';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateType } from '@/types/email';
import { ApplicationStatus } from '@/types/stall-applications';
import * as fs from 'fs';
import * as path from 'path';
import { compileTemplate } from './templateCompiler';

interface ApplicationData {
  id: string;
  exhibitionId: string;
  brandId: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  stallNumber?: number;
  rejectionReason?: string;
  createdAt: string;
}

interface ExhibitionApplication {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  description: string;
  organizerId: string;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
}

interface BrandProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  website?: string;
  socialMedia?: { [key: string]: string };
  logoUrl?: string;
  userId: string;
  createdAt: string;
}

/**
 * Sends an email notification about application status change
 * @param applicationId The ID of the application
 * @param status The new status of the application
 * @param rejectionReason Optional reason for rejection
 * @returns Object with success status, message ID, and any error
 */
export async function sendApplicationStatusEmail(
  applicationId: string,
  status: 'approved' | 'rejected' | 'waitlisted',
  rejectionReason?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Fetch application data from Supabase
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (applicationError || !applicationData) {
      return { 
        success: false, 
        error: `Failed to fetch application data: ${applicationError?.message || 'Application not found'}` 
      };
    }

    // Fetch exhibition data
    const { data: exhibitionData, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', applicationData.exhibitionId)
      .single();

    if (exhibitionError || !exhibitionData) {
      return { 
        success: false, 
        error: `Failed to fetch exhibition data: ${exhibitionError?.message || 'Exhibition not found'}` 
      };
    }

    // Fetch brand profile data
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', applicationData.brandId)
      .single();

    if (brandError || !brandData) {
      return { 
        success: false, 
        error: `Failed to fetch brand data: ${brandError?.message || 'Brand not found'}` 
      };
    }

    // Load the template based on the status
    const templateName = `application-${status}`;
    const templatePath = path.resolve(process.cwd(), `src/email-templates/${templateName}.html`);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return { 
        success: false, 
        error: `Email template not found: ${templateName}.html` 
      };
    }

    // Read template
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Set additional variables based on status
    let additionalVars = {};
    if (status === 'rejected' && rejectionReason) {
      additionalVars = { rejection_reason: rejectionReason };
    } else if (status === 'approved') {
      additionalVars = { 
        stall_number: applicationData.stallNumber || 'To be assigned',
        payment_status: applicationData.paymentStatus || 'pending'
      };
    }

    // Template variables
    const templateVars = {
      name: brandData.name,
      exhibition_name: exhibitionData.name,
      exhibition_dates: `${new Date(exhibitionData.startDate).toLocaleDateString()} - ${new Date(exhibitionData.endDate).toLocaleDateString()}`,
      venue: exhibitionData.venue,
      application_date: new Date(applicationData.createdAt).toLocaleDateString(),
      status: status,
      ...additionalVars
    };

    // Compile the template
    const html = compileTemplate(templateContent, templateVars);

    // Create subject line based on status
    const subjectLines = {
      approved: `Your application for ${exhibitionData.name} has been approved!`,
      rejected: `Update on your application for ${exhibitionData.name}`,
      waitlisted: `You've been waitlisted for ${exhibitionData.name}`
    };

    // Send the email
    const emailResult = await emailService.sendTemplateEmail({
      to: brandData.email,
      templateId: templateName,
      data: templateVars,
      from: process.env.SMTP_FROM || 'no-reply@exhibae.com'
    });

    return emailResult;
  } catch (error) {
    return {
      success: false,
      error: `Error sending application status email: ${(error as Error).message}`
    };
  }
}

/**
 * Sends payment reminder email for approved applications
 * @param applicationId The ID of the application
 * @returns Object with success status, message ID, and any error
 */
export async function sendPaymentReminderEmail(
  applicationId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Fetch application data from Supabase
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (applicationError || !applicationData) {
      return { 
        success: false, 
        error: `Failed to fetch application data: ${applicationError?.message || 'Application not found'}` 
      };
    }

    // Only send payment reminders for approved applications
    if (applicationData.status !== 'approved') {
      return { 
        success: false, 
        error: 'Payment reminder can only be sent for approved applications' 
      };
    }

    // Fetch exhibition data
    const { data: exhibitionData, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', applicationData.exhibitionId)
      .single();

    if (exhibitionError || !exhibitionData) {
      return { 
        success: false, 
        error: `Failed to fetch exhibition data: ${exhibitionError?.message || 'Exhibition not found'}` 
      };
    }

    // Fetch brand profile data
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', applicationData.brandId)
      .single();

    if (brandError || !brandData) {
      return { 
        success: false, 
        error: `Failed to fetch brand data: ${brandError?.message || 'Brand not found'}` 
      };
    }

    // Load the payment reminder template
    const templatePath = path.resolve(process.cwd(), 'src/email-templates/payment-reminder.html');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return { 
        success: false, 
        error: 'Email template not found: payment-reminder.html' 
      };
    }

    // Read template
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Template variables
    const templateVars = {
      name: brandData.name,
      exhibition_name: exhibitionData.name,
      exhibition_dates: `${new Date(exhibitionData.startDate).toLocaleDateString()} - ${new Date(exhibitionData.endDate).toLocaleDateString()}`,
      venue: exhibitionData.venue,
      application_date: new Date(applicationData.createdAt).toLocaleDateString(),
      stall_number: applicationData.stallNumber || 'To be assigned',
      payment_link: `https://exhibae.com/dashboard/payments/${applicationId}`,
      payment_deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString()
    };

    // Compile the template
    const html = compileTemplate(templateContent, templateVars);

    // Send the email
    const emailResult = await emailService.sendTemplateEmail({
      to: brandData.email,
      templateId: 'payment-reminder',
      data: templateVars,
      from: process.env.SMTP_FROM || 'no-reply@exhibae.com'
    });

    return emailResult;
  } catch (error) {
    return {
      success: false,
      error: `Error sending payment reminder email: ${(error as Error).message}`
    };
  }
} 