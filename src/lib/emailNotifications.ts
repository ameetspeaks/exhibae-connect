import { EmailService } from '@/lib/email/email-service';

export interface StallApplicationEmailData {
  organizer_id: string;
  brand_id: string;
  exhibition_name: string;
  stall_size: string;
  product_categories: string[];
  special_requirements: string;
  application_date: string;
  review_link: string;
}

export interface StallApplicationStatusEmailData {
  brand_id: string;
  exhibition_name: string;
  exhibition_location: string;
  exhibition_date: string;
  stall_size: string;
  stall_number: string;
  status: string;
  organizer_comments: string;
  payment_amount: number;
  payment_deadline: string;
  payment_link: string;
  dashboard_link: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const sendStallApplicationEmail = async (data: StallApplicationEmailData) => {
  try {
    const emailContent = {
      to: data.organizer_id, // This should be the organizer's email address
      subject: `New Stall Application for ${data.exhibition_name}`,
      html: `
        <h2>New Stall Application</h2>
        <p>Exhibition: ${data.exhibition_name}</p>
        <p>Stall Size: ${data.stall_size}</p>
        <p>Product Categories: ${data.product_categories.join(', ') || 'Not specified'}</p>
        <p>Special Requirements: ${data.special_requirements || 'None'}</p>
        <p>Application Date: ${new Date(data.application_date).toLocaleDateString()}</p>
        <p><a href="${data.review_link}">Review Application</a></p>
      `
    };

    const response = await EmailService.sendEmail(emailContent);

    if (!response.success) {
      throw new Error(response.error || 'Failed to send stall application email');
    }

    return response;
  } catch (error) {
    console.error('Error sending stall application email:', error);
    throw error;
  }
};

export const sendStallApplicationStatusEmail = async (data: StallApplicationStatusEmailData) => {
  try {
    const emailContent = {
      to: data.brand_id, // This should be the brand's email address
      subject: `Stall Application Status Update - ${data.exhibition_name}`,
      html: `
        <h2>Stall Application Status Update</h2>
        <p>Exhibition: ${data.exhibition_name}</p>
        <p>Location: ${data.exhibition_location}</p>
        <p>Date: ${new Date(data.exhibition_date).toLocaleDateString()}</p>
        <p>Stall Size: ${data.stall_size}</p>
        <p>Stall Number: ${data.stall_number}</p>
        <p>Status: ${data.status}</p>
        <p>Comments: ${data.organizer_comments || 'No comments'}</p>
        ${data.status.toLowerCase() === 'approved' ? `
          <p>Payment Amount: $${data.payment_amount}</p>
          <p>Payment Deadline: ${data.payment_deadline ? new Date(data.payment_deadline).toLocaleDateString() : 'To be determined'}</p>
          <p><a href="${data.payment_link}">Make Payment</a></p>
        ` : ''}
        <p><a href="${data.dashboard_link}">View Details</a></p>
      `
    };

    const response = await EmailService.sendEmail(emailContent);

    if (!response.success) {
      throw new Error(response.error || 'Failed to send stall application status email');
    }

    return response;
  } catch (error) {
    console.error('Error sending stall application status email:', error);
    throw error;
  }
}; 