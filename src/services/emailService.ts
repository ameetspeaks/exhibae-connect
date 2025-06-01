import { render } from '@react-email/render';
import { format } from 'date-fns';
import type { EmailType, EmailData } from '@/types/email-logs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EMAIL_API_URL = `${API_URL}/api/email`;

export async function sendEmail(
  type: EmailType,
  data: EmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${EMAIL_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format date
export const formatDate = (date: Date): string => {
  return format(date, 'MMMM dd, yyyy');
}; 