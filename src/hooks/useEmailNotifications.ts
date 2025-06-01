import { useCallback } from 'react';
import { sendEmail } from '@/services/emailService';
import { useToast } from '@/components/ui/use-toast';
import type {
  ExhibitionCreatedData,
  ExhibitionStatusData,
  ExhibitionInterestData,
  StallApplicationApprovedData,
  PaymentCompletedData,
  PaymentReminderData,
  WelcomeEmailData
} from '@/types/email-logs';

export const useEmailNotifications = () => {
  const { toast } = useToast();

  const sendExhibitionCreatedEmail = useCallback(async (
    exhibitionTitle: string,
    organiserName: string,
    organiserEmail: string,
    exhibitionId: string,
    managerEmail: string
  ) => {
    try {
      // Send to organiser
      const organiserData: ExhibitionCreatedData = {
        to: organiserEmail,
        exhibitionTitle,
        organiserName,
        exhibitionId,
        createdDate: new Date()
      };
      await sendEmail('exhibition_created', organiserData);

      // Send to manager
      const managerData: ExhibitionCreatedData = {
        to: managerEmail,
        exhibitionTitle,
        organiserName,
        exhibitionId,
        createdDate: new Date()
      };
      await sendEmail('exhibition_created', managerData);

      toast({
        title: 'Notification sent',
        description: 'Email notifications have been sent successfully.',
      });
    } catch (error) {
      console.error('Error sending exhibition created email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email notifications.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendExhibitionStatusEmail = useCallback(async (
    exhibitionTitle: string,
    organiserName: string,
    organiserEmail: string,
    status: string,
    dashboardLink: string
  ) => {
    try {
      const data: ExhibitionStatusData = {
        to: organiserEmail,
        exhibitionTitle,
        organiserName,
        status,
        dashboardLink,
        updatedDate: new Date()
      };
      await sendEmail('exhibition_status_update', data);

      toast({
        title: 'Notification sent',
        description: 'Status update notification has been sent successfully.',
      });
    } catch (error) {
      console.error('Error sending exhibition status email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send status update notification.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendExhibitionInterestEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    brandPhone: string,
    organiserEmail: string
  ) => {
    try {
      const data: ExhibitionInterestData = {
        to: organiserEmail,
        exhibitionTitle,
        brandName,
        brandEmail,
        brandPhone,
        interestDate: new Date()
      };
      await sendEmail('exhibition_interest', data);

      toast({
        title: 'Notification sent',
        description: 'Interest notification has been sent to the organiser.',
      });
    } catch (error) {
      console.error('Error sending exhibition interest email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send interest notification.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendStallApplicationApprovedEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    paymentLink: string
  ) => {
    try {
      const data: StallApplicationApprovedData = {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        paymentLink,
        approvedDate: new Date()
      };
      await sendEmail('application_approved', data);

      toast({
        title: 'Notification sent',
        description: 'Application approval notification has been sent to the brand.',
      });
    } catch (error) {
      console.error('Error sending stall application approved email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send approval notification.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendPaymentCompletedEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    organiserEmail: string,
    paymentAmount: number,
    stallDetails: string
  ) => {
    try {
      // Send to brand
      const brandData: PaymentCompletedData = {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        paymentAmount,
        paymentDate: new Date(),
        stallDetails
      };
      await sendEmail('payment_completed', brandData);

      // Send to organiser
      const organiserData: PaymentCompletedData = {
        to: organiserEmail,
        exhibitionTitle,
        brandName,
        paymentAmount,
        paymentDate: new Date(),
        stallDetails
      };
      await sendEmail('payment_completed', organiserData);

      toast({
        title: 'Notification sent',
        description: 'Payment completion notifications have been sent.',
      });
    } catch (error) {
      console.error('Error sending payment completed email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send payment completion notifications.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendPaymentReminderEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    dueDate: Date,
    paymentAmount: number,
    paymentLink: string
  ) => {
    try {
      const data: PaymentReminderData = {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        dueDate,
        paymentAmount,
        paymentLink
      };
      await sendEmail('payment_reminder', data);

      toast({
        title: 'Notification sent',
        description: 'Payment reminder has been sent to the brand.',
      });
    } catch (error) {
      console.error('Error sending payment reminder email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send payment reminder.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sendWelcomeEmail = useCallback(async (
    userName: string,
    userEmail: string,
    userRole: string
  ) => {
    try {
      const data: WelcomeEmailData = {
        to: userEmail,
        userName,
        userRole
      };
      await sendEmail('welcome_email', data);

      toast({
        title: 'Welcome email sent',
        description: 'Welcome email has been sent to the new user.',
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send welcome email.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    sendExhibitionCreatedEmail,
    sendExhibitionStatusEmail,
    sendExhibitionInterestEmail,
    sendStallApplicationApprovedEmail,
    sendPaymentCompletedEmail,
    sendPaymentReminderEmail,
    sendWelcomeEmail
  };
}; 