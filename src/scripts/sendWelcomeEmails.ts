import { supabase } from '@/integrations/supabase/client';
import { emailService } from '../services/email';

/**
 * Script to test sending welcome emails to all users
 */
async function sendWelcomeEmailsToAllUsers() {
  try {
    console.log('Starting to send welcome emails to all users...');
    
    // Fetch all users from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, role');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users to send welcome emails to.`);
    
    // Send welcome emails to each user
    let successCount = 0;
    let failureCount = 0;
    
    for (const user of users) {
      try {
        const name = user.full_name || user.company_name || 'User';
        const role = user.role || 'user';
        
        // Map role to expected format for the email template
        let mappedRole = 'shopper';
        if (role.includes('organiser') || role.includes('organizer')) {
          mappedRole = 'organiser';
        } else if (role.includes('brand')) {
          mappedRole = 'brand';
        }
        
        // Send welcome email
        const result = await emailService.sendWelcomeEmail({
          to: user.email,
          name: name,
          role: mappedRole as any,
          dashboardLink: `${import.meta.env.VITE_APP_URL || 'https://exhibae.com'}/dashboard`
        });
        
        if (result.success) {
          console.log(`✅ Successfully sent welcome email to: ${user.email}`);
          successCount++;
        } else {
          console.error(`❌ Failed to send welcome email to: ${user.email}`, result.error);
          failureCount++;
        }
        
        // Add a small delay to prevent overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        failureCount++;
      }
    }
    
    console.log('\n--- Email Sending Summary ---');
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully sent: ${successCount}`);
    console.log(`Failed to send: ${failureCount}`);
    console.log('----------------------------');
    
  } catch (error) {
    console.error('Error in sendWelcomeEmailsToAllUsers:', error);
  }
}

// Execute the function
sendWelcomeEmailsToAllUsers();

// Export for potential use in other modules
export { sendWelcomeEmailsToAllUsers }; 