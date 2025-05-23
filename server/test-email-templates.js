/**
 * Test script for email templates
 * This script tests sending emails with different templates
 */

// Load environment variables
require('dotenv').config();

// Import email service
const emailService = require('./src/services/emailService');

// Test data
const testData = {
  welcome: {
    to: 'test@example.com',
    name: 'John Doe',
    dashboardLink: 'https://exhibae.com/dashboard',
    unsubscribeLink: 'https://exhibae.com/unsubscribe'
  },
  application_status_update: {
    to: 'test@example.com',
    name: 'Jane Smith',
    status: 'approved',
    message: 'Congratulations! Your application has been approved. You can now access all features of ExhiBae.',
    dashboardLink: 'https://exhibae.com/dashboard',
    unsubscribeLink: 'https://exhibae.com/unsubscribe'
  },
  password_reset: {
    to: 'test@example.com',
    name: 'Alex Johnson',
    resetLink: 'https://exhibae.com/reset-password?token=abc123'
  }
};

/**
 * Test sending a specific template
 * @param {string} templateId - Template ID to test
 * @returns {Promise<object>} - Test result
 */
async function testTemplate(templateId) {
  console.log(`\n=== Testing template: ${templateId} ===`);
  
  if (!testData[templateId]) {
    console.error(`No test data found for template: ${templateId}`);
    return { success: false, error: 'No test data found' };
  }
  
  try {
    // Get recipient from command line or use default
    const recipient = process.argv[3] || testData[templateId].to;
    
    // Update test data with the recipient
    const data = { ...testData[templateId], to: recipient };
    
    console.log(`Sending ${templateId} template to: ${recipient}`);
    console.log('Template data:', JSON.stringify(data, null, 2));
    
    // Send email using template
    const result = await emailService.sendTemplateEmail({
      to: recipient,
      templateId,
      data,
      queueOnFailure: false
    });
    
    if (result.success) {
      console.log(`✅ Template ${templateId} sent successfully to ${recipient}`);
      console.log(`Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`❌ Failed to send template ${templateId}: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error testing template ${templateId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Test all templates
 * @returns {Promise<object>} - Test results
 */
async function testAllTemplates() {
  console.log('=== Testing all email templates ===');
  
  const results = {};
  
  // Get recipient from command line or use default
  const recipient = process.argv[2] || 'test@example.com';
  console.log(`Sending all templates to: ${recipient}`);
  
  // Test each template
  for (const templateId of Object.keys(testData)) {
    // Update test data with the recipient
    const data = { ...testData[templateId], to: recipient };
    
    console.log(`\nTesting template: ${templateId}`);
    
    try {
      const result = await emailService.sendTemplateEmail({
        to: recipient,
        templateId,
        data,
        queueOnFailure: false
      });
      
      results[templateId] = result;
      
      if (result.success) {
        console.log(`✅ Template ${templateId} sent successfully`);
      } else {
        console.error(`❌ Failed to send template ${templateId}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error testing template ${templateId}:`, error);
      results[templateId] = { success: false, error: error.message };
    }
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Display available templates
 */
async function listTemplates() {
  console.log('=== Available Email Templates ===');
  
  try {
    const templates = await emailService.getTemplates();
    
    if (templates.length === 0) {
      console.log('No templates found');
      return;
    }
    
    console.log(`Found ${templates.length} templates:`);
    
    templates.forEach(template => {
      const source = template.is_default ? '[Default]' : '[Database]';
      console.log(`- ${template.template_id}: ${template.name} ${source}`);
    });
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Verify SMTP connection
    console.log('Verifying SMTP connection...');
    const connected = await emailService.verifyConnection();
    
    if (!connected) {
      console.error('Failed to connect to SMTP server. Check your configuration.');
      process.exit(1);
    }
    
    console.log('✅ SMTP connection verified');
    
    // Parse command line arguments
    const command = process.argv[2];
    
    if (command === 'list') {
      // List templates
      await listTemplates();
    } else if (command === 'all') {
      // Test all templates
      await testAllTemplates();
    } else if (Object.keys(testData).includes(command)) {
      // Test specific template
      await testTemplate(command);
    } else {
      // Show usage
      console.log('Usage:');
      console.log('  node test-email-templates.js list                   - List available templates');
      console.log('  node test-email-templates.js all [recipient]        - Test all templates');
      console.log('  node test-email-templates.js [template] [recipient] - Test specific template');
      console.log('\nAvailable templates:');
      Object.keys(testData).forEach(templateId => {
        console.log(`  - ${templateId}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nDone');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 