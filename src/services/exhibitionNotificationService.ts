import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/services/notificationSoundService';
import { UserRole } from '@/types/auth';
import { AppNotification } from '@/types/notification';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

class ExhibitionNotificationService {
  /**
   * Send notification when an exhibition is created by organiser
   */
  async notifyManagerOfNewExhibition(
    exhibitionId: string,
    exhibitionTitle: string,
    organiserName: string,
    organiserId: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id' | 'email'>[]>();

      if (!managers || managers.length === 0) return false;

      // Create notifications for all managers
      const notifications: NotificationInsert[] = managers.map(manager => ({
        user_id: manager.id,
        title: 'New Exhibition Created',
        message: `${organiserName} has created a new exhibition: "${exhibitionTitle}"`,
        type: 'exhibition_created',
        link: `/dashboard/manager/exhibitions/${exhibitionId}`,
        is_read: false,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Play notification sound for managers who are currently logged in
      playNotificationSound('exhibition_created');

      return true;
    } catch (error) {
      console.error('Error sending exhibition creation notification:', error);
      return false;
    }
  }

  /**
   * Send notification when an exhibition is published by manager
   */
  async notifyOrganiserOfPublishedExhibition(
    exhibitionId: string,
    exhibitionTitle: string,
    organiserId: string
  ) {
    try {
      const notification: NotificationInsert = {
        user_id: organiserId,
        title: 'Exhibition Published',
        message: `Your exhibition "${exhibitionTitle}" has been published`,
        type: 'exhibition_status_updated',
        link: `/dashboard/organiser/exhibitions/${exhibitionId}`,
        is_read: false,
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      // Play notification sound if the organiser is currently logged in
      playNotificationSound('exhibition_status_updated');

      return true;
    } catch (error) {
      console.error('Error sending exhibition published notification:', error);
      return false;
    }
  }

  /**
   * Send notification when exhibition status is changed by manager
   */
  async notifyOrganiserOfStatusChange(
    exhibitionId: string,
    exhibitionTitle: string,
    organiserId: string,
    newStatus: string
  ) {
    try {
      const notification: NotificationInsert = {
        user_id: organiserId,
        title: 'Exhibition Status Updated',
        message: `Your exhibition "${exhibitionTitle}" status has been changed to ${newStatus}`,
        type: 'exhibition_status_updated',
        link: `/dashboard/organiser/exhibitions/${exhibitionId}`,
        is_read: false,
      };

      const { error } = await supabase
        .from('notifications')
        .insert(notification);

      if (error) throw error;

      // Play notification sound if the organiser is currently logged in
      playNotificationSound('exhibition_status_updated');

      return true;
    } catch (error) {
      console.error('Error sending exhibition status update notification:', error);
      return false;
    }
  }

  /**
   * Send notification when exhibition details are updated by organiser
   */
  async notifyManagerOfExhibitionUpdate(
    exhibitionId: string,
    exhibitionTitle: string,
    organiserName: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id' | 'email'>[]>();

      if (!managers || managers.length === 0) return false;

      // Create notifications for all managers
      const notifications: NotificationInsert[] = managers.map(manager => ({
        user_id: manager.id,
        title: 'Exhibition Updated',
        message: `${organiserName} has updated the exhibition: "${exhibitionTitle}"`,
        type: 'exhibition_updated',
        link: `/dashboard/manager/exhibitions/${exhibitionId}`,
        is_read: false,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Play notification sound for managers who are currently logged in
      playNotificationSound('exhibition_updated');

      return true;
    } catch (error) {
      console.error('Error sending exhibition update notification:', error);
      return false;
    }
  }
}

export const exhibitionNotificationService = new ExhibitionNotificationService(); 