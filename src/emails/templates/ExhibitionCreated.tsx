import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';
import { formatDate } from '@/services/emailService';

interface ExhibitionCreatedProps {
  exhibitionTitle: string;
  organiserName: string;
  exhibitionId: string;
  createdDate: Date;
}

export const ExhibitionCreatedTemplate: React.FC<ExhibitionCreatedProps> = ({
  exhibitionTitle,
  organiserName,
  exhibitionId,
  createdDate,
}) => {
  const previewText = `New Exhibition Created: ${exhibitionTitle}`;

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>New Exhibition Created</Heading>
        
        <Text style={text}>
          Hello {organiserName},
        </Text>
        
        <Text style={text}>
          Your exhibition "{exhibitionTitle}" has been successfully created on {formatDate(createdDate)}.
          Our team will review your exhibition details and get back to you within 24-48 hours.
        </Text>

        <Text style={text}>
          While you wait for approval, you can:
        </Text>

        <ul style={list}>
          <li style={listItem}>Add more details to your exhibition</li>
          <li style={listItem}>Upload images and documents</li>
          <li style={listItem}>Set up stall configurations</li>
          <li style={listItem}>Invite brands to participate</li>
        </ul>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={`https://exhibae-connect.com/dashboard/organiser/exhibitions/${exhibitionId}`}
          >
            View Exhibition
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

const list = {
  margin: '16px 0',
  paddingLeft: '24px',
};

const listItem = {
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

export default ExhibitionCreatedTemplate; 