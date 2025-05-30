import { render } from '@react-email/render';
import { format } from 'date-fns';

// Email templates
import ExhibitionCreatedTemplate from '../emails/templates/ExhibitionCreated';
import ExhibitionInterestTemplate from '../emails/templates/ExhibitionInterest';
import StallApplicationApprovedTemplate from '../emails/templates/StallApplicationApproved';
import PaymentCompletedTemplate from '../emails/templates/PaymentCompleted';
import PaymentReminderTemplate from '../emails/templates/PaymentReminder';
import WelcomeEmailTemplate from '../emails/templates/WelcomeEmail';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EMAIL_API_URL = `${API_URL}/api/email`;

// Email types
export type EmailType =
  | 'exhibition_created'
  | 'exhibition_interest'
  | 'stall_application_approved'
  | 'payment_completed'
  | 'payment_reminder'
  | 'welcome';

// Email data interfaces
interface BaseEmailData {
  to: string;
  subject?: string;
}

interface ExhibitionCreatedData extends BaseEmailData {
  organiserName: string;
  exhibitionTitle: string;
  exhibitionId: string;
  createdDate: string | Date;
}

interface ExhibitionInterestData extends BaseEmailData {
  organiserName: string;
  brandName: string;
  brandEmail: string;
  brandPhone: string;
  exhibitionTitle: string;
  interestDate: string | Date;
}

interface StallApplicationApprovedData extends BaseEmailData {
  brandName: string;
  exhibitionTitle: string;
  paymentLink: string;
  approvedDate: string | Date;
}

interface PaymentCompletedData extends BaseEmailData {
  brandName: string;
  exhibitionTitle: string;
  paymentAmount: number;
  paymentDate: string | Date;
  stallDetails: string;
}

interface PaymentReminderData extends BaseEmailData {
  brandName: string;
  exhibitionTitle: string;
  paymentAmount: number;
  dueDate: string | Date;
  paymentLink: string;
}

interface WelcomeEmailData extends BaseEmailData {
  userName: string;
  userRole: string;
}

type EmailData =
  | ExhibitionCreatedData
  | ExhibitionInterestData
  | StallApplicationApprovedData
  | PaymentCompletedData
  | PaymentReminderData
  | WelcomeEmailData;

const ensureDate = (date: string | Date): Date => {
  return date instanceof Date ? date : new Date(date);
};

// Helper function to format date
export function formatDate(date: string | Date): string {
  return format(ensureDate(date), 'MMMM d, yyyy');
}

export const sendEmail = async (type: EmailType, data: EmailData) => {
  let html: string;
  let subject: string;

  switch (type) {
    case 'exhibition_created': {
      const createdData = data as ExhibitionCreatedData;
      html = await render(
        ExhibitionCreatedTemplate({
          organiserName: createdData.organiserName,
          exhibitionTitle: createdData.exhibitionTitle,
          exhibitionId: createdData.exhibitionId,
          createdDate: formatDate(createdData.createdDate),
        })
      );
      subject = createdData.subject || `New Exhibition Created: ${createdData.exhibitionTitle}`;
      break;
    }

    case 'exhibition_interest': {
      const interestData = data as ExhibitionInterestData;
      html = await render(
        ExhibitionInterestTemplate({
          brandName: interestData.brandName,
          brandEmail: interestData.brandEmail,
          brandPhone: interestData.brandPhone,
          exhibitionTitle: interestData.exhibitionTitle,
          interestDate: formatDate(interestData.interestDate),
        })
      );
      subject = interestData.subject || `New Interest in ${interestData.exhibitionTitle}`;
      break;
    }

    case 'stall_application_approved': {
      const approvedData = data as StallApplicationApprovedData;
      html = await render(
        StallApplicationApprovedTemplate({
          brandName: approvedData.brandName,
          exhibitionTitle: approvedData.exhibitionTitle,
          paymentLink: approvedData.paymentLink,
          approvedDate: formatDate(approvedData.approvedDate),
        })
      );
      subject = approvedData.subject || `Stall Application Approved: ${approvedData.exhibitionTitle}`;
      break;
    }

    case 'payment_completed': {
      const completedData = data as PaymentCompletedData;
      html = await render(
        PaymentCompletedTemplate({
          brandName: completedData.brandName,
          exhibitionTitle: completedData.exhibitionTitle,
          paymentAmount: completedData.paymentAmount,
          paymentDate: formatDate(completedData.paymentDate),
          stallDetails: completedData.stallDetails,
        })
      );
      subject = completedData.subject || `Payment Confirmation: ${completedData.exhibitionTitle}`;
      break;
    }

    case 'payment_reminder': {
      const reminderData = data as PaymentReminderData;
      html = await render(
        PaymentReminderTemplate({
          brandName: reminderData.brandName,
          exhibitionTitle: reminderData.exhibitionTitle,
          paymentAmount: reminderData.paymentAmount,
          dueDate: formatDate(reminderData.dueDate),
          paymentLink: reminderData.paymentLink,
        })
      );
      subject = reminderData.subject || `Payment Reminder: ${reminderData.exhibitionTitle}`;
      break;
    }

    case 'welcome': {
      const welcomeData = data as WelcomeEmailData;
      html = await render(
        WelcomeEmailTemplate({
          userName: welcomeData.userName,
          userRole: welcomeData.userRole,
        })
      );
      subject = welcomeData.subject || `Welcome to Exhibae Connect, ${welcomeData.userName}!`;
      break;
    }

    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  try {
    const response = await fetch(`${EMAIL_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
} 