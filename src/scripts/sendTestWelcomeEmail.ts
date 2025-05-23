import { emailService } from '../services/email';

/**
 * Script to send a test welcome email to a specified address
 */
async function sendTestWelcomeEmail(email: string = 'test@example.com') {
  try {
    console.log(`Sending test welcome email to ${email}...`);
    
    // Send welcome email
    const result = await emailService.sendWelcomeEmail({
      to: email,
      name: 'Test User',
      role: 'shopper',
      dashboardLink: 'https://exhibae.com/dashboard'
    });
    
    if (result.success) {
      console.log(`✅ Successfully sent welcome email to: ${email}`);
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error(`❌ Failed to send welcome email to: ${email}`);
      console.error(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('Error sending test welcome email:', error);
  }
}

// Get the email address from command line arguments
const args = process.argv.slice(2);
const testEmail = args[0] || 'test@example.com';

// Execute the function
sendTestWelcomeEmail(testEmail);

// Export for potential use in other modules
export { sendTestWelcomeEmail }; 