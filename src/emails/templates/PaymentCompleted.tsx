import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';
import { formatCurrency } from '@/services/emailService';

interface PaymentCompletedProps {
  exhibitionTitle: string;
  brandName: string;
  paymentAmount: number;
  paymentDate: string;
  stallDetails: string;
}

export const PaymentCompletedTemplate: React.FC<PaymentCompletedProps> = ({
  exhibitionTitle,
  brandName,
  paymentAmount,
  paymentDate,
  stallDetails,
}) => {
  const previewText = `Payment Completed: ${exhibitionTitle}`;

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>Payment Completed</Heading>
        
        <Text style={text}>
          Hello {brandName},
        </Text>
        
        <Text style={text}>
          We are pleased to confirm that your payment for "{exhibitionTitle}" has been successfully processed on {paymentDate}.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailsTitle}>Payment Details:</Text>
          <Text style={detailsText}>
            <strong>Exhibition:</strong> {exhibitionTitle}<br />
            <strong>Amount Paid:</strong> {formatCurrency(paymentAmount)}<br />
            <strong>Payment Date:</strong> {paymentDate}<br />
            <strong>Stall Details:</strong><br />
            {stallDetails}
          </Text>
        </Section>

        <Text style={text}>
          Your stall has been confirmed, and you are all set for the exhibition. Please keep this email for your records.
        </Text>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={`https://exhibae-connect.com/dashboard/brand/exhibitions`}
          >
            View Exhibition Details
          </Button>
        </Section>

        <Text style={text}>
          If you have any questions or need assistance, please don't hesitate to contact our support team.
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

const detailsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  marginBottom: '12px',
};

const detailsText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a4a4a',
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

export default PaymentCompletedTemplate; 