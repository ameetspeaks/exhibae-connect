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
}

// Export singleton instance
export const managerNotificationService = new ManagerNotificationService(); 