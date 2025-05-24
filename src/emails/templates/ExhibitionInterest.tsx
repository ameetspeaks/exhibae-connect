import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';
import { formatDate } from '@/services/emailService';

interface ExhibitionInterestProps {
  exhibitionTitle: string;
  brandName: string;
  brandEmail: string;
  brandPhone: string;
  interestDate: Date;
}

export const ExhibitionInterestTemplate: React.FC<ExhibitionInterestProps> = ({
  exhibitionTitle,
  brandName,
  brandEmail,
  brandPhone,
  interestDate,
}) => {
  const previewText = `New Exhibition Interest: ${exhibitionTitle}`;

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>New Exhibition Interest</Heading>
        
        <Text style={text}>
          Hello Organiser,
        </Text>
        
        <Text style={text}>
          A brand has shown interest in your exhibition "{exhibitionTitle}".
        </Text>

        <Section style={detailsBox}>
          <Text style={detailsTitle}>Brand Details:</Text>
          <Text style={detailsText}>
            <strong>Name:</strong> {brandName}<br />
            <strong>Email:</strong> {brandEmail}<br />
            <strong>Phone:</strong> {brandPhone}<br />
            <strong>Interest Date:</strong> {formatDate(interestDate)}
          </Text>
        </Section>

        <Text style={text}>
          Please contact the brand at your earliest convenience to discuss their interest in participating in your exhibition.
        </Text>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={`mailto:${brandEmail}`}
          >
            Contact Brand
          </Button>
        </Section>

        <Text style={text}>
          You can also view and manage all brand interests from your exhibition dashboard.
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

export default ExhibitionInterestTemplate; 