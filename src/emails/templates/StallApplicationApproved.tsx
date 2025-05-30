import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';

interface StallApplicationApprovedProps {
  exhibitionTitle: string;
  brandName: string;
  paymentLink: string;
  approvedDate: string;
}

export const StallApplicationApprovedTemplate: React.FC<StallApplicationApprovedProps> = ({
  exhibitionTitle,
  brandName,
  paymentLink,
  approvedDate,
}) => {
  const previewText = `Stall Application Approved: ${exhibitionTitle}`;

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>Stall Application Approved</Heading>
        
        <Text style={text}>
          Hello {brandName},
        </Text>
        
        <Text style={text}>
          Great news! Your stall application for "{exhibitionTitle}" has been approved on {approvedDate}.
        </Text>

        <Text style={text}>
          To secure your stall, please complete the payment process by clicking the button below.
          The payment link will expire in 48 hours.
        </Text>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={paymentLink}
          >
            Complete Payment
          </Button>
        </Section>

        <Text style={text}>
          After completing the payment, you will receive a confirmation email with all the details about your stall.
        </Text>

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

export default StallApplicationApprovedTemplate; 