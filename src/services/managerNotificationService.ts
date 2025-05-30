import { supabase } from '@/integrations/supabase/client';
import { AppNotification } from '@/types/notification';

/**
 * Service to handle sending notifications to managers
 */
class ManagerNotificationService {
  /**
   * Send notification to all users with MANAGER role
   */
  async sendToManagers(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    try {
      // Get all manager users
      const { data: managers, error: managerError } = await supabase
        .from('users')
        .select('id')
        .eq('app_metadata->>role', 'MANAGER');

      if (managerError) {
        console.error('Error fetching managers:', managerError);
        throw managerError;
      }

      if (!managers || managers.length === 0) {
        console.log('No managers found to notify');
        return false;
      }

      // Prepare notifications for all managers
      const notifications = managers.map(manager => ({
        user_id: manager.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        is_read: false
      }));

      // Insert notifications for all managers
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting manager notifications:', insertError);
        throw insertError;
      }

      console.log(`Notifications sent to ${managers.length} managers`);
      return true;
    } catch (error) {
      console.error('Error in sendToManagers:', error);
      return false;
    }
  }

  /**
   * Notify managers about a new user registration
   */
  async notifyNewUserRegistration(userId: string, displayName: string) {
    if (!userId || !displayName) {
      console.error('Missing required parameters for notifyNewUserRegistration');
      return false;
    }
    
    return this.sendToManagers({
      title: 'New User Registration',
      message: `${displayName} has registered on the platform`,
      type: 'user_registered',
      link: `/dashboard/users/${userId}`
    });
  }

  /**
   * Notify managers about a new exhibition being created
   */
  async notifyExhibitionCreated(exhibitionId: string, exhibitionName: string) {
    if (!exhibitionId || !exhibitionName) {
      console.error('Missing required parameters for notifyExhibitionCreated');
      return false;
    }
    
    return this.sendToManagers({
      title: 'New Exhibition Created',
      message: `A new exhibition "${exhibitionName}" has been created`,
      type: 'exhibition_created',
      link: `/dashboard/exhibitions/${exhibitionId}`
    });
  }

  /**
   * Notify managers about a stall booking
   */
  async notifyStallBooked(stallId: string, exhibitionName: string, brandName: string) {
    if (!stallId || !exhibitionName || !brandName) {
      console.error('Missing required parameters for notifyStallBooked');
      return false;
    }
    
    return this.sendToManagers({
      title: 'Stall Booked',
      message: `${brandName} has booked a stall for ${exhibitionName}`,
      type: 'stall_booked',
      link: `/dashboard/stalls/${stallId}`
    });
  }

  /**
   * Notify managers about an application received
   */
  async notifyApplicationReceived(applicationId: string, brandName: string, exhibitionName: string) {
    if (!applicationId || !brandName || !exhibitionName) {
      console.error('Missing required parameters for notifyApplicationReceived');
      return false;
    }
    
    return this.sendToManagers({
      title: 'Application Received',
      message: `${brandName} has applied for ${exhibitionName}`,
      type: 'application_received',
      link: `/dashboard/applications/${applicationId}`
    });
  }

  /**
   * Notify managers about an exhibition status update
   */
  async notifyExhibitionStatusUpdate(exhibitionId: string, exhibitionName: string, newStatus: string) {
    if (!exhibitionId || !exhibitionName || !newStatus) {
      console.error('Missing required parameters for notifyExhibitionStatusUpdate');
      return false;
    }
    
    return this.sendToManagers({
      title: 'Exhibition Status Updated',
      message: `Exhibition "${exhibitionName}" status has been updated to ${newStatus}`,
      type: 'exhibition_status_updated',
      link: `/dashboard/exhibitions/${exhibitionId}`
    });
  }

  /**
   * Notify managers about a payment status update
   */
  async notifyPaymentStatusUpdate(paymentId: string, exhibitionName: string, brandName: string, newStatus: string) {
    if (!paymentId || !exhibitionName || !brandName || !newStatus) {
      console.error('Missing required parameters for notifyPaymentStatusUpdate');
      return false;
    }
    
    return this.sendToManagers({
      title: 'Payment Status Updated',
      message: `Payment status for ${brandName} (${exhibitionName}) has been updated to ${newStatus}`,
      type: 'payment_status_updated',
      link: `/dashboard/payments/${paymentId}`
    });
  }

  /**
   * Notify managers about a new stall application
   */
  async notifyStallApplicationReceived(applicationId: string, brandName: string, exhibitionName: string) {
    if (!applicationId || !brandName || !exhibitionName) {
      console.error('Missing required parameters for notifyStallApplicationReceived');
      return false;
    }
    
    return this.sendToManagers({
      title: 'New Stall Application',
      message: `${brandName} has submitted a stall application for ${exhibitionName}`,
      type: 'stall_application_received',
      link: `/dashboard/applications/${applicationId}`
    });
  }

  /**
   * Notify managers about a stall approval
   */
  async notifyStallApproved(stallId: string, brandName: string, exhibitionName: string) {
    if (!stallId || !brandName || !exhibitionName) {
      console.error('Missing required parameters for notifyStallApproved');
      return false;
    }
    
    return this.sendToManagers({
      title: 'Stall Approved',
      message: `Stall for ${brandName} in ${exhibitionName} has been approved`,
      type: 'stall_approved',
      link: `/dashboard/stalls/${stallId}`
    });
  }
}

// Export singleton instance
export const managerNotificationService = new ManagerNotificationService(); 