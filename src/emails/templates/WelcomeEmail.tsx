import React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import BaseTemplate from '../components/BaseTemplate';

interface WelcomeEmailProps {
  userName: string;
  userRole: string;
}

export const WelcomeEmailTemplate: React.FC<WelcomeEmailProps> = ({
  userName,
  userRole,
}) => {
  const previewText = `Welcome to Exhibae Connect, ${userName}!`;

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'brand':
        return {
          title: 'Welcome to Exhibae Connect for Brands',
          description: 'As a brand, you can now browse exhibitions, express interest, and apply for stalls.',
          features: [
            'Browse upcoming exhibitions',
            'Express interest in exhibitions',
            'Apply for stalls',
            'Manage your applications',
            'Track payments and receipts'
          ],
          buttonText: 'Browse Exhibitions',
          buttonLink: 'https://exhibae-connect.com/dashboard/brand/exhibitions'
        };
      case 'organiser':
        return {
          title: 'Welcome to Exhibae Connect for Organisers',
          description: 'As an organiser, you can now create and manage exhibitions, handle stall applications, and track payments.',
          features: [
            'Create new exhibitions',
            'Manage stall applications',
            'Track payments and revenue',
            'Communicate with brands',
            'View analytics and reports'
          ],
          buttonText: 'Create Exhibition',
          buttonLink: 'https://exhibae-connect.com/dashboard/organiser/exhibitions/new'
        };
      case 'manager':
        return {
          title: 'Welcome to Exhibae Connect for Managers',
          description: 'As a manager, you can now oversee all exhibitions, manage users, and handle system-wide operations.',
          features: [
            'Review exhibition applications',
            'Manage user accounts',
            'Monitor system activity',
            'Generate reports',
            'Handle support requests'
          ],
          buttonText: 'View Dashboard',
          buttonLink: 'https://exhibae-connect.com/dashboard/manager'
        };
      default:
        return {
          title: 'Welcome to Exhibae Connect',
          description: 'We\'re excited to have you on board!',
          features: [
            'Explore exhibitions',
            'Connect with brands and organisers',
            'Stay updated with notifications',
            'Access your dashboard',
            'Get support when needed'
          ],
          buttonText: 'Get Started',
          buttonLink: 'https://exhibae-connect.com/dashboard'
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <BaseTemplate previewText={previewText}>
      <Section style={section}>
        <Heading style={heading}>{content.title}</Heading>
        
        <Text style={text}>
          Hello {userName},
        </Text>
        
        <Text style={text}>
          {content.description}
        </Text>

        <Text style={text}>
          Here's what you can do with your account:
        </Text>

        <ul style={list}>
          {content.features.map((feature, index) => (
            <li key={index} style={listItem}>{feature}</li>
          ))}
        </ul>

        <Section style={buttonContainer}>
          <Button
            style={{
              ...button,
              padding: '12px 20px',
            }}
            href={content.buttonLink}
          >
            {content.buttonText}
          </Button>
        </Section>

        <Text style={text}>
          If you have any questions or need assistance, our support team is here to help.
          You can reach us at support@exhibae-connect.com or through the help center in your dashboard.
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

export default WelcomeEmailTemplate; 