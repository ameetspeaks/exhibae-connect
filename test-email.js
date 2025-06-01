import nodemailer from 'nodemailer';

// Email configuration
const config = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: 'info@exhibae.com',
    pass: 'Test@121!',
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
};

console.log('Starting email test...');
console.log('Email configuration:', {
  host: config.host,
  port: config.port,
  user: config.auth.user,
  secure: config.secure
});

async function testEmail() {
  try {
    console.log('\nCreating SMTP transporter...');
    const transporter = nodemailer.createTransport(config);

    console.log('\nTesting SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection successful!');

    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: `"Exhibae" <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'Test Email',
      text: 'If you receive this email, it means your SMTP configuration is working correctly!',
      html: `
        <h1>Email Test</h1>
        <p>If you receive this email, it means your SMTP configuration is working correctly!</p>
        <p>Configuration used:</p>
        <ul>
          <li>Host: ${config.host}</li>
          <li>Port: ${config.port}</li>
          <li>User: ${config.auth.user}</li>
          <li>Secure: ${config.secure}</li>
        </ul>
      `
    });

    console.log('✓ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    process.exit(1);
  }
}

console.log('\nStarting email test process...');
testEmail()
  .then(() => {
    console.log('\n✓ Email test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Email test failed:', error);
    process.exit(1);
  }); 