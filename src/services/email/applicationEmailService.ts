import emailService from './emailService';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateType } from '@/types/email';
import { ApplicationStatus } from '@/types/stall-applications';
import { compileTemplate } from './templateCompiler';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Import email templates
import approvedTemplate from '../../email-templates/application-approved.html?raw';
import rejectedTemplate from '../../email-templates/application-rejected.html?raw';
import waitlistedTemplate from '../../email-templates/application-waitlisted.html?raw';
import paymentReminderTemplate from '../../email-templates/payment-reminder.html?raw';

type StallApplication = Database['public']['Tables']['stall_applications']['Row'];
type Exhibition = Database['public']['Tables']['exhibitions']['Row'];
type BrandProfile = Database['public']['Tables']['brand_profiles']['Row'];

/**
 * Sends an email notification about application status change
 * @param applicationId The ID of the application
 * @param status The new status of the application
 * @param rejectionReason Optional reason for rejection
 * @returns Object with success status, message ID, and any error
 */
export async function sendApplicationStatusEmail(
  applicationId: string,
  status: ApplicationStatus,
  rejectionReason?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Fetch application data from Supabase
    const { data: applications, error: applicationError } = await (supabase as SupabaseClient<Database>)
      .from('stall_applications')
      .select('*')
      .filter('id', 'eq', applicationId)
      .limit(1);

    if (applicationError || !applications || applications.length === 0) {
      return { 
        success: false, 
        error: `Failed to fetch application data: ${applicationError?.message || 'Application not found'}` 
      };
    }

    const application = applications[0];

    // Fetch exhibition data
    const { data: exhibitions, error: exhibitionError } = await (supabase as SupabaseClient<Database>)
      .from('exhibitions')
      .select('*')
      .filter('id', 'eq', application.exhibition_id)
      .limit(1);

    if (exhibitionError || !exhibitions || exhibitions.length === 0) {
      return { 
        success: false, 
        error: `Failed to fetch exhibition data: ${exhibitionError?.message || 'Exhibition not found'}` 
      };
    }

    const exhibition = exhibitions[0];

    // Fetch brand profile data
    const { data: brands, error: brandError } = await (supabase as SupabaseClient<Database>)
      .from('brand_profiles')
      .select('*')
      .filter('id', 'eq', application.brand_id)
      .limit(1);

    if (brandError || !brands || brands.length === 0) {
      return { 
        success: false, 
        error: `Failed to fetch brand data: ${brandError?.message || 'Brand not found'}` 
      };
    }

    const brand = brands[0];

    // Load the template based on the status
    const templateName = `application-${status}`;
    const templateContent = {
      'payment_pending': approvedTemplate,
      'rejected': rejectedTemplate,
      'pending': waitlistedTemplate
    }[status];

    if (!templateContent) {
      return { 
        success: false, 
        error: `Email template not found: ${templateName}.html` 
      };
    }

    // Set additional variables based on status
    let additionalVars = {};
    if (status === 'rejected' && rejectionReason) {
      additionalVars = { rejection_reason: rejectionReason };
    } else if (status === 'payment_pending') {
      additionalVars = { 
        stall_number: application.stall_instance_id || 'To be assigned',
        payment_status: 'pending'
      };
    }

    // Template variables
    const templateVars = {
      name: brand.company_name,
      exhibition_name: exhibition.title,
      exhibition_dates: `${new Date(exhibition.start_date).toLocaleDateString()} - ${new Date(exhibition.end_date).toLocaleDateString()}`,
      venue: exhibition.address,
      application_date: new Date(application.created_at).toLocaleDateString(),
      status: status,
      ...additionalVars
    };

    // Create subject line based on status
    const subjectLines = {
      'payment_pending': `Your application for ${exhibition.title} has been approved!`,
      'rejected': `Update on your application for ${exhibition.title}`,
      'pending': `You've been waitlisted for ${exhibition.title}`
    };

    // Send the email
    const emailResult = await emailService.sendTemplateEmail({
      to: brand.contact_email,
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
    const templateContent = paymentReminderTemplate;
    
    // Check if template exists
    if (!templateContent) {
      return { 
        success: false, 
        error: 'Email template not found: payment-reminder.html' 
      };
    }

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