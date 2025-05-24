import { useCallback } from 'react';
import { sendEmail } from '@/services/emailService';
import { useToast } from '@/components/ui/use-toast';

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
      await sendEmail('exhibition_created', {
        to: organiserEmail,
        exhibitionTitle,
        organiserName,
        exhibitionId,
        createdDate: new Date()
      });

      // Send to manager
      await sendEmail('exhibition_created', {
        to: managerEmail,
        exhibitionTitle,
        organiserName,
        exhibitionId,
        createdDate: new Date()
      });

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
      await sendEmail('exhibition_interest', {
        to: organiserEmail,
        exhibitionTitle,
        brandName,
        brandEmail,
        brandPhone,
        interestDate: new Date()
      });

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
    }
  }, [toast]);

  const sendStallApplicationApprovedEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    paymentLink: string
  ) => {
    try {
      await sendEmail('stall_application_approved', {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        paymentLink,
        approvedDate: new Date()
      });

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
      await sendEmail('payment_completed', {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        paymentAmount,
        paymentDate: new Date(),
        stallDetails
      });

      // Send to organiser
      await sendEmail('payment_completed', {
        to: organiserEmail,
        exhibitionTitle,
        brandName,
        paymentAmount,
        paymentDate: new Date(),
        stallDetails
      });

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
    }
  }, [toast]);

  const sendPaymentReminderEmail = useCallback(async (
    exhibitionTitle: string,
    brandName: string,
    brandEmail: string,
    dueDate: Date,
    paymentAmount: number
  ) => {
    try {
      await sendEmail('payment_reminder', {
        to: brandEmail,
        exhibitionTitle,
        brandName,
        dueDate,
        paymentAmount
      });

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
    }
  }, [toast]);

  const sendWelcomeEmail = useCallback(async (
    userName: string,
    userEmail: string,
    userRole: string
  ) => {
    try {
      await sendEmail('welcome_email', {
        to: userEmail,
        userName,
        userRole
      });

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
    }
  }, [toast]);

  return {
    sendExhibitionCreatedEmail,
    sendExhibitionInterestEmail,
    sendStallApplicationApprovedEmail,
    sendPaymentCompletedEmail,
    sendPaymentReminderEmail,
    sendWelcomeEmail
  };
}; 