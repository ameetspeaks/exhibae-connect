import { format } from 'date-fns';
import { ContactMessage } from '@/types/contact';

/**
 * Creates a mailto link for responding to a contact message
 * @param message The contact message to respond to
 * @returns A formatted mailto URL string
 */
export const createContactReplyMailto = (message: ContactMessage): string => {
  // Create email subject with Re: prefix
  const subject = `Re: ${message.subject}`;
  
  // Create email body with the original message quoted
  const body = `Dear ${message.name},

Thank you for your enquiry!

[Your response here]

Best regards,
ExhiBae Support Team

----- Original Message -----
From: ${message.name} (${message.email})
Date: ${format(new Date(message.created_at), 'PPpp')}
Subject: ${message.subject}

${message.message}`;
  
  // Create mailto link
  return `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}; 