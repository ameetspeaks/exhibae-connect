import { managerNotificationService } from './managerNotificationService';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { processNotification } from './notificationService';
import { supabase } from '@/integrations/supabase/client';
import { AppNotification } from '@/types/notification';

class UnifiedNotificationService {
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

  /**
   * Send notifications for exhibition creation
   */
  async notifyExhibitionCreated(exhibitionId: string, exhibitionName: string, organiserName: string, organiserEmail: string, managerEmail: string) {
    try {
      // Send manager notification
      await managerNotificationService.notifyExhibitionCreated(exhibitionId, exhibitionName);

      // Send email notifications
      const emailNotifications = useEmailNotifications();
      await emailNotifications.sendExhibitionCreatedEmail(
        exhibitionName,
        organiserName,
        organiserEmail,
        exhibitionId,
        managerEmail
      );

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
  async notifyExhibitionStatusUpdate(exhibitionId: string, exhibitionName: string, newStatus: string) {
    try {
      // Send manager notification
      await managerNotificationService.notifyExhibitionStatusUpdate(exhibitionId, exhibitionName, newStatus);

      // Get exhibition details for email
      const { data: exhibition } = await supabase
        .from('exhibitions')
        .select('organiser_id')
        .eq('id', exhibitionId)
        .single();

      if (exhibition) {
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
  async notifyStallApplication(applicationId: string, brandName: string, exhibitionName: string) {
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
  async notifyStallApproved(stallId: string, brandName: string, exhibitionName: string, brandEmail: string) {
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
  async notifyPaymentStatusUpdate(paymentId: string, exhibitionName: string, brandName: string, newStatus: string, brandEmail: string) {
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
}

// Export singleton instance
export const unifiedNotificationService = new UnifiedNotificationService(); 