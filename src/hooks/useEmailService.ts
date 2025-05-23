import { useState } from 'react';
import emailService, {
  WelcomeEmailData,
  ExhibitionReminderEmailData,
  NewExhibitionEmailData,
  StallStatusEmailData
} from '../services/email/emailService';

/**
 * Hook for using email services in React components
 */
export function useEmailService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Reset the hook state
   */
  const resetState = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  /**
   * Send a welcome email to a new user
   * @param data - Welcome email data
   * @returns Promise with send result
   */
  const sendWelcomeEmail = async (data: WelcomeEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.sendWelcomeEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to send welcome email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Queue a welcome email to a new user
   * @param data - Welcome email data
   * @returns Promise with queue result
   */
  const queueWelcomeEmail = async (data: WelcomeEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.queueWelcomeEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to queue welcome email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send an exhibition reminder email
   * @param data - Exhibition reminder email data
   * @returns Promise with send result
   */
  const sendExhibitionReminderEmail = async (data: ExhibitionReminderEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.sendExhibitionReminderEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to send exhibition reminder email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Queue an exhibition reminder email
   * @param data - Exhibition reminder email data
   * @returns Promise with queue result
   */
  const queueExhibitionReminderEmail = async (data: ExhibitionReminderEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.queueExhibitionReminderEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to queue exhibition reminder email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a new exhibition notification email
   * @param data - New exhibition email data
   * @returns Promise with send result
   */
  const sendNewExhibitionEmail = async (data: NewExhibitionEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.sendNewExhibitionEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to send new exhibition email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Queue a new exhibition notification email
   * @param data - New exhibition email data
   * @returns Promise with queue result
   */
  const queueNewExhibitionEmail = async (data: NewExhibitionEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.queueNewExhibitionEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to queue new exhibition email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a stall application status email
   * @param data - Stall status email data
   * @returns Promise with send result
   */
  const sendStallStatusEmail = async (data: StallStatusEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.sendStallStatusEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to send stall status email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Queue a stall application status email
   * @param data - Stall status email data
   * @returns Promise with queue result
   */
  const queueStallStatusEmail = async (data: StallStatusEmailData) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.queueStallStatusEmail(data);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to queue stall status email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a test email to verify connectivity
   * @param to - Recipient email address
   * @returns Promise with test result
   */
  const sendTestEmail = async (to: string) => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.sendTestEmail(to);
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to send test email');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify email service connection
   * @returns Promise with verification result
   */
  const verifyConnection = async () => {
    try {
      resetState();
      setLoading(true);
      
      const result = await emailService.verifyConnection();
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        setError(result.error || 'Failed to verify email connection');
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    resetState,
    sendWelcomeEmail,
    queueWelcomeEmail,
    sendExhibitionReminderEmail,
    queueExhibitionReminderEmail,
    sendNewExhibitionEmail,
    queueNewExhibitionEmail,
    sendStallStatusEmail,
    queueStallStatusEmail,
    sendTestEmail,
    verifyConnection
  };
} 