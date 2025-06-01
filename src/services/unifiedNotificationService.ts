import { managerNotificationService } from './managerNotificationService';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { processNotification } from './notificationService';
import { supabase } from '@/integrations/supabase/client';
import { AppNotification } from '@/types/notification';
import type { Database } from '@/integrations/supabase/types';
import type { StallApplication } from '@/types/stall-applications';
import type { EmailType, EmailLogInsert, EmailLogUpdate } from '@/types/email-logs';

interface NotificationServiceConfig {
  apiUrl: string;
}

class UnifiedNotificationService {
  private apiUrl: string;

  constructor(config?: NotificationServiceConfig) {
    this.apiUrl = config?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  private createNotification(
    title: string,
    message: string,
    type: AppNotification['type'],
    link: string
  ): AppNotification {
    return {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };
  }

  private async logEmail(
    emailType: EmailType,
    recipientEmail: string,
    recipientName: string | null,
    subject: string,
    content: Record<string, any>
  ): Promise<string | null> {
    try {
      const emailLog: EmailLogInsert = {
        email_type: emailType,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        content,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('email_logs')
        .insert(emailLog)
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error logging email:', error);
      return null;
    }
  }

  private async updateEmailStatus(id: string, status: 'sent' | 'failed', errorMessage?: string) {
    try {
      const update: EmailLogUpdate = {
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      };

      await supabase
        .from('email_logs')
        .update(update)
        .eq('id', id);
    } catch (error) {
      console.error('Error updating email status:', error);
    }
  }

  /**
   * Send notifications for exhibition creation
   */
  async notifyExhibitionCreated(
    exhibitionId: string, 
    exhibitionName: string, 
    organiserName: string, 
    organiserEmail: string, 
    managerEmail: string
  ): Promise<boolean> {
    try {
      // Log the email
      const { data: emailLog } = await supabase
        .from('email_logs')
        .insert({
          email_type: 'exhibition_created',
          recipient_email: managerEmail,
          recipient_name: 'Manager',
          subject: `New Exhibition Created: ${exhibitionName}`,
          content: {
            exhibition_id: exhibitionId,
            exhibition_name: exhibitionName,
            organiser_name: organiserName,
            organiser_email: organiserEmail
          },
          status: 'pending'
        })
        .select()
        .single();

      // Send manager notification
      await managerNotificationService.notifyExhibitionCreated(exhibitionId, exhibitionName);

      // Send email notifications
      const emailNotifications = useEmailNotifications();
      try {
        await emailNotifications.sendExhibitionCreatedEmail(
          exhibitionName,
          organiserName,
          organiserEmail,
          exhibitionId,
          managerEmail
        );
        if (emailLog) {
          await this.updateEmailStatus(emailLog.id, 'sent');
        }
      } catch (error) {
        if (emailLog) {
          await this.updateEmailStatus(emailLog.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
        }
        throw error;
      }

      // Send browser notification to managers
      const notification = this.createNotification(
        'New Exhibition Created',
        `A new exhibition "${exhibitionName}" has been created`,
        'exhibition_created',
        `/dashboard/exhibitions/${exhibitionId}`
      );
      processNotification(notification);

      return true;
    } catch (error) {
      console.error('Error sending exhibition created notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for exhibition status update
   */
  async notifyExhibitionStatusUpdate(
    exhibitionId: string, 
    exhibitionName: string, 
    newStatus: string
  ): Promise<boolean> {
    try {
      // Send manager notification
      await managerNotificationService.notifyExhibitionStatusUpdate(exhibitionId, exhibitionName, newStatus);

      // Get exhibition details for email
      const { data: exhibition } = await supabase
        .from('exhibitions')
        .select(`
          organiser_id,
          profiles:organiser_id (
            email,
            full_name
          )
        `)
        .eq('id', exhibitionId)
        .single();

      if (exhibition?.profiles) {
        const organiserEmail = exhibition.profiles.email;
        const organiserName = exhibition.profiles.full_name;

        // Log the email
        const emailLogId = await this.logEmail(
          newStatus === 'approved' ? 'exhibition_approved' : 'exhibition_rejected',
          organiserEmail,
          organiserName,
          `Exhibition ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}: ${exhibitionName}`,
          {
            exhibition_id: exhibitionId,
            exhibition_name: exhibitionName,
            status: newStatus,
            organiser_name: organiserName
          }
        );

        // Send email notification
        try {
          const emailNotifications = useEmailNotifications();
          await emailNotifications.sendExhibitionStatusEmail(
            exhibitionName,
            organiserName,
            organiserEmail,
            newStatus,
            `${window.location.origin}/dashboard/exhibitions/${exhibitionId}`
          );

          if (emailLogId) {
            await this.updateEmailStatus(emailLogId, 'sent');
          }
        } catch (error) {
          if (emailLogId) {
            await this.updateEmailStatus(
              emailLogId,
              'failed',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
          throw error;
        }

        // Send browser notification
        const notification = this.createNotification(
          'Exhibition Status Updated',
          `Exhibition "${exhibitionName}" status has been updated to ${newStatus}`,
          'exhibition_status_updated',
          `/dashboard/exhibitions/${exhibitionId}`
        );
        processNotification(notification);
      }

      return true;
    } catch (error) {
      console.error('Error sending exhibition status update notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for stall application
   */
  async notifyStallApplication(
    applicationId: string, 
    brandName: string, 
    exhibitionName: string
  ): Promise<boolean> {
    try {
      // Send manager notification
      await managerNotificationService.notifyStallApplicationReceived(applicationId, brandName, exhibitionName);

      // Send browser notification
      const notification = this.createNotification(
        'New Stall Application',
        `${brandName} has submitted a stall application for ${exhibitionName}`,
        'stall_application_received',
        `/dashboard/applications/${applicationId}`
      );
      processNotification(notification);

      return true;
    } catch (error) {
      console.error('Error sending stall application notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for stall approval
   */
  async notifyStallApproved(
    stallId: string, 
    brandName: string, 
    exhibitionName: string, 
    brandEmail: string
  ): Promise<boolean> {
    try {
      // Send manager notification
      await managerNotificationService.notifyStallApproved(stallId, brandName, exhibitionName);

      // Send browser notification
      const notification = this.createNotification(
        'Stall Approved',
        `Stall for ${brandName} in ${exhibitionName} has been approved`,
        'stall_approved',
        `/dashboard/stalls/${stallId}`
      );
      processNotification(notification);

      return true;
    } catch (error) {
      console.error('Error sending stall approval notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for payment status update
   */
  async notifyPaymentStatusUpdate(
    paymentId: string, 
    exhibitionName: string, 
    brandName: string, 
    newStatus: string, 
    brandEmail: string
  ): Promise<boolean> {
    try {
      // Send manager notification
      await managerNotificationService.notifyPaymentStatusUpdate(paymentId, exhibitionName, brandName, newStatus);

      // Send browser notification
      const notification = this.createNotification(
        'Payment Status Updated',
        `Payment status for ${brandName} (${exhibitionName}) has been updated to ${newStatus}`,
        'payment_status_updated',
        `/dashboard/payments/${paymentId}`
      );
      processNotification(notification);

      return true;
    } catch (error) {
      console.error('Error sending payment status update notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for application waitlisted
   */
  async notifyApplicationWaitlisted(
    applicationId: string, 
    brandName: string, 
    exhibitionName: string, 
    queuePosition: number
  ): Promise<boolean> {
    try {
      // Get application details
      const { data: application } = await supabase
        .from('stall_applications')
        .select(`
          *,
          exhibition:exhibitions(*)
        `)
        .eq('id', applicationId as Database['public']['Tables']['stall_applications']['Row']['id'])
        .single();

      if (application) {
        const stallApplication = application as unknown as StallApplication;

        // Send email notification
        await fetch(`${this.apiUrl}/api/email/application-waitlisted`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand_id: stallApplication.brand_id,
            exhibition_name: exhibitionName,
            exhibition_location: stallApplication.exhibition?.location || '',
            exhibition_date: stallApplication.exhibition?.start_date || '',
            stall_size: `${stallApplication.stall?.length || 0}x${stallApplication.stall?.width || 0}`,
            organizer_comments: stallApplication.message || '',
            queue_position: queuePosition,
            dashboard_link: `${window.location.origin}/dashboard/applications/${applicationId}`
          }),
        });

        // Send browser notification
        const notification = this.createNotification(
          'Application Waitlisted',
          `Your application for ${exhibitionName} has been waitlisted`,
          'stall_application_received',
          `/dashboard/applications/${applicationId}`
        );
        processNotification(notification);
      }

      return true;
    } catch (error) {
      console.error('Error sending waitlist notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications for application rejected
   */
  async notifyApplicationRejected(
    applicationId: string, 
    brandName: string, 
    exhibitionName: string, 
    rejectionReason: string
  ): Promise<boolean> {
    try {
      // Get application details
      const { data: application } = await supabase
        .from('stall_applications')
        .select(`
          *,
          exhibition:exhibitions(*)
        `)
        .eq('id', applicationId as Database['public']['Tables']['stall_applications']['Row']['id'])
        .single();

      if (application) {
        const stallApplication = application as unknown as StallApplication;

        // Get alternative exhibitions
        const { data: alternatives } = await supabase
          .from('exhibitions')
          .select('*')
          .neq('id', stallApplication.exhibition_id as Database['public']['Tables']['exhibitions']['Row']['id'])
          .gte('start_date', new Date().toISOString())
          .limit(3);

        // Send email notification
        await fetch(`${this.apiUrl}/api/email/application-rejected`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand_id: stallApplication.brand_id,
            exhibition_name: exhibitionName,
            exhibition_location: stallApplication.exhibition?.location || '',
            exhibition_date: stallApplication.exhibition?.start_date || '',
            stall_size: `${stallApplication.stall?.length || 0}x${stallApplication.stall?.width || 0}`,
            rejection_reason: rejectionReason,
            organizer_comments: stallApplication.message || '',
            alternative_exhibitions: alternatives || [],
            dashboard_link: `${window.location.origin}/dashboard/applications/${applicationId}`
          }),
        });

        // Send browser notification
        const notification = this.createNotification(
          'Application Rejected',
          `Your application for ${exhibitionName} has been rejected`,
          'stall_application_received',
          `/dashboard/applications/${applicationId}`
        );
        processNotification(notification);
      }

      return true;
    } catch (error) {
      console.error('Error sending rejection notifications:', error);
      return false;
    }
  }

  /**
   * Send contact form response notification
   */
  async notifyContactResponse(
    contactId: string, 
    email: string, 
    name: string, 
    subject: string, 
    message: string, 
    responseMessage: string
  ): Promise<boolean> {
    try {
      // Send email notification
      await fetch(`${this.apiUrl}/api/email/contact-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          response_message: responseMessage,
          support_ticket_id: contactId,
          support_link: `${window.location.origin}/support/tickets/${contactId}`
        }),
      });

      return true;
    } catch (error) {
      console.error('Error sending contact response notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const unifiedNotificationService = new UnifiedNotificationService();