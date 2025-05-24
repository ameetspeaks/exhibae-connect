import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BaseTemplateProps {
  previewText: string;
  children: React.ReactNode;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  previewText,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <img
              src="https://exhibae-connect.com/logo.png"
              alt="Exhibae Connect"
              style={logo}
            />
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Exhibae Connect. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is an automated message, please do not reply directly to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  width: '200px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '48px',
};

const footerText = {
  margin: '0',
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

export default BaseTemplate; 