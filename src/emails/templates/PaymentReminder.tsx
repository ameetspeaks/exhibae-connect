import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';

interface PaymentReminderProps {
  brandName: string;
  exhibitionTitle: string;
  paymentAmount: number;
  dueDate: string;
  paymentLink: string;
}

export const PaymentReminderTemplate: React.FC<PaymentReminderProps> = ({
  brandName,
  exhibitionTitle,
  paymentAmount,
  dueDate,
  paymentLink,
}) => {
  const previewText = `Payment Reminder: ${exhibitionTitle}`;

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>Payment Reminder</Heading>
        
        <Text style={text}>
          Hello {brandName},
        </Text>
        
        <Text style={text}>
          This is a friendly reminder that your payment for the exhibition "{exhibitionTitle}" is due soon.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailsText}>
            <strong>Exhibition:</strong> {exhibitionTitle}
          </Text>
          <Text style={detailsText}>
            <strong>Amount Due:</strong> ₹{paymentAmount.toLocaleString()}
          </Text>
          <Text style={detailsText}>
            <strong>Due Date:</strong> {dueDate}
          </Text>
        </Section>

        <Text style={text}>
          To ensure your stall reservation is confirmed, please complete the payment before the due date.
          Late payments may result in the cancellation of your stall reservation.
        </Text>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={paymentLink}
          >
            Make Payment Now
          </Button>
        </Section>

        <Text style={text}>
          If you have already made the payment, please disregard this reminder.
          If you need any assistance or have questions about the payment process,
          please contact our support team at support@exhibae-connect.com.
        </Text>

        <Text style={text}>
          Best regards,<br />
          The Exhibae Connect Team
        </Text>
      </Section>
    </BaseTemplate>
  );
};

// Styles
const section = {
  padding: '24px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  color: '#1a1a1a',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a4a4a',
  marginBottom: '16px',
};

const detailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const detailsText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a4a4a',
  marginBottom: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
};

export default PaymentReminderTemplate; 