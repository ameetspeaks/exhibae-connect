import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/services/notificationSoundService';
import { UserRole } from '@/types/auth';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

class StallNotificationService {
  /**
   * Send notifications when a brand applies for a stall
   */
  async notifyStallApplication(
    stallId: string,
    stallName: string,
    exhibitionId: string,
    exhibitionTitle: string,
    brandName: string,
    organiserId: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id'>[]>();

      if (!managers) return false;

      const notifications: NotificationInsert[] = [
        // Notification for organiser
        {
          user_id: organiserId,
          title: 'New Stall Application',
          message: `${brandName} has applied for stall "${stallName}" in your exhibition "${exhibitionTitle}"`,
          type: 'stall_application',
          link: `/dashboard/organiser/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        },
        // Notifications for all managers
        ...managers.map(manager => ({
          user_id: manager.id,
          title: 'New Stall Application',
          message: `${brandName} has applied for stall "${stallName}" in exhibition "${exhibitionTitle}"`,
          type: 'stall_application',
          link: `/dashboard/manager/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        }))
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      playNotificationSound('stall_application');
      return true;
    } catch (error) {
      console.error('Error sending stall application notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications when an organiser approves a stall application
   */
  async notifyStallApplicationApproval(
    stallId: string,
    stallName: string,
    exhibitionId: string,
    exhibitionTitle: string,
    brandId: string,
    brandName: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id'>[]>();

      if (!managers) return false;

      const notifications: NotificationInsert[] = [
        // Notification for brand
        {
          user_id: brandId,
          title: 'Stall Application Approved',
          message: `Your application for stall "${stallName}" in exhibition "${exhibitionTitle}" has been approved. Please proceed with payment.`,
          type: 'stall_application_approved',
          link: `/dashboard/brand/exhibitions/${exhibitionId}/stalls/${stallId}/payment`,
          is_read: false,
        },
        // Notifications for all managers
        ...managers.map(manager => ({
          user_id: manager.id,
          title: 'Stall Application Approved',
          message: `Application for stall "${stallName}" by ${brandName} has been approved`,
          type: 'stall_application_approved',
          link: `/dashboard/manager/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        }))
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      playNotificationSound('stall_application_approved');
      return true;
    } catch (error) {
      console.error('Error sending stall approval notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications when a brand completes payment for a stall
   */
  async notifyStallPaymentComplete(
    stallId: string,
    stallName: string,
    exhibitionId: string,
    exhibitionTitle: string,
    brandName: string,
    organiserId: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id'>[]>();

      if (!managers) return false;

      const notifications: NotificationInsert[] = [
        // Notification for organiser
        {
          user_id: organiserId,
          title: 'Stall Payment Received',
          message: `${brandName} has completed payment for stall "${stallName}" in your exhibition "${exhibitionTitle}"`,
          type: 'stall_payment_complete',
          link: `/dashboard/organiser/exhibitions/${exhibitionId}/stalls/${stallId}/review`,
          is_read: false,
        },
        // Notifications for all managers
        ...managers.map(manager => ({
          user_id: manager.id,
          title: 'Stall Payment Received',
          message: `${brandName} has completed payment for stall "${stallName}" in exhibition "${exhibitionTitle}"`,
          type: 'stall_payment_complete',
          link: `/dashboard/manager/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        }))
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      playNotificationSound('stall_payment_complete');
      return true;
    } catch (error) {
      console.error('Error sending payment completion notifications:', error);
      return false;
    }
  }

  /**
   * Send notifications when an organiser approves a payment and confirms booking
   */
  async notifyStallBookingConfirmed(
    stallId: string,
    stallName: string,
    exhibitionId: string,
    exhibitionTitle: string,
    brandId: string,
    brandName: string
  ) {
    try {
      // Get all managers
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', UserRole.MANAGER)
        .returns<Pick<Profile, 'id'>[]>();

      if (!managers) return false;

      const notifications: NotificationInsert[] = [
        // Notification for brand
        {
          user_id: brandId,
          title: 'Stall Booking Confirmed',
          message: `Your booking for stall "${stallName}" in exhibition "${exhibitionTitle}" has been confirmed.`,
          type: 'stall_booking_confirmed',
          link: `/dashboard/brand/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        },
        // Notifications for all managers
        ...managers.map(manager => ({
          user_id: manager.id,
          title: 'Stall Booking Confirmed',
          message: `Booking for stall "${stallName}" by ${brandName} has been confirmed`,
          type: 'stall_booking_confirmed',
          link: `/dashboard/manager/exhibitions/${exhibitionId}/stalls/${stallId}`,
          is_read: false,
        }))
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      playNotificationSound('stall_booking_confirmed');
      return true;
    } catch (error) {
      console.error('Error sending booking confirmation notifications:', error);
      return false;
    }
  }
}

export const stallNotificationService = new StallNotificationService(); 