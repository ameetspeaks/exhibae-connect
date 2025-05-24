import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import tls from 'tls';

// Load environment variables
dotenv.config();

async function testEmailConfig() {
  // Create transporter with SMTP configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: 'mehak@sportsvani.in',
      pass: 'Ameet@121!',
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    },
    debug: true
  });

  try {
    console.log('Testing connection with following settings:');
    console.log('Host: smtp.hostinger.com');
    console.log('Port: 465');
    console.log('User: mehak@sportsvani.in');
    
    // Verify SMTP connection configuration
    await transporter.verify();
    console.log('SMTP connection successful!');

    // Send test email
    const info = await transporter.sendMail({
      from: '"Exhibae Connect" <mehak@sportsvani.in>',
      to: 'mehak@sportsvani.in',
      subject: 'Test Email Configuration',
      text: 'If you receive this email, it means your SMTP configuration is working correctly!',
      html: '<h1>Email Configuration Test</h1><p>If you receive this email, it means your SMTP configuration is working correctly!</p>',
    });

    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw error;
  }
}

export { testEmailConfig }; 